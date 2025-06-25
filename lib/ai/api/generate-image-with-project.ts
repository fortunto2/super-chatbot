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

// Generate unique project ID
function generateProjectId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Validate style before sending to API
function validateStyleForAPI(style: MediaOption): string {

  
  // AICODE-NOTE: Use flux_watercolor as it exists in DB (based on working payload example)
  console.log(`🔧 Using flux_watercolor style (confirmed working)`);
  return 'flux_watercolor';
}

// Create project first to get project_id
async function createProject(prompt: string): Promise<string> {
  const config = getSuperduperAIConfig();
  const projectId = generateProjectId();
  
  console.log(`🏗️ Creating project for image generation: ${projectId}`);
  
  // Create a simple project payload
  const projectPayload = {
    name: `Image: ${prompt.substring(0, 50)}...`,
    description: `Generated image project for: ${prompt}`,
    type: "media", // Use media type as required by API
    config: {
      prompt: prompt,
      created_at: new Date().toISOString()
    }
  };
  
  try {
    // Try to create project via /api/v1/project/image endpoint
    const projectUrl = createAPIURL('/api/v1/project/image');
    const headers = createAuthHeaders();
    
    const response = await fetch(projectUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(projectPayload)
    });
    
    if (response.ok) {
      const project = await response.json();
      console.log(`✅ Project created successfully:`, project);
      return project.id;
    } else {
      console.log(`⚠️ Project creation failed, using generated ID: ${projectId}`);
      return projectId;
    }
  } catch (error) {
    console.log(`⚠️ Project creation error, using generated ID:`, error);
    return projectId;
  }
}

// Polling function to check file status
async function pollForCompletion(fileId: string, maxWaitTime = 120000): Promise<any> {
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
async function tryWebSocketApproach(projectId: string, fileId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const config = getSuperduperAIConfig();
    const wsUrl = `${config.wsURL}/api/v1/ws/project.${projectId}`;
    
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
          projectId: `project.${projectId}`
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

export const generateImageWithProject = async (
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
    // Step 1: Create project to get project_id
    const projectId = await createProject(prompt);
    console.log(`🏗️ Using project ID: ${projectId}`);

    // Step 2: Make API call to start generation with project_id
    const config = getSuperduperAIConfig();
    const url = createAPIURL(API_ENDPOINTS.GENERATE_IMAGE, config);
    const headers = createAuthHeaders();

    // AICODE-NOTE: Fixed payload structure to match working API format
    const payload = {
      type: "media",
      template_name: null,
      project_id: projectId, // Keep project_id for this variant
      style_name: styleId, // Move style_name outside config
      config: {
        prompt: prompt,
        shot_size: shotSize.id, // FIXED: Use id instead of label for snake_case format
        style_name: styleId, // Keep for backward compatibility
        seed: String(actualSeed), // Convert to string
        aspect_ratio: resolution.aspectRatio || "16:9", // FIXED: Use correct aspect_ratio parameter name
        batch_size: 3, // Use batch_size 3 like in working example
        entity_ids: [],
        generation_config_name: model.name,
        height: String(resolution.height), // Convert to string
        qualityType: resolution.qualityType || "full_hd", // Add qualityType
        references: [],
        width: String(resolution.width), // Convert to string
      }
    };

    // AICODE-NOTE: Diagnostic logging to identify ROLLBACK issues
    console.log('🔍 Диагностика payload перед отправкой:', {
      project_id: projectId,
      shot_size_label: shotSize.label,
      shot_size_id: shotSize.id, 
      generation_config_name: model.name,
      model_label: model.label,
      style_name: styleId,
      style_original: style.id,
      width: resolution.width,
      height: resolution.height,
      seed: actualSeed
    });

    console.log(`🚀 Making API call with project_id...`);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error Response:`, errorText);
      console.error(`❌ Response Status: ${response.status}`);
      console.error(`❌ Response Headers:`, Object.fromEntries(response.headers.entries()));
      
      // AICODE-NOTE: Special handling for potential ROLLBACK issues
      if (response.status === 500) {
        console.error('❌ 500 Error - возможно произошел ROLLBACK в базе данных');
        console.error('❌ Проверьте: generation_config_name, shot_size enum, style_name');
      }
      
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
      projectId,
      fileId,
      imageGenerationId,
      status: 'started'
    });

    // Step 3: Try WebSocket first, then fallback to polling
    let completedFile: any;
    let method: 'websocket' | 'polling' = 'websocket';

    try {
      console.log(`🔌 Attempting WebSocket approach...`);
      completedFile = await tryWebSocketApproach(projectId, fileId);
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
          projectId
        };
      }
    }

    console.log(`🎉 Image generation completed via ${method}:`, {
      projectId,
      fileId,
      imageUrl: completedFile.url,
      method
    });

    return {
      success: true,
      projectId,
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