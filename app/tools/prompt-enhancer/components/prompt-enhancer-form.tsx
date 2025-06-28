'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, Sparkles } from 'lucide-react';
import { EnhancementParams } from '../hooks/use-prompt-enhancer';

interface PromptEnhancerFormProps {
  onEnhance: (params: EnhancementParams) => void;
  isEnhancing: boolean;
}

export function PromptEnhancerForm({ onEnhance, isEnhancing }: PromptEnhancerFormProps) {
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'text' | 'general'>('image');
  const [enhancementLevel, setEnhancementLevel] = useState<'basic' | 'detailed' | 'creative'>('detailed');
  const [targetAudience, setTargetAudience] = useState('');
  const [includeNegativePrompt, setIncludeNegativePrompt] = useState(false);
  const [modelHint, setModelHint] = useState('');

  const handleSubmit = () => {
    if (!originalPrompt.trim()) return;

    const params: EnhancementParams = {
      originalPrompt: originalPrompt.trim(),
      mediaType,
      enhancementLevel,
      targetAudience: targetAudience.trim() || undefined,
      includeNegativePrompt,
      modelHint: modelHint.trim() || undefined,
    };

    onEnhance(params);
  };

  const handleExamplePrompt = (prompt: string) => {
    setOriginalPrompt(prompt);
  };

  const examplePrompts = {
    image: [
      'мальчик с мячиком',
      'портрет девочки',
      'beautiful landscape',
      'cat playing piano'
    ],
    video: [
      'fast car racing',
      'человек идёт по дороге',
      'bird flying in sky',
      'ocean waves crashing'
    ],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="size-5 text-purple-600" />
          Enhance Your Prompt
        </CardTitle>
        <CardDescription>
          Transform simple prompts into detailed, professional descriptions for better AI generation results.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Original Prompt Input */}
        <div className="space-y-2">
          <Label htmlFor="original-prompt">Original Prompt</Label>
          <Textarea
            id="original-prompt"
            placeholder="Enter your prompt here... (any language is supported)"
            value={originalPrompt}
            onChange={(e) => setOriginalPrompt(e.target.value)}
            rows={4}
            className="resize-none"
          />
          
          {/* Example prompts */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Examples:</span>
            {examplePrompts[mediaType === 'text' || mediaType === 'general' ? 'image' : mediaType].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => handleExamplePrompt(example)}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Media Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="media-type">Media Type</Label>
          <Select value={mediaType} onValueChange={(value: any) => setMediaType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select media type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image">🖼️ Image Generation</SelectItem>
              <SelectItem value="video">🎥 Video Generation</SelectItem>
              <SelectItem value="text">📝 Text Generation</SelectItem>
              <SelectItem value="general">🔧 General Purpose</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Enhancement Level */}
        <div className="space-y-2">
          <Label htmlFor="enhancement-level">Enhancement Level</Label>
          <Select value={enhancementLevel} onValueChange={(value: any) => setEnhancementLevel(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select enhancement level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">✨ Basic - Translation + cleanup</SelectItem>
              <SelectItem value="detailed">🎯 Detailed - Professional terms + structure</SelectItem>
              <SelectItem value="creative">🚀 Creative - Advanced artistic language</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Model Hint (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="model-hint">AI Model Hint (Optional)</Label>
          <Input
            id="model-hint"
            placeholder="e.g., FLUX, Sora, VEO2, Imagen..."
            value={modelHint}
            onChange={(e) => setModelHint(e.target.value)}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Specify the AI model you&apos;ll use to optimize the prompt for that specific model.
          </p>
        </div>

        {/* Target Audience (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="target-audience">Target Audience (Optional)</Label>
          <Input
            id="target-audience"
            placeholder="e.g., professional presentation, social media, artistic portfolio..."
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
          />
        </div>

        {/* Include Negative Prompt */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="negative-prompt"
            checked={includeNegativePrompt}
            onChange={(e) => setIncludeNegativePrompt(e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="negative-prompt">Generate negative prompt</Label>
          <span className="text-xs text-gray-500 dark:text-gray-400">(Helps avoid unwanted elements)</span>
        </div>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit}
          disabled={!originalPrompt.trim() || isEnhancing}
          className="w-full"
          size="lg"
        >
          {isEnhancing ? (
            <>
              <Sparkles className="size-4 mr-2 animate-spin" />
              Enhancing...
            </>
          ) : (
            <>
              <Wand2 className="size-4 mr-2" />
              Enhance Prompt
            </>
          )}
        </Button>

        {/* Character count */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
          {originalPrompt.length} characters
        </div>
      </CardContent>
    </Card>
  );
} 