import { Artifact } from '@/components/create-artifact';
import { CopyIcon, RedoIcon, UndoIcon } from '@/components/icons';
import { ImageEditor } from '@/components/image-editor';
import { toast } from 'sonner';

// Wrapper component that handles the artifact content for ImageEditor
function ImageArtifactWrapper(props: any) {
  const { content } = props;
  
  console.log('🖼️ ImageArtifactWrapper rendered with content:', content);
  
  try {
    // Try to parse as JSON for new format
    const parsedContent = JSON.parse(content);
    
    console.log('🖼️ Parsed content:', parsedContent);
    
    // For new format, pass settings to ImageEditor
    if (parsedContent.settings && parsedContent.projectId) {
      return (
        <ImageEditor
          chatId={parsedContent.projectId}
          availableResolutions={parsedContent.settings.availableResolutions || []}
          availableStyles={parsedContent.settings.availableStyles || []}
          availableShotSizes={parsedContent.settings.availableShotSizes || []}
          availableModels={parsedContent.settings.availableModels || []}
          defaultSettings={parsedContent.settings}
        />
      );
    }
    
    // Fallback for simpler JSON format with projectId
    if (parsedContent.projectId) {
      return <ImageEditor chatId={parsedContent.projectId} />;
    }
    
    // Fallback for simpler JSON format without projectId
    return <ImageEditor />;
    
  } catch (error) {
    console.log('🖼️ Failed to parse as JSON, treating as base64:', error);
    
    // Legacy base64 format - create a simple display
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="relative max-w-full max-h-[70vh] overflow-hidden rounded-lg border">
          <img
            src={`data:image/png;base64,${content}`}
            alt="Generated image"
            className="max-w-full max-h-full object-contain"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </div>
    );
  }
}

export const imageArtifact = new Artifact({
  kind: 'image',
  description: 'Useful for image generation with real-time progress tracking',
  onStreamPart: ({ streamPart, setArtifact }) => {
    console.log('🖼️ Image artifact onStreamPart:', streamPart);
    
    // Handle text-delta with JSON content from server
    if (streamPart.type === 'text-delta') {
      console.log('🖼️ Setting artifact content from text-delta:', streamPart.content);
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
