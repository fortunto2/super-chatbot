import { Artifact } from '@/components/create-artifact';
import { CopyIcon, RedoIcon, UndoIcon } from '@/components/icons';
import { ImageEditor } from '@/components/image-editor';
import { toast } from 'sonner';
import { memo, useMemo, useCallback } from 'react';

// Wrapper component that handles the artifact content for ImageEditor
const ImageArtifactWrapper = memo(function ImageArtifactWrapper(props: any) {
  const { content, setArtifact, ...otherProps } = props;
  
  console.log('🎨 ImageArtifactWrapper called with:', {
    content: content?.substring(0, 200) + '...',
    contentType: typeof content,
    hasSetArtifact: !!setArtifact,
    otherProps: Object.keys(otherProps)
  });
  
  // Memoize parsed content to avoid re-parsing on every render
  const parsedContent = useMemo(() => {
    if (!content || typeof content !== 'string') {
      console.log('🎨 No content or invalid content type');
      return null;
    }
    
    try {
      const parsed = JSON.parse(content);
      console.log('🎨 Successfully parsed content:', {
        status: parsed.status,
        projectId: parsed.projectId,
        hasSettings: !!parsed.settings,
        prompt: parsed.prompt
      });
      return parsed;
    } catch (error) {
      console.log('🎨 Failed to parse content as JSON, treating as legacy format:', error);
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
      imageUrl: parsedContent.imageUrl,
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

  // Memoize the stable setArtifact callback
  const memoizedSetArtifact = useCallback((fn: (prev: any) => any) => {
    if (setArtifact) {
      setArtifact(fn);
    }
  }, [setArtifact]);

  // Memoize ImageEditor props to prevent unnecessary rerenders
  const imageEditorProps = useMemo(() => ({
    chatId: parsedContent?.projectId,
    availableResolutions: otherProps.availableResolutions || [],
    availableStyles: otherProps.availableStyles || [],
    availableShotSizes: otherProps.availableShotSizes || [],
    availableModels: otherProps.availableModels || [],
    defaultSettings,
    append: otherProps.append,
    initialState,
    setArtifact: memoizedSetArtifact,
  }), [
    parsedContent?.projectId,
    otherProps.availableResolutions,
    otherProps.availableStyles,
    otherProps.availableShotSizes,
    otherProps.availableModels,
    otherProps.append,
    defaultSettings,
    initialState,
    memoizedSetArtifact,
  ]);

  // Handle different content types
  if (!content) {
    return <div>No image content available</div>;
  }

  // If we have valid parsed content, render ImageEditor
  if (parsedContent) {
    console.log('🎨 Rendering ImageEditor with memoized props');
    
    // If image is completed and we have imageUrl, show the final image
    if (parsedContent.status === 'completed' && parsedContent.imageUrl) {
      return (
        <div className="space-y-4 pl-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Generated Image</h3>
            <button
              onClick={async () => {
                try {
                  // Copy image URL to clipboard
                  await navigator.clipboard.writeText(parsedContent.imageUrl);
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
              src={parsedContent.imageUrl}
              alt={`Generated image: ${parsedContent.prompt || 'AI generated'}`}
              className="w-full h-auto rounded-lg border object-contain"
              style={{ maxHeight: '70vh' }}
              onError={(e) => {
                console.error('🎨 Image load error:', parsedContent.imageUrl);
              }}
            />
          </div>
                     {parsedContent.prompt && (
             <div className="text-sm text-muted-foreground text-center italic">
               &ldquo;{parsedContent.prompt}&rdquo;
             </div>
           )}
        </div>
      );
    }
    
    // Otherwise render ImageEditor for ongoing generation
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

  console.log('🎨 Rendering legacy base64 format');
  
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
  
  if (contentChanged || setArtifactChanged || appendChanged) {
    console.log('🎨 ImageArtifactWrapper memo: props changed', {
      contentChanged,
      setArtifactChanged, 
      appendChanged
    });
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
    console.log('📡 Image artifact stream part received:', {
      type: streamPart.type,
      contentLength: streamPart.content?.toString().length,
      contentPreview: streamPart.content?.toString().substring(0, 100)
    });
    
    // Handle text-delta with JSON content from server
    if (streamPart.type === 'text-delta') {
      console.log('📡 Handling text-delta for image artifact');
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.content as string,
        isVisible: true,
        status: 'streaming',
      }));
    }
    
    // Handle legacy image-delta for backward compatibility
    if (streamPart.type === 'image-delta') {
      console.log('📡 Handling image-delta for image artifact');
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.content as string,
        isVisible: true,
        status: 'streaming',
      }));
    }

    // Handle finish event to complete generation
    if (streamPart.type === 'finish') {
      console.log('📡 Image generation completed, updating final status');
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
            
            console.log('📡 Setting final completed content:', {
              status: updatedContent.status,
              hasImageUrl: !!updatedContent.imageUrl,
              imageUrlPreview: updatedContent.imageUrl?.substring(0, 50)
            });
            
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
