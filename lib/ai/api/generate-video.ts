import { VideoModel, MediaOption, MediaResolution } from "@/lib/types/media-settings";

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
  duration: number = 10
): Promise<VideoGenerationResult> => {
    try {
      const requestId = generateRequestId();
      const token = "afda4dc28cf1420db6d3e35a291c2d5f"
      
      console.log(`🎬 Starting video generation with requestId: ${requestId}, chatId: ${chatId}`);
      
      const response = await fetch('https://editor.superduperai.co/api/v1/project/video', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
          'X-Request-ID': requestId // Add request ID to headers
        },
        body: JSON.stringify({
          projectId: chatId,
          requestId: requestId, // Include in body as well
          type: "video",
          template_name: null,
          config: {
            prompt,
            negative_prompt: negativePrompt || "",
            width: resolution.width,
            height: resolution.height,
            aspectRatio: resolution.aspectRatio,
            qualityType: resolution.qualityType,
            shot_size: shotSize.label,
            seed: `${Math.floor(Math.random() * 1000000000000)}`,
            generation_config_name: "runway/gen3",
            frame_rate: frameRate,
            duration: duration,
            batch_size: 1,
            style_name: style.id,
            entity_ids: [],
            references: []
          }
        }),
      });
  
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        if (response.status === 401) {
          return {
            success: false,
            requestId,
            error: 'Authentication failed. The API token may be invalid or expired.',
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
      
      console.log(`🎬 Video generation API response for requestId ${requestId}:`, result);
      
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
      console.error('Video generation error:', error);
      return {
        success: false,
        error: error?.message || 'Unknown error occurred during video generation',
      };
    }
  } 