import { Artifact } from '@/components/create-artifact';
import { CopyIcon, RedoIcon, UndoIcon } from '@/components/icons';
import { ImageEditor } from '@/components/image-editor';
import { toast } from 'sonner';
import { memo, useMemo, useEffect } from 'react';
import { useImageSSE } from '@/hooks/use-image-sse';

// Import console helpers for debugging (auto-exposes in browser)
import '@/lib/utils/console-helpers';

// Function to save artifact updates to database
const saveArtifactToDatabase = async (id: string | undefined, title: string, content: string) => {
  // Skip saving if no valid ID
  if (!id || id === 'undefined') {
    console.log('💾 ⚠️ Skipping database save - no valid artifact ID');
    return;
  }
  
  try {
    console.log('💾 Saving updated artifact to database:', id);
    
    const response = await fetch(`/api/document?id=${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content,
        kind: 'image'
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to save artifact: ${response.status} - ${errorText}`);
    }
    
    console.log('💾 ✅ Artifact saved to database successfully');
  } catch (error) {
    console.error('💾 ❌ Failed to save artifact to database:', error);
  }
};

// Wrapper component that handles the artifact content for ImageEditor
const ImageArtifactWrapper = memo(function ImageArtifactWrapper(props: any) {
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
      projectId: parsedContent.projectId,
      requestId: parsedContent.requestId,
      timestamp: parsedContent.timestamp,
      message: parsedContent.message,
      imageUrl: parsedContent.imageUrl, // Pass imageUrl from completed state
    };
    
    // Debug initial state creation
    console.log('🔧 ImageArtifactWrapper: initial state updated', {
      projectId: state.projectId || 'none',
      status: state.status || 'none',
      imageUrl: state.imageUrl ? `${state.imageUrl.substring(0, 50)}...` : 'none'
    });
    
    return state;
  }, [parsedContent]);

  // Connect to SSE for real-time updates using fileId directly
  const artifactSSE = useImageSSE({
    fileId: parsedContent?.projectId || '', // projectId is actually fileId from generate-image.ts
    eventHandlers: parsedContent?.projectId ? [(message: any) => {
      console.log('🎨 Artifact SSE message:', message);
      
      // Handle file events for image completion
      if (message.type === 'file' && message.object) {
        const fileObject = message.object;
        
        // Handle direct URL in file object
        if (fileObject.url && (fileObject.type === 'image' || fileObject.contentType?.startsWith('image/'))) {
          console.log('🎨 ✅ Image completed via SSE file event:', fileObject.url);
          
          // Update artifact content with completed image
          setArtifact((prev: any) => {
            try {
              console.log('🎨 📄 Artifact state before update:', { 
                id: prev.id, 
                documentId: prev.documentId, 
                title: prev.title 
              });
              
              const currentContent = JSON.parse(prev.content || '{}');
              const updatedContent = {
                ...currentContent,
                status: 'completed',
                imageUrl: fileObject.url,
                progress: 100
              };
              
              // Save updated content to database (use documentId which is the actual ID)
              saveArtifactToDatabase(prev.documentId || prev.id, prev.title, JSON.stringify(updatedContent));
              
              return {
                ...prev,
                content: JSON.stringify(updatedContent)
              };
            } catch (error) {
              console.error('🎨 ❌ Failed to update artifact content:', error);
              return prev;
            }
          });
        }
        // Handle file_id case - need to resolve to URL
        else if (fileObject.file_id) {
          console.log('🎨 File ID received via SSE, resolving:', fileObject.file_id);
          
          // Import FileService dynamically to resolve file_id to URL
          import('@/lib/api').then(async ({ FileService, FileTypeEnum }) => {
            try {
              const fileResponse = await FileService.fileGetById({ id: fileObject.file_id });
              
              if (fileResponse && fileResponse.url && fileResponse.type === FileTypeEnum.IMAGE) {
                console.log('🎨 ✅ File ID resolved to image URL via SSE:', fileResponse.url);
                
                // Update artifact content with completed image
                setArtifact((prev: any) => {
                  try {
                    const currentContent = JSON.parse(prev.content || '{}');
                    const updatedContent = {
                      ...currentContent,
                      status: 'completed',
                      imageUrl: fileResponse.url,
                      progress: 100
                    };
                    
                    // Save updated content to database (use documentId which is the actual ID)
                    saveArtifactToDatabase(prev.documentId || prev.id, prev.title, JSON.stringify(updatedContent));
                    
                    return {
                      ...prev,
                      content: JSON.stringify(updatedContent)
                    };
                  } catch (error) {
                    console.error('🎨 ❌ Failed to update artifact content with file_id:', error);
                    return prev;
                  }
                });
              } else {
                console.log('🎨 ⚠️ File ID resolved to non-image file via SSE:', fileResponse?.type);
              }
            } catch (error) {
              console.error('🎨 ❌ Failed to resolve file ID via SSE:', error);
            }
          });
        }
      }
      
      // Handle render_progress events
      if (message.type === 'render_progress' && message.object?.progress !== undefined) {
        console.log('🎨 Render progress via SSE:', message.object.progress);
        
        setArtifact((prev: any) => {
          try {
            const currentContent = JSON.parse(prev.content || '{}');
            const updatedContent = {
              ...currentContent,
              status: 'processing',
              progress: message.object.progress
            };
            return {
              ...prev,
              content: JSON.stringify(updatedContent)
            };
          } catch (error) {
            console.error('🎨 ❌ Failed to update progress:', error);
            return prev;
          }
        });
      }
      
      // Handle render_result events
      if (message.type === 'render_result' && (message.object?.url || message.object?.file_url)) {
        const imageUrl = message.object.url || message.object.file_url;
        console.log('🎨 ✅ Render result via SSE:', imageUrl);
        
        setArtifact((prev: any) => {
          try {
            const currentContent = JSON.parse(prev.content || '{}');
            const updatedContent = {
              ...currentContent,
              status: 'completed',
              imageUrl,
              progress: 100
            };
            
            // Save updated content to database (use documentId which is the actual ID)
            saveArtifactToDatabase(prev.documentId || prev.id, prev.title, JSON.stringify(updatedContent));
            
            return {
              ...prev,
              content: JSON.stringify(updatedContent)
            };
          } catch (error) {
            console.error('🎨 ❌ Failed to update render result:', error);
            return prev;
          }
        });
      }
    }] : [],
    enabled: !!parsedContent?.projectId && !!parsedContent?.requestId
  });

  // Debug SSE connection status and expose globally
  useEffect(() => {
    // Only log connection once, not on every reconnect
    if (parsedContent?.projectId && artifactSSE.isConnected) {
      const key = `sse_logged_${parsedContent.projectId}`;
      if (typeof window !== 'undefined' && !(window as any)[key]) {
        console.log('🔌 SSE connected for artifact project:', parsedContent.projectId);
        (window as any)[key] = true;
      }
    }
    
    // Expose SSE connection status globally for ImageEditor
    if (typeof window !== 'undefined') {
      const globalWindow = window as any;
      if (!globalWindow.artifactSSEStatus) {
        globalWindow.artifactSSEStatus = {};
      }
      if (parsedContent?.projectId) {
        globalWindow.artifactSSEStatus[parsedContent.projectId] = artifactSSE.isConnected;
      }
    }
  }, [artifactSSE.isConnected, parsedContent?.projectId, parsedContent?.status]);

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
      seed: parsedContent.settings.seed,
    };
  }, [parsedContent?.settings]);

  // Memoize ImageEditor props to prevent unnecessary rerenders
  const imageEditorProps = useMemo(() => ({
    chatId: parsedContent?.projectId || otherProps.chatId,
    availableResolutions: otherProps.availableResolutions || [],
    availableStyles: otherProps.availableStyles || [],
    availableShotSizes: otherProps.availableShotSizes || [],
    availableModels: otherProps.availableModels || [],
    defaultSettings,
    append: otherProps.append,
    setMessages: otherProps.setMessages,
    initialState,
    setArtifact,
  }), [
    parsedContent?.projectId,
    otherProps.availableResolutions,
    otherProps.availableStyles,
    otherProps.availableShotSizes,
    otherProps.availableModels,
    otherProps.append,
    otherProps.setMessages,
    defaultSettings,
    initialState,
    setArtifact,
  ]);

  // Handle different content types
  if (!content) {
    return <div>No image content available</div>;
  }

    // If we have valid parsed content, render ImageEditor
  if (parsedContent) {
    return <ImageEditor {...imageEditorProps} />;
  }

  // Handle legacy base64 image format
  let imageUrl: string;
  if (content.startsWith('data:image/')) {
    imageUrl = content;
  } else if (content.startsWith('/9j/') || content.startsWith('iVBORw0KGgo') || content.startsWith('UklGR')) {
    imageUrl = `data:image/png;base64,${content}`;
  } else {
    try {
      // Try to extract base64 from various formats
      const base64Match = content.match(/data:image\/[^;]+;base64,([^"]+)/);
      if (base64Match) {
        imageUrl = content;
      } else {
        imageUrl = `data:image/png;base64,${content}`;
      }
    } catch (error) {
      console.error('🎨 Error processing image content:', error);
      return <div>Error loading image</div>;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Generated Image</h3>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(imageUrl);
              toast.success('Image URL copied to clipboard');
            } catch (error) {
              toast.error('Failed to copy image URL');
            }
          }}
          className="p-1 hover:bg-gray-100 rounded"
          title="Copy image URL"
        >
          <CopyIcon size={16} />
        </button>
      </div>
      <div className="relative">
        <img
          src={imageUrl}
          alt="AI-generated artwork"
          className="w-full h-auto rounded-lg border"
          style={{ maxHeight: '70vh' }}
          onError={(e) => {
            console.error('🎨 Image load error:', imageUrl.substring(0, 100));
          }}
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Comprehensive comparison function for memo to prevent image mix-ups
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
  };
  
  // Check if content contains different projectId or requestId
  let contentChanged = changes.content;
  if (!contentChanged && prevProps.content && nextProps.content) {
    try {
      const prevParsed = JSON.parse(prevProps.content);
      const nextParsed = JSON.parse(nextProps.content);
      
      // Check for critical fields that should trigger re-render
      contentChanged = 
        prevParsed.projectId !== nextParsed.projectId ||
        prevParsed.requestId !== nextParsed.requestId ||
        prevParsed.imageUrl !== nextParsed.imageUrl ||
        prevParsed.status !== nextParsed.status;
    } catch {
      // If content is not JSON, compare as strings
      contentChanged = prevProps.content !== nextProps.content;
    }
  }
  
  const shouldRerender = contentChanged || 
    changes.setArtifact || 
    changes.append || 
    changes.setMessages ||
    changes.chatId ||
    changes.availableResolutions ||
    changes.availableStyles ||
    changes.availableShotSizes ||
    changes.availableModels;
  
  // Debug memo comparison
  if (contentChanged) {
    try {
      const prevParsed = JSON.parse(prevProps.content || '{}');
      const nextParsed = JSON.parse(nextProps.content || '{}');
      console.log('🔄 ImageArtifactWrapper memo: content changed, triggering re-render', {
        prevImageUrl: prevParsed.imageUrl ? `${prevParsed.imageUrl.substring(0, 50)}...` : 'none',
        nextImageUrl: nextParsed.imageUrl ? `${nextParsed.imageUrl.substring(0, 50)}...` : 'none',
        prevStatus: prevParsed.status || 'none',
        nextStatus: nextParsed.status || 'none'
      });
    } catch (e) {
      console.log('🔄 ImageArtifactWrapper memo: content changed (not JSON)');
    }
  }
  
  return !shouldRerender; // Return false to re-render, true to skip
});

export default function ArtifactContentImage(props: any) {
  return <ImageArtifactWrapper {...props} />;
}

export const imageArtifact = new Artifact({
  kind: 'image',
  description: 'Useful for image generation with real-time progress tracking',
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
    
    // Handle legacy image-delta for backward compatibility
    if (streamPart.type === 'image-delta') {
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
          
          // If the parsed content has imageUrl, mark as completed with imageUrl
          if (parsedContent.imageUrl || parsedContent.status === 'completed') {
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
          
          // Fallback: keep current content but mark as completed
          return {
            ...draftArtifact,
            status: 'idle',
          };
        } catch (error) {
          console.error('📡 Error parsing content on finish:', error);
          // For legacy base64 content, just mark as completed
          return {
            ...draftArtifact,
            status: 'idle',
          };
        }
      });
    }
  },
  content: ImageArtifactWrapper,
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
      description: 'Copy image to clipboard',
      onClick: ({ content }) => {
        try {
          // Try to parse content as JSON for new format
          const parsedContent = JSON.parse(content);
          
          if (parsedContent.status === 'completed' && parsedContent.imageUrl) {
            // Handle new format with imageUrl
            fetch(parsedContent.imageUrl)
              .then(response => response.blob())
              .then(blob => {
                navigator.clipboard.write([
                  new ClipboardItem({ [blob.type]: blob }),
                ]);
                toast.success('Copied image to clipboard!');
              })
              .catch(() => {
                toast.error('Failed to copy image to clipboard');
              });
            return;
          }
          
          if (parsedContent.status !== 'completed') {
            toast.error('Image is not ready yet');
            return;
          }
        } catch {
          // Fallback to legacy base64 format
          const img = new Image();
          img.src = `data:image/png;base64,${content}`;

          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) {
                navigator.clipboard.write([
                  new ClipboardItem({ 'image/png': blob }),
                ]);
                toast.success('Copied image to clipboard!');
              }
            }, 'image/png');
          };

          img.onerror = () => {
            toast.error('Failed to copy image to clipboard');
          };
        }
      },
      isDisabled: ({ content }) => {
        try {
          const parsedContent = JSON.parse(content);
          return parsedContent.status !== 'completed';
        } catch {
          // For legacy base64 content, always allow copy
          return false;
        }
      },
    },
  ],
  toolbar: [],
});
