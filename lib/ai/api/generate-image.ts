import { ImageModel, MediaOption, MediaResolution } from "@/lib/types/media-settings";

export interface ImageGenerationResult {
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
  return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Validate style before sending to API
function validateStyleForAPI(style: MediaOption): string {
  console.log(`🎨 Validating style for API:`, { id: style.id, label: style.label });
  
  // Ensure we have a valid style ID
  if (!style.id || typeof style.id !== 'string') {
    console.log(`🎨 ⚠️ Invalid style ID, using fallback: flux_steampunk`);
    return 'flux_steampunk';
  }
  
  // Log the final style being sent
  console.log(`🎨 ✅ Using style ID for API: ${style.id}`);
  return style.id;
}

export const generateImage = async (
  style: MediaOption, 
  resolution: MediaResolution, 
  prompt: string, 
  model: ImageModel, 
  shotSize: MediaOption,
  chatId: string
): Promise<ImageGenerationResult> => {
    try {
      const requestId = generateRequestId();
      const token = "afda4dc28cf1420db6d3e35a291c2d5f"
      
      console.log(`🎨 Starting image generation with requestId: ${requestId}, chatId: ${chatId}`);
      
      // Validate and prepare style for API
      const validatedStyleId = validateStyleForAPI(style);
      
      console.log(`🎨 Sending to API with parameters:`, {
        prompt: prompt.substring(0, 50) + '...',
        style_name: validatedStyleId,
        width: resolution.width,
        height: resolution.height,
        shot_size: shotSize.label,
        model: model.id
      });
      
      const response = await fetch('https://editor.superduperai.co/api/v1/project/image', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
          'X-Request-ID': requestId // Add request ID to headers
        },
        body: JSON.stringify({
          projectId: chatId,
          requestId: requestId, // Include in body as well
          type: "image",
          template_name: null,
          config: {
            prompt,
            width: resolution.width,
            height: resolution.height,
            aspecRatio: resolution.aspectRatio,
            qualityType: resolution.qualityType,
            shot_size: shotSize.label,
            seed: `${Math.floor(Math.random() * 1000000000000)}`,
            generation_config_name: "comfyui/flux",
            batch_size: 1,
            style_name: validatedStyleId, // Use validated style ID
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
      
      console.log(`🎨 Image generation API response for requestId ${requestId}:`, result);
      
      const finalProjectId = result.id || chatId;
      
      // Notify chat WebSocket about new project ID if different from chatId
      if (finalProjectId !== chatId && typeof window !== 'undefined') {
        console.log(`🎨 New projectId detected: ${finalProjectId}, notifying chat WebSocket`);
        const globalWindow = window as any;
        if (globalWindow.notifyNewProject) {
          globalWindow.notifyNewProject(finalProjectId);
        }
      }
  
      return {
        success: true,
        projectId: finalProjectId,
        requestId,
        message: `Image generation started successfully! Project ID: ${finalProjectId}, Request ID: ${requestId}`,
        files: result.files || [],
        url: result.url || null,
      };
  
    } catch (error: any) {
      console.error('Image generation error:', error);
      return {
        success: false,
        error: error?.message || 'Unknown error occurred during image generation',
      };
    }
  }
  