'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CreditCard, Coins, Zap } from 'lucide-react';

interface ToolsBalanceData {
  balance: number;
  status: {
    balance: number;
    isLow: boolean;
    isEmpty: boolean;
    displayColor: 'green' | 'yellow' | 'red';
  };
  userType: string;
  userId: string;
}

interface ToolsBalanceProps {
  className?: string;
  variant?: 'compact' | 'detailed' | 'header';
  showLabel?: boolean;
}

export function ToolsBalance({ 
  className, 
  variant = 'compact',
  showLabel = true 
}: ToolsBalanceProps) {
  const [data, setData] = useState<ToolsBalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      try {
        setLoading(true);
        const response = await fetch('/api/tools-balance');

        if (!response.ok) {
          throw new Error('Failed to fetch tools balance');
        }

        const data = await response.json();
        setData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchBalance();

    // Обновлять каждые 30 секунд
    const interval = setInterval(fetchBalance, 30 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={className}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Coins className="size-4" />
              {showLabel && variant !== 'compact' && (
                <span className="ml-1 animate-pulse">Loading...</span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Loading balance...</TooltipContent>
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
              size="sm"
              className="h-8 text-red-500"
            >
              <Coins className="size-4" />
              {showLabel && variant !== 'compact' && (
                <span className="ml-1">Error</span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Failed to load tools balance
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  const { balance, status, userType } = data;
  const { displayColor, isLow, isEmpty } = status;

  // Color mapping for dark theme
  const colorClasses = {
    green: 'text-green-400 border-input bg-green-950/50 dark:text-green-400 dark:border-input dark:bg-green-950/50',
    yellow: 'text-yellow-400 border-yellow-800 bg-yellow-950/50 dark:text-yellow-400 dark:border-yellow-800 dark:bg-yellow-950/50', 
    red: 'text-red-400 border-red-800 bg-red-950/50 dark:text-red-400 dark:border-red-800 dark:bg-red-950/50',
  };

  const iconColorClasses = {
    green: 'text-green-400 dark:text-green-400',
    yellow: 'text-yellow-400 dark:text-yellow-400',
    red: 'text-red-400 dark:text-red-400',
  };

  // Render different variants
  if (variant === 'header') {
    return (
      <div className={className}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                `h-8 flex items-center gap-1.5 px-2.5`,
                colorClasses[displayColor]
              )}
            >
              <Coins className={cn("size-4", iconColorClasses[displayColor])} />
              <span className="text-xs font-medium">{balance}</span>
              {showLabel && <span className="text-xs">credits</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p>
                <strong>Tools Balance:</strong> {balance} credits
              </p>
              <div className="mt-2">
                <Badge 
                  variant={isEmpty ? 'destructive' : isLow ? 'secondary' : 'default'}
                  className="text-xs"
                >
                  {isEmpty ? 'Empty' : isLow ? 'Low Balance' : 'Good Balance'}
                </Badge>
              </div>
              <p className="text-xs mt-1 text-gray-500">
                User type: {userType}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className={cn("size-5", iconColorClasses[displayColor])} />
            <span className="font-medium">Tools Balance</span>
          </div>
          <Badge 
            variant={isEmpty ? 'destructive' : isLow ? 'secondary' : 'default'}
          >
            {isEmpty ? 'Empty' : isLow ? 'Low' : 'Good'}
          </Badge>
        </div>
        
        <div className="text-2xl font-bold flex items-baseline gap-1">
          <span className={iconColorClasses[displayColor]}>{balance}</span>
          <span className="text-sm font-normal text-muted-foreground">credits</span>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p>Use credits to generate images, videos, and scripts</p>
          {isLow && !isEmpty && (
            <p className="text-yellow-600 mt-1">⚠️ Balance is running low</p>
          )}
          {isEmpty && (
            <p className="text-red-600 mt-1">❌ Insufficient balance for tools</p>
          )}
        </div>
      </div>
    );
  }

  // Compact variant (default)
  return (
    <div className={className}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 flex items-center gap-1.5 px-2.5",
              colorClasses[displayColor]
            )}
          >
            <Coins className={cn("size-4", iconColorClasses[displayColor] )} />
            <span className="text-xs font-medium">{balance}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p>
              <strong>Tools Balance:</strong> {balance} credits
            </p>
            <div className="text-xs mt-1 space-y-1">
              <p>• Image generation: 2-6 credits</p>
              <p>• Video generation: 7.5-90 credits</p>
              <p>• Script generation: 1-2 credits</p>
            </div>
            {isLow && !isEmpty && (
              <p className="text-yellow-600 text-xs mt-2">⚠️ Balance is low</p>
            )}
            {isEmpty && (
              <p className="text-red-600 text-xs mt-2">❌ Insufficient balance</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

/**
 * Pricing display component for tools
 */
interface ToolsPricingProps {
  className?: string;
}

export function ToolsPricing({ className }: ToolsPricingProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="text-center">
        <h3 className="font-semibold text-lg flex items-center justify-center gap-2">
          <Zap className="size-5 text-blue-500" />
          Tools Pricing
        </h3>
        <p className="text-sm text-muted-foreground">Credit costs for AI tools</p>
      </div>
      
      <div className="grid gap-2 text-sm">
        {/* Image Generation */}
        <div className="flex items-center justify-between p-2 rounded bg-blue-950/30 border border-blue-800/50">
          <span className="font-medium text-blue-300">🖼️ Image Generation</span>
          <span className="text-blue-400 font-medium">2-6 credits</span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground ml-4">
          <span>• Text to image: 2 credits</span>
          <span>• Image to image: 3 credits</span>
          <span>• High quality: +50%</span>
          <span>• Ultra quality: +100%</span>
        </div>

        {/* Video Generation */}
        <div className="flex items-center justify-between p-2 rounded bg-purple-950/30 border border-purple-800/50">
          <span className="font-medium text-purple-300">🎬 Video Generation</span>
          <span className="text-purple-400 font-medium">7.5-90 credits</span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground ml-4">
          <span>• 5s video: 7.5 credits</span>
          <span>• 10s video: 15 credits</span>
          <span>• Image-to-video: +50%</span>
          <span>• 4K quality: +100%</span>
        </div>

        {/* Script Generation */}
        <div className="flex items-center justify-between p-2 rounded bg-green-950/30 border border-green-800/50">
          <span className="font-medium text-green-300">📝 Script Generation</span>
          <span className="text-green-400 font-medium">1-2 credits</span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground ml-4">
          <span>• Basic script: 1 credit</span>
          <span>• Long script: 2 credits</span>
        </div>

        {/* Prompt Enhancement */}
        <div className="flex items-center justify-between p-2 rounded bg-orange-950/30 border border-orange-800/50">
          <span className="font-medium text-orange-300">✨ Prompt Enhancement</span>
          <span className="text-orange-400 font-medium">1-2 credits</span>
        </div>
      </div>
    </div>
  );
} 