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

// AICODE-NOTE: Function to check if image already exists in chat to prevent duplicates
const checkImageExistsInChat = (
  setMessages: UseChatHelpers['setMessages'],
  imageUrl: string,
): boolean => {
  let imageExists = false;

  setMessages((prevMessages) => {
    // Check if any message already contains this image URL
    imageExists = prevMessages.some((message) =>
      message.experimental_attachments?.some(
        (attachment) => attachment.url === imageUrl,
      ),
    );
    return prevMessages; // Don't modify messages, just check
  });

  return imageExists;
};

// AICODE-NOTE: Function to save generated image as a permanent chat message with attachment
const saveImageToChat = async (
  chatId: string,
  imageUrl: string,
  prompt: string,
  setMessages?: UseChatHelpers['setMessages'],
) => {
  if (!setMessages || !chatId) {
    console.log(
      '💾 ⚠️ Cannot save image to chat - missing setMessages or chatId',
    );
    return;
  }

  console.log('💾 Saving generated image to chat history...', {
    chatId,
    imageUrl: `${imageUrl.substring(0, 50)}...`,
    prompt,
  });

  try {
    // AICODE-NOTE: Check if image already exists in chat to prevent duplicates from clicks
    const imageExists = checkImageExistsInChat(setMessages, imageUrl);
    if (imageExists) {
      console.log('💾 ⏭️ Image already exists in chat, skipping duplicate save');
      return;
    }

    // Create image attachment for permanent storage in chat
    const imageAttachment = {
      name: prompt.length > 50 ? `${prompt.substring(0, 50)}...` : prompt, // Use prompt as name instead of generic filename
      url: imageUrl,
      contentType: 'image/webp',
    };

    // Create message with image attachment and valid UUID
    const imageMessage = {
      id: generateUUID(), // Use proper UUID instead of random string
      role: 'assistant' as const,
      content: `Generated image: "${prompt}"`,
      parts: [
        {
          type: 'text' as const,
          text: `Generated image: "${prompt}"`,
        },
      ],
      experimental_attachments: [imageAttachment],
      createdAt: new Date(),
    };

    // Add message to chat history
    setMessages((prevMessages) => [...prevMessages, imageMessage]);

    console.log('💾 ✅ Image added to chat history locally!');

    // Save to database
    try {
      const response = await fetch('/api/save-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          message: {
            id: imageMessage.id,
            role: imageMessage.role,
            parts: imageMessage.parts,
            attachments: imageMessage.experimental_attachments,
            createdAt: imageMessage.createdAt,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(
          `Failed to save message: ${response.status} - ${errorText}`,
        );
      }

      console.log('💾 ✅ Image saved to database successfully!');
    } catch (dbError) {
      console.warn(
        '💾 ⚠️ Failed to save to database, but image is in chat locally:',
        dbError,
      );
      // Don't throw - the image is already in chat locally
    }

    console.log(
      '💾 📷 Image will remain accessible even after closing the artifact',
    );
  } catch (error) {
    console.error('💾 ❌ Failed to save image to chat:', error);
  }
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
        saveImageToChat(chatId, imageUrl, prompt, setMessages);
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
