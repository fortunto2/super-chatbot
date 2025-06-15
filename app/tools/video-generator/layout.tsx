import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Video Generator | Super Chatbot',
  description: 'Generate high-quality videos using AI models like VEO3, KLING, LTX, and more from SuperDuperAI',
  keywords: ['AI', 'video generation', 'VEO3', 'KLING', 'LTX', 'SuperDuperAI', 'video AI'],
};

export default function VideoGeneratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
} 