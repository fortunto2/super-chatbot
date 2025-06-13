import { tool } from 'ai';
import { z } from 'zod';
import type { 
  MediaResolution, 
  MediaOption, 
  VideoGenerationConfig,
  VideoModel 
} from '@/lib/types/media-settings';
import { getStyles } from '../api/get-styles';

const VIDEO_RESOLUTIONS: MediaResolution[] = [
  { width: 1344, height: 768, label: "1344x768", aspectRatio: "16:9", qualityType: "hd" },
  { width: 1920, height: 1080, label: "1920×1080", aspectRatio: "16:9", qualityType: "full_hd" },

  { width: 1664, height: 1216, label: "1664x1216", aspectRatio: "4:3", qualityType: "full_hd" },
  { width: 1152, height: 896, label: "1152x896", aspectRatio: "4:3", qualityType: "hd" },

  { width: 1024, height: 1024, label: "1024x1024", aspectRatio: "1:1", qualityType: "hd" },
  { width: 1408, height: 1408, label: "1408×1408", aspectRatio: "1:1", qualityType: "full_hd" },

  { width: 1408, height: 1760, label: "1408×1760", aspectRatio: "4:5", qualityType: "full_hd" },
  { width: 1024, height: 1280, label: "1024x1280", aspectRatio: "4:5", qualityType: "hd" },

  { width: 1080, height: 1920, label: "1080×1920", aspectRatio: "9:16", qualityType: "full_hd" },
  { width: 768, height: 1344, label: "768x1344", aspectRatio: "9:16", qualityType: "hd" },
];

export enum ShotSizeEnum {
  EXTREME_LONG_SHOT = 'Extreme Long Shot',
  LONG_SHOT = 'Long Shot',
  MEDIUM_SHOT = 'Medium Shot',
  MEDIUM_CLOSE_UP = 'Medium Close-Up',
  CLOSE_UP = 'Close-Up',
  EXTREME_CLOSE_UP = 'Extreme Close-Up',
  TWO_SHOT = 'Two-Shot',
  DETAIL_SHOT = 'Detail Shot',
}

const SHOT_SIZES: MediaOption[] = [
  {
    id: 'extreme-long-shot',
    label: ShotSizeEnum.EXTREME_LONG_SHOT,
    description: 'Shows vast landscapes or cityscapes with tiny subjects',
  },
  {
    id: 'long-shot',
    label: ShotSizeEnum.LONG_SHOT,
    description: 'Shows full body of subject with surrounding environment',
  },
  {
    id: 'medium-shot',
    label: ShotSizeEnum.MEDIUM_SHOT,
    description: 'Shows subject from waist up, good for conversations',
  },
  {
    id: 'medium-close-up',
    label: ShotSizeEnum.MEDIUM_CLOSE_UP,
    description: 'Shows subject from chest up, good for portraits',
  },
  {
    id: 'close-up',
    label: ShotSizeEnum.CLOSE_UP,
    description: 'Shows a subject\'s face or a small object in detail',
  },
  {
    id: 'extreme-close-up',
    label: ShotSizeEnum.EXTREME_CLOSE_UP,
    description: 'Shows extreme detail of a subject, like eyes or small objects',
  },
  {
    id: 'two-shot',
    label: ShotSizeEnum.TWO_SHOT,
    description: 'Shows two subjects in frame, good for interactions',
  },
  {
    id: 'detail-shot',
    label: ShotSizeEnum.DETAIL_SHOT,
    description: 'Focuses on a specific object or part of a subject',
  },
];

const VIDEO_FRAME_RATES = [
  { value: 24, label: "24 FPS (Cinematic)" },
  { value: 30, label: "30 FPS (Standard)" },
  { value: 60, label: "60 FPS (Smooth)" },
  { value: 120, label: "120 FPS (High Speed)" },
];

const VIDEO_MODELS: VideoModel[] = [
  { id: 'runway-gen3', label: 'Runway Gen-3', description: 'Advanced video generation model with high quality' },
  { id: 'runway-gen2', label: 'Runway Gen-2', description: 'Previous generation model with good quality' },
  { id: 'stable-video', label: 'Stable Video Diffusion', description: 'Stable video generation model' },
];

interface CreateVideoDocumentParams {
  createDocument: any;
}

export const configureVideoGeneration = (params?: CreateVideoDocumentParams) => tool({
  description: 'Configure video generation settings or generate a video directly if prompt is provided. When prompt is provided, this will create a video artifact that shows generation progress in real-time.',
  parameters: z.object({
    prompt: z.string().optional().describe('Detailed description of the video to generate. If provided, will immediately create video artifact and start generation'),
    negativePrompt: z.string().optional().describe('What to avoid in the video generation'),
    style: z.string().optional().describe('Style of the video'),
    resolution: z.string().optional().describe('Video resolution (e.g., "1920x1080", "1024x1024")'),
    shotSize: z.string().optional().describe('Shot size for the video (extreme-long-shot, long-shot, medium-shot, medium-close-up, close-up, extreme-close-up, two-shot, detail-shot)'),
    model: z.string().optional().describe('AI model to use (runway-gen3, runway-gen2, stable-video)'),
    frameRate: z.number().optional().describe('Frame rate in FPS (24, 30, 60, 120)'),
    duration: z.number().optional().describe('Video duration in seconds'),
  }),
  execute: async ({ prompt, negativePrompt, style, resolution, shotSize, model, frameRate, duration }) => {
    console.log('🔧 configureVideoGeneration called with:', { prompt, negativePrompt, style, resolution, shotSize, model, frameRate, duration });
    console.log('🔧 createDocument available:', !!params?.createDocument);
    
    const defaultResolution = VIDEO_RESOLUTIONS.find(r => r.width === 1920 && r.height === 1080)!;
    const defaultStyle = {id: "flux_steampunk", label: "Steampunk", description: ""};
    const defaultShotSize = SHOT_SIZES.find(s => s.id === 'long-shot')!;
    const defaultModel = VIDEO_MODELS.find(m => m.id === 'runway-gen3')!;

    let styles: MediaOption[] = [];

    try {
      const response = await getStyles();
      if ("error" in response) {
        console.error(response.error);
      } else {
        styles = response.items.map(style => {
          return {
              id: style.name,
              label: style.title ?? style.name,
          };
        });
      }
    } catch (err) {
      console.log(err);
    }
    
    // If no prompt provided, return configuration panel
    if (!prompt) {
      console.log('🔧 No prompt provided, returning video configuration panel');
      const config: VideoGenerationConfig = {
        type: 'video-generation-settings',
        availableResolutions: VIDEO_RESOLUTIONS,
        availableStyles: styles,
        availableShotSizes: SHOT_SIZES,
        availableModels: VIDEO_MODELS,
        availableFrameRates: VIDEO_FRAME_RATES,
        defaultSettings: {
          resolution: defaultResolution,
          style: defaultStyle,
          shotSize: defaultShotSize,
          model: defaultModel,
          frameRate: 30,
          duration: 10,
          negativePrompt: "",
          seed: undefined
        }
      };
      return config;
    }

    console.log('🔧 ✅ PROMPT PROVIDED, CREATING VIDEO DOCUMENT:', prompt);
    console.log('🔧 ✅ PARAMS OBJECT:', !!params);
    console.log('🔧 ✅ CREATE DOCUMENT AVAILABLE:', !!params?.createDocument);

    if (!params?.createDocument) {
      console.log('🔧 ❌ createDocument not available, returning basic config');
      const config: VideoGenerationConfig = {
        type: 'video-generation-settings',
        availableResolutions: VIDEO_RESOLUTIONS,
        availableStyles: styles,
        availableShotSizes: SHOT_SIZES,
        availableModels: VIDEO_MODELS,
        availableFrameRates: VIDEO_FRAME_RATES,
        defaultSettings: {
          resolution: defaultResolution,
          style: defaultStyle,
          shotSize: defaultShotSize,
          model: defaultModel,
          frameRate: frameRate || 30,
          duration: duration || 10,
          negativePrompt: negativePrompt || "",
          seed: undefined
        }
      };
      return config;
    }

    try {
      // Find the selected options or use defaults
      const selectedResolution = resolution ? 
        VIDEO_RESOLUTIONS.find(r => r.label === resolution) || defaultResolution : 
        defaultResolution;
      
      const selectedStyle = style ? 
        styles.find(s => s.label === style || s.id === style) || defaultStyle : 
        defaultStyle;
      
      const selectedShotSize = shotSize ? 
        SHOT_SIZES.find(s => s.label === shotSize || s.id === shotSize) || defaultShotSize : 
        defaultShotSize;
      
      const selectedModel = model ? 
        VIDEO_MODELS.find(m => m.label === model || m.id === model) || defaultModel : 
        defaultModel;

      // Create the video document with all parameters
      const videoParams = {
        prompt,
        negativePrompt: negativePrompt || "",
        style: selectedStyle,
        resolution: selectedResolution,
        shotSize: selectedShotSize,
        model: selectedModel,
        frameRate: frameRate || 30,
        duration: duration || 10
      };

      console.log('🔧 ✅ CREATING VIDEO DOCUMENT WITH PARAMS:', videoParams);

      if (params?.createDocument) {
        console.log('🔧 ✅ CALLING CREATE DOCUMENT WITH KIND: video');
        try {
          // Call createDocument if available - передаем параметры через title поле
          const result = await params.createDocument.execute({
            title: JSON.stringify(videoParams), // Возвращаем JSON для сервера
            kind: 'video'
          });
          
          console.log('🔧 ✅ CREATE DOCUMENT RESULT:', result);
          
          return {
            ...result,
            message: `I'm creating a video with description: "${prompt}". Artifact created and generation started.`
          };
        } catch (error) {
          console.error('🔧 ❌ CREATE DOCUMENT ERROR:', error);
          console.error('🔧 ❌ ERROR STACK:', error instanceof Error ? error.stack : 'No stack');
          throw error;
        }
      }

      console.log('🔧 ❌ CREATE DOCUMENT NOT AVAILABLE, RETURNING FALLBACK');
      // Fallback to simple message
      return {
        message: `I'll create a video with description: "${prompt}". However, artifact cannot be created - createDocument unavailable.`,
        parameters: {
          title: JSON.stringify(videoParams), // Возвращаем JSON для сервера
          kind: 'video'
        }
      };

    } catch (error: any) {
      console.error('🔧 ❌ ERROR CREATING VIDEO DOCUMENT:', error);
      return {
        error: `Failed to create video document: ${error.message}`,
        fallbackConfig: {
          type: 'video-generation-settings',
          availableResolutions: VIDEO_RESOLUTIONS,
          availableStyles: styles,
          availableShotSizes: SHOT_SIZES,
          availableModels: VIDEO_MODELS,
          availableFrameRates: VIDEO_FRAME_RATES,
          defaultSettings: {
            resolution: defaultResolution,
            style: defaultStyle,
            shotSize: defaultShotSize,
            model: defaultModel,
            frameRate: frameRate || 30,
            duration: duration || 10,
            negativePrompt: negativePrompt || "",
            seed: undefined
          }
        }
      };
    }
  },
}); 