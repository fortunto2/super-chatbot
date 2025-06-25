import { NextRequest, NextResponse } from 'next/server';
import { configureSuperduperAI, getAvailableImageModels, getAvailableVideoModels } from '@/lib/config/superduperai';
import type { IGenerationConfigRead } from '@/lib/api/models/IGenerationConfigRead';
import { getStyles } from '@/lib/ai/api/get-styles';

export async function GET(request: NextRequest) {
  try {
    // Configure OpenAPI client for server-side usage
    configureSuperduperAI();
    
    console.log('📊 Models API: Getting available models');
    
    // Fetch models and styles in parallel
    const [imageModels, videoModels, stylesResponse] = await Promise.all([
      getAvailableImageModels(),
      getAvailableVideoModels(),
      getStyles()
    ]);
    
    console.log(`✅ Found ${imageModels.length} image models and ${videoModels.length} video models`);
    
    // Process styles with thumbnails
    let styles = [];
    if ('error' in stylesResponse) {
      console.error('Failed to load styles:', stylesResponse.error);
      // Fallback styles
      styles = [
        { id: 'flux_watercolor', label: 'Watercolor', description: 'Watercolor painting style', thumbnail: null },
        { id: 'artistic', label: 'Artistic', description: 'Artistic interpretation', thumbnail: null },
        { id: 'cartoon', label: 'Cartoon', description: 'Cartoon/animated style', thumbnail: null },
        { id: 'abstract', label: 'Abstract', description: 'Abstract art style', thumbnail: null },
        { id: 'vintage', label: 'Vintage', description: 'Vintage/retro style', thumbnail: null }
      ];
    } else {
      styles = stylesResponse.items.map(style => ({
        id: style.name,
        label: style.title || style.name,
        description: style.title || style.name,
        thumbnail: style.thumbnail
      }));
    }
    
    const response = {
      success: true,
      data: {
        imageModels,
        videoModels,
        styles,
        allModels: [...imageModels, ...videoModels]
      },
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('💥 Models API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get models and styles', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 