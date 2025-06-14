import { useCallback } from "react";
import type { ImageEventHandler, ImageWSMessage } from "@/lib/websocket/image-websocket-store";
import { imageMonitor, validateImageAssignment } from "@/lib/utils/image-debug";

export interface ImageGenerationState {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  imageUrl?: string;
  error?: string;
  projectId?: string;
  requestId?: string;
}

export type ImageStateUpdater = (update: Partial<ImageGenerationState>) => void;

export const useImageEventHandler = (
  projectId: string,
  onStateUpdate: ImageStateUpdater,
  requestId?: string
): ImageEventHandler => {
  return useCallback((eventData: ImageWSMessage) => {
    // Strict validation - only process events for our specific project
    if (!eventData.projectId && !projectId) {
      console.warn('⚠️ Event received without projectId, ignoring');
      return;
    }
    
    if (eventData.projectId && eventData.projectId !== projectId) {
      console.log(`🔒 Event for different project (${eventData.projectId} vs ${projectId}), ignoring`);
      return;
    }
    
    // Additional validation for request ID if provided
    if (requestId && eventData.requestId && eventData.requestId !== requestId) {
      console.log(`🔒 Event for different request (${eventData.requestId} vs ${requestId}), ignoring`);
      return;
    }
    
    console.log(`📨 Processing event for project ${projectId}:`, eventData.type);
    
    // Log the request for monitoring
    imageMonitor.logRequest({
      projectId: eventData.projectId || projectId,
      requestId: eventData.requestId || requestId,
      status: eventData.type,
      timestamp: Date.now(),
      imageUrl: eventData.imageUrl || eventData.url,
      error: eventData.error
    });
    
    switch (eventData.type) {
      case 'subscribe':
        // Handle subscription confirmation
        console.log(`✅ Subscribed to project ${projectId}`);
        break;

      case 'file':
        // Handle completed image files
        if (eventData.object) {
          console.log('📁 File object received:', eventData.object);
          const fileObject = eventData.object;
          // Check if it's an image type
          if (fileObject.type === 'image' && fileObject.url) {
            // Validate image assignment
            const isValid = validateImageAssignment(
              eventData.projectId || projectId,
              projectId,
              fileObject.url,
              eventData.requestId || requestId
            );
            
            if (isValid) {
              onStateUpdate({
                status: 'completed',
                imageUrl: fileObject.url,
                progress: 100,
                projectId: eventData.projectId || projectId,
                requestId: eventData.requestId
              });
            }
          }
        }
        // Also handle case where file data is directly in eventData
        else if (eventData.url) {
          // Validate image assignment
          const isValid = validateImageAssignment(
            eventData.projectId || projectId,
            projectId,
            eventData.url,
            eventData.requestId || requestId
          );
          
          if (isValid) {
            onStateUpdate({
              status: 'completed',
              imageUrl: eventData.url,
              progress: 100,
              projectId: eventData.projectId || projectId,
              requestId: eventData.requestId
            });
          }
        }
        break;

      case 'image':
        // Handle direct image objects
        console.log('🖼️ Image event received:', eventData);
        if (eventData.url) {
          // Validate image assignment
          const isValid = validateImageAssignment(
            eventData.projectId || projectId,
            projectId,
            eventData.url,
            eventData.requestId || requestId
          );
          
          if (isValid) {
            onStateUpdate({
              status: 'completed',
              imageUrl: eventData.url,
              progress: 100,
              projectId: eventData.projectId || projectId,
              requestId: eventData.requestId
            });
          }
        }
        break;

      case 'status_update':
        onStateUpdate({
          status: eventData.status as ImageGenerationState['status'] || 'processing',
          progress: eventData.progress,
          projectId: eventData.projectId || projectId,
          requestId: eventData.requestId
        });
        break;
      
      case 'image_ready':
      case 'image_completed':
        if (eventData.imageUrl || eventData.data?.imageUrl) {
          const imageUrl = eventData.imageUrl || eventData.data?.imageUrl;
          // Validate image assignment
          const isValid = validateImageAssignment(
            eventData.projectId || projectId,
            projectId,
            imageUrl,
            eventData.requestId || requestId
          );
          
          if (isValid) {
            onStateUpdate({
              status: 'completed',
              imageUrl,
              progress: 100,
              projectId: eventData.projectId || projectId,
              requestId: eventData.requestId
            });
          }
        }
        break;
      
      case 'error':
      case 'image_error':
        onStateUpdate({
          status: 'failed',
          error: eventData.error || eventData.data?.error || 'Unknown error occurred',
          projectId: eventData.projectId || projectId,
          requestId: eventData.requestId
        });
        break;
      
      case 'progress':
        onStateUpdate({
          status: 'processing',
          progress: eventData.progress || eventData.data?.progress || 0,
          projectId: eventData.projectId || projectId,
          requestId: eventData.requestId
        });
        break;

      case 'image_processing':
      case 'processing':
        onStateUpdate({
          status: 'processing',
          progress: eventData.progress || eventData.data?.progress,
          projectId: eventData.projectId || projectId,
          requestId: eventData.requestId
        });
        break;

      case 'image_pending':
      case 'pending':
        onStateUpdate({
          status: 'pending',
          progress: 0,
          projectId: eventData.projectId || projectId,
          requestId: eventData.requestId
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
            projectId: eventData.projectId || projectId,
            requestId: eventData.requestId
          });
        } else {
          console.log('❓ Unknown event type:', eventData.type);
        }
        break;
    }
  }, [projectId, onStateUpdate, requestId]);
}; 