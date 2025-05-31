import { tool } from 'ai';
import { z } from 'zod';
import type { 
  MediaResolution, 
  MediaOption, 
  VideoGenerationConfig,
  VideoSettings 
} from '@/lib/types/media-settings';

const VIDEO_RESOLUTIONS: MediaResolution[] = [
  { width: 854, height: 480, label: "854×480 (480p)", aspectRatio: "16:9" },
  { width: 1280, height: 720, label: "1280×720 (720p HD)", aspectRatio: "16:9" },
  { width: 1920, height: 1080, label: "1920×1080 (1080p Full HD)", aspectRatio: "16:9" },
  { width: 2560, height: 1440, label: "2560×1440 (1440p QHD)", aspectRatio: "16:9" },
  { width: 3840, height: 2160, label: "3840×2160 (4K UHD)", aspectRatio: "16:9" },
  { width: 1080, height: 1920, label: "1080×1920 (Vertical)", aspectRatio: "9:16" },
];

const VIDEO_FRAME_RATES = [
  { value: 24, label: "24 FPS (Cinematic)" },
  { value: 30, label: "30 FPS (Standard)" },
  { value: 60, label: "60 FPS (Smooth)" },
  { value: 120, label: "120 FPS (High Speed)" },
];

const VIDEO_STYLES: MediaOption[] = [
  { id: 'realistic', label: 'Realistic', description: 'Natural and realistic video style' },
  { id: 'animated', label: 'Animated', description: 'Animation-style video' },
  { id: 'cinematic', label: 'Cinematic', description: 'Movie-like video quality' },
  { id: 'documentary', label: 'Documentary', description: 'Documentary-style filming' },
  { id: 'music-video', label: 'Music Video', description: 'Dynamic music video style' },
  { id: 'time-lapse', label: 'Time-lapse', description: 'Time-lapse video effect' },
];

export const configureVideoGeneration = tool({
  description: 'Configure settings for video generation including resolution, frame rate, and style',
  parameters: z.object({
    purpose: z.string().optional().describe('What the video will be used for'),
    duration: z.number().optional().describe('Desired video duration in seconds'),
  }),
  execute: async ({ purpose, duration = 10 }) => {
    const defaultResolution = VIDEO_RESOLUTIONS.find(r => r.width === 1920 && r.height === 1080)!;
    const defaultStyle = VIDEO_STYLES.find(s => s.id === 'realistic')!;

    const config: VideoGenerationConfig = {
      type: 'video-generation-settings',
      availableResolutions: VIDEO_RESOLUTIONS,
      availableFrameRates: VIDEO_FRAME_RATES,
      availableStyles: VIDEO_STYLES,
      defaultSettings: {
        resolution: defaultResolution,
        frameRate: 30,
        duration,
        style: defaultStyle,
        model: 'runway-gen2'
      }
    };

    return config;
  },
}); 