import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientUserId: { type: String, required: true, index: true },
    recipientRole: { type: String, enum: ['candidate', 'company', 'admin'], required: true },
    companyId: { type: String, index: true, default: null },
    type: {
      type: String,
      enum: [
        'APPLICATION_SUBMITTED',
        'APPLICATION_STATUS_CHANGED',
        'APPLICATION_WITHDRAWN',
        'INTERVIEW_SCHEDULED',
        'INTERVIEW_UPDATED',
        'INTERVIEW_CANCELLED',
        'MESSAGE_RECEIVED',
        'OFFER_MADE',
        'PLACEMENT_ELIGIBLE'
      ],
      required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

notificationSchema.index({ recipientUserId: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
