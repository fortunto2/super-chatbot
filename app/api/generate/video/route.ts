import { NextRequest, NextResponse } from 'next/server';
import { getSuperduperAIConfig } from '@/lib/config/superduperai';
import { FileService } from '@/lib/api/services/FileService';
import { OpenAPI } from '@/lib/api/core/OpenAPI';
import { GenerateVideoPayload } from '@/lib/api/models/GenerateVideoPayload';
import { IVideoGenerationCreate } from '@/lib/api/models/IVideoGenerationCreate';
import { IVideoGenerationReferenceCreate } from '@/lib/api/models/IVideoGenerationReferenceCreate';
import { ReferenceTypeEnum } from '@/lib/api/models/ReferenceTypeEnum';

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
    
    // Configure OpenAPI client for server-side usage
    const config = getSuperduperAIConfig();
    OpenAPI.BASE = config.url;
    OpenAPI.TOKEN = config.token;
    
    // Create video generation config using OpenAPI types
    const videoConfig: IVideoGenerationCreate = {
      prompt,
      negative_prompt: negativePrompt || '',
      seed: Math.floor(Math.random() * 1000000000000),
      duration,
      width: resolution?.width || 512,
      height: resolution?.height || 512,
      aspect_ratio: resolution?.aspectRatio || '1:1',
      generation_config_name: model?.name || 'comfyui/ltx',
      references: sourceImageUrl ? [{
        type: ReferenceTypeEnum.SOURCE,
        reference_id: sourceImageId || ''
      } as IVideoGenerationReferenceCreate] : []
    };

    // Create video generation payload using OpenAPI types
    const videoPayload: GenerateVideoPayload = {
      config: videoConfig
    };
    
    console.log('🎬 Calling FileService.fileGenerateVideo with payload:', videoPayload);
    
    // Use OpenAPI client to generate video
    const result = await FileService.fileGenerateVideo({
      requestBody: videoPayload
    });
    
    console.log('✅ Video generation result:', result);
    
    // Transform result to match expected format
    const response = {
      success: true,
      fileId: result.id,
      projectId: chatId,
      url: result.url,
      tasks: result.tasks || []
    };
    
    return NextResponse.json(response);
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