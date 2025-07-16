import type { ITaskRead } from "@/lib/api";
import type { MediaOption, MediaResolution } from "@/lib/types/media-settings";

// Base interfaces for image generation
export interface ImageGenerationParams {
    prompt: string;
    model: any;
    style: MediaOption;
    resolution: MediaResolution;
    shotSize: MediaOption;
    negativePrompt?: string;
    seed?: number;
    batchSize?: number;
}

export interface ImageToImageParams extends ImageGenerationParams {
    file: File;
    sourceImageId?: string;
    sourceImageUrl?: string;
}

export interface ImageGenerationResult {
    success: boolean;
    projectId?: string;
    requestId?: string;
    fileId?: string;
    message?: string;
    error?: string;
    files?: any[];
    url?: string;
    method?: 'sse' | 'polling';
    tasks?: ITaskRead[]
}

// Base strategy interface
export interface ImageGenerationStrategy {
    readonly type: string;
    readonly requiresSourceImage: boolean;
    readonly requiresPrompt: boolean;
    generatePayload(params: ImageGenerationParams | ImageToImageParams): Promise<any>;
    validate(params: ImageGenerationParams | ImageToImageParams): { valid: boolean; error?: string };
} 