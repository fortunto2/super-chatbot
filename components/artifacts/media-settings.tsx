'use client';

import React, { useState } from 'react';
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
  AdaptedModel,
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
  const [selectedModel, setSelectedModel] = useState<AdaptedModel>(
    config.defaultSettings.model
  );
  const [seed, setSeed] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [batchSize, setBatchSize] = useState<number>(1);
  
  // Video-specific states
  const [selectedFrameRate, setSelectedFrameRate] = useState<number>(
    isVideoConfig ? videoConfig?.defaultSettings.frameRate || 30 : 30
  );
  const [duration, setDuration] = useState<number>(
    isVideoConfig ? videoConfig?.defaultSettings.duration || 10 : 10
  );
  const [negativePrompt, setNegativePrompt] = useState<string>(
    isVideoConfig ? videoConfig?.defaultSettings.negativePrompt || '' : ''
  );

  const handleConfirm = () => {
    const baseSettings = {
      resolution: selectedResolution,
      style: selectedStyle,
      shotSize: selectedShotSize,
      model: selectedModel,
      seed: seed ? Number.parseInt(seed) : undefined,
      batchSize: !isVideoConfig ? batchSize : undefined, // Only for images
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
    const userMessage = `Selected resolution: ${selectedResolution.width}x${selectedResolution.height}, style: ${selectedStyle.label}, shot size: ${selectedShotSize.label}, model: ${selectedModel.label}${seed ? `, seed: ${seed}` : ''}${!isVideoConfig && batchSize > 1 ? `, batch size: ${batchSize}` : ''}`;

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

    // Generate appropriate message based on media type
    const mediaType = isVideoConfig ? 'video' : 'image';
    const generateMessage = `Generate ${mediaType}: ${prompt}. Use resolution ${selectedResolution.label}, style "${selectedStyle.label}", shot size "${selectedShotSize.label}", model "${selectedModel.label}"${seed ? `, seed ${seed}` : ''}${!isVideoConfig && batchSize > 1 ? `, batch size ${batchSize}` : ''}${isVideoConfig && selectedFrameRate ? `, frame rate ${selectedFrameRate} FPS` : ''}${isVideoConfig && duration ? `, duration ${duration} sec` : ''}.`;

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
    <div className="w-full max-w-none mx-auto p-3 border rounded-lg bg-card">
      <div className="space-y-1 mb-4">
        <h3 className="text-sm font-semibold">{mediaTypeLabel} Generation Settings</h3>
        <p className="text-xs text-muted-foreground">
          Configure settings and describe what you want to create
        </p>
      </div>

      {/* Prompt Input Section */}
      <div className="mb-4 space-y-1">
        <label htmlFor="prompt-input" className="text-xs font-medium">Prompt *</label>
        <Textarea
          id="prompt-input"
          placeholder={`Describe the ${mediaTypeLabel.toLowerCase()} you want to generate...`}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[60px] resize-none text-sm"
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          Be specific about what you want to see
        </p>
      </div>

      {/* Settings Grid - Optimized for artifact layout */}
      <div className="grid grid-cols-1 gap-3 mb-4">
        {/* Resolution Selector */}
        <div className="space-y-1">
          <label htmlFor="resolution-select" className="text-xs font-medium">Resolution</label>
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
            <SelectTrigger className="w-full h-8">
              <SelectValue placeholder="Select resolution" />
            </SelectTrigger>
            <SelectContent>
              {config.availableResolutions.map((resolution) => (
                <SelectItem
                  key={`${resolution.width}x${resolution.height}`}
                  value={`${resolution.width}x${resolution.height}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs">{resolution.label}</span>
                    {resolution.aspectRatio && (
                      <span className="text-xs text-muted-foreground ml-2">
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
        <div className="space-y-1">
          <label htmlFor="style-select" className="text-xs font-medium">Style</label>
          <Select
            value={selectedStyle.id}
            onValueChange={(value) => {
              const style = config.availableStyles.find(s => s.id === value);
              if (style) {
                setSelectedStyle(style);
              }
            }}
          >
            <SelectTrigger className="w-full h-8">
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              {config.availableStyles.map((style) => (
                <SelectItem key={style.id} value={style.id}>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs">{style.label}</span>
                    {style.description && (
                      <span className="text-xs text-muted-foreground truncate max-w-[100px] ml-2">
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
        <div className="space-y-1">
          <label htmlFor="shot-size-select" className="text-xs font-medium">Shot Size</label>
          <Select
            value={selectedShotSize.id}
            onValueChange={(value) => {
              const shotSize = config.availableShotSizes.find(s => s.id === value);
              if (shotSize) {
                setSelectedShotSize(shotSize);
              }
            }}
          >
            <SelectTrigger className="w-full h-8">
              <SelectValue placeholder="Select shot size" />
            </SelectTrigger>
            <SelectContent>
              {config.availableShotSizes.map((shotSize) => (
                <SelectItem key={shotSize.id} value={shotSize.id}>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs">{shotSize.label}</span>
                    {shotSize.description && (
                      <span className="text-xs text-muted-foreground truncate max-w-[100px] ml-2">
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
        <div className="space-y-1">
          <label htmlFor="model-select" className="text-xs font-medium">Model</label>
          <Select
            value={selectedModel.id}
            onValueChange={(value) => {
              const model = config.availableModels.find(m => m.id === value);
              if (model) {
                setSelectedModel(model);
              }
            }}
          >
            <SelectTrigger className="w-full h-8">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {config?.availableModels?.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs">{model.label}</span>
                    {model.description && (
                      <span className="text-xs text-muted-foreground truncate max-w-[120px] ml-2">
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
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Frame Rate Selector */}
          <div className="space-y-1">
            <label htmlFor="frame-rate-select" className="text-xs font-medium">Frame Rate</label>
            <Select
              value={selectedFrameRate.toString()}
              onValueChange={(value) => setSelectedFrameRate(Number.parseInt(value))}
            >
              <SelectTrigger className="w-full h-8">
                <SelectValue placeholder="Select frame rate" />
              </SelectTrigger>
              <SelectContent>
                {videoConfig.availableFrameRates.map((frameRate) => (
                  <SelectItem key={frameRate.value} value={frameRate.value.toString()}>
                    <span className="text-xs">{frameRate.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration Input */}
          <div className="space-y-1">
            <label htmlFor="duration-input" className="text-xs font-medium">Duration (sec)</label>
            <Input
              id="duration-input"
              type="number"
              placeholder="Duration"
              value={duration}
              onChange={(e) => setDuration(Number.parseInt(e.target.value) || 10)}
              className="w-full h-8 text-sm"
              min="1"
              max="60"
            />
          </div>

          {/* Negative Prompt */}
          <div className="space-y-1 col-span-2">
            <label htmlFor="negative-prompt-input" className="text-xs font-medium">Negative Prompt (Optional)</label>
            <Input
              id="negative-prompt-input"
              placeholder="What you don't want to see..."
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="w-full h-8 text-sm"
            />
          </div>
        </div>
      )}

      {/* Seed and Batch Size - Compact Row */}
      <div className="mb-4 grid grid-cols-1 gap-3">
        {/* Seed Input */}
        <div className="space-y-1">
          <label htmlFor="seed-input" className="text-xs font-medium">Seed (Optional)</label>
          <div className='flex items-center gap-2'>
            <Input
              id="seed-input"
              type="number"
              placeholder="Enter seed number"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              className="flex-1 h-8 text-sm"
            />
            <Button 
              variant="outline" 
              onClick={handleGenerateRandomSeed} 
              className="h-8 text-xs px-3 shrink-0"
            >
              Random
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Leave empty for random generation
          </p>
        </div>

        {/* Batch Size - Only for Images */}
        {!isVideoConfig && (
          <div className="space-y-1">
            <label htmlFor="batch-size-select" className="text-xs font-medium">Batch Size</label>
            <Select
              value={batchSize.toString()}
              onValueChange={(value) => setBatchSize(Number.parseInt(value))}
            >
              <SelectTrigger className="w-full h-8">
                <SelectValue placeholder="Select batch size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs">1 image</span>
                    <span className="text-xs text-muted-foreground ml-2">Standard</span>
                  </div>
                </SelectItem>
                <SelectItem value="2">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs">2 images</span>
                    <span className="text-xs text-muted-foreground ml-2">Compare</span>
                  </div>
                </SelectItem>
                <SelectItem value="3">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs">3 images</span>
                    <span className="text-xs text-muted-foreground ml-2">Max variety</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Generate multiple variations simultaneously
            </p>
          </div>
        )}
      </div>

      {/* Preview of selected settings - Compact */}
      <div className="mb-4 p-2 bg-muted/50 rounded-lg space-y-2">
        <h4 className="text-xs font-medium">Settings Summary</h4>
        <div className="grid grid-cols-1 gap-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Resolution:</span>
            <span className="font-medium">{selectedResolution.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Style:</span>
            <span className="font-medium truncate ml-2 max-w-[120px]">{selectedStyle.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Model:</span>
            <span className="font-medium truncate ml-2 max-w-[120px]">{selectedModel.label}</span>
          </div>
          {isVideoConfig && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Video:</span>
              <span className="font-medium">{selectedFrameRate} FPS, {duration}s</span>
            </div>
          )}
          {seed && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Seed:</span>
              <span className="font-medium">{seed}</span>
            </div>
          )}
          {!isVideoConfig && batchSize > 1 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Batch Size:</span>
              <span className="font-medium">{batchSize} image{batchSize > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons - Compact */}
      <div className="flex flex-col gap-2">
        <Button 
          onClick={handleGenerate} 
          className="w-full h-8 text-sm"
          disabled={!prompt.trim()}
        >
          Generate {mediaTypeLabel}
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="outline"
          className="w-full h-8 text-sm"
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