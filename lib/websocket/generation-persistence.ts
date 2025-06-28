/**
 * Generation Persistence Manager
 * Handles saving and restoring generation states across page reloads
 * Supports both image and video generation with SSE connection recovery
 */

export interface GenerationState {
  id: string;
  type: 'image' | 'video';
  status: 'pending' | 'processing' | 'completed' | 'error';
  fileId: string;
  projectId?: string;
  requestId?: string;
  prompt: string;
  progress?: number;
  message?: string;
  estimatedTime?: number;
  startTime: number;
  lastUpdate: number;
  settings?: any;
  url?: string;
  thumbnailUrl?: string;
}

export interface PersistenceConfig {
  maxAge: number; // Maximum age in milliseconds before cleanup
  maxItems: number; // Maximum number of items to store
  storageKey: string;
}

const DEFAULT_CONFIG: PersistenceConfig = {
  maxAge: 30 * 60 * 1000, // 30 minutes
  maxItems: 10,
  storageKey: 'generation_states'
};

/**
 * Generation Persistence Manager
 * Manages localStorage persistence for active generations
 */
export class GenerationPersistence {
  private config: PersistenceConfig;
  private subscribers: Set<(states: GenerationState[]) => void> = new Set();

  constructor(config: Partial<PersistenceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Save generation state to localStorage
   */
  saveState(state: GenerationState): void {
    try {
      const states = this.getAllStates();
      
      // Update existing state or add new one
      const existingIndex = states.findIndex(s => s.id === state.id);
      if (existingIndex >= 0) {
        states[existingIndex] = { ...states[existingIndex], ...state, lastUpdate: Date.now() };
      } else {
        states.push({ ...state, lastUpdate: Date.now() });
      }

      // Cleanup old states
      this.cleanupStates(states);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.config.storageKey, JSON.stringify(states));
      }

      // Notify subscribers
      this.notifySubscribers(states);

      console.log('💾 Generation state saved:', state.id, state.type, state.status);
    } catch (error) {
      console.error('❌ Failed to save generation state:', error);
    }
  }

  /**
   * Get specific generation state
   */
  getState(id: string): GenerationState | null {
    const states = this.getAllStates();
    return states.find(s => s.id === id) || null;
  }

  /**
   * Get all active generation states
   */
  getAllStates(): GenerationState[] {
    try {
      if (typeof window === 'undefined') return [];
      
      const stored = localStorage.getItem(this.config.storageKey);
      if (!stored) return [];

      const states = JSON.parse(stored) as GenerationState[];
      return this.cleanupStates(states);
    } catch (error) {
      console.error('❌ Failed to load generation states:', error);
      return [];
    }
  }

  /**
   * Get active (pending/processing) generation states
   */
  getActiveStates(): GenerationState[] {
    return this.getAllStates().filter(state => 
      state.status === 'pending' || state.status === 'processing'
    );
  }

  /**
   * Update generation state
   */
  updateState(id: string, updates: Partial<GenerationState>): void {
    const state = this.getState(id);
    if (state) {
      this.saveState({ ...state, ...updates });
    }
  }

  /**
   * Remove generation state
   */
  removeState(id: string): void {
    try {
      const states = this.getAllStates().filter(s => s.id !== id);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.config.storageKey, JSON.stringify(states));
      }

      this.notifySubscribers(states);
      console.log('🗑️ Generation state removed:', id);
    } catch (error) {
      console.error('❌ Failed to remove generation state:', error);
    }
  }

  /**
   * Clear all generation states
   */
  clearAll(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.config.storageKey);
      }
      
      this.notifySubscribers([]);
      console.log('🧹 All generation states cleared');
    } catch (error) {
      console.error('❌ Failed to clear generation states:', error);
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: (states: GenerationState[]) => void): () => void {
    this.subscribers.add(callback);
    
    // Immediately call with current states
    callback(this.getAllStates());
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Check if generation should be considered stale
   */
  isStale(state: GenerationState): boolean {
    const now = Date.now();
    const age = now - state.lastUpdate;
    return age > this.config.maxAge;
  }

  /**
   * Get recovery candidates (active but potentially stale)
   */
  getRecoveryCandidates(): GenerationState[] {
    return this.getActiveStates().filter(state => {
      const age = Date.now() - state.startTime;
      // Consider for recovery if:
      // 1. Still in active status
      // 2. Less than max age
      // 3. Has fileId for SSE connection
      return age < this.config.maxAge && state.fileId;
    });
  }

  /**
   * Mark generation as recovered
   */
  markAsRecovered(id: string): void {
    this.updateState(id, { 
      lastUpdate: Date.now(),
      message: 'Connection recovered'
    });
  }

  /**
   * Private: Clean up old states
   */
  private cleanupStates(states: GenerationState[]): GenerationState[] {
    const now = Date.now();
    
    // Remove states older than maxAge
    let cleanStates = states.filter(state => {
      const age = now - state.lastUpdate;
      return age < this.config.maxAge;
    });

    // Keep only the most recent maxItems
    if (cleanStates.length > this.config.maxItems) {
      cleanStates = cleanStates
        .sort((a, b) => b.lastUpdate - a.lastUpdate)
        .slice(0, this.config.maxItems);
    }

    return cleanStates;
  }

  /**
   * Private: Notify all subscribers
   */
  private notifySubscribers(states: GenerationState[]): void {
    this.subscribers.forEach(callback => {
      try {
        callback(states);
      } catch (error) {
        console.error('❌ Error in generation state subscriber:', error);
      }
    });
  }
}

// Global instance
export const generationPersistence = new GenerationPersistence();

/**
 * React hook for using generation persistence
 */
export function useGenerationPersistence() {
  return generationPersistence;
} 