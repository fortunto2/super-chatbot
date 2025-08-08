import { Artifact } from '@/components/create-artifact';
import { CopyIcon, RedoIcon, UndoIcon, ShareIcon } from '@/components/icons';
import { toast } from 'sonner';
import '@/lib/utils/console-helpers';
import { ImageArtifactWrapper } from '@/components/artifacts/image/image-artefact-wrapper';

export default function ArtifactContentImage(props: any) {
  return <ImageArtifactWrapper {...props} />;
}

export const imageArtifact = new Artifact({
  kind: 'image',
  description: 'Useful for image generation with real-time progress tracking',
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === 'text-delta') {
      // AICODE-FIX: Validate JSON content before overwriting to prevent skeleton disappearing
      const newContent = streamPart.content as string;
      try {
        JSON.parse(newContent);
        setArtifact((draft) => ({ ...draft, content: newContent, isVisible: true }));
      } catch {
        // Invalid JSON - don't overwrite existing content
        console.log('🖼️ ⚠️ Skipping invalid JSON content in stream part');
      }
    }
    if (streamPart.type === 'finish') {
      setArtifact((draft) => ({ ...draft, status: 'idle' }));
    }
  },
  content: ImageArtifactWrapper,
  actions: [
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => handleVersionChange('prev'),
      isDisabled: ({ currentVersionIndex }) => currentVersionIndex === 0,
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => handleVersionChange('next'),
      isDisabled: ({ isCurrentVersion }) => isCurrentVersion,
    },
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy image to clipboard',
      onClick: ({ content }) => {
        try {
          const parsed = JSON.parse(content);
          if (parsed.status === 'completed' && parsed.imageUrl) {
            fetch(parsed.imageUrl)
              .then(res => res.blob())
              .then(blob => navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]))
              .then(() => toast.success('Image copied to clipboard!'));
          } else {
            toast.error('Image is not ready yet');
          }
        } catch {
          toast.error('Failed to copy image');
        }
      },
      isDisabled: ({ content }) => {
        try {
          return JSON.parse(content).status !== 'completed';
        } catch {
          return true;
        }
      },
    },
    {
      icon: <ShareIcon size={18} />,
      description: 'Copy artifact link',
      onClick: (context) => {
        const docId = (context as any).documentId;
        if (docId && docId !== 'init') {
          navigator.clipboard.writeText(`${window.location.origin}/artifact/${docId}`);
          toast.success('Artifact link copied!');
        } else {
          toast.error('Artifact not saved yet');
        }
      },
    },
  ],
  toolbar: [],
});
