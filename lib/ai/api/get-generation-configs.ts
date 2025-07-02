import { apiGet } from './http-client';

export interface GenerationConfig {
  id: string;
  name: string;
  label: string;
  type: 'image_to_image' | 'image_to_video' | 'text_to_image' | 'text_to_video';
  source: string;
  params: {
    arguments_template?: string;
    num_images?: number;
    seed?: number;
    guidance_scale?: number;
    safety_tolerance?: number;
    workflow_path?: string;
    price_per_second?: number;
    available_durations?: number[];
  };
  vip_required: boolean;
  price: number;
}

export interface GenerationConfigResponse {
  success: boolean;
  data?: GenerationConfig[];
  error?: string;
  total?: number;
  limit?: number;
  offset?: number;
}

export interface GenerationConfigParams {
  order_by?: 'name' | 'created_at' | 'price';
  order?: 'descendent' | 'ascendent';
  limit?: number;
  offset?: number;
  type?: 'image_to_image' | 'image_to_video' | 'text_to_image' | 'text_to_video';
}

/**
 * Fetch generation configurations from SuperDuperAI API
 */
export const getGenerationConfigs = async (
  params?: GenerationConfigParams
): Promise<GenerationConfigResponse> => {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params?.order_by) queryParams.set('order_by', params.order_by);
    if (params?.order) queryParams.set('order', params.order);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());
    if (params?.type) queryParams.set('type', params.type);
    
    const endpoint = `/api/v1/generation-config?${queryParams.toString()}`;
    
    console.log('🔧 Fetching generation configs from:', endpoint);
    
    const response = await apiGet(endpoint);
    console.log("response", response);
    if (!response.success) {
      console.error('Generation config API error:', response.error);
      
      return {
        success: false,
        error: response.error || 'Unknown API error',
      };
    }

    const result = response.data?.items || response.data || []
    console.log("result", result);
    
    console.log('🔧 ✅ Fetched generation configs:', {
      total: result.length,
      types: [...new Set(result.map((c: GenerationConfig) => c.type))],
    });

    return {
      success: true,
      data: result,
      total: result.length,
    };

  } catch (error: any) {
    console.error('Generation config fetch error:', error);
    return {
      success: false,
      error: error?.message || 'Unknown error occurred',
    };
  }
};

/**
 * Get video generation configs specifically
 */
export const getVideoGenerationConfigs = async (): Promise<GenerationConfigResponse> => {
  // Get both text_to_video AND image_to_video models
  const [textToVideo, imageToVideo] = await Promise.all([
    getGenerationConfigs({
      type: 'text_to_video',
      order_by: 'name',
      order: 'ascendent',
      limit: 50,
    }),
    getGenerationConfigs({
      type: 'image_to_video',
      order_by: 'name',
      order: 'ascendent',
      limit: 50,
    })
  ]);
  
  // Combine results if both successful
  if (textToVideo.success && imageToVideo.success) {
    const combinedData = [
      ...(textToVideo.data || []),
      ...(imageToVideo.data || [])
    ];
    
    return {
      success: true,
      data: combinedData,
      total: combinedData.length
    };
  }
  
  // If one failed, return the successful one
  if (textToVideo.success) return textToVideo;
  if (imageToVideo.success) return imageToVideo;
  
  // Both failed
  return {
    success: false,
    error: 'Failed to fetch both text_to_video and image_to_video configs'
  };
};

/**
 * Get image generation configs specifically
 */
export const getImageGenerationConfigs = async (): Promise<GenerationConfigResponse> => {
  return getGenerationConfigs({
    type: 'text_to_image',
    order_by: 'name', 
    order: 'ascendent',
    limit: 50,
  });
};

/**
 * Find config by name (case-insensitive)
 */
export const findConfigByName = (
  configs: GenerationConfig[], 
  name: string
): GenerationConfig | undefined => {
  return configs.find(config => 
    config.name.toLowerCase().includes(name.toLowerCase()) ||
    config.label.toLowerCase().includes(name.toLowerCase())
  );
};

/**
 * Filter configs by type
 */
export const filterConfigsByType = (
  configs: GenerationConfig[], 
  type: GenerationConfig['type']
): GenerationConfig[] => {
  return configs.filter(config => config.type === type);
}; 