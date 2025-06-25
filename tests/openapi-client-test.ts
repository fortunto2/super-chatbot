import { getAvailableVideoModels, getAvailableImageModels, configureSuperduperAI } from '../lib/config/superduperai';

async function testOpenAPIClient() {
  console.log('🔧 OpenAPI Client Test');
  console.log('==================================================');
  
  try {
    // Set up environment
    process.env.SUPERDUPERAI_URL = process.env.SUPERDUPERAI_URL || 'https://dev-editor.superduperai.co';
    process.env.SUPERDUPERAI_TOKEN = process.env.SUPERDUPERAI_TOKEN || 'test-token-placeholder';
    
    console.log('🔗 API URL:', process.env.SUPERDUPERAI_URL);
    console.log('🔑 Token:', process.env.SUPERDUPERAI_TOKEN ? 'SET' : 'NOT SET');
    
    if (!process.env.SUPERDUPERAI_TOKEN || process.env.SUPERDUPERAI_TOKEN === 'test-token-placeholder') {
      console.log('⚠️  Warning: Using placeholder token. Set SUPERDUPERAI_TOKEN for real API calls.');
    }
    
    // Configure client
    console.log('\n🔧 Configuring OpenAPI client...');
    const config = configureSuperduperAI();
    console.log('✅ Client configured:', config);
    
    // Test video models
    console.log('\n🎬 Testing video models...');
    try {
      const videoModels = await getAvailableVideoModels();
      console.log('✅ Video models loaded:', videoModels.length);
      
      if (videoModels.length > 0) {
        console.log('📋 Video models:');
        videoModels.forEach((model, index) => {
          console.log(`  ${index + 1}. ${model.name} (${model.type}) - ${model.source}`);
        });
      }
    } catch (error: any) {
      console.log('❌ Video models error:', error.message);
    }
    
    // Test image models
    console.log('\n🎨 Testing image models...');
    try {
      const imageModels = await getAvailableImageModels();
      console.log('✅ Image models loaded:', imageModels.length);
      
      if (imageModels.length > 0) {
        console.log('📋 Image models:');
        imageModels.forEach((model, index) => {
          console.log(`  ${index + 1}. ${model.name} (${model.type}) - ${model.source}`);
        });
      }
    } catch (error: any) {
      console.log('❌ Image models error:', error.message);
    }
    
    console.log('\n✅ OpenAPI client test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testOpenAPIClient(); 