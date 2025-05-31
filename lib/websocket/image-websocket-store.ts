export interface ImageWSMessage {
  type: string;
  object?: any;
  data?: any;
  error?: string;
  progress?: number;
  status?: string;
  imageUrl?: string;
  projectId?: string;
}

export type ImageEventHandler = (eventData: ImageWSMessage) => void;

class ImageWebsocketStore {
  private connection: WebSocket | null = null;
  private handlers: ImageEventHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  addHandlers(newHandlers: ImageEventHandler[]) {
    this.handlers = [...this.handlers, ...newHandlers];
  }

  removeHandlers(delHandlers: ImageEventHandler[]) {
    this.handlers = this.handlers.filter(
      (h) => !delHandlers.includes(h),
    );

    if (this.handlers.length === 0 && this.connection) {
      this.connection.close();
      this.connection = null;
    }
  }

  initConnection(url: string, handlers: ImageEventHandler[]) {
    if (this.connection) {
      if (this.connection.url === url) return;
      this.connection.close();
    }

    const websocket = new WebSocket(url);
    const projectId = url.split("/").pop();

    websocket.onopen = () => {
      this.addHandlers(handlers);
      this.reconnectAttempts = 0;
      console.log(`Image websocket connected. Project: ${projectId}`);
      
      // Send subscribe message for image generation
      websocket.send(JSON.stringify({
        type: 'subscribe',
        projectId: projectId
      }));
    };

    websocket.onerror = (err) => {
      console.log('Image websocket error:', err);
    };

    websocket.onclose = (e) => {
      this.removeHandlers(handlers);
      if (e.wasClean) {
        console.log(`Image websocket closed. Project: ${projectId}`);
      } else if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => {
          console.log(`Image websocket reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          this.initConnection(url, handlers);
        }, this.reconnectDelay);
      } else {
        console.error('Max reconnection attempts reached for image websocket');
      }
    };

    websocket.onmessage = (event) => {
      try {
        const eventData = JSON.parse(event.data as string) as ImageWSMessage;
        console.log('Image websocket message:', eventData);
        this.handlers.forEach((h) => {
          h(eventData);
        });
      } catch (error) {
        console.error('Image websocket parse error:', error);
      }
    };

    this.connection = websocket;
  }

  disconnect() {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
    this.handlers = [];
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.connection?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const imageWebsocketStore = new ImageWebsocketStore(); 