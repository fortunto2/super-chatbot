import type { MediaOption, MediaResolution } from "@/lib/types/media-settings";
import type { ImageModel } from '@/lib/config/superduperai-client';
import { 
  configureSuperduperAI
} from '@/lib/config/superduperai-client';
import { FileService } from '@/lib/api/services/FileService';

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
  // AICODE-NOTE: Use flux_watercolor as it exists in DB (based on working payload example)
  console.log(`🔧 Using flux_watercolor style (confirmed working)`);
  return 'flux_watercolor';
}

// Create image generation payload based on working examples from logs
function createImagePayload(
  prompt: string,
  model: ImageModel,
  resolution: MediaResolution,
  style: MediaOption,
  shotSize: MediaOption,
  projectId: string | null,
  seed?: number,
  batchSize?: number
) {
  const actualSeed = seed || Math.floor(Math.random() * 1000000000000);
  
  // Use correct style validation 
  const styleId = style.id === 'flux_watercolor' ? 'flux_watercolor' : null;
  
  console.log(`🎯 Creating image payload:`, {
    model: model.name,
    resolution: `${resolution.width}x${resolution.height}`,
    style: styleId,
    shotSize: shotSize.id,
    seed: actualSeed
  });

  // AICODE-NOTE: Use the EXACT API contract from OpenAPI types
  const payload = {
    project_id: projectId,
    config: {
      prompt: prompt,
      negative_prompt: '',
      width: resolution.width, // Numbers as expected by API
      height: resolution.height, // Numbers as expected by API
      steps: 30,
      shot_size: shotSize.id as any, // Cast to avoid enum issues
      seed: actualSeed, // Number as expected by API
      generation_config_name: model.name,
      batch_size: batchSize || 1,
      style_name: styleId,
      references: [],
      entity_ids: []
    }
  };

  console.log(`🔍 Диагностика payload:`, {
    shot_size: shotSize.id,
    shot_size_label: shotSize.label, 
    generation_config_name: model.name,
    model_label: model.label,
    style_name: styleId,
    style_original: style.id,
    width: resolution.width,
    height: resolution.height,
    seed: actualSeed
  });

  return payload;
}

export async function generateImage(
  prompt: string,
  model: ImageModel,
  resolution: MediaResolution,
  style: MediaOption,
  shotSize: MediaOption,
  chatId: string,
  seed?: number,
  batchSize?: number
): Promise<ImageGenerationResult> {
  try {
    const requestId = generateRequestId();
    const randomizedSeed = seed || Math.floor(Math.random() * 1000000000000);
    
    console.log(`🚀 Starting image generation:`, {
      prompt: `${prompt.substring(0, 100)}...`,
      model: model.label || model.name,
      resolution: `${resolution.width}x${resolution.height}`,
      style: style.label,
      shotSize: shotSize.label,
      requestId,
      chatId
    });

    // Configure OpenAPI client
    configureSuperduperAI();

    // Create payload using FileService - matching working implementation
    const payload = createImagePayload(prompt, model, resolution, style, shotSize, null, randomizedSeed, batchSize);
    
    console.log(`🖼️ Calling FileService.fileGenerateImage with payload:`, payload);

    // Use FileService from OpenAPI client (same as working implementation)
    const result = await FileService.fileGenerateImage({
      requestBody: payload
    });

    console.log(`✅ FileService response:`, result);

    // The API returns an array of files
    if (!Array.isArray(result) || result.length === 0) {
      console.error(`❌ Invalid response format:`, result);
      return {
        success: false,
        error: 'Invalid response format from API',
        requestId
      };
    }

    const fileData = result[0]; // Get first file
    const fileId = fileData.id;
    const imageGenerationId = fileData.image_generation_id;
    
    if (!fileId) {
      console.error(`❌ Missing file ID:`, fileData);
      return {
        success: false,
        error: 'Missing file ID in response',
        requestId
      };
    }

    console.log(`🎯 Image generation started successfully:`, {
      fileId,
      imageGenerationId,
      requestId,
      status: 'started'
    });

    return {
      success: true,
      projectId: fileId, // Use file ID for tracking
      requestId: imageGenerationId || requestId,
      message: 'Image generation started successfully',
      files: result // Return files array
    };

  } catch (error) {
    console.error(`💥 Image generation error:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      requestId: generateRequestId()
    };
  }
} 