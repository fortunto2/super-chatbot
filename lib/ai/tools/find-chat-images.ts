import { tool } from 'ai';
import { z } from 'zod';
import { getChatImageArtifacts } from '@/lib/db/queries';

export const findChatImages = tool({
  description: 'Find recently generated images in the current chat that can be used as source for image-to-video generation. Returns list of available images with their IDs and URLs.',
  parameters: z.object({
    limit: z.number().optional().describe('Maximum number of recent images to return (default: 5)'),
    chatId: z.string().describe('Chat ID to search in for recent image artifacts')
  }),
  execute: async ({ limit = 5, chatId }) => {
    try {
      if (!chatId) {
        return {
          success: false,
          error: 'Chat ID is required to search for images',
          images: []
        };
      }

      // AICODE-NOTE: Search for recent image artifacts in the chat
      console.log(`🔍 Searching for images in chat: ${chatId} (limit: ${limit})`);
      
      const imageArtifacts = await getChatImageArtifacts({ 
        chatId, 
        limit 
      });
      
      if (imageArtifacts.length === 0) {
        return {
          success: true,
          message: "No recent images found in this chat. You can generate an image first, or provide an external image URL for image-to-video generation.",
          images: [],
          suggestion: "Try generating an image first with a text-to-image model, then use it for video generation."
        };
      }
      
      console.log(`✅ Found ${imageArtifacts.length} image artifacts in chat`);
      
      return {
        success: true,
        message: `Found ${imageArtifacts.length} recent image${imageArtifacts.length > 1 ? 's' : ''} in this chat.`,
        images: imageArtifacts.map(img => ({
          id: img.id,
          url: img.url,
          prompt: img.prompt,
          createdAt: img.createdAt.toISOString(),
          projectId: img.projectId
        })),
        suggestion: "You can use any of these images as source for image-to-video generation by referring to their ID or URL."
      };
      
    } catch (error: any) {
      console.error('Error finding chat images:', error);
      return {
        success: false,
        error: error.message || 'Failed to search for images in chat',
        images: []
      };
    }
  }
}); 