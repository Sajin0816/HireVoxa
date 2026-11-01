import { getDbMode } from '../config/db.js';
import { PRICING_CONFIG } from '../config/pricing.js';
import { PlacementFee } from '../models/PlacementFee.js';
import { Invoice } from '../models/Invoice.js';
import { inMemoryStore } from './inMemoryStore.js';
import { createNotificationEvent } from '../controllers/notificationController.js';
import { randomUUID } from 'crypto';

/**
 * Triggered when an application status transitions to 'Hired'.
 * Automatically registers an eligible placement fee if one does not already exist (Idempotent).
 */
export async function triggerHiringPlacementFee({
  application,
  actorUserId,
  actorRole = 'company'
}) {
  const mode = getDbMode();
  const applicationId = String(application._id);
  const companyId = application.companyId;

  // 1. Idempotency Check: Prevent duplicate placement fees for the same application
  let existingFee = null;
  if (mode === 'in-memory-demo') {
    existingFee = await inMemoryStore.findPlacementFeeByApplicationId(applicationId);
  } else {
    existingFee = await PlacementFee.findOne({ applicationId });
  }

  if (existingFee) {
    console.log(`[PlacementBilling] Fee record already exists for application ${applicationId}: ${existingFee.placementId}`);
    return existingFee;
  }

  // 2. Fetch company and candidate metadata for snapshot
  let candidateName = '';
  let companyName = '';
  let jobTitle = application.jobSnapshot?.title || '';

  if (mode === 'in-memory-demo') {
    const cand = inMemoryStore.candidates.find(c => c._id === application.candidateId);
    if (cand) candidateName = cand.name;
    const comp = inMemoryStore.companies.find(c => c._id === companyId || c.userId === companyId);
    if (comp) companyName = comp.name;
    if (!jobTitle) {
      const job = inMemoryStore.jobs.find(j => j._id === application.jobId);
      if (job) jobTitle = job.title;
    }
  } else {
    // In MongoDB mode, fetch populated or query
    const { Candidate } = await import('../models/Candidate.js');
    const { Company } = await import('../models/Company.js');
    const { Job } = await import('../models/Job.js');

    const [cand, comp, job] = await Promise.all([
      Candidate.findById(application.candidateId).lean(),
      Company.findOne({ $or: [{ _id: companyId }, { ownerId: companyId }, { tenantKey: companyId }] }).lean(),
      Job.findById(application.jobId).lean()
    ]);
    if (cand) candidateName = cand.name;
    if (comp) companyName = comp.name;
    if (job) jobTitle = job.title;
  }

  const placementId = `PLF-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const hiredAt = new Date();
  const guaranteeExpiry = new Date(hiredAt.getTime() + PRICING_CONFIG.SUCCESSFUL_PLACEMENT.guaranteePeriodDays * 24 * 60 * 60 * 1000);

  const feeData = {
    placementId,
    companyId,
    candidateUserId: application.candidateUserId,
    candidateId: application.candidateId,
    jobId: application.jobId,
    applicationId,
    candidateName,
    jobTitle,
    companyName,
    feeAmountCents: PRICING_CONFIG.SUCCESSFUL_PLACEMENT.feeCents, // 250,000 cents ($2,500.00)
    currency: PRICING_CONFIG.SUCCESSFUL_PLACEMENT.currency,
    status: 'eligible',
    hiredAt,
    replacementGuaranteeExpiry: guaranteeExpiry,
    termsVersion: PRICING_CONFIG.SUCCESSFUL_PLACEMENT.termsVersion,
    auditTrail: [
      {
        action: 'PLACEMENT_HIRED',
        fromStatus: 'not_eligible',
        toStatus: 'eligible',
        changedBy: actorUserId,
        changedAt: new Date(),
        reason: `Candidate ${candidateName || ''} marked as Hired by ${actorRole}`
      }
    ]
  };

  let createdFee;
  if (mode === 'in-memory-demo') {
    createdFee = await inMemoryStore.createPlacementFee(feeData);
  } else {
    createdFee = await PlacementFee.create(feeData);
  }

  // 3. Notify company of placement milestone
  try {
    createNotificationEvent({
      recipientUserId: companyId,
      recipientRole: 'company',
      companyId,
      type: 'PLACEMENT_ELIGIBLE',
      title: 'Successful Placement Recorded',
      message: `Congratulations on hiring ${candidateName || 'a candidate'} for "${jobTitle}"! Placement ID ${placementId} has been logged under your 90-day guarantee.`,
      referenceId: createdFee._id,
      referenceType: 'placement'
    });
  } catch (err) {
    console.warn('[PlacementBilling] Notification dispatch notice:', err.message);
  }

  console.log(`[PlacementBilling] Successfully logged qualifying placement fee ${placementId} ($2,500 USD) for company ${companyId}`);
  return createdFee;
}

/**
 * Generate an invoice for an eligible placement fee
 */
export async function generatePlacementInvoice({ placementFeeId, adminUserId, notes = '' }) {
  const mode = getDbMode();

  let fee;
  if (mode === 'in-memory-demo') {
    fee = await inMemoryStore.findPlacementFeeById(placementFeeId);
  } else {
    fee = await PlacementFee.findById(placementFeeId);
  }

  if (!fee) {
    throw new Error('Placement fee record not found.');
  }

  if (fee.status !== 'eligible') {
    throw new Error(`Cannot invoice placement fee with status '${fee.status}'. Must be 'eligible'.`);
  }

  const invoiceNumber = `INV-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const invoiceData = {
    invoiceNumber,
    companyId: fee.companyId,
    companyName: fee.companyName,
    type: 'placement_fee',
    referenceId: fee._id ? String(fee._id) : fee.placementId,
    amountCents: fee.feeAmountCents,
    currency: fee.currency,
    status: 'open',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Net 14
    lineItems: [
      {
        description: `Qualifying Placement Fee: ${fee.candidateName || 'Candidate'} (${fee.jobTitle || 'Role'})`,
        quantity: 1,
        unitAmountCents: fee.feeAmountCents,
        totalAmountCents: fee.feeAmountCents
      }
    ],
    notes: notes || `Placement Reference: ${fee.placementId}. Backed by ${PRICING_CONFIG.SUCCESSFUL_PLACEMENT.guaranteePeriodDays}-day replacement guarantee.`
  };

  let invoice;
  if (mode === 'in-memory-demo') {
    invoice = await inMemoryStore.createInvoice(invoiceData);
    await inMemoryStore.updatePlacementFee(fee._id, {
      status: 'invoiced',
      invoiceId: invoice.invoiceNumber,
      invoicedAt: new Date(),
      auditTrail: [
        ...(fee.auditTrail || []),
        {
          action: 'INVOICE_GENERATED',
          fromStatus: 'eligible',
          toStatus: 'invoiced',
          changedBy: adminUserId,
          changedAt: new Date(),
          reason: `Invoice ${invoiceNumber} issued.`
        }
      ]
    });
  } else {
    invoice = await Invoice.create(invoiceData);
    fee.status = 'invoiced';
    fee.invoiceId = invoice.invoiceNumber;
    fee.invoicedAt = new Date();
    fee.auditTrail.push({
      action: 'INVOICE_GENERATED',
      fromStatus: 'eligible',
      toStatus: 'invoiced',
      changedBy: adminUserId,
      changedAt: new Date(),
      reason: `Invoice ${invoiceNumber} issued.`
    });
    await fee.save();
  }

  return { invoice, placementFee: fee };
}

/**
 * Record payment for a placement fee (authoritative payment confirmation)
 */
export async function recordPlacementPayment({
  placementFeeId,
  actorUserId,
  paymentReference,
  paymentMethod = 'test_provider'
}) {
  const mode = getDbMode();

  let fee;
  if (mode === 'in-memory-demo') {
    fee = await inMemoryStore.findPlacementFeeById(placementFeeId);
  } else {
    fee = await PlacementFee.findById(placementFeeId);
  }

  if (!fee) {
    throw new Error('Placement fee record not found.');
  }

  if (fee.status === 'paid') {
    throw new Error('Placement fee has already been paid.');
  }

  const paidAt = new Date();
  const paymentRef = paymentReference || `PAY-${randomUUID().slice(0, 10).toUpperCase()}`;

  if (mode === 'in-memory-demo') {
    await inMemoryStore.updatePlacementFee(fee._id, {
      status: 'paid',
      paidAt,
      paymentReference: paymentRef,
      auditTrail: [
        ...(fee.auditTrail || []),
        {
          action: 'PAYMENT_RECORDED',
          fromStatus: fee.status,
          toStatus: 'paid',
          changedBy: actorUserId,
          changedAt: paidAt,
          reason: `Payment verified via ${paymentMethod} (${paymentRef})`
        }
      ]
    });
    // Update invoice if one exists
    if (fee.invoiceId) {
      const inv = await inMemoryStore.findInvoiceById(fee.invoiceId);
      if (inv) {
        await inMemoryStore.updateInvoice(inv._id, {
          status: 'paid',
          paidAt,
          paymentMethod,
          paymentReference: paymentRef
        });
      }
    }
  } else {
    fee.status = 'paid';
    fee.paidAt = paidAt;
    fee.paymentReference = paymentRef;
    fee.auditTrail.push({
      action: 'PAYMENT_RECORDED',
      fromStatus: fee.status,
      toStatus: 'paid',
      changedBy: actorUserId,
      changedAt: paidAt,
      reason: `Payment verified via ${paymentMethod} (${paymentRef})`
    });
    await fee.save();

    if (fee.invoiceId) {
      await Invoice.findOneAndUpdate(
        { invoiceNumber: fee.invoiceId },
        { status: 'paid', paidAt, paymentMethod, paymentReference: paymentRef }
      );
    }
  }

  return { success: true, placementId: fee.placementId, paymentReference: paymentRef };
}
