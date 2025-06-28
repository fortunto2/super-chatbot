import { type GenerationConfig, getGenerationConfigs } from './get-generation-configs';

interface CachedConfig {
  data: GenerationConfig[];
  timestamp: number;
  expiresAt: number;
}

// Cache duration: 1 hour
const CACHE_DURATION = 60 * 60 * 1000;

// In-memory cache
let configCache: CachedConfig | null = null;

/**
 * Get cached generation configurations or fetch from API
 */
export const getCachedGenerationConfigs = async (
  forceRefresh = false
): Promise<GenerationConfig[]> => {
  const now = Date.now();
  
  // Check if cache is valid and not expired
  if (!forceRefresh && configCache && now < configCache.expiresAt) {
    console.log('🔧 📋 Using cached generation configs');
    return configCache.data;
  }
  
  console.log('🔧 🔄 Fetching fresh generation configs from API');
  
  try {
    const response = await getGenerationConfigs({
      order_by: 'name',
      order: 'ascendent',
      limit: 100, // Get more configs for comprehensive cache
    });
    
    if (response.success && response.data) {
      // Update cache
      configCache = {
        data: response.data,
        timestamp: now,
        expiresAt: now + CACHE_DURATION,
      };
      
      console.log('🔧 ✅ Cached generation configs:', {
        total: response.data.length,
        types: [...new Set(response.data.map(c => c.type))],
        expiresIn: `${CACHE_DURATION / 1000 / 60} minutes`,
      });
      
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to fetch configs');
    }
  } catch (error) {
    console.error('🔧 ❌ Failed to fetch generation configs:', error);
    
    // Return stale cache if available
    if (configCache) {
      console.log('🔧 ⚠️ Using stale cache due to API error');
      return configCache.data;
    }
    
    // Return empty array as fallback
    return [];
  }
};

/**
 * Get available models formatted for AI agents
 */
export const getModelsForAgent = async (): Promise<string> => {
  const configs = await getCachedGenerationConfigs();
  
  if (configs.length === 0) {
    return "No generation models available. Please check API connection.";
  }
  
  // Group by type
  const groupedConfigs = configs.reduce((acc, config) => {
    if (!acc[config.type]) {
      acc[config.type] = [];
    }
    acc[config.type].push(config);
    return acc;
  }, {} as Record<string, GenerationConfig[]>);
  
  let result = "# Available Generation Models\n\n";
  
  for (const [type, typeConfigs] of Object.entries(groupedConfigs)) {
    result += `## ${type.replace(/_/g, ' ').toUpperCase()}\n\n`;
    
    for (const config of typeConfigs) {
      result += `### ${config.label || config.name}\n`;
      result += `- **Name**: \`${config.name}\`\n`;
      result += `- **Type**: ${config.type}\n`;
      result += `- **Source**: ${config.source}\n`;
      
      if (config.price > 0) {
        result += `- **Price**: $${config.price}\n`;
      }
      
      if (config.params.price_per_second) {
        result += `- **Price per second**: $${config.params.price_per_second}\n`;
      }
      
      if (config.params.available_durations) {
        result += `- **Available durations**: ${config.params.available_durations.join(', ')}s\n`;
      }
      
      if (config.vip_required) {
        result += `- **VIP Required**: Yes\n`;
      }
      
      result += `\n`;
    }
  }
  
  result += `\n*Cache updated: ${new Date(configCache?.timestamp || 0).toISOString()}*\n`;
  result += `*Total models: ${configs.length}*\n`;
  
  return result;
};

/**
 * Get video models specifically for AI agents
 */
export const getVideoModelsForAgent = async (): Promise<string> => {
  const configs = await getCachedGenerationConfigs();
  
  // Include ALL video model types
  const videoConfigs = configs.filter(c => 
    c.type === 'image_to_video' || 
    c.type === 'text_to_video'
  );
  
  if (videoConfigs.length === 0) {
    return "No video generation models available.";
  }
  
  let result = "# Available Video Generation Models\n\n";
  
  for (const config of videoConfigs) {
    result += `## ${config.label || config.name}\n`;
    result += `- **Name**: \`${config.name}\` (use this in API calls)\n`;
    result += `- **Type**: ${config.type}\n`;
    result += `- **Price per second**: $${config.params.price_per_second || config.price}\n`;
    
    if (config.params.available_durations) {
      result += `- **Available durations**: ${config.params.available_durations.join(', ')} seconds\n`;
    }
    
    if (config.vip_required) {
      result += `- **VIP Required**: Yes\n`;
    }
    
    result += `- **Source**: ${config.source}\n\n`;
  }
  
  return result;
};

/**
 * Find the best video model for a request
 * AICODE-FIX: Enhanced to prioritize text_to_video models like Sora
 */
export const getBestVideoModel = async (
  preferences?: {
    maxPrice?: number;
    preferredDuration?: number;
    vipAllowed?: boolean;
    requireTextToVideo?: boolean; // New parameter to force text_to_video only
  }
): Promise<GenerationConfig | null> => {
  const configs = await getCachedGenerationConfigs();
  
  // AICODE-FIX: If requireTextToVideo is true, only consider text_to_video models
  let videoConfigs = configs.filter(c => 
    c.type === 'image_to_video' || 
    c.type === 'text_to_video'
  );
  
  // If specifically requesting text-to-video only, filter out image_to_video
  if (preferences?.requireTextToVideo) {
    videoConfigs = videoConfigs.filter(c => c.type === 'text_to_video');
    console.log('🎯 Filtering for text_to_video models only:', videoConfigs.map(c => c.name));
  }
  
  let filtered = videoConfigs;
  
  // Filter by VIP requirement
  if (preferences?.vipAllowed === false) {
    filtered = filtered.filter(c => !c.vip_required);
  }
  
  // Filter by price
  if (preferences?.maxPrice != null) {
    const maxPrice = preferences.maxPrice;
    filtered = filtered.filter(c => 
      (c.params.price_per_second || c.price) <= maxPrice
    );
  }
  
  // Filter by duration availability
  if (preferences?.preferredDuration != null) {
    const preferredDuration = preferences.preferredDuration;
    filtered = filtered.filter(c => 
      c.params.available_durations?.includes(preferredDuration) || 
      !c.params.available_durations // If no duration limits specified
    );
  }
  
  // AICODE-FIX: Enhanced sorting - strongly prioritize Sora for text_to_video
  filtered.sort((a, b) => {
    // First: Sora gets highest priority for text_to_video
    if (a.type === 'text_to_video' && a.name === 'azure-openai/sora') return -1;
    if (b.type === 'text_to_video' && b.name === 'azure-openai/sora') return 1;
    
    // Second: prioritize text_to_video over image_to_video
    if (a.type === 'text_to_video' && b.type === 'image_to_video') return -1;
    if (a.type === 'image_to_video' && b.type === 'text_to_video') return 1;
    
    // Third: within same type, prioritize specific models (Sora > VEO > others)
    const modelPriority = {
      'azure-openai/sora': 1,
      'google-cloud/veo2-text2video': 2,
      'google-cloud/veo3-text2video': 3,
      'comfyui/ltx': 9 // Lower priority for LTX
    };
    
    const aPriority = modelPriority[a.name as keyof typeof modelPriority] || 999;
    const bPriority = modelPriority[b.name as keyof typeof modelPriority] || 999;
    
    if (aPriority !== bPriority) return aPriority - bPriority;
    
    // Finally: sort by price (cheapest first)
    return (a.params.price_per_second || a.price) - (b.params.price_per_second || b.price);
  });
  
  const selectedModel = filtered[0] || null;
  if (selectedModel) {
    console.log('🎯 getBestVideoModel selected:', selectedModel.name, '(type:', selectedModel.type, `, price: $${selectedModel.params.price_per_second || selectedModel.price}/sec)`);
  } else {
    console.warn('⚠️ getBestVideoModel: No suitable model found with preferences:', preferences);
  }
  
  return selectedModel;
};

/**
 * Refresh cache manually
 */
export const refreshConfigCache = async (): Promise<boolean> => {
  try {
    await getCachedGenerationConfigs(true);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get cache status
 */
export const getCacheStatus = (): {
  cached: boolean;
  age: number; // minutes
  expiresIn: number; // minutes
  totalConfigs: number;
} => {
  if (!configCache) {
    return {
      cached: false,
      age: 0,
      expiresIn: 0,
      totalConfigs: 0,
    };
  }
  
  const now = Date.now();
  const age = Math.floor((now - configCache.timestamp) / 1000 / 60);
  const expiresIn = Math.floor((configCache.expiresAt - now) / 1000 / 60);
  
  return {
    cached: true,
    age,
    expiresIn: Math.max(0, expiresIn),
    totalConfigs: configCache.data.length,
  };
}; 