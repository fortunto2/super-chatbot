#!/usr/bin/env node

/**
 * Global WebSocket Test
 * Tests global WebSocket endpoints to listen for all file events
 */

const WebSocket = require('ws');

// Configuration
const SUPERDUPERAI_TOKEN = process.env.SUPERDUPERAI_TOKEN;
const SUPERDUPERAI_URL = process.env.SUPERDUPERAI_URL || 'https://dev-editor.superduperai.co';
const WS_BASE_URL = SUPERDUPERAI_URL.replace('https://', 'wss://');

console.log('🌍 Global WebSocket Test');
console.log('='.repeat(50));
console.log('🔗 API URL:', SUPERDUPERAI_URL);
console.log('🔗 WebSocket Base:', WS_BASE_URL);
console.log('🔑 Token:', SUPERDUPERAI_TOKEN ? `${SUPERDUPERAI_TOKEN.substring(0, 8)}...` : 'NOT SET');
console.log('');

if (!SUPERDUPERAI_TOKEN) {
  console.error('❌ SUPERDUPERAI_TOKEN environment variable is required');
  process.exit(1);
}

async function testGlobalWebSocket() {
  console.log('🌍 Testing global WebSocket endpoints...');
  console.log('-'.repeat(50));
  
  // First, generate an image to have something to listen for
  console.log('🎨 Generating test image...');
  const payload = {
    type: "media",
    template_name: null,
    style_name: "flux_watercolor", // Move style_name outside config
    config: {
      prompt: "A test image for global WebSocket monitoring",
      shot_size: "Medium Shot", // Use label format
      style_name: "flux_watercolor", // Keep for backward compatibility
      seed: String(Math.floor(Math.random() * 1000000)), // Convert to string
      aspecRatio: "1:1", // Add aspecRatio (typo in API)
      batch_size: 3, // Use batch_size 3 like in working example
      entity_ids: [],
      generation_config_name: "comfyui/flux",
      height: "512", // Convert to string
      qualityType: "hd", // Add qualityType
      references: [],
      width: "512", // Convert to string
    }
  };

  try {
    const response = await fetch(`${SUPERDUPERAI_URL}/api/v1/file/generate-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPERDUPERAI_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const result = await response.json();
    const fileId = result[0].id;
    const imageGenId = result[0].image_generation_id;
    
    console.log('✅ Image generation started!');
    console.log('🆔 File ID:', fileId);
    console.log('🎨 Image Gen ID:', imageGenId);
    console.log('');
    
    // Now connect to global WebSocket endpoints and listen for events
    const globalEndpoints = [
      '/api/v1/ws/file',
      '/api/v1/ws/image', 
      '/api/v1/ws/generation'
    ];
    
    const promises = globalEndpoints.map(endpoint => 
      testGlobalEndpoint(endpoint, fileId, imageGenId)
    );
    
    await Promise.all(promises);
    
  } catch (error) {
    console.error('❌ Failed to generate test image:', error.message);
  }
}

function testGlobalEndpoint(endpoint, targetFileId, targetImageGenId) {
  return new Promise((resolve) => {
    console.log(`🌍 Testing global endpoint: ${endpoint}`);
    
    const wsUrl = `${WS_BASE_URL}${endpoint}`;
    console.log(`📡 Connecting to: ${wsUrl}`);
    
    const ws = new WebSocket(wsUrl);
    let messageCount = 0;
    let subscribed = false;
    
    const timeout = setTimeout(() => {
      console.log(`⏰ ${endpoint} - Timeout (120s) - closing connection`);
      ws.close();
      resolve({
        endpoint,
        success: false,
        reason: 'timeout',
        messagesReceived: messageCount
      });
    }, 120000); // 2 minutes timeout

    ws.on('open', () => {
      console.log(`✅ ${endpoint} - Connected!`);
      
      // Try different subscription strategies
      const subscriptions = [
        { type: 'subscribe' },
        { type: 'subscribe', channel: 'files' },
        { type: 'subscribe', channel: 'all' },
        { type: 'subscribe', fileId: targetFileId },
        { type: 'subscribe', imageGenerationId: targetImageGenId }
      ];
      
      subscriptions.forEach((sub, index) => {
        setTimeout(() => {
          console.log(`📤 ${endpoint} - Sending subscription ${index + 1}:`, sub);
          ws.send(JSON.stringify(sub));
        }, index * 500);
      });
    });

    ws.on('message', (data) => {
      messageCount++;
      const message = JSON.parse(data.toString());
      console.log(`📨 ${endpoint} - Message ${messageCount}:`, JSON.stringify(message, null, 2));
      
      if (message.type === 'subscribe') {
        subscribed = true;
        console.log(`✅ ${endpoint} - Subscription confirmed!`);
      } else if (message.type === 'file') {
        console.log(`📁 ${endpoint} - File event received!`);
        
        if (message.object?.url) {
          console.log(`🎉 ${endpoint} - SUCCESS! File completed with URL:`, message.object.url);
          
          // Check if this is our target file
          if (message.fileId === targetFileId || 
              message.object?.id === targetFileId ||
              message.imageGenerationId === targetImageGenId) {
            console.log(`🎯 ${endpoint} - This is our target file!`);
            clearTimeout(timeout);
            ws.close();
            resolve({
              endpoint,
              success: true,
              imageUrl: message.object.url,
              messagesReceived: messageCount,
              isTargetFile: true
            });
            return;
          }
        }
      } else {
        console.log(`📋 ${endpoint} - Other event type: ${message.type}`);
      }
    });

    ws.on('error', (error) => {
      console.error(`❌ ${endpoint} - Error:`, error.message);
      clearTimeout(timeout);
      resolve({
        endpoint,
        success: false,
        reason: 'error',
        error: error.message,
        messagesReceived: messageCount
      });
    });

    ws.on('close', (code, reason) => {
      console.log(`🔌 ${endpoint} - Closed (${code}): ${reason || 'no reason'}`);
      clearTimeout(timeout);
      
      if (!subscribed) {
        console.log(`⚠️ ${endpoint} - Closed before subscription confirmed`);
      }
      
      resolve({
        endpoint,
        success: false,
        reason: 'closed',
        messagesReceived: messageCount,
        subscribed
      });
    });
  });
}

// Run the test
testGlobalWebSocket().then(() => {
  console.log('');
  console.log('📊 Global WebSocket Test Completed');
  console.log('='.repeat(50));
}).catch(error => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
}); 