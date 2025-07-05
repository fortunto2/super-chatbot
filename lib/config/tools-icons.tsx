import { ImageIcon, VideoIcon, Wand2, Sparkles, Zap, Play, Languages } from 'lucide-react';

export type IconName = 'image' | 'video' | 'wand' | 'sparkles' | 'zap' | 'play' | 'languages' | 'gallery';

interface ToolIconProps {
  name: IconName;
  className?: string;
}

export function ToolIcon({ name, className = "size-4" }: ToolIconProps) {
  switch (name) {
    case 'image':
      return <ImageIcon className={className} />;
    case 'video':
      return <VideoIcon className={className} />;
    case 'wand':
      return <Wand2 className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'play':
      return <Play className={className} />;
    case 'languages':
      return <Languages className={className} />;
    case 'gallery':
      return <ImageIcon className={className} />;
    default:
      return <Sparkles className={className} />;
  }
} 