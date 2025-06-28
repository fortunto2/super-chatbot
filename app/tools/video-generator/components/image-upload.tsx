'use client';

import { useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  onImageSelect: (file: File, previewUrl: string) => void;
  onImageRemove: () => void;
  selectedImage?: { file: File; previewUrl: string } | null;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  onImageSelect,
  onImageRemove,
  selectedImage,
  disabled = false,
  className = ''
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      
      // Call the parent callback
      onImageSelect(file, previewUrl);
      
      toast.success('Image selected successfully');
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image');
    } finally {
      setIsUploading(false);
    }
  }, [onImageSelect]);

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
              <img
                src={selectedImage.previewUrl}
                alt="Selected image for video generation"
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
              <p>{(selectedImage.file.size / 1024 / 1024).toFixed(2)} MB</p>
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
              </div>

              <Button 
                variant="outline" 
                disabled={disabled || isUploading}
                className="mt-2"
              >
                <Upload className="size-4 mr-2" />
                {isUploading ? 'Processing...' : 'Choose Image'}
              </Button>

              <div className="text-xs text-muted-foreground mt-4 space-y-1">
                <p>• Supported formats: JPEG, PNG, WebP</p>
                <p>• Maximum file size: 10MB</p>
                <p>• Recommended: High resolution images work best</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Tips */}
      {!selectedImage && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
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