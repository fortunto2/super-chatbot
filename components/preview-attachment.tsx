import type { Attachment } from 'ai';

import { LoaderIcon } from './icons';
import { useArtifact } from '@/hooks/use-artifact';

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
  chatId,
}: {
  attachment: Attachment;
  isUploading?: boolean;
  chatId?: string;
}) => {
  const { name, url, contentType } = attachment;
  const { setArtifact } = useArtifact();

  const handleAttachmentClick = () => {
    if (contentType?.startsWith('image')) {
      setArtifact((prev) => ({
        ...prev,
        isVisible: true,
        kind: 'image',
        content: JSON.stringify({
          status: 'completed',
          imageUrl: url,
          prompt: name || '',
          projectId: chatId,
        }),
        title: name || 'Image',
      }));
    } else if (contentType?.startsWith('video')) {
      setArtifact((prev) => ({
        ...prev,
        isVisible: true,
        kind: 'video',
        content: JSON.stringify({
          status: 'completed',
          videoUrl: url,
          prompt: name || '',
          projectId: chatId,
        }),
        title: name || 'Video',
      }));
    }
    else if (contentType === 'text/markdown') {
      let documentId;
      if (url) {
        const urlParts = url.split('/');
        documentId = urlParts[urlParts.length - 1];
      } else {
        documentId = (attachment as any).documentId;
      }
      const kind = (attachment as any).kind === 'script' ? 'script' : 'text';
      setArtifact((prev) => ({
        ...prev,
        isVisible: true,
        kind,
        documentId,
        title: name || (kind === 'script' ? 'Script' : 'Document'),
      }));
    }
  };

  return (
    <div data-testid="input-attachment-preview" className="flex flex-col gap-2">
      <div className="w-20 h-16 aspect-video bg-muted rounded-md relative flex flex-col items-center justify-center">
        {contentType ? (
          contentType.startsWith('image') ? (
            // NOTE: it is recommended to use next/image for images
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={name ?? 'An image attachment'}
              className="rounded-md size-full object-cover cursor-pointer"
              onClick={handleAttachmentClick}
            />
          ) : contentType.startsWith('video') ? (
            <div
              role="button"
              tabIndex={0}
              className="rounded-md size-full bg-black cursor-pointer flex items-center justify-center relative"
              onClick={handleAttachmentClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleAttachmentClick();
                }
              }}
            >
              {/* Use thumbnail if available (from attachment.thumbnailUrl) */}
              {(attachment as any).thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={(attachment as any).thumbnailUrl}
                  alt={name ?? 'Video thumbnail'}
                  className="rounded-md size-full object-cover"
                />
              ) : (
                <span className="text-white text-lg">🎬</span>
              )}
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/50 rounded-full p-1">
                  <span className="text-white text-xs">▶</span>
                </div>
              </div>
            </div>
         ) : contentType === 'text/markdown' ? (
           <div
             role="button"
             tabIndex={0}
             className="rounded-md size-full bg-white cursor-pointer flex items-center justify-center relative border border-zinc-200"
             onClick={handleAttachmentClick}
             onKeyDown={(e) => {
               if (e.key === 'Enter' || e.key === ' ') {
                 e.preventDefault();
                 handleAttachmentClick();
               }
             }}
           >
             <span className="text-zinc-700 text-2xl">📄</span>
            </div>
          ) : (
            <div className="" />
          )
        ) : (
          <div className="" />
        )}

        {isUploading && contentType !== 'text/markdown' && (
          <div
            data-testid="input-attachment-loader"
            className="animate-spin absolute text-zinc-500"
          >
            <LoaderIcon />
          </div>
        )}
      </div>
      <div className="text-xs text-zinc-500 max-w-16 truncate">{name}</div>
    </div>
  );
};
