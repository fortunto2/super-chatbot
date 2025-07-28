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
import { API_NEXT_ROUTES } from './next-api-routes';

// Type aliases for backward compatibility
export type VideoModel = IGenerationConfigRead;
export type ImageModel = IGenerationConfigRead;

interface SuperduperAIConfig {
  url: string;
  token: string;
  wsURL: string; // Deprecated - kept for backward compatibility
}

// Cache for models with 1-hour expiration
const modelCache = new Map<string, { data: IGenerationConfigRead[]; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Validate Bearer token format
 * Ensures token is properly formatted for API authentication
 */
function validateBearerToken(token: string): boolean {
  // Remove 'Bearer ' prefix if present
  const cleanToken = token.replace(/^Bearer\s+/i, '');
  
  // Basic validation: alphanumeric characters, minimum length
  const tokenRegex = /^[a-zA-Z0-9_-]{32,}$/;
  
  if (!tokenRegex.test(cleanToken)) {
    console.warn('Token validation failed: Invalid format');
    return false;
  }
  
  // Additional checks can be added here (expiration, JWT validation, etc.)
  return true;
}

export function getSuperduperAIConfig(): SuperduperAIConfig {
  if (typeof window === 'undefined') {
    // Server-side: Real external API
    const url = process.env.SUPERDUPERAI_URL || 'https://dev-editor.superduperai.co';
    const token = process.env.SUPERDUPERAI_TOKEN || '';
    const wsURL = url.replace('https://', 'wss://').replace('http://', 'ws://');

    if (!token) {
      throw new Error('SUPERDUPERAI_TOKEN environment variable is required');
    }

    // Token validation for Bearer token format
    if (!validateBearerToken(token)) {
      throw new Error('SUPERDUPERAI_TOKEN must be a valid format. Expected: alphanumeric string, 32+ characters');
    }

    return { url, token, wsURL };
  }

  // Client-side: Use current origin for proxy paths
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  return { 
    url: currentOrigin, // Use current origin for proxy paths
    token: '', // Never expose tokens to client
    wsURL: '' // Deprecated
  };
}

// Client-side function to get config from API
export async function getClientSuperduperAIConfig(): Promise<SuperduperAIConfig> {
  try {
    const response = await fetch(API_NEXT_ROUTES.SUPERDUPERAI);
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
 * Configure OpenAPI client for client-side usage with proxy endpoints
 */
export function configureClientOpenAPI(): void {
  if (typeof window !== 'undefined') {
    // Client-side: Use current origin for proxy paths
    OpenAPI.BASE = window.location.origin;
    OpenAPI.TOKEN = ''; // No token on client-side
    
    console.log('OpenAPI configured for client-side with BASE:', OpenAPI.BASE);
  }
}

/**
 * Fix model types for known problematic models
 * AICODE-NOTE: Override incorrect API configurations
 */
function fixModelTypes(models: IGenerationConfigRead[]): IGenerationConfigRead[] {
  return models.map(model => {
    // Fix LTX model type - should be text_to_video, not image_to_video
    if (model.name === 'comfyui/ltx' && model.type === GenerationTypeEnum.IMAGE_TO_VIDEO) {
      console.log(`🔧 Fixing LTX model type: ${model.type} → ${GenerationTypeEnum.TEXT_TO_VIDEO}`);
      return {
        ...model,
        type: GenerationTypeEnum.TEXT_TO_VIDEO
      };
    }
    
    return model;
  });
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
    
    // AICODE-NOTE: Fix problematic model types
    const fixedModels = fixModelTypes(models);
    
    // Cache the results
    modelCache.set(cacheKey, {
      data: fixedModels,
      timestamp: Date.now()
    });

    return fixedModels;
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
  
  // Priority order for default video models - prioritize text-to-video models!
  const defaultPriority = [
    'azure-openai/sora', // Sora Text-to-Video (FIRST PRIORITY for text prompts!)
    'google-cloud/veo2-text2video', // VEO2 Text-to-Video  
    'google-cloud/veo3-text2video', // VEO3 Text-to-Video
    'comfyui/ltx', // LTX Video (only if configured as text_to_video)
    'google-cloud/veo2', // VEO2 Image-to-Video (fallback)
    'google-cloud/veo3', // VEO3 Image-to-Video (fallback)
  ];
  
  console.log('🎬 Looking for default video model from priority list:', defaultPriority);
  console.log('🎬 Available video models:', videoModels.map(m => `${m.name} (${m.type})`));
  
  for (const modelName of defaultPriority) {
    const model = findModel(modelName, videoModels);
    if (model) {
      console.log('✅ Selected default video model:', model.name, '(type:', model.type, ')');
      return model;
    }
  }
  
  // Fallback to first available video model
  console.log('⚠️ Using first available video model:', videoModels[0]?.name);
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

/**
 * Create authenticated headers for API requests
 */
export function createAuthHeaders(config?: SuperduperAIConfig): Record<string, string> {
  const apiConfig = config || getSuperduperAIConfig();
  
  // For client-side requests, don't include Authorization header (proxy handles it)
  if (typeof window !== 'undefined') {
    return {
      'Content-Type': 'application/json',
    };
  }
  
  // Enhanced User-Agent with version info and client identification
  const userAgent = `SuperChatbot/3.0.22 (NextJS/${process.env.NODE_ENV || 'development'}; AI-Chatbot)`;
  
  // Server-side only - Bearer token authentication as required by SuperDuperAI API
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiConfig.token}`,
    'User-Agent': userAgent,
    'X-Client-Version': '3.0.22',
    'X-Client-Platform': 'NextJS',
  };
}

/**
 * Create full API URL
 */
export function createAPIURL(endpoint: string, config?: SuperduperAIConfig): string {
  const apiConfig = config || getSuperduperAIConfig();
  
  // For client-side: just return the endpoint as is (should be proxy paths)
  if (typeof window !== 'undefined') {
    return endpoint;
  }
  
  // Server-side: build full URL
  return `${apiConfig.url}${endpoint}`;
}

/**
 * Create SSE URL for file events (via Next.js proxy)
 */
export function createFileSSEURL(fileId: string, config?: SuperduperAIConfig): string {
  // Always use Next.js proxy for SSE connections
  return `/api/events/file.${fileId}`;
}

/**
 * Create SSE URL for project events (via Next.js proxy)
 */
export function createProjectSSEURL(projectId: string, config?: SuperduperAIConfig): string {
  // Always use Next.js proxy for SSE connections
  return `/api/events/project.${projectId}`;
}

/**
 * Create SSE URL for user events (via Next.js proxy)
 */
export function createUserSSEURL(userId: string, config?: SuperduperAIConfig): string {
  // Always use Next.js proxy for SSE connections
  return `/api/events/user.${userId}`;
}

/**
 * Create WebSocket URL (deprecated - use SSE instead)
 * @deprecated Use createSSEURL instead
 */
export function createWSURL(path: string, config?: SuperduperAIConfig): string {
  const apiConfig = config || getSuperduperAIConfig();
  return `${apiConfig.wsURL}${path}`;
} 

/**
 * Get SuperDuperAI token for user from Auth0 session with fallback to system token
 * @param session - NextAuth session object
 * @returns SuperDuperAI token (user token if available, system token as fallback)
 */
export function getSuperduperAITokenForUser(session: any): { token: string; isUserToken: boolean } {
  console.log('session SUPERDUPERAI', {
   session
  });

  // Try to get user's SuperDuperAI token from session
  let userToken = session?.user?.superduperaiToken || session?.superduperaiToken;
  
  // For testing: use TEST_USER_SUPERDUPERAI_TOKEN if available
  if (!userToken && process.env.TEST_USER_SUPERDUPERAI_TOKEN) {
    userToken = process.env.TEST_USER_SUPERDUPERAI_TOKEN;
    console.log('🔧 SuperDuperAI: Using TEST_USER_SUPERDUPERAI_TOKEN for testing');
  }
  
  if (userToken && typeof userToken === 'string' && userToken.length > 10) {
    console.log('🔧 SuperDuperAI: Using user token for user:', session?.user?.email, `(token length: ${userToken.length})`);
    return { token: userToken, isUserToken: true };
  }
  
  // Fallback to system token
  const systemConfig = getSuperduperAIConfig();
  console.log('🔧 SuperDuperAI: User has no token, using system token for user:', session?.user?.email || 'unknown');
  return { token: systemConfig.token, isUserToken: false };
}

/**
 * Get SuperDuperAI configuration with user token from session
 * @param session - NextAuth session object  
 * @returns SuperDuperAI configuration with user or system token
 */
export function getSuperduperAIConfigWithUserToken(session: any): SuperduperAIConfig & { isUserToken: boolean } {
  const baseConfig = getSuperduperAIConfig();
  const { token, isUserToken } = getSuperduperAITokenForUser(session);
  
  console.log('🔧 SuperDuperAI: getSuperduperAIConfigWithUserToken called with session:', {
    hasSession: !!session,
    hasUser: !!session?.user,
    userEmail: session?.user?.email,
    hasSessionToken: !!session?.superduperaiToken,
    hasUserToken: !!session?.user?.superduperaiToken,
    isUserToken,
    tokenLength: token ? token.length : 0
  });

  // If using user token, ensure user exists in SuperDuperAI
  if (isUserToken && session?.user?.email) {
    // We'll handle user creation/existence check in the API calls
    console.log('🔧 SuperDuperAI: Will verify user existence for:', session.user.email);
  }

  return {
    ...baseConfig,
    token,
    isUserToken
  };
} 

/**
 * Automatically create user in SuperDuperAI if they don't exist
 */
export async function ensureUserExistsInSuperduperAI(session: any): Promise<boolean> {
  if (!session?.user?.email) {
    console.log('❌ No user email in session, cannot create SuperDuperAI user');
    return false;
  }

  try {
    const config = getSuperduperAIConfigWithUserToken(session);
    
    // Try to get current user info - this will fail if user doesn't exist
    const userInfoUrl = `${config.url}/api/v1/user/profile`;
    
    const response = await fetch(userInfoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log('✅ User already exists in SuperDuperAI:', session.user.email);
      return true;
    }

    // User doesn't exist, try to create them
    console.log('🔧 User not found in SuperDuperAI, attempting to create:', session.user.email);
    
    // Note: SuperDuperAI might auto-create users on first API call with valid Auth0 token
    // If not, we'd need to call their user creation endpoint here
    // For now, we'll rely on the Auth0 integration to handle this
    
    return true;
  } catch (error) {
    console.error('❌ Error ensuring user exists in SuperDuperAI:', error);
    return false;
  }
} 