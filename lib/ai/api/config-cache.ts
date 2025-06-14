import { GenerationConfig, getGenerationConfigs } from './get-generation-configs';

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
  forceRefresh: boolean = false
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
  const videoConfigs = configs.filter(c => c.type === 'image_to_video');
  
  if (videoConfigs.length === 0) {
    return "No video generation models available.";
  }
  
  let result = "# Available Video Generation Models\n\n";
  
  for (const config of videoConfigs) {
    result += `## ${config.label || config.name}\n`;
    result += `- **Name**: \`${config.name}\` (use this in API calls)\n`;
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
 */
export const getBestVideoModel = async (
  preferences?: {
    maxPrice?: number;
    preferredDuration?: number;
    vipAllowed?: boolean;
  }
): Promise<GenerationConfig | null> => {
  const configs = await getCachedGenerationConfigs();
  const videoConfigs = configs.filter(c => c.type === 'image_to_video');
  
  let filtered = videoConfigs;
  
  // Filter by VIP requirement
  if (preferences?.vipAllowed === false) {
    filtered = filtered.filter(c => !c.vip_required);
  }
  
  // Filter by price
  if (preferences?.maxPrice) {
    filtered = filtered.filter(c => 
      (c.params.price_per_second || c.price) <= preferences.maxPrice!
    );
  }
  
  // Filter by duration availability
  if (preferences?.preferredDuration) {
    filtered = filtered.filter(c => 
      c.params.available_durations?.includes(preferences.preferredDuration!) || 
      !c.params.available_durations // If no duration limits specified
    );
  }
  
  // Sort by price (cheapest first)
  filtered.sort((a, b) => 
    (a.params.price_per_second || a.price) - (b.params.price_per_second || b.price)
  );
  
  return filtered[0] || null;
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