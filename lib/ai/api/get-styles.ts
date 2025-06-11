
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

export const getStyles = async () => {
    try {
      const url = "https://editor.superduperai.co"
      // const url = process.env.NEXT_PUBLIC_API_URL ?? "https://editor.superduperai.co"
      const token = "afda4dc28cf1420db6d3e35a291c2d5f"
      const response = await fetch(`${url}/api/v1/style`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
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
      return result
  
    } catch (error: any) {
      console.error('Style getting error:', error);
      return {
        success: false,
        error: error?.message || 'Unknown error occurred during style',
      };
    }
  }