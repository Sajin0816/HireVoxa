import { getDbMode } from '../config/db.js';
import { PRICING_CONFIG, formatCentsToUSD } from '../config/pricing.js';
import { PlacementFee } from '../models/PlacementFee.js';
import { Subscription } from '../models/Subscription.js';
import { Invoice } from '../models/Invoice.js';
import { Company } from '../models/Company.js';
import { Job } from '../models/Job.js';
import { inMemoryStore } from '../services/inMemoryStore.js';
import {
  generatePlacementInvoice,
  recordPlacementPayment
} from '../services/placementBillingService.js';
import { randomUUID, createHmac } from 'crypto';

// Secret key for test/simulated webhook signature verification
const WEBHOOK_SECRET = process.env.BILLING_WEBHOOK_SECRET || 'hvx_webhook_test_sec_9942a';

// In-memory set for webhook event idempotency (in MongoDB, can also be checked)
const processedWebhookEvents = new Set();

/**
 * Public pricing configuration endpoint
 * GET /api/pricing
 */
export async function getPricingConfig(req, res) {
  res.json({
    success: true,
    data: PRICING_CONFIG
  });
}

/**
 * Recruiter Company Billing & Plan Overview
 * GET /api/billing/company
 */
export async function getCompanyBilling(req, res, next) {
  try {
    const companyId = req.user.companyId || req.user.id;
    const mode = getDbMode();

    let company = null;
    let subscription = null;
    let placementFees = [];
    let invoices = [];
    let activeJobsCount = 0;

    if (mode === 'in-memory-demo') {
      company = inMemoryStore.companies.find(c => c._id === companyId || c.userId === companyId) || {
        _id: companyId,
        name: req.user.companyName || 'My Organization',
        plan: 'starter'
      };
      subscription = inMemoryStore.subscriptions.find(s => s.companyId === companyId) || null;
      placementFees = inMemoryStore.placementFees.filter(p => p.companyId === companyId);
      invoices = inMemoryStore.invoices.filter(i => i.companyId === companyId);
      activeJobsCount = inMemoryStore.jobs.filter(j => j.companyId === companyId && j.status === 'Open').length;
    } else {
      company = await Company.findOne({ $or: [{ _id: companyId }, { ownerId: companyId }, { tenantKey: companyId }] }).lean();
      if (!company) {
        company = { _id: companyId, name: req.user.companyName || 'My Organization', plan: 'starter' };
      }
      subscription = await Subscription.findOne({ companyId }).sort({ createdAt: -1 }).lean();
      placementFees = await PlacementFee.find({ companyId }).sort({ createdAt: -1 }).lean();
      invoices = await Invoice.find({ companyId }).sort({ createdAt: -1 }).lean();
      activeJobsCount = await Job.countDocuments({ companyId, status: 'Open' });
    }

    const currentPlan = company?.plan || subscription?.plan || 'starter';
    const planLimits = currentPlan === 'pro'
      ? PRICING_CONFIG.EMPLOYER_PRO.limits
      : PRICING_CONFIG.EMPLOYER_STARTER.limits;

    res.json({
      success: true,
      data: {
        company: {
          id: companyId,
          name: company?.name || req.user.companyName,
          plan: currentPlan,
          billingEmail: company?.billingEmail || req.user.email
        },
        subscription: subscription ? {
          id: subscription._id,
          plan: subscription.plan,
          status: subscription.status,
          amountCents: subscription.amountCents,
          amountFormatted: formatCentsToUSD(subscription.amountCents),
          billingInterval: subscription.billingInterval,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
          paymentMethodSummary: subscription.paymentMethodSummary || null
        } : {
          plan: 'starter',
          status: 'active',
          amountCents: 0,
          amountFormatted: '$0.00',
          billingInterval: null,
          isPilot: true
        },
        usage: {
          activeJobs: activeJobsCount,
          maxActiveJobs: planLimits.maxActiveJobs,
          searchTier: planLimits.candidateSearchTier,
          savedTalentLimit: planLimits.savedTalentLimit,
          teamMembersLimit: planLimits.teamMembersLimit,
          canExportCSV: planLimits.csvExport || false
        },
        placementFees: placementFees.map(p => ({
          id: p._id,
          placementId: p.placementId,
          candidateName: p.candidateName,
          jobTitle: p.jobTitle,
          feeAmountCents: p.feeAmountCents,
          feeFormatted: formatCentsToUSD(p.feeAmountCents),
          currency: p.currency,
          status: p.status,
          hiredAt: p.hiredAt,
          replacementGuaranteeExpiry: p.replacementGuaranteeExpiry,
          invoiceId: p.invoiceId,
          paidAt: p.paidAt,
          paymentReference: p.paymentReference
        })),
        invoices: invoices.map(i => ({
          id: i._id,
          invoiceNumber: i.invoiceNumber,
          type: i.type,
          amountCents: i.amountCents,
          amountFormatted: formatCentsToUSD(i.amountCents),
          currency: i.currency,
          status: i.status,
          dueDate: i.dueDate,
          paidAt: i.paidAt,
          lineItems: i.lineItems
        }))
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Subscribe to Employer Pro ($199/month)
 * POST /api/billing/subscribe
 */
export async function createSubscription(req, res, next) {
  try {
    const companyId = req.user.companyId || req.user.id;
    const { plan = 'pro', paymentMethod = {} } = req.body;
    const mode = getDbMode();

    if (plan !== 'pro') {
      return res.status(400).json({ success: false, error: 'Only Employer Pro ($199/month) is available for upgrade.' });
    }

    const priceCents = PRICING_CONFIG.EMPLOYER_PRO.priceCents; // 19,900 cents ($199.00)
    const providerSubId = `sub_${randomUUID().slice(0, 14)}`;
    const providerCustId = `cus_${randomUUID().slice(0, 14)}`;

    const paymentMethodSummary = {
      brand: paymentMethod.brand || 'Visa',
      last4: paymentMethod.last4 ? String(paymentMethod.last4).slice(-4) : '4242',
      expMonth: Number(paymentMethod.expMonth) || 12,
      expYear: Number(paymentMethod.expYear) || (new Date().getFullYear() + 3)
    };

    const subData = {
      companyId,
      plan: 'pro',
      status: 'active',
      amountCents: priceCents,
      currency: 'USD',
      billingInterval: 'month',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      providerCustomerId: providerCustId,
      providerSubscriptionId: providerSubId,
      paymentMethodSummary,
      auditTrail: [
        {
          action: 'SUBSCRIBED_PRO',
          fromStatus: 'starter',
          toStatus: 'active',
          changedBy: req.user.id,
          changedAt: new Date(),
          notes: 'Upgraded to Employer Pro ($199/month)'
        }
      ]
    };

    let subscription;
    if (mode === 'in-memory-demo') {
      const existing = inMemoryStore.subscriptions.find(s => s.companyId === companyId);
      if (existing) {
        subscription = await inMemoryStore.updateSubscription(existing._id, subData);
      } else {
        subscription = await inMemoryStore.createSubscription(subData);
      }
      await inMemoryStore.updateCompanyPlan(companyId, 'pro', subscription._id);

      // Create initial subscription invoice
      const invoiceNumber = `INV-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
      await inMemoryStore.createInvoice({
        invoiceNumber,
        companyId,
        companyName: req.user.companyName || 'Company',
        type: 'subscription',
        referenceId: subscription._id,
        amountCents: priceCents,
        currency: 'USD',
        status: 'paid',
        dueDate: new Date(),
        paidAt: new Date(),
        paymentMethod: `${paymentMethodSummary.brand} *${paymentMethodSummary.last4}`,
        paymentReference: `CHG-${randomUUID().slice(0, 10).toUpperCase()}`,
        lineItems: [
          {
            description: 'Employer Pro Monthly Subscription (1 Month)',
            quantity: 1,
            unitAmountCents: priceCents,
            totalAmountCents: priceCents
          }
        ]
      });
    } else {
      subscription = await Subscription.findOneAndUpdate(
        { companyId },
        { $set: subData },
        { upsert: true, new: true }
      );

      await Company.findOneAndUpdate(
        { $or: [{ _id: companyId }, { ownerId: companyId }, { tenantKey: companyId }] },
        { $set: { plan: 'pro', subscriptionId: String(subscription._id) } }
      );

      const invoiceNumber = `INV-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
      await Invoice.create({
        invoiceNumber,
        companyId,
        companyName: req.user.companyName || 'Company',
        type: 'subscription',
        referenceId: String(subscription._id),
        amountCents: priceCents,
        currency: 'USD',
        status: 'paid',
        dueDate: new Date(),
        paidAt: new Date(),
        paymentMethod: `${paymentMethodSummary.brand} *${paymentMethodSummary.last4}`,
        paymentReference: `CHG-${randomUUID().slice(0, 10).toUpperCase()}`,
        lineItems: [
          {
            description: 'Employer Pro Monthly Subscription (1 Month)',
            quantity: 1,
            unitAmountCents: priceCents,
            totalAmountCents: priceCents
          }
        ]
      });
    }

    res.json({
      success: true,
      message: 'Successfully upgraded to Employer Pro subscription ($199/month).',
      data: {
        plan: 'pro',
        amountFormatted: formatCentsToUSD(priceCents),
        billingInterval: 'month',
        status: 'active',
        subscriptionId: subscription._id
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel Employer Pro subscription (sets cancelAtPeriodEnd)
 * POST /api/billing/cancel
 */
export async function cancelSubscription(req, res, next) {
  try {
    const companyId = req.user.companyId || req.user.id;
    const mode = getDbMode();

    if (mode === 'in-memory-demo') {
      const sub = inMemoryStore.subscriptions.find(s => s.companyId === companyId);
      if (!sub || sub.plan !== 'pro') {
        return res.status(404).json({ success: false, error: 'No active Employer Pro subscription found to cancel.' });
      }
      await inMemoryStore.updateSubscription(sub._id, {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
        auditTrail: [
          ...(sub.auditTrail || []),
          {
            action: 'CANCELLATION_REQUESTED',
            changedBy: req.user.id,
            changedAt: new Date(),
            notes: 'Cancellation requested. Access remains until end of billing cycle.'
          }
        ]
      });
    } else {
      const sub = await Subscription.findOne({ companyId, plan: 'pro', status: 'active' });
      if (!sub) {
        return res.status(404).json({ success: false, error: 'No active Employer Pro subscription found to cancel.' });
      }
      sub.cancelAtPeriodEnd = true;
      sub.canceledAt = new Date();
      sub.auditTrail.push({
        action: 'CANCELLATION_REQUESTED',
        changedBy: req.user.id,
        changedAt: new Date(),
        notes: 'Cancellation requested. Access remains until end of billing cycle.'
      });
      await sub.save();
    }

    res.json({
      success: true,
      message: 'Your Employer Pro subscription has been scheduled for cancellation at the end of the current billing cycle.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Recruiter pays an eligible placement fee ($2,500)
 * POST /api/billing/placements/:id/pay
 */
export async function payPlacementFee(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId || req.user.id;
    const mode = getDbMode();

    // Verify tenant ownership
    let fee;
    if (mode === 'in-memory-demo') {
      fee = await inMemoryStore.findPlacementFeeById(id);
    } else {
      fee = await PlacementFee.findById(id);
    }

    if (!fee) {
      return res.status(404).json({ success: false, error: 'Placement fee record not found.' });
    }

    if (fee.companyId !== companyId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied: You cannot pay another company\'s placement fee.' });
    }

    const result = await recordPlacementPayment({
      placementFeeId: fee._id,
      actorUserId: req.user.id,
      paymentMethod: 'Test Card Payment (Test Provider)',
      paymentReference: `PAY-${randomUUID().slice(0, 10).toUpperCase()}`
    });

    res.json({
      success: true,
      message: `Placement fee for ${fee.placementId} successfully paid ($2,500 USD). 90-day replacement guarantee is active.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Webhook handler with signature validation and idempotency
 * POST /api/billing/webhook
 */
export async function handleWebhook(req, res) {
  const sig = req.headers['x-hirevoxa-signature'];
  const eventId = req.body?.id || req.headers['x-event-id'];

  // 1. Signature validation
  if (sig) {
    const expectedSig = createHmac('sha256', WEBHOOK_SECRET)
      .update(JSON.stringify(req.body || {}))
      .digest('hex');
    if (sig !== expectedSig && process.env.NODE_ENV === 'production') {
      return res.status(400).json({ error: 'Invalid webhook signature.' });
    }
  }

  // 2. Idempotency Check: Prevent duplicate webhook processing
  if (eventId) {
    if (processedWebhookEvents.has(eventId)) {
      console.log(`[BillingWebhook] Ignoring duplicate webhook event: ${eventId}`);
      return res.json({ received: true, status: 'already_processed' });
    }
    processedWebhookEvents.add(eventId);
  }

  const { type, data } = req.body;
  console.log(`[BillingWebhook] Received event: ${type}`);

  try {
    switch (type) {
      case 'checkout.session.completed':
      case 'invoice.payment_succeeded': {
        const companyId = data?.object?.client_reference_id || data?.object?.companyId;
        if (companyId) {
          const mode = getDbMode();
          if (mode === 'in-memory-demo') {
            await inMemoryStore.updateCompanyPlan(companyId, 'pro');
          } else {
            await Company.findOneAndUpdate(
              { $or: [{ _id: companyId }, { ownerId: companyId }, { tenantKey: companyId }] },
              { $set: { plan: 'pro' } }
            );
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const companyId = data?.object?.companyId;
        if (companyId) {
          const mode = getDbMode();
          if (mode === 'in-memory-demo') {
            await inMemoryStore.updateCompanyPlan(companyId, 'starter');
          } else {
            await Company.findOneAndUpdate(
              { $or: [{ _id: companyId }, { ownerId: companyId }, { tenantKey: companyId }] },
              { $set: { plan: 'starter' } }
            );
          }
        }
        break;
      }
      default:
        console.log(`[BillingWebhook] Unhandled event type: ${type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error(`[BillingWebhook] Error processing ${type}:`, err.message);
    res.status(500).json({ error: 'Webhook handler error' });
  }
}

/**
 * Admin: Get complete revenue & billing metrics
 * GET /api/admin/billing/metrics
 */
export async function getAdminBillingMetrics(req, res, next) {
  try {
    const mode = getDbMode();

    if (mode === 'in-memory-demo') {
      const summary = await inMemoryStore.getAdminSummary();
      const placementFees = inMemoryStore.placementFees;
      const subscriptions = inMemoryStore.subscriptions;
      const invoices = inMemoryStore.invoices;

      return res.json({
        success: true,
        data: {
          metrics: summary.monetization,
          recentPlacements: placementFees.slice(0, 10),
          recentSubscriptions: subscriptions.slice(0, 10),
          recentInvoices: invoices.slice(0, 10)
        }
      });
    }

    // MongoDB Mode Aggregations
    const [
      allPlacements,
      allSubscriptions,
      allInvoices
    ] = await Promise.all([
      PlacementFee.find().sort({ createdAt: -1 }).lean(),
      Subscription.find().sort({ createdAt: -1 }).lean(),
      Invoice.find().sort({ createdAt: -1 }).lean()
    ]);

    const eligiblePlacements = allPlacements.filter(p => p.status === 'eligible').length;
    const invoicedPlacements = allPlacements.filter(p => p.status === 'invoiced').length;
    const paidPlacements = allPlacements.filter(p => p.status === 'paid').length;
    const waivedPlacements = allPlacements.filter(p => p.status === 'waived').length;
    const disputedPlacements = allPlacements.filter(p => p.status === 'disputed').length;

    const invoicedRevenueCents = allInvoices
      .filter(i => i.status === 'open' || i.status === 'paid')
      .reduce((sum, i) => sum + (i.amountCents || 0), 0);

    const collectedRevenueCents = allInvoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + (i.amountCents || 0), 0);

    const activeProSubscriptions = allSubscriptions
      .filter(s => s.status === 'active' && s.plan === 'pro').length;

    const activeStarterPilots = allSubscriptions
      .filter(s => s.status === 'active' && s.plan === 'starter').length;

    const estimatedMrrCents = activeProSubscriptions * 19900;

    res.json({
      success: true,
      data: {
        metrics: {
          totalPlacements: allPlacements.length,
          eligiblePlacements,
          invoicedPlacements,
          paidPlacements,
          waivedPlacements,
          disputedPlacements,
          invoicedRevenueCents,
          collectedRevenueCents,
          outstandingBalanceCents: invoicedRevenueCents - collectedRevenueCents,
          activeProSubscriptions,
          activeStarterPilots,
          estimatedMrrCents
        },
        recentPlacements: allPlacements.slice(0, 10),
        recentSubscriptions: allSubscriptions.slice(0, 10),
        recentInvoices: allInvoices.slice(0, 10)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Generate an official invoice for an eligible placement fee
 * POST /api/admin/billing/invoices/generate
 */
export async function adminGenerateInvoice(req, res, next) {
  try {
    const { placementFeeId, notes } = req.body;
    if (!placementFeeId) {
      return res.status(400).json({ success: false, error: 'placementFeeId is required.' });
    }

    const result = await generatePlacementInvoice({
      placementFeeId,
      adminUserId: req.user.id,
      notes
    });

    res.json({
      success: true,
      message: `Invoice ${result.invoice.invoiceNumber} successfully created.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Waive a placement fee (with audit reason)
 * POST /api/admin/billing/placements/:id/waive
 */
export async function adminWaivePlacementFee(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const mode = getDbMode();

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ success: false, error: 'A valid reason (min 5 characters) is required to waive a placement fee.' });
    }

    let fee;
    if (mode === 'in-memory-demo') {
      fee = await inMemoryStore.findPlacementFeeById(id);
      if (!fee) return res.status(404).json({ success: false, error: 'Placement fee not found.' });

      await inMemoryStore.updatePlacementFee(fee._id, {
        status: 'waived',
        waivedReason: reason.trim(),
        waivedBy: req.user.id,
        waivedAt: new Date(),
        auditTrail: [
          ...(fee.auditTrail || []),
          {
            action: 'FEE_WAIVED',
            fromStatus: fee.status,
            toStatus: 'waived',
            changedBy: req.user.id,
            changedAt: new Date(),
            reason: reason.trim()
          }
        ]
      });
    } else {
      fee = await PlacementFee.findById(id);
      if (!fee) return res.status(404).json({ success: false, error: 'Placement fee not found.' });

      fee.status = 'waived';
      fee.waivedReason = reason.trim();
      fee.waivedBy = req.user.id;
      fee.waivedAt = new Date();
      fee.auditTrail.push({
        action: 'FEE_WAIVED',
        fromStatus: fee.status,
        toStatus: 'waived',
        changedBy: req.user.id,
        changedAt: new Date(),
        reason: reason.trim()
      });
      await fee.save();
    }

    res.json({
      success: true,
      message: `Placement fee ${fee.placementId} has been waived.`,
      data: { placementId: fee.placementId, status: 'waived', reason: reason.trim() }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Dispute a placement fee
 * POST /api/admin/billing/placements/:id/dispute
 */
export async function adminDisputePlacementFee(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const mode = getDbMode();

    if (!reason) {
      return res.status(400).json({ success: false, error: 'Reason is required for placing a fee in dispute.' });
    }

    let fee;
    if (mode === 'in-memory-demo') {
      fee = await inMemoryStore.findPlacementFeeById(id);
      if (!fee) return res.status(404).json({ success: false, error: 'Placement fee not found.' });

      await inMemoryStore.updatePlacementFee(fee._id, {
        status: 'disputed',
        disputeReason: reason.trim(),
        disputeOpenedAt: new Date(),
        auditTrail: [
          ...(fee.auditTrail || []),
          {
            action: 'FEE_DISPUTED',
            fromStatus: fee.status,
            toStatus: 'disputed',
            changedBy: req.user.id,
            changedAt: new Date(),
            reason: reason.trim()
          }
        ]
      });
    } else {
      fee = await PlacementFee.findById(id);
      if (!fee) return res.status(404).json({ success: false, error: 'Placement fee not found.' });

      fee.status = 'disputed';
      fee.disputeReason = reason.trim();
      fee.disputeOpenedAt = new Date();
      fee.auditTrail.push({
        action: 'FEE_DISPUTED',
        fromStatus: fee.status,
        toStatus: 'disputed',
        changedBy: req.user.id,
        changedAt: new Date(),
        reason: reason.trim()
      });
      await fee.save();
    }

    res.json({
      success: true,
      message: `Placement fee ${fee.placementId} marked as disputed under replacement guarantee evaluation.`,
      data: { placementId: fee.placementId, status: 'disputed' }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Export billing records as CSV
 * GET /api/admin/billing/export
 */
export async function adminExportBillingCSV(req, res, next) {
  try {
    const mode = getDbMode();
    let fees = [];

    if (mode === 'in-memory-demo') {
      fees = inMemoryStore.placementFees;
    } else {
      fees = await PlacementFee.find().sort({ createdAt: -1 }).lean();
    }

    const headers = ['Placement ID', 'Company', 'Candidate', 'Role', 'Fee USD', 'Status', 'Hired Date', 'Guarantee Expiry', 'Invoice ID', 'Paid Date'];
    const rows = fees.map(f => [
      `"${f.placementId}"`,
      `"${(f.companyName || f.companyId || '').replace(/"/g, '""')}"`,
      `"${(f.candidateName || '').replace(/"/g, '""')}"`,
      `"${(f.jobTitle || '').replace(/"/g, '""')}"`,
      (f.feeAmountCents / 100).toFixed(2),
      f.status,
      f.hiredAt ? new Date(f.hiredAt).toISOString().split('T')[0] : '',
      f.replacementGuaranteeExpiry ? new Date(f.replacementGuaranteeExpiry).toISOString().split('T')[0] : '',
      f.invoiceId || '',
      f.paidAt ? new Date(f.paidAt).toISOString().split('T')[0] : ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="hirevoxa-billing-placements-${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}
