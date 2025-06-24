// Test for typed clients with OpenAPI models
const API_BASE = 'http://localhost:3000';

async function testTypedClients() {
  console.log('🧪 Testing typed clients with OpenAPI models...');
  
  // Test 1: Image generation with correct format
  console.log('\n🖼️ Testing image generation...');
  try {
    const imagePayload = {
      prompt: "A beautiful sunset over mountains",
      model: { name: "comfyui/flux" },
      resolution: { width: 512, height: 512 },
      shotSize: { id: "Medium Shot" },
      chatId: "typed-client-test",
      seed: Math.floor(Math.random() * 1000000)
    };

    const imageResponse = await fetch(`${API_BASE}/api/generate/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(imagePayload)
    });
    
    if (imageResponse.ok) {
      const imageResult = await imageResponse.json();
      console.log('✅ Image generation:', imageResult.success ? 'SUCCESS' : 'FAILED');
      console.log('📝 Image result:', imageResult);
      
      // Test file status with typed response
      if (imageResult.fileId) {
        console.log('\n📁 Testing file status with typed response...');
        const fileResponse = await fetch(`${API_BASE}/api/file/${imageResult.fileId}`);
        
        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          console.log('✅ File status: SUCCESS');
          console.log('📝 File data structure:', {
            id: fileData.id,
            url: fileData.url ? 'present' : 'null',
            type: fileData.type,
            tasks: fileData.tasks ? `${fileData.tasks.length} tasks` : 'no tasks'
          });
        } else {
          console.log('❌ File status failed:', fileResponse.status);
        }
      }
    } else {
      console.log('❌ Image generation failed:', imageResponse.status);
      const errorText = await imageResponse.text();
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.log('❌ Image test error:', error.message);
  }
  
  // Test 2: Video generation with correct format
  console.log('\n🎬 Testing video generation...');
  try {
    const videoPayload = {
      prompt: "A serene lake with gentle waves",
      model: { name: "comfyui/ltx" },
      resolution: { width: 512, height: 512, aspectRatio: "1:1" },
      chatId: "typed-client-test",
      duration: 5
    };

    const videoResponse = await fetch(`${API_BASE}/api/generate/video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(videoPayload)
    });
    
    if (videoResponse.ok) {
      const videoResult = await videoResponse.json();
      console.log('✅ Video generation:', videoResult.success ? 'SUCCESS' : 'FAILED');
      console.log('📝 Video result:', videoResult);
    } else {
      console.log('❌ Video generation failed:', videoResponse.status);
      const errorText = await videoResponse.text();
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.log('❌ Video test error:', error.message);
  }
  
  console.log('\n🎉 Typed client tests completed!');
}

testTypedClients(); 