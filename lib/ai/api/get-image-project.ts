
export interface ImageGenerationResult {
    success: boolean;
    project?: any
    error?: string
}

export const getProject = async (
  chatId: string
): Promise<ImageGenerationResult> => {
    try {
      const token = "afda4dc28cf1420db6d3e35a291c2d5f"
      const response = await fetch('https://editor.superduperai.co/api/v1/project', {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: chatId,
        }),
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
  
      const result = await response.json();
  
      return {
        success: true,
        project: result
      };
  
    } catch (error: any) {
      console.error('Image generation error:', error);
      return {
        success: false,
        error: error?.message || 'Unknown error occurred during image generation',
      };
    }
  }
  