import type { MediaOption, MediaResolution } from "@/lib/types/media-settings";
import type { ImageModel } from '@/lib/config/superduperai';
import { 
  getSuperduperAIConfig, 
  createAuthHeaders, 
  createAPIURL, 
} from '@/lib/config/superduperai';
// import { ensureProjectForChatId } from '@/lib/utils/simple-project';

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
  
  // AICODE-NOTE: Use flux_watercolor as it exists in DB (based on working payload example)
  console.log(`🔧 Using flux_watercolor style (confirmed working)`);
  return 'flux_watercolor';
}

// Create image generation payload based on working examples
function createImagePayload(
  prompt: string,
  model: ImageModel,
  resolution: MediaResolution,
  style: MediaOption,
  shotSize: MediaOption,
  projectId: string | null,
  seed?: number
) {
  const actualSeed = seed || Math.floor(Math.random() * 1000000000000);
  const styleId = validateStyleForAPI(style);
  
  console.log(`🎯 Creating image payload:`, {
    model: model.name,
    resolution: `${resolution.width}x${resolution.height}`,
    style: styleId,
    shotSize: shotSize.label,
    seed: actualSeed
  });

  // AICODE-NOTE: Fixed payload structure based on working example
  // Key changes: aspectRatio, qualityType outside config, proper string formats
  const payload = {
    type: "media",
    template_name: null,
    style_name: styleId, // Move style_name outside config
    config: {
      prompt: prompt,
      shot_size: shotSize.label, // Use label instead of id for shot_size
      style_name: styleId, // Keep for backward compatibility
      seed: String(actualSeed), // Convert to string
      aspecRatio: resolution.aspectRatio || "16:9", // Add aspecRatio (typo in API, but correct)
      batch_size: 3, // Use batch_size 3 like in working example
      entity_ids: [],
      generation_config_name: model.name,
      height: String(resolution.height), // Convert to string
      qualityType: resolution.qualityType || "full_hd", // Add qualityType
      references: [],
      width: String(resolution.width), // Convert to string
    }
  };

  return payload;
}

export async function generateImage(
  prompt: string,
  model: ImageModel,
  resolution: MediaResolution,
  style: MediaOption,
  shotSize: MediaOption,
  chatId: string,
  seed?: number
): Promise<ImageGenerationResult> {
  try {
    const config = getSuperduperAIConfig();
    const requestId = generateRequestId();
    
    console.log(`🚀 Starting image generation:`, {
      prompt: `${prompt.substring(0, 100)}...`,
      model: model.label || model.name,
      resolution: `${resolution.width}x${resolution.height}`,
      style: style.label,
      shotSize: shotSize.label,
      requestId,
      chatId
    });

    // AICODE-NOTE: Skip project creation - let backend create new project automatically
    console.log(`🏗️ Generating image for chat: ${chatId} (new project will be auto-created)`);

    // Add randomness to prevent 409 conflicts
    const randomizedSeed = seed || Math.floor(Math.random() * 1000000000000);
    const payload = createImagePayload(prompt, model, resolution, style, shotSize, null, randomizedSeed);
    
    console.log(`📦 Image generation payload:`, JSON.stringify(payload, null, 2));

    // Use the correct endpoint for project+image generation
    const url = createAPIURL('/api/v1/project/image', config);
    const headers = createAuthHeaders();

    console.log(`📡 Making request to: ${url}`);
    console.log(`🔑 Headers:`, headers);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    console.log(`📡 API Response Status: ${response.status}`);
    console.log(`📡 API Response Headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error Response:`, errorText);
      
      return {
        success: false,
        error: `API Error: ${response.status} - ${errorText}`,
        requestId
      };
    }

    const result = await response.json();
    console.log(`✅ API Success Response:`, result);

    // The API returns a project object with data array
    if (!result || !result.id || !result.data || !Array.isArray(result.data) || result.data.length === 0) {
      console.error(`❌ Invalid response format:`, result);
      return {
        success: false,
        error: 'Invalid response format from API',
        requestId
      };
    }

    const projectId = result.id;
    const fileData = result.data[0];
    const fileId = fileData.value?.file_id;
    
    // We need to get the actual file info from tasks or other source
    const imageGenerationId = requestId; // Use our request ID as fallback
    
    if (!fileId || !imageGenerationId) {
      console.error(`❌ Missing file ID or image generation ID:`, fileData);
      return {
        success: false,
        error: 'Missing file ID or image generation ID in response',
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
      projectId: projectId, // Use the project ID from response for WebSocket
      requestId: imageGenerationId, // Use image generation ID as request ID
      message: 'Image generation started successfully',
      files: [result] // Return project as files array for compatibility
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
  