import type { VideoGenerationStrategy } from "../strategy.interface";

export class VideoToVideoStrategy implements VideoGenerationStrategy {
    readonly type = 'video-to-video';
    readonly requiresSourceImage = false; // Uses source video instead
    readonly requiresPrompt = true;
  
    validate(params: any): { valid: boolean; error?: string } {
      if (!params.sourceVideoId && !params.sourceVideoUrl) {
        return { valid: false, error: 'Source video is required for video-to-video generation' };
      }
      if (!params.prompt?.trim()) {
        return { valid: false, error: 'Prompt is required for video-to-video generation' };
      }
      return { valid: true };
    }
  
    generatePayload(params: any): any {
      // Implementation for video-to-video payload
      return {
        type: "video_transformation",
        source_video: params.sourceVideoId || params.sourceVideoUrl,
        transformation_prompt: params.prompt,
        // ... other video-to-video specific parameters
      };
    }
  }