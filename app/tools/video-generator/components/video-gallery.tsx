'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Download, 
  Copy, 
  Trash2, 
  Play,
  Clock,
  Settings,
  X,
  Video
} from 'lucide-react';
import type { GeneratedVideo } from '../hooks/use-video-generator';

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

  // AICODE-NOTE: Handle video load errors
  const handleVideoError = (videoId: string) => {
    setVideoErrors(prev => new Set(prev).add(videoId));
  };

  // AICODE-NOTE: Format timestamp for display
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    
    return date.toLocaleDateString();
  };

  // AICODE-NOTE: Format duration for display
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // AICODE-NOTE: Video preview modal
  const VideoPreviewModal = ({ video }: { video: GeneratedVideo }) => (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-5xl max-h-full">
        <Button
          variant="outline"
          size="sm"
          className="absolute top-2 right-2 z-10 bg-white"
          onClick={() => setSelectedVideo(null)}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <video
          src={video.url}
          controls
          autoPlay
          className="max-w-full max-h-full rounded-lg"
          onError={() => handleVideoError(video.id)}
        />
        
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-4 rounded-b-lg">
          <p className="text-sm font-medium line-clamp-2">{video.prompt}</p>
          <div className="flex justify-between items-center mt-2 text-xs text-gray-300">
            <span>{formatTimestamp(video.timestamp)}</span>
            <span>{formatDuration(video.settings.duration)} • {video.settings.frameRate}fps</span>
          </div>
        </div>
      </div>
    </div>
  );

  // AICODE-NOTE: Individual video card component
  const VideoCard = ({ video, isCurrent = false }: { video: GeneratedVideo; isCurrent?: boolean }) => {
    const hasError = videoErrors.has(video.id);
    
    return (
      <Card className={`group relative overflow-hidden ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}>
        <div className="aspect-video relative bg-gray-900">
          {hasError ? (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Video className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Failed to load</p>
              </div>
            </div>
          ) : (
            <video
              src={video.url}
              className="w-full h-full object-cover cursor-pointer"
              muted
              onMouseEnter={(e) => {
                const video = e.currentTarget;
                video.play().catch(() => {
                  // Ignore autoplay errors
                });
              }}
              onMouseLeave={(e) => {
                const video = e.currentTarget;
                video.pause();
                video.currentTime = 0;
              }}
              onClick={() => setSelectedVideo(video)}
              onError={() => handleVideoError(video.id)}
            />
          )}
          
          {/* Play button overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="lg"
                variant="outline"
                className="bg-white/90 hover:bg-white rounded-full"
                onClick={() => setSelectedVideo(video)}
              >
                <Play className="h-6 w-6" />
              </Button>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
            <Button
              size="sm"
              variant="outline"
              className="bg-white/90 hover:bg-white"
              onClick={() => onDownloadVideo(video)}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-white/90 hover:bg-white"
              onClick={() => onCopyVideoUrl(video)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-white/90 hover:bg-white text-red-600 hover:text-red-700"
              onClick={() => onDeleteVideo(video.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(video.settings.duration)}
          </div>
          
          {isCurrent && (
            <div className="absolute top-2 left-2">
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                Latest
              </span>
            </div>
          )}
        </div>
        
        <CardContent className="p-3">
          <p className="text-sm font-medium line-clamp-2 mb-2">
            {video.prompt}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {formatTimestamp(video.timestamp)}
            </div>
            
            <div className="flex items-center">
              <Settings className="h-3 w-3 mr-1" />
              {video.settings.model}
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <span>{video.settings.resolution}</span>
            <span>{video.settings.frameRate}fps</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (videos.length === 0 && !currentGeneration) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generated Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
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
              />
            )}
            
            {/* Show other videos */}
            {videos
              .filter(video => video.id !== currentGeneration?.id)
              .map((video) => (
                <VideoCard 
                  key={video.id} 
                  video={video}
                />
              ))
            }
          </div>
        </CardContent>
      </Card>

      {/* Video Preview Modal */}
      {selectedVideo && (
        <VideoPreviewModal video={selectedVideo} />
      )}
    </>
  );
} 