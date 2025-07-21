'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Trash2, 
  Settings,
} from 'lucide-react';
import type { GeneratedImage } from '../hooks/use-image-generator';
import { ImageCard } from './image-card';
import { ImagePreviewModal } from './image-preview-modal';

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

  const handleImageError = (imageId: string) => {
    setImageErrors(prev => new Set(prev).add(imageId));
  };

  if (images.length === 0 && !currentGeneration) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generated Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-600">
            <div className="bg-gray-100 rounded-full p-4 size-20 mx-auto mb-4 flex items-center justify-center">
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
                onCopyImageUrl={onCopyImageUrl}
                onDownloadImage={onDownloadImage}
                onDeleteImage={onDeleteImage}
                setSelectedImage={setSelectedImage}
                handleImageError={handleImageError}
                imageErrors={imageErrors}
              />
            )}
            
            {/* Show other images */}
            {images
              .filter(img => img.id !== currentGeneration?.id)
              .map((image) => (
                <ImageCard 
                  key={image.id} 
                  image={image}
                  onCopyImageUrl={onCopyImageUrl}
                  onDownloadImage={onDownloadImage}
                  onDeleteImage={onDeleteImage}
                  setSelectedImage={setSelectedImage}
                  handleImageError={handleImageError}
                  imageErrors={imageErrors}
                />
              ))
            }
          </div>
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      {selectedImage && (
        <ImagePreviewModal 
          image={selectedImage} 
          setSelectedImage={setSelectedImage} 
          handleImageError={handleImageError} 
        />
      )}
    </>
  );
} 

