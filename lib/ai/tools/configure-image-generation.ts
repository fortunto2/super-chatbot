import { tool } from 'ai';
import { z } from 'zod';
import type { 
  MediaResolution, 
  MediaOption, 
  ImageGenerationConfig,
  ImageModel 
} from '@/lib/types/media-settings';
import { getStyles } from '../api/get-styles';

const RESOLUTIONS: MediaResolution[] = [
  { width: 1344, height: 768, label: "1344x768", aspectRatio: "16:9", qualityType: "hd" },
  { width: 1920, height: 1080, label: "1920×1080", aspectRatio: "16:9", qualityType: "full_hd" },

  { width: 1664, height: 1216, label: "1664x1216", aspectRatio: "4:3", qualityType: "full_hd" },
  { width: 1152, height: 896, label: "1152x896", aspectRatio: "4:3", qualityType: "hd" },

  { width: 1024, height: 1024, label: "1024x1024", aspectRatio: "1:1", qualityType: "hd" },
  { width: 1408, height: 1408, label: "1408×1408", aspectRatio: "1:1", qualityType: "full_hd" },

  { width: 1408, height: 1760, label: "1408×1760", aspectRatio: "4:5", qualityType: "full_hd" },
  { width: 1024, height: 1280, label: "1024x1280", aspectRatio: "4:5", qualityType: "hd" },

  { width: 1080, height: 1920, label: "1080×1920", aspectRatio: "9:16", qualityType: "full_hd" },
  { width: 768, height: 1344, label: "768x1344", aspectRatio: "9:16", qualityType: "hd" },
];

// Resolution aliases for better understanding
const RESOLUTION_ALIASES: Record<string, string> = {
  // Common formats
  "1920x1080": "1920×1080",
  "1920 x 1080": "1920×1080", 
  "1920 на 1080": "1920×1080",
  "1920*1080": "1920×1080",
  "1920/1080": "1920×1080",
  "full hd": "1920×1080",
  "fhd": "1920×1080",
  "fullhd": "1920×1080",
  "1080p": "1920×1080",
  
  "1024x1024": "1024x1024",
  "1024 x 1024": "1024x1024",
  "1024 на 1024": "1024x1024", 
  "1024*1024": "1024x1024",
  "square": "1024x1024",
  "квадрат": "1024x1024",
  "квадратное": "1024x1024",
  
  "1080x1920": "1080×1920",
  "1080 x 1920": "1080×1920",
  "1080 на 1920": "1080×1920",
  "1080*1920": "1080×1920",
  "вертикальное": "1080×1920",
  "vertical": "1080×1920",
  "портретное": "1080×1920",
  
  "768x1344": "768x1344",
  "768 x 1344": "768x1344",
  "768 на 1344": "768x1344",
  "768*1344": "768x1344",
  
  "1344x768": "1344x768", 
  "1344 x 768": "1344x768",
  "1344 на 768": "1344x768",
  "1344*1344": "1344x768",
  "горизонтальное": "1344x768",
  "horizontal": "1344x768",
  "landscape": "1344x768",
  "альбомное": "1344x768",
  
  "1408x1408": "1408×1408",
  "1408 x 1408": "1408×1408",
  "1408 на 1408": "1408×1408",
  "1408*1408": "1408×1408",
  "большой квадрат": "1408×1408",
  "big square": "1408×1408",
  
  "1664x1216": "1664x1216",
  "1664 x 1216": "1664x1216", 
  "1664 на 1216": "1664x1216",
  "1664*1216": "1664x1216",
  
  "1152x896": "1152x896",
  "1152 x 896": "1152x896",
  "1152 на 896": "1152x896", 
  "1152*896": "1152x896",
  
  "1024x1280": "1024x1280",
  "1024 x 1280": "1024x1280",
  "1024 на 1280": "1024x1280",
  "1024*1280": "1024x1280",
  
  "1408x1760": "1408×1760",
  "1408 x 1760": "1408×1760",
  "1408 на 1760": "1408×1760", 
  "1408*1760": "1408×1760",
};

// Shot size aliases for better understanding  
const SHOT_SIZE_ALIASES: Record<string, string> = {
  "extreme long shot": "extreme-long-shot",
  "очень дальний план": "extreme-long-shot",
  "экстремально дальний план": "extreme-long-shot",
  "панорама": "extreme-long-shot",
  "panorama": "extreme-long-shot",
  
  "long shot": "long-shot", 
  "дальний план": "long-shot",
  "общий план": "long-shot",
  "wide shot": "long-shot",
  "full body": "long-shot",
  "во весь рост": "long-shot",
  
  "medium shot": "medium-shot",
  "средний план": "medium-shot", 
  "по пояс": "medium-shot",
  "waist up": "medium-shot",
  
  "medium close up": "medium-close-up",
  "medium close-up": "medium-close-up",
  "полукрупный план": "medium-close-up",
  "по грудь": "medium-close-up",
  "chest up": "medium-close-up",
  
  "close up": "close-up",
  "close-up": "close-up",
  "крупный план": "close-up",
  "лицо": "close-up",
  "face": "close-up",
  "портретный план": "close-up",
  
  "extreme close up": "extreme-close-up", 
  "extreme close-up": "extreme-close-up",
  "сверхкрупный план": "extreme-close-up",
  "макро": "extreme-close-up",
  "macro": "extreme-close-up",
  "детальный": "extreme-close-up",
  
  "two shot": "two-shot",
  "two-shot": "two-shot",
  "двойной план": "two-shot",
  "два человека": "two-shot",
  "two people": "two-shot",
  
  "detail shot": "detail-shot",
  "detail-shot": "detail-shot",
  "детальный план": "detail-shot",
  "детали": "detail-shot",
};

// Model aliases
const MODEL_ALIASES: Record<string, string> = {
  "flux dev": "flux-dev",
  "flux-dev": "flux-dev",
  "dev": "flux-dev",
  "развитие": "flux-dev",
  "обычный": "flux-dev",
  "standard": "flux-dev",
  
  "flux pro": "flux-pro",
  "flux-pro": "flux-pro", 
  "pro": "flux-pro",
  "профессиональный": "flux-pro",
  "лучшее качество": "flux-pro",
  "высокое качество": "flux-pro",
  "best quality": "flux-pro",
  "high quality": "flux-pro",
  "ultra": "flux-pro",
};

// Style aliases for better understanding - Updated with more comprehensive mapping
const STYLE_ALIASES: Record<string, string[]> = {
  // Realistic styles
  "realistic": ["realistic", "photorealistic", "real", "photo"],
  "реалистичный": ["realistic", "photorealistic", "real", "photo"],
  "реалистичное": ["realistic", "photorealistic", "real", "photo"], 
  "реализм": ["realistic", "photorealistic", "real", "photo"],
  "натуральный": ["realistic", "natural", "photo"],
  "обычный": ["realistic", "standard", "default"],
  
  // Cinematic styles
  "cinematic": ["cinematic", "movie", "film", "cinema"],
  "кинематографический": ["cinematic", "movie", "film", "cinema"],
  "кино": ["cinematic", "movie", "film", "cinema"],
  "киношный": ["cinematic", "movie", "film", "cinema"], 
  "фильм": ["cinematic", "movie", "film", "cinema"],
  
  // Anime/Manga styles
  "anime": ["anime", "manga", "japanese"],
  "аниме": ["anime", "manga", "japanese"],
  "манга": ["anime", "manga", "japanese"],
  "японский": ["anime", "manga", "japanese"],
  "мультяшный": ["anime", "cartoon", "animated"],
  
  // Cartoon styles
  "cartoon": ["cartoon", "animated", "toon"],
  "мультфильм": ["cartoon", "animated", "toon"],
  "мультик": ["cartoon", "animated", "toon"],
  "анимация": ["cartoon", "animated", "animation"],
  
  // Art styles
  "painting": ["painting", "oil", "watercolor", "acrylic"],
  "живопись": ["painting", "oil", "watercolor", "acrylic"],
  "картина": ["painting", "oil", "watercolor", "acrylic"],
  "масло": ["painting", "oil"],
  "художественный": ["painting", "artistic", "art"],
  
  "sketch": ["sketch", "drawing", "pencil", "charcoal"],
  "эскиз": ["sketch", "drawing", "pencil", "charcoal"],
  "набросок": ["sketch", "drawing", "pencil", "charcoal"],
  "рисунок": ["sketch", "drawing", "pencil", "charcoal"],
  "карандаш": ["sketch", "pencil", "drawing"],
  
  // Specific genres
  "steampunk": ["steampunk", "steam", "victorian"],
  "стимпанк": ["steampunk", "steam", "victorian"],
  "стим": ["steampunk", "steam"],
  
  "fantasy": ["fantasy", "magical", "fairy"],
  "фэнтези": ["fantasy", "magical", "fairy"],
  "магический": ["fantasy", "magical", "magic"],
  "сказочный": ["fantasy", "fairy", "tale"],
  
  "sci-fi": ["sci-fi", "science", "futuristic", "cyberpunk"],
  "научная фантастика": ["sci-fi", "science", "futuristic"],
  "фантастика": ["sci-fi", "science", "futuristic"],
  "футуристический": ["sci-fi", "futuristic", "future"],
  "космический": ["sci-fi", "space", "cosmic"],
  
  "horror": ["horror", "scary", "dark", "gothic"],
  "ужас": ["horror", "scary", "dark", "gothic"],
  "страшный": ["horror", "scary", "dark"],
  "темный": ["horror", "dark", "gothic"],
  "мрачный": ["horror", "dark", "gloomy"],
  
  // Other styles
  "minimalist": ["minimalist", "minimal", "simple", "clean"],
  "минимализм": ["minimalist", "minimal", "simple", "clean"],
  "минималистический": ["minimalist", "minimal", "simple"],
  "простой": ["minimalist", "simple", "clean"],
  "чистый": ["minimalist", "clean", "simple"],
  
  "abstract": ["abstract", "geometric", "modern"],
  "абстрактный": ["abstract", "geometric", "modern"],
  "абстракция": ["abstract", "geometric", "modern"],
  
  "portrait": ["portrait", "face", "person", "headshot"],
  "портрет": ["portrait", "face", "person", "headshot"],
  "лицо": ["portrait", "face", "closeup"],
  "человек": ["portrait", "person", "people"],
  
  "landscape": ["landscape", "nature", "scenery", "outdoor"],
  "пейзаж": ["landscape", "nature", "scenery", "outdoor"],
  "природа": ["landscape", "nature", "natural"],
  "природный": ["landscape", "nature", "natural"],
  
  "vivid": ["vivid", "colorful", "bright", "saturated"],
  "яркий": ["vivid", "colorful", "bright", "saturated"],
  "яркое": ["vivid", "colorful", "bright", "saturated"],
  "насыщенный": ["vivid", "saturated", "intense"],
  "цветной": ["vivid", "colorful", "colored"],
  "красочный": ["vivid", "colorful", "bright"],
  
  "pixel": ["pixel", "8-bit", "retro", "pixelated"],
  "пиксель": ["pixel", "8-bit", "retro", "pixelated"],
  "пиксельный": ["pixel", "8-bit", "retro", "pixelated"],
  "ретро": ["pixel", "retro", "vintage", "old"],
};

// Function to find resolution by various formats
function findResolution(input: string): MediaResolution | null {
  if (!input) return null;
  
  const normalizedInput = input.toLowerCase().trim();
  
  // Check aliases first
  const aliasMatch = RESOLUTION_ALIASES[normalizedInput];
  if (aliasMatch) {
    return RESOLUTIONS.find(r => r.label === aliasMatch) || null;
  }
  
  // Try direct label match
  const directMatch = RESOLUTIONS.find(r => 
    r.label.toLowerCase() === normalizedInput ||
    r.label === input
  );
  if (directMatch) return directMatch;
  
  // Try to parse dimensions manually (1920x1080, 1920*1080, 1920 на 1080, etc.)
  const dimensionMatch = normalizedInput.match(/(\d+)\s*[x*×на]\s*(\d+)/);
  if (dimensionMatch) {
    const width = parseInt(dimensionMatch[1]);
    const height = parseInt(dimensionMatch[2]);
    
    return RESOLUTIONS.find(r => r.width === width && r.height === height) || null;
  }
  
  return null;
}

// Function to find shot size by alias
function findShotSize(input: string): string | null {
  if (!input) return null;
  
  const normalizedInput = input.toLowerCase().trim();
  
  // Check aliases first
  const aliasMatch = SHOT_SIZE_ALIASES[normalizedInput];
  if (aliasMatch) return aliasMatch;
  
  // Check direct ID match
  const directMatch = SHOT_SIZES.find(s => 
    s.id === normalizedInput ||
    s.label.toLowerCase() === normalizedInput
  );
  
  return directMatch?.id || null;
}

// Function to find model by alias
function findModel(input: string): string | null {
  if (!input) return null;
  
  const normalizedInput = input.toLowerCase().trim();
  
  // Check aliases first 
  const aliasMatch = MODEL_ALIASES[normalizedInput];
  if (aliasMatch) return aliasMatch;
  
  // Check direct ID match
  const directMatch = IMAGE_MODELS.find(m => 
    m.id === normalizedInput ||
    m.label.toLowerCase() === normalizedInput
  );
  
  return directMatch?.id || null;
}

// Enhanced function to find style by various formats and aliases
export function findStyle(input: string, availableStyles: MediaOption[]): MediaOption | null {
  if (!input || !availableStyles.length) {
    console.log('🎨 findStyle: No input or no available styles');
    return null;
  }
  
  const normalizedInput = input.toLowerCase().trim();
  console.log(`🎨 findStyle: Looking for "${normalizedInput}" among ${availableStyles.length} styles`);
  
  // 1. Check direct ID match (exact)
  const directIdMatch = availableStyles.find(s => s.id.toLowerCase() === normalizedInput);
  if (directIdMatch) {
    console.log(`🎨 ✅ Direct ID match: ${normalizedInput} -> ${directIdMatch.id}`);
    return directIdMatch;
  }
  
  // 2. Check exact label match
  const exactLabelMatch = availableStyles.find(s => s.label.toLowerCase() === normalizedInput);
  if (exactLabelMatch) {
    console.log(`🎨 ✅ Exact label match: ${normalizedInput} -> ${exactLabelMatch.id}`);
    return exactLabelMatch;
  }
  
  // 3. Check aliases - try all keywords for the input
  for (const [userInput, keywords] of Object.entries(STYLE_ALIASES)) {
    if (userInput === normalizedInput) {
      // Found alias match, now try to find style using keywords
      for (const keyword of keywords) {
        // Try exact match first
        const exactMatch = availableStyles.find(s => 
          s.id.toLowerCase() === keyword.toLowerCase() ||
          s.label.toLowerCase() === keyword.toLowerCase()
        );
        if (exactMatch) {
          console.log(`🎨 ✅ Alias exact match: ${normalizedInput} -> ${keyword} -> ${exactMatch.id}`);
          return exactMatch;
        }
        
        // Try partial match
        const partialMatch = availableStyles.find(s => 
          s.id.toLowerCase().includes(keyword.toLowerCase()) ||
          s.label.toLowerCase().includes(keyword.toLowerCase())
        );
        if (partialMatch) {
          console.log(`🎨 ✅ Alias partial match: ${normalizedInput} -> ${keyword} -> ${partialMatch.id}`);
          return partialMatch;
        }
      }
    }
  }
  
  // 4. Partial match in ID or label (contains search)
  const partialMatch = availableStyles.find(s => 
    s.id.toLowerCase().includes(normalizedInput) ||
    s.label.toLowerCase().includes(normalizedInput) ||
    normalizedInput.includes(s.id.toLowerCase()) ||
    normalizedInput.includes(s.label.toLowerCase())
  );
  if (partialMatch) {
    console.log(`🎨 ✅ Partial match: ${normalizedInput} -> ${partialMatch.id}`);
    return partialMatch;
  }
  
  // 5. Try reverse keyword search - check if any available style keywords match our aliases
  for (const style of availableStyles) {
    const styleIdLower = style.id.toLowerCase();
    const styleLabelLower = style.label.toLowerCase();
    
    // Check if any alias keyword matches this style
    for (const [userInput, keywords] of Object.entries(STYLE_ALIASES)) {
      if (userInput === normalizedInput) {
        for (const keyword of keywords) {
          if (styleIdLower.includes(keyword.toLowerCase()) || 
              styleLabelLower.includes(keyword.toLowerCase())) {
            console.log(`🎨 ✅ Reverse keyword match: ${normalizedInput} -> ${keyword} -> ${style.id}`);
            return style;
          }
        }
      }
    }
  }
  
  // 6. Fuzzy match - check if input contains any style name parts
  const fuzzyMatch = availableStyles.find(s => {
    const styleWords = s.label.toLowerCase().split(/[\s_-]+/);
    const inputWords = normalizedInput.split(/[\s_-]+/);
    
    return styleWords.some(styleWord => 
      inputWords.some(inputWord => 
        inputWord.includes(styleWord) || 
        styleWord.includes(inputWord)
      )
    );
  });
  
  if (fuzzyMatch) {
    console.log(`🎨 ✅ Fuzzy match: ${normalizedInput} -> ${fuzzyMatch.id}`);
    return fuzzyMatch;
  }
  
  // 7. Last resort - find any style that contains common keywords
  const commonKeywords = ['realistic', 'cinematic', 'anime', 'cartoon', 'fantasy', 'steampunk'];
  for (const keyword of commonKeywords) {
    if (normalizedInput.includes(keyword)) {
      const keywordMatch = availableStyles.find(s => 
        s.id.toLowerCase().includes(keyword) ||
        s.label.toLowerCase().includes(keyword)
      );
      if (keywordMatch) {
        console.log(`🎨 ✅ Common keyword match: ${normalizedInput} -> ${keyword} -> ${keywordMatch.id}`);
        return keywordMatch;
      }
    }
  }
  
  console.log(`🎨 ❌ No match found for: ${normalizedInput}`);
  console.log(`🎨 📋 Available style samples:`, availableStyles.slice(0, 5).map(s => `${s.id} (${s.label})`).join(', '));
  
  return null;
}

export enum ShotSizeEnum {
  EXTREME_LONG_SHOT = 'Extreme Long Shot',
  LONG_SHOT = 'Long Shot',
  MEDIUM_SHOT = 'Medium Shot',
  MEDIUM_CLOSE_UP = 'Medium Close-Up',
  CLOSE_UP = 'Close-Up',
  EXTREME_CLOSE_UP = 'Extreme Close-Up',
  TWO_SHOT = 'Two-Shot',
  DETAIL_SHOT = 'Detail Shot',
}
const SHOT_SIZES: MediaOption[] = [
  {
    id: 'extreme-long-shot',
    label: ShotSizeEnum.EXTREME_LONG_SHOT,
    description: 'Shows vast landscapes or cityscapes with tiny subjects',
  },
  {
    id: 'long-shot',
    label: ShotSizeEnum.LONG_SHOT,
    description: 'Shows full body of subject with surrounding environment',
  },
  {
    id: 'medium-shot',
    label: ShotSizeEnum.MEDIUM_SHOT,
    description: 'Shows subject from waist up, good for conversations',
  },
  {
    id: 'medium-close-up',
    label: ShotSizeEnum.MEDIUM_CLOSE_UP,
    description: 'Shows subject from chest up, good for portraits',
  },
  {
    id: 'close-up',
    label: ShotSizeEnum.CLOSE_UP,
    description: 'Shows a subject\'s face or a small object in detail',
  },
  {
    id: 'extreme-close-up',
    label: ShotSizeEnum.EXTREME_CLOSE_UP,
    description: 'Shows extreme detail of a subject, like eyes or small objects',
  },
  {
    id: 'two-shot',
    label: ShotSizeEnum.TWO_SHOT,
    description: 'Shows two subjects in frame, good for interactions',
  },
  {
    id: 'detail-shot',
    label: ShotSizeEnum.DETAIL_SHOT,
    description: 'Focuses on a specific object or part of a subject',
  },
];

const IMAGE_MODELS: ImageModel[] = [
  { id: 'flux-dev', label: 'Flux Dev', description: 'Previous generation flux model' },
  { id: 'flux-pro', label: 'Flux Pro Ultra 1.1', description: 'Latest flux model with high quality and creativity' },
];

interface CreateImageDocumentParams {
  createDocument: any;
}

export const configureImageGeneration = (params?: CreateImageDocumentParams) => tool({
  description: 'Configure image generation settings or generate an image directly if prompt is provided. When prompt is provided, this will create an image artifact that shows generation progress in real-time. This tool understands various formats for parameters specified by users.',
  parameters: z.object({
    prompt: z.string().optional().describe('Detailed description of the image to generate. If provided, will immediately create image artifact and start generation'),
    style: z.string().optional().describe('Style of the image. Supports many formats: "realistic"/"реалистичный", "cinematic"/"кинематографический"/"кино", "anime"/"аниме", "cartoon"/"мультфильм", "sketch"/"эскиз", "painting"/"живопись", "steampunk"/"стимпанк", "fantasy"/"фэнтези", "sci-fi"/"фантастика", "horror"/"ужас", "minimalist"/"минимализм", "abstract"/"абстрактный", "portrait"/"портрет", "landscape"/"пейзаж", and many more available styles'),
    resolution: z.string().optional().describe('Image resolution. Accepts various formats: "1920x1080", "1920×1080", "1920 x 1080", "1920 на 1080", "1920*1080", "full hd", "fhd", "1080p", "square", "квадрат", "vertical", "вертикальное", "horizontal", "горизонтальное", etc.'),
    shotSize: z.string().optional().describe('Shot size/camera angle. Accepts: "close-up"/"крупный план"/"лицо", "medium-shot"/"средний план"/"по пояс", "long-shot"/"дальний план"/"общий план"/"во весь рост", "extreme-close-up"/"сверхкрупный план"/"макро", "portrait"/"портрет", "two-shot"/"двойной план", etc.'),
    model: z.string().optional().describe('AI model to use. Accepts: "flux-dev"/"dev"/"обычный", "flux-pro"/"pro"/"профессиональный"/"лучшее качество"/"высокое качество"'),
  }),
  execute: async ({ prompt, style, resolution, shotSize, model }) => {
    console.log('🔧 configureImageGeneration called with:', { prompt, style, resolution, shotSize, model });
    console.log('🔧 createDocument available:', !!params?.createDocument);
    
    const defaultResolution = RESOLUTIONS.find(r => r.width === 1024 && r.height === 1024)!;
    const defaultStyle: MediaOption = {id: "flux_steampunk", label: "Steampunk", description: "Steampunk style"};
    const defaultShotSize = SHOT_SIZES.find(s => s.id === 'long-shot')!;
    const defaultModel = IMAGE_MODELS.find(m => m.id === 'flux-dev')!;

    let styles: MediaOption[] = [];

    try {
      const response = await getStyles();
      if ("error" in response) {
        console.error(response.error);
      } else {
        styles = response.items.map(style => ({
              id: style.name,
              label: style.title ?? style.name,
              description: style.title ?? style.name,
        }));
      }
    } catch (err) {
      console.log(err);
    }
    
    // If no prompt provided, return configuration panel
    if (!prompt) {
      console.log('🔧 No prompt provided, returning configuration panel');
      const config: ImageGenerationConfig = {
        type: 'image-generation-settings',
        availableResolutions: RESOLUTIONS,
        availableStyles: styles,
        availableShotSizes: SHOT_SIZES,
        availableModels: IMAGE_MODELS,
        defaultSettings: {
          resolution: defaultResolution,
          style: defaultStyle,
          shotSize: defaultShotSize,
          model: defaultModel,
          seed: undefined
        }
      };
      return config;
    }

    console.log('🔧 ✅ PROMPT PROVIDED, CREATING IMAGE DOCUMENT:', prompt);
    console.log('🔧 ✅ PARAMS OBJECT:', !!params);
    console.log('🔧 ✅ CREATE DOCUMENT AVAILABLE:', !!params?.createDocument);

    // If prompt provided, create document directly with smart parameter parsing
    let selectedResolution = defaultResolution;
    if (resolution) {
      const foundResolution = findResolution(resolution);
      if (foundResolution) {
        selectedResolution = foundResolution;
        console.log('🔧 ✅ RESOLUTION MATCHED:', resolution, '->', selectedResolution.label);
      } else {
        console.log('🔧 ⚠️ RESOLUTION NOT FOUND:', resolution, 'using default:', defaultResolution.label);
      }
    }
    
    let selectedStyle = defaultStyle;
    if (style) {
      const foundStyle = findStyle(style, styles);
      if (foundStyle) {
        selectedStyle = foundStyle;
        console.log('🔧 ✅ STYLE MATCHED:', style, '->', selectedStyle.label);
      } else {
        console.log('🔧 ⚠️ STYLE NOT FOUND:', style, 'using default:', defaultStyle.label);
        console.log('🔧 📋 Available styles:', styles.map(s => s.label).slice(0, 5).join(', '), '...');
        
        // Additional fallback: try to find the most common style types
        const commonStyleFallbacks = [
          'flux_steampunk', 'steampunk', 'flux_realistic', 'realistic', 
          'flux_cinematic', 'cinematic', 'flux_anime', 'anime',
          'flux_fantasy', 'fantasy', 'default'
        ];
        
        for (const fallbackId of commonStyleFallbacks) {
          const fallbackStyle = styles.find(s => 
            s.id.toLowerCase().includes(fallbackId.toLowerCase()) ||
            s.label.toLowerCase().includes(fallbackId.toLowerCase())
          );
          if (fallbackStyle) {
            selectedStyle = fallbackStyle;
            console.log('🔧 🔄 FALLBACK STYLE FOUND:', fallbackId, '->', selectedStyle.label);
            break;
          }
        }
        
        // If still no style found, use the first available one
        if (selectedStyle === defaultStyle && styles.length > 0) {
          selectedStyle = styles[0];
          console.log('🔧 🔄 USING FIRST AVAILABLE STYLE:', selectedStyle.label);
        }
      }
    } else {
      // No style specified, try to find a good default from available styles
      const preferredDefaults = ['flux_steampunk', 'steampunk', 'flux_realistic', 'realistic'];
      for (const preferredId of preferredDefaults) {
        const preferredStyle = styles.find(s => 
          s.id.toLowerCase().includes(preferredId.toLowerCase()) ||
          s.label.toLowerCase().includes(preferredId.toLowerCase())
        );
        if (preferredStyle) {
          selectedStyle = preferredStyle;
          console.log('🔧 🎯 USING PREFERRED DEFAULT STYLE:', selectedStyle.label);
          break;
        }
      }
      
      // If no preferred default found, use first available
      if (selectedStyle === defaultStyle && styles.length > 0) {
        selectedStyle = styles[0];
        console.log('🔧 🎯 USING FIRST AVAILABLE AS DEFAULT:', selectedStyle.label);
      }
    }
    
    let selectedShotSize = defaultShotSize;
    if (shotSize) {
      const foundShotSizeId = findShotSize(shotSize);
      if (foundShotSizeId) {
        const foundShotSize = SHOT_SIZES.find(s => s.id === foundShotSizeId);
        if (foundShotSize) {
          selectedShotSize = foundShotSize;
          console.log('🔧 ✅ SHOT SIZE MATCHED:', shotSize, '->', selectedShotSize.label);
        }
      } else {
        console.log('🔧 ⚠️ SHOT SIZE NOT FOUND:', shotSize, 'using default:', defaultShotSize.label);
      }
    }
    
    let selectedModel = defaultModel;
    if (model) {
      const foundModelId = findModel(model);
      if (foundModelId) {
        const foundModel = IMAGE_MODELS.find(m => m.id === foundModelId);
        if (foundModel) {
          selectedModel = foundModel;
          console.log('🔧 ✅ MODEL MATCHED:', model, '->', selectedModel.label);
        }
      } else {
        console.log('🔧 ⚠️ MODEL NOT FOUND:', model, 'using default:', defaultModel.label);
      }
    }

    // Create title with all parameters for the document
    const artifactParams = JSON.stringify({
      prompt,
      style: selectedStyle,
      resolution: selectedResolution,
      shotSize: selectedShotSize,
      model: selectedModel,
    });

    // Create a human-readable title instead of JSON
    const humanReadableTitle = `AI Image: ${prompt.substring(0, 60)}${prompt.length > 60 ? '...' : ''}`;

    console.log('🔧 ✅ ARTIFACT PARAMS PREPARED:', {
      prompt: prompt.substring(0, 50) + '...',
      resolution: selectedResolution.label,
      style: selectedStyle.label,
      shotSize: selectedShotSize.label,
      model: selectedModel.label
    });

    if (params?.createDocument) {
      console.log('🔧 ✅ CALLING CREATE DOCUMENT WITH KIND: image');
      try {
        // Call createDocument if available - передаем параметры через content поле
        const result = await params.createDocument.execute({
          title: artifactParams, // Возвращаем JSON для сервера
          kind: 'image'
        });
        
        console.log('🔧 ✅ CREATE DOCUMENT RESULT:', result);
        
        // Create user-friendly message about the parameters being used
        const parametersUsed = [];
        if (resolution) parametersUsed.push(`разрешение ${selectedResolution.label}`);
        if (style) parametersUsed.push(`стиль "${selectedStyle.label}"`);
        if (shotSize) parametersUsed.push(`план "${selectedShotSize.label}"`);
        if (model) parametersUsed.push(`модель "${selectedModel.label}"`);
        
        const parametersMessage = parametersUsed.length > 0 
          ? ` Использую ${parametersUsed.join(', ')}.`
          : '';
        
        return {
          ...result,
          message: `Я создаю изображение с описанием: "${prompt}".${parametersMessage} Артефакт создан и генерация началась.`
        };
      } catch (error) {
        console.error('🔧 ❌ CREATE DOCUMENT ERROR:', error);
        console.error('🔧 ❌ ERROR STACK:', error instanceof Error ? error.stack : 'No stack');
        throw error;
      }
    }

    console.log('🔧 ❌ CREATE DOCUMENT NOT AVAILABLE, RETURNING FALLBACK');
    // Fallback to simple message
    return {
      message: `Я создам изображение с описанием: "${prompt}". Однако артефакт не может быть создан - createDocument недоступен.`,
      parameters: {
        title: artifactParams, // Возвращаем JSON для сервера
        kind: 'image'
      }
    };
  },
});
