import { createDocumentHandler } from '@/lib/artifacts/server';
import { generateVideo } from '@/lib/ai/api/generate-video';
import { getStyles } from '@/lib/ai/api/get-styles';
import { VideoModel, MediaOption, MediaResolution } from '@/lib/types/media-settings';

// Import the same constants as in configure-video-generation
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

const SHOT_SIZES: MediaOption[] = [
  { id: 'extreme-long-shot', label: 'Extreme Long Shot', description: 'Shows vast landscapes or cityscapes with tiny subjects' },
  { id: 'long-shot', label: 'Long Shot', description: 'Shows full body of subject with surrounding environment' },
  { id: 'medium-shot', label: 'Medium Shot', description: 'Shows subject from waist up, good for conversations' },
  { id: 'medium-close-up', label: 'Medium Close-Up', description: 'Shows subject from chest up, good for portraits' },
  { id: 'close-up', label: 'Close-Up', description: 'Shows a subject\'s face or a small object in detail' },
  { id: 'extreme-close-up', label: 'Extreme Close-Up', description: 'Shows extreme detail of a subject, like eyes or small objects' },
  { id: 'two-shot', label: 'Two-Shot', description: 'Shows two subjects in frame, good for interactions' },
  { id: 'detail-shot', label: 'Detail Shot', description: 'Focuses on a specific object or part of a subject' },
];

const VIDEO_MODELS: VideoModel[] = [
  { id: 'runway-gen3', label: 'Runway Gen-3', description: 'Advanced video generation model with high quality' },
  { id: 'runway-gen2', label: 'Runway Gen-2', description: 'Previous generation model with good quality' },
  { id: 'stable-video', label: 'Stable Video Diffusion', description: 'Stable video generation model' },
];

const VIDEO_FRAME_RATES = [
  { value: 24, label: "24 FPS (Cinematic)" },
  { value: 30, label: "30 FPS (Standard)" },
  { value: 60, label: "60 FPS (Smooth)" },
  { value: 120, label: "120 FPS (High Speed)" },
];

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
        resolution = { width: 1920, height: 1080, label: '1920×1080', aspectRatio: '16:9', qualityType: 'full_hd' },
        model = { id: 'runway-gen3', label: 'Runway Gen-3' },
        shotSize = { id: 'long-shot', label: 'Long Shot' },
        frameRate = 30,
        duration = 10
      } = params;

     

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
        duration
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
          availableModels: VIDEO_MODELS,
          availableFrameRates: VIDEO_FRAME_RATES,
        },
        timestamp: Date.now(),
        message: 'Video generation started, connecting to WebSocket...'
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
        resolution = { width: 1920, height: 1080, label: '1920×1080', aspectRatio: '16:9', qualityType: 'full_hd' },
        model = { id: 'runway-gen3', label: 'Runway Gen-3' },
        shotSize = { id: 'long-shot', label: 'Long Shot' },
        frameRate = 30,
        duration = 10
      } = params;

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
        duration
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
          availableModels: VIDEO_MODELS,
          availableFrameRates: VIDEO_FRAME_RATES,
        },
        timestamp: Date.now(),
        message: 'Updated video generation started, connecting to WebSocket...'
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