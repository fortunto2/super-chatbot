/**
 * Client-safe WebSocket and SSE utilities
 * These functions can be safely used in client components
 */

interface ClientConfig {
  url: string;
  wsURL: string;
}

/**
 * Get client-safe configuration for WebSocket/SSE connections
 */
export function getClientConfig(): ClientConfig {
  if (typeof window === 'undefined') {
    // SSR fallback
    return {
      url: '',
      wsURL: '',
    };
  }

  const origin = window.location.origin;
  return {
    url: origin,
    wsURL: origin.replace('https://', 'wss://').replace('http://', 'ws://'),
  };
}

/**
 * Create WebSocket URL for client connections
 */
export function createWSURL(path: string): string {
  const config = getClientConfig();
  return `${config.wsURL}${path}`;
}

/**
 * Create SSE URL for file events (Next.js proxy)
 */
export function createFileSSEURL(fileId: string): string {
  return `/api/events/file.${fileId}`;
}

/**
 * Create SSE URL for project events (Next.js proxy) 
 */
export function createProjectSSEURL(projectId: string): string {
  return `/api/events/project.${projectId}`;
} 