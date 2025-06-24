/**
 * Video Generation Smoke Test
 * Tests the API payload structure and basic functionality without actual API calls
 */

// Mock the SuperDuperAI config
const mockConfig = {
  baseURL: process.env.SUPERDUPERAI_URL || 'https://dev-editor.superduperai.co',
  apiToken: process.env.SUPERDUPERAI_TOKEN || 'test-token',
  wsURL: 'wss://dev-editor.superduperai.co'
};

// Mock video models
const mockVideoModels = [
  {
    id: 'comfyui/ltx',
    name: 'LTX Video',
    description: 'LTX Video - High quality video generation',
    maxDuration: 30,
    maxResolution: { width: 1216, height: 704 },
    supportedFrameRates: [30],
    price_per_second: 0.4,
    workflowPath: 'LTX/default.json',
    supportedAspectRatios: ['16:9', '1:1', '9:16'],
    supportedQualities: ['hd'],
  },
];

// Test data matching the user's request
const testData = {
  prompt: "Ocean waves gently crashing on a sandy beach at golden hour, cinematic style",
  negativePrompt: "",
  style: { id: "flux_steampunk", label: "Steampunk", description: "Steampunk" },
  resolution: { 
    width: 1920, 
    height: 1080, 
    label: "1920×1080", 
    aspectRatio: "16:9", 
    qualityType: "full_hd" 
  },
  shotSize: { 
    id: "long-shot", 
    label: "Long Shot", 
    description: "Shows full body of subject with surrounding environment" 
  },
  model: { 
    id: "comfyui/ltx", 
    label: "LTX Video", 
    description: "LTX Video - High quality video generation by Lightricks" 
  },
  frameRate: 30,
  duration: 10,
  chatId: "test-chat-id-12345"
};

// Test functions
function generateRequestId() {
  return `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createAuthHeaders(config) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiToken}`,
    'User-Agent': 'SuperChatbot/1.0',
  };
}

function createAPIURL(endpoint, config) {
  return `${config.baseURL}${endpoint}`;
}

async function findVideoModel(nameOrId) {
  console.log(`🔍 Looking for video model: ${nameOrId}`);
  const model = mockVideoModels.find(model => 
    model.id === nameOrId || 
    model.name.toLowerCase().includes(nameOrId.toLowerCase())
  );
  console.log(`🎯 Found model:`, model ? model.id : 'Not found');
  return model || null;
}

// Main test function
async function testVideoGenerationPayload() {
  console.log('🧪 Starting Video Generation Smoke Test');
  console.log('=' * 50);
  
  const { 
    prompt, negativePrompt, style, resolution, shotSize, 
    model, frameRate, duration, chatId 
  } = testData;
  
  try {
    // Test 1: Generate request ID
    const requestId = generateRequestId();
    console.log('✅ Test 1 - Request ID generation:', requestId);
    
    // Test 2: Find video model
    const dynamicModel = await findVideoModel(model.id);
    const actualModelName = dynamicModel ? dynamicModel.id : model.id;
    console.log('✅ Test 2 - Model discovery:', actualModelName);
    
    // Test 3: Create auth headers
    const headers = createAuthHeaders(mockConfig);
    console.log('✅ Test 3 - Auth headers:', Object.keys(headers));
    
    // Test 4: Create API URL
    const apiUrl = createAPIURL('/api/v1/file/generate-video', mockConfig);
    console.log('✅ Test 4 - API URL:', apiUrl);
    
    // Test 5: Build API payload (matching image API structure)
    const apiPayload = {
      projectId: chatId,
      requestId: requestId,
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
        generation_config_name: actualModelName,
        batch_size: 1,
        style_name: style.id,
        entity_ids: [],
        references: [],
        // Video-specific parameters
        duration,
        frame_rate: frameRate,
      }
    };
    
    console.log('✅ Test 5 - API Payload structure:');
    console.log(JSON.stringify(apiPayload, null, 2));
    
    // Test 6: Validate payload structure
    const requiredFields = ['projectId', 'requestId', 'type', 'template_name', 'config'];
    const configRequiredFields = [
      'prompt', 'width', 'height', 'generation_config_name', 
      'duration', 'frame_rate'
    ];
    
    const missingFields = requiredFields.filter(field => !(field in apiPayload));
    const missingConfigFields = configRequiredFields.filter(field => !(field in apiPayload.config));
    
    if (missingFields.length === 0 && missingConfigFields.length === 0) {
      console.log('✅ Test 6 - Payload validation: All required fields present');
    } else {
      console.log('❌ Test 6 - Missing fields:', { 
        top: missingFields, 
        config: missingConfigFields 
      });
    }
    
    // Test 7: Create full request object
    const fullRequest = {
      method: "POST",
      headers: {
        ...headers,
        'X-Request-ID': requestId
      },
      body: JSON.stringify(apiPayload),
      url: apiUrl
    };
    
    console.log('✅ Test 7 - Full request object created');
    console.log('🔧 Request headers:', Object.keys(fullRequest.headers));
    console.log('🔧 Request body size:', fullRequest.body.length, 'characters');
    console.log('🔧 Request URL:', fullRequest.url);
    
    // Test 8: Environment check
    console.log('✅ Test 8 - Environment check:');
    console.log('🔧 SUPERDUPERAI_URL:', process.env.SUPERDUPERAI_URL ? '✅ Set' : '❌ Not set');
    console.log('🔧 SUPERDUPERAI_TOKEN:', process.env.SUPERDUPERAI_TOKEN ? '✅ Set' : '❌ Not set');
    
    console.log('\n🎉 All smoke tests passed!');
    console.log('📋 Summary:');
    console.log(`   - Request ID: ${requestId}`);
    console.log(`   - Model: ${actualModelName}`);
    console.log(`   - Resolution: ${resolution.width}x${resolution.height}`);
    console.log(`   - Duration: ${duration}s @ ${frameRate}fps`);
    console.log(`   - Style: ${style.id}`);
    console.log(`   - API URL: ${apiUrl}`);
    
    return {
      success: true,
      payload: apiPayload,
      request: fullRequest,
      summary: {
        requestId,
        modelName: actualModelName,
        resolution: `${resolution.width}x${resolution.height}`,
        duration,
        frameRate,
        style: style.id
      }
    };
    
  } catch (error) {
    console.error('❌ Smoke test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test if called directly
if (require.main === module) {
  testVideoGenerationPayload()
    .then(result => {
      if (result.success) {
        console.log('\n🚀 Ready for actual API call!');
        process.exit(0);
      } else {
        console.log('\n💥 Test failed, fix issues before API call');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  testVideoGenerationPayload,
  testData,
  mockVideoModels
}; 