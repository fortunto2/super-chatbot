import { getAvailableVideoModels, getAvailableImageModels, configureSuperduperAI } from '../lib/config/superduperai';
import type { ImageGenerationConfig, VideoGenerationConfig } from '../lib/types/media-settings';
import type { IGenerationConfigRead } from '../lib/api/models/IGenerationConfigRead';

// Adapter function to convert OpenAPI model to MediaSettings format
function adaptModelForMediaSettings(model: IGenerationConfigRead): any {
  return {
    ...model,
    id: model.name, // Use name as id for compatibility
    label: model.label || model.name, // Ensure label is always defined
    description: `${model.type} - ${model.source}`,
    value: model.name,
    workflowPath: model.params?.workflow_path || '',
    price: model.params?.price || 0
  };
}

async function testMediaSettingsWithOpenAPI() {
  console.log('🎨 MediaSettings OpenAPI Integration Test');
  console.log('==================================================');
  
  try {
    // Configure client
    configureSuperduperAI();
    
    // Test image models integration
    console.log('\n🖼️  Testing Image Models Integration...');
    const imageModels = await getAvailableImageModels();
    console.log(`✅ Loaded ${imageModels.length} image models`);
    
    // Create mock ImageGenerationConfig with OpenAPI models
    const adaptedImageModels = imageModels.map(adaptModelForMediaSettings);
    const imageConfig: ImageGenerationConfig = {
      type: 'image-generation-settings',
      availableModels: adaptedImageModels,
      availableResolutions: [
        { width: 1024, height: 1024, label: '1024x1024', aspectRatio: '1:1' },
        { width: 1024, height: 768, label: '1024x768', aspectRatio: '4:3' },
        { width: 768, height: 1024, label: '768x1024', aspectRatio: '3:4' }
      ],
      availableStyles: [
        { id: 'realistic', label: 'Realistic', description: 'Photorealistic style' },
        { id: 'artistic', label: 'Artistic', description: 'Artistic interpretation' }
      ],
      availableShotSizes: [
        { id: 'close-up', label: 'Close-up', description: 'Close-up shot' },
        { id: 'medium', label: 'Medium', description: 'Medium shot' }
      ],
      defaultSettings: {
        resolution: { width: 1024, height: 1024, label: '1024x1024', aspectRatio: '1:1' },
        style: { id: 'realistic', label: 'Realistic', description: 'Photorealistic style' },
        shotSize: { id: 'medium', label: 'Medium', description: 'Medium shot' },
        model: adaptedImageModels[0] || {
          name: 'fallback',
          label: 'Fallback Model',
          type: 'text_to_image' as any,
          source: 'local' as any,
          params: {},
          id: 'fallback',
          description: 'Fallback model',
          value: 'fallback',
          workflowPath: '',
          price: 0
        }
      }
    };
    
    console.log('✅ Image config created with models:', imageConfig.availableModels.map(m => m.name));
    
    // Test video models integration
    console.log('\n🎬 Testing Video Models Integration...');
    const videoModels = await getAvailableVideoModels();
    console.log(`✅ Loaded ${videoModels.length} video models`);
    
    // Create mock VideoGenerationConfig with OpenAPI models
    const adaptedVideoModels = videoModels.map(adaptModelForMediaSettings);
    const videoConfig: VideoGenerationConfig = {
      type: 'video-generation-settings',
      availableModels: adaptedVideoModels,
      availableResolutions: [
        { width: 1280, height: 720, label: '1280x720 (HD)', aspectRatio: '16:9' },
        { width: 1920, height: 1080, label: '1920x1080 (Full HD)', aspectRatio: '16:9' }
      ],
      availableStyles: [
        { id: 'cinematic', label: 'Cinematic', description: 'Movie-like style' },
        { id: 'documentary', label: 'Documentary', description: 'Documentary style' }
      ],
      availableShotSizes: [
        { id: 'wide', label: 'Wide Shot', description: 'Wide establishing shot' },
        { id: 'close-up', label: 'Close-up', description: 'Close-up shot' }
      ],
      availableFrameRates: [
        { value: 24, label: '24 FPS (Cinematic)' },
        { value: 30, label: '30 FPS (Standard)' }
      ],
      defaultSettings: {
        resolution: { width: 1280, height: 720, label: '1280x720 (HD)', aspectRatio: '16:9' },
        style: { id: 'cinematic', label: 'Cinematic', description: 'Movie-like style' },
        shotSize: { id: 'wide', label: 'Wide Shot', description: 'Wide establishing shot' },
        model: adaptedVideoModels[0] || {
          name: 'fallback',
          label: 'Fallback Model',
          type: 'text_to_video' as any,
          source: 'local' as any,
          params: {},
          id: 'fallback',
          description: 'Fallback model',
          value: 'fallback',
          workflowPath: '',
          price: 0
        },
        frameRate: 30,
        duration: 10,
        negativePrompt: ''
      }
    };
    
    console.log('✅ Video config created with models:', videoConfig.availableModels.map(m => m.name));
    
    // Test type compatibility
    console.log('\n🔍 Testing Type Compatibility...');
    
    // Check if OpenAPI models are compatible with MediaSettings expectations
    const imageModelSample = imageConfig.availableModels[0];
    const videoModelSample = videoConfig.availableModels[0];
    
    console.log('📋 Image model sample:', {
      name: imageModelSample.name,
      type: imageModelSample.type,
      source: imageModelSample.source,
      hasRequiredFields: !!(imageModelSample.name)
    });
    
    console.log('📋 Video model sample:', {
      name: videoModelSample.name,
      type: videoModelSample.type,
      source: videoModelSample.source,
      hasRequiredFields: !!(videoModelSample.name)
    });
    
    // Test model filtering by type
    const textToImageModels = imageModels.filter(m => m.type === 'text_to_image');
    const imageToImageModels = imageModels.filter(m => m.type === 'image_to_image');
    const textToVideoModels = videoModels.filter(m => m.type === 'text_to_video');
    const imageToVideoModels = videoModels.filter(m => m.type === 'image_to_video');
    
    console.log('\n📊 Model Type Distribution:');
    console.log(`  Text-to-Image: ${textToImageModels.length}`);
    console.log(`  Image-to-Image: ${imageToImageModels.length}`);
    console.log(`  Text-to-Video: ${textToVideoModels.length}`);
    console.log(`  Image-to-Video: ${imageToVideoModels.length}`);
    
    console.log('\n✅ MediaSettings OpenAPI integration test completed successfully!');
    console.log('🎯 Ready for MediaSettings component migration');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testMediaSettingsWithOpenAPI(); 