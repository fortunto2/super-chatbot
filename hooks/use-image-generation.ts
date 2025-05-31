import { useState, useCallback, useMemo } from 'react';
import { generateImage, ImageGenerationResult } from '@/lib/ai/api/generate-image';
import { ImageModel, MediaOption, MediaResolution } from '@/lib/types/media-settings';
import { useImageWebsocket } from './use-image-websocket';
import { useImageEventHandler, type ImageGenerationState } from './use-image-event-handler';

export interface UseImageGenerationState extends ImageGenerationState {
  isGenerating: boolean;
}

export interface UseImageGenerationActions {
  generateImageAsync: (
    style: MediaOption,
    resolution: MediaResolution,
    prompt: string,
    model: ImageModel,
    shotSize: MediaOption,
    chatId: string
  ) => Promise<void>;
  resetState: () => void;
}

export interface UseImageGenerationReturn extends UseImageGenerationState, UseImageGenerationActions {
  disconnect: () => void;
  isConnected: boolean;
}

const initialState: UseImageGenerationState = {
  isGenerating: false,
  progress: 0,
  status: 'pending',
  error: undefined,
  imageUrl: undefined,
  projectId: undefined,
};

export function useImageGeneration(chatId?: string): UseImageGenerationReturn {
  const [state, setState] = useState<UseImageGenerationState>(initialState);

  const handleStateUpdate = useCallback((update: Partial<ImageGenerationState>) => {
    setState(prev => ({
      ...prev,
      ...update,
      isGenerating: update.status === 'processing' || update.status === 'pending',
    }));
  }, []);

  const imageEventHandler = useImageEventHandler(chatId || '', handleStateUpdate);
  const eventHandlers = useMemo(() => [imageEventHandler], [imageEventHandler]);
  
  const { isConnected, disconnect } = useImageWebsocket({
    projectId: chatId || '',
    eventHandlers,
  });

  const generateImageAsync = useCallback(async (
    style: MediaOption,
    resolution: MediaResolution,
    prompt: string,
    model: ImageModel,
    shotSize: MediaOption,
    chatId: string
  ) => {
    try {
      // Reset state
      setState({
        ...initialState,
        isGenerating: true,
        status: 'pending',
        projectId: chatId,
      });

      console.log('Starting image generation with chatId:', chatId);

      // Start image generation
      const result: ImageGenerationResult = await generateImage(
        style,
        resolution,
        prompt,
        model,
        shotSize,
        chatId
      );

      if (!result.success) {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          status: 'failed',
          error: result.error || 'Unknown error occurred',
        }));
        return;
      }

      console.log('Image generation request successful:', result);

      // WebSocket should automatically start receiving updates
      setState(prev => ({
        ...prev,
        projectId: result.projectId || chatId,
        status: 'processing',
      }));

    } catch (error: any) {
      console.error('Image generation error:', error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        status: 'failed',
        error: error?.message || 'Unexpected error occurred',
      }));
    }
  }, []);

  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    generateImageAsync,
    resetState,
    disconnect,
    isConnected,
  };
} 