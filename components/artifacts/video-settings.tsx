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
  VideoGenerationConfig, 
  VideoSettings,
  MediaResolution,
  MediaOption,
  VideoModel 
} from '@/lib/types/media-settings';
import { generateUUID } from '@/lib/utils';
import type { UseChatHelpers } from '@ai-sdk/react';

interface VideoSettingsProps {
  config: VideoGenerationConfig;
  onConfirm: (settings: VideoSettings) => void;
  selectedChatModel: string;
  selectedVisibilityType: 'public' | 'private';
  append?: UseChatHelpers['append'];
}

export function VideoSettings({
  config,
  onConfirm,
  selectedChatModel,
  selectedVisibilityType,
  append,
}: VideoSettingsProps) {
  const [selectedResolution, setSelectedResolution] = useState<MediaResolution>(
    config.defaultSettings.resolution
  );
  const [selectedStyle, setSelectedStyle] = useState<MediaOption>(
    config.defaultSettings.style
  );
  const [selectedShotSize, setSelectedShotSize] = useState<MediaOption>(
    config.defaultSettings.shotSize
  );
  const [selectedModel, setSelectedModel] = useState<VideoModel>(
    config.defaultSettings.model
  );
  const [selectedFrameRate, setSelectedFrameRate] = useState<number>(
    config.defaultSettings.frameRate
  );
  const [duration, setDuration] = useState<number>(
    config.defaultSettings.duration
  );
  const [negativePrompt, setNegativePrompt] = useState<string>(
    config.defaultSettings.negativePrompt || ''
  );
  const [seed, setSeed] = useState<string>('');

  const handleConfirm = () => {
    const settings: VideoSettings = {
      resolution: selectedResolution,
      style: selectedStyle,
      shotSize: selectedShotSize,
      model: selectedModel,
      frameRate: selectedFrameRate,
      duration: duration,
      negativePrompt: negativePrompt,
      seed: seed ? parseInt(seed) : undefined,
    };

    // Create user message for the selection
    const userMessage = `Selected video settings: ${selectedResolution.width}x${selectedResolution.height}, style: ${selectedStyle.label}, shot size: ${selectedShotSize.label}, model: ${selectedModel.label}, frame rate: ${selectedFrameRate} FPS, duration: ${duration}s${seed ? `, seed: ${seed}` : ''}`;

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
    setSeed(String(randomSeed));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 border rounded-lg bg-card">
      <div className="space-y-2 mb-6">
        <h3 className="text-lg font-semibold">Video Generation Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure your video generation preferences
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
              {config.availableModels.map((model) => (
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

      {/* Video-specific settings row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Frame Rate Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Frame Rate</label>
          <Select
            value={selectedFrameRate.toString()}
            onValueChange={(value) => {
              const frameRate = config.availableFrameRates.find(fr => fr.value.toString() === value);
              if (frameRate) {
                setSelectedFrameRate(frameRate.value);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select frame rate" />
            </SelectTrigger>
            <SelectContent>
              {config.availableFrameRates.map((frameRate) => (
                <SelectItem key={frameRate.value} value={frameRate.value.toString()}>
                  {frameRate.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Duration Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Duration (seconds)</label>
          <Input
            type="number"
            min="1"
            max="60"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 10)}
            placeholder="10"
          />
        </div>

        {/* Seed Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Seed (Optional)</label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Random"
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateRandomSeed}
              className="shrink-0"
            >
              Random
            </Button>
          </div>
        </div>
      </div>

      {/* Negative Prompt */}
      <div className="space-y-2 mb-6">
        <label className="text-sm font-medium">Negative Prompt (Optional)</label>
        <Textarea
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          placeholder="Describe what you don't want to see in the video..."
          className="resize-none"
          rows={3}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Video will be generated with the selected settings
        </div>
        <Button onClick={handleConfirm} className="min-w-[120px]">
          Generate Video
        </Button>
      </div>
    </div>
  );
} 