#!/usr/bin/env node

/**
 * Simple Image Test
 * Tests image generation without project_id to verify API works
 */

// Configuration
const SUPERDUPERAI_TOKEN = process.env.SUPERDUPERAI_TOKEN;
const SUPERDUPERAI_URL = process.env.SUPERDUPERAI_URL || 'https://dev-editor.superduperai.co';

console.log('🎨 Simple Image Test (No Project ID)');
console.log('='.repeat(50));
console.log('🔗 API URL:', SUPERDUPERAI_URL);
console.log('🔑 Token:', SUPERDUPERAI_TOKEN ? `${SUPERDUPERAI_TOKEN.substring(0, 8)}...` : 'NOT SET');
console.log('');

if (!SUPERDUPERAI_TOKEN) {
  console.error('❌ SUPERDUPERAI_TOKEN environment variable is required');
  process.exit(1);
}

async function testSimpleImageGeneration() {
  const payload = {
    // No project_id - let's see what happens
    type: "media",
    template_name: null,
    style_name: "flux_watercolor", // Move style_name outside config
    config: {
      prompt: "A simple test image without project ID",
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
    console.log('🎨 Step 1: Testing Image Generation WITHOUT project_id');
    console.log('-'.repeat(50));
    
    // Make API call
    const response = await fetch(`${SUPERDUPERAI_URL}/api/v1/file/generate-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPERDUPERAI_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('📡 Response Status:', response.status);
    console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ API Success Response:', JSON.stringify(result, null, 2));

    const fileData = result[0];
    const fileId = fileData.id;
    const imageGenerationId = fileData.image_generation_id;
    const projectId = fileData.project_id; // Check if project_id is returned

    console.log('🎯 Generation Details:');
    console.log('  File ID:', fileId);
    console.log('  Image Generation ID:', imageGenerationId);
    console.log('  Project ID from response:', projectId || 'null');
    console.log('  Has URL:', !!fileData.url);
    console.log('');

    // Step 2: Try polling to see if it completes
    console.log('🔄 Step 2: Testing Polling for Completion');
    console.log('-'.repeat(50));
    
    try {
      const completedFile = await pollForCompletion(fileId);
      console.log('🎉 Polling succeeded!');
      console.log('🖼️ Image URL:', completedFile.url);
      
      return {
        success: true,
        method: 'polling',
        fileId,
        imageUrl: completedFile.url,
        projectIdFromResponse: projectId
      };
    } catch (pollError) {
      console.log('❌ Polling failed:', pollError.message);
      return {
        success: false,
        error: pollError.message,
        fileId,
        projectIdFromResponse: projectId
      };
    }

  } catch (error) {
    console.error('❌ Simple image test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
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
        console.log(`📊 File status: URL=${!!fileData.url}, project_id=${fileData.project_id || 'null'}`);
        
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
testSimpleImageGeneration().then((result) => {
  console.log('');
  console.log('📊 Simple Image Test Results');
  console.log('='.repeat(50));
  console.table(result);
  
  if (result.success) {
    console.log('✅ Simple image generation works!');
    console.log('💡 Key findings:');
    console.log('  - API accepts requests without project_id');
    console.log('  - Polling approach works for getting results');
    console.log('  - Project ID from response:', result.projectIdFromResponse || 'none');
    
    if (!result.projectIdFromResponse) {
      console.log('⚠️ No project_id in response - this explains why WebSocket events are not sent!');
      console.log('💡 Solution: We need to pass a valid project_id in the request');
    }
  } else {
    console.log('❌ Simple image generation failed');
  }
}).catch((error) => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
}); 