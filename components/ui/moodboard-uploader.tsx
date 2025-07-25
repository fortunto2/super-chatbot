'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Tag, Eye, Sliders, X } from 'lucide-react';
import { ImageUploader } from '@/components/ui/image-uploader';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MoodboardImage {
  id: string;
  file?: File;
  url?: string;
  base64?: string;
  tags: string[];
  description: string;
  weight: number;
}

interface UploadedImage {
  id: string;
  file?: File;
  url?: string;
  base64?: string;
  preview: string;
}

interface MoodboardUploaderProps {
  onImagesChange: (images: MoodboardImage[]) => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  maxImages?: number;
  value?: MoodboardImage[];
}

const AVAILABLE_TAGS = [
  { id: 'character', label: 'Character', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: '👤' },
  { id: 'style', label: 'Style', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300', icon: '🎨' },
  { id: 'background', label: 'Background', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: '🏞️' },
  { id: 'lighting', label: 'Lighting', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: '💡' },
  { id: 'mood', label: 'Mood', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300', icon: '🎭' },
  { id: 'action', label: 'Action', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: '⚡' }
];

export function MoodboardUploader({ 
  onImagesChange, 
  enabled, 
  onEnabledChange, 
  maxImages = 3,
  value = []
}: MoodboardUploaderProps) {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [moodboardImages, setMoodboardImages] = useState<MoodboardImage[]>(value);

  // Sync with external value changes
  useEffect(() => {
    setMoodboardImages(value);
    // Update uploadedImages to match the moodboard images
    const newUploadedImages: UploadedImage[] = value.map(img => {
      let preview = '';
      if (img.url) {
        preview = img.url;
      } else if (img.base64) {
        preview = img.base64.startsWith('data:') ? img.base64 : `data:image/jpeg;base64,${img.base64}`;
      } else if (img.file) {
        preview = URL.createObjectURL(img.file);
      }
      
      return {
        id: img.id,
        file: img.file,
        url: img.url,
        base64: img.base64,
        preview
      };
    });
    setUploadedImages(newUploadedImages);
  }, [value]);

  const updateMoodboardImages = useCallback((newMoodboardImages: MoodboardImage[]) => {
    setMoodboardImages(newMoodboardImages);
    onImagesChange(newMoodboardImages);
  }, [onImagesChange]);

  const handleUploadedImagesChange = useCallback((images: UploadedImage[]) => {
    setUploadedImages(images);
    
    // Convert uploaded images to moodboard images, preserving existing data
    const newMoodboardImages = images.map(uploadedImg => {
      const existingImg = moodboardImages.find(mb => mb.id === uploadedImg.id);
      return existingImg || {
        id: uploadedImg.id,
        file: uploadedImg.file,
        url: uploadedImg.url,
        base64: uploadedImg.base64,
        tags: [],
        description: '',
        weight: 1.0
      };
    });
    
    updateMoodboardImages(newMoodboardImages);
  }, [moodboardImages, updateMoodboardImages]);

  const updateImageTags = useCallback((id: string, tags: string[]) => {
    updateMoodboardImages(moodboardImages.map(img => 
      img.id === id ? { ...img, tags } : img
    ));
  }, [moodboardImages, updateMoodboardImages]);

  const updateImageDescription = useCallback((id: string, description: string) => {
    updateMoodboardImages(moodboardImages.map(img => 
      img.id === id ? { ...img, description } : img
    ));
  }, [moodboardImages, updateMoodboardImages]);

  const updateImageWeight = useCallback((id: string, weight: number) => {
    updateMoodboardImages(moodboardImages.map(img => 
      img.id === id ? { ...img, weight } : img
    ));
  }, [moodboardImages, updateMoodboardImages]);

  const toggleTag = useCallback((imageId: string, tagId: string) => {
    const image = moodboardImages.find(img => img.id === imageId);
    if (!image) return;

    const newTags = image.tags.includes(tagId)
      ? image.tags.filter(t => t !== tagId)
      : [...image.tags, tagId];
    
    updateImageTags(imageId, newTags);
  }, [moodboardImages, updateImageTags]);

  const removeImage = useCallback((imageId: string) => {
    const newMoodboardImages = moodboardImages.filter(img => img.id !== imageId);
    const newUploadedImages = uploadedImages.filter(img => img.id !== imageId);
    
    setMoodboardImages(newMoodboardImages);
    setUploadedImages(newUploadedImages);
    updateMoodboardImages(newMoodboardImages);
  }, [moodboardImages, uploadedImages, updateMoodboardImages]);

  return (
    <div className="space-y-6">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center space-x-3">
        <Switch
          checked={enabled}
          onCheckedChange={onEnabledChange}
          id="moodboard-toggle"
        />
        <Label htmlFor="moodboard-toggle" className="text-sm font-medium">
          Enable Moodboard References
        </Label>
        {enabled && (
          <Badge variant="outline" className="text-xs">
            {uploadedImages.length}/{maxImages} images
          </Badge>
        )}
      </div>

      {enabled && (
        <div className="space-y-6">
          {/* Image Uploader */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Visual References</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploader
                value={uploadedImages}
                onChange={handleUploadedImagesChange}
                maxFiles={maxImages}
                maxSize={5}
                accept="image/*"
                showImageGrid={false}
              />
            </CardContent>
          </Card>

          {/* Image Configuration */}
          {moodboardImages.length > 0 && (
            <div className="space-y-4">
              {moodboardImages.map((image) => (
                <Card key={image.id} className="group relative">
                  <CardContent className="pt-6">
                    {/* Delete Button */}
                    <button
                      onClick={() => removeImage(image.id)}
                      className="absolute top-2 right-2 z-10 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Image Preview */}
                      <div className="lg:col-span-1">
                        <div className="aspect-square relative rounded-lg overflow-hidden">
                          {(() => {
                            let previewSrc = '';
                            if (image.url) {
                              previewSrc = image.url;
                            } else if (image.base64) {
                              previewSrc = image.base64.startsWith('data:') ? image.base64 : `data:image/jpeg;base64,${image.base64}`;
                            } else if (image.file) {
                              previewSrc = URL.createObjectURL(image.file);
                            }
                            
                            return previewSrc ? (
                              <img
                                src={previewSrc}
                                alt="Moodboard reference"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                                No preview available
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Configuration */}
                      <div className="lg:col-span-2 space-y-4">
                        {/* Tags */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Tags
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {AVAILABLE_TAGS.map((tag) => (
                              <Badge
                                key={tag.id}
                                variant={image.tags.includes(tag.id) ? "default" : "outline"}
                                className={`cursor-pointer transition-colors ${
                                  image.tags.includes(tag.id) ? tag.color : ''
                                }`}
                                onClick={() => toggleTag(image.id, tag.id)}
                              >
                                {tag.icon} {tag.label}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                          <Label htmlFor={`desc-${image.id}`} className="text-sm font-medium flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Description (optional)
                          </Label>
                          <Input
                            id={`desc-${image.id}`}
                            value={image.description}
                            onChange={(e) => updateImageDescription(image.id, e.target.value)}
                            placeholder="Describe what to focus on in this image..."
                            className="text-sm"
                          />
                        </div>

                        {/* Weight */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Sliders className="h-4 w-4" />
                            Influence Weight: {image.weight.toFixed(1)}
                          </Label>
                          <div className="space-y-2">
                            <input
                              type="range"
                              min="0.1"
                              max="1.0"
                              step="0.1"
                              value={image.weight}
                              onChange={(e) => updateImageWeight(image.id, parseFloat(e.target.value))}
                              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Low Impact</span>
                              <span>High Impact</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Instructions */}
          {enabled && (
            <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    🎨 Moodboard Tips
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400">•</span>
                      <span>Tag images to specify which VEO3 sections they should influence</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400">•</span>
                      <span>Add descriptions to highlight specific elements you want emphasized</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400">•</span>
                      <span>Adjust influence weight to control how much each image affects the result</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400">•</span>
                      <span>Mix different types: character poses, lighting examples, style references</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 