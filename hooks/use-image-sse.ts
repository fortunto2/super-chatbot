"use client";

import { useEffect, useState, useRef } from "react";
import { imageSSEStore, type ImageEventHandler } from "@/lib/websocket/image-sse-store";
import { getSuperduperAIConfig } from "@/lib/config/superduperai";

type Props = {
  projectId: string;
  eventHandlers: ImageEventHandler[];
  enabled?: boolean;
};

// AICODE-NOTE: SSE-based hook replacing WebSocket functionality with same interface
export const useImageSSE = ({ projectId, eventHandlers, enabled = true }: Props) => {
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxAttempts = 3; // Keep for compatibility, though SSE handles reconnection automatically
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
    if (!enabled || !projectId || eventHandlers.length === 0) {
      setIsConnected(false);
      setConnectionAttempts(0);
      return;
    }

    console.log('🔌 Setting up SSE connection for project:', projectId);

    // Reset attempts for new project
    setConnectionAttempts(0);

    // Remove previous connection handler if exists
    if (connectionHandlerRef.current) {
      imageSSEStore.removeConnectionHandler(connectionHandlerRef.current);
    }
    
    // Add connection state handler
    const connectionHandler = (connected: boolean) => {
      if (!mountedRef.current) return; // Don't update state if unmounted
      
      console.log('📡 SSE connection state changed:', connected, 'for project:', projectId);
      setIsConnected(connected);
      
      // AICODE-NOTE: SSE handles reconnection automatically, so we don't need retry logic
      if (connected) {
        setConnectionAttempts(0);
      } else {
        // For compatibility, show connection attempt (though SSE reconnects automatically)
        setConnectionAttempts(1);
      }
    };
    
    // Store the connection handler for cleanup
    connectionHandlerRef.current = connectionHandler;
    imageSSEStore.addConnectionHandler(connectionHandler);
    
    // Use environment variable or fallback to default
    const config = getSuperduperAIConfig();
    // Convert to SSE URL format - use project.{projectId} channel
    const sseUrl = `${config.url}/api/v1/events/project.${projectId}`;
    
    console.log('🔌 Initializing SSE connection to:', sseUrl);
    
    // Initialize SSE connection with project-specific handlers
    imageSSEStore.initConnection(sseUrl, eventHandlers);

    return () => {
      console.log('🧹 Cleaning up SSE hook for project:', projectId);
      
      // Remove specific connection handler
      if (connectionHandlerRef.current) {
        imageSSEStore.removeConnectionHandler(connectionHandlerRef.current);
        connectionHandlerRef.current = null;
      }
      
      // Remove project-specific handlers
      imageSSEStore.removeProjectHandlers(projectId, eventHandlers);
      setConnectionAttempts(0);
    };
  }, [projectId, eventHandlers, enabled]);

  // AICODE-NOTE: Force cleanup on unmount with immediate execution
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      
      if (connectionHandlerRef.current) {
        imageSSEStore.removeConnectionHandler(connectionHandlerRef.current);
      }
      
      // Clean up project-specific handlers immediately
      imageSSEStore.removeProjectHandlers(projectId, eventHandlers);
      
      // Force cleanup if too many handlers accumulated
      const debugInfo = imageSSEStore.getDebugInfo();
      if (debugInfo.totalHandlers > 5) {
        console.log('🧹 Force cleanup due to handler accumulation on unmount');
        imageSSEStore.forceCleanup();
      }
    };
  }, []);

  // AICODE-NOTE: Return same interface as WebSocket hook for compatibility
  return {
    isConnected,
    connectionAttempts,
    maxAttempts,
    disconnect: () => {
      console.log('🔌 Manual SSE disconnect requested for project:', projectId);
      imageSSEStore.disconnect();
      setConnectionAttempts(0);
    },
  };
}; 