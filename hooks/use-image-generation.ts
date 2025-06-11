import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { generateImage, ImageGenerationResult } from '@/lib/ai/api/generate-image';
import { ImageModel, MediaOption, MediaResolution } from '@/lib/types/media-settings';
import { useImageWebsocket } from './use-image-websocket';
import { useImageEventHandler, type ImageGenerationState } from './use-image-event-handler';

export enum TaskStatusEnum {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ERROR = 'error',
}

export enum TaskTypeEnum {
  MUSICBEATS_METADATA_FLOW = 'musicbeats-metadata-flow',
  AUDIO_GENERATION_FLOW = 'audio-generation-flow',
  VIDEO_GENERATION_FLOW = 'video-generation-flow',
  IMAGE_GENERATION_FLOW = 'image-generation-flow',
  TXT2SCENE_FLOW = 'txt2scene-flow',
  TXT2SCRIPT_FLOW = 'txt2script-flow',
  SCRIPT2ENTITIES_FLOW = 'script2entities-flow',
  SCRIPT2STORYBOARD_FLOW = 'script2storyboard-flow',
  STORYBOARD2VIDEO_FLOW = 'storyboard2video-flow',
  TIMELINE2VIDEO_FLOW = 'timeline2video-flow',
}

export type ITaskRead = {
  type: TaskTypeEnum;
  status?: TaskStatusEnum;
  id: string;
  file_id?: (string | null);
  project_id?: (string | null);
};


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
  startTracking: (projectId: string) => void;
}

export interface UseImageGenerationReturn extends UseImageGenerationState, UseImageGenerationActions {
  disconnect: () => void;
  isConnected: boolean;
  connectionAttempts: number;
  maxAttempts: number;
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
  const stableChatIdRef = useRef<string | undefined>(chatId);
  const [chatIdState, setChatIdState] = useState(chatId);
  const mountedRef = useRef(true);

  // Update stable chatId and state only when actually changed
  useEffect(() => {
    if (stableChatIdRef.current !== chatId) {
      const oldChatId = stableChatIdRef.current;
      console.log('🎮 ChatId changed from', oldChatId, 'to', chatId);
      
      // Clean up old project connections
      if (oldChatId) {
        console.log('🧹 Cleaning up old project:', oldChatId);
        // Import the store dynamically to avoid circular dependencies
        import('@/lib/websocket/image-websocket-store').then(({ imageWebsocketStore }) => {
          imageWebsocketStore.cleanupProject(oldChatId);
        });
      }
      
      stableChatIdRef.current = chatId;
      setChatIdState(chatId);
      // Reset state only when switching to a different chatId
      if (mountedRef.current) {
        setState(initialState);
      }
    }
  }, [chatId]);

  // Track mounting state for React Strict Mode
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleStateUpdate = useCallback((update: Partial<UseImageGenerationState>) => {
    if (!mountedRef.current) return; // Don't update state if unmounted
    
    console.log('🎮 State update received:', update);
    setState(prev => {
      const newState = {
        ...prev,
        ...update,
        timestamp: Date.now()
      };
      return newState;
    });
  }, []);

  // Create stable event handler using chatIdState instead of ref
  const imageEventHandler = useImageEventHandler(chatIdState || '', handleStateUpdate);
  
  // Use stable chatIdState for useMemo to properly trigger recreations
  const eventHandlers = useMemo(() => {
    console.log('🎮 Creating event handlers array for chatId:', chatIdState);
    return chatIdState ? [imageEventHandler] : [];
  }, [imageEventHandler, chatIdState]);

  // Create stable WebSocket options with chatIdState dependency
  const websocketOptions = useMemo(() => {
    const shouldConnect = !!chatIdState && mountedRef.current;
    console.log('🎮 Should connect WebSocket:', shouldConnect, 'chatId:', chatIdState);
    
    return {
      projectId: chatIdState || '',
      eventHandlers,
      enabled: shouldConnect,
    };
  }, [chatIdState, eventHandlers]);

  // Add forced cleanup for React Strict Mode
  useEffect(() => {
    return () => {
      console.log('🧹 Cleanup useImageGeneration, chatId:', chatIdState);
      mountedRef.current = false;
    };
  }, []);

  const { isConnected, connectionAttempts, maxAttempts, disconnect } = useImageWebsocket(websocketOptions);

  console.log('🎮 WebSocket connection status:', { isConnected, connectionAttempts, maxAttempts });

  const startTracking = useCallback((projectId: string) => {
    if (!mountedRef.current) return;
    
    console.log('🎯 Starting tracking for project:', projectId);
    
    // Set initial tracking state
    setState(prev => ({
      ...prev,
      isGenerating: true,
      progress: 0,
      status: 'processing',
      error: undefined,
      imageUrl: undefined
    }));
    
    console.log('🎯 State updated for tracking');
  }, []);

  const resetState = useCallback(() => {
    if (!mountedRef.current) return;
    console.log('🎯 Resetting image generation state');
    setState(initialState);
  }, []);

  const generateImageAsync = useCallback(async (
    style: MediaOption,
    resolution: MediaResolution,
    prompt: string,
    model: ImageModel,
    shotSize: MediaOption,
    chatId: string
  ) => {
    try {
      // Reset state and immediately show generating state
      setState({
        ...initialState,
        isGenerating: true,
        status: 'processing', // Show processing immediately
        projectId: chatId,
      });

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

      // Keep the processing state, WebSocket will update it
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

  return {
    ...state,
    isConnected,
    connectionAttempts,
    maxAttempts,
    startTracking,
    resetState,
    generateImageAsync,
    disconnect
  };
} 

export const useTaskStatus = (type: TaskTypeEnum, tasks?: ITaskRead[]) => {
    const firstTask = tasks?.find((task) => task.type === type);
    return {
        isExists: !!firstTask,
        isCompleted: firstTask?.status === TaskStatusEnum.COMPLETED,
        isPending: firstTask?.status === TaskStatusEnum.IN_PROGRESS,
        isError: firstTask?.status === TaskStatusEnum.ERROR,
    };
};
