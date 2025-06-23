import { toast } from 'sonner';

export interface ImageState {
  status?: string;
  prompt?: string;
  projectId?: string;
  requestId?: string;
  imageUrl?: string;
  timestamp?: number;
  message?: string;
}

// Image helpers
export const copyImageUrlToClipboard = async (imageUrl: string) => {
  try {
    await navigator.clipboard.writeText(imageUrl);
    toast.success('Image URL copied to clipboard');
  } catch (error) {
    toast.error('Failed to copy image URL');
  }
};

// State validation
export const isGenerating = (status: string) => 
  status === 'pending' || status === 'processing';

export const shouldShowSkeleton = (
  initialState?: ImageState, 
  liveImageUrl?: string, 
  initialImageUrl?: string
) => {
  const hasImage = liveImageUrl || initialImageUrl;
  const shouldGenerate = initialState && isGenerating(initialState.status || '');
  const result = hasImage ? false : shouldGenerate;
  
  return result;
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