import { type NextRequest, NextResponse } from 'next/server';
import { getSuperduperAIConfig } from '@/lib/config/superduperai';
import { getBestVideoModel } from '@/lib/ai/api/config-cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🎬 Video API: Processing video generation request');
    console.log('📦 Request parameters:', JSON.stringify(body, null, 2));
    
    // Extract parameters from request body
    const {
      prompt,
      model,
      resolution,
      chatId,
      negativePrompt,
      duration = 5,
      sourceImageId,
      sourceImageUrl
    } = body;

    // AICODE-FIX: Smart model selection - prioritize text_to_video models like Sora
    let selectedModel = model;
    if (!selectedModel || !selectedModel.name) {
      console.log('🎯 No model specified, getting best model for text-to-video generation...');
      
      // Check if we have source image - this determines generation type
      const hasSourceImage = sourceImageId || sourceImageUrl;
      
      if (hasSourceImage) {
        console.log('🖼️ Source image detected, prioritizing image_to_video models');
        // For image-to-video, we can use image_to_video models
        selectedModel = await getBestVideoModel({ 
          vipAllowed: true,
          preferredDuration: duration 
        });
      } else {
        console.log('📝 No source image, requiring text_to_video models');
        // For text-only prompts, ONLY use text_to_video models
        selectedModel = await getBestVideoModel({ 
          vipAllowed: true,
          preferredDuration: duration,
          requireTextToVideo: true // Force text_to_video models only
        });
      }
      
      if (selectedModel) {
        console.log('✅ Auto-selected model:', selectedModel.name, '(type:', selectedModel.type, ')');
      } else {
        console.warn('⚠️ No suitable model found, using fallback');
        // Last resort fallback
        selectedModel = { name: 'azure-openai/sora' };
      }
    }

    // Use original working format with type: "media" and direct fetch
    const config = getSuperduperAIConfig();
    const url = `${config.url}/api/v1/file/generate-video`;
    const headers = {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/json'
    };

    // AICODE-FIX: Use selected model name
    const modelName = selectedModel?.name || 'azure-openai/sora';
    console.log('🎬 Using model:', modelName);

    // Use original working payload format with type: "media"
    const payload = {
      type: "media",           // ← CRITICAL: Always use this format, never "params"!
      template_name: null,
      style_name: "flux_watercolor", // Use working style
      config: {
        prompt,
        negative_prompt: negativePrompt || '',
        width: resolution?.width || 512,
        height: resolution?.height || 512,
        aspect_ratio: resolution?.aspectRatio || "16:9",
        seed: Math.floor(Math.random() * 1000000000000),
        generation_config_name: modelName, // Use selected model
        duration,
        frame_rate: 30,
        batch_size: 1,
        shot_size: "medium_shot", // Use working shot size
        style_name: "flux_watercolor",
        qualityType: "hd",
        entity_ids: [],
        references: sourceImageUrl ? [{
          type: 'source',
          reference_id: sourceImageId || '',
          reference_url: sourceImageUrl
        }] : []
      }
    };
    
    console.log('🎬 Final payload:', JSON.stringify(payload, null, 2));
    
    // Use original fetch approach that was working
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}):`, errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log('✅ Video generation result:', result);
    
    // Extract fileId from response (original logic)
    const fileId = result.id ||
                  result.data?.[0]?.value?.file_id || 
                  result.data?.[0]?.id || 
                  result.fileId;

    // Transform result to match expected format
    const responseData = {
      success: true,
      fileId: fileId,
      projectId: chatId,
      url: result.url,
      tasks: result.tasks || []
    };
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('💥 Video API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate video', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 