'use client';

export interface StoredImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  settings: {
    model: string;
    style: string;
    resolution: string;
    shotSize: string;
    seed?: number;
    batchSize?: number;
  };
  projectId?: string;
  requestId?: string;
}

export interface StoredVideo {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  settings: {
    model: string;
    style: string;
    resolution: string;
    shotSize: string;
    duration: number;
    frameRate: number;
    seed?: number;
  };
  fileId?: string;
  requestId?: string;
  thumbnailUrl?: string;
}

// Storage keys
const IMAGES_STORAGE_KEY = 'super-chatbot-generated-images';
const VIDEOS_STORAGE_KEY = 'super-chatbot-generated-videos';
const MAX_STORED_IMAGES = 50;
const MAX_STORED_VIDEOS = 30;

// Safe localStorage operations
function safeLocalStorageOperation<T>(operation: () => T, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback;
    return operation();
  } catch (error) {
    console.warn('LocalStorage operation failed:', error);
    return fallback;
  }
}

// Image storage functions
export function saveImage(image: StoredImage): void {
  safeLocalStorageOperation(() => {
    const existing = getStoredImages();
    
    // Check for duplicates
    const isDuplicate = existing.some(img => 
      img.id === image.id || (img.url === image.url && img.timestamp === image.timestamp)
    );
    
    if (isDuplicate) {
      console.log('🖼️ Image already stored, skipping duplicate');
      return;
    }
    
    const updated = [image, ...existing].slice(0, MAX_STORED_IMAGES);
    localStorage.setItem(IMAGES_STORAGE_KEY, JSON.stringify(updated));
    console.log('🖼️ ✅ Image saved to localStorage:', image.id);
  }, undefined);
}

export function getStoredImages(): StoredImage[] {
  return safeLocalStorageOperation(() => {
    const stored = localStorage.getItem(IMAGES_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as StoredImage[];
    return parsed.sort((a, b) => b.timestamp - a.timestamp);
  }, []);
}

export function deleteStoredImage(imageId: string): void {
  safeLocalStorageOperation(() => {
    const existing = getStoredImages();
    const filtered = existing.filter(img => img.id !== imageId);
    localStorage.setItem(IMAGES_STORAGE_KEY, JSON.stringify(filtered));
    console.log('🖼️ 🗑️ Image deleted from localStorage:', imageId);
  }, undefined);
}

export function clearStoredImages(): void {
  safeLocalStorageOperation(() => {
    localStorage.removeItem(IMAGES_STORAGE_KEY);
    console.log('🖼️ 🗑️ All stored images cleared');
  }, undefined);
}

// Video storage functions
export function saveVideo(video: StoredVideo): void {
  safeLocalStorageOperation(() => {
    const existing = getStoredVideos();
    
    const isDuplicate = existing.some(vid => 
      vid.id === video.id || (vid.url === video.url && vid.timestamp === video.timestamp)
    );
    
    if (isDuplicate) {
      console.log('🎥 Video already stored, skipping duplicate');
      return;
    }
    
    const updated = [video, ...existing].slice(0, MAX_STORED_VIDEOS);
    localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(updated));
    console.log('🎥 ✅ Video saved to localStorage:', video.id);
  }, undefined);
}

export function getStoredVideos(): StoredVideo[] {
  return safeLocalStorageOperation(() => {
    const stored = localStorage.getItem(VIDEOS_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as StoredVideo[];
    return parsed.sort((a, b) => b.timestamp - a.timestamp);
  }, []);
}

export function deleteStoredVideo(videoId: string): void {
  safeLocalStorageOperation(() => {
    const existing = getStoredVideos();
    const filtered = existing.filter(vid => vid.id !== videoId);
    localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(filtered));
    console.log('🎥 🗑️ Video deleted from localStorage:', videoId);
  }, undefined);
}

export function clearStoredVideos(): void {
  safeLocalStorageOperation(() => {
    localStorage.removeItem(VIDEOS_STORAGE_KEY);
    console.log('🎥 🗑️ All stored videos cleared');
  }, undefined);
}

// Utility functions
export function getStorageUsage(): { images: number; videos: number; totalSizeKB: number } {
  return safeLocalStorageOperation(() => {
    const images = getStoredImages();
    const videos = getStoredVideos();
    const totalSizeKB = Math.round((JSON.stringify(images).length + JSON.stringify(videos).length) / 1024);
    return { images: images.length, videos: videos.length, totalSizeKB };
  }, { images: 0, videos: 0, totalSizeKB: 0 });
}