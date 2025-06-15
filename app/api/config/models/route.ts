import { NextResponse } from 'next/server';
import { getAvailableImageModels, getAvailableVideoModels, configureSuperduperAI } from '@/lib/config/superduperai';

export async function GET() {
  try {
    // Configure the client on server-side
    configureSuperduperAI();
    
    // Get models
    const [imageModels, videoModels] = await Promise.all([
      getAvailableImageModels(),
      getAvailableVideoModels()
    ]);

    return NextResponse.json({
      imageModels,
      videoModels,
      success: true
    });
  } catch (error) {
    console.error('Failed to get models:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get models',
        imageModels: [],
        videoModels: [],
        success: false
      },
      { status: 500 }
    );
  }
} 