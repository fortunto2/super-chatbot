import { toast } from 'sonner';
import type { UseChatHelpers } from '@ai-sdk/react';

export interface ImageState {
  status?: string;
  prompt?: string;
  projectId?: string;
  imageUrl?: string;
  timestamp?: number;
  message?: string;
}

// Status helpers
export const getStatusIcon = (isGenerating: boolean, error?: string, imageUrl?: string) => {
  if (isGenerating) return '⏳';
  if (error) return '❌';
  if (imageUrl) return '✅';
  return '⚪';
};

export const getConnectionIcon = (isConnected: boolean) => {
  return isConnected ? '🟢' : '🔴';
};

export const getConnectionStatus = (isGenerating: boolean, isConnected: boolean) => {
  if (isGenerating) {
    return isConnected ? 'Generating...' : 'Connecting...';
  }
  return isConnected ? 'Connected' : 'Disconnected';
};

// Image helpers
export const copyImageUrlToClipboard = async (imageUrl: string) => {
  try {
    await navigator.clipboard.writeText(imageUrl);
    toast.success('Image URL copied to clipboard');
  } catch (error) {
    toast.error('Failed to copy image URL');
  }
};

export const createImageAttachment = (imageUrl: string, prompt: string) => ({
  url: imageUrl,
  name: `generated-image-${Date.now()}.png`,
  contentType: 'image/png' as const,
});

export const sendImageToChat = (
  imageUrl: string, 
  prompt: string, 
  append?: UseChatHelpers['append']
) => {
  if (!append) {
    toast.error('Cannot send to chat: chat function not available');
    return;
  }

  const imageAttachment = createImageAttachment(imageUrl, prompt);
  
  try {
    append({
      role: 'user',
      content: `Generated image: "${prompt}"`,
      experimental_attachments: [imageAttachment],
    });
    toast.success('Image sent to chat');
  } catch (error) {
    console.error('Failed to send image to chat:', error);
    toast.error('Failed to send image to chat');
  }
};

// State validation
export const isImageReady = (imageUrl?: string) => Boolean(imageUrl);

export const isGenerating = (status: string) => 
  status === 'pending' || status === 'processing';

export const isCompleted = (status: string) => status === 'completed';

export const shouldShowSkeleton = (
  initialState?: ImageState, 
  liveImageUrl?: string, 
  initialImageUrl?: string
) => {
  return initialState && 
         isGenerating(initialState.status || '') && 
         !liveImageUrl && 
         !initialImageUrl;
};

export const shouldShowImage = (liveImageUrl?: string, initialImageUrl?: string) => {
  return Boolean(liveImageUrl || initialImageUrl);
};

export const getDisplayImageUrl = (liveImageUrl?: string, initialImageUrl?: string) => {
  return liveImageUrl || initialImageUrl;
};

export const getDisplayPrompt = (livePrompt?: string, initialPrompt?: string) => {
  return livePrompt || initialPrompt;
}; 