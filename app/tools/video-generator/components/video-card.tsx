import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Download, 
  Copy, 
  Trash2, 
  Play,
  Clock,
  Settings,
  Video,
} from 'lucide-react';
import type { GeneratedVideo } from '../hooks/use-video-generator';
import { formatDuration, formatTimestamp } from '@/lib/utils/format';

type VideoCardProps = {
    video: GeneratedVideo;
    isCurrent?: boolean;
    onCopyVideoUrl: (video: GeneratedVideo) => void;
    onDownloadVideo: (video: GeneratedVideo) => void;
    onDeleteVideo: (videoId: string) => void;
    setSelectedVideo: (video: GeneratedVideo | null) => void;
    handleVideoError: (videoId: string) => void;
    videoErrors: Set<string>;
}

export const VideoCard = ({ video, 
    isCurrent = false, 
    onCopyVideoUrl, 
    onDownloadVideo, 
    onDeleteVideo, 
    setSelectedVideo, 
    handleVideoError, 
    videoErrors 
}: VideoCardProps) => {
    const hasError = videoErrors.has(video.id);
    const actions = [
    
      {
        icon: <Copy className="size-4" />,
        onClick: () => onCopyVideoUrl(video)
      },
      {
        icon: <Download className="size-4" />,
        onClick: () => onDownloadVideo(video)
      },
      {
        icon: <Trash2 className="size-4" />,
        onClick: () => onDeleteVideo(video.id)
      }
    ]
    return (
      <Card className={`group relative overflow-hidden ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}>
        <div className="aspect-video relative bg-gray-900">
          {hasError ? (
            <div className="size-full bg-gray-100 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Video className="size-6 mx-auto mb-2" />
                <p className="text-sm">Failed to load</p>
              </div>
            </div>
          ) : (
            <video
              src={video.url}
              className="size-full object-cover cursor-pointer"
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
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="lg"
                variant="outline"
                className="bg-gray-900/90 hover:bg-gray-800 text-white border-gray-600 rounded-full size-14 p-0"
                onClick={() => setSelectedVideo(video)}
                title="Play video"
              >
                <Play className="size-5" />
              </Button>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="absolute top-2 right-9 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            {actions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant="outline"
                className="bg-gray-900/80 hover:bg-gray-800 text-white border-gray-600 size-8 p-0"
                onClick={action.onClick}
              >
                {action.icon}
              </Button>
            ))}
          </div>
          
          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
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
              <Clock className="size-3 mr-1" />
              {formatTimestamp(video.timestamp)}
            </div>
            
            <div className="flex items-center">
              <Settings className="size-3 mr-1" />
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
