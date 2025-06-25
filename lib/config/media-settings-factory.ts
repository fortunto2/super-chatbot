import { getAvailableVideoModels, getAvailableImageModels, configureSuperduperAI, getDefaultImageModel, } from './superduperai';
import type { ImageGenerationConfig, VideoGenerationConfig, MediaOption } from '../types/media-settings';
import type { IGenerationConfigRead } from '../api/models/IGenerationConfigRead';
import { ShotSizeEnum } from '@/lib/api/models/ShotSizeEnum';
import { getStyles } from '@/lib/ai/api/get-styles';

// Adapter function to convert OpenAPI model to MediaSettings format
function adaptModelForMediaSettings(model: IGenerationConfigRead): IGenerationConfigRead & {
  id: string;
  label: string;
  description: string;
  value: string;
  workflowPath: string;
  price: number;
} {
  return {
    ...model,
    id: model.name, // Use name as id for compatibility
    label: model.name, // Use name as label for display
    description: `${model.type} - ${model.source}`,
    value: model.name,
    workflowPath: model.params?.workflow_path || '',
    price: model.params?.price || 0
  };
}

// Cache for configurations
let imageConfigCache: ImageGenerationConfig | null = null;
let videoConfigCache: VideoGenerationConfig | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function getImageGenerationConfig(): Promise<ImageGenerationConfig> {
  const now = Date.now();
  
  // Return cached config if still valid
  if (imageConfigCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return imageConfigCache;
  }
  
  // Get models from API endpoint (works on both client and server)
  let imageModels: IGenerationConfigRead[] = [];
  
  try {
    if (typeof window !== 'undefined') {
      // Client-side: fetch from API endpoint
      const response = await fetch('/api/config/models');
      const data = await response.json();
      imageModels = data.imageModels || [];
    } else {
      // Server-side: direct function call
      configureSuperduperAI();
      imageModels = await getAvailableImageModels();
    }
  } catch (error) {
    console.error('Failed to load image models:', error);
    imageModels = [];
  }
  console.log('🎬 Image models:', imageModels);
  const adaptedImageModels = imageModels.map(adaptModelForMediaSettings);
  console.log('🎬 Image models:', adaptedImageModels);
  
  // Get the default model using priority system
  let defaultModel: IGenerationConfigRead | undefined;
  
  try {
    if (typeof window !== 'undefined') {
      // Client-side: use priority fallback
      const defaultPriority = ['comfyui/flux', 'comfyui/sdxl', 'flux-dev', 'sdxl'];
      for (const modelName of defaultPriority) {
        defaultModel = imageModels.find(m => m.name === modelName);
        if (defaultModel) break;
      }
    } else {
      // Server-side: use function
      defaultModel = await getDefaultImageModel();
    }
  } catch (error) {
    console.error('Failed to get default image model:', error);
  }
  
  const defaultAdaptedModel = defaultModel 
    ? adaptModelForMediaSettings(defaultModel)
    : adaptedImageModels.find(m => m.name === 'comfyui/flux') ||
      adaptedImageModels.find(m => m.type === 'text_to_image') || 
      adaptedImageModels[0] || {
        name: 'comfyui/flux',
        label: 'FLUX',
        type: 'text_to_image' as any,
        source: 'comfyui' as any,
        params: {},
        id: 'comfyui/flux',
        description: 'Free FLUX model',
        value: 'comfyui/flux',
        workflowPath: '',
        price: 0
      };
  
  // Get styles from API
  let availableStyles: MediaOption[] = [];
  try {
    if (typeof window !== 'undefined') {
      // Client-side: fetch from API endpoint
      const response = await fetch('/api/config/models');
      const data = await response.json();
      availableStyles = data.data?.styles || [
        { id: 'flux_watercolor', label: 'Watercolor', description: 'Watercolor painting style' },
        { id: 'artistic', label: 'Artistic', description: 'Artistic interpretation' },
        { id: 'cartoon', label: 'Cartoon', description: 'Cartoon/animated style' },
        { id: 'abstract', label: 'Abstract', description: 'Abstract art style' },
        { id: 'vintage', label: 'Vintage', description: 'Vintage/retro style' }
      ];
    } else {
      // Server-side: direct API call
      configureSuperduperAI();
      const stylesResponse = await getStyles();
      if ('error' in stylesResponse) {
        console.error('Failed to load styles:', stylesResponse.error);
        // Fallback to hardcoded styles
        availableStyles = [
          { id: 'flux_watercolor', label: 'Watercolor', description: 'Watercolor painting style' },
          { id: 'artistic', label: 'Artistic', description: 'Artistic interpretation' },
          { id: 'cartoon', label: 'Cartoon', description: 'Cartoon/animated style' },
          { id: 'abstract', label: 'Abstract', description: 'Abstract art style' },
          { id: 'vintage', label: 'Vintage', description: 'Vintage/retro style' }
        ];
      } else {
        availableStyles = stylesResponse.items.map(style => ({
          id: style.name,
          label: style.title ?? style.name,
          description: style.title ?? style.name,
        }));
      }
    }
  } catch (error) {
    console.error('Failed to load styles:', error);
    // Fallback to hardcoded styles
    availableStyles = [
      { id: 'flux_watercolor', label: 'Watercolor', description: 'Watercolor painting style' },
      { id: 'artistic', label: 'Artistic', description: 'Artistic interpretation' },
      { id: 'cartoon', label: 'Cartoon', description: 'Cartoon/animated style' },
      { id: 'abstract', label: 'Abstract', description: 'Abstract art style' },
      { id: 'vintage', label: 'Vintage', description: 'Vintage/retro style' }
    ];
  }
  
  // Create configuration
  imageConfigCache = {
    type: 'image-generation-settings',
    availableModels: adaptedImageModels,
    availableResolutions: [
      { width: 1024, height: 1024, label: '1024x1024 (Square)', aspectRatio: '1:1', qualityType: 'hd' },
      { width: 1024, height: 768, label: '1024x768 (Landscape)', aspectRatio: '4:3', qualityType: 'hd' },
      { width: 768, height: 1024, label: '768x1024 (Portrait)', aspectRatio: '3:4', qualityType: 'hd' },
      { width: 1280, height: 720, label: '1280x720 (HD)', aspectRatio: '16:9', qualityType: 'hd' },
      { width: 1920, height: 1080, label: '1920x1080 (Full HD)', aspectRatio: '16:9', qualityType: 'full_hd' },
      { width: 512, height: 512, label: '512x512 (Small Square)', aspectRatio: '1:1', qualityType: 'hd' }
    ],
    availableStyles,
    availableShotSizes: [
      { id: ShotSizeEnum.EXTREME_CLOSE_UP, label: 'Extreme Close-up', description: 'Very tight shot' },
      { id: ShotSizeEnum.CLOSE_UP, label: 'Close-up', description: 'Close-up shot' },
      { id: ShotSizeEnum.MEDIUM_SHOT, label: 'Medium Shot', description: 'Medium distance shot' },
      { id: ShotSizeEnum.LONG_SHOT, label: 'Long Shot', description: 'Full body establishing shot' },
      { id: ShotSizeEnum.EXTREME_LONG_SHOT, label: 'Extreme Long Shot', description: 'Very wide panoramic shot' }
    ],
    defaultSettings: {
      resolution: { width: 1024, height: 1024, label: '1024x1024 (Square)', aspectRatio: '1:1', qualityType: 'hd' },
      style: availableStyles.find(s => s.id === 'flux_watercolor') || availableStyles[0] || { id: 'flux_watercolor', label: 'Watercolor', description: 'Watercolor painting style' },
      shotSize: { id: ShotSizeEnum.MEDIUM_SHOT, label: 'Medium Shot', description: 'Medium distance shot' },
      model: defaultAdaptedModel
    }
  };
  
  cacheTimestamp = now;
  return imageConfigCache;
}

export async function getVideoGenerationConfig(): Promise<VideoGenerationConfig> {
  const now = Date.now();
  
  // Return cached config if still valid
  if (videoConfigCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return videoConfigCache;
  }
  
  // Get models from API endpoint (works on both client and server)
  let videoModels: IGenerationConfigRead[] = [];
  
  try {
    if (typeof window !== 'undefined') {
      // Client-side: fetch from API endpoint
      const response = await fetch('/api/config/models');
      const data = await response.json();
      videoModels = data?.data?.videoModels || [];
    } else {
      // Server-side: direct function call
      configureSuperduperAI();
      videoModels = await getAvailableVideoModels();
    }
  } catch (error) {
    console.error('Failed to load video models:', error);
    videoModels = [];
  }
  
  const adaptedVideoModels = videoModels.map(adaptModelForMediaSettings);

  
  // Get styles from API (same as image generation)
  let availableStyles: MediaOption[] = [];
  try {
    if (typeof window !== 'undefined') {
      // Client-side: fetch from API endpoint
      const response = await fetch('/api/config/models');
      const data = await response.json();
      availableStyles = data.data?.styles || [
        { id: 'cinematic', label: 'Cinematic', description: 'Movie-like style' },
        { id: 'documentary', label: 'Documentary', description: 'Documentary style' },
        { id: 'animated', label: 'Animated', description: 'Animation style' },
        { id: 'flux_watercolor', label: 'Watercolor', description: 'Watercolor painting style' },
        { id: 'artistic', label: 'Artistic', description: 'Artistic interpretation' }
      ];
    } else {
      // Server-side: direct API call
      configureSuperduperAI();
      const stylesResponse = await getStyles();
      if ('error' in stylesResponse) {
        console.error('Failed to load styles:', stylesResponse.error);
        // Fallback to hardcoded styles
        availableStyles = [
          { id: 'cinematic', label: 'Cinematic', description: 'Movie-like style' },
          { id: 'documentary', label: 'Documentary', description: 'Documentary style' },
          { id: 'animated', label: 'Animated', description: 'Animation style' },
          { id: 'flux_watercolor', label: 'Watercolor', description: 'Watercolor painting style' },
          { id: 'artistic', label: 'Artistic', description: 'Artistic interpretation' }
        ];
      } else {
        availableStyles = stylesResponse.items.map(style => ({
          id: style.name,
          label: style.title ?? style.name,
          description: style.title ?? style.name,
        }));
      }
    }
  } catch (error) {
    console.error('Failed to load styles:', error);
    // Fallback to hardcoded styles
    availableStyles = [
      { id: 'cinematic', label: 'Cinematic', description: 'Movie-like style' },
      { id: 'documentary', label: 'Documentary', description: 'Documentary style' },
      { id: 'animated', label: 'Animated', description: 'Animation style' },
      { id: 'flux_watercolor', label: 'Watercolor', description: 'Watercolor painting style' },
      { id: 'artistic', label: 'Artistic', description: 'Artistic interpretation' }
    ];
  }
  
  // Create configuration
  videoConfigCache = {
    type: 'video-generation-settings',
    availableModels: adaptedVideoModels,
    availableResolutions: [
      { width: 1280, height: 720, label: '1280x720 (HD)', aspectRatio: '16:9' },
      { width: 1920, height: 1080, label: '1920x1080 (Full HD)', aspectRatio: '16:9' },
      { width: 854, height: 480, label: '854x480 (SD)', aspectRatio: '16:9' },
      { width: 1024, height: 1024, label: '1024x1024 (Square)', aspectRatio: '1:1' },
      { width: 768, height: 1024, label: '768x1024 (Portrait)', aspectRatio: '3:4' }
    ],
    availableStyles,
    availableShotSizes: [
      { id: ShotSizeEnum.EXTREME_CLOSE_UP, label: 'Extreme Close-up', description: 'Very tight shot' },
      { id: ShotSizeEnum.CLOSE_UP, label: 'Close-up', description: 'Close-up shot' },
      { id: ShotSizeEnum.MEDIUM_SHOT, label: 'Medium Shot', description: 'Medium distance shot' },
      { id: ShotSizeEnum.LONG_SHOT, label: 'Long Shot', description: 'Full body establishing shot' },
      { id: ShotSizeEnum.EXTREME_LONG_SHOT, label: 'Extreme Long Shot', description: 'Very wide panoramic shot' }
    ],
    availableFrameRates: [
      { value: 24, label: '24 FPS (Cinematic)' },
      { value: 30, label: '30 FPS (Standard)' },
      { value: 60, label: '60 FPS (Smooth)' }
    ],
    defaultSettings: {
      resolution: { width: 1280, height: 720, label: '1280x720 (HD)', aspectRatio: '16:9' },
      style: availableStyles.find(s => s.id === 'cinematic') || availableStyles[0] || { id: 'cinematic', label: 'Cinematic', description: 'Movie-like style' },
      shotSize: { id: ShotSizeEnum.LONG_SHOT, label: 'Long Shot', description: 'Full body establishing shot' },
      model: adaptedVideoModels.find(m => m.type === 'text_to_video') || adaptedVideoModels[0] || {
        name: 'fallback',
        label: 'Fallback Model',
        type: 'text_to_video' as any,
        source: 'local' as any,
        params: {},
        id: 'fallback',
        description: 'Fallback model',
        value: 'fallback',
        workflowPath: '',
        price: 0
      },
      frameRate: 30,
      duration: 10,
      negativePrompt: ''
    }
  };
  
  cacheTimestamp = now;
  return videoConfigCache;
}

// Clear cache function for testing/debugging
export function clearMediaSettingsCache(): void {
  imageConfigCache = null;
  videoConfigCache = null;
  cacheTimestamp = 0;
}

// Convenience functions to get just the models
export async function createImageMediaSettings() {
  const config = await getImageGenerationConfig();
  return {
    availableModels: config.availableModels
  };
}

export async function createVideoMediaSettings() {
  const config = await getVideoGenerationConfig();
  return {
    availableModels: config.availableModels
  };
} 