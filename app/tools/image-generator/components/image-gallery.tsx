'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Download, 
  Copy, 
  Trash2, 
  ZoomIn, 
  Clock,
  Settings,
  X
} from 'lucide-react';
import type { GeneratedImage } from '../hooks/use-image-generator';

interface ImageGalleryProps {
  images: GeneratedImage[];
  currentGeneration: GeneratedImage | null;
  onDeleteImage: (imageId: string) => void;
  onClearAll: () => void;
  onDownloadImage: (image: GeneratedImage) => Promise<void>;
  onCopyImageUrl: (image: GeneratedImage) => Promise<void>;
}

export function ImageGallery({
  images,
  currentGeneration,
  onDeleteImage,
  onClearAll,
  onDownloadImage,
  onCopyImageUrl,
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // AICODE-NOTE: Handle image load errors
  const handleImageError = (imageId: string) => {
    setImageErrors(prev => new Set(prev).add(imageId));
  };

  // AICODE-NOTE: Format timestamp for display
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    
    return date.toLocaleDateString();
  };

  // AICODE-NOTE: Image preview modal
  const ImagePreviewModal = ({ image }: { image: GeneratedImage }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-4xl h-full">
        <Button
          variant="outline"
          size="sm"
          className="absolute top-2 right-2 z-10 "
          onClick={() => setSelectedImage(null)}
        >
          <X className="size-4" />
        </Button>
        
        <img
          src={image.url}
          alt={image.prompt}
          className="size-full object-contain rounded-lg"
          onError={() => handleImageError(image.id)}
        />
        
        <div className="absolute bottom-0 inset-x-0 bg-black bg-opacity-50 text-white p-4 rounded-b-lg">
          <p className="text-sm font-medium line-clamp-2">{image.prompt}</p>
          <p className="text-xs text-gray-300 mt-1">
            {formatTimestamp(image.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );

  // AICODE-NOTE: Individual image card component
  const ImageCard = ({ image, isCurrent = false }: { image: GeneratedImage; isCurrent?: boolean }) => {
    const hasError = imageErrors.has(image.id);
    
    return (
      <Card className={`group relative overflow-hidden ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}>
        <div className="aspect-square relative">
          {hasError ? (
            <div className="size-full bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center text-gray-500">
                <div className="bg-red-100 rounded-full p-3 w-14 h-14 mx-auto mb-2 flex items-center justify-center">
                  <Settings className="size-6 text-red-400" />
                </div>
                <p className="text-sm font-medium">Failed to load</p>
              </div>
            </div>
          ) : (
            <img
              src={image.url}
              alt={image.prompt}
              className="size-full object-cover transition-transform group-hover:scale-105 cursor-pointer"
              onClick={() => setSelectedImage(image)}
              onError={() => handleImageError(image.id)}
            />
          )}
          
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
              <Button
                size="sm"
                variant="secondary"
                className="bg-gray-800/90 hover:bg-gray-700 text-white border-gray-600 shadow-lg"
                onClick={() => setSelectedImage(image)}
              >
                <ZoomIn className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="bg-gray-800/90 hover:bg-gray-700 text-white border-gray-600 shadow-lg"
                onClick={() => onDownloadImage(image)}
              >
                <Download className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="bg-gray-800/90 hover:bg-gray-700 text-white border-gray-600 shadow-lg"
                onClick={() => onCopyImageUrl(image)}
              >
                <Copy className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="bg-red-600/90 hover:bg-red-700 text-white border-red-500 shadow-lg"
                onClick={() => onDeleteImage(image.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
          
          {isCurrent && (
            <div className="absolute top-2 left-2">
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                Latest
              </span>
            </div>
          )}
        </div>
        
        <CardContent className="p-3">
          <p className="text-sm font-medium line-clamp-2 mb-2">
            {image.prompt}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <Clock className="size-3 mr-1" />
              {formatTimestamp(image.timestamp)}
            </div>
            
            <div className="flex items-center">
              <Settings className="size-3 mr-1" />
              {image.settings.model}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (images.length === 0 && !currentGeneration) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generated Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-600">
            <div className="bg-gray-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Settings className="size-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium mb-2 text-gray-700">No images generated yet</p>
            <p className="text-sm text-gray-500">
              Start by entering a prompt and clicking &quot;Generate Image&quot;
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Generated Images ({images.length})</CardTitle>
            {images.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearAll}
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
              >
                <Trash2 className="size-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Show current generation first if it exists */}
            {currentGeneration && (
              <ImageCard 
                image={currentGeneration} 
                isCurrent={true}
              />
            )}
            
            {/* Show other images */}
            {images
              .filter(img => img.id !== currentGeneration?.id)
              .map((image) => (
                <ImageCard 
                  key={image.id} 
                  image={image}
                />
              ))
            }
          </div>
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      {selectedImage && (
        <ImagePreviewModal image={selectedImage} />
      )}
    </>
  );
} 