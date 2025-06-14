'use client';

import { useState } from 'react';
import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import type { UIMessage } from 'ai';
import type { VisibilityType } from '@/components/visibility-selector';
import type { Session } from 'next-auth';

interface ChatPageWrapperProps {
  id: string;
  initialMessages: Array<UIMessage>;
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
}

export function ChatPageWrapper(props: ChatPageWrapperProps) {
  const [dataStream, setDataStream] = useState<any[]>([]);

  return (
    <>
      <Chat
        {...props}
        onDataStream={setDataStream}
      />
      <DataStreamHandler id={props.id} dataStream={dataStream} />
    </>
  );
} 