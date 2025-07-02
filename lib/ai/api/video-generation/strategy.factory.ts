import { ImageToVideoStrategy } from "./strategies/image-to-video";
import { TextToVideoStrategy } from "./strategies/text-to-video";
import { VideoToVideoStrategy } from "./strategies/video-to-video";
import type { VideoGenerationStrategy } from "./strategy.interface";

// Strategy Factory
export class VideoGenerationStrategyFactory {
    private strategies = new Map<string, VideoGenerationStrategy>();
  
    constructor() {
      this.registerStrategy(new TextToVideoStrategy());
      this.registerStrategy(new ImageToVideoStrategy());
      this.registerStrategy(new VideoToVideoStrategy());
    }
  
    registerStrategy(strategy: VideoGenerationStrategy): void {
      this.strategies.set(strategy.type, strategy);
    }
  
    getStrategy(type: string): VideoGenerationStrategy | null {
      return this.strategies.get(type) || null;
    }
  
    getAllStrategies(): VideoGenerationStrategy[] {
      return Array.from(this.strategies.values());
    }
  
    getSupportedTypes(): string[] {
      return Array.from(this.strategies.keys());
    }
  }
  