#!/usr/bin/env node

/**
 * WebSocket Debug Test
 * Tests WebSocket connection and event handling for image/video generation
 */

const WebSocket = require('ws');

// Configuration
// SECURITY: Never use NEXT_PUBLIC_ for URLs with sensitive endpoints
const WS_BASE_URL = 'https://editor.superduperai.co'; // Use fixed URL or get from secure API
const TEST_PROJECT_ID = 'test-project-123';

// Convert HTTP to WebSocket URL
const wsUrl = `${WS_BASE_URL.replace('https://', 'wss://')}/api/v1/ws/project.${TEST_PROJECT_ID}`;

console.log('🔌 WebSocket Debug Test');
console.log('='.repeat(50));
console.log('📡 WebSocket URL:', wsUrl);
console.log('🆔 Test Project ID:', TEST_PROJECT_ID);
console.log('');

// Test WebSocket connection
function testWebSocketConnection() {
  return new Promise((resolve, reject) => {
    console.log('🔌 Attempting WebSocket connection...');
    
    const ws = new WebSocket(wsUrl);
    
    // Set connection timeout
    const connectionTimeout = setTimeout(() => {
      console.log('⏰ Connection timeout (10s)');
      ws.close();
      reject(new Error('Connection timeout'));
    }, 10000);
    
    ws.on('open', () => {
      clearTimeout(connectionTimeout);
      console.log('✅ WebSocket connected successfully!');
      console.log('📊 Connection state:', ws.readyState);
      
      // Send subscribe message
      const subscribeMessage = {
        type: 'subscribe',
        projectId: `project.${TEST_PROJECT_ID}`
      };
      
      console.log('📤 Sending subscribe message:', subscribeMessage);
      ws.send(JSON.stringify(subscribeMessage));
      
      // Wait for subscription confirmation
      setTimeout(() => {
        console.log('🔌 Closing test connection...');
        ws.close(1000, 'Test completed');
        resolve(true);
      }, 2000);
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📨 Received message:', message);
        
        if (message.type === 'subscribe') {
          console.log('✅ Subscription confirmed!');
        }
      } catch (error) {
        console.log('📨 Received raw message:', data.toString());
      }
    });
    
    ws.on('error', (error) => {
      clearTimeout(connectionTimeout);
      console.error('❌ WebSocket error:', error.message);
      reject(error);
    });
    
    ws.on('close', (code, reason) => {
      clearTimeout(connectionTimeout);
      console.log(`🔌 WebSocket closed. Code: ${code}, Reason: ${reason || 'No reason'}`);
      
      if (code === 1000) {
        console.log('✅ Clean close - test completed successfully');
        resolve(true);
      } else {
        console.log('⚠️ Unexpected close');
        reject(new Error(`Unexpected close: ${code}`));
      }
    });
  });
}

// Test image generation payload structure
function testImagePayloadStructure() {
  console.log('\n📦 Testing Image Generation Payload Structure');
  console.log('-'.repeat(50));
  
  const imagePayload = {
    params: {
      config: {
        seed: 123456789,
        size: "auto",
        model: "cyberrealisticxlplayV2.f4ow.safetensors",
        steps: 20,
        style: {
          prompt: "Real estate photography style {prompt} . Professional, inviting, well-lit, high-resolution, property-focused, commercial, highly detailed",
          negative_prompt: "dark, blurry, unappealing, noisy, unprofessional"
        },
        width: 1024,
        height: 1024,
        prompt: "A test image for debugging",
        quality: "auto",
        entities: [],
        k_sampler: {
          seed: 123456789,
          steps: 20
        },
        shot_size: "Long Shot",
        background: "auto",
        batch_size: 1,
        aspect_ratio: "1:1",
        output_format: "png"
      },
      file_ids: [],
      references: [],
      generation_config: {
        name: "comfyui/flux",
        type: "text_to_image",
        label: "Flux Dev",
        params: {
          price: 1,
          workflow_path: "flux/default.json"
        },
        source: "local"
      }
    }
  };
  
  console.log('✅ Image payload structure valid');
  console.log('📊 Payload size:', JSON.stringify(imagePayload).length, 'bytes');
  console.log('🔧 Model:', imagePayload.params.generation_config.name);
  console.log('📐 Resolution:', `${imagePayload.params.config.width}x${imagePayload.params.config.height}`);
  
  return imagePayload;
}

// Main test function
async function runTests() {
  try {
    console.log('🚀 Starting WebSocket Debug Tests...\n');
    
    // Test 1: Payload structure
    testImagePayloadStructure();
    
    // Test 2: WebSocket connection
    console.log('\n🔌 Testing WebSocket Connection');
    console.log('-'.repeat(50));
    await testWebSocketConnection();
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n💡 Debug Tips:');
    console.log('- Check browser console for WebSocket logs');
    console.log('- Use window.imageWebsocketStore.getDebugInfo() in browser');
    console.log('- Verify SUPERDUPERAI_TOKEN is set correctly');
    console.log('- Check network tab for WebSocket connection status');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n🔍 Troubleshooting:');
    console.log('- Verify WebSocket URL is accessible');
    console.log('- Check authentication token');
    console.log('- Ensure SuperDuperAI service is running');
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testWebSocketConnection,
  testImagePayloadStructure,
  runTests
}; 