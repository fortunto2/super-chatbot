'use client';

import { VideoGeneratorForm } from './components/video-generator-form';
import { VideoGallery } from './components/video-gallery';
import { GenerationProgress } from '../image-generator/components/generation-progress'; // Reuse from image generator
import { useVideoGenerator } from './hooks/use-video-generator';

export default function VideoGeneratorPage() {
  const {
    generationStatus,
    currentGeneration,
    generatedVideos,
    isGenerating,
    generateVideo,
    clearCurrentGeneration,
    deleteVideo,
    clearAllVideos,
    forceCheckResults,
    downloadVideo,
    copyVideoUrl,
  } = useVideoGenerator();

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
            onGenerate={generateVideo}
            isGenerating={isGenerating}
          />
          
          {/* Progress Indicator */}
          {(isGenerating || generationStatus.status !== 'idle') && (
            <GenerationProgress
              generationStatus={generationStatus}
            />
          )}
          
          {/* Manual Check Button */}
          {generationStatus.projectId && generationStatus.status === 'processing' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-3">
                Video generation is in progress. If results don&apos;t appear automatically, you can check manually:
              </p>
              <button
                onClick={forceCheckResults}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Check for Results
              </button>
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