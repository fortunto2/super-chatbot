'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, FileImage, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UploadedImage {
  id: string;
  file?: File;
  url?: string;
  base64?: string;
  preview: string;
}

interface ImageUploaderProps {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  accept?: string;
  className?: string;
  disabled?: boolean;
  showImageGrid?: boolean; // New prop to control image grid display
}

export function ImageUploader({
  value = [],
  onChange,
  maxFiles = 3,
  maxSize = 5,
  accept = 'image/*',
  className,
  disabled = false,
  showImageGrid = true
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;

    setIsUploading(true);
    const newImages: UploadedImage[] = [];
    const remainingSlots = maxFiles - value.length;
    const filesToProcess = Math.min(files.length, remainingSlots);

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      
      // Check if file exists and validate file type
      if (!file || !file.type || !file.type.startsWith('image/')) continue;
      
      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        console.warn(`File ${file.name} is too large (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
        continue;
      }

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const newImage: UploadedImage = {
          id: `img-${Date.now()}-${i}`,
          file,
          base64: base64.split(',')[1], // Remove data URL prefix
          preview: base64
        };

        newImages.push(newImage);
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }

    if (newImages.length > 0) {
      onChange([...value, ...newImages]);
    }
    
    setIsUploading(false);
  }, [value, onChange, maxFiles, maxSize, disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const removeImage = useCallback((id: string) => {
    onChange(value.filter(img => img.id !== id));
  }, [value, onChange]);

  const openFileDialog = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const canUpload = value.length < maxFiles && !disabled;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      {canUpload && (
        <Card 
          className={cn(
            'relative overflow-hidden transition-all duration-200 cursor-pointer',
            isDragging && 'border-primary bg-primary/5',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
        >
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <div className={cn(
              'rounded-full p-4 mb-4 transition-colors',
              isDragging ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}>
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <Upload className="h-8 w-8" />
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {isUploading ? 'Uploading...' : 'Upload Images'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Drag & drop images here, or click to browse
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {value.length}/{maxFiles} files
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Max {maxSize}MB each
                </Badge>
              </div>
            </div>
          </CardContent>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
        </Card>
      )}

      {/* Image Grid */}
      {showImageGrid && value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {value.map((image) => (
            <Card key={image.id} className="group relative overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={image.preview}
                  alt="Uploaded image"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                
                {/* Remove Button */}
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(image.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
                
                {/* File Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1 text-white text-xs">
                    <FileImage className="h-3 w-3" />
                    <span className="truncate">
                      {image.file?.name || 'Image'}
                    </span>
                  </div>
                  {image.file && (
                    <div className="text-white/80 text-xs">
                      {(image.file.size / 1024 / 1024).toFixed(1)}MB
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {value.length === 0 && !canUpload && showImageGrid && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No images uploaded</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 