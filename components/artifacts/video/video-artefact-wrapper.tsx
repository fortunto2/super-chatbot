import { CopyIcon } from '@/components/icons';
import { VideoEditor } from '@/components/video-editor';
import { useArtifactSSE } from '@/hooks/use-artifact-sse';
import { saveArtifactToDatabase, saveMediaToChat } from '@/lib/ai/chat/media';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

export const VideoArtifactWrapper = memo(function VideoArtifactWrapper(props: any) {
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
  
    // Set up smart polling fallback for artifacts in case SSE doesn't work
    useEffect(() => {
      const fileId = parsedContent?.fileId;
      if (!fileId || parsedContent?.status === 'completed') return;
  
      // Start smart polling after 30 seconds if video still not completed
      const pollTimeout = setTimeout(async () => {
        console.log('🔄 Starting artifact smart polling for video fileId:', fileId);
        
        try {
          const { pollFileCompletion } = await import('@/lib/utils/smart-polling-manager');
          
          const result = await pollFileCompletion(fileId, {
            maxDuration: 15 * 60 * 1000, // 15 minutes for video
            initialInterval: 5000,
            onProgress: (attempt, elapsed, nextInterval) => {
              console.log(`🔄 Video poll attempt ${attempt} (${Math.round(elapsed / 1000)}s elapsed, next: ${nextInterval}ms)`);
            },
            onError: (error, attempt) => {
              console.warn(`⚠️ Video polling non-critical error at attempt ${attempt}:`, error.message);
            }
          });
          
          if (result.success && result.data?.url) {
            console.log('✅ Video smart polling completed:', result.data.url);
            
            const videoUrl = result.data.url;
            const thumbnailUrl = result.data.thumbnail_url;
  
            // Update artifact content
            setArtifact((prev: any) => {
              try {
                const currentContent = JSON.parse(prev.content || '{}');
                const updatedContent = {
                  ...currentContent,
                  status: 'completed',
                  videoUrl: videoUrl,
                  thumbnailUrl: thumbnailUrl,
                  progress: 100
                };
                
                saveArtifactToDatabase(prev.documentId || prev.id, prev.title, JSON.stringify(updatedContent), "video", thumbnailUrl);
  
                // AICODE-FIX: Update thumbnail in database when video completes via polling
                if ((prev.documentId || prev.id) && thumbnailUrl) {
                  const docId = prev.documentId || prev.id;
                  if (docId !== 'undefined') {
                    fetch(`/api/document?id=${encodeURIComponent(docId)}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        thumbnailUrl,
                        metadata: { 
                          videoUrl: videoUrl,
                          thumbnailUrl: thumbnailUrl,
                          prompt: currentContent.prompt,
                          model: currentContent.model?.name || currentContent.model?.id,
                          resolution: currentContent.resolution 
                        }
                      }),
                    }).catch((err) => console.error('Failed to update video thumbnail via polling', err));
                  }
                }
                
                return {
                  ...prev,
                  content: JSON.stringify(updatedContent)
                };
              } catch (error) {
                console.error('Failed to update artifact via smart polling:', error);
                return prev;
              }
            });
  
            // Auto-save video to chat history if we have required data
            if (props.setMessages && props.chatId && parsedContent?.prompt) {
              console.log('🎬 Video completed via polling, auto-saving to chat...');
              saveMediaToChat(
                props.chatId,
                videoUrl,
                parsedContent.prompt,
                props.setMessages,
                "video",
                thumbnailUrl
              );
            }
          } else {
            console.error('❌ Video smart polling failed:', result.error);
          }
          
        } catch (error) {
          console.error('❌ Video smart polling system error:', error);
        }
      }, 30000); // 30 second delay before starting polling
      
      return () => {
        clearTimeout(pollTimeout);
      };
    }, [parsedContent?.fileId, parsedContent?.status, setArtifact, parsedContent?.prompt, props.chatId, props.setMessages]);
  
    const handleSSEMessage = useCallback((message: any) => {
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
  
            // AICODE-FIX: Update thumbnail in database when video completes
            if (current.documentId && current.documentId !== 'undefined' && thumbnailUrl) {
              fetch(`/api/document?id=${encodeURIComponent(current.documentId)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  thumbnailUrl,
                  metadata: { 
                    videoUrl: videoUrl,
                    thumbnailUrl: thumbnailUrl,
                    prompt: currentContent.prompt,
                    model: currentContent.model?.name || currentContent.model?.id,
                    resolution: currentContent.resolution 
                  }
                }),
              }).catch((err) => console.error('Failed to update video thumbnail', err));
            }
            
            return {
              ...current,
              content: JSON.stringify(updatedContent),
              status: 'idle' as const
            };
          });
        }
  
        // Auto-save video to chat history if we have required data
        if (props.setMessages && props.chatId && parsedContent?.prompt) {
          console.log('🎬 Video completed via SSE, auto-saving to chat...');
          setTimeout(() => {
            saveMediaToChat(
              props.chatId,
              videoUrl,
              parsedContent.prompt,
              props.setMessages,
              "video",
              thumbnailUrl
            );
          }, 500);
        }
      }
    }, [setArtifact, props.setMessages, props.chatId, parsedContent?.prompt]);
  
    // Connect to SSE for real-time updates (using fileId)
    const artifactSSE = useArtifactSSE({
      channel: parsedContent?.fileId ? `file.${parsedContent.fileId}` : '',
      eventHandlers: useMemo(() => (parsedContent?.fileId ? [handleSSEMessage] : []), [parsedContent?.fileId, handleSSEMessage]),
      enabled: !!parsedContent?.fileId && !!parsedContent?.requestId
    });
  
    // Debug SSE connection status  
    useEffect(() => {
      if (parsedContent?.fileId && artifactSSE.isConnected) {
        console.log('🔌 SSE connected for video artifact file:', parsedContent.fileId);
      }
    }, [artifactSSE.isConnected, parsedContent?.fileId]);
  
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