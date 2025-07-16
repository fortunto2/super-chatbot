import { API_NEXT_ROUTES } from "@/lib/config/next-api-routes";

export interface ImageGenerationFormData {
  prompt: string;
  model?: string;
  resolution?: string;
  style?: string;
  shotSize?: string;
  seed?: number;
  generationType?: 'text-to-image' | 'image-to-image';
  file?: File;
}

export interface ImageGenerationApiResult {
  success: boolean;
  projectId?: string;
  requestId?: string;
  error?: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function generateImageApi(formData: ImageGenerationFormData): Promise<ImageGenerationApiResult> {
  try {
    const payload: any = {
      prompt: formData.prompt,
      model: { name: formData.model || 'comfyui/flux' },
      resolution: {
        width: Number.parseInt(formData.resolution?.split('x')[0] || '1024'),
        height: Number.parseInt(formData.resolution?.split('x')[1] || '1024')
      },
      style: { id: 'flux_watercolor' },
      shotSize: { id: formData.shotSize || 'medium_shot' },
      seed: formData.seed,
      chatId: 'image-generator-tool',
      steps: 30,
      batchSize: 1
    };
    if (formData.generationType === 'image-to-image' && formData.file) {
      payload.generationType = 'image-to-image';
      payload.sourceImageUrl = await fileToBase64(formData.file);
    } else {
      payload.generationType = 'text-to-image';
    }
    const response = await fetch(API_NEXT_ROUTES.GENERATE_IMAGE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const result = await response.json();
    
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Generation failed'
      };
    }

    return {
      success: true,
      projectId: result.fileId, // Use fileId as projectId for tracking
      requestId: result.fileId // Use fileId as requestId
    };

  } catch (error) {
    console.error('Image generation API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 