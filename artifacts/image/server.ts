import { createDocumentHandler } from '@/lib/artifacts/server';
import { generateImageWithStrategy } from '@/lib/ai/api/image-generation';
import { getStyles } from '@/lib/ai/api/get-styles';
import type { MediaOption, MediaResolution } from '@/lib/types/media-settings';
import type { ImageModel } from '@/lib/config/superduperai';
import { getAvailableImageModels } from '@/lib/config/superduperai';
import { validateOperationBalance, deductOperationBalance } from '@/lib/utils/tools-balance';

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
  onCreateDocument: async ({ id: chatId, title, dataStream, session }) => {
    let draftContent = '';
    try {
      // Parse the title to extract image generation parameters
      const params = JSON.parse(title);
      const {
        prompt,
        style = { id: 'flux_steampunk', label: 'Steampunk' },
        resolution = { width: 1024, height: 1024, label: '1024x1024', aspectRatio: '1:1', qualityType: 'hd' },
        model = { id: 'flux-dev', label: 'Flux Dev' },
        shotSize = { id: 'long_shot', label: 'Long Shot' },
        negativePrompt = '',
        seed,
        batchSize
      } = params;

      // Check user balance before proceeding
      if (session?.user?.id) {
        console.log('💳 Checking balance for image generation in chat...');
        
        // Determine operation type and multipliers
        const operationType = 'text-to-image'; // Chat only supports text-to-image
        const multipliers: string[] = [];
        
        // Check style for quality multipliers
        if (style?.id?.includes('high-quality')) multipliers.push('high-quality');
        if (style?.id?.includes('ultra-quality')) multipliers.push('ultra-quality');

        const balanceValidation = await validateOperationBalance(
          session.user.id,
          'image-generation',
          operationType,
          multipliers
        );

        if (!balanceValidation.valid) {
          console.error('💳 Insufficient balance for image generation');
          
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
      let availableModels: ImageModel[] = [];
      try {
        availableModels = await getAvailableImageModels();
      } catch (error) {
        console.error('🎨 ❌ Failed to load dynamic models:', error);
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

      // Start image generation using new architecture (only text-to-image)
      const result = await generateImageWithStrategy('text-to-image', {
        prompt,
        model,
        style,
        resolution,
        shotSize,
        negativePrompt,
        seed,
        batchSize
      });

      // AICODE-DEBUG: API payload removed to reduce duplication
      // If needed for debugging, can be reconstructed from stored parameters

      if (!result.success) {
        draftContent = JSON.stringify({
          status: 'failed',
          error: result.error,
          prompt: prompt
        });
        return draftContent;
      }

      // Формируем content только с выбранными параметрами (без available опций для оптимизации)
      draftContent = JSON.stringify({
        status: 'pending',
        projectId: result.projectId || chatId,
        requestId: result.requestId,
        fileId: result.fileId,
        prompt: prompt,
        // Store only selected values, not all available options
        style,
        resolution,
        model,
        shotSize,
        negativePrompt,
        seed,
        batchSize,
        timestamp: Date.now(),
        message: result.message || 'Image generation started, connecting to WebSocket...'
      });

      // Deduct balance after successful generation start
      if (session?.user?.id) {
        try {
          const operationType = 'text-to-image';
          const multipliers: string[] = [];
          
          // Check style for quality multipliers
          if (style?.id?.includes('high-quality')) multipliers.push('high-quality');
          if (style?.id?.includes('ultra-quality')) multipliers.push('ultra-quality');

          await deductOperationBalance(
            session.user.id,
            'image-generation',
            operationType,
            multipliers,
            {
              projectId: result.projectId,
              fileId: result.fileId,
              prompt: prompt.substring(0, 100),
              operationType,
              timestamp: new Date().toISOString()
            }
          );
          console.log(`💳 Balance deducted for user ${session.user.id} after image generation start`);
        } catch (balanceError) {
          console.error('⚠️ Failed to deduct balance after image generation:', balanceError);
          // Continue - image generation already started
        }
      }

    } catch (error: any) {
      console.error('🎨 ❌ IMAGE GENERATION ERROR:', error);
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
      // Check if document already has completed content - don't recreate if so
      if (draftContent) {
        try {
          const existingContent = JSON.parse(draftContent);
          if (existingContent.status === 'completed' && existingContent.imageUrl) {
            console.log('🎨 ⚠️ Document already completed with image, skipping update to prevent reset');
            return draftContent; // Return existing content without recreating
          }
        } catch (parseError) {
          // If we can't parse existing content, proceed with update
          console.log('🎨 ℹ️ Could not parse existing content, proceeding with update');
        }
      }
      // Extract chatId from document.id (which should be the chat ID)
      const chatId = document.id;
      // Parse the description to extract new image generation parameters
      const params = JSON.parse(description);
      const {
        prompt,
        style = { id: 'flux_steampunk', label: 'Steampunk' },
        resolution = { width: 1024, height: 1024, label: '1024x1024', aspectRatio: '1:1', qualityType: 'hd' },
        model = { id: 'flux-dev', label: 'Flux Dev' },
        shotSize = { id: 'long_shot', label: 'Long Shot' },
        negativePrompt = '',
        seed,
        batchSize
      } = params;
      // Start image generation using new architecture (only text-to-image)
      const result = await generateImageWithStrategy('text-to-image', {
        prompt,
        model,
        style,
        resolution,
        shotSize,
        negativePrompt,
        seed,
        batchSize
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
        // Store only selected values, not all available options
        style,
        resolution,
        model,
        shotSize,
        negativePrompt,
        seed,
        batchSize,
        timestamp: Date.now(),
        message: result.message || 'Image generation started, connecting to WebSocket...'
      });
    } catch (error: any) {
      console.error('🎨 ❌ IMAGE GENERATION ERROR:', error);
      draftContent = JSON.stringify({
        status: 'failed',
        error: error?.message || 'Failed to update image parameters'
      });
    }
    return draftContent;
  },
});
