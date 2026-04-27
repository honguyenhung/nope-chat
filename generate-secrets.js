#!/usr/bin/env node

/**
 * Generate Secure Secrets for AnonChat
 * Tạo random credentials an toàn cho production
 */

import crypto from 'crypto';

console.log('\n🔐 GENERATING SECURE SECRETS FOR ANONCHAT\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Generate secrets
const adminUsername = `admin_${crypto.randomBytes(8).toString('hex')}`;
const adminPassword = crypto.randomBytes(32).toString('hex');
const sessionSecret = crypto.randomBytes(64).toString('hex');
const adminKey = crypto.randomBytes(32).toString('hex');

console.log('📋 COPY THESE TO YOUR .env FILE:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('# Admin Credentials');
console.log(`ADMIN_USERNAME=${adminUsername}`);
console.log(`ADMIN_PASSWORD=${adminPassword}`);
console.log('');

console.log('# Session Secret');
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log('');

console.log('# Admin Key');
console.log(`ADMIN_KEY=${adminKey}`);
console.log('');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('⚠️  IMPORTANT SECURITY NOTES:\n');
console.log('1. ❌ NEVER commit .env to git');
console.log('2. ❌ NEVER share these secrets via email/chat');
console.log('3. ✅ Store them in a password manager');
console.log('4. ✅ Use different secrets for dev/staging/prod');
console.log('5. ✅ Rotate secrets every 3-6 months');
console.log('');

console.log('📝 NEXT STEPS:\n');
console.log('1. Copy the values above');
console.log('2. Edit server/.env file');
console.log('3. Paste the values');
console.log('4. Save and close');
console.log('5. Restart server');
console.log('');

console.log('🔍 VERIFY:\n');
console.log('   git status');
console.log('   # Make sure .env is NOT in the list\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
