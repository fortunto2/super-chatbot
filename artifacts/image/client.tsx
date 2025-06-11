import { Artifact } from '@/components/create-artifact';
import { CopyIcon, RedoIcon, UndoIcon } from '@/components/icons';
import { ImageEditor } from '@/components/image-editor';
import { toast } from 'sonner';
import { memo, useMemo } from 'react';

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
      return parsed;
    } catch (error) {
      // Only log if content looks like it should be JSON (starts with { or [)
      
      return null;
    }
  }, [content]);

  // Memoize initial state to prevent recreating object on every render
  const initialState = useMemo(() => {
    if (!parsedContent) return undefined;
    
    return {
      status: parsedContent.status,
      prompt: parsedContent.prompt,
      projectId: parsedContent.projectId,
      timestamp: parsedContent.timestamp,
      message: parsedContent.message,
      imageUrl: parsedContent.imageUrl, // Pass imageUrl from completed state
    };
  }, [parsedContent]);

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
    chatId: parsedContent?.projectId,
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
          alt="Generated image"
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
  // Custom comparison function for memo to prevent unnecessary rerenders
  // Only compare essential props that affect rendering
  const contentChanged = prevProps.content !== nextProps.content;
  const setArtifactChanged = prevProps.setArtifact !== nextProps.setArtifact;
  const appendChanged = prevProps.append !== nextProps.append;
  const setMessagesChanged = prevProps.setMessages !== nextProps.setMessages;
  
  if (contentChanged || setArtifactChanged || appendChanged || setMessagesChanged) {
    return false; // Re-render
  }
  
  return true; // Skip re-render
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
