import { Artifact } from '@/components/create-artifact';
import { CopyIcon, RedoIcon, UndoIcon, ShareIcon } from '@/components/icons';
import { toast } from 'sonner';
import { memo, useMemo, useEffect, useState, useCallback } from 'react';
import { useImageSSE } from '@/hooks/use-image-sse';
import { Skeleton } from '@/components/ui/skeleton';
import { generateUUID } from '@/lib/utils';

// Import console helpers for debugging (auto-exposes in browser)
import '@/lib/utils/console-helpers';

// Function to save image to chat history
const saveImageToChat = async (
  chatId: string,
  imageUrl: string,
  prompt: string,
  setMessages: (updater: (prevMessages: any[]) => any[]) => void,
) => {
  if (!setMessages || !chatId) return;

  // Prevent duplicate saves by checking if the message already exists
  let imageExists = false;
  setMessages(prevMessages => {
    imageExists = prevMessages.some(msg =>
      msg.experimental_attachments?.some((att: any) => att.url === imageUrl)
    );
    return prevMessages; // No state change, just checking
  });

  if (imageExists) {
    console.log('💾 ⏭️ Image already in chat, skipping duplicate save.');
    return;
  }

  const imageAttachment = {
    name: prompt.length > 50 ? `${prompt.substring(0, 50)}...` : prompt,
    url: imageUrl,
    contentType: 'image/webp',
  };

  const imageMessage = {
    id: generateUUID(),
    role: 'assistant' as const,
    content: ``,
    parts: [{ type: 'text' as const, text: `` }],
    experimental_attachments: [imageAttachment],
    createdAt: new Date(),
  };

  // Add locally first for instant UI update
  setMessages(prevMessages => [...prevMessages, imageMessage]);

  // Then save to database
  try {
    await fetch('/api/save-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId,
        message: {
          id: imageMessage.id,
          role: imageMessage.role,
          parts: imageMessage.parts,
          attachments: imageMessage.experimental_attachments,
          createdAt: imageMessage.createdAt,
        },
      }),
    });
  } catch (dbError) {
    console.warn('💾 ⚠️ Failed to save image message to DB, but it will remain in local chat.', dbError);
  }
};


// Function to save artifact updates to database
const saveArtifactToDatabase = async (id: string | undefined, title: string, content: string, thumbnailUrl?: string) => {
  if (!id || id === 'undefined') {
    return;
  }
  try {
    let readableTitle = title;
    if (title.startsWith('{') && title.endsWith('}')) {
      const titleParams = JSON.parse(title);
      readableTitle = titleParams.prompt || 'AI Generated Image';
    }
    if (readableTitle.length > 255) {
      readableTitle = readableTitle.substring(0, 252) + '...';
    }
    const payload: any = { title: readableTitle, content, kind: 'image' };
    if (thumbnailUrl) {
      payload.thumbnailUrl = thumbnailUrl;
    }
    await fetch(`/api/document?id=${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('💾 ❌ Failed to save artifact to database:', error);
  }
};

const ImageDisplay = ({ imageUrl, prompt }: { imageUrl: string; prompt: string }) => (
  <div className="space-y-2">
    <div className="rounded-lg overflow-hidden border">
      <img
        src={imageUrl}
        alt={prompt || 'AI-generated artwork'}
        className="w-full h-auto object-contain"
        style={{ maxHeight: '70vh' }}
      />
    </div>
    <p className="text-sm text-gray-500 px-1">{prompt}</p>
  </div>
);

const ImageArtifactWrapper = memo(function ImageArtifactWrapper(props: any) {
  const { content, setArtifact, documentId, title, chatId, setMessages } = props;
  const [localContent, setLocalContent] = useState(content);

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const parsedContent = useMemo(() => {
    try {
      const parsed = JSON.parse(localContent);
      return parsed;
    } catch (error) {
      // Only log parsing errors for debugging if needed
      if (localContent?.trim()) {
        console.log('🖼️ ❌ Failed to parse image content:', { 
          contentPreview: localContent?.substring(0, 100), 
          error: error instanceof Error ? error.message : String(error)
        });
      }
      return null;
    }
  }, [localContent]);

  const { status, imageUrl, prompt, projectId, requestId } = parsedContent || {};

  const updateContent = useCallback((newContent: any) => {
    const finalContent = JSON.stringify(newContent);
    setLocalContent(finalContent);
    setArtifact((prev: any) => ({ ...prev, content: finalContent, status: 'idle' }));
    
    // AICODE-FIX: Include thumbnail in main save to avoid duplication
    const thumbnailUrl = newContent.thumbnailUrl || (newContent.status === 'completed' ? newContent.imageUrl : undefined);
    saveArtifactToDatabase(documentId, title, finalContent, thumbnailUrl);

    // AICODE-FIX: Debug thumbnail save conditions
    console.log('🖼️ 🔍 updateContent called:', {
      status: newContent.status,
      hasImageUrl: !!newContent.imageUrl,
      hasThumbnailUrl: !!newContent.thumbnailUrl,
      documentId,
      documentIdValid: documentId && documentId !== 'undefined',
      thumbnailUrl: newContent.thumbnailUrl,
      finalThumbnailUrl: thumbnailUrl
    });

    // AICODE-FIX: Add generated image to chat history
    if (newContent.status === 'completed' && newContent.imageUrl && chatId && setMessages && newContent.prompt) {
      saveImageToChat(chatId, newContent.imageUrl, newContent.prompt, setMessages);
    }
  }, [setArtifact, documentId, title, chatId, setMessages]);

  useEffect(() => {
    if (!projectId) return;
    
    // AICODE-FIX: Also poll if completed but missing thumbnail
    const needsThumbnail = status === 'completed' && imageUrl && !parsedContent?.thumbnailUrl;
    if (status === 'completed' && !needsThumbnail) return;

    const pollTimeout = setTimeout(async () => {
      try {
        const { pollFileCompletion } = await import('@/lib/utils/smart-polling-manager');
        const result = await pollFileCompletion(projectId, { maxDuration: 7 * 60 * 1000 });
        console.log('🖼️ 🔄 Polling result:', { 
          success: result.success, 
          hasUrl: !!result.data?.url, 
          hasThumbnail: !!result.data?.thumbnail_url,
          url: result.data?.url,
          thumbnail_url: result.data?.thumbnail_url
        });
        if (result.success && result.data?.url) {
          // AICODE-FIX: Always force thumbnail update from polling, even if image already completed
          const newContent = {
            ...parsedContent,
            status: 'completed',
            imageUrl: result.data.url,
            thumbnailUrl: result.data.thumbnail_url, // AICODE-FIX: Include thumbnail from polling
            prompt: result.data.image_generation?.prompt || parsedContent?.prompt, // Use prompt from polling result
            progress: 100,
          };
          console.log('🖼️ 🔄 Forcing thumbnail update from polling:', { 
            imageUrl: result.data.url, 
            thumbnailUrl: result.data.thumbnail_url,
            currentStatus: parsedContent?.status 
          });
          updateContent(newContent);
        }
      } catch (error) {
        console.error('❌ Artifact smart polling system error:', error);
      }
    }, 20000); // 20s delay

    return () => clearTimeout(pollTimeout);
  }, [projectId, status, updateContent, parsedContent]);
  
  useImageSSE({
    fileId: projectId,
    eventHandlers: useMemo(() => [
      (message: any) => {
        console.log('🖼️ 📡 SSE message received:', { type: message.type, hasUrl: !!message.object?.url, hasThumbnail: !!message.object?.thumbnail_url });
        if (message.type === 'file' && message.object?.url && message.object?.contentType?.startsWith('image/')) {
          console.log('🖼️ 📡 Processing file completion from SSE:', { 
            url: message.object.url, 
            thumbnail_url: message.object.thumbnail_url 
          });
          updateContent({ 
            ...parsedContent, 
            status: 'completed', 
            imageUrl: message.object.url, 
            thumbnailUrl: message.object.thumbnail_url, // AICODE-FIX: Include thumbnail from SSE
            prompt: message.object.image_generation?.prompt || parsedContent?.prompt, 
            progress: 100 
          });
        } else if (message.type === 'render_progress' && message.object?.progress !== undefined) {
          setLocalContent(JSON.stringify({ ...parsedContent, status: 'processing', progress: message.object.progress }));
        } else if (message.type === 'render_result' && (message.object?.url || message.object?.file_url)) {
          console.log('🖼️ 📡 Processing render_result from SSE:', { 
            url: message.object.url || message.object.file_url, 
            thumbnail_url: message.object.thumbnail_url 
          });
          updateContent({ 
            ...parsedContent, 
            status: 'completed', 
            imageUrl: message.object.url || message.object.file_url, 
            thumbnailUrl: message.object.thumbnail_url, // AICODE-FIX: Include thumbnail from SSE
            prompt: parsedContent?.prompt, 
            progress: 100 
          });
        }
      }
    ], [updateContent, parsedContent]),
    enabled: !!projectId && status !== 'completed' && !!requestId
  });

  // Show skeleton while loading or if content cannot be parsed
  if (!parsedContent) {
    return (
      <div className="space-y-2">
        <Skeleton className="w-full h-[400px] rounded-lg" />
        <Skeleton className="w-3/4 h-4 rounded-lg" />
      </div>
    );
  }

  if (status === 'completed' && imageUrl) {
    return <ImageDisplay imageUrl={imageUrl} prompt={prompt} />;
  }

  // Show skeleton for pending/processing states
  return (
    <div className="space-y-2">
      <Skeleton className="w-full h-[400px] rounded-lg" />
      <Skeleton className="w-3/4 h-4 rounded-lg" />
    </div>
  );
}, (prevProps, nextProps) => prevProps.content === nextProps.content);

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
