import { createDocumentHandler } from '@/lib/artifacts/server';
import { generateVideoHybrid } from '@/lib/ai/api/generate-video';
import { getStyles } from '@/lib/ai/api/get-styles';
import type { MediaOption } from '@/lib/types/media-settings';
import type { VideoModel } from '@/lib/config/superduperai';
import { getAvailableVideoModels } from '@/lib/config/superduperai';
import { SHOT_SIZES, VIDEO_FRAME_RATES, DEFAULT_VIDEO_RESOLUTION, DEFAULT_VIDEO_DURATION, getModelCompatibleResolutions, } from '@/lib/config/video-constants';
import { GenerationTypeEnum } from '@/lib/api/models/GenerationTypeEnum';
import { GenerationSourceEnum } from '@/lib/api/models/GenerationSourceEnum';

// AICODE-NOTE: Now using unified VideoModel type from superduperai.ts
function convertToVideoModel(sdModel: VideoModel): VideoModel {
  return sdModel; // No conversion needed, already in correct format
}

export const videoDocumentHandler = createDocumentHandler<'video'>({
  kind: 'video',
  onCreateDocument: async ({ id: chatId, title, dataStream }) => {
    
    let draftContent = '';

    try {
      // Check if title starts with "Video:" (readable format) or is JSON
      let params: any;
      if (title.startsWith('Video:')) {
        // Extract JSON from the end of readable title
        const jsonMatch = title.match(/\{.*\}$/);
        if (jsonMatch) {
          params = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON parameters found in readable title');
        }
      } else {
        // Fallback to old method of parsing entire title as JSON
        params = JSON.parse(title);
      }
     
      
      const {
        prompt,
        negativePrompt = "",
        style = { id: 'flux_steampunk', label: 'Steampunk' },
        resolution = DEFAULT_VIDEO_RESOLUTION, // AICODE-NOTE: Use economical HD default
        model = { id: 'comfyui/ltx', label: 'LTX Video' }, // AICODE-NOTE: Default to LTX instead of Runway
        shotSize = { id: 'long-shot', label: 'Long Shot' },
        frameRate = 30,
        duration = DEFAULT_VIDEO_DURATION, // AICODE-NOTE: Use economical 5-second default
        sourceImageId,
        sourceImageUrl
      } = params;

      // Load dynamic models from SuperDuperAI API
      let availableModels: VideoModel[] = [];
      try {
        const superDuperModels = await getAvailableVideoModels();
        availableModels = superDuperModels.map(convertToVideoModel);
      } catch (error) {
        console.error('Failed to load dynamic video models:', error);
        // Fallback to default LTX model
        availableModels = [{
          name: 'comfyui/ltx',
          label: 'LTX Video',
          type: GenerationTypeEnum.TEXT_TO_VIDEO,
          source: GenerationSourceEnum.LOCAL,
          params: {
            price: 0.4,
            workflow_path: 'LTX/default.json',
            max_duration: 30,
            max_resolution: { width: 1216, height: 704 },
            supported_frame_rates: [30],
            supported_aspect_ratios: ['16:9', '1:1', '9:16'],
            supported_qualities: ['hd']
          }
        }];
      }

      // Get available styles from API
      let availableStyles: MediaOption[] = [];
      try {
        const response = await getStyles();
        if ("error" in response) {
          console.error('Failed to get styles:', response.error);
        } else {
          availableStyles = response.items.map(style => ({
            id: style.name,
            label: style.title ?? style.name,
          }));
        }
      } catch (err) {
        console.error('Error getting styles:', err);
      }

      
      // AICODE-NOTE: Determine generation type based on source image presence (for dual-mode compatibility)
      const generationType = (sourceImageId || sourceImageUrl) ? 'image-to-video' : 'text-to-video';
      console.log(`🎬 Detected generation type: ${generationType} (hasSourceImage: ${!!(sourceImageId || sourceImageUrl)})`);
      
      // Start video generation with hybrid SSE approach
      const result = await generateVideoHybrid(
        prompt,
        model,
        style,
        resolution,
        shotSize,
        duration,
        frameRate,
        negativePrompt,
        sourceImageId,
        sourceImageUrl,
        generationType
      );

    
      if (!result.success) {
       
        draftContent = JSON.stringify({
          status: 'failed',
          error: result.error,
          prompt: prompt
        });
        
        return draftContent;
      }

      // Create content with hybrid result - video might already be completed!
      const isCompleted = result.url && result.method;
      
      draftContent = JSON.stringify({
        status: isCompleted ? 'completed' : 'pending',
        fileId: result.fileId || result.projectId || chatId,
        projectId: result.projectId || result.fileId || chatId, // Add projectId for SSE
        requestId: result.requestId,
        videoUrl: result.url, // Video URL if already completed
        prompt: prompt,
        negativePrompt: negativePrompt,
        settings: {
          style,
          resolution,
          model,
          shotSize,
          frameRate,
          duration,
          negativePrompt,
          // Include available options for the UI
          availableResolutions: getModelCompatibleResolutions(model.name || model.id || ''),
          availableStyles,
          availableShotSizes: SHOT_SIZES,
          availableModels: availableModels, // AICODE-NOTE: Use dynamic models
          availableFrameRates: VIDEO_FRAME_RATES,
        },
        timestamp: Date.now(),
        message: isCompleted 
          ? `Video generation completed via ${result.method}! (${resolution.label}, ${duration}s)`
          : `Video generation started with economical settings (${resolution.label}, ${duration}s), connecting to SSE...`
      });

     

    } catch (error: any) {
      console.error('Video generation error:', error);

      draftContent = JSON.stringify({
        status: 'failed',
        error: error?.message || 'Failed to parse video parameters'
      });
    }

    return draftContent;
  },
  
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = document.content;

    try {
      // Extract chatId from document.id (which should be the chat ID)
      const chatId = document.id;
      
      // Parse the description to extract new video generation parameters
      const params = JSON.parse(description);
      const {
        prompt,
        negativePrompt = "",
        style = { id: 'flux_steampunk', label: 'Steampunk' },
        resolution = DEFAULT_VIDEO_RESOLUTION, // AICODE-NOTE: Use economical HD default
        model = { id: 'comfyui/ltx', label: 'LTX Video' }, // AICODE-NOTE: Default to LTX instead of Runway
        shotSize = { id: 'long-shot', label: 'Long Shot' },
        frameRate = 30,
        duration = DEFAULT_VIDEO_DURATION, // AICODE-NOTE: Use economical 5-second default
        sourceImageId,
        sourceImageUrl
      } = params;

      // AICODE-NOTE: Load dynamic models for update as well
      let availableModels: VideoModel[] = [];
      try {
        const superDuperModels = await getAvailableVideoModels();
        availableModels = superDuperModels.map(convertToVideoModel);
      } catch (error) {
        console.error('Failed to load dynamic models for update:', error);
        availableModels = [{
          name: 'comfyui/ltx',
          label: 'LTX Video',
          type: GenerationTypeEnum.TEXT_TO_VIDEO,
          source: GenerationSourceEnum.LOCAL,
          params: {
            price: 0.4,
            workflow_path: 'LTX/default.json',
            max_duration: 30,
            max_resolution: { width: 1216, height: 704 },
            supported_frame_rates: [30],
            supported_aspect_ratios: ['16:9', '1:1', '9:16'],
            supported_qualities: ['hd']
          }
        }];
      }

      // AICODE-NOTE: Determine generation type based on source image presence (for dual-mode compatibility)
      const generationType = (sourceImageId || sourceImageUrl) ? 'image-to-video' : 'text-to-video';
      console.log(`🎬 Update - Detected generation type: ${generationType} (hasSourceImage: ${!!(sourceImageId || sourceImageUrl)})`);
      
      // Start new video generation with hybrid SSE approach
      const result = await generateVideoHybrid(
        prompt,
        model,
        style,
        resolution,
        shotSize,
        duration,
        frameRate,
        negativePrompt,
        sourceImageId,
        sourceImageUrl,
        generationType
      );

      if (!result.success) {
        // Return error content as string
        return JSON.stringify({
          status: 'failed',
          error: result.error || 'Unknown error occurred',
          prompt: prompt
        });
      }

      // Update content with hybrid result - video might already be completed!
      const isCompleted = result.url && result.method;
      
      draftContent = JSON.stringify({
        status: isCompleted ? 'completed' : 'pending',
        fileId: result.fileId || result.projectId || chatId,
        projectId: result.projectId || result.fileId || chatId, // Add projectId for SSE
        requestId: result.requestId,
        videoUrl: result.url, // Video URL if already completed
        prompt: prompt,
        negativePrompt: negativePrompt,
        settings: {
          style,
          resolution,
          model,
          shotSize,
          frameRate,
          duration,
          negativePrompt,
          availableResolutions: getModelCompatibleResolutions(model.name || model.id || ''),
          availableStyles: [],
          availableShotSizes: SHOT_SIZES,
          availableModels: availableModels, // AICODE-NOTE: Use dynamic models
          availableFrameRates: VIDEO_FRAME_RATES,
        },
        timestamp: Date.now(),
        message: isCompleted 
          ? `Updated video generation completed via ${result.method}! (${resolution.label}, ${duration}s)`
          : `Updated video generation started with economical settings (${resolution.label}, ${duration}s), connecting to SSE...`
      });

    } catch (error: any) {
      console.error('Video update error:', error);

      // Return error content as string
      draftContent = JSON.stringify({
        status: 'failed',
        error: error?.message || 'Failed to update video parameters'
      });
    }

    return draftContent;
  },
}); 