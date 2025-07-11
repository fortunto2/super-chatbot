import type { IGenerationConfigRead } from '@/lib/api/models/IGenerationConfigRead';

/**
 * Get model display label
 * Client-safe utility function for getting model labels
 */
export function getModelLabel(model: IGenerationConfigRead): string {
  return model.label || model.name;
} 