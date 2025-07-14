import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { configureSuperduperAIForUser } from '@/lib/config/superduperai-server';
import { getUserSuperduperAIStatus } from '@/lib/db/queries';
import { generateImageWithStrategy, type ImageGenerationParams, type ImageToImageParams } from '@/lib/ai/api/image-generation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🖼️ Image API: Processing image generation request');
    
    // Получаем пользователя из сессии
    const session = await auth();
    const userId = session?.user?.id;
    
    // Прозрачная интеграция с SuperDuperAI
    if (userId) {
      const userStatus = await getUserSuperduperAIStatus(userId);
      
      // Если пользователь НЕ подключен - возвращаем ответ для автоматического OAuth  
      if (!userStatus.isConnected) {
        return NextResponse.json({
          success: false,
          error: 'Authentication required',
          details: 'Automatic authentication with SuperDuperAI will start now. This is a one-time setup.',
          needsAuth: true,
          authAction: 'superduperai_oauth',
                     continueAfterAuth: {
             method: 'POST',
             url: '/api/generate/image',
             body: body
           }
        }, { status: 202 }); // Accepted - will be processed after auth
      }
      
      // Проверяем баланс ТОЛЬКО если пользователь подключен
      if (userStatus.balance <= 0) {
        return NextResponse.json({
          success: false,
          error: 'Insufficient credits',
          details: 'You have 0 credits left. Please top up your balance to continue generating images.',
          balance: 0,
          requiresTopUp: true
        }, { status: 402 }); // Payment Required
      }
    }
    
    const {
      chatId,
      generationType = 'text-to-image',
    } = body;
    
    // Настраиваем SuperDuperAI с токеном пользователя (или системным)
    const config = await configureSuperduperAIForUser(userId);
    
    // Проверяем реально ли используется пользовательский токен
    const isUsingUserToken = userId ? !!(await getUserSuperduperAIStatus(userId)).isConnected : false;
    
    // ИСПРАВЛЕННОЕ логирование будет в configureSuperduperAIForUser()
    // НЕ логируем здесь, чтобы избежать дублирования
    
    // Create image generation config using OpenAPI types
    const strategyParams: ImageGenerationParams | ImageToImageParams = {...body}
   
    // Use OpenAPI client to generate image
    const result = await generateImageWithStrategy(generationType, strategyParams);
    
    console.log('✅ Image generation result:', result);
    
    const response = {
      success: true,
      fileId: result.fileId,
      projectId: result.projectId || chatId,
      url: result.url,
      message: result.message,
      usingUserToken: isUsingUserToken
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
        error: 'Failed to generate Image', 
        details: errorMessage
      },
      { status: 500 }
    );
  }
} 