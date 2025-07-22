export const enhancePromptVeo3 = async ({body} : {body: string}) => {
    try {
        const response = await fetch('/api/enhance-prompt-veo3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        return response.json()
      } catch (error) {
        console.error('Enhancement error:', error);
      } 
}