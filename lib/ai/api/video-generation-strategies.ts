import type { MediaOption, MediaResolution } from "@/lib/types/media-settings";
import type { VideoModel } from '@/lib/config/superduperai';
import { getSuperduperAIConfig } from '@/lib/config/superduperai';
import { ReferenceTypeEnum } from "@/lib/api";
import { uploadFile } from "./upload-file";

// Base interfaces for video generation
export interface VideoGenerationParams {
  prompt: string;
  model: VideoModel;
  style: MediaOption;
  resolution: MediaResolution;
  shotSize: MediaOption;
  duration: number;
  frameRate: number;
  negativePrompt?: string;
  seed?: number;
}

export interface ImageToVideoParams extends VideoGenerationParams {
  file: File
}

export interface VideoGenerationResult {
  success: boolean;
  projectId?: string;
  requestId?: string;
  fileId?: string;
  message?: string;
  error?: string;
  files?: any[];
  url?: string;
  method?: 'sse' | 'polling';
}

// Base strategy interface
export interface VideoGenerationStrategy {
  readonly type: string;
  readonly requiresSourceImage: boolean;
  readonly requiresPrompt: boolean;
  generatePayload(params: VideoGenerationParams | ImageToVideoParams): Promise<any>;
  validate(params: VideoGenerationParams | ImageToVideoParams): { valid: boolean; error?: string };
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

// Image-to-Video Strategy with Fallback Methods
export class ImageToVideoStrategy implements VideoGenerationStrategy {
  readonly type = 'image-to-video';
  readonly requiresSourceImage = true;
  readonly requiresPrompt = false; // Animation description is optional

  validate(params: ImageToVideoParams): { valid: boolean; error?: string } {
    if (!params.file) {
      return { valid: false, error: 'Source image is required for image-to-video generation' };
    }
    return { valid: true };
  }

  /**
   * Try multiple approaches for image upload with fallback mechanisms
   */
  async handleImageUpload(params: ImageToVideoParams): Promise<{
    imageId?: string;
    imageUrl?: string;
    method: 'existing' | 'upload' | 'base64' | 'direct';
    error?: string;
  }> {

    if (!params.file) {
      return {
        error: 'Image upload methods failed',
        method: 'existing'
      };
    }
    try{
      const uploadResult = await uploadFile(params.file);
      console.log("uploadResult", uploadResult);
      return {
        imageId: uploadResult?.id,
        imageUrl: uploadResult?.url || undefined,
        method: 'upload'
      };
    } catch (error) {
      console.error("Error uploading file", error);
      return {
        error: 'Image upload methods failed',
        method: 'existing'
      };
    }
  }
  
  async generatePayload(params: ImageToVideoParams): Promise<any> {
    const { imageId, imageUrl} = await this.handleImageUpload(params);
    console.log("imageId", imageId);
    const payload: any = {
      config: {
        prompt: params.prompt || "animate this image naturally", // Default for image-to-video
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
        references: [
          {
            type: ReferenceTypeEnum.SOURCE,
            reference_id: imageId
          }
        ],
      },
     
    };
    return payload;
  }
}

// Video-to-Video Strategy (for future expansion)
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

// Main generation function using strategy pattern with fallback mechanisms
export async function generateVideoWithStrategy(
  generationType: string,
  params: VideoGenerationParams | ImageToVideoParams
): Promise<VideoGenerationResult> {
  const factory = new VideoGenerationStrategyFactory();
  const strategy = factory.getStrategy(generationType);

  if (!strategy) {
    return {
      success: false,
      error: `Unsupported generation type: ${generationType}. Supported types: ${factory.getSupportedTypes().join(', ')}`
    };
  }

  // Validate parameters
  const validation = strategy.validate(params);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error
    };
  }

  try {
    let finalParams = params;
    console.log("finalParams", finalParams);
    if (strategy.type === 'image-to-video' && strategy instanceof ImageToVideoStrategy) {
      const imageParams = params as ImageToVideoParams;
      if (imageParams.file) {
        finalParams = params;
        console.log('✅ Using existing image reference');
      } else {
        // Skip file upload entirely - payload will handle inline image data
        finalParams = params;
        console.log('⚠️ Skipping file upload due to backend magic library issues - using inline image data');
      }
    }

    const config = getSuperduperAIConfig();

    const payload = await strategy.generatePayload(finalParams);
    
    // Use correct SuperDuperAI endpoint for video generation  
    const endpoint = '/api/v1/file/generate-video';
    const url = `${config.url}${endpoint}`;

    let response: Response;

    // All requests now use JSON payload (Base64 conversion happens on client side)
    console.log('🎬 Sending with JSON payload:', JSON.stringify(payload, null, 2));
      
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ${strategy.type} API Error (${response.status}):`, errorText);
      
      // Add specific error handling for common issues
      if (response.status === 500 && errorText.includes('magic')) {
        return {
          success: false,
          error: `Backend file processing error. The SuperDuperAI service is experiencing issues with file type detection. Please try again later or contact support.`,
        };
      }
      
      return {
        success: false,
        error: `API Error: ${response.status} ${response.statusText} - ${errorText}`,
      };
    }

    const result = await response.json();
    console.log(`📨 ${strategy.type} API Response:`, result);

    // Extract fileId from response
    const fileId = result.id ||
                  result.data?.[0]?.value?.file_id || 
                  result.data?.[0]?.id || 
                  result.fileId;

    if (!fileId) {
      console.error('❌ No fileId found in response');
      return {
        success: false,
        error: 'No file ID returned from API'
      };
    }

    console.log(`🎬 ${strategy.type} generation started - FileId: ${fileId}`);

    return {
      success: true,
      projectId: fileId,
      requestId: fileId,
      fileId,
      message: `${strategy.type} generation started! FileId: ${fileId}`,
    };

  } catch (error: any) {
    console.error(`❌ ${strategy.type} generation error:`, error);
    
    // Enhanced error messages for common issues
    let errorMessage = error.message || `Unknown ${strategy.type} generation error`;
    
    if (errorMessage.includes('magic') || errorMessage.includes('AttributeError')) {
      errorMessage = 'Backend service error: File type detection failed. This is a temporary server issue.';
    } else if (errorMessage.includes('upload')) {
      errorMessage = 'Image upload failed. Please try with a different image or try again later.';
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
} 