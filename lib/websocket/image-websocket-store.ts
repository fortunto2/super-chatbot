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
}

export type ImageEventHandler = (eventData: ImageWSMessage) => void;
export type ConnectionStateHandler = (isConnected: boolean) => void;

class ImageWebsocketStore {
  private connection: WebSocket | null = null;
  private handlers: ImageEventHandler[] = [];
  private connectionHandlers: ((connected: boolean) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000; // Start with 2 seconds
  private currentUrl: string | null = null;
  private isConnecting = false;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private lastConnectionAttempt = 0;
  private connectionDebounceMs = 100; // Prevent rapid successive connections
  
  // Limits to prevent handler spam
  private maxTotalHandlers = 10; // Hard limit on total handlers
  private maxConnectionHandlers = 5; // Hard limit on connection handlers
  private projectHandlerMap = new Map<string, number>(); // Track handlers per project
  private activeProjects = new Set<string>(); // Track active project IDs

  addHandlers(handlers: ImageEventHandler[]) {
    console.log('➕ Adding handlers:', handlers.length);
    console.log('➕ Current handlers before:', this.handlers.length);
    
    // Check total handler limit
    if (this.handlers.length >= this.maxTotalHandlers) {
      console.warn('⚠️ Max handlers limit reached, rejecting new handlers');
      return;
    }
    
    // Filter out duplicate handlers to prevent memory leaks
    const newHandlers = handlers.filter(h => !this.handlers.includes(h));
    
    // Apply limit even to new handlers
    const availableSlots = this.maxTotalHandlers - this.handlers.length;
    const handlersToAdd = newHandlers.slice(0, availableSlots);
    
    this.handlers.push(...handlersToAdd);
    console.log('➕ Current handlers after:', this.handlers.length, '(added', handlersToAdd.length, 'new)');
    
    if (handlersToAdd.length < newHandlers.length) {
      console.warn('⚠️ Some handlers were rejected due to limit');
    }
  }

  removeHandlers(handlers: ImageEventHandler[]) {
    console.log('➖ Removing handlers:', handlers.length);
    console.log('➖ Current handlers before:', this.handlers.length);
    this.handlers = this.handlers.filter((h) => !handlers.includes(h));
    console.log('➖ Current handlers after:', this.handlers.length);
    
    // Close connection if no handlers remain (with small delay to prevent flapping)
    if (this.handlers.length === 0) {
      console.log('🔌 No handlers left, scheduling disconnect in 500ms');
      setTimeout(() => {
        if (this.handlers.length === 0) {
          console.log('🔌 Still no handlers, closing connection');
          this.disconnect();
        }
      }, 500);
    }
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
    console.log('🧹 Force cleanup: clearing all handlers and connections');
    
    // Clear all timeouts
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    // Notify all handlers that connection is lost
    this.notifyConnectionState(false);
    
    // Clear handlers
    this.handlers = [];
    this.connectionHandlers = [];
    this.projectHandlerMap.clear();
    this.activeProjects.clear();
    
    // Disconnect current connection
    this.disconnect();
    
    // Reset all state
    this.reconnectAttempts = 0;
    this.isConnecting = false;
    this.currentUrl = null;
    this.lastConnectionAttempt = 0;
  }

  // Clean up handlers for specific project
  cleanupProject(projectId: string) {
    console.log('🧹 Cleaning up project:', projectId);
    const projectUrl = `wss://editor.superduperai.co/api/v1/ws/project.${projectId}`;
    
    // Remove from active projects
    this.activeProjects.delete(projectId);
    
    // If this is the current connection, disconnect it
    if (this.currentUrl === projectUrl) {
      console.log('🧹 Disconnecting current project connection');
      this.disconnect();
    }
    
    // Clean up any handlers related to this project
    this.projectHandlerMap.delete(projectId);
  }

  // Get debug info
  getDebugInfo() {
    return {
      totalHandlers: this.handlers.length,
      connectionHandlers: this.connectionHandlers.length,
      maxTotalHandlers: this.maxTotalHandlers,
      isConnected: this.connection?.readyState === WebSocket.OPEN,
      currentUrl: this.currentUrl,
      reconnectAttempts: this.reconnectAttempts,
      projectHandlers: Object.fromEntries(this.projectHandlerMap),
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
    
    // Debounce rapid successive connection attempts
    if (now - this.lastConnectionAttempt < this.connectionDebounceMs) {
      console.log('🔌 Connection attempt debounced, adding handlers only');
      this.addHandlers(handlers);
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
      this.addHandlers(handlers);
      return;
    }
    
    // If currently connecting to the same URL, just add handlers and wait
    if (this.isConnecting && this.currentUrl === url) {
      console.log('🔌 Already connecting to same URL, adding handlers');
      this.addHandlers(handlers);
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
    this.addHandlers(handlers);

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
    const projectId = url.split("/").pop();
    console.log('🔌 WebSocket created for project:', projectId);
    
    // Track active project
    if (projectId) {
      this.activeProjects.add(projectId);
    }

    websocket.onopen = () => {
      console.log(`✅ Image websocket connected. Project: ${projectId}`);
      console.log('✅ WebSocket readyState:', websocket.readyState);
      
      // Clear connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.notifyConnectionState(true);
      
      // Send subscribe message for image generation
      const subscribeMessage = {
        type: 'subscribe',
        projectId: projectId
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
      console.log(`🔌 Project: ${projectId}, Reconnect attempts: ${this.reconnectAttempts}`);
      
      // Clear connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      this.isConnecting = false;
      this.notifyConnectionState(false);
      
      if (e.wasClean) {
        console.log(`✅ Image websocket closed cleanly. Project: ${projectId}`);
      } else if (this.reconnectAttempts < this.maxReconnectAttempts && this.handlers.length > 0) {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1); // Exponential backoff
        console.log(`🔄 Image websocket reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
        setTimeout(() => {
          if (this.handlers.length > 0) { // Check if handlers still exist
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
        console.log('📨 Message handlers count:', this.handlers.length);
        
        if (this.handlers.length === 0) {
          console.warn('⚠️ No handlers available to process WebSocket message');
          return;
        }
        
        this.handlers.forEach((handler, index) => {
          try {
            console.log(`📨 Calling handler ${index + 1}/${this.handlers.length}`);
            handler(eventData);
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