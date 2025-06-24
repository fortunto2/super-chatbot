// Test for models client with OpenAPI integration
const API_BASE = 'http://localhost:3000';

async function testModelsAPI() {
  console.log('🧪 Testing Models API with styles...');
  
  try {
    const response = await fetch('http://localhost:3001/api/config/models', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('📊 Models API Response Structure:');
    console.log(`- Success: ${data.success}`);
    console.log(`- Image Models: ${data.data?.imageModels?.length || 0}`);
    console.log(`- Video Models: ${data.data?.videoModels?.length || 0}`);
    console.log(`- Styles: ${data.data?.styles?.length || 0}`);
    
    if (data.data?.imageModels && data.data.imageModels.length > 0) {
      console.log('\n🖼️ Sample Image Models:');
      data.data.imageModels.slice(0, 3).forEach(model => {
        console.log(`  - ${model.name}: ${model.label} (${model.type})`);
      });
    }
    
    if (data.data?.videoModels && data.data.videoModels.length > 0) {
      console.log('\n🎬 Sample Video Models:');
      data.data.videoModels.slice(0, 3).forEach(model => {
        console.log(`  - ${model.name}: ${model.label} (${model.type})`);
      });
    }
    
    if (data.data?.styles && data.data.styles.length > 0) {
      console.log('\n🎨 Sample Styles:');
      data.data.styles.slice(0, 5).forEach(style => {
        console.log(`  - ${style.id}: ${style.label} ${style.thumbnail ? '(has thumbnail)' : '(no thumbnail)'}`);
      });
      
      // Count styles with thumbnails
      const stylesWithThumbnails = data.data.styles.filter(s => s.thumbnail).length;
      console.log(`\n📸 Styles with thumbnails: ${stylesWithThumbnails}/${data.data.styles.length}`);
    }
    
    console.log('\n✅ Models API test completed successfully!');
    
  } catch (error) {
    console.error('❌ Models API test failed:', error.message);
  }
}

testModelsAPI(); 