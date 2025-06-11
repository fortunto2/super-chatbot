'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useImageGeneration } from '@/hooks/use-image-generation';
import { imageWebsocketStore } from '@/lib/websocket/image-websocket-store';
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
  initialState?: {
    status?: string;
    prompt?: string;
    projectId?: string;
    timestamp?: number;
    message?: string;
    imageUrl?: string;
  };
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

export function ImageEditor({
  chatId: propChatId,
  availableResolutions = [],
  availableStyles = [],
  availableShotSizes = [],
  availableModels = [],
  defaultSettings,
  append,
  initialState,
  setArtifact
}: ImageEditorProps) {

  const params = useParams();
  const paramsChatId = params?.id as string;
  
  // Use prop chatId if provided, otherwise fall back to URL params
  const chatId = propChatId || paramsChatId;

  // Use projectId from initialState for WebSocket connection, fallback to chatId
  const websocketProjectId = initialState?.projectId || chatId;

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  const imageGeneration = useImageGeneration(websocketProjectId);
  const [prompt, setPrompt] = useState(initialState?.prompt || '');
  const [hasInitialized, setHasInitialized] = useState(false);
  const prevChatIdRef = useRef(chatId);
  const shouldLog = useRef(0);
  const sentToChat = useRef<Set<string>>(new Set()); // Track sent images to prevent duplicate sends

  // Remove duplicate WebSocket hook - imageGeneration already handles WebSocket connection
  // const { isConnected, connectionAttempts, maxAttempts, disconnect } = useImageWebsocket({
  //   projectId: websocketProjectId,
  //   eventHandlers: [],
  //   enabled: true,
  // });

  // Single initialization effect
  useEffect(() => {
    if (hasInitialized) return;
    
    console.log('🎨 ImageEditor initializing once with:', {
      propChatId,
      paramsChatId,
      finalChatId: chatId,
      websocketProjectId,
      initialState,
      hasImageGeneration: !!imageGeneration,
      storeDebugInfo: imageWebsocketStore.getDebugInfo()
    });

    // Track initial state if pending/processing
    if (initialState && (initialState.status === 'pending' || initialState.status === 'processing')) {
      console.log('🚀 Starting tracking for initial state');
      if (websocketProjectId) {
        imageGeneration.startTracking(websocketProjectId);
      }
    }
    
    // Log if we already have an image URL
    if (initialState?.imageUrl) {
      console.log('🖼️ Initial state already has image URL:', initialState.imageUrl);
    }

    setHasInitialized(true);
  }, [hasInitialized, chatId, websocketProjectId, initialState, imageGeneration.startTracking]);

  // Force cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 ImageEditor cleanup - force clearing WebSocket store for project:', websocketProjectId);
      
      // Clean up specific project
      if (websocketProjectId) {
        imageWebsocketStore.cleanupProject(websocketProjectId);
      }
      
      // Check for too many handlers and force cleanup if needed
      setTimeout(() => {
        const debugInfo = imageWebsocketStore.getDebugInfo();
        console.log('🧹 Cleanup check - debug info:', debugInfo);
        
        if (debugInfo.totalHandlers > 5 || debugInfo.connectionHandlers > 3) {
          console.log('🧹 Too many handlers detected, force cleanup');
          imageWebsocketStore.forceCleanup();
        }
      }, 100);
    };
  }, [websocketProjectId]);

  // WebSocket connection state logging - minimal
  useEffect(() => {
    console.log('🔗 WebSocket state:', {
      isConnected: imageGeneration.isConnected,
      projectId: websocketProjectId,
      status: imageGeneration.status
    });
  }, [imageGeneration.isConnected, imageGeneration.status]);

  // Send image to chat when generation is completed (with dependency guards)
  useEffect(() => {
    if (imageGeneration.imageUrl && 
        imageGeneration.status === 'completed' && 
        append && 
        prompt &&
        hasInitialized &&
        !sentToChat.current.has(imageGeneration.imageUrl)) {
      
      console.log('📤 Sending generated image to chat');
      
      // Mark this image as sent to prevent duplicates
      sentToChat.current.add(imageGeneration.imageUrl);
      
      // Create attachment for the image
      const imageAttachment = {
        url: imageGeneration.imageUrl,
        name: `generated-image-${Date.now()}.png`,
        contentType: 'image/png' as const,
      };

      // Send message with image attachment
      append({
        role: 'user',
        content: `Generated image: "${prompt}"`,
        experimental_attachments: [imageAttachment],
      });
    }
  }, [imageGeneration.imageUrl, imageGeneration.status, append, prompt, hasInitialized]);

  // Update artifact when image generation is completed (with dependency guards)
  useEffect(() => {
    if (imageGeneration.imageUrl && 
        imageGeneration.status === 'completed' && 
        setArtifact &&
        hasInitialized) {
      
      console.log('🎨 Updating artifact with completed image');
      
      // Avoid infinite loops by checking if artifact is already updated
      setArtifact((prevArtifact: any) => {
        try {
          const currentContent = JSON.parse(prevArtifact.content || '{}');
          
          // Only update if status is not already 'completed' or imageUrl is different
          if (currentContent.status !== 'completed' || currentContent.imageUrl !== imageGeneration.imageUrl) {
            console.log('🎨 Artifact needs update - current status:', currentContent.status, 'new imageUrl:', !!imageGeneration.imageUrl);
            const updatedArtifact = {
              ...prevArtifact,
              content: JSON.stringify({
                ...currentContent,
                status: 'completed',
                imageUrl: imageGeneration.imageUrl,
              }),
            };
            return updatedArtifact;
          }
          
          console.log('🎨 Artifact already up to date, skipping update');
          return prevArtifact;
        } catch (error) {
          console.error('❌ Error updating artifact:', error);
          return prevArtifact;
        }
      });
    }
  }, [imageGeneration.imageUrl, imageGeneration.status, setArtifact, hasInitialized]);

  // Reset state when chatId changes
  useEffect(() => {
    if (prevChatIdRef.current !== chatId) {
      console.log('🎮 ChatId changed from', prevChatIdRef.current, 'to', chatId, '- resetting state');
      prevChatIdRef.current = chatId;
      
      // Clear sent images tracking when chatId changes
      sentToChat.current.clear();
      
      // Reset image generation state when chat changes
      if (chatId && imageGeneration.status !== 'pending') {
        imageGeneration.resetState();
        setPrompt(initialState?.prompt || '');
      }
    }
  }, [chatId, imageGeneration, initialState?.prompt]);

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

  const getStatusIcon = () => {
    if (imageGeneration.isGenerating) return '⏳';
    if (imageGeneration.error) return '❌';
    if (imageGeneration.imageUrl) return '✅';
    return '⚪';
  };

  const getConnectionIcon = () => {
    return imageGeneration.isConnected ? '🟢' : '🔴';
  };

  const getConnectionStatus = () => {
    if (imageGeneration.isGenerating) {
      return imageGeneration.isConnected ? 'Generating...' : 'Connecting...';
    }
    return imageGeneration.isConnected ? 'Connected' : 'Disconnected';
  };


  
  // Simplified debug info
  const debugInfo = {
    chatId,
    websocketProjectId,
    status: imageGeneration.status,
    isConnected: imageGeneration.isConnected,
    hasImage: !!imageGeneration.imageUrl,
    initialized: hasInitialized,
    storeInfo: imageWebsocketStore.getDebugInfo()
  };
  
  if (Date.now() - shouldLog.current > 2000) {
    console.log('🐛 ImageEditor state:', debugInfo);
    shouldLog.current = Date.now();
  }



  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>AI Image Generator</CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <span>{getConnectionIcon()}</span>
            <span className="text-muted-foreground">
              {getConnectionStatus()}
            </span>
          </div>
        </div>
        {/* Enhanced debug info with WebSocket status */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
            <div>Chat ID: {chatId}</div>
            <div>WS Project ID: {websocketProjectId}</div>
            <div>Status: {imageGeneration.status}</div>
            <div>Connected: {imageGeneration.isConnected ? '✅' : '❌'}</div>
            <div>Connection Attempts: {imageGeneration.connectionAttempts}/{imageGeneration.maxAttempts}</div>
            <div>Has Image: {imageGeneration.imageUrl ? '✅' : '❌'}</div>
            {imageGeneration.error && <div>Error: {imageGeneration.error}</div>}
          </div>
        )}
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

        {/* Skeleton for pending/processing with initialState */}
        {initialState && (initialState.status === 'pending' || initialState.status === 'processing') && !imageGeneration.imageUrl && (
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
            {initialState.prompt && (
              <div className="mt-6 text-center max-w-md">
                <div className="text-sm text-muted-foreground mb-2">Generating:</div>
                <div className="text-base italic text-gray-700 bg-gray-50 p-4 rounded-lg border">
                  &ldquo;{initialState.prompt}&rdquo;
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generated Image */}
        {imageGeneration.imageUrl && (
          <div className="space-y-2">
            <Label>Generated Image</Label>
            <div className="relative">
              <img
                src={imageGeneration.imageUrl}
                alt="Generated image"
                className="w-full h-auto rounded-lg border object-contain"
                onError={(e) => {
                  console.error('Image load error:', imageGeneration.imageUrl);
                }}
              />
              {/* Success indicator */}
              <div className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                ✅ Complete
              </div>
            </div>
            
            {/* Generate new image button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => {
                  imageGeneration.resetState();
                  setPrompt('');
                }}
                variant="outline"
                size="sm"
              >
                Generate New Image
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
