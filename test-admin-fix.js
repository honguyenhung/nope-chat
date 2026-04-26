// Test script to verify admin functions work without rate limiting
const API_BASE = 'https://nope-chat.onrender.com/api/admin';

async function testAdminFunctions() {
  console.log('🧪 Testing Admin Functions...\n');

  // Test 1: Login
  console.log('1️⃣ Testing admin login...');
  try {
    const loginResponse = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Nhie', password: '1' })
    });
    
    const loginData = await loginResponse.json();
    if (loginData.success) {
      console.log('✅ Login successful');
      const token = loginData.token;
      
      // Test 2: Get stats (verify token works)
      console.log('\n2️⃣ Testing stats endpoint...');
      const statsResponse = await fetch(`${API_BASE}/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (statsResponse.ok) {
        console.log('✅ Stats endpoint working');
        
        // Test 3: Clear global room (the main issue)
        console.log('\n3️⃣ Testing clear room function...');
        const clearResponse = await fetch(`${API_BASE}/messages/global`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const clearData = await clearResponse.json();
        if (clearResponse.ok) {
          console.log('✅ Clear room function working!');
          console.log('📝 Response:', clearData.message);
        } else {
          console.log('❌ Clear room failed:', clearData.error);
        }
        
        // Test 4: Send admin message
        console.log('\n4️⃣ Testing admin message...');
        const messageResponse = await fetch(`${API_BASE}/send-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            roomId: 'global',
            message: 'Test admin message - functions are working!'
          })
        });
        
        const messageData = await messageResponse.json();
        if (messageResponse.ok) {
          console.log('✅ Admin message sent successfully!');
        } else {
          console.log('❌ Admin message failed:', messageData.error);
        }
        
      } else {
        console.log('❌ Stats endpoint failed');
      }
      
    } else {
      console.log('❌ Login failed:', loginData.message);
    }
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }
  
  console.log('\n🏁 Test completed!');
}

// Run the test
testAdminFunctions();