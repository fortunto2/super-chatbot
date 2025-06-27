'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { saveImage, getStoredImages, deleteStoredImage, clearStoredImages, type StoredImage } from '@/lib/utils/local-storage';
// import { generateImage } from '@/lib/ai/api/generate-image'; // AICODE-NOTE: Removed direct import - using API endpoint instead
import { getImageGenerationConfig } from '@/lib/config/media-settings-factory';
import { getClientSuperduperAIConfig, configureClientOpenAPI } from '@/lib/config/superduperai';
import type { ImageGenerationFormData } from '../components/image-generator-form';
import type { GenerationStatus } from '../components/generation-progress';
import { FileService } from '@/lib/api/services/FileService';
import type { IFileRead } from '@/lib/api/models/IFileRead';
import { fileClient } from '@/lib/api/client/file-client';
import { generationClient, type ImageGenerationInput } from '@/lib/api/client/generation-client';
import type { GenerateImagePayload } from '@/lib/api/models/GenerateImagePayload';

// AICODE-NOTE: Generated image data structure
export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  projectId?: string;
  requestId?: string;
  settings: {
    model: string;
    style: string;
    resolution: string;
    shotSize: string;
    seed?: number;
  };
}

export interface UseImageGeneratorReturn {
  // Generation state
  generationStatus: GenerationStatus;
  currentGeneration: GeneratedImage | null;
  generatedImages: GeneratedImage[];
  isGenerating: boolean;
  
  // Connection state
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  
  // Actions
  generateImage: (formData: ImageGenerationFormData) => Promise<void>;
  clearCurrentGeneration: () => void;
  deleteImage: (imageId: string) => void;
  clearAllImages: () => void;
  forceCheckResults: () => Promise<void>; // AICODE-NOTE: Added manual check function
  
  // Utils
  downloadImage: (image: GeneratedImage) => Promise<void>;
  copyImageUrl: (image: GeneratedImage) => Promise<void>;
}

export interface ImageGenerationConfig {
  model: string;
  prompt: string;
  width: number;
  height: number;
  samples: number;
  steps: number;
  scale: number;
  seed?: number;
  style?: string;
}

export interface ImageGenerationResult {
  fileId: string;
  projectId?: string;
  status: string;
  message?: string;
}

export interface ImageGenerationError {
  message: string;
  details?: any;
}

export function useImageGenerator(): UseImageGeneratorReturn {
  // AICODE-NOTE: State management for image generation
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
    status: 'idle'
  });
  
  const [currentGeneration, setCurrentGeneration] = useState<GeneratedImage | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  
  // AICODE-NOTE: Load stored images on component mount
  useEffect(() => {
    const storedImages = getStoredImages();
    const convertedImages: GeneratedImage[] = storedImages.map(stored => ({
      id: stored.id,
      url: stored.url,
      prompt: stored.prompt,
      timestamp: stored.timestamp,
      projectId: stored.projectId,
      requestId: stored.requestId,
      settings: stored.settings
    }));
    setGeneratedImages(convertedImages);
    console.log('🖼️ 📂 Loaded', convertedImages.length, 'stored images from localStorage');
  }, []);
  
  // AICODE-NOTE: Connection state for SSE  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  // AICODE-NOTE: Refs for SSE connection and polling cleanup
  const wsRef = useRef<EventSource | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  // AICODE-NOTE: Ref to track completed images and prevent duplicates
  const completedRef = useRef<string | null>(null);

  const isGenerating = generationStatus.status === 'pending' || generationStatus.status === 'processing';

  // AICODE-NOTE: Cleanup function for WebSocket and polling
  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
    completedRef.current = null;
  }, []);

  // AICODE-NOTE: SSE connection for real-time updates (replacing WebSocket)
  const connectSSE = useCallback(async (fileId: string) => {
    // Use Next.js SSE proxy instead of direct backend connection
    const sseUrl = `/api/events/file.${fileId}`;
    
    setConnectionStatus('connecting');
    setIsConnected(false);
    
    try {
      const eventSource = new EventSource(sseUrl);
      wsRef.current = eventSource; // Keep same ref name for compatibility

      eventSource.onopen = () => {
        setConnectionStatus('connected');
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'render_progress') {
            setGenerationStatus(prev => ({
              ...prev,
              status: 'processing',
              progress: message.object?.progress || 0,
              message: message.object?.message,
            }));
          } else if (message.type === 'render_result') {
            const imageUrl = message.object?.url || message.object?.file_url;
            if (imageUrl) {
              console.log('📡 🖼️ SSE render_result: calling handleGenerationSuccess');
              handleGenerationSuccess(imageUrl, message.object?.projectId);
            } else {
              handleGenerationError('No image URL in result');
            }
          } else if (message.type === 'file' && message.object?.url) {
            const imageUrl = message.object.url;
            
            if (imageUrl.match(/\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i) || 
                message.object.contentType?.startsWith('image/')) {
              console.log('📡 🖼️ SSE file event: calling handleGenerationSuccess');
              handleGenerationSuccess(imageUrl, message.object.projectId);
            }
          } else if (message.type === 'task_status' && message.object?.status === 'COMPLETED') {
            startPolling(fileId);
          }
        } catch (error) {
          console.error('SSE message parse error:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        
        if (eventSource.readyState === EventSource.CLOSED) {
          setConnectionStatus('disconnected');
          setIsConnected(false);
          startPolling(fileId);
        }
      };

      setTimeout(() => {
        if (eventSource.readyState !== EventSource.OPEN && !completedRef.current) {
          startPolling(fileId);
        }
      }, 10000);

    } catch (error) {
      console.error('SSE connection failed:', error);
      setConnectionStatus('disconnected');
      setIsConnected(false);
      startPolling(fileId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startPolling = useCallback(async (fileId: string) => {
    // AICODE-NOTE: Skip polling if already completed
    if (completedRef.current) {
      console.log('🔄 Skipping polling - image already completed');
      return;
    }
    
    console.log('🔄 Starting smart polling for file:', fileId);
    
    try {
      // Use new smart polling manager with 7-minute timeout
      const { pollFileCompletion } = await import('@/lib/utils/smart-polling-manager');
      
      const result = await pollFileCompletion(fileId, {
        maxDuration: 7 * 60 * 1000, // 7 minutes
        onProgress: (attempt, elapsed, nextInterval) => {
          console.log(`🔄 Image poll attempt ${attempt} (${Math.round(elapsed / 1000)}s elapsed, next: ${nextInterval}ms)`);
          
          // Update generation status with progress info
          setGenerationStatus(prev => ({
            ...prev,
            message: `Checking results... (attempt ${attempt}, ${Math.round(elapsed / 1000)}s elapsed)`
          }));
        },
        onError: (error, attempt) => {
          console.warn(`⚠️ Image polling non-critical error at attempt ${attempt}:`, error.message);
        }
      });
      
      if (result.success && result.data) {
        console.log('✅ Smart polling completed successfully:', result.data.url);
        const projectId = result.data.tasks?.[0]?.project_id || undefined;
        handleGenerationSuccess(result.data.url, projectId);
      } else {
        console.error('❌ Smart polling failed:', result.error);
        handleGenerationError(result.error || 'Image generation timeout after 7 minutes');
      }
      
    } catch (error) {
      console.error('❌ Smart polling system error:', error);
      handleGenerationError('Failed to start polling system');
    }
  }, []);

  // Legacy polling function for project-based polling (kept for compatibility)
  const startProjectPolling = useCallback((projectId: string) => {
    const poll = async () => {
      try {
        const { ProjectService, TaskStatusEnum } = await import('@/lib/api');
        const project = await ProjectService.projectGetById({ id: projectId });

        if (project.data && project.data.length > 0) {
          const imageData = project.data?.find(data => {
            if (data.value && typeof data.value === 'object') {
              const value = data.value as Record<string, any>;
              return value.url && (
                value.contentType?.startsWith('image/') ||
                value.url.match(/\.(jpg|jpeg|png|webp|gif)$/i)
              );
            }
            return false;
          });
          
          if (imageData?.value && typeof imageData.value === 'object') {
            const imageUrl = (imageData.value as Record<string, any>).url as string;
            handleGenerationSuccess(imageUrl, projectId);
            return;
          }
          
          const fileIdData = project.data?.find(data => {
            return data.type === 'image' && data.value && typeof data.value === 'object' && (data.value as any).file_id;
          });
          
          if (fileIdData?.value && typeof fileIdData.value === 'object') {
            const fileId = (fileIdData.value as Record<string, any>).file_id as string;
            
            try {
              // Use internal proxy API instead of direct OpenAPI client
              const response = await fetch(`/api/file/${fileId}`);
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
              const fileDetails = await response.json();
              
              if (fileDetails.url) {
                handleGenerationSuccess(fileDetails.url, projectId);
                return;
              }
            } catch (error) {
              console.error('Failed to fetch file details:', error);
            }
          }
          
          const anyDataWithUrl = project.data?.find(data => {
            return data.value && typeof data.value === 'object' && (data.value as any).url;
          });
          
          if (anyDataWithUrl?.value && typeof anyDataWithUrl.value === 'object') {
            const url = (anyDataWithUrl.value as Record<string, any>).url as string;
            handleGenerationSuccess(url, projectId);
            return;
          }
        }
        
        const hasErrorTask = project.tasks?.some(task => task.status === TaskStatusEnum.ERROR);
        const allCompleted = project.tasks?.length > 0 && project.tasks.every(task => task.status === TaskStatusEnum.COMPLETED);
        
        if (hasErrorTask) {
          handleGenerationError('Generation failed: task error');
          return;
        }
        
        const hasInProgress = project.tasks?.some(task => task.status === TaskStatusEnum.IN_PROGRESS);
        if (hasInProgress || project.tasks?.length === 0) {
          pollingRef.current = setTimeout(poll, 2000);
        } else {
          handleGenerationError('Generation process stalled');
        }
        
      } catch (error) {
        console.error('Polling error:', error);
        handleGenerationError('Failed to check generation status');
      }
    };

    poll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // AICODE-NOTE: Handle successful generation
  const handleGenerationSuccess = useCallback((imageUrl: string, projectId?: string) => {
    console.log('🖼️ 🔍 handleGenerationSuccess called with URL:', imageUrl.substring(0, 50) + '...');
    console.log('🖼️ 🔍 Current completedRef value:', completedRef.current?.substring(0, 50) + '...' || 'null');
    
    // AICODE-NOTE: Prevent duplicate processing of the same image
    if (completedRef.current === imageUrl) {
      console.log('🖼️ ⏭️ Image already processed, skipping duplicate:', imageUrl.substring(0, 50) + '...');
      return;
    }
    
    console.log('🖼️ ✅ Processing image completion:', imageUrl.substring(0, 50) + '...');
    completedRef.current = imageUrl;
    console.log('🖼️ 🔍 Set completedRef to:', completedRef.current.substring(0, 50) + '...');
    
    cleanup();
    
    // Get current generation settings for proper metadata
    const currentSettings = generationStatus;
    
    const newImage: GeneratedImage = {
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: imageUrl,
      prompt: currentSettings.message?.replace('Generating: ', '') || 'Generated image',
      timestamp: Date.now(),
      projectId,
      settings: {
        model: 'Unknown',
        style: 'Unknown',
        resolution: 'Unknown',
        shotSize: 'Unknown',
      }
    };

    // AICODE-NOTE: Save to localStorage
    const storedImage: StoredImage = {
      id: newImage.id,
      url: newImage.url,
      prompt: newImage.prompt,
      timestamp: newImage.timestamp,
      projectId: newImage.projectId,
      requestId: newImage.requestId,
      settings: newImage.settings
    };
    
    try {
      saveImage(storedImage);
      console.log('🖼️ 💾 Image saved to localStorage');
    } catch (error) {
      console.warn('🖼️ ⚠️ Failed to save image to localStorage:', error);
    }

    setCurrentGeneration(newImage);
    setGeneratedImages(prev => [newImage, ...prev]);
    
    setGenerationStatus({
      status: 'completed',
      message: 'Image generated successfully!'
    });

    toast.success('Image generated successfully!');
  }, [cleanup, generationStatus]);

  // AICODE-NOTE: Handle generation error
  const handleGenerationError = useCallback((error: string) => {
    cleanup();
    
    setGenerationStatus({
      status: 'error',
      message: error
    });

    toast.error(`Image generation failed: ${error}`);
  }, [cleanup]);

  // AICODE-NOTE: Main generation function
  const handleGenerateImage = useCallback(async (formData: ImageGenerationFormData) => {
    if (isGenerating) {
      toast.warning('Image generation already in progress');
      return;
    }

    try {
      setGenerationStatus({
        status: 'pending',
        progress: 0,
        message: `Generating: ${formData.prompt}`,
      });

      setCurrentGeneration(null);
      
      // AICODE-NOTE: Reset completion flag for new generation
      completedRef.current = null;

      // Load configuration to get proper objects for API call
      const config = await getImageGenerationConfig();
      
      // Find the selected model
      const selectedModel = config.availableModels.find(m => m.name === formData.model) || config.defaultSettings.model;
      
      // Find the selected resolution
      const selectedResolution = config.availableResolutions.find(r => r.label === formData.resolution) || config.defaultSettings.resolution;
      
      // Find the selected style
      const selectedStyle = config.availableStyles.find(s => s.id === formData.style) || config.defaultSettings.style;
      
      // Find the selected shot size
      const selectedShotSize = config.availableShotSizes.find(s => s.id === formData.shotSize) || config.defaultSettings.shotSize;

      // AICODE-NOTE: Use typed client for image generation
      const payload = {
        prompt: formData.prompt,
        model: selectedModel,
        resolution: selectedResolution,
        style: selectedStyle,
        shotSize: selectedShotSize,
        chatId: 'image-generator-tool',
        seed: formData.seed
      };

      const result = await generationClient.generateImage(payload);

      if (result.success && (result.projectId || result.fileId)) {
        // Use fileId if available, otherwise fall back to projectId
        const connectionId = result.fileId || result.projectId || '';
        
        if (!connectionId) {
          throw new Error('No connection ID received from server');
        }
        
        setGenerationStatus(prev => ({
          ...prev,
          status: 'processing',
          projectId: result.projectId,
          fileId: result.fileId,
          requestId: result.fileId, // Use fileId as requestId
        }));

        await connectSSE(connectionId);
        
      } else {
        throw new Error(result.message || 'Failed to start generation');
      }

    } catch (error) {
      console.error('Generation error:', error);
      handleGenerationError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [isGenerating, connectSSE, handleGenerationError]);

  // AICODE-NOTE: Clear current generation
  const clearCurrentGeneration = useCallback(() => {
    setCurrentGeneration(null);
    setGenerationStatus({ status: 'idle' });
    cleanup();
    // AICODE-NOTE: Reset completion flag when clearing
    completedRef.current = null;
  }, [cleanup]);

  // AICODE-NOTE: Delete image from history
  const deleteImage = useCallback((imageId: string) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== imageId));
    
    // Delete from localStorage
    try {
      deleteStoredImage(imageId);
      console.log('🖼️ 🗑️ Image deleted from localStorage');
    } catch (error) {
      console.warn('🖼️ ⚠️ Failed to delete image from localStorage:', error);
    }
    
    // Clear current generation if it matches
    if (currentGeneration?.id === imageId) {
      clearCurrentGeneration();
    }
    
    toast.success('Image deleted');
  }, [currentGeneration?.id, clearCurrentGeneration]);

  // AICODE-NOTE: Clear all images
  const clearAllImages = useCallback(() => {
    setGeneratedImages([]);
    clearCurrentGeneration();
    
    // Clear from localStorage
    try {
      clearStoredImages();
      console.log('🖼️ 🗑️ All images cleared from localStorage');
    } catch (error) {
      console.warn('🖼️ ⚠️ Failed to clear images from localStorage:', error);
    }
    
    toast.success('All images cleared');
  }, [clearCurrentGeneration]);

  // AICODE-NOTE: Download image function
  const downloadImage = useCallback(async (image: GeneratedImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `generated-image-${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Image downloaded');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image');
    }
  }, []);

  // AICODE-NOTE: Copy image URL to clipboard
  const copyImageUrl = useCallback(async (image: GeneratedImage) => {
    try {
      await navigator.clipboard.writeText(image.url);
      toast.success('Image URL copied to clipboard');
    } catch (error) {
      console.error('Copy error:', error);
      toast.error('Failed to copy image URL');
    }
  }, []);

  const forceCheckResults = useCallback(async () => {
    const projectId = generationStatus.projectId;
    
    if (!projectId) {
      toast.warning('No active image generation to check');
      return;
    }
    
    toast.info('Checking for image results...');
    
    try {
      const { TaskStatusEnum } = await import('@/lib/api');
      
      const response = await fetch(`/api/project/${projectId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const project = await response.json();
      
      if (project.data && project.data.length > 0) {
        const imageData = project.data?.find((data: any) => {
          if (data.value && typeof data.value === 'object') {
            const value = data.value as Record<string, any>;
            return value.url && (
              value.contentType?.startsWith('image/') ||
              value.url.match(/\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i)
            );
          }
          return false;
        });
        
        if (imageData?.value && typeof imageData.value === 'object') {
          const imageUrl = (imageData.value as Record<string, any>).url as string;
          handleGenerationSuccess(imageUrl, projectId);
          toast.success('Image results retrieved!');
          return;
        }
        
        const fileIdData = project.data?.find((data: any) => {
          return data.type === 'image' && data.value && typeof data.value === 'object' && (data.value as any).file_id;
        });
        
        if (fileIdData?.value && typeof fileIdData.value === 'object') {
          const fileId = (fileIdData.value as Record<string, any>).file_id as string;
          
          try {
            // Use internal proxy API instead of direct OpenAPI client
            const response = await fetch(`/api/file/${fileId}`);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const fileDetails = await response.json();
            
            if (fileDetails.url) {
              handleGenerationSuccess(fileDetails.url, projectId);
              toast.success('Image results retrieved!');
              return;
            }
          } catch (error) {
            console.error('Failed to fetch file details:', error);
          }
        }
        
        const anyDataWithUrl = project.data?.find((data: any) => {
          return data.value && typeof data.value === 'object' && (data.value as any).url;
        });
        
        if (anyDataWithUrl?.value && typeof anyDataWithUrl.value === 'object') {
          const url = (anyDataWithUrl.value as Record<string, any>).url as string;
          handleGenerationSuccess(url, projectId);
          toast.success('Image results retrieved!');
          return;
        }
      }
      
      const allCompleted = project.tasks?.length > 0 && 
                          project.tasks.every((task: any) => task.status === TaskStatusEnum.COMPLETED);
      const hasErrors = project.tasks?.some((task: any) => task.status === TaskStatusEnum.ERROR);
      const inProgress = project.tasks?.some((task: any) => task.status === TaskStatusEnum.IN_PROGRESS);
      
      if (hasErrors) {
        toast.error('Image generation failed');
      } else if (inProgress) {
        toast.info('Image generation still in progress...');
        startPolling(projectId);
      } else if (allCompleted) {
        toast.warning('Tasks completed but no image data found');
      } else if (project.tasks?.length === 0) {
        toast.warning('No tasks or data found - generation might still be starting');
      } else {
        toast.warning('Image generation status unclear');
      }
      
    } catch (error) {
      console.error('Force check failed:', error);
      toast.error('Failed to check image results');
    }
  }, [generationStatus.projectId, handleGenerationSuccess, startPolling]);

  return {
    generationStatus,
    currentGeneration,
    generatedImages,
    isGenerating,
    isConnected,
    connectionStatus,
    generateImage: handleGenerateImage,
    clearCurrentGeneration,
    deleteImage,
    clearAllImages,
    forceCheckResults,
    downloadImage,
    copyImageUrl,
  };
} 