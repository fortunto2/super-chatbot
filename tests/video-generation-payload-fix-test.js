/**
 * Video Generation Payload Fix Test
 * Verifies the correct payload format is being used
 */

// Test data
const testParams = {
  prompt: 'make video with bear',
  model: { 
    name: 'comfyui/ltx', 
    label: 'LTX Video' 
  },
  style: { id: 'flux_watercolor', label: 'Watercolor' },
  resolution: { 
    width: 512, 
    height: 512, 
    aspectRatio: '1:1',
    qualityType: 'hd'
  },
  shotSize: { id: 'medium_shot', label: 'Medium Shot' },
  duration: 5,
  frameRate: 30,
  negativePrompt: ''
};

function testCorrectPayloadFormat() {
  console.log('🧪 Testing correct payload format for video generation');
  console.log('=' * 50);
  
  // This should be the CORRECT format (from working version)
  const correctPayload = {
    type: "media",              // ← CRITICAL: Must have this
    template_name: null,
    style_name: testParams.style.id,
    config: {
      prompt: testParams.prompt,
      negative_prompt: testParams.negativePrompt,
      width: testParams.resolution.width,
      height: testParams.resolution.height,
      aspect_ratio: testParams.resolution.aspectRatio,
      seed: 12345678,
      generation_config_name: testParams.model.name,
      duration: testParams.duration,
      frame_rate: testParams.frameRate,
      batch_size: 1,
      shot_size: testParams.shotSize.id,
      style_name: testParams.style.id,
      qualityType: testParams.resolution.qualityType,
      entity_ids: [],
      references: []
    }
  };
  
  console.log('✅ CORRECT payload format:');
  console.log(JSON.stringify(correctPayload, null, 2));
  
  // This should be the WRONG format (what was causing errors)
  const wrongPayload = {
    params: {                   // ← WRONG: Don't use "params"
      config: {
        seed: 12345678,
        steps: 50,
        width: testParams.resolution.width,
        height: testParams.resolution.height,
        prompt: testParams.prompt,
        duration: testParams.duration,
        batch_size: 1,
        aspect_ratio: testParams.resolution.aspectRatio,
        negative_prompt: testParams.negativePrompt
      },
      file_ids: [],
      references: [],
      generation_config: {
        name: testParams.model.name,
        type: "image_to_video",  // ← This was the problem!
        label: testParams.model.label
      }
    }
  };
  
  console.log('\n❌ WRONG payload format (was causing ComfyUI errors):');
  console.log(JSON.stringify(wrongPayload, null, 2));
  
  console.log('\n🔍 Key differences:');
  console.log('✅ Correct: { type: "media", config: { ... } }');
  console.log('❌ Wrong:   { params: { config: { ... }, generation_config: { ... } } }');
  
  console.log('\n📋 Summary:');
  console.log('- Always use "type: media" at top level');
  console.log('- Never use "params" wrapper');
  console.log('- Put generation_config_name inside config, not as separate generation_config');
  console.log('- Include style_name at both top level and in config');
  
  return {
    correct: correctPayload,
    wrong: wrongPayload
  };
}

// Run the test
if (require.main === module) {
  testCorrectPayloadFormat();
}

module.exports = { testCorrectPayloadFormat }; 