'use client';

import { Suspense } from 'react';
import { PromptEnhancerForm } from './components/prompt-enhancer-form';
import { EnhancementResult } from './components/enhancement-result';
import { usePromptEnhancer } from './hooks/use-prompt-enhancer';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Zap, Languages, Wand2 } from 'lucide-react';

// AICODE-NOTE: Main page component for standalone prompt enhancer tool
export default function PromptEnhancerPage() {
  const {
    isEnhancing,
    enhancementResult,
    enhancePrompt,
    clearResult,
    copyToClipboard,
  } = usePromptEnhancer();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <div className="p-3 rounded-full bg-purple-100">
            <Wand2 className="size-8 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Prompt Enhancer
          </h1>
          {/* Status Indicator */}
          <div className="flex items-center space-x-2 ml-4">
            <div className={`size-3 rounded-full ${
              isEnhancing ? 'bg-purple-500 animate-pulse' : 'bg-gray-400'
            }`} />
            <span className="text-sm text-gray-500">
              {isEnhancing ? 'Enhancing...' : 'Ready'}
            </span>
          </div>
        </div>
        
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Transform your simple prompts into detailed, professional descriptions for better AI generation results.
          Automatically translates text, adds quality terms, and optimizes for different AI models.
        </p>

        {/* Feature highlights */}
        <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <Languages className="size-4" />
            <span>Auto Translation</span>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="size-4" />
            <span>Quality Enhancement</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="size-4" />
            <span>Model Optimization</span>
          </div>
          <div className="flex items-center space-x-2">
            <Wand2 className="size-4" />
            <span>Smart Enhancement</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column - Input Form */}
        <div className="space-y-6">
          <Suspense fallback={<div>Loading form...</div>}>
            <PromptEnhancerForm
              onEnhance={enhancePrompt}
              isEnhancing={isEnhancing}
            />
          </Suspense>
        </div>

        {/* Right column - Results */}
        <div className="space-y-6">
          <Suspense fallback={<div>Loading results...</div>}>
            <EnhancementResult
              result={enhancementResult}
              isEnhancing={isEnhancing}
              onClear={clearResult}
              onCopy={copyToClipboard}
            />
          </Suspense>
        </div>
      </div>

      {/* Usage Tips */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">💡 Enhancement Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">For Images:</h4>
            <ul className="space-y-1">
              <li>• Use &quot;detailed&quot; level for professional photography terms</li>
              <li>• Try &quot;creative&quot; level for artistic and composition guidance</li>
              <li>• Specify model hints like &quot;FLUX&quot; or &quot;Imagen&quot; for optimization</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">For Videos:</h4>
            <ul className="space-y-1">
              <li>• Use &quot;Sora&quot; or &quot;VEO2&quot; model hints for best results</li>
              <li>• &quot;detailed&quot; level adds cinematography terms</li>
              <li>• Include negative prompts to avoid unwanted elements</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-sm text-gray-500 border-t pt-8">
        <p>
          Powered by <strong>AI SDK</strong> • 
          Uses the same language models as the main chatbot • 
          Enhanced prompts improve generation quality across all AI models
        </p>
      </div>
    </div>
  );
} 