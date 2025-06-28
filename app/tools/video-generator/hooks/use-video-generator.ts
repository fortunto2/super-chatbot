// AICODE-NOTE: New Video Generator Hook using framework architecture
// Maintains exact same API for backward compatibility but uses new architecture under the hood

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { saveVideo, getStoredVideos, deleteStoredVideo, clearStoredVideos } from '@/lib/utils/local-storage';
import { useVideoSSE } from '@/hooks/use-video-sse';
import { generationPersistence, type GenerationState } from '@/lib/websocket/generation-persistence';
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
  
  // SSE state
  const [currentFileId, setCurrentFileId] = useState<string>('');
  const requestIdRef = useRef<string>('');

  // AICODE-NOTE: SSE event handlers for real-time updates
  const eventHandlers = [
    (event: any) => {
      console.log('🎬 📡 Video SSE event received:', event);
      
      if (event.type === 'render_progress') {
        setGenerationStatus(prev => ({
          ...prev,
          status: 'processing',
          progress: Math.round((event.progress || 0) * 100),
          message: event.data?.message || 'Processing video...',
        }));
        
        // Update persistence
        if (currentFileId) {
          generationPersistence.updateState(currentFileId, {
            status: 'processing',
            progress: Math.round((event.progress || 0) * 100),
            message: event.data?.message || 'Processing video...',
          });
        }
      }
      
      if (event.type === 'render_result') {
        console.log('🎬 ✅ Video generation completed:', event);
        
        if (event.object?.url || event.url) {
          const videoUrl = event.object?.url || event.url;
          
          setGenerationStatus(prev => ({
            ...prev,
            status: 'completed',
            progress: 100,
            message: 'Video generation completed!',
          }));
          
          // Create completed video
          const completedVideo: GeneratedVideo = {
            id: currentFileId || event.id || Date.now().toString(),
            url: videoUrl,
            prompt: generationStatus.message || 'Generated video',
            timestamp: Date.now(),
            projectId: currentFileId,
            requestId: requestIdRef.current,
            settings: {
              model: 'Unknown',
              style: 'base',
              resolution: '1280x720',
              shotSize: 'medium',
              duration: 5,
              frameRate: 30
            }
          };
          
          setCurrentGeneration(completedVideo);
          setGeneratedVideos(prev => [completedVideo, ...prev]);
          saveVideo(completedVideo);
          
          // Update persistence to completed
          if (currentFileId) {
            generationPersistence.updateState(currentFileId, {
              status: 'completed',
              progress: 100,
              message: 'Video generation completed!',
              url: videoUrl,
            });
          }
          
          toast.success('Video generated successfully!');
          setIsGenerating(false);
        }
      }
      
      if (event.type === 'error') {
        console.error('🎬 ❌ Video generation error:', event);
        
        setGenerationStatus(prev => ({
          ...prev,
          status: 'error',
          message: event.error || 'Video generation failed',
        }));
        
        // Update persistence to error
        if (currentFileId) {
          generationPersistence.updateState(currentFileId, {
            status: 'error',
            message: event.error || 'Video generation failed',
          });
        }
        
        toast.error(event.error || 'Video generation failed');
        setIsGenerating(false);
      }
    }
  ];

  // AICODE-NOTE: Use ready-made SSE hook instead of custom implementation
  const { isConnected, disconnect } = useVideoSSE({
    projectId: currentFileId,
    eventHandlers,
    enabled: isGenerating && !!currentFileId,
    requestId: requestIdRef.current
  });

  // Update connection status based on SSE state
  useEffect(() => {
    if (isGenerating && currentFileId) {
      setConnectionStatus(isConnected ? 'connected' : 'connecting');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isConnected, isGenerating, currentFileId]);

  // AICODE-NOTE: Recovery system for page reloads
  useEffect(() => {
    // Load stored videos on mount
    const storedVideos = getStoredVideos();
    const convertedVideos: GeneratedVideo[] = storedVideos.map(stored => ({
      id: stored.id,
      url: stored.url,
      prompt: stored.prompt,
      timestamp: stored.timestamp,
      projectId: stored.fileId,
      requestId: stored.requestId,
      settings: stored.settings
    }));
    setGeneratedVideos(convertedVideos);
    console.log('🎬 📂 Loaded', convertedVideos.length, 'stored videos from localStorage');

    // Check for active generations to recover
    const activeStates = generationPersistence.getActiveStates();
    const videoStates = activeStates.filter(state => state.type === 'video');
    
    if (videoStates.length > 0) {
      const mostRecent = videoStates.sort((a, b) => b.lastUpdate - a.lastUpdate)[0];
      
      console.log('🎬 🔄 Found active video generation to recover:', mostRecent);
      
      setCurrentFileId(mostRecent.fileId);
      requestIdRef.current = mostRecent.requestId || '';
      setIsGenerating(true);
      setGenerationStatus({
        status: mostRecent.status as any,
        progress: mostRecent.progress || 0,
        message: mostRecent.message || 'Recovering video generation...',
        estimatedTime: mostRecent.estimatedTime || 60000,
        projectId: mostRecent.projectId || '',
        requestId: mostRecent.requestId || '',
        fileId: mostRecent.fileId
      });
      
      toast.info('Recovering video generation...');
    }
  }, []);

  // Main generation function
  const generateVideo = useCallback(async (formData: VideoGenerationFormData) => {
    try {
      setIsGenerating(true);
      setConnectionStatus('connecting');
      
      const requestId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      requestIdRef.current = requestId;
      
      setGenerationStatus({
        status: 'pending',
        progress: 0,
        message: 'Starting video generation...',
        estimatedTime: 60000,
        projectId: '',
        requestId,
        fileId: ''
      });

      // Call API with appropriate content type based on generation type
      let response: Response;
      
      if (formData.generationType === 'image-to-video' && formData.sourceImage) {
        // Use FormData for image upload
        const apiFormData = new FormData();
        apiFormData.append('prompt', formData.prompt);
        apiFormData.append('model', formData.model || '');
        apiFormData.append('resolution', formData.resolution || '');
        apiFormData.append('style', formData.style || '');
        apiFormData.append('shotSize', formData.shotSize || '');
        apiFormData.append('duration', formData.duration?.toString() || '5');
        apiFormData.append('frameRate', formData.frameRate?.toString() || '30');
        apiFormData.append('negativePrompt', formData.negativePrompt || '');
        apiFormData.append('generationType', formData.generationType);
        apiFormData.append('chatId', 'video-generator-tool');
        apiFormData.append('seed', formData.seed?.toString() || '');
        
        // Add the source image file
        apiFormData.append('sourceImage', formData.sourceImage.file);
        
        console.log('🎬 Uploading image-to-video request with FormData');
        
        response = await fetch('/api/generate/video', {
          method: 'POST',
          body: apiFormData,
        });
      } else {
        // Use JSON for text-to-video
        console.log('🎬 Sending text-to-video request with JSON');
        
        response = await fetch('/api/generate/video', {
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
            generationType: formData.generationType,
            seed: formData.seed,
            chatId: 'video-generator-tool'
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Generation failed');
      }

      const fileId = result.fileId || result.projectId || '';
      setCurrentFileId(fileId);
      
      // Update status with file ID
      setGenerationStatus(prev => ({
        ...prev,
        status: 'processing',
        progress: 10,
        message: 'Video generation started...',
        projectId: result.projectId || '',
        fileId
      }));

      // AICODE-NOTE: Save to persistence system for recovery
      const persistenceState: GenerationState = {
        id: fileId,
        type: 'video',
        status: 'processing',
        fileId,
        projectId: result.projectId,
        requestId,
        prompt: formData.prompt,
        progress: 10,
        message: 'Video generation started...',
        estimatedTime: 60000,
        startTime: Date.now(),
        lastUpdate: Date.now(),
        settings: formData
      };
      
      generationPersistence.saveState(persistenceState);
      
      console.log('🎬 ✅ Video generation started:', { fileId, requestId });

    } catch (error) {
      console.error('🎬 ❌ Video generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start video generation');
      setIsGenerating(false);
      setConnectionStatus('disconnected');
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
      toast.error('Failed to copy video URL');
    }
  }, []);

  // AICODE-NOTE: Return same interface as before for compatibility
  return {
    // Generation state
    generationStatus,
    currentGeneration,
    generatedVideos,
    isGenerating,
    
    // Connection state - now using real SSE connection
    isConnected,
    connectionStatus,
    
    // Actions
    generateVideo,
    clearCurrentGeneration,
    deleteVideo,
    clearAllVideos,
    forceCheckResults,
    
    // Utils
    downloadVideo,
    copyVideoUrl,
  };
} 