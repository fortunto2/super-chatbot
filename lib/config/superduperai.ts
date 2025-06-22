/**
 * SuperDuperAI API Configuration
 * Simplified configuration with single environment variables
 */

// Generated OpenAPI Client Configuration
import { OpenAPI } from '@/lib/api/core/OpenAPI';
import { GenerationConfigService } from '@/lib/api/services/GenerationConfigService';
import type { IGenerationConfigRead } from '@/lib/api/models/IGenerationConfigRead';
import { GenerationTypeEnum } from '@/lib/api/models/GenerationTypeEnum';
import { ListOrderEnum } from '@/lib/api/models/ListOrderEnum';

// Type aliases for backward compatibility
export type VideoModel = IGenerationConfigRead;
export type ImageModel = IGenerationConfigRead;

interface SuperduperAIConfig {
  url: string;
  token: string;
  wsURL: string;
}

// Cache for models with 1-hour expiration
const modelCache = new Map<string, { data: IGenerationConfigRead[]; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export function getSuperduperAIConfig(): SuperduperAIConfig {
  // For server-side usage
  const url = process.env.SUPERDUPERAI_URL || 'https://dev-editor.superduperai.co';
    const token = process.env.SUPERDUPERAI_TOKEN || process.env.SUPERDUPERAI_API_KEY || '';
    const wsURL = url.replace('https://', 'wss://').replace('http://', 'ws://');

  if (typeof window === 'undefined') {
    const wsURL = url.replace('https://', 'wss://').replace('http://', 'ws://');

    if (!token) {
      throw new Error('SUPERDUPERAI_TOKEN or SUPERDUPERAI_API_KEY environment variable is required');
    }

    return { url, token, wsURL };
  }
  // For client-side usage - return default values
  // Token should be handled by API routes, not exposed to client
  
  return { 
    url, 
    token: '', // Empty token for client - API routes handle authentication
    wsURL 
  };
}

// Client-side function to get config from API
export async function getClientSuperduperAIConfig(): Promise<SuperduperAIConfig> {
  try {
    const response = await fetch('/api/config/superduperai');
    if (!response.ok) {
      throw new Error('Failed to get SuperDuperAI config');
    }
    const data = await response.json();
    
    return {
      url: data.url,
      token: '', // Token is handled server-side
      wsURL: data.wsURL,
    };
  } catch (error) {
    console.error('Failed to get client config:', error);
    // Fallback to default
    return getSuperduperAIConfig();
  }
}

export function configureSuperduperAI(): SuperduperAIConfig {
  const config = getSuperduperAIConfig();
  
  // Configure the generated OpenAPI client
  OpenAPI.BASE = config.url;
  OpenAPI.TOKEN = config.token;
  
  return config;
}

/**
 * Get all available generation models from SuperDuperAI API
 * This function should only be called server-side
 */
export async function getAvailableModels(): Promise<IGenerationConfigRead[]> {
  // This function should only run on server-side
  if (typeof window !== 'undefined') {
    console.error('getAvailableModels() called on client-side, use API endpoint instead');
    return [];
  }

  const cacheKey = 'all_models';
  const cached = modelCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // Configure the client before making requests
    configureSuperduperAI();
    
    const response = await GenerationConfigService.generationConfigGetList({
      limit: 100, // Get more models
      orderBy: 'name',
      order: ListOrderEnum.ASCENDENT
    });

    const models = response.items || [];
    
    // Cache the results
    modelCache.set(cacheKey, {
      data: models,
      timestamp: Date.now()
    });

    return models;
  } catch (error) {
    console.error('Failed to fetch generation models:', error);
    return [];
  }
}

/**
 * Get video generation models (image_to_video, text_to_video, video_to_video)
 */
export async function getAvailableVideoModels(): Promise<VideoModel[]> {
  const allModels = await getAvailableModels();
  
  return allModels.filter(model => 
    model.type === GenerationTypeEnum.IMAGE_TO_VIDEO ||
    model.type === GenerationTypeEnum.TEXT_TO_VIDEO ||
    model.type === GenerationTypeEnum.VIDEO_TO_VIDEO
  );
}

/**
 * Get image generation models (text_to_image, image_to_image)
 */
export async function getAvailableImageModels(): Promise<ImageModel[]> {
  const allModels = await getAvailableModels();
  
  return allModels.filter(model => 
    model.type === GenerationTypeEnum.TEXT_TO_IMAGE ||
    model.type === GenerationTypeEnum.IMAGE_TO_IMAGE
  );
}

/**
 * Find a specific model by name
 */
export function findModel(
  name: string, 
  availableModels?: IGenerationConfigRead[]
): IGenerationConfigRead | undefined {
  if (availableModels) {
    return availableModels.find(model => model.name === name);
  }
  
  // If no models provided, we can't search synchronously
  // This maintains backward compatibility
  return undefined;
}

/**
 * Find a video model by name
 */
export async function findVideoModel(name: string): Promise<VideoModel | undefined> {
  const videoModels = await getAvailableVideoModels();
  return findModel(name, videoModels);
}

/**
 * Find an image model by name
 */
export async function findImageModel(name: string): Promise<ImageModel | undefined> {
  const imageModels = await getAvailableImageModels();
  return findModel(name, imageModels);
}

/**
 * Get default video model
 */
export async function getDefaultVideoModel(): Promise<VideoModel | undefined> {
  const videoModels = await getAvailableVideoModels();
  
  // Priority order for default video models
  const defaultPriority = [
    'comfyui/ltx', // LTX Video
    'google-cloud/veo2', // VEO2 Image-to-Video
    'google-cloud/veo2-text2video', // VEO2 Text-to-Video
  ];
  
  for (const modelName of defaultPriority) {
    const model = findModel(modelName, videoModels);
    if (model) return model;
  }
  
  // Fallback to first available video model
  return videoModels[0];
}

/**
 * Get default image model
 */
export async function getDefaultImageModel(): Promise<ImageModel | undefined> {
  const imageModels = await getAvailableImageModels();
  
  // Priority order for default image models - prioritize free models
  const defaultPriority = [
    'comfyui/flux',     // Free FLUX model (top priority)
    'comfyui/sdxl',     // Free SDXL model
    'flux-dev',         // Alternative FLUX naming
    'sdxl',             // Alternative SDXL naming
  ];
  
  console.log('🎯 Looking for default image model from priority list:', defaultPriority);
  console.log('🎯 Available models:', imageModels.map(m => m.name));
  
  for (const modelName of defaultPriority) {
    const model = findModel(modelName, imageModels);
    if (model) {
      console.log('✅ Selected default image model:', model.name, '(priority:', modelName, ')');
      return model;
    }
  }
  
  // Fallback: avoid expensive/VIP models
  const safeModels = imageModels.filter(m => 
    !m.params?.vip_required && 
    (!m.params?.price || m.params.price <= 1)
  );
  
  if (safeModels.length > 0) {
    console.log('✅ Selected safe fallback image model:', safeModels[0].name);
    return safeModels[0];
  }
  
  // Last resort: first available model
  console.log('⚠️ Using first available image model:', imageModels[0]?.name);
  return imageModels[0];
}

/**
 * Clear model cache (useful for testing or forced refresh)
 */
export function clearModelCache(): void {
  modelCache.clear();
  console.log('🧹 Model cache cleared - next request will fetch fresh data');
}

/**
 * Check if a model supports a specific generation type
 */
export function isVideoModel(model: IGenerationConfigRead): boolean {
  return [
    GenerationTypeEnum.IMAGE_TO_VIDEO,
    GenerationTypeEnum.TEXT_TO_VIDEO,
    GenerationTypeEnum.VIDEO_TO_VIDEO
  ].includes(model.type);
}

/**
 * Check if a model supports image generation
 */
export function isImageModel(model: IGenerationConfigRead): boolean {
  return [
    GenerationTypeEnum.TEXT_TO_IMAGE,
    GenerationTypeEnum.IMAGE_TO_IMAGE
  ].includes(model.type);
}

/**
 * Get model display label
 */
export function getModelLabel(model: IGenerationConfigRead): string {
  return model.label || model.name;
}

/**
 * Get models by generation source
 */
export async function getModelsBySource(source: string): Promise<IGenerationConfigRead[]> {
  const allModels = await getAvailableModels();
  return allModels.filter(model => model.source === source);
}

/**
 * API endpoints for SuperDuperAI
 */
export const API_ENDPOINTS = {
  // Project management
  CREATE_PROJECT: '/api/v1/project',
  GET_PROJECT: '/api/v1/project',
  
  // Media generation
  GENERATE_IMAGE: '/api/v1/file/generate-image',
  GENERATE_VIDEO: '/api/v1/file/generate-video',
  
  // Model information  
  LIST_MODELS: '/api/v1/generation-config',
  MODEL_INFO: '/api/v1/models/{modelId}',
  
  // WebSocket
  PROJECT_WS: '/api/v1/ws/project.{projectId}',
} as const;

/**
 * Create authenticated headers for API requests
 */
export function createAuthHeaders(config?: SuperduperAIConfig): Record<string, string> {
  const apiConfig = config || getSuperduperAIConfig();
  
  // AICODE-NOTE: Bearer token authentication as required by SuperDuperAI API
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiConfig.token}`,
    'User-Agent': 'SuperChatbot/1.0',
  };
}

/**
 * Create full API URL
 */
export function createAPIURL(endpoint: string, config?: SuperduperAIConfig): string {
  const apiConfig = config || getSuperduperAIConfig();
  return `${apiConfig.url}${endpoint}`;
}

/**
 * Create WebSocket URL
 */
export function createWSURL(path: string, config?: SuperduperAIConfig): string {
  const apiConfig = config || getSuperduperAIConfig();
  return `${apiConfig.wsURL}${path}`;
} 