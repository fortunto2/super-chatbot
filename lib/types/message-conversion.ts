/**
 * Type conversion utilities for message interfaces
 * Solves @ts-expect-error issues in chat/route.ts and message-editor.tsx
 */

import type { Message as UIMessage } from 'ai';

// Database message type (matches actual DB query structure)
export interface DBMessage {
  id: string;
  chatId: string;
  role: string;
  parts: unknown; // DB returns unknown type
  attachments: unknown; // DB returns unknown type
  createdAt: Date;
}

// Legacy message type for migration
export interface MessageDeprecated {
  id: string;
  chatId: string;
  role: string;
  content: string | any[];
  createdAt: Date;
}

/**
 * Convert database messages to UI messages compatible with AI SDK
 */
export function convertDBMessagesToUIMessages(dbMessages: DBMessage[]): UIMessage[] {
  return dbMessages.map((dbMessage): UIMessage => {
    // Safely parse parts from unknown type
    const parts = Array.isArray(dbMessage.parts) ? dbMessage.parts : [];
    
    // Handle different role types
    if (dbMessage.role === 'user') {
      // User messages: combine parts into content string
      const textContent = parts
        .filter((part: any) => part && typeof part === 'object' && part.type === 'text')
        .map((part: any) => part.text || '')
        .join(' ');

      return {
        id: dbMessage.id,
        role: 'user',
        content: textContent || 'Empty message',
        createdAt: dbMessage.createdAt,
      } as UIMessage;
    }

    if (dbMessage.role === 'assistant') {
      // Assistant messages: preserve parts structure
      return {
        id: dbMessage.id,
        role: 'assistant',
        content: '', // AI SDK expects content for assistants
        parts: parts,
        createdAt: dbMessage.createdAt,
      } as UIMessage;
    }

    // Fallback for other roles
    return {
      id: dbMessage.id,
      role: dbMessage.role as any,
      content: typeof dbMessage.parts === 'string' 
        ? dbMessage.parts 
        : JSON.stringify(dbMessage.parts),
      createdAt: dbMessage.createdAt,
    } as UIMessage;
  });
}

/**
 * Convert legacy deprecated messages to UI messages for migration
 */
export function convertDeprecatedMessagesToUIMessages(messages: MessageDeprecated[]): UIMessage[] {
  return messages.map((message): UIMessage => {
    // Handle content as string or array
    const content = typeof message.content === 'string' 
      ? message.content 
      : Array.isArray(message.content)
        ? message.content.map(part => 
            typeof part === 'object' && part.text ? part.text : String(part)
          ).join(' ')
        : String(message.content);

    return {
      id: message.id,
      role: message.role as any,
      content,
      createdAt: message.createdAt,
    } as UIMessage;
  });
}

/**
 * Type guard to check if a message is a DB message
 */
export function isDBMessage(message: any): message is DBMessage {
  return message && 
    typeof message.id === 'string' &&
    typeof message.chatId === 'string' &&
    typeof message.role === 'string' &&
    Array.isArray(message.parts) &&
    message.createdAt instanceof Date;
}

/**
 * Type guard to check if a message is a deprecated message
 */
export function isDeprecatedMessage(message: any): message is MessageDeprecated {
  return message && 
    typeof message.id === 'string' &&
    typeof message.chatId === 'string' &&
    typeof message.role === 'string' &&
    (typeof message.content === 'string' || Array.isArray(message.content)) &&
    message.createdAt instanceof Date;
} 