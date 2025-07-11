import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { configureSuperduperAIForUser } from '@/lib/config/superduperai';
import { getUserSuperduperAIStatus } from '@/lib/db/queries';
import { generateVideoWithStrategy, type VideoGenerationParams, type ImageToVideoParams } from '@/lib/ai/api/video-generation';

export async function POST(request: NextRequest) {
  try {
    let body: any;
    // All requests now come as JSON (with Base64 data URL for image-to-video)
    console.log('🎬 Video API: Processing JSON request');
    const contentType = request.headers.get('content-type') || '';

    // Получаем пользователя из сессии
    const session = await auth();
    const userId = session?.user?.id;
    
    // Проверяем баланс пользователя (если подключен SuperDuperAI)
    if (userId) {
      const userStatus = await getUserSuperduperAIStatus(userId);
      if (userStatus.isConnected && userStatus.balance <= 0) {
        return NextResponse.json({
          success: false,
          error: 'Insufficient credits',
          details: 'You have 0 credits left. Please top up your SuperDuperAI balance to continue generating videos.',
          balance: 0,
          requiresTopUp: true
        }, { status: 402 }); // Payment Required
      }
    }

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
    const {chatId, generationType = 'text-to-video'} = body
    
    // Настраиваем SuperDuperAI с токеном пользователя (или системным)
    await configureSuperduperAIForUser(userId);
    
    console.log(`🔑 Using ${userId ? 'user' : 'system'} token for video generation`);

    // Add image-specific parameters if needed
    const strategyParams: VideoGenerationParams | ImageToVideoParams = {...body};
  
    console.log(`🎬 Using strategy pattern for ${generationType} generation`);
    
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
      message: result.message,
      usingUserToken: !!userId
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
    
    // Handle authorization errors (invalid user token)
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication failed', 
          details: 'Your SuperDuperAI connection may have expired. Please reconnect your account.',
          needsReconnection: true
        },
        { status: 401 }
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