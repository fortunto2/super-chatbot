import { type NextRequest, NextResponse } from 'next/server';
import { configureSuperduperAI } from '@/lib/config/superduperai';
import { generateVideoHybrid } from '@/lib/ai/api/generate-video';
import { IGenerationConfigRead } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    // Configure OpenAPI client for server-side usage
    const { getSuperduperAIConfig } = await import('@/lib/config/superduperai');
    const config = getSuperduperAIConfig();
    const { OpenAPI } = await import('@/lib/api');
    OpenAPI.BASE = config.url;
    OpenAPI.TOKEN = config.token;

    // Parse request body
    const body = await request.json();
    console.log('🎬 Video API: Processing request:', JSON.stringify(body, null, 2));

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
      body.generationType || 'text-to-video'
    );
    
    console.log('✅ Video generation result:', result);
    
    // Return standardized response
    return NextResponse.json(result);
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