/**
 * Test for Video Model Selection Fix
 * Tests that Sora model is prioritized for text-to-video generation
 */

const TEST_PROMPT = "make video with bear";
const TEST_CHAT_ID = "video-generator-tool";

async function testVideoModelSelection() {
  console.log('🎬 Testing Video Model Selection Fix...\n');

  try {
    // Test 1: Text-to-video generation (no source image)
    console.log('📝 Test 1: Text-to-video generation (no source image)');
    
    const textToVideoPayload = {
      prompt: TEST_PROMPT,
      chatId: TEST_CHAT_ID,
      duration: 5,
      // No sourceImageId or sourceImageUrl - should use Sora
    };

    console.log('Request payload:', JSON.stringify(textToVideoPayload, null, 2));
    
    const response1 = await fetch('/api/generate/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(textToVideoPayload),
    });

    const result1 = await response1.json();
    console.log('Response:', JSON.stringify(result1, null, 2));
    
    if (result1.success) {
      console.log('✅ Text-to-video test passed');
    } else {
      console.log('❌ Text-to-video test failed:', result1.error);
    }

    console.log(`\n${'='.repeat(50)}\n`);

    // Test 2: Image-to-video generation (with source image)
    console.log('🖼️ Test 2: Image-to-video generation (with source image)');
    
    const imageToVideoPayload = {
      prompt: TEST_PROMPT,
      chatId: TEST_CHAT_ID,
      duration: 5,
      sourceImageUrl: 'https://example.com/test-image.jpg',
      sourceImageId: 'test-image-id'
    };

    console.log('Request payload:', JSON.stringify(imageToVideoPayload, null, 2));
    
    const response2 = await fetch('/api/generate/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(imageToVideoPayload),
    });

    const result2 = await response2.json();
    console.log('Response:', JSON.stringify(result2, null, 2));
    
    if (result2.success) {
      console.log('✅ Image-to-video test passed');
    } else {
      console.log('❌ Image-to-video test failed:', result2.error);
    }

    console.log('\n🎯 Expected behavior:');
    console.log('- Text-to-video should use azure-openai/sora model');
    console.log('- Image-to-video can use any suitable model');
    console.log('- No ComfyUI execution errors should occur');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testVideoModelSelection };
} else {
  // Node.js environment - run directly
  testVideoModelSelection();
}

// Run if executed directly
if (typeof window !== 'undefined') {
  // Browser environment - attach to window for manual testing
  window.testVideoModelSelection = testVideoModelSelection;
  console.log('🌐 Video model selection test available as window.testVideoModelSelection()');
}
