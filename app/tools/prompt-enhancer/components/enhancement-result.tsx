'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Copy, Check, X, Sparkles, Loader2 } from 'lucide-react';
import type { EnhancementResult as EnhancementResultType } from '../hooks/use-prompt-enhancer';

interface EnhancementResultProps {
  result: EnhancementResultType | null;
  isEnhancing: boolean;
  onClear: () => void;
  onCopy: (text: string) => Promise<boolean>;
}

export function EnhancementResult({ result, isEnhancing, onClear, onCopy }: EnhancementResultProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = async (text: string, label: string) => {
    const success = await onCopy(text);
    if (success) {
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    }
  };

  if (isEnhancing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="size-5 text-purple-600 animate-spin" />
            Enhancing Prompt...
          </CardTitle>
          <CardDescription>
            AI is analyzing and improving your prompt. This usually takes a few seconds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Sparkles className="size-8 text-purple-500 animate-pulse mx-auto" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Processing your prompt...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Prompt</CardTitle>
          <CardDescription>
            Your enhanced prompt will appear here after processing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Sparkles className="size-8 text-gray-300 dark:text-gray-600 mx-auto" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Enter a prompt and click &quot;Enhance Prompt&quot; to get started.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-purple-600" />
            Enhanced Prompt
            {result.fallback && <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-xs rounded">Failed</span>}
            {!result.fallback && <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs rounded">Success</span>}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="size-4" />
          </Button>
        </div>
        <CardDescription>
          {result.error ? 'Enhancement failed, showing original prompt.' : 'Your prompt has been enhanced with AI-powered improvements.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Original Prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Original Prompt</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(result.originalPrompt, 'original')}
              className="h-6 px-2"
            >
              {copiedText === 'original' ? (
                <Check className="size-3 text-green-600" />
              ) : (
                <Copy className="size-3" />
              )}
            </Button>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm">
            {result.originalPrompt}
          </div>
        </div>

        <Separator />

        {/* Enhanced Prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-green-700 dark:text-green-400">Enhanced Prompt</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(result.enhancedPrompt, 'enhanced')}
              className="h-6 px-2"
            >
              {copiedText === 'enhanced' ? (
                <Check className="size-3 text-green-600" />
              ) : (
                <Copy className="size-3" />
              )}
            </Button>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md text-sm border border-green-200 dark:border-green-800">
            {result.enhancedPrompt}
          </div>
        </div>

        {/* Negative Prompt (if available) */}
        {result.negativePrompt && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-red-700 dark:text-red-400">Negative Prompt</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(result.negativePrompt!, 'negative')}
                  className="h-6 px-2"
                >
                  {copiedText === 'negative' ? (
                    <Check className="size-3 text-green-600" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </Button>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md text-sm border border-red-200 dark:border-red-800">
                {result.negativePrompt}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Use this to tell the AI what to avoid in your generation.
              </p>
            </div>
          </>
        )}

        <Separator />

        {/* Enhancement Details */}
        <div className="space-y-4">
          {/* Settings Used */}
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded border">{result.mediaType}</span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded border">{result.enhancementLevel}</span>
            {result.modelHint && <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded border">Model: {result.modelHint}</span>}
          </div>

          {/* Improvements Made */}
          {result.improvements && result.improvements.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Improvements Applied</h4>
              <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                {result.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Reasoning */}
          {result.reasoning && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Reasoning</h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md border border-blue-200 dark:border-blue-800">
                {result.reasoning}
              </p>
            </div>
          )}
        </div>

        {/* Quick Copy Actions */}
        <div className="grid grid-cols-1 gap-2">
          <Button
            variant="outline"
            onClick={() => handleCopy(result.enhancedPrompt, 'enhanced')}
            className="w-full"
          >
            {copiedText === 'enhanced' ? (
              <>
                <Check className="size-4 mr-2 text-green-600" />
                Copied Enhanced Prompt!
              </>
            ) : (
              <>
                <Copy className="size-4 mr-2" />
                Copy Enhanced Prompt
              </>
            )}
          </Button>
          
          {result.negativePrompt && (
            <Button
              variant="outline"
              onClick={() => handleCopy(result.negativePrompt!, 'negative')}
              className="w-full"
            >
              {copiedText === 'negative' ? (
                <>
                  <Check className="size-4 mr-2 text-green-600" />
                  Copied Negative Prompt!
                </>
              ) : (
                <>
                  <Copy className="size-4 mr-2" />
                  Copy Negative Prompt
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 