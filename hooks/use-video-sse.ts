"use client";

import { useEffect, useState, useRef } from "react";
import { videoSSEStore, type VideoEventHandler } from "@/lib/websocket/video-sse-store";
import { createFileSSEURL } from "@/lib/utils/client-websocket";

type Props = {
  projectId: string;
  eventHandlers: VideoEventHandler[];
  enabled?: boolean;
  requestId?: string; // AICODE-NOTE: Added requestId for tracking
};

// AICODE-NOTE: SSE-based hook for video events replacing WebSocket functionality with same interface
export const useVideoSSE = ({ projectId, eventHandlers, enabled = true, requestId }: Props) => {
  
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

    console.log('🔌 Setting up video SSE connection for project:', projectId);

    // Reset attempts for new project
    setConnectionAttempts(0);

    // Remove previous connection handler if exists
    if (connectionHandlerRef.current) {
      videoSSEStore.removeConnectionHandler(connectionHandlerRef.current);
    }
    
    // Add connection state handler
    const connectionHandler = (connected: boolean) => {
      if (!mountedRef.current) return; // Don't update state if unmounted
      
      console.log('📡 Video SSE connection state changed:', connected, 'for project:', projectId);
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
    videoSSEStore.addConnectionHandler(connectionHandler);
    
    // Create SSE URL using Next.js proxy (projectId is actually fileId)
    const sseUrl = createFileSSEURL(projectId);
    
    console.log('🔌 Initializing video SSE connection to:', sseUrl);
    console.log('🔌 Request ID for SSE:', requestId || 'no-request-id');
    
    // Initialize SSE connection with project-specific handlers and requestId
    videoSSEStore.initConnection(sseUrl, eventHandlers, requestId);

    return () => {
      console.log('🧹 Cleaning up video SSE hook for project:', projectId);
      
      // Remove specific connection handler
      if (connectionHandlerRef.current) {
        videoSSEStore.removeConnectionHandler(connectionHandlerRef.current);
        connectionHandlerRef.current = null;
      }
      
      // Remove project-specific handlers
      videoSSEStore.removeProjectHandlers(projectId, eventHandlers);
      setConnectionAttempts(0);
    };
  }, [projectId, eventHandlers, enabled]);

  // AICODE-NOTE: Force cleanup on unmount with immediate execution
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      
      if (connectionHandlerRef.current) {
        videoSSEStore.removeConnectionHandler(connectionHandlerRef.current);
      }
      
      // Clean up project-specific handlers immediately
      videoSSEStore.removeProjectHandlers(projectId, eventHandlers);
      
      // Force cleanup if too many handlers accumulated
      const debugInfo = videoSSEStore.getDebugInfo();
      if (debugInfo.totalHandlers > 5) {
        console.log('🧹 Force cleanup due to handler accumulation on unmount');
        videoSSEStore.forceCleanup();
      }
    };
  }, []);

  // AICODE-NOTE: Return same interface as WebSocket hook for compatibility
  return {
    isConnected,
    connectionAttempts,
    maxAttempts,
    disconnect: () => {
      console.log('🔌 Manual video SSE disconnect requested for project:', projectId);
      videoSSEStore.disconnect();
      setConnectionAttempts(0);
    },
  };
}; 