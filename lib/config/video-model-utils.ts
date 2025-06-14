import { getAvailableVideoModels, type VideoModel as SuperDuperVideoModel } from './superduperai';
import videoModelsConfig from './video-models.json';
import type { VideoModel } from '@/lib/types/media-settings';

/**
 * Enhanced video model with metadata
 * AICODE-NOTE: Combines dynamic API data with static metadata
 */
export interface EnhancedVideoModel extends VideoModel {
  category: 'text_to_video' | 'image_to_video' | 'video_to_video';
  uiLabel: string;
  uiDescription: string;
  recommendedSettings: any;
  bestFor: string[];
  priceTier: 'budget' | 'standard' | 'premium' | 'luxury';
  requiresSourceImage: boolean;
  requiresSourceVideo: boolean;
}

/**
 * Get enhanced video models with metadata
 * AICODE-NOTE: Merges dynamic API data with static metadata
 */
export async function getEnhancedVideoModels(): Promise<EnhancedVideoModel[]> {
  try {
    // Get dynamic models from API
    const apiModels = await getAvailableVideoModels();
    
    // Enhance with metadata
    const enhancedModels: EnhancedVideoModel[] = apiModels.map(apiModel => {
      const metadata = videoModelsConfig.model_metadata[apiModel.id as keyof typeof videoModelsConfig.model_metadata];
      
      // Determine price tier
      let priceTier: 'budget' | 'standard' | 'premium' | 'luxury' = 'standard';
      if (apiModel.pricePerSecond <= 0.5) priceTier = 'budget';
      else if (apiModel.pricePerSecond <= 1.5) priceTier = 'standard';
      else if (apiModel.pricePerSecond <= 2.5) priceTier = 'premium';
      else priceTier = 'luxury';
      
      // Determine category from metadata or model name
      let category: 'text_to_video' | 'image_to_video' | 'video_to_video' = 'text_to_video';
      if (metadata?.category) {
        category = metadata.category as any;
      } else {
        // Fallback: detect from model name
        if (apiModel.id.includes('image-to-video') || apiModel.id.includes('veo') || apiModel.id.includes('kling')) {
          category = 'image_to_video';
        } else if (apiModel.id.includes('lip-sync') || apiModel.id.includes('video-to-video')) {
          category = 'video_to_video';
        }
      }
      
      return {
        id: apiModel.id,
        label: metadata?.ui_label || apiModel.name,
        description: metadata?.ui_description || apiModel.description,
        category,
        uiLabel: metadata?.ui_label || apiModel.name,
        uiDescription: metadata?.ui_description || apiModel.description,
        recommendedSettings: metadata?.recommended_settings || {},
        bestFor: metadata?.best_for || [],
        priceTier,
        requiresSourceImage: category === 'image_to_video',
        requiresSourceVideo: category === 'video_to_video',
      };
    });
    
    return enhancedModels;
  } catch (error) {
    console.error('Error getting enhanced video models:', error);
    
    // Fallback to basic LTX model
    return [{
      id: 'comfyui/ltx',
      label: 'LTX Video',
      description: 'Budget-friendly image-to-video generation',
      category: 'image_to_video',
      uiLabel: 'LTX Video',
      uiDescription: 'Budget-friendly image-to-video generation',
      recommendedSettings: videoModelsConfig.model_metadata['comfyui/ltx']?.recommended_settings || {},
      bestFor: ['social_media', 'quick_prototypes', 'budget_projects'],
      priceTier: 'budget',
      requiresSourceImage: true,
      requiresSourceVideo: false,
    }];
  }
}

/**
 * Filter models by category
 */
export async function getModelsByCategory(category: 'text_to_video' | 'image_to_video' | 'video_to_video'): Promise<EnhancedVideoModel[]> {
  const models = await getEnhancedVideoModels();
  return models.filter(model => model.category === category);
}

/**
 * Filter models by price tier
 */
export async function getModelsByPriceTier(tier: 'budget' | 'standard' | 'premium' | 'luxury'): Promise<EnhancedVideoModel[]> {
  const models = await getEnhancedVideoModels();
  return models.filter(model => model.priceTier === tier);
}

/**
 * Get recommended models for a specific use case
 */
export async function getRecommendedModels(useCase: string): Promise<EnhancedVideoModel[]> {
  const models = await getEnhancedVideoModels();
  return models.filter(model => model.bestFor.includes(useCase));
}

/**
 * Get model by ID with metadata
 */
export async function getEnhancedModelById(modelId: string): Promise<EnhancedVideoModel | null> {
  const models = await getEnhancedVideoModels();
  return models.find(model => model.id === modelId) || null;
}

/**
 * Get UI presets from config
 */
export function getUIPresets() {
  return videoModelsConfig.ui_presets;
}

/**
 * Get model categories info
 */
export function getModelCategories() {
  return videoModelsConfig.model_categories;
}

/**
 * Get pricing tiers info
 */
export function getPricingTiers() {
  return videoModelsConfig.pricing_tiers;
} 