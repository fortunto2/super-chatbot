import { Artifact } from '@/components/create-artifact';
import { CopyIcon, RedoIcon, UndoIcon } from '@/components/icons';
import { VideoEditor } from '@/components/video-editor';
import { toast } from 'sonner';
import { memo, useMemo, useEffect } from 'react';
import { useArtifactWebSocket } from '@/hooks/use-artifact-websocket';

// Import console helpers for debugging (auto-exposes in browser)
import '@/lib/utils/console-helpers';

// Wrapper component that handles the artifact content for VideoEditor
const VideoArtifactWrapper = memo(function VideoArtifactWrapper(props: any) {
  const { content, setArtifact, ...otherProps } = props;
  
  // Memoize parsed content to avoid re-parsing on every render
  const parsedContent = useMemo(() => {
    if (!content) {
      return null; // Don't log for empty content, it's normal during streaming
    }
    
    if (typeof content !== 'string') {
      return null;
    }
    
    try {
      const parsed = JSON.parse(content);
      // Parsed content updated
      return parsed;
    } catch (error) {
      // Only log if content looks like it should be JSON (starts with { or [)
      // Failed to parse content as JSON
      return null;
    }
  }, [content]);

  // Memoize initial state to prevent recreating object on every render
  const initialState = useMemo(() => {
    if (!parsedContent) return undefined;
    
    const state = {
      status: parsedContent.status,
      prompt: parsedContent.prompt,
      negativePrompt: parsedContent.negativePrompt,
      projectId: parsedContent.projectId,
      requestId: parsedContent.requestId,
      timestamp: parsedContent.timestamp,
      message: parsedContent.message,
      videoUrl: parsedContent.videoUrl, // Pass videoUrl from completed state
    };
    
    // Created initial state
    return state;
  }, [parsedContent]);

  // Connect to WebSocket for real-time updates
  const artifactWebSocket = useArtifactWebSocket({
    enabled: !!parsedContent?.projectId && !!parsedContent?.requestId
  });

  // Debug WebSocket connection status
  useEffect(() => {
    if (parsedContent?.projectId && artifactWebSocket.isConnected) {
      // WebSocket connected for artifact
    }
  }, [artifactWebSocket.isConnected, artifactWebSocket.currentProjectId, parsedContent?.projectId, parsedContent?.status]);

  // Auto-notify chat WebSocket about new projectId when artifact is created (fallback)
  useEffect(() => {
    if (parsedContent?.projectId) {
      // Notifying chat WebSocket about projectId
      
      // Use the global notifyNewProject function exposed by console helpers
      const globalWindow = window as any;
      if (globalWindow.notifyNewProject) {
        globalWindow.notifyNewProject(parsedContent.projectId);
      } else {
        // notifyNewProject not available
      }
    }
  }, [parsedContent?.projectId]);

  // Memoize settings to prevent recreating object on every render
  const defaultSettings = useMemo(() => {
    if (!parsedContent?.settings) return undefined;
    
    return {
      resolution: parsedContent.settings.resolution,
      style: parsedContent.settings.style,
      shotSize: parsedContent.settings.shotSize,
      model: parsedContent.settings.model,
      frameRate: parsedContent.settings.frameRate,
      duration: parsedContent.settings.duration,
      negativePrompt: parsedContent.settings.negativePrompt,
      seed: parsedContent.settings.seed,
    };
  }, [parsedContent?.settings]);

  // Memoize VideoEditor props to prevent unnecessary rerenders
  const videoEditorProps = useMemo(() => ({
    chatId: parsedContent?.projectId || otherProps.chatId,
    availableResolutions: otherProps.availableResolutions || [],
    availableStyles: otherProps.availableStyles || [],
    availableShotSizes: otherProps.availableShotSizes || [],
    availableModels: otherProps.availableModels || [],
    availableFrameRates: otherProps.availableFrameRates || [],
    defaultSettings,
    append: otherProps.append,
    setMessages: otherProps.setMessages,
    initialState,
    setArtifact,
  }), [
    parsedContent?.projectId,
    otherProps.chatId,
    otherProps.availableResolutions,
    otherProps.availableStyles,
    otherProps.availableShotSizes,
    otherProps.availableModels,
    otherProps.availableFrameRates,
    otherProps.append,
    otherProps.setMessages,
    defaultSettings,
    initialState,
    setArtifact,
  ]);

  // Handle different content types
  if (!content) {
    return <div>No video content available</div>;
  }

  // If we have valid parsed content, render VideoEditor
  if (parsedContent) {
    return <VideoEditor {...videoEditorProps} />;
  }

  // Handle legacy video format
  let videoUrl: string;
  if (content.startsWith('http://') || content.startsWith('https://')) {
    videoUrl = content;
  } else {
    try {
      // Try to extract URL from various formats
      const urlMatch = content.match(/https?:\/\/[^\s"]+/);
      if (urlMatch) {
        videoUrl = urlMatch[0];
      } else {
        return <div>Invalid video content</div>;
      }
    } catch (error) {
      console.error('🎬 Error processing video content:', error);
      return <div>Error loading video</div>;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Generated Video</h3>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(videoUrl);
              toast.success('Video URL copied to clipboard');
            } catch (error) {
              toast.error('Failed to copy video URL');
            }
          }}
          className="p-1 hover:bg-gray-100 rounded"
          title="Copy video URL"
        >
          <CopyIcon size={16} />
        </button>
      </div>
      <div className="relative">
        <video
          src={videoUrl}
          controls
          className="w-full h-auto rounded-lg border"
          style={{ maxHeight: '70vh' }}
          onError={(e) => {
            console.error('🎬 Video load error:', videoUrl.substring(0, 100));
          }}
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Comprehensive comparison function for memo to prevent video mix-ups
  const changes = {
    content: prevProps.content !== nextProps.content,
    setArtifact: prevProps.setArtifact !== nextProps.setArtifact,
    append: prevProps.append !== nextProps.append,
    setMessages: prevProps.setMessages !== nextProps.setMessages,
    // Check other props that might affect rendering
    chatId: prevProps.chatId !== nextProps.chatId,
    availableResolutions: JSON.stringify(prevProps.availableResolutions) !== JSON.stringify(nextProps.availableResolutions),
    availableStyles: JSON.stringify(prevProps.availableStyles) !== JSON.stringify(nextProps.availableStyles),
    availableShotSizes: JSON.stringify(prevProps.availableShotSizes) !== JSON.stringify(nextProps.availableShotSizes),
    availableModels: JSON.stringify(prevProps.availableModels) !== JSON.stringify(nextProps.availableModels),
    availableFrameRates: JSON.stringify(prevProps.availableFrameRates) !== JSON.stringify(nextProps.availableFrameRates),
  };
  
  // Check if content contains different projectId or requestId
  let contentChanged = changes.content;
  if (!contentChanged && prevProps.content && nextProps.content) {
    try {
      const prevParsed = JSON.parse(prevProps.content);
      const nextParsed = JSON.parse(nextProps.content);
      
      if (prevParsed.projectId !== nextParsed.projectId || 
          prevParsed.requestId !== nextParsed.requestId) {
        // Content has different project/request ID
        contentChanged = true;
      }
    } catch {
      // If parsing fails, fall back to string comparison
      contentChanged = changes.content;
    }
  }
  
  // Only re-render if something meaningful changed
  const shouldUpdate = Object.values(changes).some(Boolean) || contentChanged;
  
  if (shouldUpdate) {
    // VideoArtifactWrapper will re-render
  }
  
  return !shouldUpdate; // Return true to prevent re-render, false to allow it
});

export default function ArtifactContentVideo(props: any) {
  return <VideoArtifactWrapper {...props} />;
}

export const videoArtifact = new Artifact({
  kind: 'video',
  description: 'Useful for video generation with real-time progress tracking',
  content: ArtifactContentVideo,
  actions: [],
  toolbar: [],
  onStreamPart: ({ streamPart, setArtifact }) => {
   
    // Handle text-delta with JSON content from server
    if (streamPart.type === 'text-delta') {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.content as string,
        isVisible: true,
        status: 'streaming',
      }));
    }

    // Handle finish event to complete generation
    if (streamPart.type === 'finish') {
      setArtifact((draftArtifact) => {
        try {
          // Try to parse content and add completion status
          const parsedContent = JSON.parse(draftArtifact.content || '{}');
          
          // If the parsed content has videoUrl, mark as completed with videoUrl
          if (parsedContent.videoUrl || parsedContent.status === 'completed') {
            const updatedContent = {
              ...parsedContent,
              status: 'completed'
            };
            
            return {
              ...draftArtifact,
              content: JSON.stringify(updatedContent),
              status: 'idle',
            };
          }
          
          // For other content, just mark as idle
          return {
            ...draftArtifact,
            status: 'idle',
          };
        } catch (error) {
          // If content is not JSON, just mark as idle
          return {
            ...draftArtifact,
            status: 'idle',
          };
        }
      });
    }
  },
}); 