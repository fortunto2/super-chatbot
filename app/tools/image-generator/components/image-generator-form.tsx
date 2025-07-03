'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EnhancedTextarea } from '@/components/ui/enhanced-textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Loader2, ImageIcon, Type } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { getImageGenerationConfig } from '@/lib/config/media-settings-factory';
import type { MediaOption, MediaResolution, AdaptedModel } from '@/lib/types/media-settings';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ImageUpload } from '../../video-generator/components/image-upload';

// AICODE-NOTE: Form validation schema for image generation parameters
const imageGenerationSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  style: z.string().optional(),
  resolution: z.string().optional(),
  shotSize: z.string().optional(),
  model: z.string().optional(),
  seed: z.number().optional(),
});

export type ImageGenerationFormData = z.infer<typeof imageGenerationSchema>;

interface ImageGeneratorFormProps {
  onGenerate: (data: ImageGenerationFormData) => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export function ImageGeneratorForm({ 
  onGenerate, 
  isGenerating, 
  disabled = false 
}: ImageGeneratorFormProps) {
  // AICODE-NOTE: Form state management using React hooks
  const [formData, setFormData] = useState<ImageGenerationFormData>({
    prompt: '',
    style: 'base',
    resolution: '1024x1024',
    shotSize: 'medium_shot',
    model: '',
    seed: Math.floor(Math.random() * 1000000000000),
  });

  // AICODE-NOTE: Configuration state loaded from SuperDuperAI API
  const [config, setConfig] = useState<{
    availableModels: AdaptedModel[];
    availableResolutions: MediaResolution[];
    availableStyles: MediaOption[];
    availableShotSizes: MediaOption[];
    defaultSettings: any;
  } | null>(null);
  
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  const [mode, setMode] = useState<'text-to-image' | 'image-to-image'>('text-to-image');
  const [sourceImage, setSourceImage] = useState<{ file: File; previewUrl: string } | null>(null);

  // AICODE-NOTE: Load configuration from SuperDuperAI API on component mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoadingConfig(true);
        setConfigError(null);
        
        console.log('🎨 Loading image generation configuration...');
        const imageConfig = await getImageGenerationConfig();
        
        console.log('🎨 ✅ Configuration loaded:', {
          modelsCount: imageConfig.availableModels.length,
          resolutionsCount: imageConfig.availableResolutions.length,
          stylesCount: imageConfig.availableStyles.length,
        });
        
        setConfig(imageConfig);
        
        // Set default values from configuration
        setFormData(prev => ({
          ...prev,
          style: imageConfig.defaultSettings.style?.id || 'base',
          resolution: imageConfig.defaultSettings.resolution?.label || '1024x1024',
          shotSize: imageConfig.defaultSettings.shotSize?.id || 'medium_shot',
          model: imageConfig.defaultSettings.model?.id || imageConfig.defaultSettings.model?.name || '',
          seed: prev.seed ?? Math.floor(Math.random() * 1000000000000),
        }));
        
      } catch (error) {
        console.error('🎨 ❌ Failed to load configuration:', error);
        setConfigError(error instanceof Error ? error.message : 'Failed to load configuration');
        toast.error('Failed to load image generation models');
      } finally {
        setIsLoadingConfig(false);
      }
    };

    loadConfig();
  }, []);

  const handleInputChange = (field: keyof ImageGenerationFormData, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleModeChange = (value: string) => {
    setMode(value as 'text-to-image' | 'image-to-image');
    setSourceImage(null); // reset image on mode change
  };

  const handleImageSelect = (file: File, previewUrl: string) => {
    setSourceImage({ file, previewUrl });
  };

  const handleImageRemove = () => {
    setSourceImage(null);
  };

  // Show loading state while configuration is loading
  if (isLoadingConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Image Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-8 animate-spin" />
            <span className="ml-2">Loading image generation models...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state if configuration failed to load
  if (configError || !config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Image Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800 text-sm">
              {configError || 'Failed to load configuration'}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="size-5" />
          AI Image Generator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate high-quality images using AI models from SuperDuperAI
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => {
          e.preventDefault();
          onGenerate(formData);
        }} className="space-y-6">
          {/* Generation Type Tabs */}
          <Tabs 
            value={mode} 
            onValueChange={handleModeChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text-to-image" className="flex items-center gap-2">
                <Type className="size-4" />
                Text to Image
              </TabsTrigger>
              <TabsTrigger value="image-to-image" className="flex items-center gap-2">
                <ImageIcon className="size-4" />
                Image to Image
              </TabsTrigger>
            </TabsList>
            <TabsContent value="text-to-image" className="space-y-6 mt-6">
              {/* Text-to-Image Mode */}
              <div className="space-y-2">
                <Label htmlFor="prompt">Image Description *</Label>
                <EnhancedTextarea
                  id="prompt"
                  placeholder="Describe the image you want to generate..."
                  value={formData.prompt}
                  onChange={(e) => handleInputChange('prompt', e.target.value)}
                  disabled={disabled || isGenerating}
                  rows={3}
                  fullscreenTitle="Image Description"
                />
                <p className="text-xs text-muted-foreground">
                  Be detailed and specific for better results
                </p>
              </div>
              {/* Model/Style/Resolution/ShotSize — вставить сюда нужные поля аналогично video-generator */}
            </TabsContent>
            <TabsContent value="image-to-image" className="space-y-6 mt-6">
              {/* Image-to-Image Mode */}
              <ImageUpload
                onImageSelect={handleImageSelect}
                onImageRemove={handleImageRemove}
                selectedImage={sourceImage}
                disabled={disabled || isGenerating}
                className="mb-4"
              />
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt *</Label>
                <EnhancedTextarea
                  id="prompt"
                  placeholder="Describe the transformation you want..."
                  value={formData.prompt}
                  onChange={(e) => handleInputChange('prompt', e.target.value)}
                  disabled={disabled || isGenerating}
                  rows={2}
                  fullscreenTitle="Image Transformation Description"
                />
                <p className="text-xs text-muted-foreground">
                  Describe how you want the source image to be changed
                </p>
              </div>
              {/* Model/Style/Resolution/ShotSize — вставить сюда нужные поля аналогично video-generator */}
            </TabsContent>
          </Tabs>
          {/* Остальные поля (Model, Style, Resolution, ShotSize) вынести из Tabs и оформить grid-ом, как в video-generator */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="model">AI Model</Label>
              <Select
                value={formData.model}
                onValueChange={(value) => handleInputChange('model', value)}
                disabled={disabled || isGenerating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {config.availableModels.map((model) => (
                    <SelectItem key={model.id || model.name} value={model.id || model.name}>
                      {model.label || model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Style Selection */}
            <div className="space-y-2">
              <Label htmlFor="style">Style</Label>
              <Select
                value={formData.style}
                onValueChange={(value) => handleInputChange('style', value)}
                disabled={disabled || isGenerating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a style" />
                </SelectTrigger>
                <SelectContent>
                  {config.availableStyles.map((style) => (
                    <SelectItem key={style.id} value={style.id}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Resolution Selection */}
            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution</Label>
              <Select
                value={formData.resolution}
                onValueChange={(value) => handleInputChange('resolution', value)}
                disabled={disabled || isGenerating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select resolution" />
                </SelectTrigger>
                <SelectContent>
                  {config.availableResolutions.map((resolution) => (
                    <SelectItem key={resolution.label} value={resolution.label}>
                      {resolution.label} ({resolution.aspectRatio})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Shot Size Selection */}
            <div className="space-y-2">
              <Label htmlFor="shotSize">Shot Size</Label>
              <Select
                value={formData.shotSize}
                onValueChange={(value) => handleInputChange('shotSize', value)}
                disabled={disabled || isGenerating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shot size" />
                </SelectTrigger>
                <SelectContent>
                  {config.availableShotSizes.map((shotSize) => (
                    <SelectItem key={shotSize.id} value={shotSize.id}>
                      {shotSize.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isGenerating || disabled}>
            {isGenerating ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Generate Image
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 