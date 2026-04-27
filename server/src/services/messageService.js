import { Message } from '../models/Message.js';
import { Room } from '../models/Room.js';

export class MessageService {
  // Save message to database
  static async saveMessage(messageData) {
    try {
      const message = new Message(messageData);
      await message.save();
      
      // Update room message count and activity
      await Room.findOneAndUpdate(
        { roomId: messageData.roomId },
        { 
          $inc: { messageCount: 1 },
          lastActivity: new Date(),
          $setOnInsert: { 
            roomId: messageData.roomId,
            isGlobal: messageData.roomId === 'global'
          }
        },
        { upsert: true }
      );

      return message;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  // Get messages for a room with pagination
  static async getRoomMessages(roomId, page = 1, limit = 50) {
    try {
      const skip = (page - 1) * limit;
      
      const messages = await Message.find({ roomId })
        .sort({ timestamp: -1 }) // Newest first
        .skip(skip)
        .limit(limit)
        .lean(); // Return plain objects for better performance

      // Reverse to show oldest first in UI
      return messages.reverse();
    } catch (error) {
      console.error('Error fetching room messages:', error);
      throw error;
    }
  }

  // Get recent messages (for real-time history)
  static async getRecentMessages(roomId, limit = 200) {
    try {
      const messages = await Message.find({ roomId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

      return messages.reverse();
    } catch (error) {
      console.error('Error fetching recent messages:', error);
      return []; // Return empty array on error
    }
  }

  // Delete all messages in a room (admin function)
  static async clearRoomMessages(roomId) {
    try {
      const result = await Message.deleteMany({ roomId });
      
      // Reset room message count
      await Room.findOneAndUpdate(
        { roomId },
        { messageCount: 0, lastActivity: new Date() }
      );

      return result.deletedCount;
    } catch (error) {
      console.error('Error clearing room messages:', error);
      throw error;
    }
  }

  // Delete a specific message
  static async deleteMessage(messageId) {
    try {
      const message = await Message.findOneAndDelete({ id: messageId });
      
      if (message) {
        // Decrement room message count
        await Room.findOneAndUpdate(
          { roomId: message.roomId },
          { $inc: { messageCount: -1 } }
        );
      }

      return message;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Get message statistics
  static async getMessageStats() {
    try {
      const totalMessages = await Message.countDocuments();
      const last24h = await Message.countDocuments({
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      
      return { totalMessages, last24h };
    } catch (error) {
      console.error('Error getting message stats:', error);
      return { totalMessages: 0, last24h: 0 };
    }
  }
}