import { tool } from 'ai';
import { z } from 'zod';
// AICODE-NOTE: Updated to use new dynamic model system from SuperDuperAI config
import { getAvailableVideoModels, findVideoModel } from '@/lib/config/superduperai';

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
      let videoModels = allModels;
      
      // Apply filters
      if (filterByPrice) {
        videoModels = videoModels.filter(m => m.pricePerSecond <= filterByPrice);
      }
      
      if (filterByDuration) {
        videoModels = videoModels.filter(m => 
          m.maxDuration >= filterByDuration
        );
      }
      
      if (excludeVip) {
        videoModels = videoModels.filter(m => !m.isVip);
      }
      
      if (format === 'agent-friendly') {
        const agentInfo = {
          models: videoModels.map(m => ({
            id: m.id,
            name: m.name,
            description: m.description,
            price_per_second: m.pricePerSecond,
            max_duration: m.maxDuration,
            vip_required: m.isVip || false,
            supported_resolutions: `${m.maxResolution.width}x${m.maxResolution.height}`,
            frame_rates: m.supportedFrameRates,
            aspect_ratios: m.supportedAspectRatios,
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
          id: m.id,
          name: m.name,
          price: m.pricePerSecond,
          max_duration: m.maxDuration,
          vip: m.isVip || false,
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
        id: m.id,
        name: m.name,
        description: m.description,
        price_per_second: m.pricePerSecond,
        max_duration: m.maxDuration,
        max_resolution: m.maxResolution,
        supported_frame_rates: m.supportedFrameRates,
        supported_aspect_ratios: m.supportedAspectRatios,
        supported_qualities: m.supportedQualities,
        vip_required: m.isVip || false,
        workflow_path: m.workflowPath,
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
      let candidates = allModels;
      
      // Apply filters
      if (maxPrice) {
        candidates = candidates.filter(m => m.pricePerSecond <= maxPrice);
      }
      
      if (preferredDuration) {
        candidates = candidates.filter(m => m.maxDuration >= preferredDuration);
      }
      
      if (!vipAllowed) {
        candidates = candidates.filter(m => !m.isVip);
      }
      
      if (candidates.length === 0) {
        return {
          success: false,
          message: 'No video model found matching your criteria',
          suggestion: 'Try relaxing your requirements (higher price limit, allow VIP models, etc.)',
          available_models: allModels.map(m => ({
            id: m.id,
            name: m.name,
            price: m.pricePerSecond,
            max_duration: m.maxDuration,
            vip: m.isVip || false,
          })),
        };
      }
      
      // Sort by preference
      let bestModel;
      if (prioritizeQuality) {
        // Sort by price descending (assuming higher price = better quality)
        bestModel = candidates.sort((a, b) => b.pricePerSecond - a.pricePerSecond)[0];
      } else {
        // Sort by price ascending (cheapest first)
        bestModel = candidates.sort((a, b) => a.pricePerSecond - b.pricePerSecond)[0];
      }
      
      return {
        success: true,
        data: {
          id: bestModel.id,
          name: bestModel.name,
          description: bestModel.description,
          price_per_second: bestModel.pricePerSecond,
          max_duration: bestModel.maxDuration,
          max_resolution: bestModel.maxResolution,
          vip_required: bestModel.isVip || false,
          recommendation_reason: `Selected based on ${prioritizeQuality ? 'quality' : 'price'} optimization`,
        },
        message: `Best model found: ${bestModel.name} at $${bestModel.pricePerSecond}/sec`,
        usage_tip: `Use model ID "${bestModel.id}" when calling configureVideoGeneration`,
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