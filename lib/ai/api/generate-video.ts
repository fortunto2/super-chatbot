import type { MediaOption, MediaResolution } from "@/lib/types/media-settings";
import type { VideoModel } from '@/lib/config/superduperai';
import { 
  getSuperduperAIConfig, 
} from '@/lib/config/superduperai';

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

// Generate unique request ID
function generateRequestId(): string {
  return `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Validate style before sending to API
function validateStyleForAPI(style: MediaOption): string {
  console.log(`🎬 Validating style for API:`, { id: style.id, label: style.label });
  
  // AICODE-NOTE: Use flux_watercolor as working style
  console.log(`🔧 Using flux_watercolor style (confirmed working)`);
  return 'flux_watercolor';
}

// Smart polling function using the new polling manager for video
async function pollForCompletion(fileId: string, maxWaitTime = 420000): Promise<any> {
  console.log(`🔄 Starting smart video polling for file: ${fileId} (max: ${maxWaitTime / 1000}s)`);
  
  try {
    const { pollFileCompletion } = await import('@/lib/utils/smart-polling-manager');
    
    const result = await pollFileCompletion(fileId, {
      maxDuration: maxWaitTime, // Default 7 minutes
      initialInterval: 3000, // Start with 3s for video (slower than images)
      onProgress: (attempt, elapsed, nextInterval) => {
        console.log(`🔄 Hybrid video poll attempt ${attempt} (${Math.round(elapsed / 1000)}s elapsed, next: ${nextInterval}ms)`);
      },
      onError: (error, attempt) => {
        console.warn(`⚠️ Hybrid video polling non-critical error at attempt ${attempt}:`, error.message);
      }
    });
    
    if (result.success && result.data) {
      console.log(`✅ Smart video polling success! File completed: ${result.data.url}`);
      return result.data;
    } else {
      throw new Error(result.error || 'Smart video polling timeout - generation may still be in progress');
    }
    
  } catch (error) {
    console.error('❌ Smart video polling system error:', error);
    throw new Error('Failed to initialize smart video polling system');
  }
}

// SSE approach with inline connection (like video generator tool)
async function trySSEApproach(fileId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    // Use Next.js SSE proxy instead of direct backend connection
    const sseUrl = `/api/events/file.${fileId}`;
    
    console.log(`🔌 Trying inline SSE approach: ${sseUrl}`);
    
    let eventSource: EventSource | null = null;
    let resolved = false;
    
    // Set timeout for SSE attempt (60s for video)
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.log('⏰ SSE timeout - falling back to polling');
        if (eventSource) {
          eventSource.close();
        }
        reject(new Error('SSE timeout'));
      }
    }, 60000); // 60 second timeout for video
    
    try {
      eventSource = new EventSource(sseUrl);
      
      eventSource.onopen = () => {
        console.log('🔌 ✅ Video SSE connected');
      };
      
      eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 Video SSE message:', message.type, message);
          
          // Handle different event types
          if (message.type === 'render_result') {
            const videoUrl = message.object?.url || message.object?.file_url;
            if (videoUrl && !resolved) {
              resolved = true;
              clearTimeout(timeout);
              console.log('🎬 ✅ Video completed via render_result:', videoUrl);
              eventSource?.close();
              resolve({ url: videoUrl, ...message.object });
            }
          } else if (message.type === 'file' && message.object?.url) {
            const videoUrl = message.object.url;
            
            // Check if it's a video file
            if (videoUrl.match(/\.(mp4|mov|webm|avi|mkv)$/i) || 
                message.object.contentType?.startsWith('video/')) {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                console.log('🎬 ✅ Video completed via file event:', videoUrl);
                eventSource?.close();
                resolve(message.object);
              }
            }
          } else if (message.type === 'task_status' && message.object?.status === 'COMPLETED') {
            console.log('📡 Task completed, but no direct URL - will fallback to polling');
          }
        } catch (error) {
          console.error('❌ Video SSE message parse error:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.log('❌ Video SSE error:', error);
          reject(new Error('SSE error'));
        }
      };
      
    } catch (error) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        console.log('❌ Video SSE creation error:', error);
        reject(error);
      }
    }
  });
}

export const generateVideoHybrid = async (
  prompt: string,
  model: VideoModel,
  style: MediaOption,
  resolution: MediaResolution,
  shotSize: MediaOption,
  duration = 5,
  frameRate = 30,
  negativePrompt = "",
  sourceImageId?: string,
  sourceImageUrl?: string
): Promise<VideoGenerationResult> => {

  console.log(`🎬 Starting hybrid video generation:`, {
    prompt: `${prompt.substring(0, 50)}...`,
    model: model.name,
    style: style.label,
    resolution: `${resolution.width}x${resolution.height}`,
    shotSize: shotSize.label,
    duration,
    frameRate,
    sourceImageId,
    sourceImageUrl
  });

  try {
    // Step 1: Make API call using original working format
    const config = getSuperduperAIConfig();
    const url = `${config.url}/api/v1/file/generate-video`;
    const headers = {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/json'
    };

    // AICODE-NOTE: Use original working payload format with type: "media" (ALWAYS use this format)
    const payload = {
      type: "media",           // ← CRITICAL: Always use this format, never "params"!
      template_name: null,
      style_name: style.id,    // ← Add style_name at top level
      config: {
        prompt,
        negative_prompt: negativePrompt,
        width: resolution.width,
        height: resolution.height,
        aspect_ratio: resolution.aspectRatio || "16:9",
        seed: Math.floor(Math.random() * 1000000000000),
        generation_config_name: model.name,
        duration,
        frame_rate: frameRate,
        batch_size: 1,
        shot_size: shotSize.id,
        style_name: style.id,
        qualityType: resolution.qualityType || "hd",
        entity_ids: [],
        references: sourceImageUrl ? [{
          type: 'source',
          reference_id: sourceImageId || '',
          reference_url: sourceImageUrl
        }] : []
      }
    };

    console.log(`🚀 Calling original format with type: "media":`, payload);
    
    // Use original fetch approach that was working
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}):`, errorText);
      return {
        success: false,
        error: `API Error: ${response.status} ${response.statusText} - ${errorText}`,
      };
    }

    const result = await response.json();
    console.log(`📨 API Response:`, result);

    // Extract fileId from response (original logic)
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

    console.log(`🎬 Video generation started - FileId: ${fileId}`);

    return {
      success: true,
      projectId: fileId,
      requestId: fileId,
      fileId,
      message: `Video generation started! FileId: ${fileId} - client will handle SSE/polling`,
    };

  } catch (error: any) {
    console.error(`❌ Video generation error:`, error);
    return {
      success: false,
      error: error.message || 'Unknown video generation error',
    };
  }
}; 