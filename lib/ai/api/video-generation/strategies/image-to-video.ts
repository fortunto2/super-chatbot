import { ReferenceTypeEnum } from "@/lib/api";
import { uploadFile } from "../../upload-file";
import type { ImageToVideoParams, VideoGenerationStrategy } from "../strategy.interface";

export class ImageToVideoStrategy implements VideoGenerationStrategy {
    readonly type = 'image-to-video';
    readonly requiresSourceImage = true;
    readonly requiresPrompt = false; // Animation description is optional
  
    validate(params: ImageToVideoParams): { valid: boolean; error?: string } {
      if (!params.file) {
        return { valid: false, error: 'Source image is required for image-to-video generation' };
      }
      return { valid: true };
    }
  
    /**
     * Try multiple approaches for image upload with fallback mechanisms
     */
    async handleImageUpload(params: ImageToVideoParams): Promise<{
      imageId?: string;
      imageUrl?: string;
      method: 'existing' | 'upload' | 'base64' | 'direct';
      error?: string;
    }> {
  
      if (!params.file) {
        return {
          error: 'Image upload methods failed',
          method: 'existing'
        };
      }
      try{
        const uploadResult = await uploadFile(params.file);
        console.log("uploadResult", uploadResult);
        return {
          imageId: uploadResult?.id,
          imageUrl: uploadResult?.url || undefined,
          method: 'upload'
        };
      } catch (error) {
        console.error("Error uploading file", error);
        return {
          error: 'Image upload methods failed',
          method: 'existing'
        };
      }
    }
    
    async generatePayload(params: ImageToVideoParams): Promise<any> {
      const { imageId, imageUrl} = await this.handleImageUpload(params);
      console.log("imageId", imageId);
      const payload: any = {
        config: {
          prompt: params.prompt || "animate this image naturally", // Default for image-to-video
          generation_config_name: params.model.name,
          duration: params.duration,
          aspect_ratio: params.resolution.aspectRatio || "16:9",
          seed: params.seed || Math.floor(Math.random() * 1000000000000),
          negative_prompt: params.negativePrompt || '',
          width: params.resolution.width,
          height: params.resolution.height,
          frame_rate: params.frameRate,
          shot_size: params.shotSize.id,
          style_name: params.style.id,
          references: [
            {
              type: ReferenceTypeEnum.SOURCE,
              reference_id: imageId
            }
          ],
        },
       
      };
      return payload;
    }
  }