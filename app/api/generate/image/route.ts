import { type NextRequest, NextResponse } from 'next/server';
import { auth0, getPersonalSuperduperAIToken } from '@/lib/auth0';
import { configureSuperduperAIForUser } from '@/lib/config/superduperai-server';
import { getUserSuperduperAIStatus, getUserSuperduperAIToken } from '@/lib/db/queries';
import { generateImageWithStrategy, type ImageGenerationParams, type ImageToImageParams } from '@/lib/ai/api/image-generation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🖼️ Image API: Processing image generation request');
    
    // AICODE-NOTE: Get Auth0 session instead of NextAuth
    const session = await auth0.getSession();
    const userId = session?.user?.sub;
    
    // AICODE-NOTE: Critical change - use personal token instead of admin token
    try {
      const personalToken = await getPersonalSuperduperAIToken();
      
      if (!personalToken) {
        throw new Error('No personal SuperDuperAI token available');
      }
      
      console.log('💳 Using personal SuperDuperAI token - user will be charged on their own account');
      
      // Configure SuperDuperAI with user's personal token
      await configureSuperduperAIForUser(personalToken);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.log('❌ No personal token available:', errorMessage);
      
      // Return error requiring SuperDuperAI connection
      return NextResponse.json({
        success: false,
        error: 'SuperDuperAI account required',
        details: errorMessage,
        needsAuth: true,
        authAction: 'superduperai_connect',
        continueAfterAuth: {
          method: 'POST',
          url: '/api/generate/image',
          body: body
        }
      }, { status: 402 }); // Payment Required - need to connect account
    }

    const {
      chatId,
      generationType = 'text-to-image',
    } = body;
    
    // Настраиваем SuperDuperAI с токеном пользователя (или системным)
    const config = await configureSuperduperAIForUser(userId);
    
    // ДЕТАЛЬНАЯ ДИАГНОСТИКА: проверяем, какой токен реально используется
    console.log(`🔍 IMAGE DIAGNOSTICS for userId: ${userId}`);
    if (userId) {
      const userStatus = await getUserSuperduperAIStatus(userId);
      const userToken = await getUserSuperduperAIToken(userId);
      console.log(`📊 User status:`, userStatus);
      console.log(`🔑 User token exists:`, !!userToken);
      console.log(`🔑 User token preview:`, userToken ? `${userToken.substring(0, 10)}...` : 'NULL');
      console.log(`⚡ System token preview:`, process.env.SUPERDUPERAI_TOKEN ? `${process.env.SUPERDUPERAI_TOKEN.substring(0, 10)}...` : 'NULL');
    }
    
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