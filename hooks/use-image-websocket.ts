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
      console.log('❌ WebSocket disabled or missing projectId/handlers:', { enabled, projectId: !!projectId, handlersCount: eventHandlers.length });
      setIsConnected(false);
      setConnectionAttempts(0);
      return;
    }

    // Reset attempts for new project
    setConnectionAttempts(0);

    const attemptConnection = (attempt: number = 1) => {
      if (!mountedRef.current) {
        console.log('❌ Component unmounted, aborting connection');
        return;
      }
      
      console.log(`🔌 WebSocket connection attempt ${attempt}/${maxAttempts} for project:`, projectId);
      console.log('🔌 Store debug info:', imageWebsocketStore.getDebugInfo());
      
      // Use environment variable or fallback to default
      const baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'https://editor.superduperai.co';
      const url = `${baseUrl.replace('https://', 'wss://')}/api/v1/ws/project.${projectId}`;
      
      console.log('🔌 Attempting WebSocket connection to:', url);
      
      // Remove previous connection handler if exists
      if (connectionHandlerRef.current) {
        imageWebsocketStore.removeConnectionHandler(connectionHandlerRef.current);
      }
      
      // Add connection state handler
      const connectionHandler = (connected: boolean) => {
        if (!mountedRef.current) return; // Don't update state if unmounted
        
        console.log('🔌 Connection state changed:', connected, 'attempt:', attempt);
        setIsConnected(connected);
        
        // If connected successfully, reset attempts
        if (connected) {
          setConnectionAttempts(0);
        } else {
          // Connection failed or lost
          console.log(`❌ WebSocket connection attempt ${attempt} failed`);
          setConnectionAttempts(attempt);
          
          // Try again if we haven't reached max attempts
          if (attempt < maxAttempts) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
            console.log(`🔄 Retrying WebSocket connection in ${delay}ms...`);
            
            retryTimeoutRef.current = setTimeout(() => {
              attemptConnection(attempt + 1);
            }, delay);
          } else {
            console.log(`💥 WebSocket connection failed after ${maxAttempts} attempts. Working without real-time updates.`);
            setIsConnected(false);
          }
        }
      };
      
      // Store the connection handler for cleanup
      connectionHandlerRef.current = connectionHandler;
      imageWebsocketStore.addConnectionHandler(connectionHandler);
      
      // Initialize connection
      imageWebsocketStore.initConnection(url, eventHandlers);
    };

    // Start the first connection attempt
    attemptConnection(1);

    return () => {
      console.log('🔌 Cleaning up WebSocket connection for project:', projectId);
      
      // Clear retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      // Remove specific connection handler
      if (connectionHandlerRef.current) {
        imageWebsocketStore.removeConnectionHandler(connectionHandlerRef.current);
        connectionHandlerRef.current = null;
      }
      
      imageWebsocketStore.removeHandlers(eventHandlers);
      setConnectionAttempts(0);
    };
  }, [projectId, eventHandlers, enabled]);

  // Force cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Force cleanup on unmount');
      mountedRef.current = false;
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      if (connectionHandlerRef.current) {
        imageWebsocketStore.removeConnectionHandler(connectionHandlerRef.current);
      }
      
      imageWebsocketStore.removeHandlers(eventHandlers);
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