'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  MediaResolution,
  MediaOption,
  ImageModel 
} from '@/lib/types/media-settings';
import { generateUUID } from '@/lib/utils';
import type { UseChatHelpers } from '@ai-sdk/react';

interface MediaSettingsProps {
  config: ImageGenerationConfig;
  onConfirm: (settings: ImageSettings) => void;
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
  const [selectedResolution, setSelectedResolution] = useState<MediaResolution>(
    config.defaultSettings.resolution
  );
  const [selectedStyle, setSelectedStyle] = useState<MediaOption>(
    config.defaultSettings.style
  );
  const [selectedShotSize, setSelectedShotSize] = useState<MediaOption>(
    config.defaultSettings.shotSize
  );
  const [selectedModel, setSelectedModel] = useState<ImageModel>(
    config.defaultSettings.model
  );
  const [seed, setSeed] = useState<string>('');


  const handleConfirm = () => {
    const settings: ImageSettings = {
      resolution: selectedResolution,
      style: selectedStyle,
      shotSize: selectedShotSize,
      model: selectedModel,
      seed: seed ? parseInt(seed) : undefined,
    };

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

  const handleGenerateRandomSeed = () => {
    const randomSeed = Math.floor(Math.random() * 1000000);
    setSeed(String(randomSeed))
  }

  return (
    <div className="max-w-4xl mx-auto p-6 border rounded-lg bg-card">
      <div className="space-y-2 mb-6">
        <h3 className="text-lg font-semibold">Image Generation Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure your image generation preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Resolution Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Resolution</label>
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
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select resolution" />
            </SelectTrigger>
            <SelectContent>
              {config.availableResolutions.map((resolution) => (
                <SelectItem
                  key={`${resolution.width}x${resolution.height}`}
                  value={`${resolution.width}x${resolution.height}`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm">{resolution.label}</span>
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
          <label className="text-sm font-medium">Style</label>
          <Select
            value={selectedStyle.id}
            onValueChange={(value) => {
              const style = config.availableStyles.find(s => s.id === value);
              if (style) {
                setSelectedStyle(style);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              {config.availableStyles.map((style) => (
                <SelectItem key={style.id} value={style.id}>
                  <div className="flex flex-col">
                    <span className="text-sm">{style.label}</span>
                    {style.description && (
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
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
          <label className="text-sm font-medium">Shot Size</label>
          <Select
            value={selectedShotSize.id}
            onValueChange={(value) => {
              const shotSize = config.availableShotSizes.find(s => s.id === value);
              if (shotSize) {
                setSelectedShotSize(shotSize);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select shot size" />
            </SelectTrigger>
            <SelectContent>
              {config.availableShotSizes.map((shotSize) => (
                <SelectItem key={shotSize.id} value={shotSize.id}>
                  <div className="flex flex-col">
                    <span className="text-sm">{shotSize.label}</span>
                    {shotSize.description && (
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
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
          <label className="text-sm font-medium">Model</label>
          <Select
            value={selectedModel.id}
            onValueChange={(value) => {
              const model = config.availableModels.find(m => m.id === value);
              if (model) {
                setSelectedModel(model);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {config?.availableModels?.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex flex-col">
                    <span className="text-sm">{model.label}</span>
                    {model.description && (
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
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

      {/* Seed Input */}
      <div className="mb-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Seed (Optional)</label>
          <div className='flex items-center gap-2'>
          <Input
            type="number"
            placeholder="Enter seed number for reproducible results"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            className="w-full max-w-sm"
          />
          <Button variant="outline" onClick={handleGenerateRandomSeed}>
            Random
          </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Leave empty for random generation, or enter a number for reproducible results
          </p>
        </div>
      </div>

      {/* Preview of selected settings */}
      <div className="space-y-3 mb-6 p-4 bg-muted/50 rounded-lg">
        <h4 className="text-sm font-medium">Selected Settings Preview</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Resolution:</span>{' '}
            <span className="font-medium">{selectedResolution.label}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Style:</span>{' '}
            <span className="font-medium">{selectedStyle.label}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Shot Size:</span>{' '}
            <span className="font-medium">{selectedShotSize.label}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Model:</span>{' '}
            <span className="font-medium">{selectedModel.label}</span>
          </div>
          {seed && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Seed:</span>{' '}
              <span className="font-medium">{seed}</span>
            </div>
          )}
        </div>
      </div>

      <Button onClick={handleConfirm} className="w-full">
        Confirm Settings
      </Button>
    </div>
  );
} 