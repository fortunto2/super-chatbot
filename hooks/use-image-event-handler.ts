import { useCallback } from "react";
import type { ImageEventHandler, ImageWSMessage } from "@/lib/websocket/image-websocket-store";

export interface ImageGenerationState {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  imageUrl?: string;
  error?: string;
  projectId?: string;
}

type ImageStateUpdater = (update: Partial<ImageGenerationState>) => void;

export const useImageEventHandler = (
  projectId: string,
  onStateUpdate: ImageStateUpdater
): ImageEventHandler => {
  return useCallback((eventData: ImageWSMessage) => {
    console.log('Processing image websocket event:', eventData);

    // Only process events for our project
    if (eventData.projectId && eventData.projectId !== projectId) {
      return;
    }

    switch (eventData.type) {
      case 'status_update':
        onStateUpdate({
          status: eventData.status as ImageGenerationState['status'] || 'processing',
          progress: eventData.progress,
        });
        break;
      
      case 'image_ready':
      case 'image_completed':
        onStateUpdate({
          status: 'completed',
          imageUrl: eventData.imageUrl || eventData.data?.imageUrl,
          progress: 100,
        });
        break;
      
      case 'error':
      case 'image_error':
        onStateUpdate({
          status: 'failed',
          error: eventData.error || eventData.data?.error || 'Unknown error occurred',
        });
        break;
      
      case 'progress':
        onStateUpdate({
          status: 'processing',
          progress: eventData.progress || eventData.data?.progress || 0,
        });
        break;

      case 'image_processing':
      case 'processing':
        onStateUpdate({
          status: 'processing',
          progress: eventData.progress || eventData.data?.progress,
        });
        break;

      case 'image_pending':
      case 'pending':
        onStateUpdate({
          status: 'pending',
          progress: 0,
        });
        break;
      
      default:
        console.log('Unknown image websocket message type:', eventData.type);
        // Try to extract useful info from unknown messages
        if (eventData.status) {
          onStateUpdate({
            status: eventData.status as ImageGenerationState['status'],
            progress: eventData.progress,
            imageUrl: eventData.imageUrl,
            error: eventData.error,
          });
        }
        break;
    }
  }, [projectId, onStateUpdate]);
}; 