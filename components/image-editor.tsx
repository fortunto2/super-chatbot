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
import { toast } from 'sonner';

interface ImageEditorProps {
  chatId?: string; 
  append?: UseChatHelpers['append']; 
  setMessages?: UseChatHelpers['setMessages'];
  initialState?: ImageState;
  setArtifact?: (fn: (prev: any) => any) => void;
  parsedContent?: any;
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

function GenerationSkeleton({ 
  prompt, 
  onForceCheck, 
  isChecking 
}: { 
  prompt?: string;
  onForceCheck?: () => void;
  isChecking?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative max-w-full max-h-[70vh] overflow-hidden rounded-lg border bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full h-80 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] -skew-x-12" />
          
          <div className="text-center space-y-4 z-10 relative">
            <div className="size-16 mx-auto bg-white/50 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl">🎨</span>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-white/40 rounded animate-pulse w-32 mx-auto" />
              <div className="h-2 bg-white/30 rounded animate-pulse w-24 mx-auto" />
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
      
      {onForceCheck && (
        <div className="mt-4 text-center">
          <Button
            onClick={onForceCheck}
            variant="outline"
            size="sm"
            disabled={isChecking}
            className="text-xs"
          >
            {isChecking ? 'Checking...' : 'Check for results'}
          </Button>
        </div>
      )}
    </div>
  );
}

function ImageDisplay({ 
  imageUrl, 
  prompt, 
  onCopyUrl, 
  onGenerateNew,
  apiPayload
}: {
  imageUrl: string;
  prompt?: string;
  onCopyUrl: () => void;
  onGenerateNew: () => void;
  apiPayload?: any;
}) {
  const [showApiConfig, setShowApiConfig] = useState(false);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Generated Image</h3>
        <button
          type="button"
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
      
      {/* Debug Parameters Display */}
      {apiPayload && (
        <div className="mt-4 border-t pt-4">
          <button
            onClick={() => setShowApiConfig(!showApiConfig)}
            className="flex items-center gap-2 text-sm font-medium mb-3 hover:text-gray-700 transition-colors w-full"
          >
            <span className={`transform transition-transform ${showApiConfig ? 'rotate-90' : ''}`}>
              ▶
            </span>
            Debug: Generation Parameters
          </button>
          
          {showApiConfig && (
            <div className="mt-2 space-y-3">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs font-mono text-gray-700 dark:text-gray-300">
                  {JSON.stringify(apiPayload, null, 2)}
                </pre>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(apiPayload, null, 2));
                    toast.success('Parameters copied to clipboard');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  📋 Copy Parameters
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Generate New button - always show at the bottom */}
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
  setArtifact,
  parsedContent
}: ImageEditorProps) {
  const params = useParams();
  const chatId = propChatId || (params?.id as string);
  
  // Use projectId from initialState if available (artifact mode), otherwise use chatId
  const effectiveProjectId = initialState?.projectId || chatId;
  const imageGeneration = useImageGeneration(effectiveProjectId);
  const [prompt, setPrompt] = useState(initialState?.prompt || '');
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isForceChecking, setIsForceChecking] = useState(false);

  // Initialize component state and tracking
  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
      
      // If we have initialState with projectId and it's processing, start tracking
      if (initialState?.projectId && (initialState.status === 'processing' || initialState.status === 'pending')) {
        console.log('🎯 Starting tracking for artifact project:', initialState.projectId, 'requestId:', initialState.requestId);
        imageGeneration.startTracking(initialState.projectId, initialState.requestId);
      }
    }
  }, [hasInitialized, initialState?.projectId, initialState?.status, initialState?.requestId, imageGeneration]);

  // Debug initialState changes to track when it gets updated
  useEffect(() => {
    console.log('🎯 ImageEditor: initialState updated', {
      projectId: initialState?.projectId || 'none',
      status: initialState?.status || 'none',
      imageUrl: initialState?.imageUrl ? `${initialState.imageUrl.substring(0, 50)}...` : 'none',
      timestamp: initialState?.timestamp || 'none'
    });
  }, [initialState]);

  // Determine what to display - prioritize initialState in artifact mode
  const isArtifactMode = !!initialState?.projectId;

  // Handle image effects - use initialState data in artifact mode
  const effectiveImageUrlForEffects = isArtifactMode ? initialState?.imageUrl : imageGeneration.imageUrl;
  const effectiveStatusForEffects = isArtifactMode ? initialState?.status : imageGeneration.status;
  
  useImageEffects({
    imageUrl: effectiveImageUrlForEffects,
    status: effectiveStatusForEffects || '',
    append,
    prompt: prompt || initialState?.prompt || '',
    hasInitialized,
    setArtifact,
    chatId,
    resetState: imageGeneration.resetState,
    setPrompt,
    initialPrompt: initialState?.prompt,
    setMessages
  });

  // Get connection status - prioritize SSE over WebSocket
  const getConnectionStatus = (): boolean => {
    // If we have initialState with projectId, we're in artifact mode - use SSE status
    if (initialState?.projectId) {
      // Check global artifact SSE connections
      if (typeof window !== 'undefined') {
        const globalWindow = window as any;
        if (globalWindow.artifactSSEStatus?.[initialState.projectId]) {
          return globalWindow.artifactSSEStatus[initialState.projectId];
        }
      }
      // Fallback: assume connected if we have projectId and it's processing/pending
      return initialState.status === 'processing' || initialState.status === 'pending';
    }
    
    // Fallback to imageGeneration connection status for standalone usage
    return imageGeneration.isConnected;
  };

  const isConnected = getConnectionStatus();
  const effectiveImageUrl = isArtifactMode ? initialState?.imageUrl : imageGeneration.imageUrl;
  const showSkeleton = shouldShowSkeleton(initialState, effectiveImageUrl, initialState?.imageUrl);
  const showImage = shouldShowImage(effectiveImageUrl, initialState?.imageUrl);
  const displayImageUrl = getDisplayImageUrl(effectiveImageUrl, initialState?.imageUrl);
  const displayPrompt = getDisplayPrompt(prompt, initialState?.prompt);

  // Debug display logic to understand why image is not showing
  useEffect(() => {
    console.log('🎯 ImageEditor display state:', {
      projectId: initialState?.projectId || 'none',
      isArtifactMode,
      initialStatus: initialState?.status || 'none',
      initialImageUrl: initialState?.imageUrl ? `${initialState.imageUrl.substring(0, 50)}...` : 'none',
      liveImageUrl: imageGeneration.imageUrl ? `${imageGeneration.imageUrl.substring(0, 50)}...` : 'none',
      effectiveImageUrl: effectiveImageUrl ? `${effectiveImageUrl.substring(0, 50)}...` : 'none',
      showSkeleton,
      showImage,
      displayImageUrl: displayImageUrl ? `${displayImageUrl.substring(0, 50)}...` : 'none'
    });
  }, [initialState?.status, initialState?.imageUrl, imageGeneration.imageUrl, effectiveImageUrl, showSkeleton, showImage, displayImageUrl, initialState?.projectId, isArtifactMode]);
  
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

  const handleCopyUrl = () => {
    if (displayImageUrl) {
      copyImageUrlToClipboard(displayImageUrl);
    }
  };

  const handleGenerateNew = () => {
    imageGeneration.resetState();
    setPrompt('');
  };

  const handleForceCheck = async () => {
    setIsForceChecking(true);
    try {
      // Use projectId from initialState if available (artifact mode), otherwise from imageGeneration
      const projectId = initialState?.projectId || imageGeneration.projectId;
      
      if (!projectId) {
        console.warn('⚠️ No active project to check');
        return;
      }
      
      console.log('🔍 Force checking results for project:', projectId);
      
      // Use the same logic as imageGeneration.forceCheckResults but with projectId from initialState
      const response = await fetch(`/api/project/${projectId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const project = await response.json();
      console.log('🔍 Project check result:', {
        id: project.id,
        tasksCount: project.tasks?.length || 0,
        dataCount: project.data?.length || 0,
        taskStatuses: project.tasks?.map((t: any) => t.status) || []
      });
      
      // Look for image data in project.data
      const imageData = project.data?.find((data: any) => {
        if (data.value && typeof data.value === 'object') {
          const value = data.value as Record<string, any>;
          const hasUrl = !!value.url;
          const isImage = value.url?.match(/\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i);
          
          return hasUrl && isImage;
        }
        return false;
      });
      
      if (imageData?.value && typeof imageData.value === 'object') {
        const imageUrl = (imageData.value as Record<string, any>).url as string;
        console.log('🔍 ✅ Image found manually:', imageUrl);
        
        // Update artifact content if in artifact mode
        if (initialState?.projectId && setArtifact) {
          setArtifact((prev: any) => {
            try {
              const currentContent = JSON.parse(prev.content || '{}');
              const updatedContent = {
                ...currentContent,
                status: 'completed',
                imageUrl,
                progress: 100
              };
              return {
                ...prev,
                content: JSON.stringify(updatedContent)
              };
            } catch (error) {
              console.error('🔍 ❌ Failed to update artifact content:', error);
              return prev;
            }
          });
                 } else {
           // For standalone mode, we can't directly update the state
           // The user can see the result in the console and try SSE again
           console.log('🔍 ✅ Image found in standalone mode - refresh page or wait for SSE');
         }
        return;
      }
      
      // Handle file_id case
      const fileIdData = project.data?.find((data: any) => {
        return data.value && typeof data.value === 'object' && (data.value as any).file_id;
      });
      
      if (fileIdData?.value && typeof fileIdData.value === 'object') {
        const fileId = (fileIdData.value as Record<string, any>).file_id as string;
        console.log('🔍 Found file_id manually, resolving:', fileId);
        
        const { FileService, FileTypeEnum } = await import('@/lib/api');
        const fileResponse = await FileService.fileGetById({ id: fileId });
        
        if (fileResponse?.url && fileResponse.type === FileTypeEnum.IMAGE) {
          console.log('🔍 ✅ File ID resolved to image URL manually:', fileResponse.url);
          
          // Update artifact content if in artifact mode
          if (initialState?.projectId && setArtifact) {
            setArtifact((prev: any) => {
              try {
                const currentContent = JSON.parse(prev.content || '{}');
                const updatedContent = {
                  ...currentContent,
                  status: 'completed',
                  imageUrl: fileResponse.url,
                  progress: 100
                };
                return {
                  ...prev,
                  content: JSON.stringify(updatedContent)
                };
              } catch (error) {
                console.error('🔍 ❌ Failed to update artifact content with file_id:', error);
                return prev;
              }
            });
                     } else {
             // For standalone mode, we can't directly update the state
             // The user can see the result in the console and try SSE again
             console.log('🔍 ✅ File ID resolved in standalone mode - refresh page or wait for SSE');
           }
          return;
        }
      }
      
             console.log('🔍 ⚠️ No image data found');
       
     } catch (error) {
       console.error('🔍 ❌ Force check failed:', error);
     } finally {
       setIsForceChecking(false);
     }
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
          <GenerationSkeleton 
            prompt={initialState?.prompt} 
            onForceCheck={imageGeneration.isGenerating ? handleForceCheck : undefined}
            isChecking={isForceChecking}
          />
        )}

        {showImage && displayImageUrl && (
          <ImageDisplay
            imageUrl={displayImageUrl}
            prompt={displayPrompt}
            onCopyUrl={handleCopyUrl}
            onGenerateNew={handleGenerateNew}
            apiPayload={parsedContent} // Pass parsed content for debug display
          />
        )}
      </CardContent>
    </Card>
  );
}
