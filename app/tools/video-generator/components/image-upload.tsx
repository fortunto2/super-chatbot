'use client';

import { useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Image as ImageIcon, AlertCircle, Crop } from 'lucide-react';
import { toast } from 'sonner';
import NextImage from 'next/image';

interface ImageUploadProps {
  onImageSelect: (file: File, previewUrl: string) => void;
  onImageRemove: () => void;
  selectedImage?: { file: File; previewUrl: string } | null;
  disabled?: boolean;
  className?: string;
  targetResolution?: string; // e.g., "1280x720 (HD)"
}

// AICODE-NOTE: Image processing utilities for resolution matching
const parseResolution = (resolutionString?: string) => {
  // Default to HD 16:9
  let width = 1280;
  let height = 720;
  
  if (resolutionString) {
    const match = resolutionString.match(/(\d+)x(\d+)/);
    if (match) {
      width = Number.parseInt(match[1], 10);
      height = Number.parseInt(match[2], 10);
    }
  }
  
  return { width, height, aspectRatio: width / height };
};

const processImageForResolution = async (
  file: File, 
  targetWidth: number, 
  targetHeight: number
): Promise<{ processedFile: File; previewUrl: string }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Create canvas for processing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }
        
        // Set target dimensions
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // Calculate scaling and cropping
        const sourceAspect = img.width / img.height;
        const targetAspect = targetWidth / targetHeight;
        
        let sx = 0;
        let sy = 0;
        let sw = img.width;
        let sh = img.height;
        
        if (sourceAspect > targetAspect) {
          // Source is wider - crop horizontal
          sw = img.height * targetAspect;
          sx = (img.width - sw) / 2;
        } else {
          // Source is taller - crop vertical  
          sh = img.width / targetAspect;
          sy = (img.height - sh) / 2;
        }
        
        // Draw cropped and scaled image
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
        
        // Convert to blob and file
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create processed image'));
            return;
          }
          
          // Create new file with processed image
          const processedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          const previewUrl = URL.createObjectURL(blob);
          
          resolve({ processedFile, previewUrl });
        }, 'image/jpeg', 0.92);
        
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

export function ImageUpload({
  onImageSelect,
  onImageRemove,
  selectedImage,
  disabled = false,
  className = '',
  targetResolution
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateImageFile = (file: File): boolean => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, or WebP)');
      return false;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('Image file must be smaller than 10MB');
      return false;
    }

    return true;
  };

  const handleFileSelect = useCallback(async (file: File) => {
    if (!validateImageFile(file)) {
      return;
    }

    try {
      setIsUploading(true);
      setIsProcessing(true);
      
      // Parse target resolution
      const { width: targetWidth, height: targetHeight } = parseResolution(targetResolution);
      
      console.log('🖼️ Processing image for resolution:', { 
        target: targetResolution, 
        dimensions: { targetWidth, targetHeight },
        originalFile: { name: file.name, size: file.size }
      });
      
      // Process image to match target resolution
      const { processedFile, previewUrl } = await processImageForResolution(
        file, 
        targetWidth, 
        targetHeight
      );
      
      console.log('✅ Image processed:', {
        original: { width: 'unknown', height: 'unknown', size: file.size },
        processed: { width: targetWidth, height: targetHeight, size: processedFile.size }
      });
      
      // Call the parent callback with processed image
      onImageSelect(processedFile, previewUrl);
      
      toast.success(`Image processed for ${targetWidth}x${targetHeight} resolution`);
      
    } catch (error) {
      console.error('❌ Error processing image:', error);
      toast.error('Failed to process image for video resolution');
      
      // Fallback: use original image
      try {
        const previewUrl = URL.createObjectURL(file);
        onImageSelect(file, previewUrl);
        toast.warning('Using original image (no processing applied)');
      } catch (fallbackError) {
        toast.error('Failed to process image');
      }
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  }, [onImageSelect, targetResolution]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    } else {
      toast.error('Please drop an image file');
    }
  }, [disabled, isUploading, handleFileSelect]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Clear the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    if (selectedImage?.previewUrl) {
      URL.revokeObjectURL(selectedImage.previewUrl);
    }
    onImageRemove();
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  // Parse target resolution for display
  const { width: targetWidth, height: targetHeight } = parseResolution(targetResolution);

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {selectedImage ? (
        // Selected Image Preview
        <Card className="relative">
          <CardContent className="p-4">
            <div className="relative group">
              <NextImage
                src={selectedImage.previewUrl}
                alt="Selected image for video generation"
                width={400}
                height={160}
                className="w-full h-40 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveImage}
                  disabled={disabled}
                  className="bg-red-500 hover:bg-red-600"
                >
                  <X className="size-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              <p className="font-medium">{selectedImage.file.name}</p>
              <div className="flex items-center justify-between">
                <span>{(selectedImage.file.size / 1024 / 1024).toFixed(2)} MB</span>
                <span className="flex items-center gap-1 text-green-600">
                  <Crop className="size-3" />
                  {targetWidth}x{targetHeight}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Upload Area
        <Card
          className={`
            border-2 cursor-pointer transition-all duration-200
            ${isDragOver 
              ? 'border-primary bg-primary/5 scale-[1.02]' 
              : 'border-dashed border-muted-foreground/25 hover:border-primary/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${isUploading ? 'border-primary bg-primary/5' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`p-4 rounded-full ${
                isDragOver || isUploading 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {isUploading ? (
                  <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ImageIcon className="size-8" />
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Select Source Image</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  {isDragOver 
                    ? 'Drop your image here' 
                    : 'Drag and drop an image file here, or click to browse'
                  }
                </p>
                {targetResolution && (
                  <div className="flex items-center justify-center gap-1 text-xs text-blue-600 bg-blue-50 rounded-md px-2 py-1">
                    <Crop className="size-3" />
                    Will be processed for {targetWidth}x{targetHeight}
                  </div>
                )}
              </div>
              
              {isProcessing && (
                <div className="text-xs text-blue-600 flex items-center gap-1">
                  <div className="size-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Processing image for video resolution...
                </div>
              )}

              <div className="text-xs text-muted-foreground space-y-1">
                <p>Supported formats: JPEG, PNG, WebP</p>
                <p>Maximum size: 10MB</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Tips */}
      {!selectedImage && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
                            <AlertCircle className="size-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Image-to-Video Tips:</p>
              <ul className="space-y-1 text-xs">
                <li>• Use clear, high-quality images for best results</li>
                <li>• The AI will animate your image into a video</li>
                <li>• Consider the composition and what parts should move</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 