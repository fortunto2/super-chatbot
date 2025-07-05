import { API_NEXT_ROUTES } from '@/lib/config/next-api-routes';
import { useState, useCallback } from 'react';

export interface EnhancementParams {
  originalPrompt: string;
  mediaType?: 'image' | 'video' | 'text' | 'general';
  enhancementLevel?: 'basic' | 'detailed' | 'creative';
  targetAudience?: string;
  includeNegativePrompt?: boolean;
  modelHint?: string;
}

export interface EnhancementResult {
  originalPrompt: string;
  enhancedPrompt: string;
  negativePrompt?: string;
  mediaType: string;
  enhancementLevel: string;
  modelHint?: string;
  improvements: string[];
  reasoning: string;
  usage?: {
    copyPrompt: string;
    negativePrompt?: string;
  };
  error?: string;
  fallback?: boolean;
}

export function usePromptEnhancer() {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementResult, setEnhancementResult] = useState<EnhancementResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enhancePrompt = useCallback(async (params: EnhancementParams) => {
    if (isEnhancing) return;

    console.log('🚀 Starting prompt enhancement...', params);
    setIsEnhancing(true);
    setError(null);

    try {
      const response = await fetch(API_NEXT_ROUTES.ENHANCE_PROMPT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Enhancement completed:', result);
      
      setEnhancementResult(result);
      setError(null);

    } catch (error) {
      console.error('❌ Enhancement failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Set fallback result
      setEnhancementResult({
        originalPrompt: params.originalPrompt,
        enhancedPrompt: params.originalPrompt,
        mediaType: params.mediaType || 'general',
        enhancementLevel: params.enhancementLevel || 'basic',
        improvements: [],
        reasoning: 'Enhancement failed, showing original prompt',
        error: errorMessage,
        fallback: true,
      });
    } finally {
      setIsEnhancing(false);
    }
  }, [isEnhancing]);

  const clearResult = useCallback(() => {
    setEnhancementResult(null);
    setError(null);
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log('✅ Copied to clipboard:', text);
      return true;
    } catch (error) {
      console.error('❌ Failed to copy to clipboard:', error);
      return false;
    }
  }, []);

  return {
    isEnhancing,
    enhancementResult,
    error,
    enhancePrompt,
    clearResult,
    copyToClipboard,
  };
} 