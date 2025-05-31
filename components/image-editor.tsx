'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useImageGeneration } from '@/hooks/use-image-generation';
import type { MediaResolution, MediaOption, ImageModel } from '@/lib/types/media-settings';

interface ImageEditorProps {
  chatId?: string; // Optional chatId prop, if not provided will use useParams
  availableResolutions?: MediaResolution[];
  availableStyles?: MediaOption[];
  availableShotSizes?: MediaOption[];
  availableModels?: ImageModel[];
  defaultSettings?: {
    resolution: MediaResolution;
    style: MediaOption;
    shotSize: MediaOption;
    model: ImageModel;
    seed?: number;
  };
}

function ImageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="h-64 w-full bg-gray-200 rounded-lg animate-pulse" />
      <div className="flex gap-2">
        <div className="h-2 flex-1 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function ImageEditor({
  chatId: propChatId,
  availableResolutions = [],
  availableStyles = [],
  availableShotSizes = [],
  availableModels = [],
  defaultSettings
}: ImageEditorProps) {
  const params = useParams();
  const paramsChatId = params?.id as string;
  
  // Use prop chatId if provided, otherwise fall back to URL params
  const chatId = propChatId || paramsChatId;

  // Hooks must be called before any early returns
  const imageGeneration = useImageGeneration(chatId);

  const [prompt, setPrompt] = useState('');
  const [selectedResolution, setSelectedResolution] = useState(
    defaultSettings?.resolution || availableResolutions[0]
  );
  const [selectedStyle, setSelectedStyle] = useState(
    defaultSettings?.style || availableStyles[0]
  );
  const [selectedShotSize, setSelectedShotSize] = useState(
    defaultSettings?.shotSize || availableShotSizes[0]
  );
  const [selectedModel, setSelectedModel] = useState(
    defaultSettings?.model || availableModels[0]
  );

  console.log('🖼️ ImageEditor mounted:', { chatId, availableResolutions: availableResolutions?.length });

  // Early return with skeleton if no chatId
  if (!chatId) {
    console.warn('⚠️ No chatId found in params');
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Loading Image Editor...</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageSkeleton />
        </CardContent>
      </Card>
    );
  }

  console.log('🖼️ ImageEditor state:', {
    isGenerating: imageGeneration.isGenerating,
    status: imageGeneration.status,
    progress: imageGeneration.progress,
    error: imageGeneration.error,
    projectId: imageGeneration.projectId,
    isConnected: imageGeneration.isConnected
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    console.log('🚀 Starting image generation:', {
      prompt,
      chatId,
      selectedResolution,
      selectedStyle,
      selectedShotSize,
      selectedModel
    });

    try {
      await imageGeneration.generateImageAsync(
        selectedStyle || { id: 'flux_steampunk', label: 'Steampunk' },
        selectedResolution || { width: 1024, height: 1024, label: '1024x1024', aspectRatio: '1:1', qualityType: 'hd' },
        prompt,
        selectedModel || { id: 'flux-dev', label: 'Flux Dev' },
        selectedShotSize || { id: 'long-shot', label: 'Long Shot' },
        chatId
      );
    } catch (err) {
      console.error('❌ Generation failed:', err);
    }
  };

  const getStatusIcon = () => {
    if (imageGeneration.isGenerating) return '⏳';
    if (imageGeneration.error) return '❌';
    if (imageGeneration.imageUrl) return '✅';
    return '⚪';
  };

  const getConnectionIcon = () => {
    return imageGeneration.isConnected ? '🟢' : '🔴';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>AI Image Generator</CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <span>{getConnectionIcon()}</span>
            <span className="text-muted-foreground">
              {imageGeneration.isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Debug Info */}
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
          <div>Chat ID: {chatId}</div>
          <div>Project ID: {imageGeneration.projectId || 'None'}</div>
          <div>Status: {imageGeneration.status || 'Idle'}</div>
          <div>WS Connected: {imageGeneration.isConnected ? 'Yes' : 'No'}</div>
        </div>

        {/* Error Messages */}
        {imageGeneration.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800 text-sm">
              {imageGeneration.error}
            </div>
          </div>
        )}

        {/* Status and Progress */}
        {(imageGeneration.isGenerating || imageGeneration.status) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getStatusIcon()}</span>
              <span className="text-sm font-medium">
                {imageGeneration.status || 'Generating...'}
              </span>
            </div>
            {imageGeneration.progress !== undefined && imageGeneration.progress >= 0 && (
              <div className="space-y-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${imageGeneration.progress}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {Math.round(imageGeneration.progress)}%
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generated Image */}
        {imageGeneration.imageUrl && (
          <div className="space-y-2">
            <Label>Generated Image</Label>
            <div className="relative">
              <img
                src={imageGeneration.imageUrl}
                alt="Generated image"
                className="w-full h-auto rounded-lg border"
                onLoad={() => console.log('🖼️ Image loaded successfully')}
                onError={(e) => {
                  console.error('🖼️ Image load error:', e);
                  console.error('🖼️ Image URL:', imageGeneration.imageUrl);
                }}
              />
            </div>
          </div>
        )}

        {/* Generation Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Image Description</Label>
            <Input
              id="prompt"
              placeholder="Describe the image you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={imageGeneration.isGenerating}
            />
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Resolution */}
            {availableResolutions.length > 0 && (
              <div className="space-y-2">
                <Label>Resolution</Label>
                <Select
                  value={selectedResolution?.label}
                  onValueChange={(value) => {
                    const resolution = availableResolutions.find(r => r.label === value);
                    if (resolution) setSelectedResolution(resolution);
                  }}
                  disabled={imageGeneration.isGenerating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select resolution" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableResolutions.map((resolution) => (
                      <SelectItem key={resolution.label} value={resolution.label}>
                        {resolution.label} ({resolution.aspectRatio})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Style */}
            {availableStyles.length > 0 && (
              <div className="space-y-2">
                <Label>Style</Label>
                <Select
                  value={selectedStyle?.id}
                  onValueChange={(value) => {
                    const style = availableStyles.find(s => s.id === value);
                    if (style) setSelectedStyle(style);
                  }}
                  disabled={imageGeneration.isGenerating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStyles.map((style) => (
                      <SelectItem key={style.id} value={style.id}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Shot Size */}
            {availableShotSizes.length > 0 && (
              <div className="space-y-2">
                <Label>Shot Size</Label>
                <Select
                  value={selectedShotSize?.id}
                  onValueChange={(value) => {
                    const shotSize = availableShotSizes.find(s => s.id === value);
                    if (shotSize) setSelectedShotSize(shotSize);
                  }}
                  disabled={imageGeneration.isGenerating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select shot size" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableShotSizes.map((shotSize) => (
                      <SelectItem key={shotSize.id} value={shotSize.id}>
                        {shotSize.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Model */}
            {availableModels.length > 0 && (
              <div className="space-y-2">
                <Label>AI Model</Label>
                <Select
                  value={selectedModel?.id}
                  onValueChange={(value) => {
                    const model = availableModels.find(m => m.id === value);
                    if (model) setSelectedModel(model);
                  }}
                  disabled={imageGeneration.isGenerating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Current Settings Display */}
          <div className="flex flex-wrap gap-2">
            {selectedResolution && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {selectedResolution.label}
              </span>
            )}
            {selectedStyle && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {selectedStyle.label}
              </span>
            )}
            {selectedShotSize && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {selectedShotSize.label}
              </span>
            )}
            {selectedModel && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {selectedModel.label}
              </span>
            )}
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || imageGeneration.isGenerating}
            className="w-full"
          >
            {imageGeneration.isGenerating ? 'Generating...' : 'Generate Image'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
