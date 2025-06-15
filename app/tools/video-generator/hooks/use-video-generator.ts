'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { generateVideo } from '@/lib/ai/api/generate-video';
import type { VideoGenerationFormData } from '../components/video-generator-form';
import type { GenerationStatus } from '../../image-generator/components/generation-progress';

// AICODE-NOTE: Generated video data structure
export interface GeneratedVideo {
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
    duration: number;
    frameRate: number;
    seed?: number;
  };
}

export interface UseVideoGeneratorReturn {
  // Generation state
  generationStatus: GenerationStatus;
  currentGeneration: GeneratedVideo | null;
  generatedVideos: GeneratedVideo[];
  isGenerating: boolean;
  
  // Actions
  generateVideo: (formData: VideoGenerationFormData) => Promise<void>;
  clearCurrentGeneration: () => void;
  deleteVideo: (videoId: string) => void;
  clearAllVideos: () => void;
  
  // Utils
  downloadVideo: (video: GeneratedVideo) => Promise<void>;
  copyVideoUrl: (video: GeneratedVideo) => Promise<void>;
}

export function useVideoGenerator(): UseVideoGeneratorReturn {
  // AICODE-NOTE: State management for video generation
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
    status: 'idle'
  });
  
  const [currentGeneration, setCurrentGeneration] = useState<GeneratedVideo | null>(null);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  
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
        console.log('🔌 WebSocket connected for video project:', projectId);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📡 Video WebSocket message:', message);

          if (message.type === 'render_progress') {
            setGenerationStatus(prev => ({
              ...prev,
              status: 'processing',
              progress: message.object?.progress || 0,
              message: message.object?.message,
            }));
          } else if (message.type === 'render_result') {
            // Generation completed
            const videoUrl = message.object?.url || message.object?.file_url;
            if (videoUrl) {
              handleGenerationSuccess(videoUrl, projectId);
            } else {
              handleGenerationError('No video URL in result');
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
        console.log('📡 WebSocket closed for video project:', projectId);
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
    console.log('📊 Starting polling for video project:', projectId);
    
    const poll = async () => {
      try {
        // AICODE-TODO: Implement proper polling API call
        // For now, simulate with timeout
        pollingRef.current = setTimeout(() => {
          // This would be replaced with actual API call
          console.log('📊 Polling video project status...');
          poll();
        }, 3000);
        
      } catch (error) {
        console.error('📊 ❌ Polling error:', error);
        handleGenerationError('Polling failed');
      }
    };

    poll();
  }, []);

  // AICODE-NOTE: Handle successful generation
  const handleGenerationSuccess = useCallback((videoUrl: string, projectId?: string) => {
    cleanup();
    
    const newVideo: GeneratedVideo = {
      id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: videoUrl,
      prompt: generationStatus.message || 'Generated video',
      timestamp: Date.now(),
      projectId,
      settings: {
        model: 'Unknown',
        style: 'Unknown',
        resolution: 'Unknown',
        shotSize: 'Unknown',
        duration: 5,
        frameRate: 30,
      }
    };

    setCurrentGeneration(newVideo);
    setGeneratedVideos(prev => [newVideo, ...prev]);
    
    setGenerationStatus({
      status: 'completed',
      message: 'Video generated successfully!'
    });

    toast.success('Video generated successfully!');
  }, [generationStatus.message, cleanup]);

  // AICODE-NOTE: Handle generation error
  const handleGenerationError = useCallback((error: string) => {
    cleanup();
    
    setGenerationStatus({
      status: 'error',
      message: error
    });

    toast.error(`Video generation failed: ${error}`);
  }, [cleanup]);

  // AICODE-NOTE: Main generation function
  const handleGenerateVideo = useCallback(async (formData: VideoGenerationFormData) => {
    if (isGenerating) {
      toast.warning('Video generation already in progress');
      return;
    }

    try {
      setGenerationStatus({
        status: 'pending',
        progress: 0,
        message: `Generating video: ${formData.prompt}`,
      });

      setCurrentGeneration(null);

      console.log('🎬 Starting video generation with data:', formData);

      // AICODE-NOTE: Call existing SuperDuperAI video API
      const result = await generateVideo({
        prompt: formData.prompt,
        negativePrompt: formData.negativePrompt || '',
        style: formData.style || 'realistic',
        resolution: formData.resolution || '1344x768',
        shotSize: formData.shotSize || 'medium-shot',
        model: formData.model || 'ltx',
        frameRate: formData.frameRate || 30,
        duration: formData.duration || 5,
        seed: formData.seed,
        chatId: 'video-generator-tool', // Use tool identifier as chatId
      });

      console.log('🎬 ✅ Generation API response:', result);

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
      console.error('🎬 ❌ Generation error:', error);
      handleGenerationError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [isGenerating, connectWebSocket, handleGenerationError]);

  // AICODE-NOTE: Clear current generation
  const clearCurrentGeneration = useCallback(() => {
    setCurrentGeneration(null);
    setGenerationStatus({ status: 'idle' });
    cleanup();
  }, [cleanup]);

  // AICODE-NOTE: Delete video from history
  const deleteVideo = useCallback((videoId: string) => {
    setGeneratedVideos(prev => prev.filter(video => video.id !== videoId));
    
    // Clear current generation if it matches
    if (currentGeneration?.id === videoId) {
      clearCurrentGeneration();
    }
    
    toast.success('Video deleted');
  }, [currentGeneration?.id, clearCurrentGeneration]);

  // AICODE-NOTE: Clear all videos
  const clearAllVideos = useCallback(() => {
    setGeneratedVideos([]);
    clearCurrentGeneration();
    toast.success('All videos cleared');
  }, [clearCurrentGeneration]);

  // AICODE-NOTE: Download video function
  const downloadVideo = useCallback(async (video: GeneratedVideo) => {
    try {
      const response = await fetch(video.url);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `generated-video-${video.id}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Video downloaded');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download video');
    }
  }, []);

  // AICODE-NOTE: Copy video URL to clipboard
  const copyVideoUrl = useCallback(async (video: GeneratedVideo) => {
    try {
      await navigator.clipboard.writeText(video.url);
      toast.success('Video URL copied to clipboard');
    } catch (error) {
      console.error('Copy error:', error);
      toast.error('Failed to copy video URL');
    }
  }, []);

  return {
    generationStatus,
    currentGeneration,
    generatedVideos,
    isGenerating,
    generateVideo: handleGenerateVideo,
    clearCurrentGeneration,
    deleteVideo,
    clearAllVideos,
    downloadVideo,
    copyVideoUrl,
  };
} 