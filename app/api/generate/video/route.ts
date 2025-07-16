import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { configureSuperduperAIForUser } from '@/lib/config/superduperai-server';
import { getUserSuperduperAIStatus, getUserSuperduperAIToken } from '@/lib/db/queries';
import { generateVideoWithStrategy, type VideoGenerationParams, type ImageToVideoParams } from '@/lib/ai/api/video-generation';

export async function POST(request: NextRequest) {
  try {
    // Получаем пользователя из сессии В ПЕРВУЮ ОЧЕРЕДЬ
    const session = await auth();
    const userId = session?.user?.id;
    
    // Сначала проверяем авторизацию, ПОТОМ парсим тело запроса
    if (userId) {
      const userStatus = await getUserSuperduperAIStatus(userId);
      
      if (!userStatus.isConnected) {
        // Тело запроса здесь еще не нужно, поэтому мы не теряем данные
        return NextResponse.json({
          success: false,
          error: 'Authentication required',
          details: 'Automatic authentication with SuperDuperAI will start now. This is a one-time setup.',
          needsAuth: true,
          authAction: 'superduperai_oauth',
          // Тело будет добавлено на клиенте при повторной попытке
          continueAfterAuth: {
            method: 'POST',
            url: '/api/generate/video',
            body: {} // Placeholder, as body is not yet parsed
          }
        }, { status: 202 });
      }
      
      if (userStatus.balance <= 0) {
        return NextResponse.json({
          success: false,
          error: 'Insufficient credits',
          details: 'You have 0 credits left. Please top up your balance to continue generating videos.',
          balance: 0,
          requiresTopUp: true
        }, { status: 402 });
      }
    }

    // Теперь, когда мы уверены, что пользователь авторизован, парсим тело
    let body: any;
    const contentType = request.headers.get('content-type') || '';
    const isFormData = contentType.includes('multipart/form-data');

    if (isFormData) {
      const formData = await request.formData();
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
      };
    } else {
      body = await request.json();
    }
    const { chatId, generationType = 'text-to-video' } = body;
    
    // Настраиваем SuperDuperAI с токеном пользователя
    const config = await configureSuperduperAIForUser(userId);
    
    // ДЕТАЛЬНАЯ ДИАГНОСТИКА: проверяем, какой токен реально используется
    console.log(`🔍 DIAGNOSTICS for userId: ${userId}`);
    if (userId) {
      const userStatus = await getUserSuperduperAIStatus(userId);
      const userToken = await getUserSuperduperAIToken(userId);
      console.log(`📊 User status:`, userStatus);
      console.log(`🔑 User token exists:`, !!userToken);
      console.log(`🔑 User token preview:`, userToken ? `${userToken.substring(0, 10)}...` : 'NULL');
      console.log(`⚡ System token preview:`, process.env.SUPERDUPERAI_TOKEN ? `${process.env.SUPERDUPERAI_TOKEN.substring(0, 10)}...` : 'NULL');
    }
    
    // Проверяем, реально ли используется пользовательский токен
    const isUsingUserToken = userId ? (await getUserSuperduperAIStatus(userId)).isConnected : false;

    const strategyParams: VideoGenerationParams | ImageToVideoParams = { ...body };
  
    console.log(`🎬 Using strategy pattern for ${generationType} generation`);
    
    const result = await generateVideoWithStrategy(generationType, strategyParams);
    
    if (!result.success) {
      throw new Error(result.error || 'Video generation failed');
    }
    
    console.log('✅ Video generation result:', result);
    
    const responseData = {
      success: true,
      fileId: result.fileId,
      projectId: result.projectId || chatId,
      url: result.url,
      message: result.message,
      usingUserToken: isUsingUserToken
    };
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('💥 Video API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
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