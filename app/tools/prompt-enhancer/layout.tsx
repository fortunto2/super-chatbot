import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Prompt Enhancer | SuperDuperAI',
  description: 'Transform simple prompts into detailed, professional descriptions for better AI generation results. Automatically translates text and optimizes for different AI models.',
  keywords: ['AI', 'prompt enhancement', 'prompt engineering', 'translation', 'image generation', 'video generation'],
};

export default function PromptEnhancerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
      <div className="mx-auto w-full max-w-6xl">
        {children}
      </div>
    </div>
  );
} 