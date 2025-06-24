#!/usr/bin/env node

/**
 * Project WebSocket Test
 * Tests image generation with project_id to ensure WebSocket events are sent
 */

// Configuration
const SUPERDUPERAI_TOKEN = process.env.SUPERDUPERAI_TOKEN;
const SUPERDUPERAI_URL = process.env.SUPERDUPERAI_URL || 'https://dev-editor.superduperai.co';

console.log('🏗️ Project WebSocket Test');
console.log('='.repeat(50));
console.log('🔗 API URL:', SUPERDUPERAI_URL);
console.log('🔑 Token:', SUPERDUPERAI_TOKEN ? `${SUPERDUPERAI_TOKEN.substring(0, 8)}...` : 'NOT SET');
console.log('');

if (!SUPERDUPERAI_TOKEN) {
  console.error('❌ SUPERDUPERAI_TOKEN environment variable is required');
  process.exit(1);
}

// Generate unique project ID (UUID format)
function generateProjectId() {
  // Generate a valid UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function testProjectWebSocket() {
  const projectId = generateProjectId();
  console.log('🏗️ Generated Project ID (UUID):', projectId);
  
  const payload = {
    type: "media",
    template_name: null,
    project_id: projectId, // ← Key fix: include project_id
    style_name: "flux_watercolor", // Move style_name outside config
    config: {
      prompt: "A test image with project WebSocket",
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

  try {
    console.log('🎨 Step 1: Starting Image Generation with Project ID');
    console.log('-'.repeat(50));
    console.log('🏗️ Project ID:', projectId);
    
    // Make API call
    const response = await fetch(`${SUPERDUPERAI_URL}/api/v1/file/generate-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPERDUPERAI_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const fileData = result[0];
    const fileId = fileData.id;
    const imageGenerationId = fileData.image_generation_id;

    console.log('✅ Generation started:', { projectId, fileId, imageGenerationId });
    console.log('');

    // Step 2: Try WebSocket with project ID
    console.log('🔌 Step 2: Testing WebSocket with Project ID');
    console.log('-'.repeat(50));
    
    let completedFile;
    let method = 'unknown';
    const startTime = Date.now();

    try {
      completedFile = await tryWebSocketWithProject(projectId, fileId);
      method = 'websocket';
      console.log('🎉 WebSocket approach succeeded!');
    } catch (wsError) {
      console.log('❌ WebSocket approach failed:', wsError.message);
      console.log('');
      
      // Step 3: Fallback to polling
      console.log('🔄 Step 3: Falling back to Polling');
      console.log('-'.repeat(50));
      
      try {
        completedFile = await pollForCompletion(fileId);
        method = 'polling';
        console.log('🎉 Polling approach succeeded!');
      } catch (pollError) {
        throw new Error(`Both approaches failed: ${pollError.message}`);
      }
    }

    const totalTime = Date.now() - startTime;

    console.log('');
    console.log('🎯 Final Results');
    console.log('-'.repeat(50));
    console.log('✅ Success via:', method);
    console.log('🏗️ Project ID:', projectId);
    console.log('🆔 File ID:', fileId);
    console.log('🖼️ Image URL:', completedFile.url);
    console.log('⏱️ Total time:', Math.round(totalTime / 1000), 'seconds');
    
    return {
      success: true,
      method,
      projectId,
      fileId,
      imageUrl: completedFile.url,
      totalTime
    };

  } catch (error) {
    console.error('❌ Project WebSocket test failed:', error.message);
    return {
      success: false,
      error: error.message,
      projectId
    };
  }
}

// WebSocket approach with project ID
function tryWebSocketWithProject(projectId, fileId) {
  return new Promise((resolve, reject) => {
    const wsUrl = `wss://${SUPERDUPERAI_URL.replace('https://', '').replace('http://', '')}/api/v1/ws/project.${projectId}`;
    
    console.log(`🔌 Connecting to: ${wsUrl}`);
    
    let ws;
    let resolved = false;
    
    // Set timeout for WebSocket attempt
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.log('⏰ WebSocket timeout (30s)');
        if (ws) {
          ws.close();
        }
        reject(new Error('WebSocket timeout'));
      }
    }, 30000); // 30 second timeout

    try {
      const WebSocket = require('ws');
      ws = new WebSocket(wsUrl);
      
      ws.on('open', () => {
        console.log('🔌 WebSocket connected, sending subscribe');
        ws.send(JSON.stringify({
          type: 'subscribe',
          projectId: `project.${projectId}`
        }));
      });
      
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        console.log('📨 WebSocket message:', message);
        
        if (message.type === 'file' && message.object?.url) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            console.log('🎉 WebSocket got file completion event!');
            ws.close();
            resolve(message.object);
          }
        }
      });
      
      ws.on('error', (error) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.log('❌ WebSocket error:', error.message);
          reject(new Error(`WebSocket error: ${error.message}`));
        }
      });
      
      ws.on('close', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.log('🔌 WebSocket closed without result');
          reject(new Error('WebSocket closed'));
        }
      });
      
    } catch (error) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        console.log('❌ WebSocket creation error:', error.message);
        reject(error);
      }
    }
  });
}

// Polling approach
async function pollForCompletion(fileId, maxWaitTime = 120000) {
  const startTime = Date.now();
  const pollInterval = 2000; // 2 seconds
  let pollCount = 0;
  
  console.log(`🔄 Starting polling for file: ${fileId}`);
  
  while (Date.now() - startTime < maxWaitTime) {
    pollCount++;
    console.log(`🔄 Poll #${pollCount} (${Math.round((Date.now() - startTime) / 1000)}s elapsed)`);
    
    try {
      const response = await fetch(`${SUPERDUPERAI_URL}/api/v1/file/${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPERDUPERAI_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const fileData = await response.json();
        if (fileData.url) {
          console.log(`✅ Polling success! File completed after ${pollCount} polls`);
          return fileData;
        }
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error('❌ Polling error:', error.message);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
  
  throw new Error('Polling timeout - file may still be generating');
}

// Run the test
testProjectWebSocket().then((result) => {
  console.log('');
  console.log('📊 Project WebSocket Test Results');
  console.log('='.repeat(50));
  console.table(result);
  
  if (result.success) {
    console.log(`✅ Project WebSocket test works! Method used: ${result.method}`);
    if (result.method === 'websocket') {
      console.log('🎉 WebSocket events are now working with project_id!');
    } else {
      console.log('💡 WebSocket still not working, but polling provides reliability');
    }
  } else {
    console.log('❌ Project WebSocket test failed completely');
  }
}).catch((error) => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
}); 