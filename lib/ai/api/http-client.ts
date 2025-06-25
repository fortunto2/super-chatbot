import { 
  getSuperduperAIConfig, 
  createAuthHeaders, 
  createAPIURL 
} from '@/lib/config/superduperai';

// HTTP methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Request options
export interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
  headers?: Headers;
}

/**
 * Universal HTTP client for SuperDuperAI API
 * Uses native fetch instead of axios for lighter weight
 */
export class SuperDuperHttpClient {
  private config = getSuperduperAIConfig();
  
  /**
   * Make authenticated request to SuperDuperAI API
   */
  async request<T = any>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = 30000,
      retries = 3,
      retryDelay = 1000,
    } = options;
    
    const url = createAPIURL(endpoint);
    const requestHeaders = {
      ...createAuthHeaders(this.config),
      ...headers,
    };
    
    // Add Content-Type for POST/PUT requests with body
    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      if (!requestHeaders['Content-Type']) {
        requestHeaders['Content-Type'] = 'application/json';
      }
    }
    
    const requestInit: RequestInit = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(timeout),
    };
    
    // Add body if provided
    if (body) {
      requestInit.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    
    let lastError: Error | null = null;
    
    // Retry logic
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`🌐 ${method} ${url} (attempt ${attempt + 1}/${retries + 1})`);
        
        const response = await fetch(url, requestInit);
        
        // Parse response
        const isJson = response.headers.get('content-type')?.includes('application/json');
        let data: T;
        
        if (isJson) {
          data = await response.json();
        } else {
          data = (await response.text()) as T;
        }
        
        if (!response.ok) {
          return {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
            status: response.status,
            headers: response.headers,
            data,
          };
        }
        
        console.log(`🌐 ✅ ${method} ${url} - Success`);
        
        return {
          success: true,
          data,
          status: response.status,
          headers: response.headers,
        };
        
      } catch (error: any) {
        lastError = error;
        console.error(`🌐 ❌ ${method} ${url} - Attempt ${attempt + 1} failed:`, error.message);
        
        // Don't retry on certain errors
        if (error.name === 'AbortError' || error.message.includes('401')) {
          break;
        }
        
        // Wait before retry (except on last attempt)
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    return {
      success: false,
      error: lastError?.message || 'Request failed after all retries',
    };
  }
  
  /**
   * GET request
   */
  async get<T = any>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }
  
  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body: data });
  }
  
  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body: data });
  }
  
  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
  
  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body: data });
  }
}

// Singleton instance
export const httpClient = new SuperDuperHttpClient();

// Convenience functions
export const apiGet = <T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>) => 
  httpClient.get<T>(endpoint, options);

export const apiPost = <T = any>(endpoint: string, data?: any, options?: Omit<RequestOptions, 'method' | 'body'>) => 
  httpClient.post<T>(endpoint, data, options);

export const apiPut = <T = any>(endpoint: string, data?: any, options?: Omit<RequestOptions, 'method' | 'body'>) => 
  httpClient.put<T>(endpoint, data, options);

export const apiDelete = <T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>) => 
  httpClient.delete<T>(endpoint, options);

export const apiPatch = <T = any>(endpoint: string, data?: any, options?: Omit<RequestOptions, 'method' | 'body'>) => 
  httpClient.patch<T>(endpoint, data, options); 