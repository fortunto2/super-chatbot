import { parseResolution } from "@/lib/utils/media-generation";
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
      const { width, height, aspectRatio } = parseResolution(params.resolution);

      const styleObject = { id: params.style || "flux_watercolor", label: params.style || "Watercolor" };
      const shotSizeObject = { id: params.shotSize || "medium_shot", label: params.shotSize || "Medium Shot" };

      const modelObject = { 
        name: params.model || 'azure-openai/sora', 
        label: params.model || 'Sora',
        type: 'TEXT_TO_VIDEO' as any,
        source: 'superduperai' as any,
        params: {} as any
      };

      return {
        config: {
          prompt: params.prompt,
          generation_config_name: modelObject.name,
          duration: params.duration,
          aspect_ratio: aspectRatio || "16:9",
          seed: params.seed || Math.floor(Math.random() * 1000000000000),
          negative_prompt: params.negativePrompt || '',
          width: width,
          height: height,
          frame_rate: params.frameRate,
          shot_size: shotSizeObject,
          style_name: styleObject,
          model: modelObject
        }
      };
    }
  }