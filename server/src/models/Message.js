import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  roomId: { type: String, required: true, index: true },
  socketId: { type: String, required: true },
  username: { type: String, required: true },
  encryptedContent: { type: String }, // Encrypted text
  imageData: { type: String }, // Base64 image data
  timestamp: { type: Date, default: Date.now, index: true },
  isAdmin: { type: Boolean, default: false },
  // TTL: Messages expire after 24 hours
  expiresAt: { 
    type: Date, 
    default: Date.now, 
    expires: 24 * 60 * 60 // 24 hours in seconds
  }
});

// Compound index for efficient room queries
messageSchema.index({ roomId: 1, timestamp: -1 });

export const Message = mongoose.model('Message', messageSchema);