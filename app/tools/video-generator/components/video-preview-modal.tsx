import { Button } from "@/components/ui/button";
import { GeneratedVideo } from "../hooks/use-video-generator";
import { formatDuration, formatTimestamp } from "@/lib/utils/format";
import { X } from "lucide-react";

export const VideoPreviewModal = ({ video, setSelectedVideo, handleVideoError }: { video: GeneratedVideo, setSelectedVideo: (video: GeneratedVideo | null) => void, handleVideoError: (videoId: string) => void }) => (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-5xl max-h-full">
        <Button
          variant="outline"
          size="sm"
          className="absolute top-2 right-2 z-10 bg-gray-900/90 hover:bg-gray-800 text-white border-gray-600 size-8 p-0"
          onClick={() => setSelectedVideo(null)}
          title="Close"
        >
          <X className="size-3" />
        </Button>
        
        <video
          src={video.url}
          controls
          autoPlay
          className="max-w-full max-h-full rounded-lg"
          onError={() => handleVideoError(video.id)}
        />
        
        <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white p-4 rounded-b-lg">
          <p className="text-sm font-medium line-clamp-2">{video.prompt}</p>
          <div className="flex justify-between items-center mt-2 text-xs text-gray-300">
            <span>{formatTimestamp(video.timestamp)}</span>
            <span>{formatDuration(video.settings.duration)} • {video.settings.frameRate}fps</span>
          </div>
        </div>
      </div>
    </div>
  );