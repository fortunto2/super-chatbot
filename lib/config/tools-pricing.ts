import type { UserType } from '@/app/(auth)/auth';

/**
 * Tool operation types and their costs
 */
export interface ToolOperation {
  id: string;
  name: string;
  description: string;
  baseCost: number; // Base cost in credits
  costMultipliers?: {
    [key: string]: number; // Additional cost factors (e.g., quality, duration)
  };
}

/**
 * Pricing configuration for different tools
 */
export const TOOLS_PRICING = {
  // Image Generation
  'image-generation': {
    'text-to-image': {
      id: 'text-to-image',
      name: 'Text to Image',
      description: 'Generate image from text prompt',
      baseCost: 5, // 2 credits per image
      costMultipliers: {
        'high-quality': 1.5, // +50% for high quality
        'ultra-quality': 2.0, // +100% for ultra quality
      }
    },
    'image-to-image': {
      id: 'image-to-image', 
      name: 'Image to Image',
      description: 'Transform existing image',
      baseCost: 7, // 3 credits per transformation
      costMultipliers: {
        'high-quality': 1.5,
        'ultra-quality': 2.0,
      }
    }
  },

  // Video Generation
  'video-generation': {
    'text-to-video': {
      id: 'text-to-video',
      name: 'Text to Video',
      description: 'Generate video from text prompt',
      baseCost: 7.5, // 7.5 credits for 5 seconds
      costMultipliers: {
        'duration-5s': 1.0,   // 7.5 credits for 5 seconds
        'duration-10s': 2.0,  // 15 credits for 10 seconds
        'duration-15s': 3.0,  // 22.5 credits for 15 seconds
        'duration-30s': 6.0,  // 45 credits for 30 seconds
        'hd-quality': 1.0,    // HD is default, no extra cost
        '4k-quality': 2.0,    // +100% for 4K
      }
    },
    'image-to-video': {
      id: 'image-to-video',
      name: 'Image to Video', 
      description: 'Convert image to video',
      baseCost: 11.25, // 11.25 credits for 5 seconds (50% more than text-to-video)
      costMultipliers: {
        'duration-5s': 1.0,   // 11.25 credits for 5 seconds
        'duration-10s': 2.0,  // 22.5 credits for 10 seconds
        'duration-15s': 3.0,  // 33.75 credits for 15 seconds
        'duration-30s': 6.0,  // 67.5 credits for 30 seconds
        'hd-quality': 1.0,    // HD is default, no extra cost
        '4k-quality': 2.0,    // +100% for 4K
      }
    }
  },

  // Script Generation
  'script-generation': {
    'basic-script': {
      id: 'basic-script',
      name: 'Script Generation',
      description: 'Generate script or text content',
      baseCost: 1, // 1 credit per script
      costMultipliers: {
        'long-form': 2.0, // +100% for long scripts (>1000 words)
      }
    }
  },

  // Prompt Enhancement
  'prompt-enhancement': {
    'basic-enhancement': {
      id: 'basic-enhancement',
      name: 'Prompt Enhancement',
      description: 'Enhance and improve prompts',
      baseCost: 1, // 1 credit per enhancement
    },
    'veo3-enhancement': {
      id: 'veo3-enhancement',
      name: 'VEO3 Prompt Enhancement',
      description: 'Advanced prompt enhancement for VEO3',
      baseCost: 2, // 2 credits per enhancement
    }
  }
} as const;

/**
 * Free balance allocations for different user types
 */
export const FREE_BALANCE_BY_USER_TYPE: Record<UserType, number> = {
  guest: 50,     // Guests get 50 credits
  regular: 100,  // Regular users get 100 credits
};

/**
 * Calculate cost for a specific operation
 */
export function calculateOperationCost(
  toolCategory: keyof typeof TOOLS_PRICING,
  operationType: string,
  multipliers: string[] = []
): number {
  const tool = TOOLS_PRICING[toolCategory];
  if (!tool) throw new Error(`Unknown tool category: ${toolCategory}`);

  const operation = tool[operationType as keyof typeof tool] as ToolOperation;
  if (!operation) throw new Error(`Unknown operation: ${operationType} in ${toolCategory}`);

  let totalCost = operation.baseCost;

  // Apply cost multipliers
  if (operation.costMultipliers && multipliers.length > 0) {
    let multiplier = 1;
    for (const mult of multipliers) {
      if (operation.costMultipliers[mult]) {
        multiplier *= operation.costMultipliers[mult];
      }
    }
    totalCost = Math.ceil(totalCost * multiplier);
  }

  return totalCost;
}

/**
 * Get all available operations for a tool category
 */
export function getToolOperations(toolCategory: keyof typeof TOOLS_PRICING): ToolOperation[] {
  const tool = TOOLS_PRICING[toolCategory];
  if (!tool) return [];

  return Object.values(tool) as ToolOperation[];
}

/**
 * Get human-readable pricing info for UI display
 */
export function getToolPricingDisplay(
  toolCategory: keyof typeof TOOLS_PRICING,
  operationType: string
): { baseCost: number; description: string; multipliers?: Record<string, string> } {
  const tool = TOOLS_PRICING[toolCategory];
  if (!tool) throw new Error(`Unknown tool category: ${toolCategory}`);

  const operation = tool[operationType as keyof typeof tool] as ToolOperation;
  if (!operation) throw new Error(`Unknown operation: ${operationType}`);

  const result = {
    baseCost: operation.baseCost,
    description: operation.description,
  };

  if (operation.costMultipliers) {
    const multipliers: Record<string, string> = {};
    for (const [key, value] of Object.entries(operation.costMultipliers)) {
      const percentage = Math.round((value - 1) * 100);
      multipliers[key] = percentage > 0 ? `+${percentage}%` : `${percentage}%`;
    }
    return { ...result, multipliers };
  }

  return result;
}

/**
 * Examples of common operations and their costs
 */
export const PRICING_EXAMPLES = {
  'Basic image generation': calculateOperationCost('image-generation', 'text-to-image'),
  'High-quality image': calculateOperationCost('image-generation', 'text-to-image', ['high-quality']),
  'Short video (5s)': calculateOperationCost('video-generation', 'text-to-video', ['duration-5s']),
  'HD video (10s)': calculateOperationCost('video-generation', 'text-to-video', ['duration-10s', 'hd-quality']),
  'Script generation': calculateOperationCost('script-generation', 'basic-script'),
  'Prompt enhancement': calculateOperationCost('prompt-enhancement', 'basic-enhancement'),
} as const; 