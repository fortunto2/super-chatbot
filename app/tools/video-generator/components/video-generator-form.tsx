'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EnhancedTextarea } from '@/components/ui/enhanced-textarea';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Loader2, Video, Type, Image as ImageIcon, Shuffle, Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { getVideoGenerationConfig } from '@/lib/config/media-settings-factory';
import type { MediaOption, MediaResolution, AdaptedModel } from '@/lib/types/media-settings';
import { ImageUpload } from './image-upload';
import { GenerationTypeEnum } from '@/lib/api/models/GenerationTypeEnum';
import { getModelLabel } from '@/lib/config/superduperai';

// AICODE-NOTE: Duration options for different video use cases
const DURATION_OPTIONS = [
  { value: '3', label: '3 seconds', description: 'Quick clips' },
  { value: '5', label: '5 seconds', description: 'Standard short' },
  { value: '8', label: '8 seconds', description: 'Social media' },
  { value: '10', label: '10 seconds', description: 'Stories format' },
  { value: '15', label: '15 seconds', description: 'Reels/TikTok' },
  { value: '20', label: '20 seconds', description: 'Product demos' },
  { value: '30', label: '30 seconds', description: 'Advertising' },
  { value: '45', label: '45 seconds', description: 'Presentations' },
  { value: '60', label: '60 seconds', description: 'Full minute' },
  { value: '90', label: '90 seconds', description: 'Extended content' },
  { value: '120', label: '2 minutes', description: 'Long-form' },
];

// AICODE-NOTE: Form validation schema for video generation parameters
const videoGenerationSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  negativePrompt: z.string().optional(),
  style: z.string().optional(),
  resolution: z.string().optional(),
  shotSize: z.string().optional(),
  model: z.string().optional(),
  frameRate: z.number().min(24).max(120).optional(),
  duration: z.number().min(1).max(300).optional(), // Increased max to 5 minutes
  seed: z.number().optional(),
  generationType: z.enum(['text-to-video', 'image-to-video']),
  file: typeof window !== 'undefined' 
  ? z.instanceof(File).optional() 
  : z.any().optional(),
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
    style: 'base',
    resolution: '1280x720 (HD)',
    shotSize: '',
    model: '',
    frameRate: 30,
    duration: 5,
    seed: Math.floor(Math.random() * 1000000000000),
    generationType: 'text-to-video',
    file: undefined,
  });

  // State for image upload
  const [selectedImage, setSelectedImage] = useState<{ file: File; previewUrl: string } | null>(null);

  // AICODE-NOTE: Duration combobox state
  const [durationOpen, setDurationOpen] = useState(false);
  const [customDuration, setCustomDuration] = useState('');

  // AICODE-NOTE: Configuration state loaded from SuperDuperAI API
  const [config, setConfig] = useState<{
    availableModels: AdaptedModel[];
    availableResolutions: MediaResolution[];
    availableStyles: MediaOption[];
    availableShotSizes: MediaOption[];
    defaultSettings: any;
    textToVideoModels: AdaptedModel[];
    imageToVideoModels: AdaptedModel[];
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
        
        // AICODE-NOTE: Use existing OpenAPI model filtering from superduperai.ts
        const allVideoModels = videoConfig.availableModels;
        const textToVideoModels = allVideoModels.filter(model => 
          model.type === GenerationTypeEnum.TEXT_TO_VIDEO
        );
        const imageToVideoModels = allVideoModels.filter(model => 
          model.type === GenerationTypeEnum.IMAGE_TO_VIDEO
        );
        
        console.log('🎬 ✅ Configuration loaded:', {
          totalModels: videoConfig.availableModels.length,
          textToVideoModels: textToVideoModels.length,
          imageToVideoModels: imageToVideoModels.length,
          resolutionsCount: videoConfig.availableResolutions.length,
          stylesCount: videoConfig.availableStyles.length,
        });
        
        setConfig({
          ...videoConfig,
          textToVideoModels,
          imageToVideoModels,
        });
        
        // Set default values from configuration
        const defaultTextModel = textToVideoModels.find(m => 
          m.name.includes('sora') || m.name.includes('azure-openai/sora')
        ) || textToVideoModels[0];
        
        const defaultImageModel = imageToVideoModels.find(m => 
          m.name.includes('veo2') || 
          m.name.includes('veo-2') || 
          m.name.includes('google-cloud/veo2') ||
          m.label?.toLowerCase().includes('veo2') ||
          m.label?.toLowerCase().includes('veo 2')
        ) || imageToVideoModels[0];
        
        // Debug logging for model selection
        console.log('🎯 Default models selected:', {
          textModel: defaultTextModel?.name,
          imageModel: defaultImageModel?.name,
          imageModelsAvailable: imageToVideoModels.map(m => ({ name: m.name, label: m.label }))
        });
        
        // Set default style from available styles
        const defaultStyle = videoConfig.availableStyles.find(s => 
          s.id === 'flux_watercolor' || 
          s.id === 'watercolor' || 
          s.id === 'realistic'
        ) || videoConfig.availableStyles[0];

        console.log('🎨 Default style selected:', {
          selectedStyle: defaultStyle?.id,
          availableStyles: videoConfig.availableStyles.map(s => s.id)
        });

        setFormData(prev => ({
          ...prev,
          style: defaultStyle?.id || 'flux_watercolor',
          resolution: '1280x720 (HD)',
          shotSize: videoConfig.defaultSettings.shotSize?.id || 'medium_shot',
          model: defaultTextModel?.name || '',
          generationType: 'text-to-video',
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

  // AICODE-NOTE: Ensure correct default model is selected when generation type or config changes
  useEffect(() => {
    if (!config) return;

    const defaultTextModel = config.textToVideoModels.find(m => 
      m.name.includes('sora') || m.name.includes('azure-openai/sora')
    ) || config.textToVideoModels[0];
    
    const defaultImageModel = config.imageToVideoModels.find(m => 
      m.name.includes('veo2') || 
      m.name.includes('veo-2') || 
      m.name.includes('google-cloud/veo2') ||
      m.label?.toLowerCase().includes('veo2') ||
      m.label?.toLowerCase().includes('veo 2')
    ) || config.imageToVideoModels[0];

    console.log('🎯 Setting default model for', formData.generationType, {
      textModel: defaultTextModel?.name,
      imageModel: defaultImageModel?.name,
      currentModel: formData.model
    });

    // Only update if no model is currently selected or if it's incompatible with current mode
    const currentModelInTextMode = config.textToVideoModels.find(m => m.name === formData.model);
    const currentModelInImageMode = config.imageToVideoModels.find(m => m.name === formData.model);
    
    const shouldUpdateModel = !formData.model || 
      (formData.generationType === 'text-to-video' && !currentModelInTextMode) ||
      (formData.generationType === 'image-to-video' && !currentModelInImageMode);

    if (shouldUpdateModel) {
      const targetModel = formData.generationType === 'text-to-video' 
        ? defaultTextModel?.name || ''
        : defaultImageModel?.name || '';
        
      console.log('🔄 Updating model to:', targetModel);
      setFormData(prev => ({
        ...prev,
        model: targetModel
      }));
    }
  }, [config, formData.generationType]);

  const handleInputChange = (field: keyof VideoGenerationFormData, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // AICODE-NOTE: Duration combobox handler
  const handleDurationSelect = (selectedValue: string) => {
    const numValue = Number.parseInt(selectedValue);
    setFormData(prev => ({
      ...prev,
      duration: numValue,
    }));
    setDurationOpen(false);
    setCustomDuration(''); // Clear custom input when preset is selected
  };

  // AICODE-NOTE: Custom duration input handler
  const handleCustomDurationSubmit = () => {
    const numValue = Number.parseInt(customDuration);
    if (numValue && numValue >= 1 && numValue <= 300) {
      setFormData(prev => ({
        ...prev,
        duration: numValue,
      }));
      setDurationOpen(false);
      setCustomDuration('');
    } else {
      toast.error('Duration must be between 1 and 300 seconds');
    }
  };

  // Generate random seed number
  const generateRandomSeed = () => {
    const newSeed = Math.floor(Math.random() * 1000000000000);
    setFormData(prev => ({
      ...prev,
      seed: newSeed,
    }));
  };

  const handleGenerationTypeChange = (type: 'text-to-video' | 'image-to-video') => {
    // Debug logging
    if (type === 'image-to-video') {
      console.log('🎬 Image-to-video models available:', config?.imageToVideoModels.map(m => ({
        name: m.name,
        label: m.label
      })));
    }
    
    setFormData(prev => ({
      ...prev,
      generationType: type,
      // Model will be set automatically by useEffect based on new generationType
    }));
  };

  const handleImageSelect = (file: File, previewUrl: string) => {
    setSelectedImage({ file, previewUrl });
    setFormData(prev => ({
      ...prev,
      file
    }));
  };

  const handleImageRemove = () => {
    if (selectedImage?.previewUrl) {
      URL.revokeObjectURL(selectedImage.previewUrl);
    }
    setSelectedImage(null);
    setFormData(prev => ({
      ...prev,
      file: undefined
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Additional validation for image-to-video mode
    if (formData.generationType === 'image-to-video' && !formData.file) {
      toast.error('Please select a source image for image-to-video generation');
      return;
    }
    
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
            <Loader2 className="size-8 animate-spin" />
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
          <Video className="size-5" />
          AI Video Generator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate high-quality videos using AI models from SuperDuperAI
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Generation Type Tabs */}
          <Tabs 
            value={formData.generationType} 
            onValueChange={(value: string) => handleGenerationTypeChange(value as 'text-to-video' | 'image-to-video')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text-to-video" className="flex items-center gap-2">
                <Type className="size-4" />
                Text to Video
              </TabsTrigger>
              <TabsTrigger value="image-to-video" className="flex items-center gap-2">
                <ImageIcon className="size-4" />
                Image to Video
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text-to-video" className="space-y-6 mt-6">
              {/* Text-to-Video Mode */}
              <div className="space-y-2">
                <Label htmlFor="prompt">Video Description *</Label>
                <EnhancedTextarea
                  id="prompt"
                  placeholder="Describe the video you want to generate..."
                  value={formData.prompt}
                  onChange={(e) => handleInputChange('prompt', e.target.value)}
                  disabled={disabled || isGenerating}
                  rows={3}
                  fullscreenTitle="Video Description"
                />
                <p className="text-xs text-muted-foreground">
                  Be detailed and specific for better results
                </p>
              </div>

              {/* Model Selection for Text-to-Video */}
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
                    {config.textToVideoModels.map((model) => (
                      <SelectItem key={model.name} value={model.name}>
                        <div className="flex items-center justify-between w-full">
                          <span>{getModelLabel(model)}</span>
                          {model.params?.price && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ${model.params.price}/sec
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {config.textToVideoModels.length} text-to-video models available
                </p>
              </div>
            </TabsContent>

            <TabsContent value="image-to-video" className="space-y-6 mt-6">
              {/* Image-to-Video Mode */}
              <ImageUpload
                onImageSelect={handleImageSelect}
                onImageRemove={handleImageRemove}
                selectedImage={selectedImage}
                disabled={disabled || isGenerating}
                className="mb-4"
              />

              <div className="space-y-2">
                <Label htmlFor="prompt">Animation Description (Optional)</Label>
                <EnhancedTextarea
                  id="prompt"
                  placeholder="Describe how you want the image to be animated..."
                  value={formData.prompt}
                  onChange={(e) => handleInputChange('prompt', e.target.value)}
                  disabled={disabled || isGenerating}
                  rows={2}
                  fullscreenTitle="Animation Description"
                />
                <p className="text-xs text-muted-foreground">
                  Describe the motion, camera movement, or animation style
                </p>
              </div>

              {/* Model Selection for Image-to-Video */}
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
                    {config.imageToVideoModels.map((model) => (
                      <SelectItem key={model.name} value={model.name}>
                        <div className="flex items-center justify-between w-full">
                          <span>{getModelLabel(model)}</span>
                          {model.params?.price && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ${model.params.price}/sec
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {config.imageToVideoModels.length} image-to-video models available
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Negative Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="negativePrompt">Negative Prompt (Optional)</Label>
            <EnhancedTextarea
              id="negativePrompt"
              placeholder="What to avoid in the video..."
              value={formData.negativePrompt || ''}
              onChange={(e) => handleInputChange('negativePrompt', e.target.value)}
              disabled={disabled || isGenerating}
              rows={2}
              fullscreenTitle="Negative Prompt"
            />
            <p className="text-xs text-muted-foreground">
              Specify what you don&apos;t want to see in the video
            </p>
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
                <Label htmlFor="duration">Duration</Label>
                <Popover open={durationOpen} onOpenChange={setDurationOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
                      role="combobox"
                      aria-expanded={durationOpen}
                      aria-haspopup="dialog"
                      disabled={disabled || isGenerating}
                    >
                      {!formData.duration || formData.duration === 0 ? (
                        <span className="text-muted-foreground">Select duration...</span>
                      ) : (
                        <span>
                          {DURATION_OPTIONS.find(option => option.value === formData.duration?.toString())?.label || `${formData.duration} seconds`}
                        </span>
                      )}
                      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0">
                    <Command>
                      <CommandInput placeholder="Search duration or type custom..." />
                      <CommandList>
                        <CommandEmpty>
                          <div className="p-2">
                            <div className="text-sm text-muted-foreground mb-2">
                              No preset found. Enter custom duration:
                            </div>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                min="1"
                                max="300"
                                placeholder="e.g. 25"
                                value={customDuration}
                                onChange={(e) => setCustomDuration(e.target.value)}
                                className="h-8"
                              />
                              <Button
                                size="sm"
                                onClick={handleCustomDurationSubmit}
                                disabled={!customDuration}
                              >
                                Set
                              </Button>
                            </div>
                          </div>
                        </CommandEmpty>
                        <CommandGroup heading="Preset durations">
                          {DURATION_OPTIONS.map((option) => (
                            <CommandItem
                              key={option.value}
                              value={option.value}
                              onSelect={(currentValue) => {
                                handleDurationSelect(currentValue);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 size-4",
                                  formData.duration === Number.parseInt(option.value) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{option.label}</span>
                                <span className="text-xs text-muted-foreground">{option.description}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Select from presets or type custom duration (1-300 seconds)
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
              <Label htmlFor="seed">Seed</Label>
              <div className="flex gap-2">
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
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generateRandomSeed}
                  disabled={disabled || isGenerating}
                  title="Generate random seed"
                >
                  <Shuffle className="size-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use same seed for reproducible results
              </p>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={
              disabled || 
              isGenerating || 
              (formData.generationType === 'text-to-video' && !formData.prompt.trim()) ||
              (formData.generationType === 'image-to-video' && !formData.file)
            }
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Generating Video...
              </>
            ) : (
              <>
                <Video className="mr-2 size-4" />
                Generate Video
              </>
            )}
          </Button>

          {/* Estimated cost */}
          {formData.duration && config.defaultSettings.model.price ? (
            <div className="text-center text-sm text-muted-foreground">
              Estimated cost: ${(formData.duration * config.defaultSettings.model.price).toFixed(2)}
            </div>
          ) : <></>}
        </form>
      </CardContent>
    </Card>
  );
} 