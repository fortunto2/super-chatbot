import { useEffect, useRef } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import { saveImageToChat, saveMediaToChat } from '@/lib/ai/chat/media';

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
  isArtifactMode?: boolean;
}

// AICODE-NOTE: Function to generate a valid UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};


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
  setMessages,
  isArtifactMode,
}: UseImageEffectsProps) {
  const savedImageUrlRef = useRef<string>('none');

  // AICODE-NOTE: Auto-save completed image to chat history for permanent access
  useEffect(() => {
    // Debug all conditions
    console.log('🔍 useImageEffects debug:', {
      imageUrl: imageUrl ? `${imageUrl.substring(0, 50)}...` : 'none',
      status,
      hasInitialized,
      chatId: chatId || 'none',
      setMessages: !!setMessages,
      prompt: prompt ? `${prompt.substring(0, 30)}...` : 'none',
      savedImageUrlRef: savedImageUrlRef.current,
      allConditionsMet: !!(
        imageUrl &&
        status === 'completed' &&
        chatId &&
        setMessages &&
        prompt &&
        savedImageUrlRef.current !== imageUrl
      ),
    });

    // Only save if all conditions are met AND image hasn't been saved before
    if (
      imageUrl &&
      status === 'completed' &&
      chatId &&
      setMessages &&
      prompt &&
      savedImageUrlRef.current !== imageUrl // Prevent duplicate saves
    ) {
      console.log(
        '💾 🎨 Image generation completed, auto-saving to chat history...',
      );
      savedImageUrlRef.current = imageUrl;

      // Small delay to ensure artifact is updated first
      setTimeout(() => {
        saveMediaToChat(chatId, imageUrl, prompt, setMessages, "image");
      }, 100);
    }
  }, [imageUrl, status, hasInitialized, chatId, setMessages, prompt]);

  // Handle prompt reset
  useEffect(() => {
    // AICODE-FIX: Only reset state if not in artifact mode
    if (status === 'completed' && initialPrompt && !isArtifactMode) {
      resetState();
      setPrompt('');
    }
  }, [status, initialPrompt, resetState, setPrompt, isArtifactMode]);

  // Handle artifact update
  useEffect(() => {
    if (imageUrl && setArtifact) {
      setArtifact((prev) => ({
        ...prev,
        content: JSON.stringify({
          projectId: chatId,
          status,
          imageUrl,
          prompt,
        }),
      }));
    }
  }, [imageUrl, status, chatId, prompt, setArtifact]);
}
