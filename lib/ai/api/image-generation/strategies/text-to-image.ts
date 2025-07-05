import type { ImageGenerationParams, ImageGenerationStrategy } from "../strategy.interface";

// Text-to-Image Strategy
export class TextToImageStrategy implements ImageGenerationStrategy {
    readonly type = 'text-to-image';
    readonly requiresSourceImage = false;
    readonly requiresPrompt = true;

    validate(params: ImageGenerationParams): { valid: boolean; error?: string } {
      if (!params.prompt?.trim()) {
        return { valid: false, error: 'Prompt is required for text-to-image generation' };
      }
      return { valid: true };
    }

    async generatePayload(params: ImageGenerationParams): Promise<any> {
      return {
        config: {
          prompt: params.prompt,
          negative_prompt: params.negativePrompt || '',
          width: params.resolution?.width || 512,
          height: params.resolution?.height || 512,
          steps: 30,
          shot_size: params.shotSize?.id || null,
          seed: params.seed || Math.floor(Math.random() * 1000000000000),
          generation_config_name: params.model?.name || 'fal-ai/flux-dev',
          batch_size: Math.min(Math.max(params.batchSize || 1, 1), 3),
          style_name: params.style?.id || null,
          references: [],
          entity_ids: []
        }
      };
    }
} 