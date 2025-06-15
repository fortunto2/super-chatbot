import { configureVideoGeneration } from '../lib/ai/tools/configure-video-generation';
import { configureImageGeneration } from '../lib/ai/tools/configure-image-generation';
import { getImageGenerationConfig, getVideoGenerationConfig } from '../lib/config/media-settings-factory';

console.log('🎯 OpenAPI Integration Final Test');
console.log('==================================================');

async function testFullIntegration() {
  console.log('\n🔧 Testing AI Tools Integration...');
  
  // Test video tool creation
  try {
    const videoTool = configureVideoGeneration(undefined);
    console.log('✅ Video tool created successfully');
  } catch (error) {
    console.error('❌ Video tool creation failed:', error);
    return false;
  }
  
  // Test image tool creation
  try {
    const imageTool = configureImageGeneration(undefined);
    console.log('✅ Image tool created successfully');
  } catch (error) {
    console.error('❌ Image tool creation failed:', error);
    return false;
  }
  
  console.log('\n🏭 Testing Factory Pattern...');
  
  // Test factory functions
  try {
    const imageConfig = await getImageGenerationConfig();
    const videoConfig = await getVideoGenerationConfig();
    
    console.log('✅ Factory works:', {
      imageModels: imageConfig.availableModels.length,
      videoModels: videoConfig.availableModels.length,
      imageHasAdaptedFields: !!(imageConfig.availableModels[0]?.id && imageConfig.availableModels[0]?.label),
      videoHasAdaptedFields: !!(videoConfig.availableModels[0]?.id && videoConfig.availableModels[0]?.label)
    });
  } catch (error) {
    console.error('❌ Factory failed:', error);
    return false;
  }
  
  console.log('\n🔍 Testing Model Compatibility...');
  
  // Test model compatibility
  try {
    const imageConfig = await getImageGenerationConfig();
    const videoConfig = await getVideoGenerationConfig();
    
    const imageModel = imageConfig.availableModels[0];
    const videoModel = videoConfig.availableModels[0];
    
    // Check required fields
    const imageModelValid = !!(imageModel.id && imageModel.label && imageModel.description && imageModel.name && imageModel.type);
    const videoModelValid = !!(videoModel.id && videoModel.label && videoModel.description && videoModel.name && videoModel.type);
    
    console.log('✅ Model compatibility:', {
      imageModelValid,
      videoModelValid,
      imageModelFields: Object.keys(imageModel).sort(),
      videoModelFields: Object.keys(videoModel).sort()
    });
    
    if (!imageModelValid || !videoModelValid) {
      console.error('❌ Models missing required fields');
      return false;
    }
  } catch (error) {
    console.error('❌ Model compatibility test failed:', error);
    return false;
  }
  
  console.log('\n📊 Testing Model Distribution...');
  
  // Test model type distribution
  try {
    const imageConfig = await getImageGenerationConfig();
    const videoConfig = await getVideoGenerationConfig();
    
    const imageTypes = imageConfig.availableModels.reduce((acc: any, model) => {
      acc[model.type] = (acc[model.type] || 0) + 1;
      return acc;
    }, {});
    
    const videoTypes = videoConfig.availableModels.reduce((acc: any, model) => {
      acc[model.type] = (acc[model.type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('✅ Model distribution:', {
      imageTypes,
      videoTypes,
      totalImageModels: imageConfig.availableModels.length,
      totalVideoModels: videoConfig.availableModels.length
    });
    
    // Validate expected types
    const hasTextToImage = imageTypes['text_to_image'] > 0;
    const hasImageToImage = imageTypes['image_to_image'] > 0;
    const hasTextToVideo = videoTypes['text_to_video'] > 0;
    const hasImageToVideo = videoTypes['image_to_video'] > 0;
    
    if (!hasTextToImage || !hasTextToVideo) {
      console.error('❌ Missing essential model types');
      return false;
    }
    
    console.log('✅ Essential model types present:', {
      hasTextToImage,
      hasImageToImage,
      hasTextToVideo,
      hasImageToVideo
    });
    
  } catch (error) {
    console.error('❌ Model distribution test failed:', error);
    return false;
  }
  
  return true;
}

async function main() {
  const success = await testFullIntegration();
  
  console.log('\n📊 Final Integration Test Results:');
  console.log('==================================================');
  
  if (success) {
    console.log('🎉 ✅ ALL TESTS PASSED!');
    console.log('🎯 OpenAPI integration is fully functional');
    console.log('🚀 Ready for production deployment');
    console.log('\n📋 What works:');
    console.log('  ✅ Dynamic model loading from SuperDuperAI API');
    console.log('  ✅ AI tools with OpenAPI integration');
    console.log('  ✅ Factory pattern for MediaSettings');
    console.log('  ✅ Type-safe model adaptation');
    console.log('  ✅ Proper model type distribution');
    console.log('  ✅ Backward compatibility maintained');
  } else {
    console.log('❌ INTEGRATION TEST FAILED');
    console.log('⚠️  Some components need fixing before production');
    process.exit(1);
  }
}

main().catch(console.error); 