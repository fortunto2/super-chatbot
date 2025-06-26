import type { MediaOption, MediaResolution } from "@/lib/types/media-settings";
import type { VideoModel } from '@/lib/config/superduperai';
import { 
  getSuperduperAIConfig, 
  createAuthHeaders, 
  createAPIURL, 
  API_ENDPOINTS
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

// Polling function to check file status
async function pollForCompletion(fileId: string, maxWaitTime = 180000): Promise<any> {
  const config = getSuperduperAIConfig();
  const startTime = Date.now();
  const pollInterval = 3000; // 3 seconds for video
  
  console.log(`🔄 Starting video polling for file: ${fileId}`);
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const response = await fetch(createAPIURL(`/api/file/${fileId}`, config), {
        method: 'GET',
        headers: createAuthHeaders()
      });

      if (response.ok) {
        const fileData = await response.json();
        if (fileData.url) {
          console.log(`✅ Video polling success! File completed: ${fileData.url}`);
          return fileData;
        }
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error('❌ Video polling error:', error);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
  
  throw new Error('Video polling timeout - generation may still be in progress');
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
  duration: number = 5,
  frameRate: number = 30,
  negativePrompt: string = "",
  sourceImageId?: string,
  sourceImageUrl?: string
): Promise<VideoGenerationResult> => {
  const requestId = generateRequestId();
  const styleId = validateStyleForAPI(style);

  console.log(`🎬 Starting hybrid video generation:`, {
    prompt: `${prompt.substring(0, 50)}...`,
    model: model.name,
    style: styleId,
    resolution: `${resolution.width}x${resolution.height}`,
    shotSize: shotSize.label,
    duration,
    frameRate,
    requestId
  });

  try {
    // Step 1: Make API call to start generation
    const config = getSuperduperAIConfig();
    const url = createAPIURL(API_ENDPOINTS.GENERATE_VIDEO, config);
    const headers = createAuthHeaders();

    // AICODE-NOTE: Video generation payload structure - Fixed for Sora API requirements
    const payload = {
      type: "media",
      template_name: null,
      style_name: styleId,
      config: {
        prompt: prompt,
        negative_prompt: negativePrompt,
        shot_size: shotSize.id, // Use snake_case id for video
        style_name: styleId,
        aspect_ratio: resolution.aspectRatio || "16:9", // FIXED: Use aspect_ratio (not aspecRatio) for Sora
        generation_config_name: model.name,
        height: String(resolution.height),
        qualityType: resolution.qualityType || "hd",
        width: String(resolution.width),
        duration: String(duration),
        fps: String(frameRate),
        source_image_id: sourceImageId,
        source_image_url: sourceImageUrl,
        entity_ids: [],
        references: []
      }
    };

    console.log(`🚀 Making API call to start video generation...`);
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

    // Extract fileId and projectId from response
    // AICODE-NOTE: Fixed to use correct API response structure
    const fileId = result.id ||                        // Primary location in SuperDuperAI API
                  result.data?.[0]?.value?.file_id || 
                  result.data?.[0]?.id || 
                  result.fileId;
    const projectId = result.video_generation?.id ||   // Video project ID
                      result.project_id || 
                      result.data?.[0]?.value?.project_id || 
                      result.projectId;

    console.log(`🔍 Extracted fileId: ${fileId}, projectId: ${projectId}`);
    console.log(`🔍 result.id: ${result.id}`);
    console.log(`🔍 result.video_generation?.id: ${result.video_generation?.id}`);

    if (!fileId) {
      console.error('❌ No fileId found in response');
      return {
        success: false,
        error: 'No file ID returned from API'
      };
    }

    console.log(`🎬 Video generation started - FileId: ${fileId}, ProjectId: ${projectId}`);

    // AICODE-NOTE: Server-side should only return fileId for client-side SSE 
    // Don't try SSE on server - EventSource not available in Node.js
    console.log(`🔌 Server-side: returning fileId for client-side SSE/polling: ${fileId}`);
    
    return {
      success: true,
      projectId,
      requestId,
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