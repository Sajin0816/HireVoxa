import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    companyId: { type: String, index: true },
    conversationId: { type: String, required: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, default: 'company' },
    recipientId: { type: String, required: true },
    recipientName: { type: String, required: true },
    content: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
    isDemoRecord: { type: Boolean, default: false }
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1 });
messageSchema.index({ senderId: 1, recipientId: 1 });
messageSchema.index({ recipientId: 1, read: 1 });

export const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
