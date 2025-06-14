'use client';

import { useState, useEffect } from 'react';
import { ChevronDownIcon, LoaderIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Markdown } from './markdown';

interface MessageReasoningDebugProps {
  isLoading: boolean;
  reasoning: any; // Изменяем тип на any, чтобы анализировать разные форматы
  message?: any;
}

export function MessageReasoningDebug({
  isLoading,
  reasoning,
  message,
}: MessageReasoningDebugProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Подготавливаем текст рассуждений
  let reasoningText = '';

  // Попытка извлечь рассуждения из разных форматов
  if (typeof reasoning === 'string') {
    reasoningText = reasoning;
    
    // Для случая, когда think tags находятся в тексте
    const thinkMatch = reasoning.match(/<think>(.*?)<\/think>/s);
    if (thinkMatch && thinkMatch[1]) {
      reasoningText = thinkMatch[1].trim();
    }
  } else if (reasoning && typeof reasoning === 'object') {
    try {
      reasoningText = JSON.stringify(reasoning, null, 2);
    } catch (e) {
      reasoningText = 'Unable to convert reasoning to string';
    }
  }

  // Ищем рассуждения в разных местах
  if (message) {
    if (!reasoningText && message.parts) {
      // Ищем в parts
      for (const part of message.parts) {
        if (part.type === 'reasoning' && part.reasoning) {
          reasoningText = part.reasoning;
          break;
        } else if (part.type === 'reasoning' && part.text) {
          reasoningText = part.text;
          break;
        } else if (part.type === 'reasoning' && part.textDelta) {
          reasoningText = part.textDelta;
          break;
        }
      }
    }
    
    // Проверяем, есть ли рассуждения в свойстве reasoning
    if (!reasoningText && message.reasoning) {
      reasoningText = typeof message.reasoning === 'string' 
        ? message.reasoning 
        : JSON.stringify(message.reasoning, null, 2);
    }
    
    // Ищем рассуждения в content
    if (!reasoningText && message.content && typeof message.content === 'string') {
      const thinkMatch = message.content.match(/<think>(.*?)<\/think>/s);
      if (thinkMatch && thinkMatch[1]) {
        reasoningText = thinkMatch[1].trim();
      }
    }
  }

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    expanded: {
      height: 'auto',
      opacity: 1,
      marginTop: '1rem',
      marginBottom: '0.5rem',
    },
  };

  // Проверяем, есть ли содержимое в рассуждениях
  if (!reasoningText || reasoningText.trim() === '') {
    return (
      <div className="flex flex-col">
        <div className="text-xs p-2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 rounded">
          ⚠️ Рассуждения были запрошены, но не найдены в ответе
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-row gap-2 items-center">
        <div className="font-medium bg-gradient-to-r from-blue-500 to-violet-500 text-transparent bg-clip-text">AI reasoning debug</div>
        <span className="text-xs text-muted-foreground">
          ({reasoningText.length} chars)
        </span>
        <button
          data-testid="message-reasoning-toggle"
          type="button"
          className="cursor-pointer"
          onClick={() => {
            setIsExpanded(!isExpanded);
          }}
        >
          <ChevronDownIcon />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            data-testid="message-reasoning"
            key="content"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
            className="pl-4 text-zinc-600 dark:text-zinc-400 border-l flex flex-col gap-4"
          >
            <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded text-xs">
              <details>
                <summary>Debugging info</summary>
                <pre>
                  {JSON.stringify({
                    sourceType: typeof reasoning,
                    sourceKeys: reasoning && typeof reasoning === 'object' ? Object.keys(reasoning) : 'not an object',
                    messageInfo: message ? {
                      keys: Object.keys(message),
                      hasReasoning: !!message.reasoning,
                      parts: message.parts ? message.parts.length : 0
                    } : 'no message'
                  }, null, 2)}
                </pre>
              </details>
            </div>
            <Markdown>{reasoningText}</Markdown>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 