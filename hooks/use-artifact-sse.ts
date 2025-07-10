"use client";

import { useEffect, useState, useRef, useCallback } from "react";

// AICODE-NOTE: Universal SSE message interface for artifacts
export interface ArtifactSSEMessage {
  type: string;
  object?: any;
  data?: any;
  error?: string;
  progress?: number;
  status?: string;
  url?: string;
  id?: string;
  projectId?: string;
  requestId?: string;
}

export type ArtifactEventHandler = (eventData: ArtifactSSEMessage) => void;

type Props = {
  channel: string; // e.g., "project.123", "file.456", "user.789"
  eventHandlers: ArtifactEventHandler[];
  enabled?: boolean;
};

// AICODE-NOTE: Universal SSE hook for artifacts replacing WebSocket functionality
export const useArtifactSSE = ({ channel, eventHandlers, enabled = true }: Props) => {
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const mountedRef = useRef(true);
  const handlersRef = useRef(eventHandlers);

  useEffect(() => {
    handlersRef.current = eventHandlers;
  }, [eventHandlers]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const disconnect = useCallback(() => {
    console.log('🔌 Manual SSE disconnect requested for channel:', channel);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    setConnectionAttempts(0);
  }, [channel]);

  // AICODE-NOTE: Main effect for SSE connection management
  useEffect(() => {
    if (!enabled || !channel || handlersRef.current.length === 0) {
      setIsConnected(false);
      setConnectionAttempts(0);
      return;
    }

    console.log('🔌 Setting up SSE connection for channel:', channel);

    // Reset attempts for new channel
    setConnectionAttempts(0);

    // AICODE-NOTE: Use Next.js proxy for SSE connections instead of direct backend
    const sseUrl = `/api/events/${channel}`;
    
    console.log('🔌 Connecting to SSE:', sseUrl);

    try {
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        if (!mountedRef.current) return;
        
        console.log('🔌 ✅ SSE connected to channel:', channel);
        setIsConnected(true);
        setConnectionAttempts(0);
      };

      eventSource.onmessage = (event) => {
        if (!mountedRef.current) return;
        
        try {
          const message: ArtifactSSEMessage = JSON.parse(event.data);
          // console.log('📡 SSE message received:', message);

          // Call all registered handlers
          handlersRef.current.forEach(handler => {
            try {
              handler(message);
            } catch (error) {
              console.error('❌ Error in SSE event handler:', error);
            }
          });

        } catch (error) {
          console.error('❌ SSE message parse error:', error, 'Raw data:', event.data);
        }
      };

      eventSource.onerror = (error) => {
        if (!mountedRef.current) return;
        
        console.error('❌ SSE error:', error);
        console.log('🔄 Browser will handle SSE reconnection automatically');
        
        // Update connection state if closed
        if (eventSource.readyState === EventSource.CLOSED) {
          setIsConnected(false);
          setConnectionAttempts(prev => prev + 1);
        }
      };

    } catch (error) {
      console.error('❌ Failed to create SSE connection:', error);
      setIsConnected(false);
      setConnectionAttempts(1);
    }

    return () => {
      console.log('🧹 Cleaning up SSE connection for channel:', channel);
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      setConnectionAttempts(0);
    };
  }, [channel, enabled]);

  // AICODE-NOTE: Force cleanup on unmount with immediate execution
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  // AICODE-NOTE: Return same interface as WebSocket hook for compatibility
  return {
    isConnected,
    connectionAttempts,
    maxAttempts: 3, // For compatibility
    disconnect,
  };
};