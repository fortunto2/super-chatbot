import { API_ENDPOINTS, getSuperduperAIConfig, getSuperduperAIConfigWithUserToken } from "@/lib/config/superduperai";
import { ImageGenerationStrategyFactory } from "./strategy.factory";
import type { ImageGenerationParams, ImageToImageParams, ImageGenerationResult } from "./strategy.interface";

// Main generation function using strategy pattern
export async function generateImageWithStrategy(
    generationType: string,
    params: ImageGenerationParams | ImageToImageParams,
    session?: any // Added session parameter
  ): Promise<ImageGenerationResult> {
    console.log('🔧 configureImageGeneration called with:', params);
    
    const factory = new ImageGenerationStrategyFactory();
    const strategy = factory.getStrategy(generationType);
    
    if (!strategy) {
      throw new Error(`Unsupported generation type: ${generationType}`);
    }

    let response: Response;
    let result: any;

    try {
      // Use user token from session if available, fallback to system token
      const config = session ? getSuperduperAIConfigWithUserToken(session) : getSuperduperAIConfig();
      
      // If using user token, verify user exists in SuperDuperAI
      if ((config as any).isUserToken && session?.user?.email) {
        console.log(`🔍 Checking if user ${session.user.email} exists in SuperDuperAI...`);
        try {
          const testUrl = `${config.url}/api/v1/user/profile`;
          console.log(`🔍 Testing SuperDuperAI endpoint: ${testUrl}`);
          
          const testResponse = await fetch(testUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${config.token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log(`🔍 SuperDuperAI user check response: ${testResponse.status} ${testResponse.statusText}`);
          
          if (!testResponse.ok) {
            console.log(`⚠️ User ${session.user.email} not found in SuperDuperAI (${testResponse.status}), falling back to system token`);
            // Fall back to system token
            const systemConfig = getSuperduperAIConfig();
            config.url = systemConfig.url;
            config.token = systemConfig.token;
            (config as any).isUserToken = false;
            console.log('🔄 Switched to system token for SuperDuperAI');
          } else {
            console.log(`✅ User ${session.user.email} exists in SuperDuperAI, using user token`);
          }
        } catch (error) {
          console.log(`❌ Error checking user existence in SuperDuperAI:`, error);
          console.log(`🔄 Falling back to system token due to error`);
          // Fall back to system token on error
          const systemConfig = getSuperduperAIConfig();
          config.url = systemConfig.url;
          config.token = systemConfig.token;
          (config as any).isUserToken = false;
        }
      }
      
      const payload = await strategy.generatePayload(params);
      // Use correct SuperDuperAI endpoint for image generation
      const endpoint = API_ENDPOINTS.GENERATE_IMAGE;
      const url = `${config.url}${endpoint}`;
      // All requests use JSON payload
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `API Error: ${response.status} ${response.statusText} - ${errorText}`,
        };
      }
      result = await response.json();
      console.log("result", result);
      const fileId = result[0].id || result[0].file_id
      if (!fileId) {
        return {
          success: false,
          error: 'No file ID returned from API'
        };
      }
      return {
        success: true,
        projectId: fileId,
        requestId: fileId,
        fileId,
        message: `${strategy.type} generation started! FileId: ${fileId}`,
        tasks: result.tasks || []
      };
    } catch (error: any) {
      let errorMessage = error.message || `Unknown ${strategy.type} generation error`;
      return {
        success: false,
        error: errorMessage,
      };
    }
  } 