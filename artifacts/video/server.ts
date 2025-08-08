import { createDocumentHandler } from '@/lib/artifacts/server';
import { generateVideoWithStrategy } from '@/lib/ai/api/video-generation';
import { getStyles } from '@/lib/ai/api/get-styles';
import type { MediaOption } from '@/lib/types/media-settings';
import type { VideoModel } from '@/lib/config/superduperai';
import { getAvailableVideoModels } from '@/lib/config/superduperai';
import { SHOT_SIZES, VIDEO_FRAME_RATES, DEFAULT_VIDEO_RESOLUTION, DEFAULT_VIDEO_DURATION, getModelCompatibleResolutions } from '@/lib/config/video-constants';
import { GenerationSourceEnum, GenerationTypeEnum } from '@/lib/api';
import { validateOperationBalance, deductOperationBalance } from '@/lib/utils/tools-balance';

function convertToVideoModel(sdModel: VideoModel): VideoModel {
  return sdModel;
}

export const videoDocumentHandler = createDocumentHandler<'video'>({
  kind: 'video',
  onCreateDocument: async ({ id: chatId, title, dataStream, session }) => {
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
        negativePrompt = "",
        style = { id: 'flux_steampunk', label: 'Steampunk' },
        resolution = DEFAULT_VIDEO_RESOLUTION,
        model = { id: 'comfyui/ltx', label: 'LTX Video' },
        shotSize = { id: 'long-shot', label: 'Long Shot' },
        frameRate = 30,
        duration = DEFAULT_VIDEO_DURATION,
        seed,
        sourceImageId,
        sourceImageUrl,
        generationType = 'text-to-video'
      } = params;

      // Check user balance before proceeding
      if (session?.user?.id) {
        console.log('💳 Checking balance for video generation in chat...');
        
        // Determine cost multipliers based on request
        const multipliers: string[] = [];
        
        // Duration multipliers
        if (duration <= 5) multipliers.push('duration-5s');
        else if (duration <= 10) multipliers.push('duration-10s');
        else if (duration <= 15) multipliers.push('duration-15s');
        else if (duration <= 30) multipliers.push('duration-30s');
        
        // Quality multipliers
        if (resolution?.label?.includes('4K') || resolution?.width >= 2160) {
          multipliers.push('4k-quality');
        } else {
          multipliers.push('hd-quality'); // HD is default
        }

        const operationType = generationType === 'image-to-video' ? 'image-to-video' : 'text-to-video';

        const balanceValidation = await validateOperationBalance(
          session.user.id,
          'video-generation',
          operationType,
          multipliers
        );

        if (!balanceValidation.valid) {
          console.error('💳 Insufficient balance for video generation');
          
          // Write error to datastream
          dataStream.writeData({
            type: 'error',
            content: `Insufficient balance: ${balanceValidation.error}. Required: ${balanceValidation.cost} credits.`
          });
          
          throw new Error(`Insufficient balance: ${balanceValidation.error}`);
        }

        console.log(`💳 Balance validated: ${balanceValidation.cost} credits will be deducted`);
      }

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
      }, session); // Pass session for user token

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

      // Deduct balance after successful generation start
      if (session?.user?.id) {
        try {
          // Determine cost multipliers based on request
          const multipliers: string[] = [];
          
          // Duration multipliers
          if (duration <= 5) multipliers.push('duration-5s');
          else if (duration <= 10) multipliers.push('duration-10s');
          else if (duration <= 15) multipliers.push('duration-15s');
          else if (duration <= 30) multipliers.push('duration-30s');
          
          // Quality multipliers
          if (resolution?.label?.includes('4K') || resolution?.width >= 2160) {
            multipliers.push('4k-quality');
          } else {
            multipliers.push('hd-quality'); // HD is default
          }

          const operationType = generationType === 'image-to-video' ? 'image-to-video' : 'text-to-video';

          await deductOperationBalance(
            session.user.id,
            'video-generation',
            operationType,
            multipliers,
            {
              projectId: result.projectId,
              fileId: result.fileId,
              prompt: prompt.substring(0, 100),
              operationType,
              duration,
              resolution: resolution?.label,
              timestamp: new Date().toISOString()
            }
          );
          console.log(`💳 Balance deducted for user ${session.user.id} after video generation start`);
        } catch (balanceError) {
          console.error('⚠️ Failed to deduct balance after video generation:', balanceError);
          // Continue - video generation already started
        }
      }
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
        negativePrompt = "",
        style = { id: 'flux_steampunk', label: 'Steampunk' },
        resolution = DEFAULT_VIDEO_RESOLUTION,
        model = { id: 'comfyui/ltx', label: 'LTX Video' },
        shotSize = { id: 'long-shot', label: 'Long Shot' },
        frameRate = 30,
        duration = DEFAULT_VIDEO_DURATION,
        seed
      } = params;
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
      }); // NOTE: onUpdateDocument doesn't have access to session, using system token fallback
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

