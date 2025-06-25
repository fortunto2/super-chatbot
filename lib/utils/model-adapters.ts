/**
 * Adapters for converting OpenAPI models to UI format
 */

import type { IGenerationConfigRead } from '@/lib/api/models/IGenerationConfigRead';

// UI adapted model type
export interface AdaptedModel extends IGenerationConfigRead {
  id: string;
  label: string;
  description: string;
  value: string;
  workflowPath: string;
  price: number;
}

/**
 * Convert OpenAPI IGenerationConfigRead to UI AdaptedModel format
 */
export function adaptOpenAPIModel(model: IGenerationConfigRead): AdaptedModel {
  return {
    ...model,
    id: model.name,
    label: model.label || model.name,
    description: `${model.type} - ${model.source}`,
    value: model.name,
    workflowPath: model.params?.workflow_path || '',
    price: model.params?.price || 0
  };
}

/**
 * Convert array of OpenAPI models to UI format
 */
export function adaptOpenAPIModels(models: IGenerationConfigRead[]): AdaptedModel[] {
  return models.map(adaptOpenAPIModel);
}

/**
 * Find adapted model by name
 */
export function findAdaptedModel(models: AdaptedModel[], name: string): AdaptedModel | undefined {
  return models.find(model => model.name === name);
}

/**
 * Get default model from adapted models array
 */
export function getDefaultAdaptedModel(models: AdaptedModel[], preferredNames: string[] = []): AdaptedModel | undefined {
  // Try preferred names first
  for (const name of preferredNames) {
    const model = findAdaptedModel(models, name);
    if (model) return model;
  }
  
  // Fallback to first available model
  return models[0];
}

/**
 * Sort models by priority (price, then name)
 */
export function sortAdaptedModels(models: AdaptedModel[]): AdaptedModel[] {
  return [...models].sort((a, b) => {
    // Sort by price first (lower price first)
    if (a.price !== b.price) {
      return a.price - b.price;
    }
    
    // Then by name alphabetically
    return a.name.localeCompare(b.name);
  });
} 