import { NextRequest, NextResponse } from 'next/server';
import { getSuperduperAIConfig } from '@/lib/config/superduperai';
import { FileService } from '@/lib/api/services/FileService';
import { OpenAPI } from '@/lib/api/core/OpenAPI';
import { GenerateImagePayload } from '@/lib/api/models/GenerateImagePayload';
import { IImageGenerationCreate } from '@/lib/api/models/IImageGenerationCreate';
import { IImageGenerationReferenceCreate } from '@/lib/api/models/IImageGenerationReferenceCreate';
import { ReferenceTypeEnum } from '@/lib/api/models/ReferenceTypeEnum';
import { ShotSizeEnum } from '@/lib/api/models/ShotSizeEnum';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🖼️ Image API: Processing image generation request');
    console.log('📦 Request parameters:', JSON.stringify(body, null, 2));
    
    // Extract parameters from request body
    const {
      prompt,
      model,
      resolution,
      chatId,
      negativePrompt,
      steps = 30,
      seed,
      shotSize,
      style,
      sourceImageId,
      sourceImageUrl,
      batchSize = 1
    } = body;
    
    // Configure OpenAPI client for server-side usage
    const config = getSuperduperAIConfig();
    OpenAPI.BASE = config.url;
    OpenAPI.TOKEN = config.token;
    
    // Create image generation config using OpenAPI types
    const imageConfig: IImageGenerationCreate = {
      prompt,
      negative_prompt: negativePrompt || '',
      width: resolution?.width || 512,
      height: resolution?.height || 512,
      steps,
      shot_size: shotSize?.id as ShotSizeEnum || null,
      seed: seed || Math.floor(Math.random() * 1000000000000),
      generation_config_name: model?.name || 'fal-ai/flux-dev',
      batch_size: Math.min(Math.max(batchSize, 1), 3), // Ensure batch size is between 1 and 3
      style_name: style?.id || null,
      references: sourceImageUrl ? [{
        type: ReferenceTypeEnum.SOURCE,
        reference_id: sourceImageId || ''
      } as IImageGenerationReferenceCreate] : [],
      entity_ids: []
    };

    // Create image generation payload using OpenAPI types
    const imagePayload: GenerateImagePayload = {
      config: imageConfig
    };
    
    console.log('🖼️ Calling FileService.fileGenerateImage with payload:', imagePayload);
    
    // Use OpenAPI client to generate image
    const result = await FileService.fileGenerateImage({
      requestBody: imagePayload
    });
    
    console.log('✅ Image generation result:', result);
    
    // FileService.fileGenerateImage returns an array of IFileRead
    const file = Array.isArray(result) && result.length > 0 ? result[0] : null;
    
    if (!file) {
      throw new Error('No file returned from image generation');
    }
    
    // Transform result to match expected format
    const response = {
      success: true,
      fileId: file.id,
      projectId: chatId,
      url: file.url,
      tasks: file.tasks || []
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('💥 Image API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate image', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 