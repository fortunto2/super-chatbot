

export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  iconName: 'image' | 'video' | 'wand' | 'sparkles' | 'zap' | 'play' | 'languages' | 'gallery';
  href: string;
  category: 'generation' | 'enhancement' | 'utility' | 'gallery';
  features: {
    iconName: 'sparkles' | 'zap' | 'play' | 'languages';
    label: string;
  }[];
  primaryColor: string;
  hoverColor: string;
  bgColor: string;
  hoverBgColor: string;
}

export const TOOLS_CONFIG: ToolConfig[] = [
  {
    id: 'image-generator',
    name: 'Image Generator',
    description: 'Generate high-quality images using AI models like FLUX Pro, FLUX Dev, and more from SuperDuperAI',
    shortDescription: 'AI Image Generator',
    iconName: 'image',
    href: '/tools/image-generator',
    category: 'generation',
    features: [
      { iconName: 'sparkles', label: 'Professional Quality' },
      { iconName: 'zap', label: 'Real-time Progress' }
    ],
    primaryColor: 'blue-600',
    hoverColor: 'blue-600',
    bgColor: 'blue-100',
    hoverBgColor: 'blue-200'
  },
  {
    id: 'video-generator',
    name: 'Video Generator',
    description: 'Generate high-quality videos using AI models like VEO3, KLING, LTX, and more from SuperDuperAI',
    shortDescription: 'AI Video Generator',
    iconName: 'video',
    href: '/tools/video-generator',
    category: 'generation',
    features: [
      { iconName: 'play', label: 'Professional Quality' },
      { iconName: 'zap', label: 'Real-time Progress' }
    ],
    primaryColor: 'purple-600',
    hoverColor: 'purple-600',
    bgColor: 'purple-100',
    hoverBgColor: 'purple-200'
  },
  {
    id: 'prompt-enhancer',
    name: 'Prompt Enhancer',
    description: 'Transform simple prompts into detailed, professional descriptions for better AI generation results',
    shortDescription: 'AI Prompt Enhancer',
    iconName: 'wand',
    href: '/tools/prompt-enhancer',
    category: 'enhancement',
    features: [
      { iconName: 'languages', label: 'Auto Translation' },
      { iconName: 'sparkles', label: 'Smart Enhancement' }
    ],
    primaryColor: 'pink-600',
    hoverColor: 'pink-600',
    bgColor: 'pink-100',
    hoverBgColor: 'pink-200'
  },
  {
    id: 'prompt-enhancer-veo3',
    name: 'Prompt Enhancer Veo3',
    description: 'Transform simple prompts into detailed, professional descriptions for better AI generation results',
    shortDescription: 'AI Prompt Enhancer VEO3',
    iconName: 'wand',
    href: '/tools/prompt-enhancer-veo3',
    category: 'enhancement',
    features: [
      { iconName: 'languages', label: 'Auto Translation' },
      { iconName: 'sparkles', label: 'Smart Enhancement' }
    ],
    primaryColor: 'pink-600',
    hoverColor: 'pink-600',
    bgColor: 'pink-100',
    hoverBgColor: 'pink-200'
  },
  {
    id: 'script-generator',
    name: 'Script Generator',
    description: 'Generate detailed scripts and scenarios in Markdown format using AI. Edit and refine your script with a powerful Markdown editor.',
    shortDescription: 'AI Script Generator',
    iconName: 'wand',
    href: '/tools/script-generator',
    category: 'generation',
    features: [
      { iconName: 'sparkles', label: 'Markdown Output' },
      { iconName: 'sparkles', label: 'Script Structuring' }
    ],
    primaryColor: 'green-600',
    hoverColor: 'green-600',
    bgColor: 'green-100',
    hoverBgColor: 'green-200'
  },
  {
    id: 'gallery',
    name: 'Artifact Gallery',
    description: 'Browse and discover AI-generated images, videos, text documents, and spreadsheets. View your own creations or explore public artifacts from the community.',
    shortDescription: 'Artifacts',
    iconName: 'image',
    href: '/gallery',
    category: 'gallery',
    features: [
      { iconName: 'sparkles', label: 'All Artifact Types' },
      { iconName: 'zap', label: 'Advanced Search & Filters' }
    ],
    primaryColor: 'indigo-600',
    hoverColor: 'indigo-600',
    bgColor: 'indigo-100',
    hoverBgColor: 'indigo-200'
  }
];

// Helper functions
export const getToolById = (id: string): ToolConfig | undefined => {
  return TOOLS_CONFIG.find(tool => tool.id === id);
};

export const getToolByHref = (href: string): ToolConfig | undefined => {
  return TOOLS_CONFIG.find(tool => tool.href === href);
};

export const getToolsByCategory = (category: ToolConfig['category']): ToolConfig[] => {
  return TOOLS_CONFIG.filter(tool => tool.category === category);
};

// For navigation components
export const getToolNavigation = () => {
  return TOOLS_CONFIG.map(tool => ({
    id: tool.id,
    name: tool.name,
    shortName: tool.shortDescription || tool.name,
    iconName: tool.iconName,
    href: tool.href
  }));
};

// For breadcrumb navigation
export const getToolDisplayName = (pathname: string): string => {
  const tool = TOOLS_CONFIG.find(tool => pathname.includes(tool.href));
  return tool?.name || 'Unknown Tool';
}; 