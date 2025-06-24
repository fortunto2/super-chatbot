'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { generateImage } from '@/lib/ai/api/generate-image';
import { getImageGenerationConfig } from '@/lib/config/media-settings-factory';
import { getClientSuperduperAIConfig } from '@/lib/config/superduperai';
import type { ImageGenerationFormData } from '../components/image-generator-form';
import type { GenerationStatus } from '../components/generation-progress';

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

export function useImageGenerator(): UseImageGeneratorReturn {
  // AICODE-NOTE: State management for image generation
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
    status: 'idle'
  });
  
  const [currentGeneration, setCurrentGeneration] = useState<GeneratedImage | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  
  // AICODE-NOTE: Connection state for SSE  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  // AICODE-NOTE: Refs for SSE connection and polling cleanup
  const wsRef = useRef<EventSource | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

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
  }, []);

  // AICODE-NOTE: SSE connection for real-time updates (replacing WebSocket)
  const connectSSE = useCallback(async (fileId: string) => {
    const config = await getClientSuperduperAIConfig();
    const sseUrl = `${config.url}/api/v1/events/file.${fileId}`;
    
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
              handleGenerationSuccess(imageUrl, fileId);
            } else {
              handleGenerationError('No image URL in result');
            }
          } else if (message.type === 'file' && message.object?.url) {
            const imageUrl = message.object.url;
            
            if (imageUrl.match(/\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i) || 
                message.object.contentType?.startsWith('image/')) {
              handleGenerationSuccess(imageUrl, fileId);
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
        if (eventSource.readyState !== EventSource.OPEN) {
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

  const startPolling = useCallback((fileId: string) => {
    const poll = async () => {
      try {
        const { FileService } = await import('@/lib/api');
        const fileDetails = await FileService.fileGetById({ id: fileId });
        
        if (fileDetails.url) {
          handleGenerationSuccess(fileDetails.url, fileId);
          return;
        }
        
        // If no URL yet, continue polling
        pollingRef.current = setTimeout(poll, 2000);
        
      } catch (error) {
        console.error('Polling error:', error);
        handleGenerationError('Failed to check generation status');
      }
    };

    poll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
              const { FileService } = await import('@/lib/api');
              const fileDetails = await FileService.fileGetById({ id: fileId });
              
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
    cleanup();
    
    const newImage: GeneratedImage = {
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: imageUrl,
      prompt: generationStatus.message || 'Generated image',
      timestamp: Date.now(),
      projectId,
      settings: {
        model: 'Unknown',
        style: 'Unknown',
        resolution: 'Unknown',
        shotSize: 'Unknown',
      }
    };

    setCurrentGeneration(newImage);
    setGeneratedImages(prev => [newImage, ...prev]);
    
    setGenerationStatus({
      status: 'completed',
      message: 'Image generated successfully!'
    });

    toast.success('Image generated successfully!');
  }, [generationStatus.message, cleanup]);

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

      const result = await generateImage(
        formData.prompt,
        selectedModel,
        selectedResolution,
        selectedStyle,
        selectedShotSize,
        'image-generator-tool',
        formData.seed
      );

      if (result.success && result.projectId) {
        setGenerationStatus(prev => ({
          ...prev,
          status: 'processing',
          projectId: result.projectId,
          requestId: result.requestId,
        }));

        await connectSSE(result.projectId);
        
      } else {
        throw new Error(result.error || 'Failed to start generation');
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
  }, [cleanup]);

  // AICODE-NOTE: Delete image from history
  const deleteImage = useCallback((imageId: string) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== imageId));
    
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
            const { FileService } = await import('@/lib/api');
            const fileDetails = await FileService.fileGetById({ id: fileId });
            
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