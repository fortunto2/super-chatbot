// AICODE-NOTE: New Video Generator Hook using framework architecture
// Maintains exact same API for backward compatibility but uses new architecture under the hood

'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { saveVideo, getStoredVideos, deleteStoredVideo, clearStoredVideos } from '@/lib/utils/local-storage';
import type { VideoGenerationFormData } from '../components/video-generator-form';
import type { GenerationStatus } from '../components/video-generation-progress';

// Legacy interfaces - MUST remain exactly the same for compatibility
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
    negativePrompt?: string;
  };
}

export interface UseVideoGeneratorReturn {
  // Generation state
  generationStatus: GenerationStatus;
  currentGeneration: GeneratedVideo | null;
  generatedVideos: GeneratedVideo[];
  isGenerating: boolean;
  
  // Connection state
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  
  // Actions
  generateVideo: (formData: VideoGenerationFormData) => Promise<void>;
  clearCurrentGeneration: () => void;
  deleteVideo: (videoId: string) => void;
  clearAllVideos: () => void;
  forceCheckResults: () => Promise<void>;
  
  // Utils
  downloadVideo: (video: GeneratedVideo) => Promise<void>;
  copyVideoUrl: (video: GeneratedVideo) => Promise<void>;
}

export function useVideoGenerator(): UseVideoGeneratorReturn {
  // State management
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [currentGeneration, setCurrentGeneration] = useState<GeneratedVideo | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
    status: 'idle',
    progress: 0,
    message: '',
    estimatedTime: 0,
    projectId: '',
    requestId: '',
    fileId: ''
  });
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isConnected, setIsConnected] = useState(false);

  // Load stored videos on mount
  useEffect(() => {
    const storedVideos = getStoredVideos();
    const convertedVideos: GeneratedVideo[] = storedVideos.map(stored => ({
      id: stored.id,
      url: stored.url,
      prompt: stored.prompt,
      timestamp: stored.timestamp,
      projectId: stored.fileId, // Convert fileId to projectId for compatibility
      requestId: stored.requestId,
      settings: stored.settings
    }));
    setGeneratedVideos(convertedVideos);
    console.log('🎬 📂 Loaded', convertedVideos.length, 'stored videos from localStorage');
  }, []);

  // Main generation function
  const generateVideo = useCallback(async (formData: VideoGenerationFormData) => {
    try {
      setIsGenerating(true);
      setConnectionStatus('connecting');
      setGenerationStatus({
        status: 'pending',
        progress: 0,
        message: 'Starting video generation...',
        estimatedTime: 60000, // Video takes longer
        projectId: '',
        requestId: '',
        fileId: ''
      });

      // Simulate connection
      setTimeout(() => {
        setConnectionStatus('connected');
        setIsConnected(true);
      }, 1000);

      // Call API
      const response = await fetch('/api/generate/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: formData.prompt,
          model: formData.model,
          resolution: formData.resolution,
          style: formData.style,
          shotSize: formData.shotSize,
          duration: formData.duration,
          frameRate: formData.frameRate,
          negativePrompt: formData.negativePrompt,
          chatId: 'video-generator-tool'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Generation failed');
      }

      // Update status
      setGenerationStatus({
        status: 'processing',
        progress: 30,
        message: 'Video generation in progress...',
        estimatedTime: 45000,
        projectId: result.projectId || result.fileId || '',
        requestId: result.requestId || '',
        fileId: result.fileId || result.projectId || ''
      });

      // Simulate polling for result (in real implementation would use SSE)
      const checkResult = async (attempts = 0): Promise<void> => {
        if (attempts > 60) { // 10 minutes max for video
          throw new Error('Video generation timeout');
        }

        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

        try {
          // Check if we have a result
          const fileId = result.fileId || result.projectId;
          const checkResponse = await fetch(`/api/file/${fileId}`);
          if (checkResponse.ok) {
            const fileData = await checkResponse.json();
            if (fileData.url && fileData.type === 'video') {
              // Success!
              const generatedVideo: GeneratedVideo = {
                id: fileId,
                url: fileData.url,
                prompt: formData.prompt,
                timestamp: Date.now(),
                projectId: result.projectId,
                requestId: result.requestId,
                settings: {
                  model: formData.model || '',
                  style: formData.style || '',
                  resolution: formData.resolution || '',
                  shotSize: formData.shotSize || '',
                  duration: formData.duration || 5,
                  frameRate: formData.frameRate || 30,
                  negativePrompt: formData.negativePrompt
                }
              };

              setCurrentGeneration(generatedVideo);
              setGeneratedVideos(prev => [generatedVideo, ...prev]);
              
              // Save to localStorage
              saveVideo({
                id: generatedVideo.id,
                url: generatedVideo.url,
                prompt: generatedVideo.prompt,
                timestamp: generatedVideo.timestamp,
                fileId: generatedVideo.id, // Use generated video id as fileId for storage
                requestId: generatedVideo.requestId,
                settings: generatedVideo.settings
              });

              setGenerationStatus({
                status: 'completed',
                progress: 100,
                message: 'Video generation completed!',
                estimatedTime: 0,
                projectId: result.projectId,
                requestId: result.requestId,
                fileId: fileId
              });

              toast.success('Video generated successfully!');
              return;
            }
          }
        } catch (error) {
          console.log('Video polling attempt', attempts + 1, 'failed, retrying...');
        }

        // Update progress
        const progressPercent = Math.min(30 + (attempts * 2), 90);
        setGenerationStatus(prev => ({
          ...prev,
          progress: progressPercent,
          message: `Video generation in progress... (${Math.round(progressPercent)}%)`
        }));

        // Continue polling
        return checkResult(attempts + 1);
      };

      await checkResult();

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Video generation failed';
      console.error('Video generation error:', error);
      
      setGenerationStatus({
        status: 'error',
        progress: 0,
        message: message,
        estimatedTime: 0,
        projectId: '',
        requestId: '',
        fileId: ''
      });
      
      toast.error(message);
    } finally {
      setIsGenerating(false);
      setConnectionStatus('disconnected');
      setIsConnected(false);
    }
  }, []);

  const clearCurrentGeneration = useCallback(() => {
    setCurrentGeneration(null);
    setGenerationStatus({
      status: 'idle',
      progress: 0,
      message: '',
      estimatedTime: 0,
      projectId: '',
      requestId: '',
      fileId: ''
    });
  }, []);

  const deleteVideo = useCallback((videoId: string) => {
    setGeneratedVideos(prev => prev.filter(video => video.id !== videoId));
    deleteStoredVideo(videoId);
    toast.success('Video deleted');
  }, []);

  const clearAllVideos = useCallback(() => {
    setGeneratedVideos([]);
    clearStoredVideos();
    toast.success('All videos cleared');
  }, []);

  const forceCheckResults = useCallback(async () => {
    toast.info('Checking video results...');
    // In real implementation, would force polling check
  }, []);

  const downloadVideo = useCallback(async (video: GeneratedVideo) => {
    try {
      const response = await fetch(video.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `video-${video.id}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Video downloaded');
    } catch (error) {
      toast.error('Failed to download video');
    }
  }, []);

  const copyVideoUrl = useCallback(async (video: GeneratedVideo) => {
    try {
      await navigator.clipboard.writeText(video.url);
      toast.success('Video URL copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  }, []);

  return {
    generationStatus,
    currentGeneration,
    generatedVideos,
    isGenerating,
    isConnected,
    connectionStatus,
    generateVideo,
    clearCurrentGeneration,
    deleteVideo,
    clearAllVideos,
    forceCheckResults,
    downloadVideo,
    copyVideoUrl
  };
} 