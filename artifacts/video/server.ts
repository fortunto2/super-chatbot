import { createDocumentHandler } from '@/lib/artifacts/server';
import { generateVideo } from '@/lib/ai/api/generate-video';
import { getStyles } from '@/lib/ai/api/get-styles';
import { VideoModel, MediaOption, MediaResolution } from '@/lib/types/media-settings';
import { getAvailableVideoModels } from '@/lib/config/superduperai';
import { VIDEO_RESOLUTIONS, SHOT_SIZES, VIDEO_FRAME_RATES, DEFAULT_VIDEO_RESOLUTION, DEFAULT_VIDEO_DURATION } from '@/lib/config/video-constants';

// AICODE-NOTE: Convert SuperDuperAI VideoModel to VideoModel for compatibility
function convertToVideoModel(sdModel: any): VideoModel {
  return {
    id: sdModel.id,
    label: sdModel.name || sdModel.id,
    description: sdModel.description || `Video generation model - $${sdModel.pricePerSecond}/sec`,
  };
}

export const videoDocumentHandler = createDocumentHandler<'video'>({
  kind: 'video',
  onCreateDocument: async ({ id: chatId, title, dataStream }) => {
    
    let draftContent = '';

    try {
      // Parse the title to extract video generation parameters
      const params = JSON.parse(title);
     
      
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

      // AICODE-NOTE: Load dynamic models from SuperDuperAI API
      let availableModels: VideoModel[] = [];
      try {
        const superDuperModels = await getAvailableVideoModels();
        availableModels = superDuperModels.map(convertToVideoModel);
        console.log('🎬 ✅ Loaded dynamic video models:', availableModels.map(m => m.id));
      } catch (error) {
        console.error('🎬 ❌ Failed to load dynamic models:', error);
        // Fallback to default LTX model
        availableModels = [{
          id: 'comfyui/ltx',
          label: 'LTX Video',
          description: 'LTX Video - High quality video generation'
        }];
      }

      // Get available styles from API
      let availableStyles: MediaOption[] = [];
      try {
        const response = await getStyles();
        if ("error" in response) {
          console.error('🎬 ❌ FAILED TO GET STYLES:', response.error);
        } else {
          availableStyles = response.items.map(style => ({
            id: style.name,
            label: style.title ?? style.name,
          }));
        }
      } catch (err) {
        console.error('🎬 ❌ ERROR GETTING STYLES:', err);
      }

      
      // Start video generation
      const result = await generateVideo(
        style, 
        resolution, 
        prompt, 
        model, 
        shotSize, 
        chatId,
        negativePrompt,
        frameRate,
        duration,
        sourceImageId,
        sourceImageUrl
      );

    
      if (!result.success) {
       
        draftContent = JSON.stringify({
          status: 'failed',
          error: result.error,
          prompt: prompt
        });
        
        return draftContent;
      }

      // Create content with project info and available options for WebSocket tracking
      draftContent = JSON.stringify({
        status: 'pending',
        projectId: result.projectId || chatId,
        requestId: result.requestId,
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
          availableResolutions: VIDEO_RESOLUTIONS,
          availableStyles,
          availableShotSizes: SHOT_SIZES,
          availableModels: availableModels, // AICODE-NOTE: Use dynamic models
          availableFrameRates: VIDEO_FRAME_RATES,
        },
        timestamp: Date.now(),
        message: `Video generation started with economical settings (${resolution.label}, ${duration}s), connecting to WebSocket...`
      });

     

    } catch (error: any) {
      console.error('🎬 ❌ VIDEO GENERATION ERROR:', error);
      console.error('🎬 ❌ ERROR MESSAGE:', error?.message);
      console.error('🎬 ❌ ERROR STACK:', error?.stack);

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
        console.error('🎬 ❌ Failed to load dynamic models for update:', error);
        availableModels = [{
          id: 'comfyui/ltx',
          label: 'LTX Video',
          description: 'LTX Video - High quality video generation'
        }];
      }

      // Start new video generation
      const result = await generateVideo(
        style, 
        resolution, 
        prompt, 
        model, 
        shotSize, 
        chatId,
        negativePrompt,
        frameRate,
        duration,
        sourceImageId,
        sourceImageUrl
      );

      if (!result.success) {
        // Return error content as string
        return JSON.stringify({
          status: 'failed',
          error: result.error || 'Unknown error occurred',
          prompt: prompt
        });
      }

      // Update content with new project info
      draftContent = JSON.stringify({
        status: 'pending',
        projectId: result.projectId || chatId,
        requestId: result.requestId,
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
          availableResolutions: VIDEO_RESOLUTIONS,
          availableStyles: [],
          availableShotSizes: SHOT_SIZES,
          availableModels: availableModels, // AICODE-NOTE: Use dynamic models
          availableFrameRates: VIDEO_FRAME_RATES,
        },
        timestamp: Date.now(),
        message: `Updated video generation started with economical settings (${resolution.label}, ${duration}s), connecting to WebSocket...`
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