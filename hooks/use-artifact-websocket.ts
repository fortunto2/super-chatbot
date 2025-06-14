'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useArtifact } from '@/hooks/use-artifact';
import { imageWebsocketStore } from '@/lib/websocket/image-websocket-store';
import type { ImageEventHandler } from '@/lib/websocket/image-websocket-store';

interface UseArtifactWebSocketOptions {
  enabled?: boolean;
}

export const useArtifactWebSocket = ({ enabled = true }: UseArtifactWebSocketOptions = {}) => {
  const { artifact, setArtifact } = useArtifact();
  const currentProjectIdRef = useRef<string | null>(null);
  const currentRequestIdRef = useRef<string | null>(null);
  const eventHandlerRef = useRef<ImageEventHandler | null>(null);
  const isConnectedRef = useRef(false);

  // Parse current artifact content to get projectId and requestId
  const getArtifactInfo = useCallback(() => {
    if (!artifact.content || artifact.kind !== 'image') {
      return { projectId: null, requestId: null };
    }

    try {
      const parsedContent = JSON.parse(artifact.content);
      return {
        projectId: parsedContent.projectId || null,
        requestId: parsedContent.requestId || null,
      };
    } catch (error) {
      console.log('🔌 Artifact WebSocket: Could not parse artifact content');
      return { projectId: null, requestId: null };
    }
  }, [artifact.content, artifact.kind]);

  // Create event handler for image completion
  const createEventHandler = useCallback((projectId: string, requestId: string): ImageEventHandler => {
    return (eventData) => {
      console.log('🔌 Artifact WebSocket: Received event:', {
        type: eventData.type,
        projectId: eventData.projectId,
        requestId: eventData.requestId,
        targetProjectId: projectId,
        targetRequestId: requestId
      });

      if (eventData.type === 'file' && eventData.object?.url) {
        const imageUrl = eventData.object.url;
        
        console.log('🔌 Artifact WebSocket: Updating artifact with completed image:', imageUrl);
        
        setArtifact((currentArtifact) => {
          if (currentArtifact.kind !== 'image') {
            console.log('🔌 Artifact WebSocket: Skipping update - not an image artifact');
            return currentArtifact;
          }

          try {
            const currentContent = JSON.parse(currentArtifact.content || '{}');
            
            // Check if this update is for our artifact
            const isMatch = currentContent.projectId === projectId || 
                           currentContent.requestId === requestId ||
                           currentContent.status === 'pending' || 
                           currentContent.status === 'streaming';

            if (!isMatch) {
              console.log('🔌 Artifact WebSocket: Event not matching current artifact, ignoring');
              return currentArtifact;
            }

            const updatedContent = {
              ...currentContent,
              status: 'completed',
              imageUrl: imageUrl,
              requestId: requestId || currentContent.requestId,
              projectId: projectId || currentContent.projectId,
              timestamp: Date.now(),
              message: 'Image generation completed!'
            };

            console.log('🔌 Artifact WebSocket: Successfully updated artifact content:', {
              previousStatus: currentContent.status,
              newStatus: updatedContent.status,
              hasImageUrl: !!updatedContent.imageUrl
            });

            return {
              ...currentArtifact,
              content: JSON.stringify(updatedContent),
              status: 'idle' as const
            };
          } catch (error) {
            console.error('🔌 Artifact WebSocket: Error updating artifact:', error);
            return currentArtifact;
          }
        });
      } else if (eventData.type === 'subscribe') {
        console.log('🔌 Artifact WebSocket: Successfully subscribed to project:', projectId);
      }
    };
  }, [setArtifact]);

  // Connect to WebSocket when artifact has projectId
  useEffect(() => {
    if (!enabled) return;

    const { projectId, requestId } = getArtifactInfo();

    // Skip if no projectId
    if (!projectId) {
      return;
    }

    // Skip if already connected to this project
    if (currentProjectIdRef.current === projectId) {
      console.log('🔌 Artifact WebSocket: Already connected to project:', projectId);
      return;
    }

    console.log('🔌 Artifact WebSocket: Connecting to project:', {
      projectId,
      requestId,
      artifactStatus: artifact.status,
      artifactDocumentId: artifact.documentId
    });

    // Clean up previous connection
    if (eventHandlerRef.current && currentProjectIdRef.current) {
      console.log('🔌 Artifact WebSocket: Cleaning up previous connection');
      imageWebsocketStore.removeProjectHandlers(currentProjectIdRef.current, [eventHandlerRef.current]);
    }

    // Create new event handler
    const eventHandler = createEventHandler(projectId, requestId || '');
    eventHandlerRef.current = eventHandler;
    currentProjectIdRef.current = projectId;
    currentRequestIdRef.current = requestId;

    // Connect to WebSocket
    const baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'https://editor.superduperai.co';
    const url = `${baseUrl.replace('https://', 'wss://')}/api/v1/ws/project.${projectId}`;
    
    console.log('🔌 Artifact WebSocket: Connecting to URL:', url);
    imageWebsocketStore.initConnection(url, [eventHandler]);
    isConnectedRef.current = true;

    // Cleanup function
    return () => {
      if (eventHandlerRef.current && currentProjectIdRef.current) {
        console.log('🔌 Artifact WebSocket: Cleaning up connection on unmount');
        imageWebsocketStore.removeProjectHandlers(currentProjectIdRef.current, [eventHandlerRef.current]);
      }
    };
  }, [enabled, getArtifactInfo, artifact.status, artifact.documentId, createEventHandler]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventHandlerRef.current && currentProjectIdRef.current) {
        console.log('🔌 Artifact WebSocket: Final cleanup');
        imageWebsocketStore.removeProjectHandlers(currentProjectIdRef.current, [eventHandlerRef.current]);
        isConnectedRef.current = false;
      }
    };
  }, []);

  return {
    isConnected: isConnectedRef.current,
    currentProjectId: currentProjectIdRef.current,
    currentRequestId: currentRequestIdRef.current,
  };
}; 