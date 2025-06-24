#!/usr/bin/env node

/**
 * Image Generation Debug Test
 * Tests the complete image generation flow including API calls and WebSocket events
 */

const WebSocket = require('ws');
// Use built-in fetch in Node.js 18+
const fetch = globalThis.fetch;

// Configuration
const SUPERDUPERAI_TOKEN = process.env.SUPERDUPERAI_TOKEN;
const SUPERDUPERAI_URL = process.env.SUPERDUPERAI_URL || 'https://dev-editor.superduperai.co';
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || SUPERDUPERAI_URL;

console.log('🎨 Image Generation Debug Test');
console.log('='.repeat(50));
console.log('🔗 API URL:', SUPERDUPERAI_URL);
console.log('🔗 WebSocket URL:', WS_BASE_URL);
console.log('🔑 Token:', SUPERDUPERAI_TOKEN ? `${SUPERDUPERAI_TOKEN.substring(0, 8)}...` : 'NOT SET');
console.log('');

if (!SUPERDUPERAI_TOKEN) {
  console.error('❌ SUPERDUPERAI_TOKEN environment variable is required');
  process.exit(1);
}

// Test image generation API call
async function testImageGenerationAPI() {
  console.log('🎨 Testing Image Generation API');
  console.log('-'.repeat(50));
  
  const payload = {
    type: "media",
    template_name: null,
    style_name: "flux_watercolor", // Move style_name outside config
    config: {
      prompt: "A test image for debugging WebSocket connection",
      shot_size: "Medium Shot", // Use label format
      style_name: "flux_watercolor", // Keep for backward compatibility
      seed: String(Math.floor(Math.random() * 1000000000000)), // Convert to string
      aspecRatio: "1:1", // Add aspecRatio (typo in API)
      batch_size: 3, // Use batch_size 3 like in working example
      entity_ids: [],
      generation_config_name: "comfyui/flux",
      height: "1024", // Convert to string
      qualityType: "hd", // Add qualityType
      references: [],
      width: "1024", // Convert to string
    }
  };
  
  console.log('📦 Payload structure:');
  console.log(JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(`${SUPERDUPERAI_URL}/api/v1/file/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPERDUPERAI_TOKEN}`,
        'User-Agent': 'SuperChatbot/1.0',
        'X-Request-ID': `test_${Date.now()}`
      },
      body: JSON.stringify(payload)
    });
    
    console.log('📡 API Response Status:', response.status);
    console.log('📡 API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      return null;
    }
    
    const result = await response.json();
    console.log('✅ API Response:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('❌ API Request failed:', error.message);
    return null;
  }
}

// Test WebSocket connection with project ID
async function testWebSocketWithProject(projectId) {
  console.log('\n🔌 Testing WebSocket with Project ID');
  console.log('-'.repeat(50));
  console.log('🆔 Project ID:', projectId);
  
  const wsUrl = `${WS_BASE_URL.replace('https://', 'wss://')}/api/v1/ws/project.${projectId}`;
  console.log('📡 WebSocket URL:', wsUrl);
  
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let connectionTimeout;
    let messageTimeout;
    const receivedMessages = [];
    
    // Set connection timeout
    connectionTimeout = setTimeout(() => {
      console.log('⏰ Connection timeout (30s)');
      ws.close();
      reject(new Error('Connection timeout'));
    }, 30000);
    
    // Set message timeout (wait for result)
    messageTimeout = setTimeout(() => {
      console.log('⏰ Message timeout (60s) - no result received');
      ws.close();
      resolve({ success: false, messages: receivedMessages, reason: 'timeout' });
    }, 60000);
    
    ws.on('open', () => {
      clearTimeout(connectionTimeout);
      console.log('✅ WebSocket connected successfully!');
      
      // Send subscribe message
      const subscribeMessage = {
        type: 'subscribe',
        projectId: `project.${projectId}`
      };
      
      console.log('📤 Sending subscribe message:', subscribeMessage);
      ws.send(JSON.stringify(subscribeMessage));
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📨 Received message:', message);
        receivedMessages.push(message);
        
        if (message.type === 'subscribe') {
          console.log('✅ Subscription confirmed!');
        } else if (message.type === 'file' && message.object?.url) {
          console.log('🎉 Image generation completed!');
          console.log('🖼️ Image URL:', message.object.url);
          clearTimeout(messageTimeout);
          ws.close();
          resolve({ success: true, messages: receivedMessages, imageUrl: message.object.url });
        }
      } catch (error) {
        console.log('📨 Received raw message:', data.toString());
        receivedMessages.push({ raw: data.toString() });
      }
    });
    
    ws.on('error', (error) => {
      clearTimeout(connectionTimeout);
      clearTimeout(messageTimeout);
      console.error('❌ WebSocket error:', error.message);
      reject(error);
    });
    
    ws.on('close', (code, reason) => {
      clearTimeout(connectionTimeout);
      clearTimeout(messageTimeout);
      console.log(`🔌 WebSocket closed. Code: ${code}, Reason: ${reason || 'No reason'}`);
      
      if (code === 1000) {
        console.log('✅ Clean close');
      } else {
        console.log('⚠️ Unexpected close');
      }
    });
  });
}

// Main test function
async function runTests() {
  try {
    console.log('🚀 Starting Image Generation Debug Tests...\n');
    
    // Test 1: API call
    const apiResult = await testImageGenerationAPI();
    
    if (!apiResult) {
      console.error('❌ API test failed, cannot proceed with WebSocket test');
      return;
    }
    
    // Extract file ID from the response array
    if (!Array.isArray(apiResult) || apiResult.length === 0 || !apiResult[0].id) {
      console.error('❌ No file ID returned from API');
      console.log('📋 Full API response:', apiResult);
      return;
    }
    
    const fileId = apiResult[0].id;
    const imageGenerationId = apiResult[0].image_generation_id;
    
    console.log('🆔 File ID:', fileId);
    console.log('🎨 Image Generation ID:', imageGenerationId);
    
    // Test 2: WebSocket connection with real file ID
    const wsResult = await testWebSocketWithProject(fileId);
    
    console.log('\n📊 Test Results Summary');
    console.log('='.repeat(50));
    console.log('✅ API Call:', apiResult ? 'SUCCESS' : 'FAILED');
    console.log('🆔 Project ID:', apiResult?.id || 'N/A');
    console.log('🔌 WebSocket:', wsResult.success ? 'SUCCESS' : 'FAILED');
    console.log('📨 Messages Received:', wsResult.messages.length);
    
    if (wsResult.success) {
      console.log('🖼️ Image URL:', wsResult.imageUrl);
      console.log('\n🎉 Complete flow test PASSED!');
    } else {
      console.log('⚠️ Reason:', wsResult.reason || 'Unknown');
      console.log('\n❌ Complete flow test FAILED');
      console.log('\n🔍 Debug Info:');
      console.log('- Check if image generation is actually starting');
      console.log('- Verify WebSocket events are being sent');
      console.log('- Check SuperDuperAI service status');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testImageGenerationAPI,
  testWebSocketWithProject,
  runTests
}; 