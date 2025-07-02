import { TextToImageStrategy } from "./strategies/text-to-image";
import { ImageToImageStrategy } from "./strategies/image-to-image";
import type { ImageGenerationStrategy } from "./strategy.interface";

// Strategy Factory
export class ImageGenerationStrategyFactory {
    private strategies = new Map<string, ImageGenerationStrategy>();
  
    constructor() {
      this.registerStrategy(new TextToImageStrategy());
      this.registerStrategy(new ImageToImageStrategy());
    }
  
    registerStrategy(strategy: ImageGenerationStrategy): void {
      this.strategies.set(strategy.type, strategy);
    }
  
    getStrategy(type: string): ImageGenerationStrategy | null {
      return this.strategies.get(type) || null;
    }
  
    getAllStrategies(): ImageGenerationStrategy[] {
      return Array.from(this.strategies.values());
    }
  
    getSupportedTypes(): string[] {
      return Array.from(this.strategies.keys());
    }
  } 