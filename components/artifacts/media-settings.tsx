'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { 
  ImageGenerationConfig, 
  ImageSettings,
  VideoGenerationConfig,
  VideoSettings,
  MediaResolution,
  MediaOption,
  ImageModel,
  VideoModel,
  MediaGenerationConfig 
} from '@/lib/types/media-settings';
import { generateUUID } from '@/lib/utils';
import type { UseChatHelpers } from '@ai-sdk/react';

interface MediaSettingsProps {
  config: ImageGenerationConfig | VideoGenerationConfig;
  onConfirm: (settings: ImageSettings | VideoSettings) => void;
  selectedChatModel: string;
  selectedVisibilityType: 'public' | 'private';
  append?: UseChatHelpers['append'];
}

export function MediaSettings({
  config,
  onConfirm,
  selectedChatModel,
  selectedVisibilityType,
  append,
}: MediaSettingsProps) {
  const isVideoConfig = config.type === 'video-generation-settings';
  const videoConfig = isVideoConfig ? config as VideoGenerationConfig : null;
  const imageConfig = !isVideoConfig ? config as ImageGenerationConfig : null;

  const [selectedResolution, setSelectedResolution] = useState<MediaResolution>(
    config.defaultSettings.resolution
  );
  const [selectedStyle, setSelectedStyle] = useState<MediaOption>(
    config.defaultSettings.style
  );
  const [selectedShotSize, setSelectedShotSize] = useState<MediaOption>(
    config.defaultSettings.shotSize
  );
  const [selectedModel, setSelectedModel] = useState<ImageModel | VideoModel>(
    config.defaultSettings.model
  );
  const [seed, setSeed] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  
  // Video-specific states
  const [selectedFrameRate, setSelectedFrameRate] = useState<number>(
    isVideoConfig ? videoConfig!.defaultSettings.frameRate : 30
  );
  const [duration, setDuration] = useState<number>(
    isVideoConfig ? videoConfig!.defaultSettings.duration : 10
  );
  const [negativePrompt, setNegativePrompt] = useState<string>(
    isVideoConfig ? videoConfig!.defaultSettings.negativePrompt || '' : ''
  );

  const handleConfirm = () => {
    const baseSettings = {
      resolution: selectedResolution,
      style: selectedStyle,
      shotSize: selectedShotSize,
      model: selectedModel,
      seed: seed ? parseInt(seed) : undefined,
    };

    const settings: ImageSettings | VideoSettings = isVideoConfig 
      ? {
          ...baseSettings,
          frameRate: selectedFrameRate,
          duration: duration,
          negativePrompt: negativePrompt,
        } as VideoSettings
      : baseSettings as ImageSettings;

    // Create user message for the selection
    const userMessage = `Выбрано разрешение: ${selectedResolution.width}x${selectedResolution.height}, стиль: ${selectedStyle.label}, размер кадра: ${selectedShotSize.label}, модель: ${selectedModel.label}${seed ? `, сид: ${seed}` : ''}`;

    if (append) {
      append({
        id: generateUUID(), 
        role: 'user',
        content: userMessage,
      });
    }

    onConfirm(settings);
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
      return;
    }

    // Send message to generate image with current settings
    const generateMessage = `Создай изображение: ${prompt}. Используй разрешение ${selectedResolution.label}, стиль "${selectedStyle.label}", план "${selectedShotSize.label}", модель "${selectedModel.label}"${seed ? `, сид ${seed}` : ''}.`;

    if (append) {
      append({
        id: generateUUID(),
        role: 'user', 
        content: generateMessage,
      });
    }
  };

  const handleGenerateRandomSeed = () => {
    const randomSeed = Math.floor(Math.random() * 1000000);
    setSeed(String(randomSeed))
  }

  const mediaTypeLabel = isVideoConfig ? 'Video' : 'Image';

  return (
    <div className="w-full max-w-none mx-auto p-3 sm:p-4 lg:p-6 border rounded-lg bg-card">
      <div className="space-y-2 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg lg:text-xl font-semibold">{mediaTypeLabel} Generation Settings</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Configure your {mediaTypeLabel.toLowerCase()} generation preferences and describe what you want to create
        </p>
      </div>

      {/* Prompt Input Section */}
      <div className="mb-4 sm:mb-6 space-y-2">
        <label className="text-xs sm:text-sm font-medium">Prompt *</label>
        <Textarea
          placeholder={`Describe the ${mediaTypeLabel.toLowerCase()} you want to generate...`}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[80px] sm:min-h-[100px] resize-none text-sm"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Be specific about what you want to see in your {mediaTypeLabel.toLowerCase()}
        </p>
      </div>

      {/* Settings Grid - More compact for narrow spaces */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {/* Resolution Selector */}
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-medium">Resolution</label>
          <Select
            value={`${selectedResolution.width}x${selectedResolution.height}`}
            onValueChange={(value) => {
              const resolution = config.availableResolutions.find(
                r => `${r.width}x${r.height}` === value
              );
              if (resolution) {
                setSelectedResolution(resolution);
              }
            }}
          >
            <SelectTrigger className="w-full h-9 sm:h-10">
              <SelectValue placeholder="Select resolution" />
            </SelectTrigger>
            <SelectContent>
              {config.availableResolutions.map((resolution) => (
                <SelectItem
                  key={`${resolution.width}x${resolution.height}`}
                  value={`${resolution.width}x${resolution.height}`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm">{resolution.label}</span>
                    {resolution.aspectRatio && (
                      <span className="text-xs text-muted-foreground">
                        {resolution.aspectRatio}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Style Selector */}
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-medium">Style</label>
          <Select
            value={selectedStyle.id}
            onValueChange={(value) => {
              const style = config.availableStyles.find(s => s.id === value);
              if (style) {
                setSelectedStyle(style);
              }
            }}
          >
            <SelectTrigger className="w-full h-9 sm:h-10">
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              {config.availableStyles.map((style) => (
                <SelectItem key={style.id} value={style.id}>
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm">{style.label}</span>
                    {style.description && (
                      <span className="text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-[200px]">
                        {style.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Shot Size Selector */}
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-medium">Shot Size</label>
          <Select
            value={selectedShotSize.id}
            onValueChange={(value) => {
              const shotSize = config.availableShotSizes.find(s => s.id === value);
              if (shotSize) {
                setSelectedShotSize(shotSize);
              }
            }}
          >
            <SelectTrigger className="w-full h-9 sm:h-10">
              <SelectValue placeholder="Select shot size" />
            </SelectTrigger>
            <SelectContent>
              {config.availableShotSizes.map((shotSize) => (
                <SelectItem key={shotSize.id} value={shotSize.id}>
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm">{shotSize.label}</span>
                    {shotSize.description && (
                      <span className="text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-[200px]">
                        {shotSize.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model Selector */}
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-medium">Model</label>
          <Select
            value={selectedModel.id}
            onValueChange={(value) => {
              const model = config.availableModels.find(m => m.id === value);
              if (model) {
                setSelectedModel(model);
              }
            }}
          >
            <SelectTrigger className="w-full h-9 sm:h-10">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {config?.availableModels?.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm">{model.label}</span>
                    {model.description && (
                      <span className="text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-[200px]">
                        {model.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Video-specific settings */}
      {isVideoConfig && videoConfig && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Frame Rate Selector */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium">Frame Rate</label>
            <Select
              value={selectedFrameRate.toString()}
              onValueChange={(value) => setSelectedFrameRate(parseInt(value))}
            >
              <SelectTrigger className="w-full h-9 sm:h-10">
                <SelectValue placeholder="Select frame rate" />
              </SelectTrigger>
              <SelectContent>
                {videoConfig.availableFrameRates.map((frameRate) => (
                  <SelectItem key={frameRate.value} value={frameRate.value.toString()}>
                    <span className="text-xs sm:text-sm">{frameRate.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration Input */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium">Duration (seconds)</label>
            <Input
              type="number"
              placeholder="Duration in seconds"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 10)}
              className="w-full h-9 sm:h-10 text-sm"
              min="1"
              max="60"
            />
          </div>

          {/* Negative Prompt */}
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <label className="text-xs sm:text-sm font-medium">Negative Prompt (Optional)</label>
            <Input
              placeholder="What you don't want to see..."
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="w-full h-9 sm:h-10 text-sm"
            />
          </div>
        </div>
      )}

      {/* Seed Input - Compact */}
      <div className="mb-4 sm:mb-6">
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-medium">Seed (Optional)</label>
          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2'>
            <Input
              type="number"
              placeholder="Enter seed number for reproducible results"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              className="w-full sm:flex-1 h-9 sm:h-10 text-sm"
            />
            <Button 
              variant="outline" 
              onClick={handleGenerateRandomSeed} 
              className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm px-3"
            >
              Random
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Leave empty for random generation, or enter a number for reproducible results
          </p>
        </div>
      </div>

      {/* Preview of selected settings - Compact */}
      <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 p-3 sm:p-4 bg-muted/50 rounded-lg">
        <h4 className="text-xs sm:text-sm font-medium">Selected Settings Preview</h4>
        <div className="grid grid-cols-1 gap-1 sm:gap-2 text-xs sm:text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Resolution:</span>
            <span className="font-medium">{selectedResolution.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Style:</span>
            <span className="font-medium truncate ml-2">{selectedStyle.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shot Size:</span>
            <span className="font-medium truncate ml-2">{selectedShotSize.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Model:</span>
            <span className="font-medium truncate ml-2">{selectedModel.label}</span>
          </div>
          {isVideoConfig && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frame Rate:</span>
                <span className="font-medium">{selectedFrameRate} FPS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{duration}s</span>
              </div>
              {negativePrompt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Negative:</span>
                  <span className="font-medium text-xs truncate ml-2">{negativePrompt}</span>
                </div>
              )}
            </>
          )}
          {seed && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Seed:</span>
              <span className="font-medium">{seed}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons - Compact */}
      <div className="flex flex-col gap-2 sm:gap-3">
        <Button 
          onClick={handleGenerate} 
          className="w-full h-9 sm:h-10 text-sm"
          disabled={!prompt.trim()}
        >
          Generate {mediaTypeLabel}
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="outline"
          className="w-full h-9 sm:h-10 text-sm"
        >
          Save Settings Only
        </Button>
      </div>
      
      {!prompt.trim() && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Enter a prompt to enable generation
        </p>
      )}
    </div>
  );
} 