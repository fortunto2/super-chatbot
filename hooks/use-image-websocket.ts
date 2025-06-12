"use client";

import { useEffect, useState, useRef } from "react";
import { imageWebsocketStore, type ImageEventHandler } from "@/lib/websocket/image-websocket-store";

type Props = {
  projectId: string;
  eventHandlers: ImageEventHandler[];
  enabled?: boolean;
};

export const useImageWebsocket = ({ projectId, eventHandlers, enabled = true }: Props) => {
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxAttempts = 3;
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const connectionHandlerRef = useRef<((connected: boolean) => void) | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Clear any pending retries
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    if (!enabled || !projectId || eventHandlers.length === 0) {
      setIsConnected(false);
      setConnectionAttempts(0);
      return;
    }

    // Reset attempts for new project
    setConnectionAttempts(0);

    const attemptConnection = (attempt: number = 1) => {
      if (!mountedRef.current) {
        return;
      }
      
      // Use environment variable or fallback to default
      const baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'https://editor.superduperai.co';
      const url = `${baseUrl.replace('https://', 'wss://')}/api/v1/ws/project.${projectId}`;
      
      // Remove previous connection handler if exists
      if (connectionHandlerRef.current) {
        imageWebsocketStore.removeConnectionHandler(connectionHandlerRef.current);
      }
      
      // Add connection state handler
      const connectionHandler = (connected: boolean) => {
        if (!mountedRef.current) return; // Don't update state if unmounted
        
        setIsConnected(connected);
        
        // If connected successfully, reset attempts
        if (connected) {
          setConnectionAttempts(0);
        } else {
          // Connection failed or lost
          setConnectionAttempts(attempt);
          
          // Try again if we haven't reached max attempts
          if (attempt < maxAttempts) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
            
            retryTimeoutRef.current = setTimeout(() => {
              attemptConnection(attempt + 1);
            }, delay);
          } else {
            setIsConnected(false);
          }
        }
      };
      
      // Store the connection handler for cleanup
      connectionHandlerRef.current = connectionHandler;
      imageWebsocketStore.addConnectionHandler(connectionHandler);
      
      // Initialize connection with project-specific handlers
      imageWebsocketStore.initConnection(url, eventHandlers);
    };

    // Start the first connection attempt
    attemptConnection(1);

    return () => {
      // Clear retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      // Remove specific connection handler
      if (connectionHandlerRef.current) {
        imageWebsocketStore.removeConnectionHandler(connectionHandlerRef.current);
        connectionHandlerRef.current = null;
      }
      
      // Remove project-specific handlers
      imageWebsocketStore.removeProjectHandlers(projectId, eventHandlers);
      setConnectionAttempts(0);
    };
  }, [projectId, eventHandlers, enabled]);

  // Force cleanup on unmount with immediate execution
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      
      // Immediate cleanup without timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      if (connectionHandlerRef.current) {
        imageWebsocketStore.removeConnectionHandler(connectionHandlerRef.current);
      }
      
      // Clean up project-specific handlers immediately
      imageWebsocketStore.removeProjectHandlers(projectId, eventHandlers);
      
      // Force cleanup if too many handlers accumulated
      const debugInfo = imageWebsocketStore.getDebugInfo();
      if (debugInfo.totalHandlers > 5) {
        console.log('🧹 Force cleanup due to handler accumulation on unmount');
        imageWebsocketStore.forceCleanup();
      }
    };
  }, []);

  return {
    isConnected,
    connectionAttempts,
    maxAttempts,
    disconnect: () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      imageWebsocketStore.disconnect();
      setConnectionAttempts(0);
    },
  };
}; 