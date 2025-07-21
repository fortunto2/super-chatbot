import { useEffect, useRef } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import { saveMediaToChat } from '@/lib/ai/chat/media';

interface UseVideoEffectsProps {
  videoUrl?: string;
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

// AICODE-NOTE: Function to generate a valid UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};


export function useVideoEffects({
  videoUrl,
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
}: UseVideoEffectsProps) {
  const savedVideoUrlRef = useRef<string>('none');

  // AICODE-NOTE: Auto-save completed video to chat history for permanent access
  useEffect(() => {
    // Debug all conditions
    console.log('🔍 useVideoEffects debug:', {
      videoUrl: videoUrl ? `${videoUrl.substring(0, 50)}...` : 'none',
      status,
      hasInitialized,
      chatId: chatId || 'none',
      setMessages: !!setMessages,
      prompt: prompt ? `${prompt.substring(0, 30)}...` : 'none',
      savedVideoUrlRef: savedVideoUrlRef.current,
      allConditionsMet: !!(
        videoUrl &&
        status === 'completed' &&
        hasInitialized &&
        chatId &&
        setMessages &&
        prompt &&
        savedVideoUrlRef.current !== videoUrl
      ),
    });

    // Only save if all conditions are met AND video hasn't been saved before
    if (
      videoUrl &&
      status === 'completed' &&
      hasInitialized &&
      chatId &&
      setMessages &&
      prompt &&
      savedVideoUrlRef.current !== videoUrl // Prevent duplicate saves
    ) {
      console.log(
        '💾 🎬 Video generation completed, auto-saving to chat history...',
      );
      savedVideoUrlRef.current = videoUrl;

      // AICODE-NOTE: Skip database save for tool chatId, only save to local chat
      const isToolChat = chatId === 'video-generator-tool' || chatId === 'image-generator-tool';
      if (isToolChat) {
        console.log('💾 🔧 Tool chat detected, skipping database save but adding to local chat');
        
        // Create video attachment for local chat display only
        const videoAttachment = {
          name: prompt.length > 50 ? `${prompt.substring(0, 50)}...` : prompt,
          url: videoUrl,
          contentType: 'video/mp4',
        };

        // Create message with video attachment and temporary UUID for local display
        const videoMessage = {
          id: generateUUID(),
          role: 'assistant' as const,
          content: `Generated video: "${prompt}"`,
          parts: [
            {
              type: 'text' as const,
              text: `Generated video: "${prompt}"`,
            },
          ],
          experimental_attachments: [videoAttachment],
          createdAt: new Date(),
        };

        // Add message to local chat history only
        setMessages((prevMessages) => [...prevMessages, videoMessage]);
        console.log('💾 ✅ Video added to local chat history (tool mode)!');
        return;
      }

      // Small delay to ensure artifact is updated first
      setTimeout(() => {
        saveMediaToChat(chatId, videoUrl, prompt, setMessages, "video");
      }, 100);
    }
  }, [videoUrl, status, hasInitialized, chatId, setMessages, prompt]);

  // Handle prompt reset
  useEffect(() => {
    if (status === 'completed' && initialPrompt) {
      resetState();
      setPrompt('');
    }
  }, [status, initialPrompt, resetState, setPrompt]);

  // Handle artifact update
  useEffect(() => {
    if (videoUrl && setArtifact) {
      setArtifact((prev) => ({
        ...prev,
        content: JSON.stringify({
          projectId: chatId,
          status,
          videoUrl,
          prompt,
        }),
      }));
    }
  }, [videoUrl, status, chatId, prompt, setArtifact]);
} 