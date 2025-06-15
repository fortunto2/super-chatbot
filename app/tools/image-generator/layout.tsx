import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Image Generator | Super Chatbot',
  description: 'Generate high-quality images using AI models like FLUX Pro/Dev, Google Imagen, and more',
  keywords: ['AI', 'image generation', 'FLUX', 'Google Imagen', 'SuperDuperAI'],
};

export default function ImageGeneratorLayout({
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