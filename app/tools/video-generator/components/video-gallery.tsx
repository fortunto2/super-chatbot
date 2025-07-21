'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Trash2, 
  Video,
} from 'lucide-react';
import type { GeneratedVideo } from '../hooks/use-video-generator';
import { VideoPreviewModal } from './video-preview-modal';
import { VideoCard } from './video-card';

interface VideoGalleryProps {
  videos: GeneratedVideo[];
  currentGeneration: GeneratedVideo | null;
  onDeleteVideo: (videoId: string) => void;
  onClearAll: () => void;
  onDownloadVideo: (video: GeneratedVideo) => Promise<void>;
  onCopyVideoUrl: (video: GeneratedVideo) => Promise<void>;
}

export function VideoGallery({
  videos,
  currentGeneration,
  onDeleteVideo,
  onClearAll,
  onDownloadVideo,
  onCopyVideoUrl,
}: VideoGalleryProps) {
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(null);
  const [videoErrors, setVideoErrors] = useState<Set<string>>(new Set());

  const handleVideoError = (videoId: string) => {
    setVideoErrors(prev => new Set(prev).add(videoId));
  };

  if (videos.length === 0 && !currentGeneration) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generated Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Video className="size-8 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No videos generated yet</p>
            <p className="text-sm">
              Start by entering a prompt and clicking &quot;Generate Video&quot;
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Generated Videos ({videos.length})</CardTitle>
            {videos.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearAll}
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <Trash2 className="size-3 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Show current generation first if it exists */}
            {currentGeneration && (
              <VideoCard 
                video={currentGeneration} 
                isCurrent={true}
                onCopyVideoUrl={onCopyVideoUrl}
                onDownloadVideo={onDownloadVideo}
                onDeleteVideo={onDeleteVideo}
                setSelectedVideo={setSelectedVideo}
                handleVideoError={handleVideoError}
                videoErrors={videoErrors}
              />
            )}
            
            {/* Show other videos */}
            {videos
              .filter(video => video.id !== currentGeneration?.id)
              .map((video) => (
                <VideoCard 
                  key={video.id} 
                  video={video}
                  onCopyVideoUrl={onCopyVideoUrl}
                  onDownloadVideo={onDownloadVideo}
                  onDeleteVideo={onDeleteVideo}
                  setSelectedVideo={setSelectedVideo}
                  handleVideoError={handleVideoError}
                  videoErrors={videoErrors}
                />
              ))
            }
          </div>
        </CardContent>
      </Card>

      {/* Video Preview Modal */}
      {selectedVideo && (
        <VideoPreviewModal 
          video={selectedVideo} 
          setSelectedVideo={setSelectedVideo} 
          handleVideoError={handleVideoError} 
        />
      )}  
    </>
  );
} 



