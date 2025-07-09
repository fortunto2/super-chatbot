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
      const { width, height, aspectRatio } = parseResolution(params.resolution);
    
      // style и shotSize — тоже только id/label, если API требует строку
      const styleObject = { id: params.style || "flux_watercolor", label: params.style || "Watercolor" };
      const shotSizeObject = { id: params.shotSize || "medium_shot", label: params.shotSize || "Medium Shot" };
    
      let modelName: string;
      if (typeof params.model === 'string') {
        modelName = params.model;
      } else if (params.model && typeof params.model === 'object') {
        if ('name' in params.model && params.model.name) {
          modelName = params.model.name;
        }  else {
          modelName = 'azure-openai/sora';
        }
      } else {
        modelName = 'azure-openai/sora';
      }
      const modelObject = { 
        name: modelName, 
        label: modelName,
        type: 'TEXT_TO_VIDEO' as any,
        source: 'superduperai' as any,
        params: {} as any
      };
    
      const payload = {
        config: {
          prompt: params.prompt,
          generation_config_name: modelName, // <-- теперь всегда строка!
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
      }
      console.log("payload", payload)
    
      return payload
    }
  }