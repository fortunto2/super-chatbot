#!/usr/bin/env node

/**
 * Simple No-Project Test
 * Tests image generation without creating projects upfront
 */

// Configuration
const SUPERDUPERAI_TOKEN = process.env.SUPERDUPERAI_TOKEN;
const SUPERDUPERAI_URL = process.env.SUPERDUPERAI_URL || 'https://dev-editor.superduperai.co';

console.log('🎨 Simple No-Project Test');
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

async function testImageGenerationNoProject() {
  const chatId = generateChatId();
  
  console.log('💬 Generated Chat ID:', chatId);
  console.log('🎨 Testing image generation without project creation...');
  console.log('');

  try {
    // Direct image generation without project_id
    const payload = {
      // No project_id - let backend create new project
      config: {
        prompt: `Test image for chat ${chatId} - no project creation`,
        negative_prompt: "",
        width: 1024,
        height: 1024,
        steps: 20,
        shot_size: "Medium Shot",
        seed: Math.floor(Math.random() * 1000000000000),
        generation_config_name: "comfyui/flux",
        batch_size: 1,
        style_name: "flux_watercolor",
        references: [],
        entity_ids: [],
        model_type: null
      }
    };

    console.log('📦 Image generation payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(`${SUPERDUPERAI_URL}/api/v1/file/generate-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPERDUPERAI_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('📡 Image Response Status:', response.status);

    if (response.ok) {
      const result = await response.json();
      const fileData = result[0];
      
      console.log('✅ Image generation started successfully');
      console.log('🎯 File ID:', fileData.id);
      console.log('🎯 Project ID in response:', fileData.project_id || 'null');
      console.log('🎯 Image Generation ID:', fileData.image_generation_id);
      
      // Test WebSocket connection if we have a project ID
      let websocketResult = null;
      if (fileData.project_id) {
        console.log('');
        console.log('🔌 Testing WebSocket Connection');
        console.log('-'.repeat(50));
        websocketResult = await testWebSocketConnection(fileData.project_id);
      }
      
      return {
        success: true,
        chatId,
        fileId: fileData.id,
        projectId: fileData.project_id,
        imageGenerationId: fileData.image_generation_id,
        websocket: websocketResult
      };
    } else {
      const errorText = await response.text();
      console.error('❌ Image generation failed:', errorText);
      return {
        success: false,
        chatId,
        error: errorText
      };
    }
  } catch (error) {
    console.error('❌ Image generation error:', error.message);
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
        console.log('⏰ WebSocket timeout - no events received in 30 seconds');
        ws.close();
        resolve({
          connected,
          eventReceived: false,
          timeout: true
        });
      }
    }, 30000); // 30 second timeout
    
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
testImageGenerationNoProject().then((result) => {
  console.log('');
  console.log('📊 Simple No-Project Test Results');
  console.log('='.repeat(50));
  console.table(result);
  
  if (result.success) {
    console.log('✅ Simple no-project approach works!');
    console.log('💡 Key findings:');
    console.log('  - Image generation:', result.success ? 'SUCCESS' : 'FAILED');
    console.log('  - Project ID created:', result.projectId || 'null');
    console.log('  - WebSocket events:', result.websocket?.eventReceived ? 'RECEIVED' : 'NOT RECEIVED');
    
    if (result.projectId && result.websocket?.eventReceived) {
      console.log('🎉 COMPLETE SUCCESS: Image → Project → WebSocket all working!');
    } else if (result.projectId) {
      console.log('⚠️ PARTIAL SUCCESS: Image and Project work, WebSocket needs investigation');
    }
  } else {
    console.log('❌ Simple no-project approach failed');
    console.log('🔍 Error:', result.error);
  }
}).catch((error) => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
}); 