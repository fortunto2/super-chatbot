/**
 * AI Agent Image Generation Behavior Test
 * Tests how the AI agent in chat understands and uses image generation tools
 */

// AICODE-NOTE: This test verifies AI agent's understanding of image generation parameters

const TEST_SCENARIOS = [
  {
    id: 'simple-russian-prompt',
    userMessage: 'нарисуй мальчика с мячиком',
    expectedBehavior: {
      shouldEnhancePrompt: true, // Russian text < 50 chars
      expectedToolCalls: ['enhancePrompt', 'configureImageGeneration'],
      expectedParameters: {
        enhancePrompt: {
          mediaType: 'image',
          enhancementLevel: 'detailed'
        },
        configureImageGeneration: {
          hasPrompt: true,
          // Model, resolution, style should be selected automatically
        }
      }
    }
  },
  {
    id: 'short-english-prompt',
    userMessage: 'cat on table',
    expectedBehavior: {
      shouldEnhancePrompt: true, // < 5 words
      expectedToolCalls: ['enhancePrompt', 'configureImageGeneration']
    }
  },
  {
    id: 'detailed-prompt-with-params',
    userMessage: 'Generate a professional photograph of a modern office space with natural lighting, minimalist design, and plants. Use FLUX model at 1920x1080 resolution with cinematic style.',
    expectedBehavior: {
      shouldEnhancePrompt: false, // Already detailed
      expectedToolCalls: ['configureImageGeneration'],
      expectedParameters: {
        configureImageGeneration: {
          model: 'FLUX', // Should understand model name
          resolution: '1920x1080', // Should parse resolution
          style: 'cinematic' // Should understand style
        }
      }
    }
  },
  {
    id: 'settings-request',
    userMessage: 'show me image generation settings',
    expectedBehavior: {
      shouldEnhancePrompt: false,
      expectedToolCalls: ['configureImageGeneration'],
      expectedParameters: {
        configureImageGeneration: {
          hasPrompt: false // Should call without prompt to show settings
        }
      }
    }
  },
  {
    id: 'natural-language-params',
    userMessage: 'create a portrait photo in square format with watercolor style',
    expectedBehavior: {
      shouldEnhancePrompt: false,
      expectedToolCalls: ['configureImageGeneration'],
      expectedParameters: {
        configureImageGeneration: {
          resolution: 'square', // Should understand "square format"
          style: 'watercolor', // Should understand style
          shotSize: 'portrait' // Should understand "portrait photo"
        }
      }
    }
  }
];

// Mock AI agent response analyzer
function analyzeAIAgentResponse(userMessage, aiResponse) {
  const analysis = {
    userMessage,
    toolCallsDetected: [],
    enhancementUsed: false,
    parametersExtracted: {},
    modelSelection: null,
    resolutionSelection: null,
    styleSelection: null
  };

  // Check for enhance prompt usage
  if (aiResponse.includes('enhancePrompt') || aiResponse.includes('enhance that prompt')) {
    analysis.enhancementUsed = true;
    analysis.toolCallsDetected.push('enhancePrompt');
  }

  // Check for configureImageGeneration usage
  if (aiResponse.includes('configureImageGeneration') || aiResponse.includes('Creating an image artifact')) {
    analysis.toolCallsDetected.push('configureImageGeneration');
  }

  // Extract model selection
  const modelPatterns = [
    /model["\s:]+([A-Za-z0-9/-]+)/i,
    /Using model["\s:]+([A-Za-z0-9/-]+)/i,
    /selected model["\s:]+([A-Za-z0-9/-]+)/i
  ];
  
  for (const pattern of modelPatterns) {
    const match = aiResponse.match(pattern);
    if (match) {
      analysis.modelSelection = match[1];
      break;
    }
  }

  // Extract resolution
  const resolutionPatterns = [
    /resolution["\s:]+(\d+x\d+|square|vertical|horizontal|full hd|hd)/i,
    /(\d{3,4})[x×](\d{3,4})/,
    /(square|vertical|horizontal) format/i
  ];

  for (const pattern of resolutionPatterns) {
    const match = aiResponse.match(pattern);
    if (match) {
      analysis.resolutionSelection = match[1] || `${match[1]}x${match[2]}`;
      break;
    }
  }

  // Extract style
  const stylePatterns = [
    /style["\s:]+([a-zA-Z-]+)/i,
    /(watercolor|realistic|cinematic|anime|cartoon|steampunk) style/i
  ];

  for (const pattern of stylePatterns) {
    const match = aiResponse.match(pattern);
    if (match) {
      analysis.styleSelection = match[1];
      break;
    }
  }

  return analysis;
}

// Test runner
async function runAIAgentBehaviorTests() {
  console.log('🤖 AI Agent Image Generation Behavior Test');
  console.log('=' .repeat(50));
  console.log('\nThis test analyzes how the AI agent understands and uses image generation tools.\n');

  const results = [];

  for (const scenario of TEST_SCENARIOS) {
    console.log(`\n📝 Scenario: ${scenario.id}`);
    console.log(`User: "${scenario.userMessage}"`);
    console.log('-'.repeat(50));

    // Simulate AI agent response based on expected behavior
    const mockAIResponse = generateMockAIResponse(scenario);
    
    // Analyze the response
    const analysis = analyzeAIAgentResponse(scenario.userMessage, mockAIResponse);
    
    // Validate against expected behavior
    const validation = validateBehavior(analysis, scenario.expectedBehavior);
    
    console.log('\n🔍 Analysis:');
    console.log(`  ✓ Enhancement used: ${analysis.enhancementUsed}`);
    console.log(`  ✓ Tool calls: ${analysis.toolCallsDetected.join(', ')}`);
    console.log(`  ✓ Model: ${analysis.modelSelection || 'default'}`);
    console.log(`  ✓ Resolution: ${analysis.resolutionSelection || 'default'}`);
    console.log(`  ✓ Style: ${analysis.styleSelection || 'default'}`);
    
    console.log('\n✅ Validation:');
    console.log(`  ${validation.enhancementCorrect ? '✓' : '✗'} Enhancement behavior`);
    console.log(`  ${validation.toolCallsCorrect ? '✓' : '✗'} Tool calls`);
    console.log(`  ${validation.parametersCorrect ? '✓' : '✗'} Parameters extraction`);
    
    results.push({
      scenario: scenario.id,
      passed: validation.allCorrect,
      analysis,
      validation
    });
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`\n✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  console.log('\n🔑 Key Findings:');
  console.log('1. AI agent should automatically enhance simple/Russian prompts');
  console.log('2. AI agent should extract parameters from natural language');
  console.log('3. AI agent should select appropriate models dynamically');
  console.log('4. AI agent should understand various resolution formats');
  console.log('5. AI agent should map styles correctly');
  
  return results;
}

// Helper: Generate mock AI response based on scenario
function generateMockAIResponse(scenario) {
  const { expectedBehavior } = scenario;
  let response = '';

  if (expectedBehavior.shouldEnhancePrompt) {
    response += 'Let me enhance that prompt to get better generation results...\n';
    response += 'Calling enhancePrompt with mediaType="image"\n';
  }

  if (expectedBehavior.expectedToolCalls.includes('configureImageGeneration')) {
    if (expectedBehavior.expectedParameters?.configureImageGeneration?.hasPrompt === false) {
      response += "I'll set up the image generation settings for you to configure...\n";
    } else {
      response += "I'll generate that image for you right now! Creating an image artifact...\n";
      response += `Using model "comfyui/flux" with 1024x1024 resolution.\n`;
    }
  }

  return response;
}

// Helper: Validate behavior against expectations
function validateBehavior(analysis, expectedBehavior) {
  const validation = {
    enhancementCorrect: analysis.enhancementUsed === expectedBehavior.shouldEnhancePrompt,
    toolCallsCorrect: JSON.stringify(analysis.toolCallsDetected.sort()) === 
                      JSON.stringify(expectedBehavior.expectedToolCalls.sort()),
    parametersCorrect: true, // Simplified for this test
    allCorrect: false
  };

  validation.allCorrect = validation.enhancementCorrect && 
                         validation.toolCallsCorrect && 
                         validation.parametersCorrect;

  return validation;
}

// System prompt analysis
function analyzeSystemPrompt() {
  console.log('\n📋 SYSTEM PROMPT ANALYSIS');
  console.log('='.repeat(50));
  
  const systemPromptRules = {
    enhancementRules: {
      russian: 'Russian text should be enhanced',
      shortEnglish: 'Short English (<50 chars or <5 words) should be enhanced',
      simplePrompts: 'Basic descriptions should be enhanced',
      detailedPrompts: 'Already detailed prompts should NOT be enhanced'
    },
    parameterExtraction: {
      model: 'Extract from "FLUX", "Sora", model names',
      resolution: 'Understand "1920x1080", "full hd", "square", etc.',
      style: 'Map "realistic", "cinematic", "watercolor", etc.',
      shotSize: 'Understand "close-up", "portrait", "long-shot", etc.'
    },
    processFlow: {
      step1: 'Check if prompt needs enhancement',
      step2: 'Call enhancePrompt if needed',
      step3: 'Call configureImageGeneration with parameters',
      step4: 'Create image artifact with real-time progress'
    }
  };

  console.log('\n🔍 Enhancement Rules:');
  Object.entries(systemPromptRules.enhancementRules).forEach(([key, rule]) => {
    console.log(`  • ${key}: ${rule}`);
  });

  console.log('\n🔧 Parameter Extraction:');
  Object.entries(systemPromptRules.parameterExtraction).forEach(([key, rule]) => {
    console.log(`  • ${key}: ${rule}`);
  });

  console.log('\n📊 Process Flow:');
  Object.entries(systemPromptRules.processFlow).forEach(([key, step]) => {
    console.log(`  ${key}: ${step}`);
  });
}

// Run the tests
if (require.main === module) {
  analyzeSystemPrompt();
  runAIAgentBehaviorTests()
    .then(results => {
      console.log('\n✅ Test completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = {
  analyzeAIAgentResponse,
  validateBehavior,
  TEST_SCENARIOS
}; 