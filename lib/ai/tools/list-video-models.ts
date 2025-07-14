import { tool } from 'ai';
import { z } from 'zod';
// AICODE-NOTE: Updated to use new dynamic model system from SuperDuperAI config
import { getAvailableVideoModels, } from '@/lib/config/superduperai-client';

export const listVideoModels = tool({
  description: 'List all available video generation models from SuperDuperAI API with their capabilities, pricing, and requirements. Use this to see what models are available before generating videos.',
  parameters: z.object({
    format: z.enum(['detailed', 'simple', 'agent-friendly']).optional().describe('Format of the output: detailed (full info), simple (names only), agent-friendly (formatted for AI agents)'),
    filterByPrice: z.number().optional().describe('Filter models by maximum price per second'),
    filterByDuration: z.number().optional().describe('Filter models that support this duration in seconds'),
    excludeVip: z.boolean().optional().describe('Exclude VIP-only models'),
  }),
  execute: async ({ format = 'agent-friendly', filterByPrice, filterByDuration, excludeVip }) => {
    try {
      console.log('🎬 📋 Listing video models from SuperDuperAI with format:', format);
      
      // AICODE-NOTE: Get models from our new dynamic system
      const allModels = await getAvailableVideoModels();
      let videoModels = allModels.map(m => m as any); // Temporary type assertion for build fix
      
      // Apply filters based on params
      if (filterByPrice) {
        videoModels = videoModels.filter(m => 
          (m.params.price_per_second || m.params.price || 0) <= filterByPrice
        );
      }
      
      if (filterByDuration) {
        videoModels = videoModels.filter(m => 
          (m.params.max_duration || m.params.available_durations?.[0] || 60) >= filterByDuration
        );
      }
      
      if (excludeVip) {
        videoModels = videoModels.filter(m => !m.params.is_vip);
      }
      
      if (format === 'agent-friendly') {
        const agentInfo = {
          models: videoModels.map(m => ({
            id: m.name, // Use name as id
            name: m.name,
            description: m.label || m.name,
            price_per_second: m.params.price_per_second || m.params.price || 0,
            max_duration: m.params.max_duration || 60,
            vip_required: m.params.is_vip || false,
            supported_resolutions: `${m.params.max_width || 1920}x${m.params.max_height || 1080}`,
            frame_rates: m.params.frame_rates || [24, 30],
            aspect_ratios: m.params.aspect_ratios || ["16:9"],
          })),
          usage_examples: [
            'Use model ID like "comfyui/ltx" when calling configureVideoGeneration',
            'Check max_duration before setting video duration',
            'Consider price_per_second for cost optimization',
          ],
          total: videoModels.length,
        };
        
        return {
          success: true,
          data: agentInfo,
          message: `Found ${videoModels.length} video models from SuperDuperAI API`,
        };
      }
      
      if (format === 'simple') {
        const simpleList = videoModels.map(m => ({
          id: m.name,
          name: m.name,
          price: m.params.price_per_second || m.params.price || 0,
          max_duration: m.params.max_duration || 60,
          vip: m.params.is_vip || false,
        }));
        
        return {
          success: true,
          data: simpleList,
          total: simpleList.length,
          message: `Found ${simpleList.length} video models`,
        };
      }
      
      // Detailed format
      const detailedList = videoModels.map(m => ({
        id: m.name,
        name: m.name,
        description: m.label || m.name,
        price_per_second: m.params.price_per_second || m.params.price || 0,
        max_duration: m.params.max_duration || 60,
        max_resolution: { width: m.params.max_width || 1920, height: m.params.max_height || 1080 },
        supported_frame_rates: m.params.frame_rates || [24, 30],
        supported_aspect_ratios: m.params.aspect_ratios || ["16:9"],
        supported_qualities: m.params.qualities || ["hd"],
        vip_required: m.params.is_vip || false,
        workflow_path: m.params.workflow_path || "",
      }));
      
      return {
        success: true,
        data: detailedList,
        total: detailedList.length,
        message: `Found ${detailedList.length} video models with detailed information`,
        filters_applied: {
          max_price: filterByPrice,
          duration: filterByDuration,
          exclude_vip: excludeVip,
        },
      };
      
    } catch (error: any) {
      console.error('🎬 ❌ Error listing video models:', error);
      return {
        success: false,
        error: error?.message || 'Failed to list video models from SuperDuperAI API',
        message: 'Could not retrieve video models. Please check SUPERDUPERAI_TOKEN and SUPERDUPERAI_URL environment variables.',
      };
    }
  },
});

export const findBestVideoModel = tool({
  description: 'Find the best video model from SuperDuperAI based on specific requirements like price, duration, and VIP access. Use this to automatically select the optimal model for your needs.',
  parameters: z.object({
    maxPrice: z.number().optional().describe('Maximum price per second you want to pay'),
    preferredDuration: z.number().optional().describe('Preferred video duration in seconds'),
    vipAllowed: z.boolean().optional().describe('Whether VIP models are allowed (default: true)'),
    prioritizeQuality: z.boolean().optional().describe('Prioritize quality over price (default: false)'),
  }),
  execute: async ({ maxPrice, preferredDuration, vipAllowed = true, prioritizeQuality = false }) => {
    try {
      console.log('🎬 🔍 Finding best video model with criteria:', {
        maxPrice,
        preferredDuration,
        vipAllowed,
        prioritizeQuality,
      });
      
      // AICODE-NOTE: Use our new dynamic model discovery system
      const allModels = await getAvailableVideoModels();
      let candidates = allModels.map(m => m as any); // Temporary type assertion for build fix
      
      // Apply filters
      if (maxPrice) {
        candidates = candidates.filter(m => 
          (m.params.price_per_second || m.params.price || 0) <= maxPrice
        );
      }
      
      if (preferredDuration) {
        candidates = candidates.filter(m => 
          (m.params.max_duration || 60) >= preferredDuration
        );
      }
      
      if (!vipAllowed) {
        candidates = candidates.filter(m => !m.params.is_vip);
      }
      
      if (candidates.length === 0) {
        return {
          success: false,
          message: 'No video model found matching your criteria',
          suggestion: 'Try relaxing your requirements (higher price limit, allow VIP models, etc.)',
          available_models: allModels.map(m => ({
            id: m.name,
            name: m.name,
            price: m.params.price_per_second || m.params.price || 0,
            max_duration: m.params.max_duration || 60,
            vip: m.params.is_vip || false,
          })),
        };
      }
      
      // Sort by preference
      let bestModel: typeof candidates[0];
      if (prioritizeQuality) {
        // Sort by price descending (assuming higher price = better quality)
        bestModel = candidates.sort((a, b) => 
          (b.params.price_per_second || b.params.price || 0) - (a.params.price_per_second || a.params.price || 0)
        )[0];
      } else {
        // Sort by price ascending (cheapest first)
        bestModel = candidates.sort((a, b) => 
          (a.params.price_per_second || a.params.price || 0) - (b.params.price_per_second || b.params.price || 0)
        )[0];
      }
      
      return {
        success: true,
        data: {
          id: bestModel.name,
          name: bestModel.name,
          description: bestModel.label || bestModel.name,
          price_per_second: bestModel.params.price_per_second || bestModel.params.price || 0,
          max_duration: bestModel.params.max_duration || 60,
          max_resolution: { width: bestModel.params.max_width || 1920, height: bestModel.params.max_height || 1080 },
          vip_required: bestModel.params.is_vip || false,
          recommendation_reason: `Selected based on ${prioritizeQuality ? 'quality' : 'price'} optimization`,
        },
        message: `Best model found: ${bestModel.name} at $${bestModel.params.price_per_second || bestModel.params.price || 0}/sec`,
        usage_tip: `Use model ID "${bestModel.name}" when calling configureVideoGeneration`,
      };
      
    } catch (error: any) {
      console.error('🎬 ❌ Error finding best video model:', error);
      return {
        success: false,
        error: error?.message || 'Failed to find best video model',
        message: 'Could not find optimal video model. Please check SuperDuperAI API connection.',
      };
    }
  },
}); 