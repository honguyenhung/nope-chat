#!/usr/bin/env node

// Simple DDoS test script - DO NOT use against production servers you don't own
// This is for testing your own server's protection

import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3001';
const NUM_CONNECTIONS = 20; // Try to create 20 connections (should be blocked after 5)
const MESSAGES_PER_CONNECTION = 50; // Try to send 50 messages rapidly

console.log(`🧪 Testing DDoS protection on ${SERVER_URL}`);
console.log(`Attempting ${NUM_CONNECTIONS} connections with ${MESSAGES_PER_CONNECTION} messages each`);

const connections = [];

for (let i = 0; i < NUM_CONNECTIONS; i++) {
  const socket = io(SERVER_URL, {
    transports: ['websocket'],
    auth: { nickname: `TestBot_${i}` }
  });

  socket.on('connect', () => {
    console.log(`✅ Connection ${i} established`);
    
    // Spam messages
    for (let j = 0; j < MESSAGES_PER_CONNECTION; j++) {
      socket.emit('send_message', {
        roomId: 'global',
        encryptedContent: btoa(`Test message ${j} from bot ${i}`),
        iv: 'test-iv'
      });
    }

    // Spam typing events
    for (let k = 0; k < 200; k++) {
      socket.emit('typing_start', { roomId: 'global' });
    }
  });

  socket.on('error', (err) => {
    console.log(`❌ Connection ${i} error:`, err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔌 Connection ${i} disconnected:`, reason);
  });

  connections.push(socket);
}

// Clean up after 10 seconds
setTimeout(() => {
  console.log('🧹 Cleaning up connections...');
  connections.forEach(socket => socket.disconnect());
  process.exit(0);
}, 10000);