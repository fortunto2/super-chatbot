'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyIcon } from '@/components/icons';
import { useImageGeneration } from '@/hooks/use-image-generation';
import { useImageEffects } from '@/hooks/use-image-effects';
import { 
  copyImageUrlToClipboard,
  shouldShowSkeleton,
  shouldShowImage,
  getDisplayImageUrl,
  getDisplayPrompt,
  type ImageState
} from '@/lib/utils/image-utils';
import type { UseChatHelpers } from '@ai-sdk/react';

interface ImageEditorProps {
  chatId?: string; 
  append?: UseChatHelpers['append']; 
  setMessages?: UseChatHelpers['setMessages'];
  initialState?: ImageState;
  setArtifact?: (fn: (prev: any) => any) => void;
}

function ImageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="size-4 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="h-64 w-full bg-gray-200 rounded-lg animate-pulse" />
      <div className="flex gap-2">
        <div className="h-2 flex-1 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function GenerationSkeleton({ prompt }: { prompt?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative max-w-full max-h-[70vh] overflow-hidden rounded-lg border bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full h-80 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] transform -skew-x-12"></div>
          
          <div className="text-center space-y-4 z-10 relative">
            <div className="size-16 mx-auto bg-white/50 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl">🎨</span>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-white/40 rounded animate-pulse w-32 mx-auto"></div>
              <div className="h-2 bg-white/30 rounded animate-pulse w-24 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
      
      {prompt && (
        <div className="mt-6 text-center max-w-md">
          <div className="text-sm text-muted-foreground mb-2">Generating:</div>
          <div className="text-base italic text-gray-700 bg-gray-50 p-4 rounded-lg border">
            &ldquo;{prompt}&rdquo;
          </div>
        </div>
      )}
    </div>
  );
}

function ImageDisplay({ 
  imageUrl, 
  prompt, 
  onCopyUrl, 
  onGenerateNew
}: {
  imageUrl: string;
  prompt?: string;
  onCopyUrl: () => void;
  onGenerateNew: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Generated Image</h3>
        <button
          onClick={onCopyUrl}
          className="p-1 hover:bg-gray-100 rounded"
          title="Copy image URL"
        >
          <CopyIcon size={16} />
        </button>
      </div>
      <div className="relative">
        {/*eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`Generated image: ${prompt || 'AI generated'}`}
          className="w-full h-auto rounded-lg border object-contain"
          style={{ maxHeight: '70vh' }}
        />
        <div className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
          ✅ Complete
        </div>
      </div>
      
      {prompt && (
        <div className="text-sm text-muted-foreground text-center italic">
          &ldquo;{prompt}&rdquo;
        </div>
      )}
      
      <div className="flex justify-center pt-4">
        <Button
          onClick={onGenerateNew}
          variant="outline"
          size="sm"
        >
          Generate New Image
        </Button>
      </div>
    </div>
  );
}

function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span>{isConnected ? '🟢' : '🔴'}</span>
      <span className="text-muted-foreground">
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
}

export function ImageEditor({
  chatId: propChatId,
  append,
  setMessages,
  initialState,
  setArtifact
}: ImageEditorProps) {
  const params = useParams();
  const chatId = propChatId || (params?.id as string);
  
  const imageGeneration = useImageGeneration(undefined);
  const [prompt, setPrompt] = useState(initialState?.prompt || '');
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize component state
  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
    }
  }, [hasInitialized]);

  // Handle image effects
  useImageEffects({
    imageUrl: imageGeneration.imageUrl,
    status: imageGeneration.status,
    append,
    prompt,
    hasInitialized,
    setArtifact,
    chatId,
    resetState: imageGeneration.resetState,
    setPrompt,
    initialPrompt: initialState?.prompt,
    setMessages
  });

  // Get global WebSocket connection status
  const getGlobalConnectionStatus = (): boolean => {
    if (typeof window !== 'undefined') {
      const globalWindow = window as any;
      const chatInstance = globalWindow.chatWebSocketInstance;
      if (chatInstance) {
        const websocketProjectId = initialState?.projectId || chatId;
        if (websocketProjectId && chatInstance.isConnectedToProject) {
          return chatInstance.isConnectedToProject(websocketProjectId);
        }
        return chatInstance.isConnected || false;
      }
    }
    return false;
  };

  const isConnected = getGlobalConnectionStatus();
  
  // Show loading skeleton if no chatId
  if (!chatId) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Loading Image Editor...</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageSkeleton />
        </CardContent>
      </Card>
    );
  }

  // Determine what to display
  const showSkeleton = shouldShowSkeleton(initialState, imageGeneration.imageUrl, initialState?.imageUrl);
  const showImage = shouldShowImage(imageGeneration.imageUrl, initialState?.imageUrl);
  const displayImageUrl = getDisplayImageUrl(imageGeneration.imageUrl, initialState?.imageUrl);
  const displayPrompt = getDisplayPrompt(prompt, initialState?.prompt);

  const handleCopyUrl = () => {
    if (displayImageUrl) {
      copyImageUrlToClipboard(displayImageUrl);
    }
  };

  const handleGenerateNew = () => {
    imageGeneration.resetState();
    setPrompt('');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>AI Image Generator</CardTitle>
          <ConnectionStatus isConnected={isConnected} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {imageGeneration.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800 text-sm">
              {imageGeneration.error}
            </div>
          </div>
        )}

        {showSkeleton && (
          <GenerationSkeleton prompt={initialState?.prompt} />
        )}

        {showImage && displayImageUrl && (
          <ImageDisplay
            imageUrl={displayImageUrl}
            prompt={displayPrompt}
            onCopyUrl={handleCopyUrl}
            onGenerateNew={handleGenerateNew}
          />
        )}
      </CardContent>
    </Card>
  );
}
