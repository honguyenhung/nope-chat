// Test script for admin functionality
// Run with: node test-admin.js

const SERVER_URL = 'http://localhost:3001';

async function testAdminLogin() {
  console.log('🧪 Testing admin login...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'Nhie',
        password: 'Hungnguyen@1515'
      })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Admin login successful!');
      console.log('Token:', data.token.substring(0, 16) + '...');
      
      // Test admin stats endpoint
      await testAdminStats(data.token);
    } else {
      console.log('❌ Admin login failed:', data.message);
    }
  } catch (error) {
    console.log('❌ Connection error:', error.message);
    console.log('💡 Make sure server is running: npm run dev (in server folder)');
  }
}

async function testAdminStats(token) {
  console.log('\n🧪 Testing admin stats...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const stats = await response.json();
      console.log('✅ Admin stats retrieved!');
      console.log('Server uptime:', Math.floor(stats.serverUptime / 60), 'minutes');
      console.log('Memory usage:', Math.floor(stats.memoryUsage.heapUsed / 1024 / 1024), 'MB');
    } else {
      console.log('❌ Failed to get admin stats');
    }
  } catch (error) {
    console.log('❌ Stats error:', error.message);
  }
}

// Test wrong credentials
async function testWrongCredentials() {
  console.log('\n🧪 Testing wrong credentials...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'wrong',
        password: 'wrong'
      })
    });

    const data = await response.json();
    
    if (!response.ok && !data.success) {
      console.log('✅ Wrong credentials properly rejected:', data.message);
    } else {
      console.log('❌ Security issue: wrong credentials accepted!');
    }
  } catch (error) {
    console.log('❌ Connection error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting admin system tests...\n');
  
  await testAdminLogin();
  await testWrongCredentials();
  
  console.log('\n✨ Tests completed!');
}

runTests();