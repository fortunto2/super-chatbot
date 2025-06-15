'use client';

import { Suspense } from 'react';
import { ImageGeneratorForm } from './components/image-generator-form';
import { GenerationProgress } from './components/generation-progress';
import { ImageGallery } from './components/image-gallery';
import { useImageGenerator } from './hooks/use-image-generator';
import { Separator } from '@/components/ui/separator';
import { ImageIcon, Sparkles, Zap } from 'lucide-react';

// AICODE-NOTE: Main page component for standalone image generator tool
export default function ImageGeneratorPage() {
  const {
    generationStatus,
    currentGeneration,
    generatedImages,
    isGenerating,
    generateImage,
    clearCurrentGeneration,
    deleteImage,
    clearAllImages,
    downloadImage,
    copyImageUrl,
  } = useImageGenerator();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <div className="p-3 rounded-full bg-blue-100">
            <ImageIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Image Generator
          </h1>
        </div>
        
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Create stunning images using advanced AI models like FLUX Pro/Dev, Google Imagen, and more.
          Simply describe what you want to see and let AI bring your ideas to life.
        </p>

        {/* Feature highlights */}
        <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4" />
            <span>High Quality Models</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Real-time Progress</span>
          </div>
          <div className="flex items-center space-x-2">
            <ImageIcon className="h-4 w-4" />
            <span>Multiple Formats</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Form and Progress */}
        <div className="lg:col-span-1 space-y-6">
          <Suspense fallback={<div>Loading form...</div>}>
            <ImageGeneratorForm
              onGenerate={generateImage}
              isGenerating={isGenerating}
            />
          </Suspense>

          {/* Progress indicator */}
          <GenerationProgress
            generationStatus={generationStatus}
            prompt={generationStatus.message}
          />
        </div>

        {/* Right column - Gallery */}
        <div className="lg:col-span-2">
          <Suspense fallback={<div>Loading gallery...</div>}>
            <ImageGallery
              images={generatedImages}
              currentGeneration={currentGeneration}
              onDeleteImage={deleteImage}
              onClearAll={clearAllImages}
              onDownloadImage={downloadImage}
              onCopyImageUrl={copyImageUrl}
            />
          </Suspense>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-sm text-gray-500 border-t pt-8">
        <p>
          Powered by <strong>SuperDuperAI</strong> • 
          Images are generated using state-of-the-art AI models • 
          For best results, be specific and detailed in your prompts
        </p>
      </div>
    </div>
  );
}