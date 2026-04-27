import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  socketId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  ip: { type: String, required: true, index: true },
  publicKey: { type: String }, // ECDH public key
  rooms: [{ type: String }], // Array of room IDs
  connectedAt: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  // TTL: Users expire after 1 hour of inactivity
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    expires: 0
  }
});

// Update last seen when user is active
userSchema.methods.updateActivity = function() {
  this.lastSeen = new Date();
  this.expiresAt = new Date(Date.now() + 60 * 60 * 1000); // Reset TTL
  return this.save();
};

export const User = mongoose.model('User', userSchema);