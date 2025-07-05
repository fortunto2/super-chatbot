import { ReferenceTypeEnum } from "@/lib/api";
import { uploadFile } from "../../upload-file";
import type { ImageToVideoParams, VideoGenerationStrategy } from "../strategy.interface";
import { parseResolution } from "@/lib/utils/media-generation";

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

      const { width, height, aspectRatio } = parseResolution(params.resolution);

      const styleObject = { id: params.style || "flux_watercolor", label: params.style || "Watercolor" };
      const shotSizeObject = { id: params.shotSize || "medium_shot", label: params.shotSize || "Medium Shot" };

      const modelObject = { 
        name: params.model || 'azure-openai/sora', 
        label: params.model || 'Sora',
        type: 'TEXT_TO_VIDEO' as any,
        source: 'superduperai' as any,
        params: {} as any
      };

      const payload: any = {
        config: {
          prompt: params.prompt || "animate this image naturally", // Default for image-to-video
          generation_config_name: modelObject.name,
          duration: params.duration,
          aspect_ratio: aspectRatio || "16:9",
          seed: params.seed || Math.floor(Math.random() * 1000000000000),
          negative_prompt: params.negativePrompt || '',
          width: width,
          height: height,
          frame_rate: params.frameRate,
          shot_size: shotSizeObject,
          style_name: styleObject,
          model: modelObject,
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