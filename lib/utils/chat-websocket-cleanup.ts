import { imageWebsocketStore } from "@/lib/websocket/image-websocket-store";

/**
 * Utility to clean up WebSocket connections when switching between chats
 */
export class ChatWebSocketCleanup {
  private static currentChatId: string | null = null;

  /**
   * Set the current active chat and cleanup previous connections
   */
  static setActiveChat(chatId: string) {
    if (this.currentChatId && this.currentChatId !== chatId) {
      console.log('🧹 ChatWebSocketCleanup: Switching from', this.currentChatId, 'to', chatId);
      
      // Clean up previous chat connections
      imageWebsocketStore.cleanupProject(this.currentChatId);
      
      // Force cleanup if too many handlers are accumulating
      const debugInfo = imageWebsocketStore.getDebugInfo();
      if (debugInfo.totalHandlers > 3) {
        console.log('🧹 ChatWebSocketCleanup: Force cleanup due to handler accumulation');
        imageWebsocketStore.forceCleanup();
      }
    }
    
    this.currentChatId = chatId;
  }

  /**
   * Get the current active chat ID
   */
  static getCurrentChatId(): string | null {
    return this.currentChatId;
  }

  /**
   * Cleanup all connections (useful on app unmount)
   */
  static cleanupAll() {
    console.log('🧹 ChatWebSocketCleanup: Cleaning up all connections');
    imageWebsocketStore.forceCleanup();
    this.currentChatId = null;
  }

  /**
   * Get debug information about current connections
   */
  static getDebugInfo() {
    return {
      currentChatId: this.currentChatId,
      websocketInfo: imageWebsocketStore.getDebugInfo()
    };
  }
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).chatWebSocketCleanup = ChatWebSocketCleanup;
} 