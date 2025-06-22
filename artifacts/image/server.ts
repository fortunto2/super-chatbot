import { createDocumentHandler } from '@/lib/artifacts/server';
import { generateImage } from '@/lib/ai/api/generate-image';
import { getStyles } from '@/lib/ai/api/get-styles';
import type { MediaOption, MediaResolution } from '@/lib/types/media-settings';
import type { ImageModel } from '@/lib/config/superduperai';
import { getAvailableImageModels } from '@/lib/config/superduperai';

// Import the same constants as in configure-image-generation
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

const SHOT_SIZES: MediaOption[] = [
  { id: 'extreme_long_shot', label: 'Extreme Long Shot', description: 'Shows vast landscapes or cityscapes with tiny subjects' },
  { id: 'long_shot', label: 'Long Shot', description: 'Shows full body of subject with surrounding environment' },
  { id: 'medium_shot', label: 'Medium Shot', description: 'Shows subject from waist up, good for conversations' },
  { id: 'medium_close_up', label: 'Medium Close-Up', description: 'Shows subject from chest up, good for portraits' },
  { id: 'close_up', label: 'Close-Up', description: 'Shows a subject\'s face or a small object in detail' },
  { id: 'extreme_close_up', label: 'Extreme Close-Up', description: 'Shows extreme detail of a subject, like eyes or small objects' },
  { id: 'two_shot', label: 'Two-Shot', description: 'Shows two subjects in frame, good for interactions' },
  { id: 'detail_shot', label: 'Detail Shot', description: 'Focuses on a specific object or part of a subject' },
];

// AICODE-NOTE: IMAGE_MODELS now loaded dynamically from API via getAvailableImageModels()

export const imageDocumentHandler = createDocumentHandler<'image'>({
  kind: 'image',
  onCreateDocument: async ({ id: chatId, title, dataStream }) => {
    
    let draftContent = '';

    try {
      // Parse the title to extract image generation parameters
      const params = JSON.parse(title);
     
      
      const {
        prompt,
        style = { id: 'flux_steampunk', label: 'Steampunk' },
        resolution = { width: 1024, height: 1024, label: '1024x1024', aspectRatio: '1:1', qualityType: 'hd' },
        model = { id: 'flux-dev', label: 'Flux Dev' },
        shotSize = { id: 'long_shot', label: 'Long Shot' }
      } = params;

     

      // AICODE-NOTE: Load dynamic models from SuperDuperAI API
      let availableModels: ImageModel[] = [];
      try {
        availableModels = await getAvailableImageModels();
        console.log('🎨 ✅ Loaded dynamic image models:', availableModels.map(m => `${m.label || m.name} (${m.name})`));
      } catch (error) {
        console.error('🎨 ❌ Failed to load dynamic models:', error);
        // Will use fallback models from getAvailableImageModels()
        availableModels = await getAvailableImageModels();
      }

      // Get available styles from API
      let availableStyles: MediaOption[] = [];
      try {
        const response = await getStyles();
        if ("error" in response) {
          console.error('🎨 ❌ FAILED TO GET STYLES:', response.error);
        } else {
          availableStyles = response.items.map(style => ({
            id: style.name,
            label: style.title ?? style.name,
          }));
        }
      } catch (err) {
        console.error('🎨 ❌ ERROR GETTING STYLES:', err);
      }

      
      // Start image generation
      const result = await generateImage(prompt, model, resolution, style, shotSize, chatId);

    
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
        settings: {
          style,
          resolution,
          model,
          shotSize,
          // Include available options for the UI
          availableResolutions: RESOLUTIONS,
          availableStyles,
          availableShotSizes: SHOT_SIZES,
          availableModels: availableModels,
        },
        timestamp: Date.now(),
        message: 'Image generation started, connecting to WebSocket...'
      });

     

    } catch (error: any) {
      console.error('🎨 ❌ IMAGE GENERATION ERROR:', error);
      console.error('🎨 ❌ ERROR MESSAGE:', error?.message);
      console.error('🎨 ❌ ERROR STACK:', error?.stack);

      draftContent = JSON.stringify({
        status: 'failed',
        error: error?.message || 'Failed to parse image parameters'
      });
    }

    return draftContent;
  },
  
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = document.content;

    try {
      // Extract chatId from document.id (which should be the chat ID)
      const chatId = document.id;
      
      // Parse the description to extract new image generation parameters
      const params = JSON.parse(description);
      const {
        prompt,
        style = { id: 'flux_steampunk', label: 'Steampunk' },
        resolution = { width: 1024, height: 1024, label: '1024x1024', aspectRatio: '1:1', qualityType: 'hd' },
        model = { id: 'flux-dev', label: 'Flux Dev' },
        shotSize = { id: 'long_shot', label: 'Long Shot' }
      } = params;

      // AICODE-NOTE: Load dynamic models for update as well
      let availableModels: ImageModel[] = [];
      try {
        availableModels = await getAvailableImageModels();
      } catch (error) {
        console.error('🎨 ❌ Failed to load dynamic models for update:', error);
        availableModels = await getAvailableImageModels();
      }

      // Start new image generation
      const result = await generateImage(prompt, model, resolution, style, shotSize, chatId);

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
        settings: {
          style,
          resolution,
          model,
          shotSize,
          availableResolutions: RESOLUTIONS,
          availableStyles: [],
          availableShotSizes: SHOT_SIZES,
          availableModels: availableModels,
        },
        timestamp: Date.now(),
        message: 'Updated image generation started, connecting to WebSocket...'
      });

    } catch (error: any) {
      console.error('Image update error:', error);

      // Return error content as string
      draftContent = JSON.stringify({
        status: 'failed',
        error: error?.message || 'Failed to update image parameters'
      });
    }

    return draftContent;
  },
});
