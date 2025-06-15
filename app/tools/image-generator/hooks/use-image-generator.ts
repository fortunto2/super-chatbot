'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { generateImage } from '@/lib/ai/api/generate-image';
import type { ImageGenerationFormData } from '../components/image-generator-form';
import type { GenerationStatus } from '../components/generation-progress';
import type { MediaOption, MediaResolution } from '@/lib/types/media-settings';

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
  
  // Actions
  generateImage: (formData: ImageGenerationFormData) => Promise<void>;
  clearCurrentGeneration: () => void;
  deleteImage: (imageId: string) => void;
  clearAllImages: () => void;
  
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
  
  // AICODE-NOTE: Refs for WebSocket and polling cleanup
  const wsRef = useRef<WebSocket | null>(null);
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

  // AICODE-NOTE: WebSocket connection for real-time updates
  const connectWebSocket = useCallback((projectId: string) => {
    const wsUrl = `wss://dev-editor.superduperai.co/api/v1/ws/project.${projectId}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔌 WebSocket connected for project:', projectId);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📡 WebSocket message:', message);

          if (message.type === 'render_progress') {
            setGenerationStatus(prev => ({
              ...prev,
              status: 'processing',
              progress: message.object?.progress || 0,
              message: message.object?.message,
            }));
          } else if (message.type === 'render_result') {
            // Generation completed
            const imageUrl = message.object?.url || message.object?.file_url;
            if (imageUrl) {
              handleGenerationSuccess(imageUrl, projectId);
            } else {
              handleGenerationError('No image URL in result');
            }
          }
        } catch (error) {
          console.error('📡 ❌ WebSocket message parse error:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('📡 ❌ WebSocket error:', error);
        // Fallback to polling
        startPolling(projectId);
      };

      ws.onclose = () => {
        console.log('📡 WebSocket closed for project:', projectId);
        wsRef.current = null;
      };

    } catch (error) {
      console.error('📡 ❌ WebSocket connection failed:', error);
      // Fallback to polling
      startPolling(projectId);
    }
  }, []);

  // AICODE-NOTE: Polling fallback for generation status
  const startPolling = useCallback((projectId: string) => {
    console.log('📊 Starting polling for project:', projectId);
    
    const poll = async () => {
      try {
        // AICODE-TODO: Implement proper polling API call
        // For now, simulate with timeout
        pollingRef.current = setTimeout(() => {
          // This would be replaced with actual API call
          console.log('📊 Polling project status...');
          poll();
        }, 2000);
        
      } catch (error) {
        console.error('📊 ❌ Polling error:', error);
        handleGenerationError('Polling failed');
      }
    };

    poll();
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

      console.log('🎨 Starting image generation with data:', formData);

      // AICODE-NOTE: Call existing SuperDuperAI API
      const result = await generateImage({
        prompt: formData.prompt,
        style: formData.style || 'realistic',
        resolution: formData.resolution || '1024x1024',
        shotSize: formData.shotSize || 'medium-shot',
        model: formData.model || 'comfyui/flux',
        seed: formData.seed,
        chatId: 'image-generator-tool', // Use tool identifier as chatId
      });

      console.log('🎨 ✅ Generation API response:', result);

      if (result.success && result.projectId) {
        setGenerationStatus(prev => ({
          ...prev,
          status: 'processing',
          projectId: result.projectId,
          requestId: result.requestId,
        }));

        // Start WebSocket connection
        connectWebSocket(result.projectId);
        
      } else {
        throw new Error(result.error || 'Failed to start generation');
      }

    } catch (error) {
      console.error('🎨 ❌ Generation error:', error);
      handleGenerationError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [isGenerating, connectWebSocket, handleGenerationError]);

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

  return {
    generationStatus,
    currentGeneration,
    generatedImages,
    isGenerating,
    generateImage: handleGenerateImage,
    clearCurrentGeneration,
    deleteImage,
    clearAllImages,
    downloadImage,
    copyImageUrl,
  };
} 