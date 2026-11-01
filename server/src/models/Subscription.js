import mongoose from 'mongoose';
import { SUBSCRIPTION_STATUSES, PRICING_CONFIG } from '../config/pricing.js';

const subscriptionSchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      required: true,
      index: true
    },
    plan: {
      type: String,
      enum: ['starter', 'pro'],
      default: 'starter',
      index: true
    },
    status: {
      type: String,
      enum: SUBSCRIPTION_STATUSES,
      default: 'active',
      index: true
    },
    amountCents: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    billingInterval: {
      type: String,
      enum: ['month', 'year', null],
      default: 'month'
    },
    currentPeriodStart: {
      type: Date,
      default: Date.now
    },
    currentPeriodEnd: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    },
    canceledAt: {
      type: Date,
      default: null
    },
    providerCustomerId: {
      type: String,
      default: null,
      index: true
    },
    providerSubscriptionId: {
      type: String,
      default: null,
      index: true
    },
    paymentMethodSummary: {
      brand: { type: String, default: null },
      last4: { type: String, default: null },
      expMonth: { type: Number, default: null },
      expYear: { type: Number, default: null }
    },
    auditTrail: [
      {
        action: { type: String, required: true },
        fromStatus: { type: String },
        toStatus: { type: String },
        changedBy: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
        notes: { type: String, default: '' }
      }
    ]
  },
  { timestamps: true }
);

subscriptionSchema.index({ companyId: 1, status: 1 });

export const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
