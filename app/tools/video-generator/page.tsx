'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { VideoGeneratorForm } from './components/video-generator-form';
import { VideoGallery } from './components/video-gallery';
import { VideoGenerationProgress } from './components/video-generation-progress';
import { useVideoGenerator } from './hooks/use-video-generator';
import { useVideoEffects } from '@/hooks/use-video-effects';

export default function VideoGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // AICODE-NOTE: Initialize chat for video persistence  
  const { messages, setMessages } = useChat({
    id: 'video-generator-tool',
    initialMessages: [],
  });
  
  const {
    generationStatus,
    currentGeneration,
    generatedVideos,
    isGenerating,
    isConnected,
    connectionStatus,
    generateVideo,
    clearCurrentGeneration,
    deleteVideo,
    clearAllVideos,
    downloadVideo,
    copyVideoUrl,
  } = useVideoGenerator();

  // AICODE-NOTE: Video effects hook for auto-saving and side effects management
  useVideoEffects({
    videoUrl: currentGeneration?.url,
    status: generationStatus.status,
    prompt,
    hasInitialized,
    chatId: 'video-generator-tool',
    resetState: () => {
      setPrompt('');
      setHasInitialized(false);
    },
    setPrompt,
    setMessages, // ✅ Now passing setMessages for chat persistence
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">AI Video Generator</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Generate high-quality videos using advanced AI models from SuperDuperAI. 
          Create professional videos from text descriptions with models like VEO3, KLING, LTX, and more.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Form */}
        <div className="space-y-4">
          <VideoGeneratorForm
            onGenerate={(formData) => {
              setPrompt(formData.prompt);
              setHasInitialized(true);
              generateVideo(formData);
            }}
            isGenerating={isGenerating}
          />
          
          {/* Progress Indicator */}
          {(isGenerating || generationStatus.status !== 'idle') && (
            <VideoGenerationProgress
              generationStatus={generationStatus}
              prompt={prompt}
            />
          )}
          
          {/* Connection Status */}
          {isGenerating && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm">
                <div className={`size-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <span className="text-blue-800">
                  SSE Connection: {connectionStatus}
                  {isConnected && ' ✓'}
                </span>
              </div>
            </div>
          )}
          

        </div>

        {/* Right Column: Gallery */}
        <div>
          <VideoGallery
            videos={generatedVideos}
            currentGeneration={currentGeneration}
            onDeleteVideo={deleteVideo}
            onClearAll={clearAllVideos}
            onDownloadVideo={downloadVideo}
            onCopyVideoUrl={copyVideoUrl}
          />
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-muted/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Video Generation Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">📝 Writing Good Prompts</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Be specific and descriptive</li>
              <li>• Include camera movements and shots</li>
              <li>• Describe lighting and mood</li>
              <li>• Mention style (cinematic, realistic, etc.)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">⚙️ Settings Guide</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Higher FPS = smoother motion</li>
              <li>• Duration: 1-30 seconds</li>
              <li>• Use same seed for consistency</li>
              <li>• Different models have different strengths</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 