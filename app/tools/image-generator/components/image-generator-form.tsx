'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { getImageGenerationConfig } from '@/lib/config/media-settings-factory';
import type { MediaOption, MediaResolution } from '@/lib/types/media-settings';
import type { ImageModel } from '@/lib/config/superduperai';

// AICODE-NOTE: Form validation schema for image generation parameters
const imageGenerationSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(2000, 'Prompt too long'),
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
    style: '',
    resolution: '',
    shotSize: '',
    model: '',
    seed: undefined,
  });

  // AICODE-NOTE: Configuration state loaded from SuperDuperAI API
  const [config, setConfig] = useState<{
    availableModels: ImageModel[];
    availableResolutions: MediaResolution[];
    availableStyles: MediaOption[];
    availableShotSizes: MediaOption[];
    defaultSettings: any;
  } | null>(null);
  
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

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
          style: imageConfig.defaultSettings.style.id,
          resolution: imageConfig.defaultSettings.resolution.label,
          shotSize: imageConfig.defaultSettings.shotSize.id,
          model: imageConfig.defaultSettings.model.name,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    try {
      const validatedData = imageGenerationSchema.parse(formData);
      onGenerate(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error('Invalid form data');
      }
    }
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
            <Loader2 className="h-8 w-8 animate-spin" />
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
        <CardTitle>AI Image Generator</CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate high-quality images using AI models from SuperDuperAI
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt *</Label>
            <Textarea
              id="prompt"
              placeholder="Describe the image you want to generate..."
              value={formData.prompt}
              onChange={(e) => handleInputChange('prompt', e.target.value)}
              disabled={disabled || isGenerating}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Be detailed and specific for better results
            </p>
          </div>

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
                  <SelectItem key={model.name} value={model.name}>
                    <div className="flex items-center justify-between w-full">
                      <span>{model.label || model.name}</span>
                      {model.price && model.price > 0 && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ${model.price}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Seed Input */}
            <div className="space-y-2">
              <Label htmlFor="seed">Seed (Optional)</Label>
              <Input
                id="seed"
                type="number"
                placeholder="Random"
                value={formData.seed || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  handleInputChange('seed', value ? parseInt(value) : undefined);
                }}
                disabled={disabled || isGenerating}
              />
              <p className="text-xs text-muted-foreground">
                Use same seed for reproducible results
              </p>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={disabled || isGenerating || !formData.prompt.trim()}
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Image...
              </>
            ) : (
              'Generate Image'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 