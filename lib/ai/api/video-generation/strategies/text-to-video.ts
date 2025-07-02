import type { VideoGenerationParams, VideoGenerationStrategy } from "../strategy.interface";

// Text-to-Video Strategy
export class TextToVideoStrategy implements VideoGenerationStrategy {
    readonly type = 'text-to-video';
    readonly requiresSourceImage = false;
    readonly requiresPrompt = true;
  
    validate(params: VideoGenerationParams): { valid: boolean; error?: string } {
      if (!params.prompt?.trim()) {
        return { valid: false, error: 'Prompt is required for text-to-video generation' };
      }
      return { valid: true };
    }
  
      generatePayload(params: VideoGenerationParams): any {
      // Use correct structure from SuperDuperAI API documentation
      return {
        config: {
          prompt: params.prompt,
          generation_config_name: params.model.name,
          duration: params.duration,
            aspect_ratio: params.resolution.aspectRatio || "16:9",
            seed: params.seed || Math.floor(Math.random() * 1000000000000),
            negative_prompt: params.negativePrompt || '',
            width: params.resolution.width,
            height: params.resolution.height,
            frame_rate: params.frameRate,
            shot_size: params.shotSize.id,
            style_name: params.style.id,
        }
      };
    }
  }