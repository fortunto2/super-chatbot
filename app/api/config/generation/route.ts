import { NextRequest, NextResponse } from 'next/server';
import { getCachedGenerationConfigs, getVideoModelsForAgent, getCacheStatus } from '@/lib/ai/api/config-cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const type = searchParams.get('type');
    
    switch (action) {
      case 'list':
        const configs = await getCachedGenerationConfigs();
        let filteredConfigs = configs;
        
        if (type) {
          filteredConfigs = configs.filter(c => c.type === type);
        }
        
        return NextResponse.json({
          success: true,
          data: filteredConfigs,
          total: filteredConfigs.length,
          cache: getCacheStatus(),
        });
        
      case 'video-models':
        const videoModels = await getVideoModelsForAgent();
        return NextResponse.json({
          success: true,
          data: videoModels,
          cache: getCacheStatus(),
        });
        
      case 'cache-status':
        return NextResponse.json({
          success: true,
          data: getCacheStatus(),
        });
        
      case 'refresh':
        const refreshedConfigs = await getCachedGenerationConfigs(true);
        return NextResponse.json({
          success: true,
          message: 'Cache refreshed successfully',
          data: refreshedConfigs,
          total: refreshedConfigs.length,
          cache: getCacheStatus(),
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Available actions: list, video-models, cache-status, refresh',
        }, { status: 400 });
    }
    
  } catch (error: any) {
    console.error('Generation config API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error occurred',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, preferences } = body;
    
    if (action === 'find-best-video-model') {
      const { getBestVideoModel } = await import('@/lib/ai/api/config-cache');
      
      const bestModel = await getBestVideoModel(preferences);
      
      if (!bestModel) {
        return NextResponse.json({
          success: false,
          error: 'No suitable video model found with given preferences',
        });
      }
      
      return NextResponse.json({
        success: true,
        data: bestModel,
        cache: getCacheStatus(),
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action. Available actions: find-best-video-model',
    }, { status: 400 });
    
  } catch (error: any) {
    console.error('Generation config API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error occurred',
    }, { status: 500 });
  }
} 