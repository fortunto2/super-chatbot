import { tool } from 'ai';
import { z } from 'zod';
import type { 
  MediaResolution, 
  MediaOption, 
  VideoGenerationConfig,
  VideoModel 
} from '@/lib/types/media-settings';
import { getStyles } from '../api/get-styles';
import { findStyle } from './configure-image-generation';
import { getAvailableVideoModels } from '@/lib/config/superduperai';
import { VIDEO_RESOLUTIONS, SHOT_SIZES, VIDEO_FRAME_RATES, ShotSizeEnum, DEFAULT_VIDEO_RESOLUTION, DEFAULT_VIDEO_QUALITY, DEFAULT_VIDEO_DURATION } from '@/lib/config/video-constants';

// AICODE-NOTE: Convert SuperDuperAI VideoModel to VideoModel for compatibility
function convertToVideoModel(sdModel: any): VideoModel {
  return {
    id: sdModel.id,
    label: sdModel.name || sdModel.id,
    description: sdModel.description || `Video generation model - $${sdModel.pricePerSecond}/sec`,
  };
}

interface CreateVideoDocumentParams {
  createDocument: any;
}

export const configureVideoGeneration = (params?: CreateVideoDocumentParams) => tool({
  description: 'Configure video generation settings or generate a video directly if prompt is provided. When prompt is provided, this will create a video artifact that shows generation progress in real-time. Available models are loaded dynamically from SuperDuperAI API.',
  parameters: z.object({
    prompt: z.string().optional().describe('Detailed description of the video to generate. If provided, will immediately create video artifact and start generation'),
    negativePrompt: z.string().optional().describe('What to avoid in the video generation'),
    style: z.string().optional().describe('Style of the video'),
    resolution: z.string().optional().describe('Video resolution (e.g., "1344x768", "1024x1024"). Default is HD 1344x768 for cost efficiency.'),
    shotSize: z.string().optional().describe('Shot size for the video (extreme-long-shot, long-shot, medium-shot, medium-close-up, close-up, extreme-close-up, two-shot, detail-shot)'),
    model: z.string().optional().describe('AI model to use. Models are loaded dynamically from SuperDuperAI API. Use model name like "LTX" or full model ID. For image-to-video models (VEO, KLING), a source image is required.'),
    frameRate: z.number().optional().describe('Frame rate in FPS (24, 30, 60, 120)'),
    duration: z.number().optional().describe('Video duration in seconds. Default is 5 seconds for cost efficiency.'),
    sourceImageId: z.string().optional().describe('ID of source image for image-to-video models (VEO, KLING). Required for image-to-video generation.'),
    sourceImageUrl: z.string().optional().describe('URL of source image for image-to-video models. Alternative to sourceImageId.'),
  }),
  execute: async ({ prompt, negativePrompt, style, resolution, shotSize, model, frameRate, duration, sourceImageId, sourceImageUrl }) => {
    console.log('🔧 configureVideoGeneration called with:', { prompt, negativePrompt, style, resolution, shotSize, model, frameRate, duration });
    console.log('🔧 createDocument available:', !!params?.createDocument);
    
    // AICODE-NOTE: Use economical defaults
    const defaultResolution = DEFAULT_VIDEO_RESOLUTION;
    const defaultStyle: MediaOption = {id: "flux_steampunk", label: "Steampunk", description: "Steampunk style"};
    const defaultShotSize = SHOT_SIZES.find(s => s.id === 'long-shot')!;
    
    // AICODE-NOTE: Load models from our new dynamic system
    console.log('🎬 Loading video models from SuperDuperAI API...');
    const superDuperModels = await getAvailableVideoModels();
    const availableModels = superDuperModels.map(convertToVideoModel);
    
    console.log('🎬 ✅ Loaded video models:', availableModels.map(m => m.id));
    
    const defaultModel = availableModels[0] || {
      id: 'comfyui/ltx',
      label: 'LTX Video',
      description: 'LTX Video - High quality video generation'
    };

    let styles: MediaOption[] = [];

    try {
      const response = await getStyles();
      if ("error" in response) {
        console.error(response.error);
      } else {
        styles = response.items.map(style => ({
              id: style.name,
              label: style.title ?? style.name,
              description: style.title ?? style.name,
        }));
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
        availableModels: availableModels,
        availableFrameRates: VIDEO_FRAME_RATES,
        defaultSettings: {
          resolution: defaultResolution,
          style: defaultStyle,
          shotSize: defaultShotSize,
          model: defaultModel,
          frameRate: 30,
          duration: DEFAULT_VIDEO_DURATION, // 5 seconds for economy
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
        availableModels: availableModels,
        availableFrameRates: VIDEO_FRAME_RATES,
        defaultSettings: {
          resolution: defaultResolution,
          style: defaultStyle,
          shotSize: defaultShotSize,
          model: defaultModel,
          frameRate: frameRate || 30,
          duration: duration || DEFAULT_VIDEO_DURATION,
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
      
      let selectedStyle: MediaOption = defaultStyle;
      if (style) {
        const foundStyle = findStyle(style, styles);
        if (foundStyle) {
          selectedStyle = foundStyle;
          console.log('🔧 ✅ STYLE MATCHED:', style, '->', selectedStyle.label);
        } else {
          console.log('🔧 ⚠️ STYLE NOT FOUND:', style, 'using default:', defaultStyle.label);
          console.log('🔧 📋 Available styles:', styles.map(s => s.label).slice(0, 5).join(', '), '...');
          
          // Additional fallback: try to find the most common style types
          const commonStyleFallbacks = [
            'flux_steampunk', 'steampunk', 'flux_realistic', 'realistic', 
            'flux_cinematic', 'cinematic', 'flux_anime', 'anime',
            'flux_fantasy', 'fantasy', 'default'
          ];
          
          for (const fallbackId of commonStyleFallbacks) {
            const fallbackStyle = styles.find(s => 
              s.id.toLowerCase().includes(fallbackId.toLowerCase()) ||
              s.label.toLowerCase().includes(fallbackId.toLowerCase())
            );
            if (fallbackStyle) {
              selectedStyle = fallbackStyle;
              console.log('🔧 🔄 FALLBACK STYLE FOUND:', fallbackId, '->', selectedStyle.label);
              break;
            }
          }
          
          // If still no style found, use the first available one
          if (selectedStyle === defaultStyle && styles.length > 0) {
            selectedStyle = styles[0];
            console.log('🔧 🔄 USING FIRST AVAILABLE STYLE:', selectedStyle.label);
          }
        }
      } else {
        // No style specified, try to find a good default from available styles
        const preferredDefaults = ['flux_steampunk', 'steampunk', 'flux_realistic', 'realistic'];
        for (const preferredId of preferredDefaults) {
          const preferredStyle = styles.find(s => 
            s.id.toLowerCase().includes(preferredId.toLowerCase()) ||
            s.label.toLowerCase().includes(preferredId.toLowerCase())
          );
          if (preferredStyle) {
            selectedStyle = preferredStyle;
            console.log('🔧 🎯 USING PREFERRED DEFAULT STYLE:', selectedStyle.label);
            break;
          }
        }
        
        // If no preferred default found, use first available
        if (selectedStyle === defaultStyle && styles.length > 0) {
          selectedStyle = styles[0];
          console.log('🔧 🎯 USING FIRST AVAILABLE AS DEFAULT:', selectedStyle.label);
        }
      }
      
      const selectedShotSize = shotSize ? 
        SHOT_SIZES.find(s => s.label === shotSize || s.id === shotSize) || defaultShotSize : 
        defaultShotSize;
      
      const selectedModel = model ? 
        availableModels.find(m => m.label === model || m.id === model || (m as any).apiName === model) || defaultModel : 
        defaultModel;

      // AICODE-NOTE: Check if selected model is image-to-video and requires source image
      const isImageToVideoModel = selectedModel.id.includes('veo') || 
                                 selectedModel.id.includes('kling') ||
                                 selectedModel.id.includes('image-to-video') ||
                                 selectedModel.id.includes('img2vid');
      
      // AICODE-NOTE: Validate source image for image-to-video models
      if (isImageToVideoModel && !sourceImageId && !sourceImageUrl) {
        return {
          error: `The selected model "${selectedModel.label}" is an image-to-video model and requires a source image. Please provide either sourceImageId or sourceImageUrl parameter, or select a text-to-video model like LTX instead.`,
          suggestion: "You can use a recently generated image from this chat as the source, or upload a new image first.",
          availableTextToVideoModels: availableModels.filter(m => 
            !m.id.includes('veo') && 
            !m.id.includes('kling') && 
            !m.id.includes('image-to-video')
          ).map(m => `${m.label} (${m.id})`)
        };
      }

      // Create the video document with all parameters
      const videoParams = {
        prompt,
        negativePrompt: negativePrompt || "",
        style: selectedStyle,
        resolution: selectedResolution,
        shotSize: selectedShotSize,
        model: selectedModel,
        frameRate: frameRate || 30,
        duration: duration || DEFAULT_VIDEO_DURATION, // Use economical default
        sourceImageId: sourceImageId || undefined,
        sourceImageUrl: sourceImageUrl || undefined
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
            message: `I'm creating a video with description: "${prompt}". Using economical HD settings (${selectedResolution.label}, ${duration || DEFAULT_VIDEO_DURATION}s) for cost efficiency. Artifact created and generation started.`
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
          availableModels: availableModels,
          availableFrameRates: VIDEO_FRAME_RATES,
          defaultSettings: {
            resolution: defaultResolution,
            style: defaultStyle,
            shotSize: defaultShotSize,
            model: defaultModel,
            frameRate: frameRate || 30,
            duration: duration || DEFAULT_VIDEO_DURATION,
            negativePrompt: negativePrompt || "",
            seed: undefined
          }
        }
      };
    }
  },
}); 