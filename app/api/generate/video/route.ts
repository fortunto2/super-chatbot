import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getSuperduperAIConfigWithUserToken, getSuperduperAIConfig } from '@/lib/config/superduperai';
import { generateVideoHybrid } from '@/lib/ai/api/generate-video';
import { IGenerationConfigRead } from '@/lib/api';
import { validateOperationBalance, deductOperationBalance } from '@/lib/utils/tools-balance';

export async function POST(request: NextRequest) {
  try {
    // Check authentication first
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    console.log('🎬 Video API: Processing request:', JSON.stringify(body, null, 2));

    // Validate user balance before proceeding
    const userId = session.user.id;
    const generationType = body.generationType || 'text-to-video';
    
    // Determine cost multipliers based on request
    const multipliers: string[] = [];
    const duration = body.duration || 5;
    if (duration <= 5) multipliers.push('duration-5s');
    else if (duration <= 10) multipliers.push('duration-10s');
    else if (duration <= 15) multipliers.push('duration-15s');
    else if (duration <= 30) multipliers.push('duration-30s');
    
    // Check resolution quality
    if (body.resolution?.includes('HD') || body.resolution?.includes('720')) {
      multipliers.push('hd-quality');
    } else if (body.resolution?.includes('4K') || body.resolution?.includes('2160')) {
      multipliers.push('4k-quality');
    }

    const balanceValidation = await validateOperationBalance(
      userId, 
      'video-generation', 
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

    // Configure OpenAPI client with user token from session (with system token fallback)
    const config = getSuperduperAIConfigWithUserToken(session);
    
    // If using user token, ensure user exists in SuperDuperAI
    if (config.isUserToken && session?.user?.email) {
      try {
        // Try a simple API call to verify user exists
        const testUrl = `${config.url}/api/v1/user/profile`;
        const testResponse = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!testResponse.ok) {
          console.log(`⚠️ User ${session.user.email} not found in SuperDuperAI (${testResponse.status}), falling back to system token`);
          // Fall back to system token if user doesn't exist
          const systemConfig = getSuperduperAIConfig();
          config.isUserToken = false;
          config.token = systemConfig.token;
        } else {
          console.log(`✅ User ${session.user.email} exists in SuperDuperAI, using user token`);
        }
      } catch (error) {
        console.error('❌ Error checking user existence in SuperDuperAI:', error);
        // Fall back to system token on error
        const systemConfig = getSuperduperAIConfig();
        config.isUserToken = false;
        config.token = systemConfig.token;
      }
    }
    
    const { OpenAPI } = await import('@/lib/api');
    OpenAPI.BASE = config.url;
    OpenAPI.TOKEN = config.token;

    // Convert string parameters to proper objects
    const modelObj = typeof body.model === 'string' 
      ? { name: body.model, label: body.model } 
      : { name: 'azure-openai/sora', label: 'Sora' };
      
    const styleObj = typeof body.style === 'string'
      ? { id: body.style, label: body.style }
      : { id: 'flux_watercolor', label: 'Watercolor' };
      
    const shotSizeObj = typeof body.shotSize === 'string'
      ? { id: body.shotSize.toLowerCase().replace(' ', '_'), label: body.shotSize }
      : { id: 'medium_shot', label: 'Medium Shot' };

    // Parse resolution string like "1280x720 (HD)" 
    let resolutionObj = { width: 1216, height: 704, label: '1216x704', aspectRatio: '16:9' };
    if (body.resolution && typeof body.resolution === 'string') {
      const match = body.resolution.match(/(\d+)x(\d+)/);
      if (match) {
        const width = parseInt(match[1]);
        const height = parseInt(match[2]);
        const ratio = width / height;
        resolutionObj = {
          width,
          height,
          label: `${width}x${height}`,
          aspectRatio: ratio === 1 ? '1:1' : ratio > 1 ? '16:9' : '9:16'
        };
      }
    }

    // Generate video using hybrid approach
    const result = await generateVideoHybrid(
      body.prompt || '',
      modelObj as IGenerationConfigRead,
      styleObj,
      resolutionObj,
      shotSizeObj,
      body.duration || 5,
      body.frameRate || 30,
      body.negativePrompt || '',
      body.sourceImageId,
      body.sourceImageUrl,
      body.generationType || 'text-to-video',
      session // Pass session for user token
    );
    
    console.log('✅ Video generation result:', result);

    // Deduct balance after successful generation
    try {
      await deductOperationBalance(
        userId,
        'video-generation',
        generationType,
        multipliers,
        {
          fileId: result.fileId,
          projectId: result.projectId,
          operationType: generationType,
          duration: duration,
          resolution: body.resolution,
          timestamp: new Date().toISOString()
        }
      );
      console.log(`💳 Balance deducted for user ${userId} after successful video generation`);
    } catch (balanceError) {
      console.error('⚠️ Failed to deduct balance after video generation:', balanceError);
      // Continue with response - video was generated successfully
    }
    
    // Return standardized response
    const response = {
      ...result,
      creditsUsed: balanceValidation.cost,
      usingUserToken: config.isUserToken
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('💥 Video API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
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