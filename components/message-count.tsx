'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageIcon } from './icons';
import { cn } from '@/lib/utils';

interface MessageCountData {
  messageCount: number;
  maxMessages: number;
  remainingMessages: number;
  usedPercentage: number;
  userType: string;
}

interface MessageCountProps {
  className?: string;
}

export function MessageCount({ className }: MessageCountProps) {
  const [data, setData] = useState<MessageCountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMessageCount() {
      try {
        setLoading(true);
        const response = await fetch('/api/message-count');

        if (!response.ok) {
          throw new Error('Failed to fetch message count');
        }

        const data = await response.json();
        setData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchMessageCount();

    // Обновлять каждые 5 минут
    const interval = setInterval(fetchMessageCount, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={className}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="size-8">
              <MessageIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Загрузка...</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={className}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="size-8 text-red-500"
            >
              <MessageIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Не удалось загрузить счетчик сообщений
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  const { remainingMessages, maxMessages, usedPercentage } = data;

  // Определяем цвет в зависимости от использования
  let color = 'text-green-500';
  if (usedPercentage > 50) color = 'text-yellow-500';
  if (usedPercentage > 80) color = 'text-red-500';

  return (
    <div className={className}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className={cn(`h-8 flex items-center gap-1.5 px-2.5 ${color}`)}
          >
            <MessageIcon />
            <span className="text-xs font-medium">{remainingMessages}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p>
              Осталось сообщений: <strong>{remainingMessages}</strong> из{' '}
              {maxMessages}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className={`h-2.5 rounded-full ${
                  usedPercentage > 80
                    ? 'bg-red-500'
                    : usedPercentage > 50
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${usedPercentage}%` }}
              />
            </div>
            <p className="text-xs mt-1 text-gray-500">
              Использовано: {usedPercentage}%
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
