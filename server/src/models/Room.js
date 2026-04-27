import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  isGlobal: { type: Boolean, default: false },
  passwordHash: { type: String }, // Hashed password for protected rooms
  createdAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now, index: true },
  messageCount: { type: Number, default: 0 },
  // TTL: Rooms expire after 7 days of inactivity
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    expires: 0
  }
});

// Update lastActivity when room is accessed
roomSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Reset TTL
  return this.save();
};

export const Room = mongoose.model('Room', roomSchema);