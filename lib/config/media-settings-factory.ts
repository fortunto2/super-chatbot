import { getAvailableVideoModels, getAvailableImageModels, configureSuperduperAI, getDefaultImageModel, getDefaultVideoModel } from './superduperai';
import type { ImageGenerationConfig, VideoGenerationConfig } from '../types/media-settings';
import type { IGenerationConfigRead } from '../api/models/IGenerationConfigRead';

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
  
  // Configure client
  configureSuperduperAI();
  
  // Load image models from API
  const imageModels = await getAvailableImageModels();
  const adaptedImageModels = imageModels.map(adaptModelForMediaSettings);
  
  // Get the default model using our priority system
  const defaultModel = await getDefaultImageModel();
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
  
  // Create configuration
  imageConfigCache = {
    type: 'image-generation-settings',
    availableModels: adaptedImageModels,
    availableResolutions: [
      { width: 1024, height: 1024, label: '1024x1024 (Square)', aspectRatio: '1:1' },
      { width: 1024, height: 768, label: '1024x768 (Landscape)', aspectRatio: '4:3' },
      { width: 768, height: 1024, label: '768x1024 (Portrait)', aspectRatio: '3:4' },
      { width: 1280, height: 720, label: '1280x720 (HD)', aspectRatio: '16:9' },
      { width: 512, height: 512, label: '512x512 (Small Square)', aspectRatio: '1:1' }
    ],
    availableStyles: [
      { id: 'realistic', label: 'Realistic', description: 'Photorealistic style' },
      { id: 'artistic', label: 'Artistic', description: 'Artistic interpretation' },
      { id: 'cartoon', label: 'Cartoon', description: 'Cartoon/animated style' },
      { id: 'abstract', label: 'Abstract', description: 'Abstract art style' },
      { id: 'vintage', label: 'Vintage', description: 'Vintage/retro style' }
    ],
    availableShotSizes: [
      { id: 'extreme-close-up', label: 'Extreme Close-up', description: 'Very tight shot' },
      { id: 'close-up', label: 'Close-up', description: 'Close-up shot' },
      { id: 'medium', label: 'Medium Shot', description: 'Medium distance shot' },
      { id: 'wide', label: 'Wide Shot', description: 'Wide establishing shot' },
      { id: 'extreme-wide', label: 'Extreme Wide', description: 'Very wide panoramic shot' }
    ],
    defaultSettings: {
      resolution: { width: 1024, height: 1024, label: '1024x1024 (Square)', aspectRatio: '1:1' },
      style: { id: 'realistic', label: 'Realistic', description: 'Photorealistic style' },
      shotSize: { id: 'medium', label: 'Medium Shot', description: 'Medium distance shot' },
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
  
  // Configure client
  configureSuperduperAI();
  
  // Load video models from API
  const videoModels = await getAvailableVideoModels();
  const adaptedVideoModels = videoModels.map(adaptModelForMediaSettings);
  
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
    availableStyles: [
      { id: 'cinematic', label: 'Cinematic', description: 'Movie-like style' },
      { id: 'documentary', label: 'Documentary', description: 'Documentary style' },
      { id: 'animated', label: 'Animated', description: 'Animation style' },
      { id: 'realistic', label: 'Realistic', description: 'Photorealistic style' },
      { id: 'artistic', label: 'Artistic', description: 'Artistic interpretation' }
    ],
    availableShotSizes: [
      { id: 'extreme-close-up', label: 'Extreme Close-up', description: 'Very tight shot' },
      { id: 'close-up', label: 'Close-up', description: 'Close-up shot' },
      { id: 'medium', label: 'Medium Shot', description: 'Medium distance shot' },
      { id: 'wide', label: 'Wide Shot', description: 'Wide establishing shot' },
      { id: 'extreme-wide', label: 'Extreme Wide', description: 'Very wide panoramic shot' }
    ],
    availableFrameRates: [
      { value: 24, label: '24 FPS (Cinematic)' },
      { value: 30, label: '30 FPS (Standard)' },
      { value: 60, label: '60 FPS (Smooth)' }
    ],
    defaultSettings: {
      resolution: { width: 1280, height: 720, label: '1280x720 (HD)', aspectRatio: '16:9' },
      style: { id: 'cinematic', label: 'Cinematic', description: 'Movie-like style' },
      shotSize: { id: 'wide', label: 'Wide Shot', description: 'Wide establishing shot' },
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