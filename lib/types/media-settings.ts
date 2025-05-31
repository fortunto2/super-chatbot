// Base types for media settings system
export interface MediaOption {
  id: string;
  label: string;
  description?: string;
}

export interface MediaResolution {
  width: number;
  height: number;
  label: string;
  aspectRatio?: string;
  qualityType?: "hd" | "full_hd"
}

export interface ImageModel {
  id: string;
  label: string;
  description?: string;
}

// Image-specific types
export interface ImageSettings {
  resolution: MediaResolution;
  style: MediaOption;
  shotSize: MediaOption;
  model: ImageModel;
  seed?: number;
}

export interface ImageGenerationConfig {
  type: 'image-generation-settings';
  availableResolutions: MediaResolution[];
  availableStyles: MediaOption[];
  availableShotSizes: MediaOption[];
  availableModels: ImageModel[];
  defaultSettings: ImageSettings;
}

// Video-specific types (for future use)
export interface VideoSettings {
  resolution: MediaResolution;
  frameRate: number;
  duration: number;
  style: MediaOption;
  model: string;
}

export interface VideoGenerationConfig {
  type: 'video-generation-settings';
  availableResolutions: MediaResolution[];
  availableFrameRates: { value: number; label: string }[];
  availableStyles: MediaOption[];
  defaultSettings: VideoSettings;
}

// Audio-specific types (for future use)
export interface AudioSettings {
  format: MediaOption;
  quality: MediaOption;
  duration: number;
  style: MediaOption;
}

export interface AudioGenerationConfig {
  type: 'audio-generation-settings';
  availableFormats: MediaOption[];
  availableQualities: MediaOption[];
  availableStyles: MediaOption[];
  defaultSettings: AudioSettings;
}

// Union type for all media configurations
export type MediaGenerationConfig = 
  | ImageGenerationConfig 
  | VideoGenerationConfig 
  | AudioGenerationConfig;

// Helper type for extracting settings from config
export type ExtractSettings<T extends MediaGenerationConfig> = 
  T extends ImageGenerationConfig ? ImageSettings :
  T extends VideoGenerationConfig ? VideoSettings :
  T extends AudioGenerationConfig ? AudioSettings :
  never; 