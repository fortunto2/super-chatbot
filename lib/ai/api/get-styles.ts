
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
      
      const response = await fetch('https://editor.superduperai.co/api/v1/style', {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          'Authorization': 'Bearer a5c326b39ac44a82bb31aa1c9436e807'
        },
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        if (response.status === 401) {
          return {
            success: false,
            error: 'Authentication failed. The API token may be invalid or expired.',
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