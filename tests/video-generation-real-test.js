/**
 * Video Generation Real API Test
 * Tests the actual API call to SuperDuperAI (optional with --live flag)
 */

const { testVideoGenerationPayload, testData } = require('./video-generation-smoke-test');

// Check if we should make real API calls
const isLiveTest = process.argv.includes('--live');
const isDryRun = process.argv.includes('--dry-run') || !isLiveTest;

// Function to make actual API call
async function makeRealAPICall(payload, url, headers) {
  console.log('🌐 Making real API call to:', url);
  
  try {
    // Use fetch (Node.js 18+ or with fetch polyfill)
    const fetch = global.fetch || require('node-fetch');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });
    
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = responseText;
    }
    
    console.log('📡 API Response Status:', response.status, response.statusText);
    console.log('📡 API Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('📡 API Response Body:', responseData);
    
    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
      rawText: responseText
    };
    
  } catch (error) {
    console.error('❌ API call failed:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

// Main test function
async function runRealTest() {
  console.log('🧪 Video Generation Real API Test');
  console.log(`🔧 Mode: ${isDryRun ? 'DRY RUN (no actual API calls)' : 'LIVE TEST (real API calls)'}`);
  console.log('=' * 60);
  
  // First run smoke test
  console.log('🔥 Running smoke test first...');
  const smokeResult = await testVideoGenerationPayload();
  
  if (!smokeResult.success) {
    console.error('❌ Smoke test failed, aborting real test');
    return { success: false, error: 'Smoke test failed' };
  }
  
  console.log('✅ Smoke test passed, proceeding to real test...\n');
  
  // Check environment variables
  if (!process.env.SUPERDUPERAI_TOKEN && !isDryRun) {
    console.error('❌ SUPERDUPERAI_TOKEN environment variable is required for live test');
    console.log('💡 Tip: export SUPERDUPERAI_TOKEN="your-token-here"');
    return { success: false, error: 'Missing API token' };
  }
  
  if (!process.env.SUPERDUPERAI_URL && !isDryRun) {
    console.log('⚠️  SUPERDUPERAI_URL not set, using default: https://dev-editor.superduperai.co');
  }
  
  // Get the payload from smoke test
  const { payload, request } = smokeResult;
  
  console.log('🚀 Prepared request for real API:');
  console.log('📍 URL:', request.url);
  console.log('📦 Payload preview:');
  console.log('   - Type:', payload.type);
  console.log('   - Project ID:', payload.projectId);
  console.log('   - Request ID:', payload.requestId);
  console.log('   - Model:', payload.config.generation_config_name);
  console.log('   - Resolution:', `${payload.config.width}x${payload.config.height}`);
  console.log('   - Duration:', `${payload.config.duration}s @ ${payload.config.frame_rate}fps`);
  console.log('   - Style:', payload.config.style_name);
  console.log('   - Prompt:', `${payload.config.prompt.substring(0, 50)}...`);
  
  if (isDryRun) {
    console.log('\n🔍 DRY RUN - Would send this request:');
    console.log('```json');
    console.log(JSON.stringify(payload, null, 2));
    console.log('```');
    console.log('\n💡 To make real API call, run: node tests/video-generation-real-test.js --live');
    return { 
      success: true, 
      message: 'Dry run completed successfully',
      payload,
      wouldCallUrl: request.url
    };
  }
  
  // Make real API call
  console.log('\n🌐 Making real API call...');
  const apiResult = await makeRealAPICall(payload, request.url, request.headers);
  
  // Analyze results
  console.log('\n📊 API Call Results:');
  if (apiResult.success) {
    console.log('✅ API call successful!');
    console.log('🎬 Video generation should be starting...');
    
    if (apiResult.data?.id) {
      console.log('🆔 Project ID:', apiResult.data.id);
    }
    
    if (apiResult.data?.files) {
      console.log('📁 Files:', apiResult.data.files.length);
    }
    
  } else {
    console.log('❌ API call failed');
    console.log('🔍 Status:', apiResult.status);
    console.log('🔍 Error:', apiResult.error || apiResult.statusText);
    
    // Try to provide helpful debugging info
    if (apiResult.status === 401) {
      console.log('💡 Check your SUPERDUPERAI_TOKEN');
    } else if (apiResult.status === 404) {
      console.log('💡 Check the API endpoint URL');
    } else if (apiResult.status === 400) {
      console.log('💡 Check the request payload structure');
      console.log('📋 Response details:', apiResult.data);
    }
  }
  
  return {
    success: apiResult.success,
    apiResult,
    payload,
    request: {
      url: request.url,
      method: 'POST',
      headers: Object.keys(request.headers)
    }
  };
}

// Run test if called directly
if (require.main === module) {
  runRealTest()
    .then(result => {
      console.log(`\n${'='.repeat(60)}`);
      if (result.success) {
        console.log('🎉 Test completed successfully!');
        process.exit(0);
      } else {
        console.log('💥 Test failed');
        console.error('Error:', result.error || 'Unknown error');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
} else {
  console.log('💡 Usage:');
  console.log('  node tests/video-generation-real-test.js           # Dry run');
  console.log('  node tests/video-generation-real-test.js --live    # Real API call');
}

module.exports = {
  runRealTest,
  makeRealAPICall
}; 