/**
 * SuperDuperAI API Configuration
 * Simplified configuration with single environment variables
 */

export interface SuperDuperAIConfig {
  baseURL: string;
  wsURL: string;
  apiToken: string;
}

// AICODE-NOTE: Dynamic video model structure returned from API
export interface VideoModel {
  id: string;
  name: string;
  description: string;
  maxDuration: number;
  maxResolution: { width: number; height: number };
  supportedFrameRates: number[];
  pricePerSecond: number;
  workflowPath: string;
  supportedAspectRatios: string[];
  supportedQualities: string[];
  isVip?: boolean;
}

// AICODE-NOTE: Model cache with 1-hour TTL for performance
interface ModelCache {
  models: VideoModel[];
  timestamp: number;
  ttl: number;
}

let modelCache: ModelCache | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Get SuperDuperAI configuration with simplified environment variables
 * AICODE-NOTE: Uses only SUPERDUPERAI_TOKEN and SUPERDUPERAI_URL
 */
export function getSuperduperAIConfig(): SuperDuperAIConfig {
  const baseURL = process.env.SUPERDUPERAI_URL || 'https://dev-editor.superduperai.co';
  const wsURL = baseURL.replace('https://', 'wss://').replace('http://', 'ws://');
  const apiToken = process.env.SUPERDUPERAI_TOKEN || '';

  if (!apiToken) {
    throw new Error(
      'SuperDuperAI API token is required. Please set SUPERDUPERAI_TOKEN in your environment variables.'
    );
  }

  return {
    baseURL,
    wsURL,
    apiToken,
  };
}

/**
 * Get available video models dynamically from API
 * AICODE-NOTE: Replaces hardcoded VIDEO_MODELS constant with dynamic discovery
 */
export async function getAvailableVideoModels(): Promise<VideoModel[]> {
  // Check cache first
  if (modelCache && Date.now() - modelCache.timestamp < modelCache.ttl) {
    return modelCache.models;
  }

  try {
    const config = getSuperduperAIConfig();
    const response = await fetch(createAPIURL(API_ENDPOINTS.LIST_MODELS), {
      headers: createAuthHeaders(config),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    
    // AICODE-NOTE: Parse generation configs to VideoModel format
    const videoConfigs = data.filter((config: any) => 
      config.type === 'image_to_video' || 
      config.name.toLowerCase().includes('video') ||
      config.name.toLowerCase().includes('ltx')
    );
    
    const models: VideoModel[] = videoConfigs.map((config: any) => ({
      id: config.name,
      name: config.label || config.name,
      description: `${config.source || 'Video generation'} - $${config.params?.price_per_second || config.price || 0.4}/sec`,
      maxDuration: config.params?.max_duration || 30,
      maxResolution: { 
        width: config.params?.max_width || 1216, 
        height: config.params?.max_height || 704 
      },
      supportedFrameRates: config.params?.supported_frame_rates || [30],
      pricePerSecond: config.params?.price_per_second || config.price || 0.4,
      workflowPath: config.workflow_path || `${config.name}/default.json`,
      supportedAspectRatios: config.params?.supported_aspect_ratios || ['16:9', '1:1', '9:16'],
      supportedQualities: config.params?.supported_qualities || ['hd'],
      isVip: config.vip_required || false,
    }));

    // Update cache
    modelCache = {
      models,
      timestamp: Date.now(),
      ttl: CACHE_TTL,
    };

    return models;
  } catch (error) {
    console.error('Error fetching video models:', error);
    
    // AICODE-NOTE: Fallback to cached data if available, or known fallback model
    if (modelCache) {
      console.warn('Using cached models due to API error');
      return modelCache.models;
    }

    // AICODE-NOTE: Ultimate fallback to ensure system still works
    return [
      {
        id: 'comfyui/ltx',
        name: 'LTX Video',
        description: 'LTX Video - High quality video generation by Lightricks',
        maxDuration: 30,
        maxResolution: { width: 1216, height: 704 },
        supportedFrameRates: [30],
        pricePerSecond: 0.4,
        workflowPath: 'LTX/default.json',
        supportedAspectRatios: ['16:9', '1:1', '9:16', '21:9'],
        supportedQualities: ['hd', 'sd'],
      },
    ];
  }
}

/**
 * Find video model by name or ID
 */
export async function findVideoModel(nameOrId: string): Promise<VideoModel | null> {
  const models = await getAvailableVideoModels();
  return models.find(model => 
    model.id === nameOrId || 
    model.name.toLowerCase().includes(nameOrId.toLowerCase())
  ) || null;
}

/**
 * Get default video model
 * AICODE-NOTE: Dynamically selects first available model
 */
export async function getDefaultVideoModel(): Promise<VideoModel> {
  const models = await getAvailableVideoModels();
  return models[0]; // Return first available model
}

/**
 * Clear model cache (useful for testing or forced refresh)
 */
export function clearModelCache(): void {
  modelCache = null;
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
  LIST_MODELS: '/api/v1/generation-configs',
  MODEL_INFO: '/api/v1/models/{modelId}',
  
  // WebSocket
  PROJECT_WS: '/api/v1/ws/project.{projectId}',
} as const;

/**
 * Create authenticated headers for API requests
 */
export function createAuthHeaders(config?: SuperDuperAIConfig): Record<string, string> {
  const apiConfig = config || getSuperduperAIConfig();
  
  // AICODE-NOTE: Bearer token authentication as required by SuperDuperAI API
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiConfig.apiToken}`,
    'User-Agent': 'SuperChatbot/1.0',
  };
}

/**
 * Create full API URL
 */
export function createAPIURL(endpoint: string, config?: SuperDuperAIConfig): string {
  const apiConfig = config || getSuperduperAIConfig();
  return `${apiConfig.baseURL}${endpoint}`;
}

/**
 * Create WebSocket URL
 */
export function createWSURL(path: string, config?: SuperDuperAIConfig): string {
  const apiConfig = config || getSuperduperAIConfig();
  return `${apiConfig.wsURL}${path}`;
} 