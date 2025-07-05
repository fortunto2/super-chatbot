import { tool } from 'ai';
import { z } from 'zod';
import type { 
  MediaOption, 
} from '@/lib/types/media-settings';
import { getImageGenerationConfig } from '@/lib/config/media-settings-factory';

interface CreateImageDocumentParams {
  createDocument: any;
}

export const configureImageGeneration = (params?: CreateImageDocumentParams) => tool({
  description: 'Configure image generation settings or generate an image directly if prompt is provided. When prompt is provided, this will create an image artifact that shows generation progress in real-time. Models are loaded dynamically from SuperDuperAI API.',
  parameters: z.object({
    prompt: z.string().optional().describe('Detailed description of the image to generate. If provided, will immediately create image artifact and start generation'),
    style: z.string().optional().describe('Style of the image. Supports many formats: "realistic", "cinematic", "anime", "cartoon", "sketch", "painting", "steampunk", "fantasy", "sci-fi", "horror", "minimalist", "abstract", "portrait", "landscape", and many more available styles'),
    resolution: z.string().optional().describe('Image resolution. Accepts various formats: "1920x1080", "1920×1080", "1920 x 1080", "full hd", "fhd", "1080p", "square", "vertical", "horizontal", etc.'),
    shotSize: z.string().optional().describe('Shot size/camera angle. Accepts: "close-up", "medium-shot", "long-shot", "extreme-close-up", "portrait", "two-shot", etc.'),
    model: z.string().optional().describe('AI model to use. Models are loaded dynamically from SuperDuperAI API. Use model name like "FLUX" or full model ID.'),
    seed: z.number().optional().describe('Seed for reproducible results'),
    batchSize: z.number().min(1).max(3).optional().describe('Number of images to generate simultaneously (1-3). Higher batch sizes generate multiple variations at once.'),
  }),
  execute: async ({ prompt, style, resolution, shotSize, model, seed, batchSize }) => {
    console.log('🔧 configureImageGeneration called with:', { prompt, style, resolution, shotSize, model, seed, batchSize });
    
    // AICODE-NOTE: Use new factory to get configuration with OpenAPI models
    console.log('🖼️ Loading image configuration from OpenAPI factory...');
    const config = await getImageGenerationConfig();
    
    console.log('🖼️ ✅ Loaded image config:', {
      modelsCount: config.availableModels.length,
      resolutionsCount: config.availableResolutions.length,
      stylesCount: config.availableStyles.length
    });

    // If no prompt provided, return configuration panel
    if (!prompt) {
      console.log('🔧 No prompt provided, returning image configuration panel');
      return config;
    }

    console.log('🔧 ✅ PROMPT PROVIDED, CREATING IMAGE DOCUMENT:', prompt);

    if (!params?.createDocument) {
      console.log('🔧 ❌ createDocument not available, returning basic config');
      return config;
    }

    try {
      // Find the selected options or use defaults from factory
      const selectedResolution = resolution ? 
        config.availableResolutions.find(r => r.label === resolution) || config.defaultSettings.resolution : 
        config.defaultSettings.resolution;
      
      let selectedStyle: MediaOption = config.defaultSettings.style;
      if (style) {
        const foundStyle = findStyle(style, config.availableStyles);
        if (foundStyle) {
          selectedStyle = foundStyle;
          console.log('🔧 ✅ STYLE MATCHED:', style, '->', selectedStyle.label);
        } else {
          console.log('🔧 ⚠️ STYLE NOT FOUND:', style, 'using default:', selectedStyle.label);
        }
      }
      
      const selectedShotSize = shotSize ? 
        config.availableShotSizes.find(s => s.label === shotSize || s.id === shotSize) || config.defaultSettings.shotSize : 
        config.defaultSettings.shotSize;
      
      const selectedModel = model ? 
        config.availableModels.find(m => m.name === model || (m as any).id === model) || config.defaultSettings.model : 
        config.defaultSettings.model;

      // Create the image document with all parameters
      const imageParams = {
        prompt,
        style: selectedStyle,
        resolution: selectedResolution,
        shotSize: selectedShotSize,
        model: selectedModel,
        seed: seed || undefined,
        batchSize: batchSize || 1
      };

      console.log('🔧 ✅ CREATING IMAGE DOCUMENT WITH PARAMS:', imageParams);

      try {
        // AICODE-NOTE: For now we pass params as JSON in title for backward compatibility
        // TODO: Refactor to use proper parameter passing mechanism
        const result = await params.createDocument.execute({
          title: JSON.stringify(imageParams),
          kind: 'image'
        });
        
        console.log('🔧 ✅ CREATE DOCUMENT RESULT:', result);
        
        return {
          ...result,
          message: `I'm creating an image with description: "${prompt}". Using model "${selectedModel.name}" with ${selectedResolution.label} resolution. Artifact created and generation started.`
        };
      } catch (error) {
        console.error('🔧 ❌ CREATE DOCUMENT ERROR:', error);
        throw error;
      }

    } catch (error: any) {
      console.error('🔧 ❌ ERROR CREATING IMAGE DOCUMENT:', error);
      return {
        error: `Failed to create image document: ${error.message}`,
        fallbackConfig: config
      };
    }
  },
});

// Helper function to find style (kept for backward compatibility)
export function findStyle(styleName: string, availableStyles: MediaOption[]): MediaOption | null {
  const normalizedStyleName = styleName.toLowerCase().trim();
  
  // Direct match by label or id
  let foundStyle = availableStyles.find(style => 
    style.label.toLowerCase() === normalizedStyleName ||
    style.id.toLowerCase() === normalizedStyleName
  );
  
  if (foundStyle) return foundStyle;
  
  // Partial match
  foundStyle = availableStyles.find(style => 
    style.label.toLowerCase().includes(normalizedStyleName) ||
    style.id.toLowerCase().includes(normalizedStyleName) ||
    normalizedStyleName.includes(style.label.toLowerCase()) ||
    normalizedStyleName.includes(style.id.toLowerCase())
  );
  
  return foundStyle || null;
} 