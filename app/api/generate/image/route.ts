import { type NextRequest, NextResponse } from 'next/server';
import { getSuperduperAIConfig } from '@/lib/config/superduperai';
import { OpenAPI } from '@/lib/api/core/OpenAPI';
import { generateImageWithStrategy, ImageGenerationParams, ImageToImageParams } from '@/lib/ai/api/image-generation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🖼️ Image API: Processing image generation request');
    console.log('📦 Request parameters:', JSON.stringify(body, null, 2));
    
    const {
      chatId,
      generationType = 'text-to-image',
      file
    } = body;
    
    // Configure OpenAPI client for server-side usage
    const config = getSuperduperAIConfig();
    OpenAPI.BASE = config.url;
    OpenAPI.TOKEN = config.token;
    
    // Create image generation config using OpenAPI types

    let strategyParams: ImageGenerationParams | ImageToImageParams = {...body}
    if (generationType === 'image-to-image') {
      strategyParams = {
        ...body,
        file
      } as ImageToImageParams;
    }
    // Use OpenAPI client to generate image
    const result = await generateImageWithStrategy(generationType, strategyParams);
    
    console.log('✅ Image generation result:', result);
    
    const response = {
      success: true,
      fileId: result.fileId,
      projectId: result.projectId || chatId,
      url: result.url,
      message: result.message
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('💥 Image API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Specific handling for backend magic library error
    if (errorMessage.includes('magic') || errorMessage.includes('AttributeError')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Backend file processing error', 
          details: 'The SuperDuperAI service is experiencing issues with file type detection. Please try using a different image format (PNG, JPG, WEBP) or try again later.'
        },
        { status: 500 }
      );
    }
    
    // Handle image upload failures specifically
    if (errorMessage.includes('upload') || errorMessage.includes('image')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Image processing failed', 
          details: 'Failed to process the source image. Please try using a different image or check the file format (PNG, JPG, WEBP supported).'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate Image', 
        details: errorMessage
      },
      { status: 500 }
    );
  }
} 