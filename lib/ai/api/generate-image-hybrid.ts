import { ImageModel, MediaOption, MediaResolution } from "@/lib/types/media-settings";
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
  console.log(`🎨 Validating style for API:`, { id: style.id, label: style.label });
  
  // Ensure we have a valid style ID
  if (!style.id || style.id === 'none') {
    console.log(`🎨 Using default style: real_estate`);
    return 'real_estate';
  }
  
  return style.id;
}

// Polling function to check file status
async function pollForCompletion(fileId: string, maxWaitTime: number = 120000): Promise<any> {
  const config = getSuperduperAIConfig();
  const startTime = Date.now();
  const pollInterval = 2000; // 2 seconds
  
  console.log(`🔄 Starting polling for file: ${fileId}`);
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const response = await fetch(createAPIURL(`/api/v1/file/${fileId}`, config), {
        method: 'GET',
        headers: createAuthHeaders()
      });

      if (response.ok) {
        const fileData = await response.json();
        if (fileData.url) {
          console.log(`✅ Polling success! File completed: ${fileData.url}`);
          return fileData;
        }
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error('❌ Polling error:', error);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
  
  throw new Error('Polling timeout - file may still be generating');
}

// WebSocket approach (with timeout)
async function tryWebSocketApproach(fileId: string, imageGenerationId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const config = getSuperduperAIConfig();
    const wsUrl = `${config.wsURL}/api/v1/ws/project.${fileId}`;
    
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
          projectId: `project.${fileId}`
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

  console.log(`🎨 Starting hybrid image generation:`, {
    prompt: prompt.substring(0, 50) + '...',
    model: model.id,
    style: styleId,
    resolution: `${resolution.width}x${resolution.height}`,
    shotSize: shotSize.label,
    seed: actualSeed,
    requestId
  });

  try {
    // Step 1: Make API call to start generation
    const config = getSuperduperAIConfig();
    const url = createAPIURL(API_ENDPOINTS.GENERATE_IMAGE, config);
    const headers = createAuthHeaders();

    const payload = {
      config: {
        prompt: prompt,
        negative_prompt: "",
        width: resolution.width,
        height: resolution.height,
        steps: 20,
        shot_size: shotSize.label,
        seed: actualSeed,
        generation_config_name: model.id,
        batch_size: 1,
        style_name: styleId,
        references: [],
        entity_ids: [],
        model_type: null
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
    let completedFile;
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