import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    userRole: { type: String, enum: ['company', 'candidate', 'admin'], required: true },
    companyId: { type: String, default: '', index: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Account', 'Job Posting', 'Application', 'Interview', 'Technical Issue', 'Billing Inquiry', 'Other'],
      default: 'General'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true
    },
    assignedTo: {
      adminId: { type: String, default: '' },
      adminName: { type: String, default: '' }
    },
    internalNotes: [
      {
        note: { type: String, required: true },
        authorId: { type: String, required: true },
        authorName: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    resolutionSummary: { type: String, default: '' },
    resolvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

supportTicketSchema.index({ status: 1, priority: -1, createdAt: -1 });

export const SupportTicket = mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema);
