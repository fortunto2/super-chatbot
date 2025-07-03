import { ToolsNavigation } from '@/components/tools-navigation';
import { ReactNode } from 'react';

const TOOL_TITLES: Record<string, { title: string; description: string }> = {
  '': {
    title: 'AI Tools',
    description: 'Powerful AI-powered tools for generating high-quality images, videos, and enhancing your prompts. Choose the tool that fits your creative needs.'
  },
  '/tools/image-generator': {
    title: 'AI Image Generator',
    description: 'Generate high-quality images using advanced AI models from SuperDuperAI. Create stunning visuals from text or images.'
  },
  '/tools/video-generator': {
    title: 'AI Video Generator',
    description: 'Generate high-quality videos using advanced AI models from SuperDuperAI. Create professional videos from text descriptions with models like VEO3, KLING, LTX, and more.'
  },
  '/tools/prompt-enhancer': {
    title: 'Prompt Enhancer',
    description: 'Enhance your prompts for better AI results. Get suggestions and improvements instantly.'
  },
};

export default function ToolsLayout({ children }: { children: ReactNode }) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const tool = Object.keys(TOOL_TITLES).sort((a, b) => b.length - a.length).find((key) => pathname.startsWith(key));
  const header = tool ? TOOL_TITLES[tool] : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <ToolsNavigation />
          {header && (
            <div className="text-center space-y-4 mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {header.title}
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {header.description}
              </p>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
} 