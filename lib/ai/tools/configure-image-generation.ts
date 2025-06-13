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

// Style aliases for better understanding
const STYLE_ALIASES: Record<string, string> = {
  // Common style terms
  "реалистичный": "realistic",
  "реалистичное": "realistic", 
  "реализм": "realistic",
  "realistic": "realistic",
  "natural": "realistic",
  "натуральный": "realistic",
  "обычный": "realistic",
  
  "яркий": "vivid",
  "яркое": "vivid",
  "насыщенный": "vivid",
  "vivid": "vivid",
  "colorful": "vivid",
  "цветной": "vivid",
  "красочный": "vivid",
  
  "кинематографический": "cinematic",
  "кино": "cinematic",
  "киношный": "cinematic", 
  "cinematic": "cinematic",
  "movie": "cinematic",
  "film": "cinematic",
  "фильм": "cinematic",
  
  "аниме": "anime",
  "anime": "anime",
  "manga": "anime",
  "манга": "anime",
  "японский": "anime",
  "мультяшный": "anime",
  
  "мультфильм": "cartoon",
  "мультик": "cartoon",
  "cartoon": "cartoon",
  "animated": "cartoon",
  "анимация": "cartoon",
  
  "эскиз": "sketch",
  "набросок": "sketch",
  "sketch": "sketch",
  "drawing": "sketch",
  "рисунок": "sketch",
  "карандаш": "sketch",
  
  "живопись": "painting",
  "картина": "painting",
  "painting": "painting",
  "oil": "painting",
  "масло": "painting",
  "художественный": "painting",
  
  "пиксель": "pixel",
  "пиксельный": "pixel",
  "pixel": "pixel",
  "8-bit": "pixel",
  "ретро": "pixel",
  "retro": "pixel",
  
  // Specific art styles
  "стимпанк": "steampunk",
  "steampunk": "steampunk",
  "стим": "steampunk",
  
  "фэнтези": "fantasy",
  "fantasy": "fantasy",
  "магический": "fantasy",
  "сказочный": "fantasy",
  
  "научная фантастика": "sci-fi",
  "sci-fi": "sci-fi",
  "фантастика": "sci-fi",
  "футуристический": "sci-fi",
  "космический": "sci-fi",
  
  "ужас": "horror",
  "horror": "horror",
  "страшный": "horror",
  "темный": "horror",
  "мрачный": "horror",
  
  "минимализм": "minimalist",
  "минималистический": "minimalist",
  "minimalist": "minimalist",
  "простой": "minimalist",
  "чистый": "minimalist",
  
  "абстрактный": "abstract",
  "abstract": "abstract",
  "абстракция": "abstract",
  
  "портрет": "portrait",
  "portrait": "portrait",
  "лицо": "portrait",
  "человек": "portrait",
  
  "пейзаж": "landscape",
  "landscape": "landscape",
  "природа": "landscape",
  "природный": "landscape",
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

// Function to find style by various formats and aliases
function findStyle(input: string, availableStyles: MediaOption[]): MediaOption | null {
  if (!input || !availableStyles.length) return null;
  
  const normalizedInput = input.toLowerCase().trim();
  
  // 1. Check direct ID match
  const directIdMatch = availableStyles.find(s => s.id.toLowerCase() === normalizedInput);
  if (directIdMatch) return directIdMatch;
  
  // 2. Check exact label match
  const exactLabelMatch = availableStyles.find(s => s.label.toLowerCase() === normalizedInput);
  if (exactLabelMatch) return exactLabelMatch;
  
  // 3. Check aliases
  const aliasMatch = STYLE_ALIASES[normalizedInput];
  if (aliasMatch) {
    // Try to find style by alias
    const styleByAlias = availableStyles.find(s => 
      s.id.toLowerCase().includes(aliasMatch.toLowerCase()) ||
      s.label.toLowerCase().includes(aliasMatch.toLowerCase())
    );
    if (styleByAlias) return styleByAlias;
  }
  
  // 4. Partial match in label or id
  const partialMatch = availableStyles.find(s => 
    s.label.toLowerCase().includes(normalizedInput) ||
    s.id.toLowerCase().includes(normalizedInput) ||
    normalizedInput.includes(s.label.toLowerCase()) ||
    normalizedInput.includes(s.id.toLowerCase())
  );
  if (partialMatch) return partialMatch;
  
  // 5. Check if input contains style keywords
  for (const [alias, styleKeyword] of Object.entries(STYLE_ALIASES)) {
    if (normalizedInput.includes(alias)) {
      const keywordMatch = availableStyles.find(s => 
        s.id.toLowerCase().includes(styleKeyword.toLowerCase()) ||
        s.label.toLowerCase().includes(styleKeyword.toLowerCase())
      );
      if (keywordMatch) return keywordMatch;
    }
  }
  
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
