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
    // Only process events for our project
    if (eventData.projectId && eventData.projectId !== projectId) {
      return;
    }
    switch (eventData.type) {
      case 'subscribe':
        // Handle subscription confirmation
        break;

      case 'file':
        // Handle completed image files
        if (eventData.object) {
          console.log(eventData)
          const fileObject = eventData.object;
          // Check if it's an image type
          if (fileObject.type === 'image' && fileObject.url) {
            onStateUpdate({
              status: 'completed',
              imageUrl: fileObject.url,
              progress: 100,
            });
          }
        }
        // Also handle case where file data is directly in eventData
        else if (eventData.url) {
          onStateUpdate({
            status: 'completed',
            imageUrl: eventData.url,
            progress: 100,
          });
        }
        break;

      case 'image':
        // Handle direct image objects
        console.log(eventData)
        if (eventData.url) {
          console.log(eventData)
          onStateUpdate({
            status: 'completed',
            imageUrl: eventData.url,
            progress: 100,
          });
        }
        break;

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