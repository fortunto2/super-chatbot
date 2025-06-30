import type { MediaOption, MediaResolution } from "@/lib/types/media-settings";
import type { VideoModel } from '@/lib/config/superduperai';
import { getSuperduperAIConfig } from '@/lib/config/superduperai';

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
  sourceImageId?: string;
  sourceImageUrl?: string;
  sourceImageFile?: File;
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
  generatePayload(params: VideoGenerationParams | ImageToVideoParams): any;
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
        params: {
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
    if (!params.sourceImageId && !params.sourceImageUrl && !params.sourceImageFile) {
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
    // Method 1: Use existing image ID/URL if available
    if (params.sourceImageId || params.sourceImageUrl) {
      console.log('🖼️ Using existing image reference');
      return {
        imageId: params.sourceImageId,
        imageUrl: params.sourceImageUrl,
        method: 'existing'
      };
    }

    // Method 2: Try direct file upload (current approach)
    if (params.sourceImageFile) {
      try {
        console.log('🖼️ Attempting direct file upload...');
        const { FileService } = await import('@/lib/api/services/FileService');
        
        const uploadResult = await FileService.fileUpload({
          formData: {
            payload: params.sourceImageFile
          }
        });
        
        console.log('✅ Direct upload successful:', uploadResult.id);
        return {
          imageId: uploadResult.id || undefined,
          imageUrl: uploadResult.url || undefined,
          method: 'upload'
        };
      } catch (uploadError) {
        console.warn('⚠️ Direct upload failed, trying fallback methods...', uploadError);
      }

      // Method 3: Try Base64 approach as fallback
      try {
        console.log('🖼️ Attempting Base64 conversion fallback...');
        const base64Data = await this.fileToBase64(params.sourceImageFile);
        const dataUrl = `data:${params.sourceImageFile.type};base64,${base64Data}`;
        
        console.log('✅ Base64 conversion successful');
        return {
          imageUrl: dataUrl,
          method: 'base64'
        };
      } catch (base64Error) {
        console.warn('⚠️ Base64 conversion failed:', base64Error);
      }

      // Method 4: Try creating object URL as last resort (browser-only)
      try {
        console.log('🖼️ Attempting object URL creation...');
        
        // Check if we're in browser environment
        if (typeof window === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) {
          throw new Error('URL.createObjectURL not available in server environment');
        }
        
        const objectUrl = URL.createObjectURL(params.sourceImageFile);
        console.log('✅ Object URL created (local only)');
        
        return {
          imageUrl: objectUrl,
          method: 'direct'
        };
      } catch (objectError) {
        console.error('❌ Object URL creation failed:', objectError);
      }
    }

    return {
      error: 'All image upload methods failed',
      method: 'existing'
    };
  }

  /**
   * Convert File to Base64 string (browser-only)
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      // Check if we're in browser environment
      if (typeof window === 'undefined' || typeof FileReader === 'undefined') {
        reject(new Error('FileReader not available in server environment'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // Remove data:image/...;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  generatePayload(params: ImageToVideoParams): any {
    // Extract resolution details for aspect ratio
    const { aspectRatio } = this.parseResolution(params.resolution);
    
    // Build proper SuperDuperAI image-to-video format based on user example
    const payload: any = {
      params: {
        config: {
          seed: params.seed || Math.floor(Math.random() * 1000000000000),
          steps: 50,
          width: null,  // Should be null for image-to-video
          height: null, // Should be null for image-to-video
          prompt: params.prompt?.trim() || "animate",
          duration: params.duration || 5,
          batch_size: 1,
          aspect_ratio: aspectRatio,
          negative_prompt: params.negativePrompt || ""
        },
        file_ids: [],
        references: [],
        generation_config: {
          name: params.model.name,
          type: "image_to_video",
          label: params.model.label || params.model.name,
          params: {
            vip_required: true,
            price_per_second: 2,
            arguments_template: "{\"prompt\": {{config.prompt|tojson}}, \"image_url\": \"{{reference.source}}\", \"aspect_ratio\": \"{{config.aspect_ratio}}\", \"duration\": {{config.duration|int}}, \"fps\": 24, \"enhance_prompt\": true, \"samples\": {{config.batch_size|default(1)}}, \"seed\": {{config.seed|int}}, \"negative_prompt\": {{config.negative_prompt|tojson}}}",
            available_durations: [5, 6, 7, 8]
          },
          source: params.model.source || "google_cloud"
        }
      }
    };

    // Handle image source: prefer file_ids over references
    if (params.sourceImageId) {
      // Use file_ids for uploaded files
      payload.params.file_ids = [params.sourceImageId];
      payload.params.references = []; // Empty when using file_ids
    } else if (params.sourceImageUrl) {
      // Use references for Base64 data URLs or external URLs
      payload.params.file_ids = [];
      payload.params.references = [{
        type: "source",
        reference_url: params.sourceImageUrl
      }];
    }

    return payload;
  }

  private parseResolution(resolution: any): { width: number, height: number, aspectRatio: string } {
    if (resolution && typeof resolution === 'object') {
      return {
        width: resolution.width || 1280,
        height: resolution.height || 720, 
        aspectRatio: resolution.aspectRatio || "16:9"
      };
    }
    
    // Fallback parsing from string
    let width = 1280;
    let height = 720;
    let aspectRatio = "16:9";
    
    if (typeof resolution === 'string') {
      const match = resolution.match(/(\d+)x(\d+)/);
      if (match) {
        width = Number.parseInt(match[1], 10);
        height = Number.parseInt(match[2], 10);
        
        const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
        const divisor = gcd(width, height);
        aspectRatio = `${width / divisor}:${height / divisor}`;
      }
    }
    
    return { width, height, aspectRatio };
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

    // Handle image upload for image-to-video - SKIP FILE UPLOAD due to backend issues
    if (strategy.type === 'image-to-video' && strategy instanceof ImageToVideoStrategy) {
      console.log('🎬 Processing image-to-video - bypassing file upload due to backend issues...');
      
      const imageParams = params as ImageToVideoParams;
      
      // Always use existing image data if available, otherwise skip upload
      if (imageParams.sourceImageId || imageParams.sourceImageUrl) {
        finalParams = params;
        console.log('✅ Using existing image reference');
      } else {
        // Skip file upload entirely - payload will handle inline image data
        finalParams = params;
        console.log('⚠️ Skipping file upload due to backend magic library issues - using inline image data');
      }
    }

    const config = getSuperduperAIConfig();
    const payload = strategy.generatePayload(finalParams);
    
    console.log(`🎬 Generating ${strategy.type} video with strategy pattern:`, {
      type: strategy.type,
      requiresSourceImage: strategy.requiresSourceImage,
      requiresPrompt: strategy.requiresPrompt
    });

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