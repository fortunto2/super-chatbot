#!/usr/bin/env node

/**
 * Final Generate Image Test
 * Tests the updated generate-image.ts that uses /api/v1/project/image endpoint
 */

// Configuration
const SUPERDUPERAI_TOKEN = process.env.SUPERDUPERAI_TOKEN;
const SUPERDUPERAI_URL = process.env.SUPERDUPERAI_URL || 'https://dev-editor.superduperai.co';

console.log('🎯 Final Generate Image Test');
console.log('='.repeat(50));
console.log('🔗 API URL:', SUPERDUPERAI_URL);
console.log('🔑 Token:', SUPERDUPERAI_TOKEN ? `${SUPERDUPERAI_TOKEN.substring(0, 8)}...` : 'NOT SET');
console.log('');

if (!SUPERDUPERAI_TOKEN) {
  console.error('❌ SUPERDUPERAI_TOKEN environment variable is required');
  process.exit(1);
}

function generateChatId() {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function testFinalGenerateImage() {
  const chatId = generateChatId();
  
  console.log('💬 Generated Chat ID:', chatId);
  console.log('🎯 Testing updated generate-image.ts with project/image endpoint...');
  console.log('');

  try {
    // Simulate the updated generate-image.ts payload with correct structure
    const payload = {
      type: "media", // Fixed: should be "media" not "image"
      template_name: null,
      style_name: "flux_watercolor", // Move style_name outside config
      config: {
        prompt: `Final test image for chat ${chatId} - project+image endpoint`,
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

    console.log('📦 Final payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(`${SUPERDUPERAI_URL}/api/v1/project/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPERDUPERAI_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('📡 Response Status:', response.status);

    if (response.ok) {
      const result = await response.json();
      
      console.log('✅ Project+Image generation started successfully');
      console.log('🎯 Project ID:', result.id);
      console.log('🎯 Project Type:', result.type);
      console.log('🎯 Data Count:', result.data?.length || 0);
      console.log('🎯 Tasks Count:', result.tasks?.length || 0);
      
      // Extract file info from data
      const fileData = result.data?.[0];
      const fileId = fileData?.value?.file_id;
      
      console.log('🎯 File ID from data:', fileId);
      
      // Test WebSocket connection with the project ID
      console.log('');
      console.log('🔌 Testing WebSocket Connection');
      console.log('-'.repeat(50));
      const websocketResult = await testWebSocketConnection(result.id);
      
      return {
        success: true,
        chatId,
        projectId: result.id,
        projectType: result.type,
        dataCount: result.data?.length || 0,
        tasksCount: result.tasks?.length || 0,
        fileId: fileId,
        websocket: websocketResult
      };
    } else {
      const errorText = await response.text();
      console.error('❌ Generation failed:', errorText);
      return {
        success: false,
        chatId,
        error: errorText
      };
    }
  } catch (error) {
    console.error('❌ Generation error:', error.message);
    return {
      success: false,
      chatId,
      error: error.message
    };
  }
}

async function testWebSocketConnection(projectId) {
  return new Promise((resolve) => {
    console.log('🔌 Testing WebSocket connection for project:', projectId);
    
    const WebSocket = require('ws');
    const wsUrl = `${SUPERDUPERAI_URL.replace('https://', 'wss://')}/api/v1/ws/project.${projectId}`;
    
    console.log('🔗 WebSocket URL:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    let connected = false;
    let eventReceived = false;
    
    const timeout = setTimeout(() => {
      if (!eventReceived) {
        console.log('⏰ WebSocket timeout - no events received in 45 seconds');
        ws.close();
        resolve({
          connected,
          eventReceived: false,
          timeout: true
        });
      }
    }, 45000); // 45 second timeout for image generation
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected successfully');
      connected = true;
    });
    
    ws.on('message', (data) => {
      console.log('📨 WebSocket event received:', data.toString());
      eventReceived = true;
      clearTimeout(timeout);
      ws.close();
      resolve({
        connected,
        eventReceived: true,
        eventData: data.toString()
      });
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
      clearTimeout(timeout);
      resolve({
        connected: false,
        eventReceived: false,
        error: error.message
      });
    });
    
    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed');
      if (!eventReceived) {
        clearTimeout(timeout);
        resolve({
          connected,
          eventReceived: false,
          closed: true
        });
      }
    });
  });
}

// Run the test
testFinalGenerateImage().then((result) => {
  console.log('');
  console.log('📊 Final Generate Image Test Results');
  console.log('='.repeat(50));
  console.table(result);
  
  if (result.success) {
    console.log('✅ Final generate-image.ts approach works!');
    console.log('💡 Key findings:');
    console.log('  - Project+Image generation:', result.success ? 'SUCCESS' : 'FAILED');
    console.log('  - Project ID created:', result.projectId || 'null');
    console.log('  - File ID extracted:', result.fileId || 'null');
    console.log('  - Data entries:', result.dataCount);
    console.log('  - Tasks entries:', result.tasksCount);
    console.log('  - WebSocket events:', result.websocket?.eventReceived ? 'RECEIVED' : 'NOT RECEIVED');
    
    if (result.projectId && result.websocket?.eventReceived) {
      console.log('🎉 COMPLETE SUCCESS: Updated generate-image.ts with WebSocket events!');
      console.log('💡 This approach creates project AND generates image with WebSocket events!');
    } else if (result.projectId) {
      console.log('⚠️ PARTIAL SUCCESS: Project created, WebSocket needs investigation');
    }
  } else {
    console.log('❌ Final generate-image.ts approach failed');
    console.log('🔍 Error:', result.error);
  }
}).catch((error) => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
}); 