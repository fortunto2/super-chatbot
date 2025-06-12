'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyIcon } from '@/components/icons';
import { useImageGeneration } from '@/hooks/use-image-generation';
import { useImageEffects } from '@/hooks/use-image-effects';
import { 
  getStatusIcon, 
  getConnectionIcon, 
  getConnectionStatus,
  copyImageUrlToClipboard,
  shouldShowSkeleton,
  shouldShowImage,
  getDisplayImageUrl,
  getDisplayPrompt,
  type ImageState
} from '@/lib/utils/image-utils';
import type { MediaResolution, MediaOption, ImageModel } from '@/lib/types/media-settings';
import type { UseChatHelpers } from '@ai-sdk/react';


interface ImageEditorProps {
  chatId?: string; 
  availableResolutions?: MediaResolution[];
  availableStyles?: MediaOption[];
  availableShotSizes?: MediaOption[];
  availableModels?: ImageModel[];
  defaultSettings?: {
    resolution: MediaResolution;
    style: MediaOption;
    shotSize: MediaOption;
    model: ImageModel;
    seed?: number;
  };
  append?: UseChatHelpers['append']; 
  setMessages?: UseChatHelpers['setMessages'];
  initialState?: ImageState;
  setArtifact?: (fn: (prev: any) => any) => void;
}

// Separate components for better organization
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

function ImageDebugInfo({ 
  chatId, 
  websocketProjectId, 
  status, 
  isConnected, 
  connectionAttempts, 
  maxAttempts, 
  hasImage, 
  error 
}: {
  chatId: string;
  websocketProjectId: string;
  status: string;
  isConnected: boolean;
  connectionAttempts: number;
  maxAttempts: number;
  hasImage: boolean;
  error?: string;
}) {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
      <div>Chat ID: {chatId}</div>
      <div>WS Project ID: {websocketProjectId}</div>
      <div>Status: {status}</div>
      <div>Connected: {isConnected ? '✅' : '❌'}</div>
      <div>Connection Attempts: {connectionAttempts}/{maxAttempts}</div>
      <div>Has Image: {hasImage ? '✅' : '❌'}</div>
      {error && <div>Error: {error}</div>}
    </div>
  );
}

function GenerationSkeleton({ prompt }: { prompt?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative max-w-full max-h-[70vh] overflow-hidden rounded-lg border bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Skeleton Image Placeholder */}
        <div className="w-full h-80 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center relative overflow-hidden">
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] transform -skew-x-12"></div>
          
          {/* Placeholder content */}
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
      
      {/* Prompt display */}
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
        <img
          src={imageUrl}
          alt={`Generated image: ${prompt || 'AI generated'}`}
          className="w-full h-auto rounded-lg border object-contain"
          style={{ maxHeight: '70vh' }}
          onError={(e) => {
            console.error('🎨 Image load error:', imageUrl);
          }}
        />
        {/* Success indicator */}
        <div className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
          ✅ Complete
        </div>
      </div>
      
      {/* Show prompt */}
      {prompt && (
        <div className="text-sm text-muted-foreground text-center italic">
          &ldquo;{prompt}&rdquo;
        </div>
      )}
      
      {/* Generate new image button */}
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

export function ImageEditor({
  chatId: propChatId,
  availableResolutions = [],
  availableStyles = [],
  availableShotSizes = [],
  availableModels = [],
  defaultSettings,
  append,
  setMessages,
  initialState,
  setArtifact
}: ImageEditorProps) {

  const params = useParams();
  const paramsChatId = params?.id as string;
  
  // Use prop chatId if provided, otherwise fall back to URL params
  const chatId = propChatId || paramsChatId;

  // Use projectId from initialState for WebSocket connection, fallback to chatId
  const websocketProjectId = initialState?.projectId || chatId;

  // Refs for stable references and avoiding stale closures
  const chatIdRef = useRef<string>(chatId);
  const isInitializedRef = useRef(false);
  const isMountedRef = useRef(true); // Track if component is actually mounted
  const shouldLog = useRef(0);

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  // Disable WebSocket in image generation hook since chat handles it globally
  const imageGeneration = useImageGeneration(undefined); // Pass undefined to disable WebSocket
  const [prompt, setPrompt] = useState(initialState?.prompt || '');
  const [hasInitialized, setHasInitialized] = useState(false);

  // Track initialState changes to update UI when image arrives
  useEffect(() => {
    if (initialState?.imageUrl && initialState.status === 'completed') {
      console.log('🎨 ImageEditor: Initial state updated with completed image:', initialState.imageUrl);
    }
  }, [initialState?.imageUrl, initialState?.status]);
  
  // Use our custom effects hook for better organization
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


  useEffect(() => {
    if (hasInitialized) return;
    
    // Since WebSocket is handled globally by chat, we only need to set local state
    if (initialState) {
      console.log('🎨 ImageEditor: Setting initial state from props:', initialState);
      
      // For completed images, we don't need to do anything special
      // The chat WebSocket will handle updates automatically
      if (initialState.status === 'completed' && initialState.imageUrl) {
        console.log('🎨 ImageEditor: Image already completed, using initial state');
      }
    }
    
    setHasInitialized(true);
  }, [hasInitialized, chatId, initialState]);

  // No WebSocket cleanup needed - handled by chat-level WebSocket
  // Force cleanup on unmount - only for real unmount, not React Strict Mode  
  useEffect(() => {
    return () => {
      // No WebSocket cleanup needed since we're not managing WebSocket at this level
      console.log('🎨 ImageEditor: Component unmounting');
    };
  }, []);

  // Update refs when values change
  useEffect(() => {
    chatIdRef.current = chatId;
  }, [chatId]);

  // Track component mount/unmount state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Early return with skeleton if no chatId (AFTER all hooks)
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

  // Get global WebSocket connection status
  const getGlobalConnectionStatus = () => {
    if (typeof window !== 'undefined') {
      const globalWindow = window as any;
      const chatInstance = globalWindow.chatWebSocketInstance;
      if (chatInstance) {
        // Check if connected to the specific project
        if (websocketProjectId && chatInstance.isConnectedToProject) {
          return chatInstance.isConnectedToProject(websocketProjectId);
        }
        // Fallback to general connection status
        return chatInstance.isConnected || false;
      }
    }
    return false;
  };

  const globalConnectionStatus = getGlobalConnectionStatus();
  
  // Use utility functions for better organization
  const statusIcon = getStatusIcon(imageGeneration.isGenerating, imageGeneration.error, imageGeneration.imageUrl);
  const connectionIcon = getConnectionIcon(globalConnectionStatus);
  const connectionStatus = getConnectionStatus(imageGeneration.isGenerating, globalConnectionStatus);


  
  // Simplified debug info (no WebSocket store info since it's handled at chat level)
  const debugInfo = {
    chatId,
    websocketProjectId,
    status: imageGeneration.status,
    isConnected: globalConnectionStatus,
    hasImage: !!(imageGeneration.imageUrl || initialState?.imageUrl),
    initialized: hasInitialized,
    websocketLevel: 'chat-managed' // Indicate WebSocket is managed at chat level
  };
  
  if (Date.now() - shouldLog.current > 2000) {
    shouldLog.current = Date.now();
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>AI Image Generator</CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <span>{connectionIcon}</span>
            <span className="text-muted-foreground">
              {connectionStatus}
            </span>
          </div>
        </div>
        <ImageDebugInfo
          chatId={chatId}
          websocketProjectId={websocketProjectId}
          status={imageGeneration.status}
          isConnected={globalConnectionStatus}
          connectionAttempts={imageGeneration.connectionAttempts}
          maxAttempts={imageGeneration.maxAttempts}
          hasImage={shouldShowImage(imageGeneration.imageUrl, initialState?.imageUrl)}
          error={imageGeneration.error}
        />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Messages */}
        {imageGeneration.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800 text-sm">
              {imageGeneration.error}
            </div>
          </div>
        )}

        {/* Debug what we're showing */}
        {(() => {
          const showSkeleton = shouldShowSkeleton(initialState, imageGeneration.imageUrl, initialState?.imageUrl);
          const showImage = shouldShowImage(imageGeneration.imageUrl, initialState?.imageUrl);
          
          console.log('🎨 ImageEditor: Display decision:', {
            showSkeleton,
            showImage,
            'initialState?.status': initialState?.status,
            'initialState?.imageUrl': !!initialState?.imageUrl,
            'imageGeneration.imageUrl': !!imageGeneration.imageUrl,
            imageUrlPreview: initialState?.imageUrl?.substring(0, 50) + '...' || 'none'
          });
          
          return null;
        })()}

        {/* Generation skeleton */}
        {shouldShowSkeleton(initialState, imageGeneration.imageUrl, initialState?.imageUrl) && (
          <GenerationSkeleton prompt={initialState?.prompt} />
        )}

        {/* Generated Image Display */}
        {shouldShowImage(imageGeneration.imageUrl, initialState?.imageUrl) && (
          <ImageDisplay
            imageUrl={getDisplayImageUrl(imageGeneration.imageUrl, initialState?.imageUrl)!}
            prompt={getDisplayPrompt(prompt, initialState?.prompt)}
            onCopyUrl={() => {
              const imageUrl = getDisplayImageUrl(imageGeneration.imageUrl, initialState?.imageUrl);
              if (imageUrl) {
                copyImageUrlToClipboard(imageUrl);
              }
            }}
            onGenerateNew={() => {
              imageGeneration.resetState();
              setPrompt('');
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
