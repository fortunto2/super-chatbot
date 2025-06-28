/**
 * React hook for working with SuperDuperAI models
 * Uses typed client with OpenAPI models for type safety
 */

import { useState, useEffect, useCallback } from 'react';
import { modelsClient } from '@/lib/api/client/models-client';
import type { IGenerationConfigRead } from '@/lib/api/models/IGenerationConfigRead';
import type { ModelsResponse } from '@/lib/api/client/models-client';

export interface UseModelsReturn {
  // Data
  imageModels: IGenerationConfigRead[];
  videoModels: IGenerationConfigRead[];
  allModels: IGenerationConfigRead[];
  
  // State
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  
  // Actions
  refreshModels: () => Promise<void>;
  findModel: (name: string) => IGenerationConfigRead | undefined;
  clearCache: () => void;
}

export function useModels(): UseModelsReturn {
  const [imageModels, setImageModels] = useState<IGenerationConfigRead[]>([]);
  const [videoModels, setVideoModels] = useState<IGenerationConfigRead[]>([]);
  const [allModels, setAllModels] = useState<IGenerationConfigRead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadModels = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const response: ModelsResponse = await modelsClient.getModels(forceRefresh);
      
      setImageModels(response.data.imageModels);
      setVideoModels(response.data.videoModels);
      setAllModels(response.data.allModels);
      setLastUpdated(response.timestamp);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load models';
      setError(errorMessage);
      console.error('❌ Failed to load models:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshModels = useCallback(async () => {
    await loadModels(true);
  }, [loadModels]);

  const findModel = useCallback((name: string): IGenerationConfigRead | undefined => {
    return allModels.find(model => model.name === name);
  }, [allModels]);

  const clearCache = useCallback(() => {
    modelsClient.clearCache();
  }, []);

  // Load models on mount
  useEffect(() => {
    loadModels();
  }, [loadModels]);

  return {
    // Data
    imageModels,
    videoModels,
    allModels,
    
    // State
    isLoading,
    error,
    lastUpdated,
    
    // Actions
    refreshModels,
    findModel,
    clearCache,
  };
} 