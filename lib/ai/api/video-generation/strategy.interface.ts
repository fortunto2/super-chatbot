import { GenerationTypeEnum } from "@/lib/api";
import { VideoModel } from "@/lib/config/superduperai";

// Base interfaces for video generation
export interface VideoGenerationParams {
    prompt: string;
    model: string ;
    style: string;
    resolution: string;
    shotSize: string;
    duration: number;
    frameRate: number;
    negativePrompt?: string;
    seed?: number;
    generationType?: GenerationTypeEnum
  }
  
  export interface ImageToVideoParams extends VideoGenerationParams {
    file: File
  }
  
  export interface VideoGenerationResult {
    success: boolean;
    projectId?: string;
    requestId?: string;
    fileId?: string;
    message?: string;
    error?: string;
    files?: any[];
    url?: string;
    method?: 'sse' | 'polling';
  }
  
  // Base strategy interface
  export interface VideoGenerationStrategy {
    readonly type: string;
    readonly requiresSourceImage: boolean;
    readonly requiresPrompt: boolean;
    generatePayload(params: VideoGenerationParams | ImageToVideoParams): Promise<any>;
    validate(params: VideoGenerationParams | ImageToVideoParams): { valid: boolean; error?: string };
  }