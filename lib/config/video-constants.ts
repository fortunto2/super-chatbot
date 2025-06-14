import type { MediaResolution, MediaOption } from '@/lib/types/media-settings';

/**
 * Shared video generation constants
 * AICODE-NOTE: Centralized constants to eliminate duplication across video components
 */

export const VIDEO_RESOLUTIONS: MediaResolution[] = [
  // AICODE-NOTE: Reordered to put more economical options first
  { width: 1344, height: 768, label: "1344x768", aspectRatio: "16:9", qualityType: "hd" },
  { width: 1152, height: 896, label: "1152x896", aspectRatio: "4:3", qualityType: "hd" },
  { width: 1024, height: 1024, label: "1024x1024", aspectRatio: "1:1", qualityType: "hd" },
  { width: 1024, height: 1280, label: "1024x1280", aspectRatio: "4:5", qualityType: "hd" },
  { width: 768, height: 1344, label: "768x1344", aspectRatio: "9:16", qualityType: "hd" },
  // Premium options (more expensive)
  { width: 1920, height: 1080, label: "1920×1080", aspectRatio: "16:9", qualityType: "full_hd" },
  { width: 1664, height: 1216, label: "1664x1216", aspectRatio: "4:3", qualityType: "full_hd" },
  { width: 1408, height: 1408, label: "1408×1408", aspectRatio: "1:1", qualityType: "full_hd" },
  { width: 1408, height: 1760, label: "1408×1760", aspectRatio: "4:5", qualityType: "full_hd" },
  { width: 1080, height: 1920, label: "1080×1920", aspectRatio: "9:16", qualityType: "full_hd" },
];

export const SHOT_SIZES: MediaOption[] = [
  { id: 'extreme-long-shot', label: 'Extreme Long Shot', description: 'Shows vast landscapes or cityscapes with tiny subjects' },
  { id: 'long-shot', label: 'Long Shot', description: 'Shows full body of subject with surrounding environment' },
  { id: 'medium-shot', label: 'Medium Shot', description: 'Shows subject from waist up, good for conversations' },
  { id: 'medium-close-up', label: 'Medium Close-Up', description: 'Shows subject from chest up, good for portraits' },
  { id: 'close-up', label: 'Close-Up', description: 'Shows a subject\'s face or a small object in detail' },
  { id: 'extreme-close-up', label: 'Extreme Close-Up', description: 'Shows extreme detail of a subject, like eyes or small objects' },
  { id: 'two-shot', label: 'Two-Shot', description: 'Shows two subjects in frame, good for interactions' },
  { id: 'detail-shot', label: 'Detail Shot', description: 'Focuses on a specific object or part of a subject' },
];

export const VIDEO_FRAME_RATES = [
  { value: 24, label: "24 FPS (Cinematic)" },
  { value: 30, label: "30 FPS (Standard)" },
  { value: 60, label: "60 FPS (Smooth)" },
  { value: 120, label: "120 FPS (High Speed)" },
];

export enum ShotSizeEnum {
  EXTREME_LONG_SHOT = 'Extreme Long Shot',
  LONG_SHOT = 'Long Shot',
  MEDIUM_SHOT = 'Medium Shot',
  MEDIUM_CLOSE_UP = 'Medium Close-Up',
  CLOSE_UP = 'Close-Up',
  EXTREME_CLOSE_UP = 'Extreme Close-Up',
  TWO_SHOT = 'Two-Shot',
  DETAIL_SHOT = 'Detail Shot',
}

// AICODE-NOTE: Default economical settings
export const DEFAULT_VIDEO_RESOLUTION = VIDEO_RESOLUTIONS.find(r => r.width === 1344 && r.height === 768)!; // HD 16:9
export const DEFAULT_VIDEO_QUALITY = "hd"; // Instead of full_hd
export const DEFAULT_VIDEO_DURATION = 5; // Shorter duration for cost savings 