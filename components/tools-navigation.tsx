'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, ImageIcon, VideoIcon, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export function ToolsNavigation() {
  const pathname = usePathname();
  
  const isImageTool = pathname.includes('/image-generator');
  const isVideoTool = pathname.includes('/video-generator');
  
  return (
    <div className="mb-6">
      {/* Back to main chat button */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="size-4" />
            Back to Chat
          </Button>
        </Link>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Home className="size-4" />
          <span>/</span>
          <span>Tools</span>
          <span>/</span>
          <span className="font-medium">
            {isImageTool ? 'Image Generator' : isVideoTool ? 'Video Generator' : 'Unknown'}
          </span>
        </div>
      </div>
      
      {/* Tools navigation tabs */}
      <div className="flex items-center gap-2 mb-4">
        <Link href="/tools">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <Home className="size-4" />
            All Tools
          </Button>
        </Link>
        
        <span className="text-muted-foreground">|</span>
        
        <Link href="/tools/image-generator">
          <Button 
            variant={isImageTool ? "default" : "outline"} 
            size="sm" 
            className="gap-2"
          >
            <ImageIcon className="size-4" />
            Image Generator
          </Button>
        </Link>
        
        <Link href="/tools/video-generator">
          <Button 
            variant={isVideoTool ? "default" : "outline"} 
            size="sm"
            className="gap-2"
          >
            <VideoIcon className="size-4" />
            Video Generator
          </Button>
        </Link>
      </div>
      
      <Separator />
    </div>
  );
} 