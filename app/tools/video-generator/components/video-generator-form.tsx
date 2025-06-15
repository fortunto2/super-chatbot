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
import { Loader2, Video } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { getVideoGenerationConfig } from '@/lib/config/media-settings-factory';
import type { MediaOption, MediaResolution, AdaptedModel } from '@/lib/types/media-settings';

// AICODE-NOTE: Form validation schema for video generation parameters
const videoGenerationSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(2000, 'Prompt too long'),
  negativePrompt: z.string().optional(),
  style: z.string().optional(),
  resolution: z.string().optional(),
  shotSize: z.string().optional(),
  model: z.string().optional(),
  frameRate: z.number().min(24).max(120).optional(),
  duration: z.number().min(1).max(30).optional(),
  seed: z.number().optional(),
});

export type VideoGenerationFormData = z.infer<typeof videoGenerationSchema>;

interface VideoGeneratorFormProps {
  onGenerate: (data: VideoGenerationFormData) => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export function VideoGeneratorForm({ 
  onGenerate, 
  isGenerating, 
  disabled = false 
}: VideoGeneratorFormProps) {
  // AICODE-NOTE: Form state management using React hooks
  const [formData, setFormData] = useState<VideoGenerationFormData>({
    prompt: '',
    negativePrompt: '',
    style: '',
    resolution: '',
    shotSize: '',
    model: '',
    frameRate: 30,
    duration: 5,
    seed: undefined,
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

  // AICODE-NOTE: Load configuration from SuperDuperAI API on component mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoadingConfig(true);
        setConfigError(null);
        
        console.log('🎬 Loading video generation configuration...');
        const videoConfig = await getVideoGenerationConfig();
        
        console.log('🎬 ✅ Configuration loaded:', {
          modelsCount: videoConfig.availableModels.length,
          resolutionsCount: videoConfig.availableResolutions.length,
          stylesCount: videoConfig.availableStyles.length,
        });
        
        setConfig(videoConfig);
        
        // Set default values from configuration
        setFormData(prev => ({
          ...prev,
          style: videoConfig.defaultSettings.style.id,
          resolution: videoConfig.defaultSettings.resolution.label,
          shotSize: videoConfig.defaultSettings.shotSize.id,
          model: videoConfig.defaultSettings.model.name,
        }));
        
      } catch (error) {
        console.error('🎬 ❌ Failed to load configuration:', error);
        setConfigError(error instanceof Error ? error.message : 'Failed to load configuration');
        toast.error('Failed to load video generation models');
      } finally {
        setIsLoadingConfig(false);
      }
    };

    loadConfig();
  }, []);

  const handleInputChange = (field: keyof VideoGenerationFormData, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    try {
      const validatedData = videoGenerationSchema.parse(formData);
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
          <CardTitle>AI Video Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading video generation models...</span>
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
          <CardTitle>AI Video Generator</CardTitle>
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
          <Video className="h-5 w-5" />
          AI Video Generator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate high-quality videos using AI models from SuperDuperAI
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt *</Label>
            <Textarea
              id="prompt"
              placeholder="Describe the video you want to generate..."
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

          {/* Negative Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="negativePrompt">Negative Prompt (Optional)</Label>
            <Textarea
              id="negativePrompt"
              placeholder="What to avoid in the video..."
              value={formData.negativePrompt}
              onChange={(e) => handleInputChange('negativePrompt', e.target.value)}
              disabled={disabled || isGenerating}
              rows={2}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Specify what you don&apos;t want to see in the video
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
                          ${model.price}/sec
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

            {/* Duration Input */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="30"
                placeholder="5"
                value={formData.duration || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  handleInputChange('duration', value ? Number.parseInt(value) : undefined);
                }}
                disabled={disabled || isGenerating}
              />
              <p className="text-xs text-muted-foreground">
                Video length in seconds (1-30)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Frame Rate Input */}
            <div className="space-y-2">
              <Label htmlFor="frameRate">Frame Rate (FPS)</Label>
              <Select
                value={formData.frameRate?.toString()}
                onValueChange={(value) => handleInputChange('frameRate', Number.parseInt(value))}
                disabled={disabled || isGenerating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select FPS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 FPS (Cinematic)</SelectItem>
                  <SelectItem value="30">30 FPS (Standard)</SelectItem>
                  <SelectItem value="60">60 FPS (Smooth)</SelectItem>
                  <SelectItem value="120">120 FPS (High-speed)</SelectItem>
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
                  handleInputChange('seed', value ? Number.parseInt(value) : undefined);
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
                Generating Video...
              </>
            ) : (
              <>
                <Video className="mr-2 h-4 w-4" />
                Generate Video
              </>
            )}
          </Button>

          {/* Estimated cost */}
          {formData.duration && config.defaultSettings.model.price && (
            <div className="text-center text-sm text-muted-foreground">
              Estimated cost: ${(formData.duration * config.defaultSettings.model.price).toFixed(2)}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
} 