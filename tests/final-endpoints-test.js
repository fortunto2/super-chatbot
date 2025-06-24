// Final test for all endpoints after fixes
const API_BASE = 'http://localhost:3000';

async function testAllEndpoints() {
  console.log('🧪 Testing all fixed endpoints...');
  
  // Test 1: Video generation
  console.log('\n🎬 Testing video generation...');
  try {
    const videoResponse = await fetch(`${API_BASE}/api/generate/video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: "A beautiful sunset",
        model: { name: "comfyui/ltx" },
        resolution: { width: 512, height: 512, aspectRatio: "1:1" },
        chatId: "test-video",
        duration: 5
      })
    });
    
    if (videoResponse.ok) {
      const videoResult = await videoResponse.json();
      console.log('✅ Video generation:', videoResult.success ? 'SUCCESS' : 'FAILED');
      
      // Test file status endpoint if we got a fileId
      if (videoResult.fileId) {
        console.log('\n📁 Testing file status endpoint...');
        const fileResponse = await fetch(`${API_BASE}/api/file/${videoResult.fileId}`);
        console.log('📁 File status:', fileResponse.ok ? 'SUCCESS' : 'FAILED');
      }
    } else {
      console.log('❌ Video generation failed:', videoResponse.status);
    }
  } catch (error) {
    console.log('❌ Video test error:', error.message);
  }
  
  // Test 2: Image generation  
  console.log('\n🖼️ Testing image generation...');
  try {
    const imageResponse = await fetch(`${API_BASE}/api/generate/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: "A beautiful sunset",
        model: { name: "comfyui/flux" },
        resolution: { width: 512, height: 512 },
        chatId: "test-image"
      })
    });
    
    if (imageResponse.ok) {
      const imageResult = await imageResponse.json();
      console.log('✅ Image generation:', imageResult.success ? 'SUCCESS' : 'FAILED');
    } else {
      console.log('❌ Image generation failed:', imageResponse.status);
    }
  } catch (error) {
    console.log('❌ Image test error:', error.message);
  }
  
  console.log('\n🎉 All tests completed!');
}

testAllEndpoints(); 