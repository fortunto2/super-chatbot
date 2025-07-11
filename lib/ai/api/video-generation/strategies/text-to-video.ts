import { parseResolution } from "@/lib/utils/media-generation";
import type { VideoGenerationParams, VideoGenerationStrategy } from "../strategy.interface";
import { selectResolution } from "@/lib/ai/tools/options-utils";

// Simple snake_case converter
function snakeCase(str: string | undefined | null): string | undefined {
  if (!str) return undefined;
  // Handles "Long Shot" -> "long_shot"
  return str.trim().replace(/\s+/g, '_').toLowerCase();
}

// Helper function to extract string value from object or string
function getStringValue(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.id) return value.id;
  if (typeof value === 'object' && value.label) return value.label;
  return undefined;
}

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
      console.log('🔧 🎯 TextToVideoStrategy generatePayload called with:', params);
      // const { width, height, aspectRatio } = parseResolution(params.resolution);
      const { width, height, aspectRatio } = selectResolution(params.resolution, params.model);
      
      const payload = {
        config: {
          prompt: params.prompt,
          generation_config_name: params.model || 'azure-openai/sora',
          duration: params.duration,
          aspect_ratio: aspectRatio || "16:9",
          seed: params.seed || Math.floor(Math.random() * 1000000000000),
          negative_prompt: params.negativePrompt || '',
          width,
          height,
          frame_rate: params.frameRate,
          shot_size: params.shotSize,
          style_name: params.style,
        }
      }
      
      return payload
    }
  }