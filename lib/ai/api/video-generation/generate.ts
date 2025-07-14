import { API_ENDPOINTS, getSuperduperAIConfig } from "@/lib/config/superduperai-client";
import { ImageToVideoStrategy } from "./strategies/image-to-video";
import { VideoGenerationStrategyFactory } from "./strategy.factory";
import type { ImageToVideoParams, VideoGenerationParams, VideoGenerationResult } from "./strategy.interface";

// Main generation function using strategy pattern with fallback mechanisms
export async function generateVideoWithStrategy(
    generationType: string,
    params: VideoGenerationParams | ImageToVideoParams
  ): Promise<VideoGenerationResult> {
    const factory = new VideoGenerationStrategyFactory();
    const strategy = factory.getStrategy(generationType);
  
    if (!strategy) {
      return {
        success: false,
        error: `Unsupported generation type: ${generationType}. Supported types: ${factory.getSupportedTypes().join(', ')}`
      };
    }
  
    // Validate parameters
    const validation = strategy.validate(params);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }
  
    try {
      let finalParams = params;
      console.log("finalParams", finalParams);
      if (strategy.type === 'image-to-video' && strategy instanceof ImageToVideoStrategy) {
        const imageParams = params as ImageToVideoParams;
        if (imageParams.file) {
          finalParams = params;
          console.log('✅ Using existing image reference');
        } else {
          // Skip file upload entirely - payload will handle inline image data
          finalParams = params;
          console.log('⚠️ Skipping file upload due to backend magic library issues - using inline image data');
        }
      }
  
      const config = getSuperduperAIConfig();
  
      const payload = await strategy.generatePayload(finalParams);
      
      // Use correct SuperDuperAI endpoint for video generation  
      const endpoint = API_ENDPOINTS.GENERATE_VIDEO; 
      const url = `${config.url}${endpoint}`;
  
      let response: Response;
  
      // All requests now use JSON payload (Base64 conversion happens on client side)
      console.log('🎬 Sending with JSON payload:', JSON.stringify(payload, null, 2));
        
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
        console.error(`❌ ${strategy.type} API Error (${response.status}):`, errorText);
        
        // Add specific error handling for common issues
        if (response.status === 500 && errorText.includes('magic')) {
          return {
            success: false,
            error: `Backend file processing error. The SuperDuperAI service is experiencing issues with file type detection. Please try again later or contact support.`,
          };
        }
        
        return {
          success: false,
          error: `API Error: ${response.status} ${response.statusText} - ${errorText}`,
        };
      }
  
      const result = await response.json();
      console.log(`📨 ${strategy.type} API Response:`, result);
  
      // Extract fileId from response
      const fileId = result.id ||
                    result.data?.[0]?.value?.file_id || 
                    result.data?.[0]?.id || 
                    result.fileId;
  
      if (!fileId) {
        console.error('❌ No fileId found in response');
        return {
          success: false,
          error: 'No file ID returned from API'
        };
      }
  
      console.log(`🎬 ${strategy.type} generation started - FileId: ${fileId}`);
  
      return {
        success: true,
        projectId: fileId,
        requestId: fileId,
        fileId,
        message: `${strategy.type} generation started! FileId: ${fileId}`,
      };
  
    } catch (error: any) {
      console.error(`❌ ${strategy.type} generation error:`, error);
      
      // Enhanced error messages for common issues
      let errorMessage = error.message || `Unknown ${strategy.type} generation error`;
      
      if (errorMessage.includes('magic') || errorMessage.includes('AttributeError')) {
        errorMessage = 'Backend service error: File type detection failed. This is a temporary server issue.';
      } else if (errorMessage.includes('upload')) {
        errorMessage = 'Image upload failed. Please try with a different image or try again later.';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  } 