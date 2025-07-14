/**
 * SuperDuperAI Client-Safe Configuration
 * Contains functions that can safely run on both client and server
 */

// Generated OpenAPI Client Configuration
import { OpenAPI } from '@/lib/api/core/OpenAPI';
import { GenerationConfigService } from '@/lib/api/services/GenerationConfigService';
import type { IGenerationConfigRead } from '@/lib/api/models/IGenerationConfigRead';
import { GenerationTypeEnum } from '@/lib/api/models/GenerationTypeEnum';
import { ListOrderEnum } from '@/lib/api/models/ListOrderEnum';
import { API_NEXT_ROUTES } from './next-api-routes';

// Type aliases for backward compatibility
export type VideoModel = IGenerationConfigRead;
export type ImageModel = IGenerationConfigRead;

export interface SuperduperAIConfig {
  url: string;
  token: string;
  wsURL: string; // Deprecated - kept for backward compatibility
}

// Cache for models with 1-hour expiration
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const modelsCache = new Map<string, CacheEntry<IGenerationConfigRead[]>>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

function validateBearerToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    console.warn('Invalid token: must be a non-empty string');
    return false;
  }

  // Remove 'Bearer ' prefix if present and check format
  const cleanToken = token.replace(/^Bearer\s+/i, '');
  
  // Basic format validation - should be alphanumeric with some special chars
  if (!/^[A-Za-z0-9\-_\.]+$/.test(cleanToken)) {
    console.warn('Invalid token format: contains invalid characters');
    return false;
  }

  return true;
}

export function getSuperduperAIConfig(): SuperduperAIConfig {
  const url = process.env.SUPERDUPERAI_URL || process.env.NEXT_PUBLIC_SUPERDUPERAI_URL;
  const token = process.env.SUPERDUPERAI_TOKEN || process.env.NEXT_PUBLIC_SUPERDUPERAI_TOKEN;

  if (!url) {
    throw new Error('SuperDuperAI URL is not configured. Please set SUPERDUPERAI_URL or NEXT_PUBLIC_SUPERDUPERAI_URL environment variable.');
  }

  if (!token) {
    throw new Error('SuperDuperAI token is not configured. Please set SUPERDUPERAI_TOKEN or NEXT_PUBLIC_SUPERDUPERAI_TOKEN environment variable.');
  }

  if (!validateBearerToken(token)) {
    throw new Error('Invalid SuperDuperAI token format');
  }

  return {
    url,
    token,
    wsURL: url.replace(/^https?:/, 'wss:'), // Deprecated
  };
}

/**
 * Configuration for user connection requirements
 */
export function getGenerationPolicy() {
  return {
    // Если true - требует подключения пользователя, если false - разрешает системный fallback
    requireUserConnection: process.env.REQUIRE_USER_SUPERDUPERAI_CONNECTION === 'true',
    // Разрешить генерацию гостям (неавторизованным пользователям)
    allowGuestGeneration: process.env.ALLOW_GUEST_GENERATION === 'true'
  };
}

export async function getClientSuperduperAIConfig(): Promise<SuperduperAIConfig> {
  try {
    const response = await fetch(API_NEXT_ROUTES.SUPERDUPERAI);
    if (!response.ok) {
      throw new Error(`Failed to fetch SuperDuperAI config: ${response.status}`);
    }
    const config = await response.json();
    
    if (!config.url || !config.token) {
      throw new Error('Invalid SuperDuperAI config received from server');
    }
    
    return config;
  } catch (error) {
    console.error('Failed to get client SuperDuperAI config:', error);
    // Fallback to environment variables if available on client
    return getSuperduperAIConfig();
  }
}

export function configureSuperduperAI(customConfig?: SuperduperAIConfig): SuperduperAIConfig {
  const config = customConfig || getSuperduperAIConfig();
  
  // Configure OpenAPI client
  OpenAPI.BASE = config.url;
  OpenAPI.TOKEN = config.token;
  
  return config;
}

export function configureClientOpenAPI(): void {
  // This will be used on the client side to configure OpenAPI
  // It will fetch config from the server-side API
  getClientSuperduperAIConfig().then(config => {
    OpenAPI.BASE = config.url;
    OpenAPI.TOKEN = config.token;
  }).catch(error => {
    console.error('Failed to configure client OpenAPI:', error);
  });
}

function fixModelTypes(models: IGenerationConfigRead[]): IGenerationConfigRead[] {
  return models.map(model => {
    // Fix LTX model type
    if (model.name === 'ltx' && model.type === GenerationTypeEnum.IMAGE_TO_VIDEO) {
      return {
        ...model,
        type: GenerationTypeEnum.TEXT_TO_VIDEO,
      };
    }
    return model;
  });
}

export async function getAvailableModels(): Promise<IGenerationConfigRead[]> {
  const cacheKey = 'all_models';
  const cached = modelsCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // Get all models with pagination
    const allModels: IGenerationConfigRead[] = [];
    let offset = 0;
    const limit = 100;
    
    while (true) {
      const response = await GenerationConfigService.generationConfigGetList({
        offset,
        limit,
      });
      
      if (!response.items || response.items.length === 0) {
        break;
      }
      
      allModels.push(...response.items);
      
      // If we got less than the limit, we've reached the end
      if (response.items.length < limit) {
        break;
      }
      
      offset += limit;
    }

    const fixedModels = fixModelTypes(allModels);
    
    // Cache the result
    modelsCache.set(cacheKey, {
      data: fixedModels,
      timestamp: Date.now(),
    });
    
    return fixedModels;
  } catch (error) {
    console.error('Failed to fetch available models:', error);
    return [];
  }
}

export async function getAvailableVideoModels(): Promise<VideoModel[]> {
  const allModels = await getAvailableModels();
  return allModels.filter(model => 
    model.type === GenerationTypeEnum.TEXT_TO_VIDEO ||
    model.type === GenerationTypeEnum.IMAGE_TO_VIDEO ||
    model.type === GenerationTypeEnum.VIDEO_TO_VIDEO
  );
}

export async function getAvailableImageModels(): Promise<ImageModel[]> {
  const allModels = await getAvailableModels();
  return allModels.filter(model => 
    model.type === GenerationTypeEnum.TEXT_TO_IMAGE ||
    model.type === GenerationTypeEnum.IMAGE_TO_IMAGE
  );
}

export function findModel(
  name: string, 
  availableModels?: IGenerationConfigRead[]
): IGenerationConfigRead | undefined {
  if (!availableModels) {
    console.warn('No available models provided to findModel');
    return undefined;
  }
  
  return availableModels.find(model => 
    model.name.toLowerCase() === name.toLowerCase()
  );
}

export async function findVideoModel(name: string): Promise<VideoModel | undefined> {
  const videoModels = await getAvailableVideoModels();
  return findModel(name, videoModels);
}

export async function findImageModel(name: string): Promise<ImageModel | undefined> {
  const imageModels = await getAvailableImageModels();
  return findModel(name, imageModels);
}

export async function getDefaultVideoModel(): Promise<VideoModel | undefined> {
  try {
    const videoModels = await getAvailableVideoModels();
    
    // Priority order for default video models
    const priorities = ['ltx', 'minimax', 'haiper', 'runway', 'luma'];
    
    for (const priority of priorities) {
      const model = findModel(priority, videoModels);
      if (model) {
        return model;
      }
    }
    
    // If no priority model found, return the first available
    if (videoModels.length > 0) {
      return videoModels[0];
    }
    
    return undefined;
  } catch (error) {
    console.error('Failed to get default video model:', error);
    return undefined;
  }
}

export async function getDefaultImageModel(): Promise<ImageModel | undefined> {
  try {
    const imageModels = await getAvailableImageModels();
    
    // Priority order for default image models  
    const priorities = [
      'flux',
      'flux-pro', 
      'dall-e-3',
      'dall-e-2',
      'midjourney',
      'stable-diffusion'
    ];
    
    for (const priority of priorities) {
      const model = findModel(priority, imageModels);
      if (model) {
        return model;
      }
    }
    
    // If no priority model found, return the first available
    if (imageModels.length > 0) {
      return imageModels[0];
    }
    
    return undefined;
  } catch (error) {
    console.error('Failed to get default image model:', error);
    return undefined;
  }
}

export function clearModelCache(): void {
  modelsCache.clear();
}

export function isVideoModel(model: IGenerationConfigRead): boolean {
  return model.type === GenerationTypeEnum.TEXT_TO_VIDEO ||
         model.type === GenerationTypeEnum.IMAGE_TO_VIDEO ||
         model.type === GenerationTypeEnum.VIDEO_TO_VIDEO;
}

export function isImageModel(model: IGenerationConfigRead): boolean {
  return model.type === GenerationTypeEnum.TEXT_TO_IMAGE ||
         model.type === GenerationTypeEnum.IMAGE_TO_IMAGE;
}

export function getModelLabel(model: IGenerationConfigRead): string {
  return model.label || model.name;
}

export async function getModelsBySource(source: string): Promise<IGenerationConfigRead[]> {
  const allModels = await getAvailableModels();
  return allModels.filter(model => {
    // Check if model source contains the requested source
    // This is a simple string matching - you might want to make it more sophisticated
    const modelSource = model.source?.toLowerCase() || '';
    return modelSource.includes(source.toLowerCase());
  });
}

export function createAuthHeaders(config?: SuperduperAIConfig): Record<string, string> {
  const activeConfig = config || getSuperduperAIConfig();
  
  if (!validateBearerToken(activeConfig.token)) {
    throw new Error('Invalid token format for creating auth headers');
  }
  
  return {
    'Authorization': `Bearer ${activeConfig.token}`,
    'Content-Type': 'application/json',
  };
}

export function createAPIURL(endpoint: string, config?: SuperduperAIConfig): string {
  const activeConfig = config || getSuperduperAIConfig();
  const baseUrl = activeConfig.url.replace(/\/$/, ''); // Remove trailing slash
  const cleanEndpoint = endpoint.replace(/^\//, ''); // Remove leading slash
  return `${baseUrl}/${cleanEndpoint}`;
}

export function createFileSSEURL(fileId: string, config?: SuperduperAIConfig): string {
  const activeConfig = config || getSuperduperAIConfig();
  const baseUrl = activeConfig.url.replace(/^https?:/, 'wss:').replace(/\/$/, '');
  return `${baseUrl}/api/v1/events/file.${fileId}`;
}

export function createProjectSSEURL(projectId: string, config?: SuperduperAIConfig): string {
  const activeConfig = config || getSuperduperAIConfig();
  const baseUrl = activeConfig.url.replace(/^https?:/, 'wss:').replace(/\/$/, '');
  return `${baseUrl}/api/v1/events/project.${projectId}`;
}

export function createUserSSEURL(userId: string, config?: SuperduperAIConfig): string {
  const activeConfig = config || getSuperduperAIConfig();
  const baseUrl = activeConfig.url.replace(/^https?:/, 'wss:').replace(/\/$/, '');
  return `${baseUrl}/api/v1/events/user.${userId}`;
}

export function createWSURL(path: string, config?: SuperduperAIConfig): string {
  const activeConfig = config || getSuperduperAIConfig();
  const baseUrl = activeConfig.url.replace(/^https?:/, 'wss:').replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  return `${baseUrl}/${cleanPath}`;
}

/**
 * API endpoints for SuperDuperAI
 */
export const API_ENDPOINTS = {
  // Project management
  CREATE_PROJECT: '/api/v1/project',
  GET_PROJECT: '/api/v1/project',
  
  // Media generation - new file-based endpoints
  GENERATE_IMAGE: '/api/v1/file/generate-image',
  GENERATE_VIDEO: '/api/v1/file/generate-video',
  
  // Model information  
  LIST_MODELS: '/api/v1/generation-config',
  MODEL_INFO: '/api/v1/models/{modelId}',
  
  // SSE Events - three channel types
  SSE_FILE_EVENTS: '/api/v1/events/file.{fileId}',
  SSE_PROJECT_EVENTS: '/api/v1/events/project.{projectId}',
  SSE_USER_EVENTS: '/api/v1/events/user.{userId}',
  
  // Legacy WebSocket endpoints (deprecated)
  PROJECT_WS: '/api/v1/ws/project.{projectId}'
} as const; 