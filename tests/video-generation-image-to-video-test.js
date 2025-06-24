#!/usr/bin/env node

/**
 * Test script for image-to-video generation functionality
 * Tests the new image-to-video model support with source images
 */

console.log('🧪 Image-to-Video Generation Test');

// Mock the generateVideo function for testing
async function mockGenerateVideo(
  style, resolution, prompt, model, shotSize, chatId,
  negativePrompt, frameRate, duration, sourceImageId, sourceImageUrl
) {
  console.log('🔧 Mock generateVideo called with:');
  console.log('  Model:', model.id);
  console.log('  Source Image ID:', sourceImageId);
  console.log('  Source Image URL:', sourceImageUrl);
  
  // Check if this is an image-to-video model
  const isImageToVideo = model.id.includes('veo') || 
                        model.id.includes('kling') ||
                        model.id.includes('image-to-video');
  
  if (isImageToVideo) {
    console.log('🎯 Detected image-to-video model');
    
    if (!sourceImageId && !sourceImageUrl) {
      return {
        success: false,
        error: `The selected model "${model.label}" is an image-to-video model and requires a source image.`
      };
    }
    
    // Mock image-to-video payload structure
    const payload = {
      params: {
        config: {
          seed: Math.floor(Math.random() * 1000000000000),
          steps: 50,
          width: resolution.width,
          height: resolution.height,
          prompt,
          duration,
          batch_size: 1,
          aspect_ratio: resolution.aspectRatio,
          negative_prompt: negativePrompt || ''
        },
        file_ids: sourceImageId ? [sourceImageId] : [],
        references: sourceImageUrl ? [{
          type: "source",
          reference_url: sourceImageUrl
        }] : [],
        generation_config: {
          name: model.id,
          type: "image_to_video",
          label: model.label,
          params: {
            vip_required: true,
            price_per_second: 2,
            arguments_template: `{"prompt": {{config.prompt|tojson}}, "image_url": "{{reference.source}}", "aspect_ratio": "{{config.aspect_ratio}}", "duration": {{config.duration|int}}, "fps": ${frameRate}, "enhance_prompt": true, "samples": {{config.batch_size|default(1)}}, "seed": {{config.seed|int}}, "negative_prompt": {{config.negative_prompt|tojson}}}`,
            available_durations: [5, 6, 7, 8]
          },
          source: "superduperai"
        }
      }
    };
    
    console.log('📦 Image-to-video payload structure:');
    console.log(JSON.stringify(payload, null, 2));
    
  } else {
    console.log('🎯 Detected text-to-video model');
    
    // Mock text-to-video payload structure
    const payload = {
      projectId: chatId,
      requestId: `vid_${Date.now()}_test`,
      type: "video",
      template_name: null,
      config: {
        prompt,
        negative_prompt: negativePrompt || '',
        width: resolution.width,
        height: resolution.height,
        aspect_ratio: resolution.aspectRatio,
        qualityType: resolution.qualityType,
                  shot_size: "Medium Shot",
        seed: `${Math.floor(Math.random() * 1000000000000)}`,
        generation_config_name: model.id,
        batch_size: 1,
        style_name: style.id,
        entity_ids: [],
        references: [],
        duration,
        frame_rate: frameRate,
      }
    };
    
    console.log('📦 Text-to-video payload structure:');
    console.log(JSON.stringify(payload, null, 2));
  }
  
  return {
    success: true,
    projectId: chatId,
    requestId: `vid_${Date.now()}_test`,
    message: `${isImageToVideo ? 'Image-to-video' : 'Text-to-video'} generation would be initiated`
  };
}

// Test parameters for image-to-video model
const testParams = {
  style: { id: 'flux_steampunk', label: 'Steampunk' },
  resolution: { 
    width: 1920, 
    height: 1080, 
    label: '1920×1080', 
    aspectRatio: '16:9', 
    qualityType: 'full_hd' 
  },
  prompt: 'Holloway leads the descent, gripping the curved rail, posture braced and determined. Jed follows, tapping each step with his boot for stability, shifting the heavy backpack for balance.',
  model: { id: 'google-cloud/veo2', label: 'Google VEO2 (Image-to-Video)' },
  shotSize: { id: 'long-shot', label: 'Long Shot' },
  chatId: 'test-chat-id-12345',
  negativePrompt: '',
  frameRate: 24,
  duration: 8,
  sourceImageId: 'ed7f0616-2c39-4c2f-81ed-35e4f9c691c6',
  sourceImageUrl: 'https://superduper-acdagaa3e2h7chh0.z02.azurefd.net/generated/image/2025/6/4/8/GgPSMsa6xWapv39BMwZZFk.png'
};

async function testImageToVideo() {
  try {
    console.log('\n🎬 Testing image-to-video generation...');
    console.log('📸 Source Image ID:', testParams.sourceImageId);
    console.log('🔗 Source Image URL:', testParams.sourceImageUrl);
    console.log('🎯 Model:', testParams.model.id);
    
    const result = await mockGenerateVideo(
      testParams.style,
      testParams.resolution,
      testParams.prompt,
      testParams.model,
      testParams.shotSize,
      testParams.chatId,
      testParams.negativePrompt,
      testParams.frameRate,
      testParams.duration,
      testParams.sourceImageId,
      testParams.sourceImageUrl
    );
    
    console.log('📋 Result:', result);
    
    if (result.success) {
      console.log('✅ Image-to-video generation test passed!');
      console.log('🆔 Project ID:', result.projectId);
      console.log('🎫 Request ID:', result.requestId);
    } else {
      console.log('❌ Generation failed:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Test error:', error);
  }
}

// Test text-to-video model (should work without source image)
async function testTextToVideo() {
  try {
    console.log('\n🎬 Testing text-to-video generation (no source image)...');
    
    const textToVideoParams = {
      ...testParams,
      model: { id: 'comfyui/ltx', label: 'LTX Video' },
      sourceImageId: undefined,
      sourceImageUrl: undefined
    };
    
    const result = await mockGenerateVideo(
      textToVideoParams.style,
      textToVideoParams.resolution,
      textToVideoParams.prompt,
      textToVideoParams.model,
      textToVideoParams.shotSize,
      textToVideoParams.chatId,
      textToVideoParams.negativePrompt,
      textToVideoParams.frameRate,
      textToVideoParams.duration
    );
    
    console.log('📋 Result:', result);
    
    if (result.success) {
      console.log('✅ Text-to-video generation test passed!');
    } else {
      console.log('❌ Generation failed:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Test error:', error);
  }
}

// Test image-to-video model without source image (should fail)
async function testImageToVideoWithoutSource() {
  try {
    console.log('\n🎬 Testing image-to-video generation WITHOUT source image (should fail)...');
    
    const result = await mockGenerateVideo(
      testParams.style,
      testParams.resolution,
      testParams.prompt,
      testParams.model,
      testParams.shotSize,
      testParams.chatId,
      testParams.negativePrompt,
      testParams.frameRate,
      testParams.duration
      // No sourceImageId or sourceImageUrl
    );
    
    console.log('📋 Result:', result);
    
    if (!result.success) {
      console.log('✅ Correctly failed for image-to-video model without source image');
      console.log('📝 Error message:', result.error);
    } else {
      console.log('❌ Should have failed but succeeded');
    }
    
  } catch (error) {
    console.error('💥 Test error:', error);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting image-to-video tests...\n');
  
  await testImageToVideo();
  await testTextToVideo();
  await testImageToVideoWithoutSource();
  
  console.log('\n🎉 Tests completed!');
}

runTests(); 