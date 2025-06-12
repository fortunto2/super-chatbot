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


export interface UseImageGenerationState {
  isGenerating: boolean;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  imageUrl?: string;
  projectId?: string;
  requestId?: string;
  timestamp?: number;
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
  startTracking: (projectId: string, requestId?: string) => void;
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
  requestId: undefined,
};

export function useImageGeneration(chatId?: string): UseImageGenerationReturn {
  const [state, setState] = useState<UseImageGenerationState>(initialState);
  const stableChatIdRef = useRef<string | undefined>(chatId);
  const [chatIdState, setChatIdState] = useState(chatId);
  const [currentRequestId, setCurrentRequestId] = useState<string | undefined>();
  const mountedRef = useRef(true);

  // Update stable chatId and state only when actually changed
  useEffect(() => {
    if (stableChatIdRef.current !== chatId) {
      const oldChatId = stableChatIdRef.current;
      console.log('🎮 ChatId changed from', oldChatId, 'to', chatId);
      
      // Clean up old project connections immediately and synchronously
      if (oldChatId) {
        console.log('🧹 Cleaning up old project immediately:', oldChatId);
        // Use the store directly for immediate cleanup
        const { imageWebsocketStore } = require('@/lib/websocket/image-websocket-store');
        imageWebsocketStore.cleanupProject(oldChatId);
        
        // Also remove any lingering handlers for the old project
        imageWebsocketStore.removeProjectHandlers(oldChatId, []);
      }
      
      stableChatIdRef.current = chatId;
      setChatIdState(chatId);
      setCurrentRequestId(undefined); // Reset request ID
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

  // Create stable event handler using chatIdState and currentRequestId
  const imageEventHandler = useImageEventHandler(chatIdState || '', handleStateUpdate, currentRequestId);
  
  // Use stable chatIdState for useMemo to properly trigger recreations
  const eventHandlers = useMemo(() => {
    console.log('🎮 Creating event handlers array for chatId:', chatIdState, 'requestId:', currentRequestId);
    return chatIdState ? [imageEventHandler] : [];
  }, [imageEventHandler, chatIdState, currentRequestId]);

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

  // Improved cleanup for React Strict Mode
  useEffect(() => {
    return () => {
      console.log('🧹 Final cleanup useImageGeneration, chatId:', chatIdState);
      mountedRef.current = false;
      
      // Immediate cleanup without delays for React Strict Mode
      if (chatIdState) {
        const { imageWebsocketStore } = require('@/lib/websocket/image-websocket-store');
        imageWebsocketStore.cleanupProject(chatIdState);
        
        // Check for excessive handlers and force cleanup if needed
        const debugInfo = imageWebsocketStore.getDebugInfo();
        if (debugInfo.totalHandlers > 8) {
          console.log('🧹 Force cleanup due to excessive handlers:', debugInfo.totalHandlers);
          imageWebsocketStore.forceCleanup();
        }
      }
    };
  }, [chatIdState]); // Depend on chatIdState for proper cleanup

  const { isConnected, connectionAttempts, maxAttempts, disconnect } = useImageWebsocket(websocketOptions);

  // Only log WebSocket status if WebSocket is enabled
  if (chatIdState) {
    console.log('🎮 WebSocket connection status:', { isConnected, connectionAttempts, maxAttempts });
  }

  const startTracking = useCallback((projectId: string, requestId?: string) => {
    if (!mountedRef.current) return;
    
    console.log('🎯 Starting tracking for project:', projectId, 'requestId:', requestId);
    
    // Set current request ID for event filtering
    if (requestId) {
      setCurrentRequestId(requestId);
    }
    
    // Set initial tracking state
    setState(prev => ({
      ...prev,
      isGenerating: true,
      progress: 0,
      status: 'processing',
      error: undefined,
      imageUrl: undefined,
      projectId,
      requestId
    }));
    
    console.log('🎯 State updated for tracking');
  }, []);

  const resetState = useCallback(() => {
    if (!mountedRef.current) return;
    console.log('🎯 Resetting image generation state');
    setCurrentRequestId(undefined);
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

      // Set request ID for tracking
      if (result.requestId) {
        setCurrentRequestId(result.requestId);
      }

      // Keep the processing state, WebSocket will update it
      setState(prev => ({
        ...prev,
        projectId: result.projectId || chatId,
        requestId: result.requestId,
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
