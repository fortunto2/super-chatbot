import { getSuperduperAIConfig } from '@/lib/config/superduperai';

export type INextCursor = {
  offset: number;
  limit: number;
};

export type IStyleRead = {
  name: string;
  title?: (string | null);
  thumbnail?: (string | null);
  tags?: (Array<string> | null);
};


export type IResponsePaginated_IStyleRead_ = {
  items: Array<IStyleRead>;
  total: (number | null);
  limit: (number | null);
  offset: (number | null);
  next?: (INextCursor | null);
};

// Cache for styles to avoid repeated API calls
let stylesCache: IResponsePaginated_IStyleRead_ | null = null;
let cacheExpiry = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getStyles = async () => {
    // Check cache first
    if (stylesCache && Date.now() < cacheExpiry) {
  
      return stylesCache;
    }

    try {
      const config = getSuperduperAIConfig();
      const token = config.token;
      const url = config.url;
      
  
      const response = await fetch(`${url}/api/v1/style?order_by=name&order=descendent&limit=100`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🎨 ❌ API Error Response:', errorText);
        
        if (response.status === 401) {
          return {
            success: false,
            error: 'Authentication failed. The API token may be invalid or expired.', token ,
          };
        }
        
        if (response.status === 500) {
          return {
            success: false,
            error: 'Server error occurred. Please try again later or contact support.',
          };
        }
        
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
  
      const result: IResponsePaginated_IStyleRead_ = await response.json();
      
      // Cache the result
      stylesCache = result;
      cacheExpiry = Date.now() + CACHE_DURATION;
      
      // Log some example styles for debugging
      
      return result;

    } catch (error: any) {
      console.error('🎨 ❌ Style getting error:', error);
      return {
        success: false,
        error: error?.message || 'Unknown error occurred during style',
      };
    }
  }

// Helper function to clear cache manually if needed
export const clearStylesCache = () => {
  stylesCache = null;
  cacheExpiry = 0;

}