import { type NextRequest, NextResponse } from 'next/server';
import { configureSuperduperAI } from '@/lib/config/superduperai';
import { generateVideoWithStrategy, type VideoGenerationParams, type ImageToVideoParams } from '@/lib/ai/api/video-generation';
import { parseResolution } from '@/lib/utils/media-generation';

export async function POST(request: NextRequest) {
  try {
    let body: any;
    // All requests now come as JSON (with Base64 data URL for image-to-video)
    console.log('🎬 Video API: Processing JSON request');
    const contentType = request.headers.get('content-type') || '';

    // Проверяем form-data или обычный JSON
    const isFormData = contentType.includes('multipart/form-data');

    if (isFormData) {
      const formData = await request.formData();
      // Извлекаем значения
      body = {
        prompt: formData.get('prompt')?.toString() ?? '',
        model: formData.get('model')?.toString() ?? '',
        resolution: formData.get('resolution')?.toString() ?? '',
        chatId: formData.get('chatId')?.toString() ?? '',
        negativePrompt: formData.get('negativePrompt')?.toString() ?? '',
        duration: Number(formData.get('duration') ?? 5),
        generationType: formData.get('generationType')?.toString() ?? 'text-to-video',
        frameRate: Number(formData.get('frameRate') ?? 30),
        style: formData.get('style')?.toString() ?? '',
        shotSize: formData.get('shotSize')?.toString() ?? '',
        seed: formData.get('seed')?.toString() ?? '',
        file: formData.get('file') as File | null
      }
    } else {
      body = await request.json();
    }
    const {chatId, generationType, file} = body
    
    console.log('📦 Request parameters:', JSON.stringify(body, null, 2));
        // Configure SuperDuperAI for server-side operations
    configureSuperduperAI();

    // Add image-specific parameters if needed
    let strategyParams: VideoGenerationParams | ImageToVideoParams = {...body};
    if (generationType === 'image-to-video') {
      strategyParams = {
        ...body,
        file
      } as ImageToVideoParams;
    }
    console.log(`🎬 Using strategy pattern for ${generationType} generation`);
    console.log("strategyParams", strategyParams);
    // Use strategy pattern for generation
    const result = await generateVideoWithStrategy(generationType, strategyParams);
    
    if (!result.success) {
      throw new Error(result.error || 'Video generation failed');
    }
    
    console.log('✅ Video generation result:', result);
    
    // Return standardized response
    const responseData = {
      success: true,
      fileId: result.fileId,
      projectId: result.projectId || chatId,
      url: result.url,
      message: result.message
    };
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('💥 Video API error:', error);
    
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
        error: 'Failed to generate video', 
        details: errorMessage
      },
      { status: 500 }
    );
  }
} 