export interface ImageWSMessage {
  type: string;
  object?: any;
  data?: any;
  error?: string;
  progress?: number;
  status?: string;
  imageUrl?: string;
  projectId?: string;
  // Additional fields for file objects
  url?: string;
  id?: string;
  // Add request tracking
  requestId?: string;
}

export type ImageEventHandler = (eventData: ImageWSMessage) => void;
export type ConnectionStateHandler = (isConnected: boolean) => void;

// Interface for project-specific handler registration
interface ProjectHandler {
  projectId: string;
  handler: ImageEventHandler;
  requestId?: string;
  timestamp: number;
}

class ImageWebsocketStore {
  private connection: WebSocket | null = null;
  private connectionHandlers: ((connected: boolean) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private currentUrl: string | null = null;
  private currentProjectId: string | null = null;
  private isConnecting = false;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private disconnectTimeout: NodeJS.Timeout | null = null;
  private lastConnectionAttempt = 0;
  private connectionDebounceMs = 500; // Increase debounce to 500ms
  
  // Project-specific handlers with strict isolation
  private projectHandlers = new Map<string, ProjectHandler[]>();
  private maxHandlersPerProject = 3;
  private maxConnectionHandlers = 5;
  private activeProjects = new Set<string>();

  // Add handlers for a specific project with validation
  addProjectHandlers(projectId: string, handlers: ImageEventHandler[], requestId?: string) {
    if (!projectId) {
      console.error('❌ Cannot add handlers without projectId');
      return;
    }

    console.log('➕ Adding handlers for project:', projectId, 'count:', handlers.length, 'requestId:', requestId);
    
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
    
    console.log('➕ Project', projectId, 'now has', projectHandlerList.length, 'handlers');
  }

  // Remove handlers for a specific project
  removeProjectHandlers(projectId: string, handlersToRemove: ImageEventHandler[]) {
    if (!projectId || !this.projectHandlers.has(projectId)) {
      return;
    }

    console.log('➖ Removing handlers for project:', projectId, 'count:', handlersToRemove.length);
    
    const projectHandlerList = this.projectHandlers.get(projectId)!;
    
    handlersToRemove.forEach(handlerToRemove => {
      const index = projectHandlerList.findIndex(ph => ph.handler === handlerToRemove);
      if (index > -1) {
        projectHandlerList.splice(index, 1);
      }
    });
    
    console.log('➖ Project', projectId, 'now has', projectHandlerList.length, 'handlers');
    
    // Clean up empty project
    if (projectHandlerList.length === 0) {
      this.projectHandlers.delete(projectId);
      this.activeProjects.delete(projectId);
      console.log('🧹 Cleaned up empty project:', projectId);
    }
    
    // Schedule disconnect if no handlers remain for any project
    if (this.getTotalHandlersCount() === 0) {
      this.scheduleDisconnect();
    }
  }

  // Get total handler count across all projects
  private getTotalHandlersCount(): number {
    let total = 0;
    for (const handlers of this.projectHandlers.values()) {
      total += handlers.length;
    }
    return total;
  }

  // Schedule disconnect with proper cleanup
  private scheduleDisconnect() {
    console.log('🔌 No handlers left, scheduling disconnect in 1000ms');
    
    if (this.disconnectTimeout) {
      clearTimeout(this.disconnectTimeout);
    }
    
    this.disconnectTimeout = setTimeout(() => {
      if (this.getTotalHandlersCount() === 0) {
        console.log('🔌 Actually disconnecting after timeout - no handlers remain');
        this.disconnect();
      } else {
        console.log('🔌 Disconnect cancelled - handlers were re-added');
      }
    }, 1000);
  }

  addConnectionHandler(handler: (connected: boolean) => void) {
    // Check connection handler limit
    if (this.connectionHandlers.length >= this.maxConnectionHandlers) {
      console.warn('⚠️ Max connection handlers limit reached, rejecting new handler');
      return;
    }
    
    // Prevent duplicate connection handlers
    if (!this.connectionHandlers.includes(handler)) {
      this.connectionHandlers.push(handler);
    }
  }

  removeConnectionHandler(handler: (connected: boolean) => void) {
    this.connectionHandlers = this.connectionHandlers.filter((h) => h !== handler);
  }

  private notifyConnectionState(connected: boolean) {
    console.log('📡 Notifying connection state:', connected, 'to', this.connectionHandlers.length, 'handlers');
    this.connectionHandlers.forEach((handler) => {
      try {
        handler(connected);
      } catch (error) {
        console.error('❌ Error in connection handler:', error);
      }
    });
  }

  // Force cleanup method for React Strict Mode
  forceCleanup() {
    console.log('🧹 Force cleanup initiated');
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
    
    if (this.connection && this.connection.readyState === WebSocket.OPEN) {
      console.log('🧹 Closing WebSocket connection');
      this.connection.close(1000, 'Force cleanup');
    }
    this.connection = null;
    this.currentUrl = null;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    this.notifyConnectionState(false);
    console.log('🧹 Force cleanup completed');
  }

  // Clean up handlers for specific project
  cleanupProject(projectId: string) {
    console.log('🧹 Cleaning up project:', projectId);
    const projectUrl = `wss://editor.superduperai.co/api/v1/ws/project.${projectId}`;
    
    // Remove from active projects
    this.activeProjects.delete(projectId);
    
    // Remove all handlers for this project
    const projectHandlerList = this.projectHandlers.get(projectId);
    if (projectHandlerList) {
      console.log(`🧹 Removing ${projectHandlerList.length} handlers for project: ${projectId}`);
      this.projectHandlers.delete(projectId);
    }
    
    // If this is the current connection, disconnect it
    if (this.currentUrl === projectUrl) {
      console.log('🧹 Disconnecting current project connection');
      this.disconnect();
    }
    
    // Schedule disconnect if no handlers remain for any project
    if (this.getTotalHandlersCount() === 0) {
      this.scheduleDisconnect();
    }
  }

  // Get debug info
  getDebugInfo() {
    return {
      totalHandlers: this.getTotalHandlersCount(),
      connectionHandlers: this.connectionHandlers.length,
      maxTotalHandlers: this.maxConnectionHandlers,
      isConnected: this.connection?.readyState === WebSocket.OPEN,
      currentUrl: this.currentUrl,
      reconnectAttempts: this.reconnectAttempts,
      projectHandlers: Object.fromEntries(this.projectHandlers),
      activeProjects: Array.from(this.activeProjects)
    };
  }

  disconnect() {
    console.log('🔌 Disconnecting WebSocket');
    
    // Clear any pending connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    // Clear disconnect timeout
    if (this.disconnectTimeout) {
      clearTimeout(this.disconnectTimeout);
      this.disconnectTimeout = null;
    }
    
    if (this.connection) {
      this.connection.close(1000, 'Disconnecting');
      this.connection = null;
    }
    this.currentUrl = null;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.notifyConnectionState(false);
  }

  initConnection(url: string, handlers: ImageEventHandler[]) {
    const now = Date.now();
    
    // Extract project ID from URL - remove 'project.' prefix for clean ID
    const urlParts = url.split("/").pop() || '';
    const cleanProjectId = urlParts.startsWith('project.') ? urlParts.substring(8) : urlParts;
    this.currentProjectId = cleanProjectId;
    
    console.log('🔌 Extracted clean projectId:', cleanProjectId, 'from URL:', url);
    
    // Debounce rapid successive connection attempts
    if (now - this.lastConnectionAttempt < this.connectionDebounceMs) {
      console.log('🔌 Connection attempt debounced', {
        timeSinceLastAttempt: now - this.lastConnectionAttempt,
        debounceMs: this.connectionDebounceMs,
        cleanProjectId,
        handlersCount: handlers.length
      });
      if (cleanProjectId) {
        this.addProjectHandlers(cleanProjectId, handlers);
      }
      return;
    }
    this.lastConnectionAttempt = now;
    
    console.log('🔌 Initializing WebSocket connection to:', url);
    console.log('🔌 Current connection state:', this.connection?.readyState);
    console.log('🔌 Is currently connecting:', this.isConnecting);
    console.log('🔌 Current URL:', this.currentUrl);
    console.log('🔌 Debug info:', this.getDebugInfo());
    
    // Force cleanup if too many handlers or connection handlers
    const debugInfo = this.getDebugInfo();
    if (debugInfo.totalHandlers > 8 || debugInfo.connectionHandlers > 4) {
      console.log('🧹 Too many handlers before connection, forcing cleanup');
      this.forceCleanup();
    }
    
    // If already connected to the same URL and connection is open, just add handlers
    if (this.connection && this.currentUrl === url && this.connection.readyState === WebSocket.OPEN) {
      console.log('🔌 Using existing open WebSocket connection');
      if (cleanProjectId) {
        this.addProjectHandlers(cleanProjectId, handlers);
      }
      return;
    }
    
    // If currently connecting to the same URL, just add handlers and wait
    if (this.isConnecting && this.currentUrl === url) {
      console.log('🔌 Already connecting to same URL, adding handlers');
      if (cleanProjectId) {
        this.addProjectHandlers(cleanProjectId, handlers);
      }
      return;
    }
    
    // Close existing connection if URL is different or connection is in bad state
    if (this.connection && (this.currentUrl !== url || this.connection.readyState === WebSocket.CLOSED)) {
      console.log('🔌 Closing existing connection for different URL or bad state');
      this.connection.close();
      this.connection = null;
    }

    this.currentUrl = url;
    this.isConnecting = true;
    
    // Add handlers immediately
    if (cleanProjectId) {
      this.addProjectHandlers(cleanProjectId, handlers);
    }

    // Clear any existing connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }

    // Set timeout for connection attempt
    this.connectionTimeout = setTimeout(() => {
      if (this.isConnecting) {
        console.log('⏰ Connection timeout, cancelling attempt');
        this.isConnecting = false;
        this.notifyConnectionState(false);
      }
    }, 10000); // 10 second timeout

    const websocket = new WebSocket(url);
    console.log('🔌 WebSocket created for project:', cleanProjectId);
    
    // Track active project with clean ID
    if (cleanProjectId) {
      this.activeProjects.add(cleanProjectId);
    }

    websocket.onopen = () => {
      console.log(`✅ Image websocket connected. Project: ${cleanProjectId}`);
      console.log('✅ WebSocket readyState:', websocket.readyState);
      
      // Clear connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.notifyConnectionState(true);
      
      // Send subscribe message for image generation with full project ID
      const subscribeMessage = {
        type: 'subscribe',
        projectId: urlParts // Use full project.{id} format for subscription
      };
      
      try {
        websocket.send(JSON.stringify(subscribeMessage));
        console.log('📤 Subscribe message sent:', subscribeMessage);
      } catch (error) {
        console.error('❌ Failed to send subscribe message:', error);
      }
    };

    websocket.onerror = (err) => {
      console.error('❌ Image websocket error:', err);
      console.error('❌ WebSocket readyState on error:', websocket.readyState);
      
      // Clear connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      this.isConnecting = false;
      this.notifyConnectionState(false);
    };

    websocket.onclose = (e) => {
      console.log(`🔌 Image websocket closed. Code: ${e.code}, Reason: ${e.reason}, Clean: ${e.wasClean}`);
      console.log(`🔌 Project: ${cleanProjectId}, Reconnect attempts: ${this.reconnectAttempts}`);
      
      // Clear connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      this.isConnecting = false;
      this.notifyConnectionState(false);
      
      if (e.wasClean) {
        console.log(`✅ Image websocket closed cleanly. Project: ${cleanProjectId}`);
      } else if (this.reconnectAttempts < this.maxReconnectAttempts && this.getTotalHandlersCount() > 0) {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1); // Exponential backoff
        console.log(`🔄 Image websocket reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
        setTimeout(() => {
          if (this.getTotalHandlersCount() > 0) { // Check if handlers still exist
            console.log('🔄 Attempting reconnection...');
            this.initConnection(url, []);
          } else {
            console.log('🔄 No handlers remaining, skipping reconnection');
          }
        }, delay);
      } else {
        console.error('💥 Max reconnection attempts reached for image websocket or no handlers');
        this.currentUrl = null;
      }
    };

    websocket.onmessage = (event) => {
      try {
        const eventData = JSON.parse(event.data as string) as ImageWSMessage;
        console.log('📨 Image websocket message received:', eventData);
        console.log('📨 Message handlers count:', this.getTotalHandlersCount());
        
        if (this.getTotalHandlersCount() === 0) {
          console.warn('⚠️ No handlers available to process WebSocket message');
          return;
        }
        
        // Extract clean project ID from incoming event data
        let messageProjectId = eventData.projectId;
        if (messageProjectId && messageProjectId.startsWith('project.')) {
          messageProjectId = messageProjectId.substring(8);
        }
        
        // Fallback to current clean project ID if message doesn't have one
        if (!messageProjectId) {
          messageProjectId = cleanProjectId;
        }
        
        console.log('📨 Routing message to clean projectId:', messageProjectId);
        
        // Route message to correct project handlers with clean project ID
        const projectHandlerList = this.projectHandlers.get(messageProjectId);
        
        if (!projectHandlerList || projectHandlerList.length === 0) {
          console.warn(`⚠️ No handlers found for clean project: ${messageProjectId}`);
          return;
        }
        
        // Create normalized event data with clean project ID for handlers
        const normalizedEventData = {
          ...eventData,
          projectId: messageProjectId // Ensure clean project ID
        };
        
        projectHandlerList.forEach((ph, index) => {
          try {
            console.log(`📨 Calling handler ${index + 1}/${projectHandlerList.length} for clean project: ${messageProjectId}`);
            ph.handler(normalizedEventData);
          } catch (error) {
            console.error(`❌ Error in WebSocket handler ${index + 1}:`, error);
          }
        });
      } catch (error) {
        console.error('❌ Image websocket parse error:', error);
        console.error('❌ Raw message data:', event.data);
      }
    };

    this.connection = websocket;
    console.log('🔌 WebSocket object created, waiting for connection...');
    console.log('🔌 Initial readyState:', websocket.readyState);
  }

  isConnected(): boolean {
    const connected = this.connection?.readyState === WebSocket.OPEN;
    console.log('🔍 Checking connection status:', {
      connectionExists: !!this.connection,
      readyState: this.connection?.readyState,
      WebSocketOPEN: WebSocket.OPEN,
      finalResult: connected
    });
    return connected;
  }
}

// Singleton instance
export const imageWebsocketStore = new ImageWebsocketStore(); 