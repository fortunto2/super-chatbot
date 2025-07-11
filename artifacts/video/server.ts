import { createDocumentHandler } from '@/lib/artifacts/server';
import { generateVideoWithStrategy } from '@/lib/ai/api/video-generation';
import { getStyles } from '@/lib/ai/api/get-styles';
import type { MediaOption } from '@/lib/types/media-settings';
import type { VideoModel } from '@/lib/config/superduperai';
import { getAvailableVideoModels } from '@/lib/config/superduperai';
import { SHOT_SIZES, VIDEO_FRAME_RATES, DEFAULT_VIDEO_RESOLUTION, DEFAULT_VIDEO_DURATION, getModelCompatibleResolutions, DEFAULT_VIDEO_PARAMS } from '@/lib/config/video-constants';
import { GenerationSourceEnum, GenerationTypeEnum } from '@/lib/api';

function convertToVideoModel(sdModel: VideoModel): VideoModel {
  return sdModel;
}

export const videoDocumentHandler = createDocumentHandler<'video'>({
  kind: 'video',
  onCreateDocument: async ({ id: chatId, title, dataStream }) => {
    let draftContent = '';
    try {
      // Parse the title to extract video generation parameters
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
        negativePrompt = DEFAULT_VIDEO_PARAMS.negativePrompt,
        style = DEFAULT_VIDEO_PARAMS.style,
        resolution = DEFAULT_VIDEO_PARAMS.resolution,
        model = DEFAULT_VIDEO_PARAMS.model,
        shotSize = DEFAULT_VIDEO_PARAMS.shotSize,
        frameRate = DEFAULT_VIDEO_PARAMS.frameRate,
        duration = DEFAULT_VIDEO_PARAMS.duration,
        seed = DEFAULT_VIDEO_PARAMS.seed
      } = params;

      // Load dynamic models from SuperDuperAI API
      let availableModels: VideoModel[] = [];
      try {
        const superDuperModels = await getAvailableVideoModels();
        availableModels = superDuperModels.map(convertToVideoModel);
      } catch (error) {
        console.error('Failed to load dynamic video models:', error);
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

      // Start video generation using new architecture (only text-to-video)
      const result = await generateVideoWithStrategy('text-to-video', {
        prompt,
        model,
        style,
        resolution,
        shotSize,
        frameRate,
        duration,
        negativePrompt,
        seed
      });

      console.log("result", result);

      if (!result.success) {
        draftContent = JSON.stringify({
          status: 'failed',
          error: result.error,
          prompt: prompt
        });
        return draftContent;
      }

      // Формируем content с project info и доступными опциями для UI
      draftContent = JSON.stringify({
        status: 'pending',
        projectId: result.projectId || chatId,
        requestId: result.requestId,
        fileId: result.fileId,
        prompt: prompt,
        settings: {
          style,
          resolution,
          model,
          shotSize,
          frameRate,
          duration,
          availableResolutions: getModelCompatibleResolutions(model.name || model.id || ''),
          availableStyles,
          availableShotSizes: SHOT_SIZES,
          availableModels: availableModels,
          availableFrameRates: VIDEO_FRAME_RATES,
        },
        timestamp: Date.now(),
        message: result.message || 'Video generation started, connecting to WebSocket...'
      });
    } catch (error: any) {
      console.error('🎬 ❌ VIDEO GENERATION ERROR:', error);
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
      // Check if document already has completed content - don't recreate if so
      if (draftContent) {
        try {
          const existingContent = JSON.parse(draftContent);
          if (existingContent.status === 'completed' && existingContent.videoUrl) {
            console.log('🎬 ⚠️ Document already completed with video, skipping update to prevent reset');
            return draftContent;
          }
        } catch (parseError) {
          console.log('🎬 ℹ️ Could not parse existing content, proceeding with update');
        }
      }
      const chatId = document.id;
      const params = JSON.parse(description);
      const {
        prompt,
        negativePrompt = DEFAULT_VIDEO_PARAMS.negativePrompt,
        style = DEFAULT_VIDEO_PARAMS.style,
        resolution = DEFAULT_VIDEO_PARAMS.resolution,
        model = DEFAULT_VIDEO_PARAMS.model,
        shotSize = DEFAULT_VIDEO_PARAMS.shotSize,
        frameRate = DEFAULT_VIDEO_PARAMS.frameRate,
        duration = DEFAULT_VIDEO_PARAMS.duration,
        seed = DEFAULT_VIDEO_PARAMS.seed
      } = params;
      const result = await generateVideoWithStrategy(DEFAULT_VIDEO_PARAMS.generationType, {
        prompt,
        model,
        style,
        resolution,
        shotSize,
        frameRate,
        duration,
        negativePrompt,
        seed
      });
      if (!result.success) {
        draftContent = JSON.stringify({
          status: 'failed',
          error: result.error,
          prompt: prompt
        });
        return draftContent;
      }
      draftContent = JSON.stringify({
        status: 'pending',
        projectId: result.projectId || chatId,
        requestId: result.requestId,
        fileId: result.fileId,
        prompt: prompt,
        settings: {
          style,
          resolution,
          model,
          shotSize,
          frameRate,
          duration,
          availableResolutions: getModelCompatibleResolutions(model.name || model.id || ''),
          availableStyles: [],
          availableShotSizes: SHOT_SIZES,
          availableModels: [],
          availableFrameRates: VIDEO_FRAME_RATES,
        },
        timestamp: Date.now(),
        message: result.message || 'Video generation started, connecting to WebSocket...'
      });
    } catch (error: any) {
      console.error('🎬 ❌ VIDEO GENERATION ERROR:', error);
      draftContent = JSON.stringify({
        status: 'failed',
        error: error?.message || 'Failed to update video parameters'
      });
    }
    return draftContent;
  },
}); 

