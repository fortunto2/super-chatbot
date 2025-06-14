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
  hasInitialized,
  setArtifact,
  chatId,
  resetState,
  setPrompt,
  initialPrompt
}: UseImageEffectsProps) {
  const prevChatIdRef = useRef<string | undefined>(chatId);

  // Update artifact when image generation is completed
  useEffect(() => {
    if (!imageUrl || status !== 'completed' || !setArtifact || !hasInitialized) {
      return;
    }

    setArtifact((prevArtifact: any) => {
      try {
        const currentContent = JSON.parse(prevArtifact.content || '{}');
        
        if (currentContent.status !== 'completed' || currentContent.imageUrl !== imageUrl) {
          return {
            ...prevArtifact,
            content: JSON.stringify({
              ...currentContent,
              status: 'completed',
              imageUrl: imageUrl,
            }),
          };
        }
        return prevArtifact;
      } catch {
        return prevArtifact;
      }
    });
  }, [imageUrl, status, setArtifact, hasInitialized]);

  // Reset state when chatId changes
  useEffect(() => {
    if (prevChatIdRef.current !== chatId) {
      prevChatIdRef.current = chatId;
      
      if (chatId && status !== 'pending') {
        resetState();
        setPrompt(initialPrompt || '');
      }
    }
  }, [chatId, status, resetState, setPrompt, initialPrompt]);
} 