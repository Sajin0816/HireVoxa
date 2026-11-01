import mongoose from 'mongoose';
import { INVOICE_STATUSES } from '../config/pricing.js';

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
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
    companyName: {
      type: String,
      trim: true,
      default: ''
    },
    type: {
      type: String,
      enum: ['placement_fee', 'subscription'],
      required: true,
      index: true
    },
    referenceId: {
      type: String,
      default: null,
      index: true
    },
    amountCents: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    status: {
      type: String,
      enum: INVOICE_STATUSES,
      default: 'open',
      index: true
    },
    dueDate: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // Net 14 days
    },
    paidAt: {
      type: Date,
      default: null
    },
    paymentMethod: {
      type: String,
      default: null
    },
    paymentReference: {
      type: String,
      default: null
    },
    lineItems: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        unitAmountCents: { type: Number, required: true },
        totalAmountCents: { type: Number, required: true }
      }
    ],
    billingAddress: {
      companyName: String,
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

invoiceSchema.index({ companyId: 1, status: 1 });
invoiceSchema.index({ type: 1, status: 1 });

export const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
