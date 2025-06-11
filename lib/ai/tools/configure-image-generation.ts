import { tool } from 'ai';
import { z } from 'zod';
import type { 
  MediaResolution, 
  MediaOption, 
  ImageGenerationConfig,
  ImageModel 
} from '@/lib/types/media-settings';
import { getStyles } from '../api/get-styles';

const RESOLUTIONS: MediaResolution[] = [
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

// const STYLES: MediaOption[] = [
//   { id: 'natural', label: 'Natural', description: 'Realistic and natural looking images' },
//   { id: 'vivid', label: 'Vivid', description: 'Vibrant and colorful images' },
//   { id: 'cinematic', label: 'Cinematic', description: 'Movie-like quality images' },
//   { id: 'anime', label: 'Anime', description: 'Anime and manga style images' },
//   { id: 'cartoon', label: 'Cartoon', description: 'Cartoon style images' },
//   { id: 'sketch', label: 'Sketch', description: 'Hand-drawn sketch style' },
//   { id: 'painting', label: 'Painting', description: 'Oil painting style' },
//   { id: 'pixel-art', label: 'Pixel Art', description: 'Retro pixel art style' },
// ];

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

const IMAGE_MODELS: ImageModel[] = [
  { id: 'flux-dev', label: 'Flux Dev', description: 'Previous generation flux model' },
  { id: 'flux-pro', label: 'Flux Pro Ultra 1.1', description: 'Latest flux model with high quality and creativity' },
];

interface CreateImageDocumentParams {
  createDocument: any;
}

export const configureImageGeneration = (params?: CreateImageDocumentParams) => tool({
  description: 'Configure image generation settings or generate an image directly if prompt is provided. When prompt is provided, this will create an image artifact that shows generation progress in real-time.',
  parameters: z.object({
    prompt: z.string().optional().describe('Detailed description of the image to generate. If provided, will immediately create image artifact and start generation'),
    style: z.string().optional().describe('Style of the image (natural, vivid, cinematic, anime, cartoon, sketch, painting, pixel-art)'),
    resolution: z.string().optional().describe('Image resolution (e.g., "1024x1024", "1920x1080")'),
    shotSize: z.string().optional().describe('Shot size for the image (extreme-long-shot, long-shot, medium-shot, medium-close-up, close-up, extreme-close-up, two-shot, detail-shot)'),
    model: z.string().optional().describe('AI model to use (flux-dev, flux-pro)'),
  }),
  execute: async ({ prompt, style, resolution, shotSize, model }) => {
    console.log('🔧 configureImageGeneration called with:', { prompt, style, resolution, shotSize, model });
    console.log('🔧 createDocument available:', !!params?.createDocument);
    
    const defaultResolution = RESOLUTIONS.find(r => r.width === 1024 && r.height === 1024)!;
    const defaultStyle = {id: "flux_steampunk", label: "Steampunk", description: ""};
    const defaultShotSize = SHOT_SIZES.find(s => s.id === 'long-shot')!;
    const defaultModel = IMAGE_MODELS.find(m => m.id === 'flux-dev')!;

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
      console.log('🔧 No prompt provided, returning configuration panel');
      const config: ImageGenerationConfig = {
        type: 'image-generation-settings',
        availableResolutions: RESOLUTIONS,
        availableStyles: styles,
        availableShotSizes: SHOT_SIZES,
        availableModels: IMAGE_MODELS,
        defaultSettings: {
          resolution: defaultResolution,
          style: defaultStyle,
          shotSize: defaultShotSize,
          model: defaultModel,
          seed: undefined
        }
      };
      return config;
    }

    console.log('🔧 ✅ PROMPT PROVIDED, CREATING IMAGE DOCUMENT:', prompt);
    console.log('🔧 ✅ PARAMS OBJECT:', !!params);
    console.log('🔧 ✅ CREATE DOCUMENT AVAILABLE:', !!params?.createDocument);

    // If prompt provided, create document directly
    const selectedResolution = resolution 
      ? RESOLUTIONS.find(r => r.label === resolution) || defaultResolution
      : defaultResolution;
    
    const selectedStyle = style 
      ? styles.find(s => s.label === style) || defaultStyle
      : defaultStyle;
    
    const selectedShotSize = shotSize 
      ? SHOT_SIZES.find(s => s.id === shotSize) || defaultShotSize
      : defaultShotSize;
    
    const selectedModel = model 
      ? IMAGE_MODELS.find(m => m.id === model) || defaultModel
      : defaultModel;

    // Create title with all parameters for the document
    const artifactParams = JSON.stringify({
      prompt,
      style: selectedStyle,
      resolution: selectedResolution,
      shotSize: selectedShotSize,
      model: selectedModel,
    });

    // Create a human-readable title instead of JSON
    const humanReadableTitle = `AI Image: ${prompt.substring(0, 60)}${prompt.length > 60 ? '...' : ''}`;

    console.log('🔧 ✅ ARTIFACT PARAMS PREPARED:', artifactParams.substring(0, 100) + '...');

    if (params?.createDocument) {
      console.log('🔧 ✅ CALLING CREATE DOCUMENT WITH KIND: image');
      try {
        // Call createDocument if available - передаем параметры через content поле
        const result = await params.createDocument.execute({
          title: artifactParams, // Возвращаем JSON для сервера
          kind: 'image'
        });
        
        console.log('🔧 ✅ CREATE DOCUMENT RESULT:', result);
        
        return {
          ...result,
          message: `Я создаю изображение с описанием: "${prompt}". Артефакт создан и генерация началась.`
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
      message: `Я создам изображение с описанием: "${prompt}". Однако артефакт не может быть создан - createDocument недоступен.`,
      parameters: {
        title: artifactParams, // Возвращаем JSON для сервера
        kind: 'image'
      }
    };
  },
});
