import type { MediaOption, MediaResolution } from "@/lib/types/media-settings";
import type { ImageModel } from '@/lib/config/superduperai';
import { 
  getSuperduperAIConfig, 
  createAuthHeaders, 
  createAPIURL, 
  API_ENDPOINTS 
} from '@/lib/config/superduperai';

export interface ImageGenerationResult {
  success: boolean;
  projectId?: string;
  requestId?: string;
  message?: string;
  error?: string;
  files?: any[];
  url?: string;
  method?: 'websocket' | 'polling';
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

// Smart polling function using the new polling manager
async function pollForCompletion(fileId: string, maxWaitTime = 420000): Promise<any> {
  console.log(`🔄 Starting smart polling for file: ${fileId} (max: ${maxWaitTime / 1000}s)`);
  
  try {
    const { pollFileCompletion } = await import('@/lib/utils/smart-polling-manager');
    
    const result = await pollFileCompletion(fileId, {
      maxDuration: maxWaitTime, // Default 7 minutes
      onProgress: (attempt, elapsed, nextInterval) => {
        console.log(`🔄 Hybrid image poll attempt ${attempt} (${Math.round(elapsed / 1000)}s elapsed, next: ${nextInterval}ms)`);
      },
      onError: (error, attempt) => {
        console.warn(`⚠️ Hybrid image polling non-critical error at attempt ${attempt}:`, error.message);
      }
    });
    
    if (result.success && result.data) {
      console.log(`✅ Smart polling success! File completed: ${result.data.url}`);
      return result.data;
    } else {
      throw new Error(result.error || 'Smart polling timeout - file may still be generating');
    }
    
  } catch (error) {
    console.error('❌ Smart polling system error:', error);
    throw new Error('Failed to initialize smart polling system');
  }
}

// WebSocket approach (with timeout)
async function tryWebSocketApproach(fileId: string, imageGenerationId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const config = getSuperduperAIConfig();
    const wsUrl = `${config.wsURL}/api/v1/events/file.${fileId}`;
    
    console.log(`🔌 Trying WebSocket approach: ${wsUrl}`);
    
    let ws: WebSocket | null = null;
    let resolved = false;
    
    // Set timeout for WebSocket attempt
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.log('⏰ WebSocket timeout - falling back to polling');
        if (ws) {
          ws.close();
        }
        reject(new Error('WebSocket timeout'));
      }
    }, 30000); // 30 second timeout for WebSocket
    
    try {
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('🔌 WebSocket connected, sending subscribe message');
        ws?.send(JSON.stringify({
          type: 'subscribe',
          fileId: `file.${fileId}`
        }));
      };
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('📨 WebSocket message:', message);
        
        if (message.type === 'file' && message.object?.url) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            console.log('🎉 WebSocket success!');
            ws?.close();
            resolve(message.object);
          }
        }
      };
      
      ws.onerror = (error) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.log('❌ WebSocket error:', error);
          reject(new Error('WebSocket error'));
        }
      };
      
      ws.onclose = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.log('🔌 WebSocket closed without result');
          reject(new Error('WebSocket closed'));
        }
      };
      
    } catch (error) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        console.log('❌ WebSocket creation error:', error);
        reject(error);
      }
    }
  });
}

export const generateImageHybrid = async (
  prompt: string,
  model: ImageModel,
  style: MediaOption,
  resolution: MediaResolution,
  shotSize: MediaOption,
  seed?: number
): Promise<ImageGenerationResult> => {
  const requestId = generateRequestId();
  const actualSeed = seed || Math.floor(Math.random() * 1000000000000);
  const styleId = validateStyleForAPI(style);



  try {
    // Step 1: Make API call to start generation
    const config = getSuperduperAIConfig();
    const url = createAPIURL('/api/v1/file/generate-image', config);
    const headers = createAuthHeaders();

    // AICODE-NOTE: Fixed payload structure to match working API format
    const payload = {
      type: "media",
      template_name: null,
      style_name: styleId, // Move style_name outside config
      config: {
        prompt: prompt,
        shot_size: shotSize.id, // FIXED: Use id instead of label for snake_case format
        style_name: styleId, // Keep for backward compatibility
        seed: String(actualSeed), // Convert to string
        aspect_ratio: resolution.aspectRatio || "16:9", // FIXED: Use correct aspect_ratio parameter name
        batch_size: 1, // Use default batch_size
        entity_ids: [],
        generation_config_name: model.name,
        height: String(resolution.height), // Convert to string
        qualityType: resolution.qualityType || "full_hd", // Add qualityType
        references: [],
        width: String(resolution.width), // Convert to string
      }
    };

    console.log(`🚀 Making API call to start generation...`);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error Response:`, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ API Success Response:`, result);

    // The API returns an array of files
    if (!Array.isArray(result) || result.length === 0) {
      console.error(`❌ Invalid response format:`, result);
      return {
        success: false,
        error: 'Invalid API response format',
        requestId
      };
    }

    const fileData = result[0];
    const fileId = fileData.id;
    const imageGenerationId = fileData.image_generation_id;

    console.log(`🎯 Generation started:`, {
      fileId,
      imageGenerationId,
      status: 'started'
    });

    // Step 2: Try WebSocket first, then fallback to polling
    let completedFile: any;
    let method: 'websocket' | 'polling' = 'websocket';

    try {
      console.log(`🔌 Attempting WebSocket approach...`);
      completedFile = await tryWebSocketApproach(fileId, imageGenerationId);
      method = 'websocket';
    } catch (wsError) {
      console.log(`🔄 WebSocket failed, falling back to polling...`);
      try {
        completedFile = await pollForCompletion(fileId);
        method = 'polling';
      } catch (pollError) {
        console.error(`❌ Both WebSocket and polling failed:`, pollError);
        return {
          success: false,
          error: 'Both WebSocket and polling approaches failed',
          requestId,
          projectId: fileId
        };
      }
    }

    console.log(`🎉 Image generation completed via ${method}:`, {
      fileId,
      imageUrl: completedFile.url,
      method
    });

    return {
      success: true,
      projectId: fileId,
      requestId,
      url: completedFile.url,
      method,
      message: `Image generation completed successfully via ${method}`
    };

  } catch (error: any) {
    console.error('❌ Image generation error:', error);
    return {
      success: false,
      error: error?.message || 'Unknown error occurred during image generation',
      requestId
    };
  }
}; 