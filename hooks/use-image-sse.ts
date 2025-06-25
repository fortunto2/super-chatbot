"use client";

import { useEffect, useState, useRef } from "react";
import { imageSSEStore, type ImageEventHandler } from "@/lib/websocket/image-sse-store";
import { createFileSSEURL } from "@/lib/config/superduperai";

type Props = {
  fileId: string; // Only fileId needed for image/video generation
  eventHandlers: ImageEventHandler[];
  enabled?: boolean;
};

// AICODE-NOTE: SSE-based hook for file events only
export const useImageSSE = ({ fileId, eventHandlers, enabled = true }: Props) => {
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxAttempts = 3;
  const connectionHandlerRef = useRef<((connected: boolean) => void) | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // AICODE-NOTE: Main effect for SSE connection management
  useEffect(() => {
    if (!enabled || !fileId || eventHandlers.length === 0) {
      setIsConnected(false);
      setConnectionAttempts(0);
      return;
    }

    console.log('🔌 Setting up SSE connection for file:', fileId);

    // Reset attempts for new file
    setConnectionAttempts(0);

    // Remove previous connection handler if exists
    if (connectionHandlerRef.current) {
      imageSSEStore.removeConnectionHandler(connectionHandlerRef.current);
    }
    
    // Add connection state handler
    const connectionHandler = (connected: boolean) => {
      if (!mountedRef.current) return;
      
      console.log('📡 SSE connection state changed:', connected, 'for file:', fileId);
      setIsConnected(connected);
      
      if (connected) {
        setConnectionAttempts(0);
      } else {
        setConnectionAttempts(1);
      }
    };
    
    // Store the connection handler for cleanup
    connectionHandlerRef.current = connectionHandler;
    imageSSEStore.addConnectionHandler(connectionHandler);
    
    // Create SSE URL for file events only
    const sseUrl = createFileSSEURL(fileId);
    
    console.log('🔌 Initializing SSE connection to:', sseUrl);
    
    // Initialize SSE connection with file-specific handlers
    imageSSEStore.initConnection(sseUrl, eventHandlers);

    return () => {
      console.log('🧹 Cleaning up SSE hook for file:', fileId);
      
      // Remove specific connection handler
      if (connectionHandlerRef.current) {
        imageSSEStore.removeConnectionHandler(connectionHandlerRef.current);
        connectionHandlerRef.current = null;
      }
      
      // Remove file-specific handlers
      imageSSEStore.removeProjectHandlers(fileId, eventHandlers);
      setConnectionAttempts(0);
    };
  }, [fileId, eventHandlers, enabled]);

  // AICODE-NOTE: Force cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      
      if (connectionHandlerRef.current) {
        imageSSEStore.removeConnectionHandler(connectionHandlerRef.current);
      }
      
      // Clean up file-specific handlers immediately
      imageSSEStore.removeProjectHandlers(fileId, eventHandlers);
      
      // Force cleanup if too many handlers accumulated
      const debugInfo = imageSSEStore.getDebugInfo();
      if (debugInfo.totalHandlers > 5) {
        console.log('🧹 Force cleanup due to handler accumulation on unmount');
        imageSSEStore.forceCleanup();
      }
    };
  }, [fileId, eventHandlers]);

  // AICODE-NOTE: Return same interface as WebSocket hook for compatibility
  return {
    isConnected,
    connectionAttempts,
    maxAttempts,
    disconnect: () => {
      console.log('🔌 Manual SSE disconnect requested for file:', fileId);
      imageSSEStore.disconnect();
      setConnectionAttempts(0);
    },
  };
}; 