import { Artifact } from '@/components/create-artifact';
import { CopyIcon, ShareIcon, UndoIcon, RedoIcon } from '@/components/icons';
import { VideoEditor } from '@/components/video-editor';
import { toast } from 'sonner';
import { memo, useMemo, useEffect } from 'react';
import { useArtifactSSE } from '@/hooks/use-artifact-sse';
import { generateUUID } from '@/lib/utils';

// Import console helpers for debugging (auto-exposes in browser)
import '@/lib/utils/console-helpers';

// Function to save video to chat history
const saveVideoToChat = async (
  chatId: string,
  videoUrl: string,
  prompt: string,
  setMessages: any,
  thumbnailUrl?: string
) => {
  try {
    // Check for duplicates
    let videoExists = false;
    setMessages((prevMessages: any[]) => {
      videoExists = prevMessages.some((message) =>
        message.experimental_attachments?.some(
          (attachment: any) => attachment.url === videoUrl,
        ),
      );
      return prevMessages;
    });

    if (videoExists) {
      console.log('🎬 Video already exists in chat, skipping duplicate save');
      return;
    }

    const videoAttachment = {
      name: prompt.length > 50 ? `${prompt.substring(0, 50)}...` : prompt,
      url: videoUrl,
      contentType: 'video/mp4',
      thumbnailUrl: thumbnailUrl, // Add thumbnail for preview
    };

    const videoMessage = {
      id: generateUUID(),
      role: 'assistant' as const,
      // content: `Generated video: "${prompt}"`,
      content: ``,
      parts: [
        {
          type: 'text' as const,
          // text: `Generated video: "${prompt}"`,
          text: ``,
        },
      ],
      experimental_attachments: [videoAttachment],
      createdAt: new Date(),
    };

    setMessages((prevMessages: any[]) => [...prevMessages, videoMessage]);
    console.log('🎬 ✅ Video added to chat history!');

    // Save to database
    try {
      const response = await fetch('/api/save-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          message: {
            id: videoMessage.id,
            role: videoMessage.role,
            parts: videoMessage.parts,
            attachments: videoMessage.experimental_attachments,
            createdAt: videoMessage.createdAt,
          },
        }),
      });

      if (response.ok) {
        console.log('🎬 ✅ Video saved to database!');
      } else {
        console.warn('🎬 ⚠️ Failed to save to database, but video is in chat locally');
      }
    } catch (dbError) {
      console.warn('🎬 ⚠️ Database save failed:', dbError);
    }
  } catch (error) {
    console.error('🎬 ❌ Failed to save video to chat:', error);
  }
};

// Wrapper component that handles the artifact content for VideoEditor
const VideoArtifactWrapper = memo(function VideoArtifactWrapper(props: any) {
  const { content, setArtifact, ...otherProps } = props;
  
      // Memoize parsed content to avoid re-parsing on every render
    const parsedContent = useMemo(() => {
      if (!content || typeof content !== 'string') {
        return null;
      }
      
      try {
        return JSON.parse(content);
      } catch (error) {
        return null;
      }
    }, [content]);

      // Memoize initial state to prevent recreating object on every render
    const initialState = useMemo(() => {
      if (!parsedContent) return undefined;
      
      return {
        status: parsedContent.status,
        prompt: parsedContent.prompt,
        negativePrompt: parsedContent.negativePrompt,
        fileId: parsedContent.fileId,
        requestId: parsedContent.requestId,
        timestamp: parsedContent.timestamp,
        message: parsedContent.message,
        videoUrl: parsedContent.videoUrl,
      };
    }, [parsedContent]);

  // Connect to SSE for real-time updates (using fileId)
  const artifactSSE = useArtifactSSE({
    channel: parsedContent?.fileId ? `file.${parsedContent.fileId}` : '',
    eventHandlers: parsedContent?.fileId ? [(message) => {
      console.log('🎬 Artifact SSE message:', message);
      
      // Handle video completion events
      if (message.type === 'file' && message.object?.url && message.object?.type === 'video') {
        const videoUrl = message.object.url;
        const thumbnailUrl = message.object.thumbnail_url;
        
        console.log('🎬 Video completed via SSE:', `${videoUrl.substring(0, 50)}...`);
        
        // Update artifact with completed video
        if (setArtifact) {
          setArtifact((current: any) => {
            const currentContent = typeof current.content === 'string' ? 
              JSON.parse(current.content || '{}') : current.content;
            
            const updatedContent = {
              ...currentContent,
              status: 'completed',
              videoUrl: videoUrl,
              thumbnailUrl: thumbnailUrl,
              timestamp: Date.now(),
              message: 'Video generation completed!'
            };
            
            return {
              ...current,
              content: JSON.stringify(updatedContent),
              status: 'idle' as const
            };
          });
        }

        if (otherProps.documentId) {
          fetch(`/api/document?id=${otherProps.documentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ thumbnailUrl, metadata: { videoUrl } }),
          }).catch((err) => console.error('Failed to update thumbnail', err));
        }

        // Auto-save video to chat history if we have required data
        if (otherProps.setMessages && otherProps.chatId && parsedContent?.prompt) {
          console.log('🎬 Video completed via SSE, auto-saving to chat...');
          setTimeout(() => {
            saveVideoToChat(
              otherProps.chatId,
              videoUrl,
              parsedContent.prompt,
              otherProps.setMessages,
              thumbnailUrl
            );
          }, 500);
        }
      }
    }] : [],
    enabled: !!parsedContent?.fileId && !!parsedContent?.requestId
  });

  // Debug SSE connection status  
  useEffect(() => {
    if (parsedContent?.fileId && artifactSSE.isConnected) {
      console.log('🔌 SSE connected for video artifact file:', parsedContent.fileId);
    }
  }, [artifactSSE.isConnected, parsedContent?.fileId]);

  // Auto-notify chat WebSocket about new fileId when artifact is created (fallback)
  useEffect(() => {
    if (parsedContent?.fileId) {
      // Use the global notifyNewProject function exposed by console helpers
      const globalWindow = window as any;
      if (globalWindow.notifyNewProject) {
        globalWindow.notifyNewProject(parsedContent.fileId);
      }
    }
  }, [parsedContent?.fileId]);

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
    chatId: parsedContent?.fileId || otherProps.chatId,
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
    parsedContent,
  }), [
    parsedContent?.fileId,
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
    parsedContent,
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
    <div className="space-y-4 px-2">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Generated Video</h3>
        <button
          type="button"
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
      <div className="relative ">
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
  
  // Check if content contains different fileId or requestId
  let contentChanged = changes.content;
  if (!contentChanged && prevProps.content && nextProps.content) {
    try {
      const prevParsed = JSON.parse(prevProps.content);
      const nextParsed = JSON.parse(nextProps.content);
      
      if (prevParsed.fileId !== nextParsed.fileId || 
          prevParsed.requestId !== nextParsed.requestId) {
        // Content has different file/request ID
        contentChanged = true;
      }
    } catch {
      // If parsing fails, fall back to string comparison
      contentChanged = changes.content;
    }
  }
  
  // Only re-render if something meaningful changed
  const shouldUpdate = Object.values(changes).some(Boolean) || contentChanged;
  
  return !shouldUpdate; // Return true to prevent re-render, false to allow it
});

export default function ArtifactContentVideo(props: any) {
  return <VideoArtifactWrapper {...props} />;
}

export const videoArtifact = new Artifact({
  kind: 'video',
  description: 'Useful for video generation with real-time progress tracking',
  content: ArtifactContentVideo,
  actions: [
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }
        return false;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }
        return false;
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy video URL',
      onClick: ({ content }) => {
        try {
          const parsedContent = JSON.parse(content);
          if (parsedContent.status === 'completed' && parsedContent.videoUrl) {
            navigator.clipboard.writeText(parsedContent.videoUrl);
            toast.success('Video URL copied to clipboard!');
          } else {
            toast.error('Video is not ready yet');
          }
        } catch {
          toast.error('Unable to copy video URL');
        }
      },
      isDisabled: ({ content }) => {
        try {
          const parsedContent = JSON.parse(content);
          return parsedContent.status !== 'completed';
        } catch {
          return true;
        }
      },
    },
    {
      icon: <ShareIcon size={18} />,
      description: 'Copy artifact link',
      onClick: (context) => {
        const documentId = (context as any).documentId;
        if (documentId && documentId !== 'init') {
          const shareUrl = `${window.location.origin}/artifact/${documentId}`;
          navigator.clipboard.writeText(shareUrl);
          toast.success('Artifact link copied to clipboard!');
        } else {
          toast.error('Unable to generate share link - artifact not saved yet');
        }
      },
    },
  ],
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