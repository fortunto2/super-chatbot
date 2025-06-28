// AICODE-NOTE: Centralized polling manager with intelligent backoff and 7-minute timeout
export interface PollingOptions {
  /** Maximum polling duration in milliseconds (default: 7 minutes) */
  maxDuration?: number;
  /** Initial polling interval in milliseconds (default: 1000ms) */
  initialInterval?: number;
  /** Maximum polling interval in milliseconds (default: 10000ms) */
  maxInterval?: number;
  /** Backoff multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Maximum number of consecutive errors before giving up (default: 5) */
  maxConsecutiveErrors?: number;
  /** Custom error handler for non-critical errors */
  onError?: (error: Error, attempt: number) => void;
  /** Progress callback for tracking polling attempts */
  onProgress?: (attempt: number, elapsed: number, nextInterval: number) => void;
}

export interface PollingResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  attempts: number;
  duration: number;
  method: 'success' | 'timeout' | 'error' | 'rate_limited';
}

export type PollingChecker<T> = () => Promise<{
  completed: boolean;
  data?: T;
  error?: string;
  shouldContinue?: boolean;
}>;

class SmartPollingManager {
  private activePolls = new Map<string, AbortController>();
  private pollStats = new Map<string, {
    startTime: number;
    attempts: number;
    lastError?: string;
  }>();

  /**
   * Start smart polling with exponential backoff and rate limiting protection
   */
  async startPolling<T>(
    pollId: string,
    checker: PollingChecker<T>,
    options: PollingOptions = {}
  ): Promise<PollingResult<T>> {
    // Set up options with defaults
    const opts = {
      maxDuration: 7 * 60 * 1000, // 7 minutes default
      initialInterval: 1000, // 1 second
      maxInterval: 10000, // 10 seconds
      backoffMultiplier: 2,
      maxConsecutiveErrors: 5,
      ...options
    };

    // Check if already polling this ID
    if (this.activePolls.has(pollId)) {
      console.warn(`⚠️ Polling already active for ${pollId}, cancelling previous`);
      this.stopPolling(pollId);
    }

    // Create abort controller for this poll
    const abortController = new AbortController();
    this.activePolls.set(pollId, abortController);

    // Initialize stats
    const startTime = Date.now();
    this.pollStats.set(pollId, {
      startTime,
      attempts: 0
    });

    let currentInterval = opts.initialInterval;
    let consecutiveErrors = 0;
    let attempts = 0;

    console.log(`🔄 Starting smart polling for ${pollId} (max: ${opts.maxDuration / 1000}s)`);

    try {
      while (!abortController.signal.aborted) {
        attempts++;
        const elapsed = Date.now() - startTime;

        // Check timeout
        if (elapsed >= opts.maxDuration) {
          console.error(`⏰ Polling timeout for ${pollId} after ${elapsed / 1000}s (${attempts} attempts)`);
          return {
            success: false,
            error: `Polling timeout after ${Math.round(elapsed / 1000)} seconds (${attempts} attempts)`,
            attempts,
            duration: elapsed,
            method: 'timeout'
          };
        }

        // Update stats
        const stats = this.pollStats.get(pollId)!;
        stats.attempts = attempts;

        // Call progress callback
        if (opts.onProgress) {
          opts.onProgress(attempts, elapsed, currentInterval);
        }

        console.log(`🔄 Poll attempt ${attempts} for ${pollId} (${Math.round(elapsed / 1000)}s elapsed)`);

        try {
          // Execute the checker function
          const result = await checker();

          // Reset consecutive errors on successful call
          consecutiveErrors = 0;
          stats.lastError = undefined;

          // Check if completed
          if (result.completed) {
            console.log(`✅ Polling completed for ${pollId} after ${attempts} attempts (${Math.round(elapsed / 1000)}s)`);
            return {
              success: true,
              data: result.data,
              attempts,
              duration: elapsed,
              method: 'success'
            };
          }

          // Check if should continue
          if (result.shouldContinue === false) {
            console.log(`🛑 Polling stopped by checker for ${pollId}`);
            return {
              success: false,
              error: result.error || 'Polling stopped by checker',
              attempts,
              duration: elapsed,
              method: 'error'
            };
          }

          // If error provided but should continue, log it
          if (result.error) {
            console.warn(`⚠️ Non-critical error in poll ${pollId}: ${result.error}`);
            if (opts.onError) {
              opts.onError(new Error(result.error), attempts);
            }
          }

        } catch (error: any) {
          consecutiveErrors++;
          const errorMessage = error?.message || 'Unknown error';
          stats.lastError = errorMessage;

          console.error(`❌ Polling error ${consecutiveErrors}/${opts.maxConsecutiveErrors} for ${pollId}:`, errorMessage);

          // Handle rate limiting (HTTP 429)
          if (error?.status === 429 || errorMessage.includes('429') || errorMessage.includes('rate limit')) {
            console.warn(`🚫 Rate limited for ${pollId}, using exponential backoff`);
            
            // Extract retry-after header if available
            const retryAfter = this.extractRetryAfter(error);
            if (retryAfter) {
              currentInterval = Math.min(retryAfter * 1000, opts.maxInterval);
              console.log(`⏰ Rate limit retry-after: ${retryAfter}s`);
            } else {
              // Double the interval for rate limiting
              currentInterval = Math.min(currentInterval * 2, opts.maxInterval);
            }
          } else {
            // Handle other errors
            if (opts.onError) {
              opts.onError(error, attempts);
            }

            // Check if too many consecutive errors
            if (consecutiveErrors >= opts.maxConsecutiveErrors) {
              console.error(`💥 Too many consecutive errors (${consecutiveErrors}) for ${pollId}, giving up`);
              return {
                success: false,
                error: `Too many consecutive errors: ${errorMessage}`,
                attempts,
                duration: elapsed,
                method: 'error'
              };
            }
          }
        }

        // Wait before next attempt (unless aborted)
        if (!abortController.signal.aborted) {
          console.log(`⏱️ Waiting ${currentInterval}ms before next poll attempt for ${pollId}`);
          await this.wait(currentInterval, abortController.signal);

          // Implement intelligent backoff
          if (consecutiveErrors === 0) {
            // Progressive backoff: 1s -> 2s -> 5s -> 10s
            if (currentInterval < 2000) {
              currentInterval = 2000;
            } else if (currentInterval < 5000) {
              currentInterval = 5000;
            } else if (currentInterval < opts.maxInterval) {
              currentInterval = opts.maxInterval;
            }
          } else {
            // Exponential backoff on errors
            currentInterval = Math.min(currentInterval * opts.backoffMultiplier, opts.maxInterval);
          }
        }
      }

      // If we get here, polling was aborted
      console.log(`🛑 Polling aborted for ${pollId}`);
      return {
        success: false,
        error: 'Polling was aborted',
        attempts,
        duration: Date.now() - startTime,
        method: 'error'
      };

    } finally {
      // Cleanup
      this.activePolls.delete(pollId);
      this.pollStats.delete(pollId);
    }
  }

  /**
   * Stop polling for a specific ID
   */
  stopPolling(pollId: string): boolean {
    const controller = this.activePolls.get(pollId);
    if (controller) {
      console.log(`🛑 Stopping polling for ${pollId}`);
      controller.abort();
      this.activePolls.delete(pollId);
      this.pollStats.delete(pollId);
      return true;
    }
    return false;
  }

  /**
   * Stop all active polling
   */
  stopAllPolling(): void {
    console.log(`🛑 Stopping all polling (${this.activePolls.size} active)`);
    for (const [pollId, controller] of this.activePolls) {
      controller.abort();
    }
    this.activePolls.clear();
    this.pollStats.clear();
  }

  /**
   * Get status of active polling operations
   */
  getPollingStatus(): Array<{
    pollId: string;
    attempts: number;
    elapsed: number;
    lastError?: string;
  }> {
    const now = Date.now();
    return Array.from(this.pollStats.entries()).map(([pollId, stats]) => ({
      pollId,
      attempts: stats.attempts,
      elapsed: now - stats.startTime,
      lastError: stats.lastError
    }));
  }

  /**
   * Check if polling is active for a specific ID
   */
  isPolling(pollId: string): boolean {
    return this.activePolls.has(pollId);
  }

  // Private helper methods

  private async wait(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);
      
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('Aborted'));
        });
      }
    });
  }

  private extractRetryAfter(error: any): number | null {
    // Try to extract Retry-After header from various error formats
    if (error?.headers?.['retry-after']) {
      return Number.parseInt(error.headers['retry-after'], 10);
    }
    if (error?.response?.headers?.['retry-after']) {
      return Number.parseInt(error.response.headers['retry-after'], 10);
    }
    if (error?.message?.includes('retry-after')) {
      const match = error.message.match(/retry-after[:\s]+(\d+)/i);
      if (match) {
        return Number.parseInt(match[1], 10);
      }
    }
    return null;
  }
}

// Export singleton instance
export const smartPollingManager = new SmartPollingManager();

// Helper function for file-based polling (commonly used pattern)
export async function pollFileCompletion(
  fileId: string,
  options: PollingOptions = {}
): Promise<PollingResult<any>> {
  const pollId = `file-${fileId}`;
  
  const checker: PollingChecker<any> = async () => {
      // Use Next.js API proxy for consistent auth handling
      const response = await fetch(`/api/file/${fileId}`);
      
      if (!response.ok) {
        // Distinguish between different error types
        if (response.status === 429) {
          throw { status: 429, message: 'Rate limited' };
        }
        if (response.status >= 500) {
          throw new Error(`Server error: ${response.status}`);
        }
        if (response.status === 404) {
          return {
            completed: false,
            error: 'File not found - may still be processing',
            shouldContinue: true
          };
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const fileData = await response.json();
      
      // Check if file is completed
      if (fileData.url) {
        return {
          completed: true,
          data: fileData
        };
      }
      
      // Check for error status in tasks
      if (fileData.tasks && fileData.tasks.length > 0) {
        const latestTask = fileData.tasks[fileData.tasks.length - 1];
        if (latestTask.status === 'error') {
          return {
            completed: false,
            error: 'File generation failed',
            shouldContinue: false
          };
        }
      }
      
      // Continue polling
      return {
        completed: false,
        shouldContinue: true
      };
  };
  
  return smartPollingManager.startPolling(pollId, checker, options);
}

// Helper function for project-based polling (legacy compatibility)
export async function pollProjectCompletion(
  projectId: string,
  options: PollingOptions = {}
): Promise<PollingResult<any>> {
  const pollId = `project-${projectId}`;
  
  const checker: PollingChecker<any> = async () => {
      const response = await fetch(`/api/project/${projectId}`);
      
      if (!response.ok) {
        if (response.status === 429) {
          throw { status: 429, message: 'Rate limited' };
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const project = await response.json();
      
      // Look for completed media in project data
      if (project.data && project.data.length > 0) {
        const mediaData = project.data.find((data: any) => {
          if (data.value && typeof data.value === 'object') {
            const value = data.value as Record<string, any>;
            return value.url && (
              value.contentType?.startsWith('image/') ||
              value.contentType?.startsWith('video/') ||
              value.url.match(/\.(jpg|jpeg|png|webp|gif|mp4|mov|webm|avi)$/i)
            );
          }
          return false;
        });
        
        if (mediaData?.value && typeof mediaData.value === 'object') {
          const url = (mediaData.value as Record<string, any>).url as string;
          return {
            completed: true,
            data: { url, projectId, ...mediaData.value }
          };
        }
      }
      
      // Check for error tasks
      const hasErrorTask = project.tasks?.some((task: any) => task.status === 'ERROR');
      if (hasErrorTask) {
        return {
          completed: false,
          error: 'Project generation failed',
          shouldContinue: false
        };
      }
      
      // Continue polling if tasks are still in progress
      const hasInProgress = project.tasks?.some((task: any) => task.status === 'IN_PROGRESS');
      if (hasInProgress || project.tasks?.length === 0) {
        return {
          completed: false,
          shouldContinue: true
        };
      }
      
      // No tasks in progress but not completed - might be stalled
      return {
        completed: false,
        error: 'Project generation may have stalled',
        shouldContinue: true
      };
  };
  
  return smartPollingManager.startPolling(pollId, checker, options);
} 