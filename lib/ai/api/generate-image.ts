import { ImageModel, MediaOption, MediaResolution } from "@/lib/types/media-settings";

export interface ImageGenerationResult {
  success: boolean;
  projectId?: string;
  message?: string;
  error?: string;
  files?: any[];
  url?: string;
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
      console.log('Sending image generation request:', {
        prompt,
        style: style.id,
        resolution: `${resolution.width}x${resolution.height}`,
        model: model.id,
        shotSize: shotSize.label,
        chatId
      });
      
      const response = await fetch('https://editor.superduperai.co/api/v1/project/image', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': 'Bearer a5c326b39ac44a82bb31aa1c9436e807'
        },
        body: JSON.stringify({
          projectId: chatId,
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
            batch_size: 3,
            style_name: style.id,
            entity_ids: [],
            references: []
          }
        }),
      });
  
      console.log('Response status:', response.status);
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        if (response.status === 401) {
          return {
            success: false,
            error: 'Authentication failed. The API token may be invalid or expired.',
          };
        }
        
        if (response.status === 500) {
          return {
            success: false,
            error: 'Server error occurred. Please try again later or contact support.',
          };
        }
        
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
  
      const result = await response.json();
      console.log('Success result:', result);
  
      return {
        success: true,
        projectId: result.id || chatId,
        message: `Image generation started successfully! Project ID: ${result.id || chatId}`,
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
  