import { type NextRequest, NextResponse } from 'next/server';
import { configureSuperduperAI } from '@/lib/config/superduperai';
import { generateVideoWithStrategy, type VideoGenerationParams, type ImageToVideoParams } from '@/lib/ai/api/video-generation-strategies';

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
    const {prompt, model, resolution, chatId, negativePrompt, duration, generationType, frameRate, style, shotSize, seed, file} = body
    
    console.log('📦 Request parameters:', JSON.stringify(body, null, 2));
        // Configure SuperDuperAI for server-side operations
    configureSuperduperAI();

    // Parse resolution parameter to extract width, height, and aspect ratio
    const parseResolution = (resolutionString: string) => {
      let width = 1280;
      let height = 720;
      let aspectRatio = "16:9";
      
      if (resolutionString) {
        const match = resolutionString.match(/(\d+)x(\d+)/);
        if (match) {
          width = Number.parseInt(match[1], 10);
          height = Number.parseInt(match[2], 10);
          
          const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
          const divisor = gcd(width, height);
          aspectRatio = `${width / divisor}:${height / divisor}`;
        }
      }
      
      return { width, height, aspectRatio };
    };
    
    const { width, height, aspectRatio } = parseResolution(resolution);
    
    // Create objects for strategy pattern (simplified for compatibility)
    const modelObject = { 
      name: model || 'azure-openai/sora', 
      label: model || 'Sora',
      type: 'TEXT_TO_VIDEO' as any, // Simplified type
      source: 'superduperai' as any,
      params: {} as any
    };
    const styleObject = { id: style || "flux_watercolor", label: style || "Watercolor" };
    const resolutionObject = { width, height, aspectRatio, label: resolution || "HD" };
    const shotSizeObject = { id: shotSize || "medium_shot", label: shotSize || "Medium Shot" };

    // Build parameters for strategy pattern
    const baseParams: VideoGenerationParams = {
      prompt: prompt || "",
      model: modelObject,
      style: styleObject,
      resolution: resolutionObject,
      shotSize: shotSizeObject,
      duration: duration || 5,
      frameRate: frameRate || 30,
      negativePrompt: negativePrompt || "",
      seed: Number(seed) || Math.floor(Math.random() * 1000000000000),
    };

    // Add image-specific parameters if needed
    let strategyParams: VideoGenerationParams | ImageToVideoParams = baseParams;
    if (generationType === 'image-to-video') {
      strategyParams = {
        ...baseParams,
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