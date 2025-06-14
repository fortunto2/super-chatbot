import { VideoModel, MediaOption, MediaResolution } from "@/lib/types/media-settings";
import { 
  getSuperduperAIConfig, 
  createAuthHeaders, 
  createAPIURL, 
  API_ENDPOINTS,
  getAvailableVideoModels,
  findVideoModel
} from '@/lib/config/superduperai';

export interface VideoGenerationResult {
  success: boolean;
  projectId?: string;
  requestId?: string;
  message?: string;
  error?: string;
  files?: any[];
  url?: string;
}

// Generate unique request ID
function generateRequestId(): string {
  return `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const generateVideo = async (
  style: MediaOption, 
  resolution: MediaResolution, 
  prompt: string, 
  model: VideoModel, 
  shotSize: MediaOption,
  chatId: string,
  negativePrompt?: string,
  frameRate: number = 30,
  duration: number = 5,
  sourceImageId?: string,
  sourceImageUrl?: string
): Promise<VideoGenerationResult> => {
    try {
      const requestId = generateRequestId();
      const config = getSuperduperAIConfig();
      
      console.log(`🎬 Starting video generation with requestId: ${requestId}, chatId: ${chatId}`);
      console.log('🎬 Model requested:', model);
      
      // Use our new dynamic model discovery system
      let actualModelName = model.id;
      
      // Try to find the model in our dynamic system
      const dynamicModel = await findVideoModel(model.id);
      if (dynamicModel) {
        actualModelName = dynamicModel.id;
        console.log('🎬 ✅ Found dynamic model:', actualModelName, 'with name:', dynamicModel.name);
      } else {
        console.log('🎬 ⚠️ Model not found in dynamic system, using provided ID:', model.id);
        
        // Log available models for debugging
        const availableModels = await getAvailableVideoModels();
        console.log('🎬 Available models:', availableModels.map(m => `${m.id} (${m.name})`));
      }
      
      console.log('🎬 Final model ID for API:', actualModelName);
      
      // AICODE-NOTE: Check if this is an image-to-video model based on model name patterns
      const isImageToVideo = actualModelName.includes('image-to-video') ||
                            actualModelName.includes('veo') ||
                            actualModelName.includes('kling') ||
                            actualModelName.toLowerCase().includes('image2video') ||
                            actualModelName.toLowerCase().includes('img2vid');
      
      // AICODE-NOTE: SuperDuperAI API payload structure for video generation
      let apiPayload: any;
      
      if (isImageToVideo && (sourceImageId || sourceImageUrl)) {
        // Image-to-video payload structure (matching user example)
        apiPayload = {
          params: {
            config: {
              seed: Math.floor(Math.random() * 1000000000000),
              steps: 50,
              width: resolution.width,
              height: resolution.height,
              prompt,
              duration,
              batch_size: 1,
              aspect_ratio: resolution.aspectRatio,
              negative_prompt: negativePrompt || ''
            },
            file_ids: sourceImageId ? [sourceImageId] : [],
            references: sourceImageUrl ? [{
              type: "source",
              reference_url: sourceImageUrl
            }] : [],
            generation_config: {
              name: actualModelName,
              type: "image_to_video",
              label: dynamicModel?.name || model.label,
              params: {
                vip_required: true,
                price_per_second: dynamicModel?.pricePerSecond || 2,
                arguments_template: `{"prompt": {{config.prompt|tojson}}, "image_url": "{{reference.source}}", "aspect_ratio": "{{config.aspect_ratio}}", "duration": {{config.duration|int}}, "fps": ${frameRate}, "enhance_prompt": true, "samples": {{config.batch_size|default(1)}}, "seed": {{config.seed|int}}, "negative_prompt": {{config.negative_prompt|tojson}}}`,
                available_durations: [5, 6, 7, 8]
              },
                             source: "superduperai"
            }
          }
        };
      } else {
        // Text-to-video payload structure (existing format)
        apiPayload = {
          projectId: chatId,
          requestId: requestId,
          type: "video",
          template_name: null,
          config: {
            prompt,
            negative_prompt: negativePrompt || '',
            width: resolution.width,
            height: resolution.height,
            aspect_ratio: resolution.aspectRatio,
            qualityType: resolution.qualityType,
            shot_size: shotSize.label,
            seed: `${Math.floor(Math.random() * 1000000000000)}`,
            generation_config_name: actualModelName,
            batch_size: 1,
            style_name: style.id,
            entity_ids: [],
            references: [],
            // Video-specific parameters
            duration,
            frame_rate: frameRate,
          }
        };
      }
      
      console.log('🎬 Sending to SuperDuperAI API with payload:', apiPayload);
      
      const response = await fetch(createAPIURL(API_ENDPOINTS.GENERATE_VIDEO), {
        method: "POST",
        headers: {
          ...createAuthHeaders(config),
          'X-Request-ID': requestId
        },
        body: JSON.stringify(apiPayload),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🎬 ❌ SuperDuperAI API Error Response:', errorText);
        
        if (response.status === 401) {
          return {
            success: false,
            requestId,
            error: 'Authentication failed. Check SUPERDUPERAI_TOKEN environment variable.',
          };
        }
        
        if (response.status === 404) {
          return {
            success: false,
            requestId,
            error: `Model "${actualModelName}" not found. Available models: ${(await getAvailableVideoModels()).map(m => m.id).join(', ')}`,
          };
        }
        
        if (response.status === 500) {
          return {
            success: false,
            requestId,
            error: 'Server error occurred. Please try again later or contact support.',
          };
        }
        
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
  
      const result = await response.json();
      
      console.log(`🎬 ✅ SuperDuperAI video generation API response for requestId ${requestId}:`, result);
      
      const finalProjectId = result.id || chatId;
      
      // Notify chat WebSocket about new project ID if different from chatId
      if (finalProjectId !== chatId && typeof window !== 'undefined') {
        console.log(`🎬 New projectId detected: ${finalProjectId}, notifying chat WebSocket`);
        const globalWindow = window as any;
        if (globalWindow.notifyNewProject) {
          globalWindow.notifyNewProject(finalProjectId);
        }
      }
  
      return {
        success: true,
        projectId: finalProjectId,
        requestId,
        message: `Video generation started successfully! Project ID: ${finalProjectId}, Request ID: ${requestId}`,
        files: result.files || [],
        url: result.url || null,
      };
  
    } catch (error: any) {
      console.error('🎬 ❌ Video generation error:', error);
      return {
        success: false,
        error: error?.message || 'Unknown error occurred during video generation',
      };
    }
} 