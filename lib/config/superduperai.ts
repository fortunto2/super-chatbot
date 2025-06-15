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
  label?: string; // AICODE-NOTE: UI compatibility - label is alias for name
  description: string;
  maxDuration: number;
  maxResolution: { width: number; height: number };
  supportedFrameRates: number[];
  pricePerSecond: number;
  workflowPath: string;
  supportedAspectRatios: string[];
  supportedQualities: string[];
  isVip?: boolean;
  type?: 'image_to_video' | 'text_to_video' | 'video_to_video'; // AICODE-NOTE: Model type for proper classification
}

// AICODE-NOTE: ImageModel interface for dynamic image generation models
export interface ImageModel {
  id: string;
  name: string;
  label?: string; // AICODE-NOTE: UI compatibility - label is alias for name
  description: string;
  price: number;
  workflowPath: string;
  isVip?: boolean;
  type?: 'text_to_image' | 'image_to_image'; // AICODE-NOTE: Model type for proper classification
  params?: {
    num_images?: number;
    seed?: number;
    guidance_scale?: number;
    safety_tolerance?: number;
  };
}

// AICODE-NOTE: Model cache with 1-hour TTL for performance
interface ModelCache {
  models: VideoModel[];
  timestamp: number;
  ttl: number;
}

// AICODE-NOTE: Image model cache with 1-hour TTL for performance
interface ImageModelCache {
  models: ImageModel[];
  timestamp: number;
  ttl: number;
}

let modelCache: ModelCache | null = null;
let imageModelCache: ImageModelCache | null = null;
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
    // AICODE-NOTE: Import and use the new HTTP client system
    const { apiGet } = await import('@/lib/ai/api/http-client');
    
    const response = await apiGet(API_ENDPOINTS.LIST_MODELS);

    if (!response.success) {
      throw new Error(`Failed to fetch models: ${response.error}`);
    }

    const apiResponse = response.data;
    
    // AICODE-NOTE: API returns paginated response with 'items' field
    if (!apiResponse || typeof apiResponse !== 'object' || !apiResponse.items) {
      console.error('API returned invalid response structure:', apiResponse);
      throw new Error('API returned invalid response structure - missing items field');
    }
    
    const data = apiResponse.items;
    
    if (!Array.isArray(data)) {
      console.error('API items field is not an array:', data);
      throw new Error('API items field is not an array');
    }
    
    console.log('🎬 📋 API returned total:', apiResponse.total, 'items, processing', data.length, 'items');
    
    // AICODE-NOTE: Parse generation configs to VideoModel format - filter ONLY by API type field
    const videoConfigs = data.filter((config: any) => 
      config.type === 'image_to_video' || 
      config.type === 'text_to_video' ||
      config.type === 'video_to_video'
    );
    
    console.log('🎬 📋 Found video configs:', videoConfigs.length, 'out of total:', data.length);
    console.log('🎬 📋 Video models found:', videoConfigs.map((c: any) => c.name));
    
    const models: VideoModel[] = videoConfigs.map((config: any) => ({
      id: config.name,
      name: config.label || config.name,
      label: config.label || config.name,
      description: `${config.source || 'Video generation'} - $${config.params?.price_per_second || config.price || 0.4}/sec`,
      maxDuration: config.params?.max_duration || config.params?.available_durations?.[config.params.available_durations.length - 1] || 30,
      maxResolution: { 
        width: config.params?.max_width || 1216, 
        height: config.params?.max_height || 704 
      },
      supportedFrameRates: config.params?.supported_frame_rates || [24, 30],
      pricePerSecond: config.params?.price_per_second || config.price || 0.4,
      workflowPath: config.workflow_path || `${config.name}/default.json`,
      supportedAspectRatios: config.params?.supported_aspect_ratios || ['16:9', '1:1', '9:16'],
      supportedQualities: config.params?.supported_qualities || ['hd'],
      isVip: config.params?.vip_required || config.vip_required || false,
      type: config.type,
    }));

    // Update cache
    modelCache = {
      models,
      timestamp: Date.now(),
      ttl: CACHE_TTL,
    };

    console.log('🎬 ✅ Successfully loaded video models:', models.map(m => m.id));
    return models;
    
  } catch (error) {
    console.error('Error fetching video models:', error);
    
    // AICODE-NOTE: Fallback to cached data if available, or known fallback model
    if (modelCache) {
      console.warn('Using cached models due to API error');
      return modelCache.models;
    }

    // AICODE-NOTE: Ultimate fallback to ensure system still works
    console.warn('🎬 ⚠️ Using fallback LTX model due to API error');
    return [
      {
        id: 'comfyui/ltx',
        name: 'LTX Video',
        label: 'LTX Video',
        description: 'LTX Video - High quality video generation by Lightricks',
        maxDuration: 30,
        maxResolution: { width: 1216, height: 704 },
        supportedFrameRates: [30],
        pricePerSecond: 0.4,
        workflowPath: 'LTX/default.json',
        supportedAspectRatios: ['16:9', '1:1', '9:16', '21:9'],
        supportedQualities: ['hd', 'sd'],
        type: 'image_to_video',
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
 * Get available image models dynamically from API
 * AICODE-NOTE: Dynamic discovery of image generation models
 */
export async function getAvailableImageModels(): Promise<ImageModel[]> {
  // Check cache first
  if (imageModelCache && Date.now() - imageModelCache.timestamp < imageModelCache.ttl) {
    return imageModelCache.models;
  }

  try {
    // AICODE-NOTE: Import and use the new HTTP client system
    const { apiGet } = await import('@/lib/ai/api/http-client');
    
    const response = await apiGet(API_ENDPOINTS.LIST_MODELS);

    if (!response.success) {
      throw new Error(`Failed to fetch models: ${response.error}`);
    }

    const apiResponse = response.data;
    
    // AICODE-NOTE: API returns paginated response with 'items' field
    if (!apiResponse || typeof apiResponse !== 'object' || !apiResponse.items) {
      console.error('API returned invalid response structure:', apiResponse);
      throw new Error('API returned invalid response structure - missing items field');
    }
    
    const data = apiResponse.items;
    
    if (!Array.isArray(data)) {
      console.error('API items field is not an array:', data);
      throw new Error('API items field is not an array');
    }
    
    console.log('🎨 📋 API returned total:', apiResponse.total, 'items, processing', data.length, 'items');
    
    // AICODE-NOTE: Parse generation configs to ImageModel format - filter ONLY by API type field
    const imageConfigs = data.filter((config: any) => 
      config.type === 'text_to_image' || 
      config.type === 'image_to_image'
    );
    
    console.log('🎨 📋 Found image configs:', imageConfigs.length, 'out of total:', data.length);
    console.log('🎨 📋 Image models found:', imageConfigs.map((c: any) => c.name));
    
    const models: ImageModel[] = imageConfigs.map((config: any) => ({
      id: config.name,
      name: config.label || config.name,
      label: config.label || config.name, // AICODE-NOTE: UI compatibility
      description: `${config.source || 'Image generation'} - $${config.price || 0.1}`,
      price: config.price || 0.1,
      workflowPath: config.params?.workflow_path || `${config.name}/default.json`,
      isVip: config.vip_required || false,
      type: config.type,
      params: {
        num_images: config.params?.num_images || 1,
        seed: config.params?.seed,
        guidance_scale: config.params?.guidance_scale,
        safety_tolerance: config.params?.safety_tolerance,
      },
    }));

    // Update cache
    imageModelCache = {
      models,
      timestamp: Date.now(),
      ttl: CACHE_TTL,
    };

    console.log('🎨 ✅ Successfully loaded image models:', models.map(m => m.id));
    return models;
    
  } catch (error) {
    console.error('Error fetching image models:', error);
    
    // AICODE-NOTE: Fallback to cached data if available, or known fallback models
    if (imageModelCache) {
      console.warn('Using cached image models due to API error');
      return imageModelCache.models;
    }

    // AICODE-NOTE: Ultimate fallback to ensure system still works
    console.warn('🎨 ⚠️ Using fallback Flux models due to API error');
    return [
      {
        id: 'flux-dev',
        name: 'Flux Dev',
        label: 'Flux Dev',
        description: 'Previous generation flux model',
        price: 0.1,
        workflowPath: 'flux-dev/default.json',
        type: 'text_to_image',
        params: {
          num_images: 1,
          guidance_scale: 7.5,
        },
      },
      {
        id: 'flux-pro',
        name: 'Flux Pro Ultra 1.1',
        label: 'Flux Pro Ultra 1.1',
        description: 'Latest flux model with high quality and creativity',
        price: 0.2,
        workflowPath: 'flux-pro/default.json',
        type: 'text_to_image',
        params: {
          num_images: 1,
          guidance_scale: 7.5,
        },
      },
    ];
  }
}

/**
 * Find image model by name or ID
 */
export async function findImageModel(nameOrId: string): Promise<ImageModel | null> {
  const models = await getAvailableImageModels();
  return models.find(model => 
    model.id === nameOrId || 
    model.name.toLowerCase().includes(nameOrId.toLowerCase())
  ) || null;
}

/**
 * Get default image model
 * AICODE-NOTE: Dynamically selects first available model
 */
export async function getDefaultImageModel(): Promise<ImageModel> {
  const models = await getAvailableImageModels();
  return models[0]; // Return first available model
}

/**
 * Clear image model cache (useful for testing or forced refresh)
 */
export function clearImageModelCache(): void {
  imageModelCache = null;
}

/**
 * Clear all model caches
 */
export function clearAllModelCaches(): void {
  modelCache = null;
  imageModelCache = null;
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