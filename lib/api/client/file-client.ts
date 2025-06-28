/**
 * Typed client for File API operations
 * Uses OpenAPI models for type safety
 */

import type { IFileRead } from '@/lib/api/models/IFileRead';

export class FileClient {
  private baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get file by ID
   * Returns the same type as OpenAPI FileService.fileGetById
   */
  async getById(fileId: string): Promise<IFileRead> {
    const response = await fetch(`${this.baseUrl}/api/file/${fileId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

// Singleton instance for easy usage
export const fileClient = new FileClient(); 