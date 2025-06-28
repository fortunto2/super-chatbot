#!/usr/bin/env node

/**
 * Test script for video generation source image fix
 * Tests that source images are properly passed via references instead of direct URL strings
 */

console.log('🧪 Video Generation Source Image Fix Test');

// Test with image-to-video model and source image
const testParams = {
  prompt: 'A beautiful sunset over the ocean with waves gently crashing',
  model: { 
    id: 'google-cloud/veo2',
    name: 'google-cloud/veo2', 
    label: 'Google VEO2 (Image-to-Video)' 
  },
  style: { id: 'flux_steampunk', label: 'Steampunk' },
  resolution: { 
    width: 1920, 
    height: 1080, 
    label: '1920×1080', 
    aspectRatio: '16:9', 
    qualityType: 'full_hd' 
  },
  shotSize: { id: 'long-shot', label: 'Long Shot' },
  duration: 5,
  frameRate: 24,
  negativePrompt: '',
  sourceImageId: 'test-image-id-123',
  sourceImageUrl: 'https://example.com/test-image.jpg'
};

async function testVideoGenerationWithSourceImage() {
  try {
    console.log('\n🎬 Testing video generation with source image...');
    console.log('📸 Source Image ID:', testParams.sourceImageId);
    console.log('🔗 Source Image URL:', testParams.sourceImageUrl);
    console.log('🎯 Model:', testParams.model.name);
    
    // Import the fixed generateVideoHybrid function
    const { generateVideoHybrid } = await import('../lib/ai/api/generate-video.ts');
    
    const result = await generateVideoHybrid(
      testParams.prompt,
      testParams.model,
      testParams.style,
      testParams.resolution,
      testParams.shotSize,
      testParams.duration,
      testParams.frameRate,
      testParams.negativePrompt,
      testParams.sourceImageId,
      testParams.sourceImageUrl
    );
    
    console.log('📋 Result:', result);
    
    if (result.success) {
      console.log('✅ Video generation with source image test passed!');
      console.log('🆔 Project ID:', result.projectId);
      console.log('🎫 Request ID:', result.requestId);
      console.log('📁 File ID:', result.fileId);
      
      if (result.fileId) {
        console.log('✅ FileId properly returned - SSE/polling should work');
      } else {
        console.log('⚠️ No fileId returned - SSE/polling may not work');
      }
    } else {
      console.log('❌ Generation failed:', result.error);
      
      // Check if error is the ComfyUI 'str' object error
      if (result.error?.includes("'str' object has no attribute 'read'")) {
        console.log('💥 CRITICAL: Still getting ComfyUI error - fix not working!');
      } else {
        console.log('ℹ️ Different error - may be API/auth related');
      }
    }
    
  } catch (error) {
    console.error('💥 Test error:', error);
    
    // Check for specific error types
    if (error.message?.includes("'str' object has no attribute 'read'")) {
      console.log('💥 CRITICAL: ComfyUI error still present in exception!');
    }
  }
}

// Test without source image (text-to-video)
async function testVideoGenerationWithoutSourceImage() {
  try {
    console.log('\n🎬 Testing text-to-video generation (no source image)...');
    
    const textToVideoParams = {
      ...testParams,
      model: { 
        id: 'comfyui/ltx', 
        name: 'comfyui/ltx',
        label: 'LTX Video' 
      },
      sourceImageId: undefined,
      sourceImageUrl: undefined
    };
    
    const { generateVideoHybrid } = await import('../lib/ai/api/generate-video.ts');
    
    const result = await generateVideoHybrid(
      textToVideoParams.prompt,
      textToVideoParams.model,
      textToVideoParams.style,
      textToVideoParams.resolution,
      textToVideoParams.shotSize,
      textToVideoParams.duration,
      textToVideoParams.frameRate,
      textToVideoParams.negativePrompt
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

// Run both tests
async function runAllTests() {
  console.log('🧪 Starting video generation source image fix tests...\n');
  
  await testVideoGenerationWithSourceImage();
  await testVideoGenerationWithoutSourceImage();
  
  console.log('\n✅ All tests completed!');
  console.log('\n📝 Summary:');
  console.log('- Fixed generateVideoHybrid to use OpenAPI FileService instead of direct fetch');
  console.log('- Source images now passed via references with ReferenceTypeEnum.SOURCE');
  console.log('- Should eliminate ComfyUI "str object has no attribute read" errors');
  console.log('- Same approach as working /api/generate/video route');
}

runAllTests().catch(console.error); 