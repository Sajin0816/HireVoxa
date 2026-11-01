import mongoose from 'mongoose';
import { PLACEMENT_FEE_STATUSES, PRICING_CONFIG } from '../config/pricing.js';

const placementFeeSchema = new mongoose.Schema(
  {
    placementId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    companyId: {
      type: String,
      required: true,
      index: true
    },
    candidateUserId: {
      type: String,
      required: true,
      index: true
    },
    candidateId: {
      type: String,
      required: true,
      index: true
    },
    jobId: {
      type: String,
      required: true,
      index: true
    },
    applicationId: {
      type: String,
      required: true,
      unique: true, // Prevents duplicate placement fees for the same application
      index: true
    },
    candidateName: { type: String, trim: true, default: '' },
    jobTitle: { type: String, trim: true, default: '' },
    companyName: { type: String, trim: true, default: '' },
    feeAmountCents: {
      type: Number,
      required: true,
      default: PRICING_CONFIG.SUCCESSFUL_PLACEMENT.feeCents
    },
    currency: {
      type: String,
      required: true,
      default: 'USD'
    },
    status: {
      type: String,
      enum: PLACEMENT_FEE_STATUSES,
      default: 'eligible',
      index: true
    },
    hiredAt: {
      type: Date,
      default: Date.now
    },
    replacementGuaranteeExpiry: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    },
    invoiceId: {
      type: String,
      default: null,
      index: true
    },
    invoicedAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    paymentReference: { type: String, default: null },
    waivedReason: { type: String, default: null },
    waivedBy: { type: String, default: null },
    waivedAt: { type: Date, default: null },
    disputeReason: { type: String, default: null },
    disputeOpenedAt: { type: Date, default: null },
    disputeResolvedAt: { type: Date, default: null },
    termsVersion: {
      type: String,
      default: PRICING_CONFIG.SUCCESSFUL_PLACEMENT.termsVersion
    },
    auditTrail: [
      {
        action: { type: String, required: true },
        fromStatus: { type: String },
        toStatus: { type: String, required: true },
        changedBy: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
        reason: { type: String, default: '' },
        metadata: { type: mongoose.Schema.Types.Mixed }
      }
    ]
  },
  { timestamps: true }
);

placementFeeSchema.index({ companyId: 1, status: 1 });

export const PlacementFee = mongoose.models.PlacementFee || mongoose.model('PlacementFee', placementFeeSchema);
