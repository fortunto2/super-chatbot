'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface ChatImageArtifact {
  id: string;
  url: string;
  prompt: string;
  createdAt: Date;
  projectId?: string;
}

interface ChatImageHistoryProps {
  chatId: string;
  isVisible: boolean;
  onImageSelect?: (imageUrl: string) => void;
}

export function ChatImageHistory({ chatId, isVisible, onImageSelect }: ChatImageHistoryProps) {
  const [images, setImages] = useState<ChatImageArtifact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChatImages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/chat/${chatId}/images`);
      
      if (!response.ok) {
        throw new Error(`Failed to load images: ${response.status}`);
      }
      
      const data = await response.json();
      setImages(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chat images';
      setError(errorMessage);
      console.error('Failed to load chat images:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible && chatId) {
      loadChatImages();
    }
  }, [isVisible, chatId]);

  if (!isVisible) {
    return null;
  }

  const handleImageClick = (imageUrl: string) => {
    if (onImageSelect) {
      onImageSelect(imageUrl);
    } else {
      // Default action: copy URL to clipboard
      navigator.clipboard.writeText(imageUrl).then(() => {
        toast.success('Image URL copied to clipboard');
      }).catch(() => {
        toast.error('Failed to copy image URL');
      });
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm">Chat Image History</h3>
        <button
          type="button"
          onClick={loadChatImages}
          disabled={loading}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="text-red-500 text-xs mb-3 p-2 bg-red-50 rounded">
          {error}
        </div>
      )}

      {images.length === 0 ? (
        <div className="text-center text-muted-foreground text-xs py-4">
          {loading ? 'Loading images...' : 'No images found in this chat'}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((image) => (
            <div
              key={image.id}
              role="button"
              tabIndex={0}
              className="group relative aspect-square rounded-lg overflow-hidden border cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleImageClick(image.url)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleImageClick(image.url);
                }
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.prompt}
                className="size-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
              
              {/* Overlay with prompt */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors">
                <div className="absolute bottom-0 inset-x-0 p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="truncate">{image.prompt}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {new Date(image.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              {/* Click indicator */}
              <div className="absolute top-2 right-2 size-6 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 