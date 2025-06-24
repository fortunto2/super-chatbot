import { getSuperduperAIConfig } from '@/lib/config/superduperai';

// AICODE-NOTE: Message interface for video SSE events
export interface VideoSSEMessage {
  type: string;
  object?: any;
  data?: any;
  error?: string;
  progress?: number;
  status?: string;
  videoUrl?: string;
  projectId?: string;
  // Additional fields for file objects
  url?: string;
  id?: string;
  // Request tracking
  requestId?: string;
  contentType?: string;
}

export type VideoEventHandler = (eventData: VideoSSEMessage) => void;
export type ConnectionStateHandler = (isConnected: boolean) => void;

// Interface for project-specific handler registration
interface ProjectHandler {
  projectId: string;
  handler: VideoEventHandler;
  requestId?: string;
  timestamp: number;
}

// AICODE-NOTE: SSE-based store for video generation events
class VideoSSEStore {
  private eventSource: EventSource | null = null;
  private connectionHandlers: ((connected: boolean) => void)[] = [];
  private currentChannel: string | null = null;
  private currentProjectId: string | null = null;
  private disconnectTimeout: NodeJS.Timeout | null = null;
  
  // Project-specific handlers with strict isolation
  private projectHandlers = new Map<string, ProjectHandler[]>();
  private maxHandlersPerProject = 3;
  private maxConnectionHandlers = 5;
  private activeProjects = new Set<string>();

  // AICODE-NOTE: Add handlers for a specific project with validation
  addProjectHandlers(projectId: string, handlers: VideoEventHandler[], requestId?: string) {
    if (!projectId) {
      console.error('❌ Cannot add video handlers without projectId');
      return;
    }

    console.log('➕ Adding video SSE handlers for project:', projectId, 'count:', handlers.length, 'requestId:', requestId);
    
    // Initialize project handler array if not exists
    if (!this.projectHandlers.has(projectId)) {
      this.projectHandlers.set(projectId, []);
    }
    
    const projectHandlerList = this.projectHandlers.get(projectId)!;
    
    // Check project-specific handler limit
    if (projectHandlerList.length >= this.maxHandlersPerProject) {
      console.warn('⚠️ Max handlers per project limit reached for:', projectId);
      // Remove oldest handler to make room
      projectHandlerList.shift();
    }
    
    // Add new handlers with metadata
    const timestamp = Date.now();
    handlers.forEach(handler => {
      // Check for duplicates
      if (!projectHandlerList.some(ph => ph.handler === handler)) {
        projectHandlerList.push({
          projectId,
          handler,
          requestId,
          timestamp
        });
      }
    });
    
    console.log('➕ Video project', projectId, 'now has', projectHandlerList.length, 'SSE handlers');
  }

  // AICODE-NOTE: Remove handlers for a specific project
  removeProjectHandlers(projectId: string, handlersToRemove: VideoEventHandler[]) {
    if (!projectId || !this.projectHandlers.has(projectId)) {
      return;
    }

    console.log('➖ Removing video SSE handlers for project:', projectId, 'count:', handlersToRemove.length);
    
    const projectHandlerList = this.projectHandlers.get(projectId)!;
    
    handlersToRemove.forEach(handlerToRemove => {
      const index = projectHandlerList.findIndex(ph => ph.handler === handlerToRemove);
      if (index > -1) {
        projectHandlerList.splice(index, 1);
      }
    });
    
    console.log('➖ Video project', projectId, 'now has', projectHandlerList.length, 'SSE handlers');
    
    // Clean up empty project
    if (projectHandlerList.length === 0) {
      this.projectHandlers.delete(projectId);
      this.activeProjects.delete(projectId);
      console.log('🧹 Cleaned up empty video project:', projectId);
    }
    
    // Schedule disconnect if no handlers remain for any project
    if (this.getTotalHandlersCount() === 0) {
      this.scheduleDisconnect();
    }
  }

  // AICODE-NOTE: Get total handler count across all projects
  private getTotalHandlersCount(): number {
    let total = 0;
    for (const handlers of this.projectHandlers.values()) {
      total += handlers.length;
    }
    return total;
  }

  // AICODE-NOTE: Schedule disconnect with proper cleanup
  private scheduleDisconnect() {
    console.log('🔌 No video SSE handlers left, scheduling disconnect in 1000ms');
    
    if (this.disconnectTimeout) {
      clearTimeout(this.disconnectTimeout);
    }
    
    this.disconnectTimeout = setTimeout(() => {
      if (this.getTotalHandlersCount() === 0) {
        console.log('🔌 Actually disconnecting video SSE after timeout - no handlers remain');
        this.disconnect();
      } else {
        console.log('🔌 Video SSE disconnect cancelled - handlers were re-added');
      }
    }, 1000);
  }

  // AICODE-NOTE: Add connection state handler
  addConnectionHandler(handler: (connected: boolean) => void) {
    // Check connection handler limit
    if (this.connectionHandlers.length >= this.maxConnectionHandlers) {
      console.warn('⚠️ Max video connection handlers limit reached, rejecting new handler');
      return;
    }
    
    // Prevent duplicate connection handlers
    if (!this.connectionHandlers.includes(handler)) {
      this.connectionHandlers.push(handler);
    }
  }

  // AICODE-NOTE: Remove connection state handler
  removeConnectionHandler(handler: (connected: boolean) => void) {
    this.connectionHandlers = this.connectionHandlers.filter((h) => h !== handler);
  }

  // AICODE-NOTE: Notify all connection handlers of state change
  private notifyConnectionState(connected: boolean) {
    console.log('📡 Notifying video SSE connection state:', connected, 'to', this.connectionHandlers.length, 'handlers');
    this.connectionHandlers.forEach((handler) => {
      try {
        handler(connected);
      } catch (error) {
        console.error('❌ Error in video SSE connection handler:', error);
      }
    });
  }

  // AICODE-NOTE: Force cleanup method for React Strict Mode
  forceCleanup() {
    console.log('🧹 Force video SSE cleanup initiated');
    console.log('🧹 Current handlers:', this.getTotalHandlersCount());
    console.log('🧹 Connection handlers:', this.connectionHandlers.length);
    console.log('🧹 Active projects:', Array.from(this.activeProjects));
    
    // Clear all handlers but be more conservative during development (React Strict Mode)
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment && this.getTotalHandlersCount() < 5) {
      console.log('🧹 Skipping force cleanup in development with few handlers (React Strict Mode)');
      return;
    }
    
    this.projectHandlers.clear();
    this.connectionHandlers = [];
    this.activeProjects.clear();
    
    if (this.eventSource && this.eventSource.readyState === EventSource.OPEN) {
      console.log('🧹 Closing video SSE connection');
      this.eventSource.close();
    }
    this.eventSource = null;
    this.currentChannel = null;
    this.currentProjectId = null;
  }

  // AICODE-NOTE: Clean up specific project
  cleanupProject(projectId: string) {
    console.log('🧹 Video SSE cleaning up project:', projectId);
    
    this.projectHandlers.delete(projectId);
    this.activeProjects.delete(projectId);
    
    // Schedule disconnect if no projects remain
    if (this.activeProjects.size === 0) {
      this.scheduleDisconnect();
    }
  }

  // AICODE-NOTE: Get debug information
  getDebugInfo() {
    return {
      isConnected: this.isConnected(),
      currentChannel: this.currentChannel,
      currentProjectId: this.currentProjectId,
      totalHandlers: this.getTotalHandlersCount(),
      connectionHandlers: this.connectionHandlers.length,
      activeProjects: Array.from(this.activeProjects),
      projectHandlerCounts: Object.fromEntries(
        Array.from(this.projectHandlers.entries()).map(([projectId, handlers]) => [projectId, handlers.length])
      )
    };
  }

  // AICODE-NOTE: Disconnect SSE connection
  disconnect() {
    console.log('🔌 Disconnecting video SSE connection');
    
    if (this.disconnectTimeout) {
      clearTimeout(this.disconnectTimeout);
      this.disconnectTimeout = null;
    }
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.currentChannel = null;
    this.currentProjectId = null;
    
    // Notify handlers of disconnection
    this.notifyConnectionState(false);
  }

  // AICODE-NOTE: Initialize SSE connection using EventSource
  initConnection(url: string, handlers: VideoEventHandler[], requestId?: string) {
    // Extract project ID from URL for tracking
    const projectIdMatch = url.match(/project\.([^/]+)/);
    const projectId = projectIdMatch ? projectIdMatch[1] : null;
    
    if (!projectId) {
      console.error('❌ Cannot extract project ID from video SSE URL:', url);
      return;
    }

    console.log('🔌 Initializing video SSE connection for project:', projectId);
    console.log('🔌 Video SSE URL:', url);
    
    // Track current project
    this.currentProjectId = projectId;
    this.activeProjects.add(projectId);
    
    // Convert WebSocket URL format to SSE format
    const config = getSuperduperAIConfig();
    const channel = `project.${projectId}`;
    const sseUrl = `${config.url}/api/v1/events/${channel}`;
    
    console.log('🔌 Video SSE Channel:', channel);
    console.log('🔌 Final video SSE URL:', sseUrl);
    
    // Store current channel
    this.currentChannel = channel;
    
    // Add handlers for this project with requestId
    this.addProjectHandlers(projectId, handlers, requestId);
    
    // Clear any existing connection timeout
    if (this.disconnectTimeout) {
      clearTimeout(this.disconnectTimeout);
      this.disconnectTimeout = null;
    }
    
    // Close existing connection if different channel
    if (this.eventSource && this.currentChannel !== channel) {
      console.log('🔄 Switching video SSE channel from', this.currentChannel, 'to', channel);
      this.eventSource.close();
      this.eventSource = null;
    }
    
    // Create new SSE connection if needed
    if (!this.eventSource || this.eventSource.readyState === EventSource.CLOSED) {
      try {
        console.log('🆕 Creating new video SSE connection to:', sseUrl);
        
        // AICODE-NOTE: Create EventSource for video events
        this.eventSource = new EventSource(sseUrl);
        
        // AICODE-NOTE: Handle successful connection
        this.eventSource.onopen = () => {
          console.log('🔌 ✅ Video SSE connected to channel:', channel);
          this.notifyConnectionState(true);
        };
        
        // AICODE-NOTE: Handle incoming video messages
        this.eventSource.onmessage = (event) => {
          try {
            const message: VideoSSEMessage = JSON.parse(event.data);
            console.log('📡 Video SSE message received:', message);
            
            // Handle the message with all registered handlers for the project
            this.handleMessage(message);
            
          } catch (error) {
            console.error('❌ Video SSE message parse error:', error, 'Raw data:', event.data);
          }
        };
        
        // AICODE-NOTE: Handle SSE errors (automatic reconnection by browser)
        this.eventSource.onerror = (error) => {
          console.error('❌ Video SSE error:', error);
          console.log('🔄 Browser will handle video SSE reconnection automatically');
          
          // Note: EventSource handles reconnection automatically
          // We just need to notify connection handlers about temporary disconnection
          if (this.eventSource?.readyState === EventSource.CLOSED) {
            this.notifyConnectionState(false);
          }
        };
        
      } catch (error) {
        console.error('❌ Failed to create video SSE connection:', error);
        this.notifyConnectionState(false);
      }
    } else {
      console.log('🔄 Reusing existing video SSE connection for channel:', channel);
      // Connection already exists, just notify it's connected
      this.notifyConnectionState(true);
    }
  }

  // AICODE-NOTE: Handle incoming video SSE messages
  private handleMessage(message: VideoSSEMessage) {
    // Extract project ID from message or use current project
    const messageProjectId = message.projectId || this.currentProjectId;
    
    if (!messageProjectId) {
      console.warn('⚠️ Video SSE message without project ID, broadcasting to all handlers');
      // Broadcast to all handlers if no project ID
      for (const handlers of this.projectHandlers.values()) {
        handlers.forEach(({ handler }) => {
          try {
            handler(message);
          } catch (error) {
            console.error('❌ Error in video SSE message handler:', error);
          }
        });
      }
      return;
    }
    
    // Send to specific project handlers
    const projectHandlers = this.projectHandlers.get(messageProjectId);
    if (projectHandlers) {
      console.log('📡 Sending video SSE message to', projectHandlers.length, 'handlers for project:', messageProjectId);
      projectHandlers.forEach(({ handler }) => {
        try {
          handler(message);
        } catch (error) {
          console.error('❌ Error in video SSE project handler:', error);
        }
      });
    } else {
      console.log('📡 No handlers found for video project:', messageProjectId);
    }
  }

  // AICODE-NOTE: Check if SSE connection is active
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}

// Export singleton instance
export const videoSSEStore = new VideoSSEStore(); 