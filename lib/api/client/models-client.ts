/**
 * Typed client for Models API operations
 * Uses OpenAPI models for type safety
 */

import type { IGenerationConfigRead } from '@/lib/api/models/IGenerationConfigRead';

export interface ModelsResponse {
  success: boolean;
  data: {
    imageModels: IGenerationConfigRead[];
    videoModels: IGenerationConfigRead[];
    allModels: IGenerationConfigRead[];
  };
  timestamp: string;
}

export interface ModelsError {
  success: false;
  error: string;
  details?: string;
}

export class ModelsClient {
  private baseUrl: string;
  private cache: { data: ModelsResponse; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get all available models (image and video)
   * Returns cached data if available and not expired
   */
  async getModels(forceRefresh = false): Promise<ModelsResponse> {
    // Check cache first
    if (!forceRefresh && this.cache && Date.now() - this.cache.timestamp < this.CACHE_DURATION) {
      console.log('📦 Using cached models data');
      return this.cache.data;
    }

    console.log('🔄 Fetching fresh models data from API');

    const response = await fetch(`${this.baseUrl}/api/config/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ModelsResponse = await response.json();
    
    // Cache the response
    this.cache = {
      data,
      timestamp: Date.now()
    };

    console.log(`✅ Loaded ${data.data.imageModels.length} image models and ${data.data.videoModels.length} video models`);
    
    return data;
  }

  /**
   * Get only image models
   */
  async getImageModels(forceRefresh = false): Promise<IGenerationConfigRead[]> {
    const response = await this.getModels(forceRefresh);
    return response.data.imageModels;
  }

  /**
   * Get only video models
   */
  async getVideoModels(forceRefresh = false): Promise<IGenerationConfigRead[]> {
    const response = await this.getModels(forceRefresh);
    return response.data.videoModels;
  }

  /**
   * Find a specific model by name
   */
  async findModel(name: string, forceRefresh = false): Promise<IGenerationConfigRead | undefined> {
    const response = await this.getModels(forceRefresh);
    return response.data.allModels.find(model => model.name === name);
  }

  /**
   * Clear cache to force fresh data on next request
   */
  clearCache(): void {
    this.cache = null;
    console.log('🗑️ Models cache cleared');
  }
}

// Singleton instance for easy usage
export const modelsClient = new ModelsClient(); 