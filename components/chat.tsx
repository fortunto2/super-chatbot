'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { Suspense, useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, generateUUID, cn } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { toast } from './toast';
import type { Session } from 'next-auth';
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { useChatImageWebSocket } from '@/hooks/use-chat-image-websocket';
import { ChatWebSocketCleanup } from '@/lib/utils/chat-websocket-cleanup';
import { LoaderIcon } from './icons';
import { PreviewMessage, ThinkingMessage } from './message';

function ChatContent({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
  onDataStream,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
  onDataStream?: (dataStream: any[]) => void;
}) {
  const { mutate } = useSWRConfig();

  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
    experimental_resume,
    data,
  } = useChat({
    id,
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    experimental_prepareRequestBody: (body) => {
      const lastMessage = body.messages.at(-1);
      if (!lastMessage || !lastMessage.content || !lastMessage.content.trim()) return null;
      
      const messageId = lastMessage.id || generateUUID();
      
      return {
        id: id,
        message: {
          id: messageId,
          createdAt: new Date(),
          role: 'user',
          content: lastMessage.content.trim(),
          parts: lastMessage.parts || [{ type: 'text', text: lastMessage.content.trim() }],
          experimental_attachments: lastMessage.experimental_attachments || []
        },
        selectedChatModel: initialChatModel,
        selectedVisibilityType: visibilityType,
      };
    },
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      toast({
        type: 'error',
        description: error.message,
      });
      console.log(error)
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      append({
        role: 'user',
        content: query,
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, '', `/chat/${id}`);
    }
  }, [query, append, hasAppendedQuery, id]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  // Notify parent about dataStream changes for artifacts
  useEffect(() => {
    if (data && onDataStream) {
      // Notifying parent about dataStream changes
      onDataStream(data);
    }
  }, [data, onDataStream]);

  useAutoResume({
    autoResume,
    initialMessages,
    experimental_resume,
    data,
    setMessages,
  });

  // Set active chat for cleanup management
  useEffect(() => {
    ChatWebSocketCleanup.setActiveChat(id);
  }, [id]);

  // Global WebSocket connection for image generation
  const chatImageWebSocket = useChatImageWebSocket({
    chatId: id,
    messages,
    setMessages,
    enabled: !isReadonly, // Only enable for non-readonly chats
  });

  // Register WebSocket instance for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const globalWindow = window as any;
      if (globalWindow.setChatWebSocketInstance) {
        // Create a persistent storage object that maintains lastImageUrl
        if (!globalWindow.chatWebSocketInstance) {
          globalWindow.chatWebSocketInstance = {};
        }
        
        // Update with current WebSocket data while preserving lastImageUrl
        Object.assign(globalWindow.chatWebSocketInstance, {
          ...chatImageWebSocket,
          messages,
          lastImageUrl: globalWindow.chatWebSocketInstance.lastImageUrl // Preserve existing URL
        });
        
        // Debugging instance stored silently
      }
    }
  }, [chatImageWebSocket, messages]);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={initialChatModel}
          selectedVisibilityType={initialVisibilityType}
          isReadonly={isReadonly}
          session={session}
        />

        <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
          selectedChatModel={initialChatModel}
          selectedVisibilityType={visibilityType}
          append={append}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
              selectedVisibilityType={visibilityType}
            />
          )}
        </form>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
        selectedVisibilityType={visibilityType}
        selectedChatModel={initialChatModel}
      />

      <div className="pb-48 pt-4 md:pt-8">
        {initialMessages?.length ? (
          <>
            {messages.map((message) => (
              <PreviewMessage
                key={message.id}
                chatId={id}
                message={message}
                vote={votes?.find((vote) => vote.messageId === message.id)}
                isLoading={status === 'streaming'}
                setMessages={setMessages}
                reload={reload}
                isReadonly={isReadonly}
                requiresScrollPadding={
                  message.id === messages[messages.length - 1].id &&
                  message.role === 'assistant'
                }
                selectedChatModel={initialChatModel}
                selectedVisibilityType={visibilityType}
                append={append}
              />
            ))}
            {status === 'streaming' && <ThinkingMessage />}
          </>
        ) : null}
      </div>
    </>
  );
}

export function Chat(props: {
  id: string;
  initialMessages: Array<UIMessage>;
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
  onDataStream?: (dataStream: any[]) => void;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-w-0 h-dvh bg-background">
          <div className="flex items-center justify-center h-dvh">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin text-zinc-500 size-12">
                <LoaderIcon size={48} />
              </div>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                Загрузка чата...
              </p>
            </div>
          </div>
        </div>
      }
    >
      <ChatContent {...props} />
    </Suspense>
  );
}
