import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getSuperduperAIConfigWithUserToken } from '@/lib/config/superduperai';
import { OpenAPI } from '@/lib/api/core/OpenAPI';
import { generateImageWithStrategy, ImageGenerationParams, ImageToImageParams } from '@/lib/ai/api/image-generation';
import { validateOperationBalance, deductOperationBalance } from '@/lib/utils/tools-balance';

export async function POST(request: NextRequest) {
  try {
    // Check authentication first
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    console.log('🖼️ Image API: Processing image generation request');
    console.log('📦 Request parameters:', JSON.stringify(body, null, 2));

    // Validate user balance before proceeding
    const userId = session.user.id;
    const generationType = body.generationType || 'text-to-image';
    
    // Determine cost multipliers based on request
    const multipliers: string[] = [];
    if (body.style?.id === 'high-quality') multipliers.push('high-quality');
    if (body.style?.id === 'ultra-quality') multipliers.push('ultra-quality');

    const balanceValidation = await validateOperationBalance(
      userId, 
      'image-generation', 
      generationType, 
      multipliers
    );

    if (!balanceValidation.valid) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Insufficient balance',
          details: balanceValidation.error,
          requiredCredits: balanceValidation.cost
        },
        { status: 402 } // Payment Required
      );
    }

    console.log(`💳 User ${userId} has sufficient balance for ${generationType} (${balanceValidation.cost} credits)`);
    
    const {
      chatId,
    } = body;
    
    // Configure OpenAPI client with user token from session (with system token fallback)
    console.log("SESSION USER", session)
    const config = getSuperduperAIConfigWithUserToken(session);
    OpenAPI.BASE = config.url;
    OpenAPI.TOKEN = config.token;
    
    // Create image generation config using OpenAPI types

    const strategyParams: ImageGenerationParams | ImageToImageParams = {...body}
   
    // Use OpenAPI client to generate image
    const result = await generateImageWithStrategy(generationType, strategyParams, session);
    
    console.log('✅ Image generation result:', result);

    // Deduct balance after successful generation
    try {
      await deductOperationBalance(
        userId,
        'image-generation',
        generationType,
        multipliers,
        {
          fileId: result.fileId,
          projectId: result.projectId,
          operationType: generationType,
          timestamp: new Date().toISOString()
        }
      );
      console.log(`💳 Balance deducted for user ${userId} after successful image generation`);
    } catch (balanceError) {
      console.error('⚠️ Failed to deduct balance after image generation:', balanceError);
      // Continue with response - image was generated successfully
    }
    
    const response = {
      success: true,
      fileId: result.fileId,
      projectId: result.projectId || chatId,
      url: result.url,
      message: result.message,
      creditsUsed: balanceValidation.cost,
      usingUserToken: config.isUserToken
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