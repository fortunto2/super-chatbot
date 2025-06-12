import { useEffect, useRef } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';

interface UseImageEffectsProps {
  imageUrl?: string;
  status: string;
  append?: UseChatHelpers['append'];
  prompt: string;
  hasInitialized: boolean;
  setArtifact?: (fn: (prev: any) => any) => void;
  chatId?: string;
  resetState: () => void;
  setPrompt: (prompt: string) => void;
  initialPrompt?: string;
  setMessages?: UseChatHelpers['setMessages'];
}

export function useImageEffects({
  imageUrl,
  status,
  append,
  prompt,
  hasInitialized,
  setArtifact,
  chatId,
  resetState,
  setPrompt,
  initialPrompt,
  setMessages
}: UseImageEffectsProps) {
  const sentToChat = useRef<Set<string>>(new Set());
  const prevChatIdRef = useRef<string | undefined>(chatId);

  // NOTE: Image sending to chat is now handled by useChatImageWebSocket globally
  // This effect is disabled to prevent duplicates
  
  /*
  // Send image to chat when generation is completed (as assistant message)
  useEffect(() => {
    if (imageUrl && 
        status === 'completed' && 
        setMessages && 
        prompt &&
        hasInitialized &&
        !sentToChat.current.has(imageUrl)) {
      
      // Mark this image as sent to prevent duplicates
      sentToChat.current.add(imageUrl);
      
      // Create attachment for the image
      const imageAttachment = {
        url: imageUrl,
        name: `generated-image-${Date.now()}.png`,
        contentType: 'image/png' as const,
      };

      // Add message from assistant with image attachment
      setMessages((prevMessages: any[]) => [
        ...prevMessages,
        {
          id: `image-${Date.now()}`,
          role: 'assistant',
          content: `I've generated the image: "${prompt}"`,
          experimental_attachments: [imageAttachment],
          createdAt: new Date(),
        }
      ]);
    }
  }, [imageUrl, status, setMessages, prompt, hasInitialized]);
  */

  // Update artifact when image generation is completed
  useEffect(() => {
    if (imageUrl && 
        status === 'completed' && 
        setArtifact &&
        hasInitialized) {
      
      // Avoid infinite loops by checking if artifact is already updated
      setArtifact((prevArtifact: any) => {
        try {
          const currentContent = JSON.parse(prevArtifact.content || '{}');
          
          // Only update if status is not already 'completed' or imageUrl is different
          if (currentContent.status !== 'completed' || currentContent.imageUrl !== imageUrl) {
            const updatedArtifact = {
              ...prevArtifact,
              content: JSON.stringify({
                ...currentContent,
                status: 'completed',
                imageUrl: imageUrl,
              }),
            };
            return updatedArtifact;
          }
          return prevArtifact;
        } catch (error) {
          console.error('❌ Error updating artifact:', error);
          return prevArtifact;
        }
      });
    }
  }, [imageUrl, status, setArtifact, hasInitialized]);

  // Reset state when chatId changes
  useEffect(() => {
    if (prevChatIdRef.current !== chatId) {
      prevChatIdRef.current = chatId;
      
      // Clear sent images tracking when chatId changes
      sentToChat.current.clear();
      
      // Reset image generation state when chat changes
      if (chatId && status !== 'pending') {
        resetState();
        setPrompt(initialPrompt || '');
      }
    }
  }, [chatId, status, resetState, setPrompt, initialPrompt]);

  return {
    sentToChat: sentToChat.current
  };
} 