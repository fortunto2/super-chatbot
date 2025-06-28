

export interface GenerationResponse {
  success: boolean;
  fileId: string;
  projectId?: string;
  message?: string;
}

// Input types that match the expected API format
export interface ImageGenerationInput {
  prompt: string;
  model: { name: string };
  resolution: { width: number; height: number };
  style?: { id: string };
  shotSize?: { id: string };
  chatId?: string;
  seed?: number;
  negativePrompt?: string;
  steps?: number;
  sourceImageId?: string;
  sourceImageUrl?: string;
}

export interface VideoGenerationInput {
  prompt: string;
  model: { name: string };
  resolution: { width: number; height: number; aspectRatio?: string };
  chatId?: string;
  duration?: number;
  negativePrompt?: string;
  sourceImageId?: string;
  sourceImageUrl?: string;
}

export class GenerationClient {
  private baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate image using expected API format
   */
  async generateImage(payload: ImageGenerationInput): Promise<GenerationResponse> {
    const response = await fetch(`${this.baseUrl}/api/generate/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generate video using expected API format
   */
  async generateVideo(payload: VideoGenerationInput): Promise<GenerationResponse> {
    const response = await fetch(`${this.baseUrl}/api/generate/video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

// Singleton instance for easy usage
export const generationClient = new GenerationClient(); 