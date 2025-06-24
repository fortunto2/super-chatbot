'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { generateVideo } from '@/lib/ai/api/generate-video';
import { getVideoGenerationConfig } from '@/lib/config/media-settings-factory';
import type { VideoGenerationFormData } from '../components/video-generator-form';
import type { GenerationStatus } from '../../image-generator/components/generation-progress';

// AICODE-NOTE: Generated video data structure
export interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  fileId?: string; // Use fileId as primary identifier
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
  
  // Connection state
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  
  // Actions
  generateVideo: (formData: VideoGenerationFormData) => Promise<void>;
  clearCurrentGeneration: () => void;
  deleteVideo: (videoId: string) => void;
  clearAllVideos: () => void;
  forceCheckResults: () => Promise<void>; // AICODE-NOTE: Added manual check function
  
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
  
  // AICODE-NOTE: Connection state for SSE  
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isConnected, setIsConnected] = useState(false);
  
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



  // AICODE-NOTE: Simple file-based polling (like image generator)
  const startPolling = useCallback((fileId: string) => {
    console.log('📊 Starting polling for video file:', fileId);
    
    const poll = async () => {
      try {
        const { FileService } = await import('@/lib/api');
        const fileDetails = await FileService.fileGetById({ id: fileId });
        
        if (fileDetails.url) {
          console.log('📊 ✅ Video file ready:', fileDetails.url);
          handleGenerationSuccess(fileDetails.url, fileId);
          return;
        }
        
        // If no URL yet, continue polling
        console.log('📊 Video file not ready yet, continuing to poll...');
        pollingRef.current = setTimeout(poll, 3000);
        
      } catch (error) {
        console.error('📊 ❌ Video polling error:', error);
        handleGenerationError('Failed to check video generation status');
      }
    };

    poll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // AICODE-NOTE: Legacy project-based polling (kept for compatibility)
  const startProjectPolling = useCallback((projectId: string) => {
    console.log('📊 Starting legacy polling for video project:', projectId);
    
    const poll = async () => {
      try {
        // AICODE-NOTE: Use OpenAPI client directly like image-generator
        const { ProjectService, TaskStatusEnum } = await import('@/lib/api');
        
        const project = await ProjectService.projectGetById({ id: projectId });
        console.log('📊 Polling video project:', project.id, 'tasks:', project.tasks?.length);

        // Check task statuses to determine overall project status
        const hasErrorTask = project.tasks?.some((task: any) => task.status === TaskStatusEnum.ERROR);
        const allCompleted = project.tasks?.length > 0 && project.tasks.every((task: any) => task.status === TaskStatusEnum.COMPLETED);
        
        if (allCompleted) {
          console.log('📊 All tasks completed, looking for video data...');
          
          // Look for video data in project.data
          const videoData = project.data?.find((data: any) => {
            if (data.value && typeof data.value === 'object') {
              const value = data.value as Record<string, any>;
              const hasUrl = !!value.url;
              const isVideo = value.contentType?.startsWith('video/') ||
                             value.url?.match(/\.(mp4|mov|webm|avi|mkv)$/i);
              
              console.log('📊 Checking data entry:', {
                hasUrl,
                isVideo,
                contentType: value.contentType,
                url: value.url ? `${value.url.substring(0, 50)}...` : 'none'
              });
              
              return hasUrl && isVideo;
            }
            return false;
          });
          
          if (videoData?.value && typeof videoData.value === 'object') {
            const videoUrl = (videoData.value as Record<string, any>).url as string;
            console.log('📊 ✅ Video generation completed:', videoUrl);
            handleGenerationSuccess(videoUrl, projectId);
            return; // Stop polling
          }
          
          // Fallback: look for any data with URL and assume it might be video
          const anyDataWithUrl = project.data?.find((data: any) => {
            return data.value && typeof data.value === 'object' && (data.value as any).url;
          });
          
          if (anyDataWithUrl?.value && typeof anyDataWithUrl.value === 'object') {
            const url = (anyDataWithUrl.value as Record<string, any>).url as string;
            console.log('📊 ✅ Video generation completed (fallback):', url);
            console.log('📊 ⚠️ Content type unknown, assuming video');
            handleGenerationSuccess(url, projectId);
            return; // Stop polling
          }
          
          // No data found but tasks completed - might be a delay
          console.log('📊 ⚠️ Tasks completed but no data found, continuing to poll...');
        }
        
        if (hasErrorTask) {
          console.log('📊 ❌ Video generation failed: task error');
          handleGenerationError('Video generation failed: task error');
          return; // Stop polling
        }
        
        // Continue polling if still in progress
        const hasInProgress = project.tasks?.some((task: any) => task.status === TaskStatusEnum.IN_PROGRESS);
        if (hasInProgress || project.tasks?.length === 0) {
          pollingRef.current = setTimeout(poll, 3000); // Video polls every 3 seconds
        } else {
          // No tasks in progress but not all completed - something went wrong
          console.log('📊 ❌ Video generation stalled:', project.tasks?.map((t: any) => t.status));
          handleGenerationError('Video generation process stalled');
        }
        
      } catch (error) {
        console.error('📊 ❌ Video polling error:', error);
        handleGenerationError('Failed to check video generation status');
      }
    };

    poll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // AICODE-NOTE: Handle successful generation
  const handleGenerationSuccess = useCallback((videoUrl: string, fileId?: string) => {
    cleanup();
    
    const newVideo: GeneratedVideo = {
      id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: videoUrl,
      prompt: generationStatus.message || 'Generated video',
      timestamp: Date.now(),
      fileId,
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

  // AICODE-NOTE: SSE connection for real-time updates (matching image generator pattern)
  const connectSSE = useCallback(async (connectionId: string, fileId?: string) => {
    console.log('🎬 Connecting SSE for video:', { connectionId, fileId });
    
    try {
      // Force SuperDuperAI config (avoid localhost routing)
      const baseUrl = process.env.NEXT_PUBLIC_SUPERDUPERAI_URL || 'https://dev-editor.superduperai.co';
      const config = {
        url: baseUrl,
        token: process.env.NEXT_PUBLIC_SUPERDUPERAI_TOKEN || '',
        wsURL: baseUrl.replace('https://', 'wss://').replace('http://', 'ws://')
      };
      
      // Use fileId if available, otherwise fall back to connectionId (projectId)
      const eventId = fileId || connectionId;
      const sseUrl = `${config.url}/api/v1/events/file.${eventId}`;
      
      console.log('🎬 SSE URL constructed:', sseUrl);
      
      setConnectionStatus('connecting');
      setIsConnected(false);
      
      const eventSource = new EventSource(sseUrl);
      wsRef.current = eventSource; // Keep same ref name for compatibility

      eventSource.onopen = () => {
        console.log('🎬 SSE connected for video:', { connectionId, fileId });
        setConnectionStatus('connected');
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('🎬 Video SSE event received:', message.type, 'for connection:', connectionId);

          if (message.type === 'render_progress') {
            setGenerationStatus(prev => ({
              ...prev,
              status: 'processing',
              progress: message.object?.progress || 0,
              message: message.object?.message,
            }));
          } else if (message.type === 'render_result') {
            const videoUrl = message.object?.url || message.object?.file_url;
            if (videoUrl) {
              handleGenerationSuccess(videoUrl, connectionId);
            } else {
              handleGenerationError('No video URL in result');
            }
          } else if (message.type === 'file' && message.object?.url) {
            const videoUrl = message.object.url;
            
            // Check if it's a video file
            if (videoUrl.match(/\.(mp4|mov|webm|avi|mkv)$/i) || 
                message.object.contentType?.startsWith('video/')) {
              console.log('🎬 ✅ Video completed via file event:', videoUrl);
              handleGenerationSuccess(videoUrl, connectionId);
            }
          } else if (message.type === 'task_status' && message.object?.status === 'COMPLETED') {
            console.log('📡 Task completed, triggering polling check');
            startPolling(connectionId);
          } else {
            console.log('🎬 SSE event not handled:', message.type);
          }
        } catch (error) {
          console.error('🎬 SSE message parse error:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('🎬 SSE error:', error);
        
        if (eventSource.readyState === EventSource.CLOSED) {
          setConnectionStatus('disconnected');
          setIsConnected(false);
          startPolling(connectionId);
        }
      };

      // Fallback timeout (60s for video - longer than image)
      setTimeout(() => {
        if (eventSource.readyState !== EventSource.OPEN) {
          console.log('🎬 SSE connection timeout, falling back to polling');
          startPolling(connectionId);
        }
      }, 60000);

    } catch (error) {
      console.error('🎬 SSE connection failed:', error);
      setConnectionStatus('disconnected');
      setIsConnected(false);
      startPolling(connectionId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      // AICODE-NOTE: Load configuration to get proper objects for API call
      const config = await getVideoGenerationConfig();
      
      // Find the selected model
      const selectedModel = config.availableModels.find(m => m.name === formData.model) || config.defaultSettings.model;
      
      // Find the selected resolution
      const selectedResolution = config.availableResolutions.find(r => r.label === formData.resolution) || config.defaultSettings.resolution;
      
      // Find the selected style
      const selectedStyle = config.availableStyles.find(s => s.id === formData.style) || config.defaultSettings.style;
      
      // Find the selected shot size
      const selectedShotSize = config.availableShotSizes.find(s => s.id === formData.shotSize) || config.defaultSettings.shotSize;

      // AICODE-NOTE: Call existing SuperDuperAI video API with proper parameters
      const result = await generateVideo(
        selectedStyle,
        selectedResolution,
        formData.prompt,
        selectedModel,
        selectedShotSize,
        'video-generator-tool', // Use tool identifier as chatId
        formData.negativePrompt,
        formData.frameRate || 30,
        formData.duration || 5
      );

      console.log('🎬 ✅ Generation API response:', result);

      if (result.success) {
        // Extract fileId from result - could be in fileId or projectId field
        const fileId = result.fileId || result.projectId;
        
        if (fileId) {
          setGenerationStatus(prev => ({
            ...prev,
            status: 'processing',
            fileId: fileId,
            requestId: result.requestId,
          }));

          // Use fileId for SSE connection
          await connectSSE(fileId, result.requestId);
        } else {
          throw new Error('No file ID returned from video generation API');
        }
        
      } else {
        throw new Error(result.error || 'Failed to start generation');
      }

    } catch (error) {
      console.error('🎬 ❌ Generation error:', error);
      handleGenerationError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [isGenerating, connectSSE, handleGenerationError]);

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

  // AICODE-NOTE: Force check for completed videos manually (simplified file-based approach)
  const forceCheckResults = useCallback(async () => {
    const fileId = generationStatus.fileId;
    
    if (!fileId) {
      toast.warning('No active video generation to check');
      return;
    }
    
    console.log('🔍 Force checking video results for file:', fileId);
    toast.info('Checking for video results...');
    
    try {
      // Use simple file-based checking like image generator
      const { FileService } = await import('@/lib/api');
      const fileDetails = await FileService.fileGetById({ id: fileId });
      
      if (fileDetails.url) {
        console.log('🔍 ✅ Video file ready:', fileDetails.url);
        handleGenerationSuccess(fileDetails.url, fileId);
        toast.success('Video results retrieved!');
        return;
      }
      
      // If no URL yet, start polling
      console.log('🔍 Video file not ready yet, starting polling...');
      startPolling(fileId);
      toast.info('Video generation still in progress, polling started');
      
    } catch (error) {
      console.error('🔍 ❌ Force check error:', error);
      toast.error('Failed to check video results');
    }
  }, [generationStatus.fileId, handleGenerationSuccess, startPolling]);

  return {
    generationStatus,
    currentGeneration,
    generatedVideos,
    isGenerating,
    isConnected,
    connectionStatus,
    generateVideo: handleGenerateVideo,
    clearCurrentGeneration,
    deleteVideo,
    clearAllVideos,
    forceCheckResults,
    downloadVideo,
    copyVideoUrl,
  };
} 