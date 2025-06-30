# Video Generation Strategy Pattern Architecture

## Overview

Система генерации видео теперь использует паттерн Strategy для легкого расширения и добавления новых типов генерации. Архитектура решает следующие проблемы:

1. **Унифицированная обработка разных типов генерации** (text-to-video, image-to-video, video-to-video)
2. **Легкое добавление новых типов** без изменения основного кода
3. **Специфичные валидации** для каждого типа генерации
4. **Разные payload структуры** для разных API endpoints

## Архитектура

### Core Components

```typescript
// Base interface for all strategies
interface VideoGenerationStrategy {
  readonly type: string;
  readonly requiresSourceImage: boolean;
  readonly requiresPrompt: boolean;
  generatePayload(params: VideoGenerationParams | ImageToVideoParams): any;
  validate(params: VideoGenerationParams | ImageToVideoParams): {
    valid: boolean;
    error?: string;
  };
}
```

### Available Strategies

#### 1. Text-to-Video Strategy

- **Type**: `text-to-video`
- **Requirements**: Prompt обязателен, source image не нужен
- **Models**: Sora, LTX
- **Payload Format**: Media format с `type: "media"`

```typescript
{
  type: "media",
  template_name: null,
  style_name: "flux_watercolor",
  config: {
    prompt: "Ocean waves crashing on beach",
    negative_prompt: "",
    width: 1280,
    height: 720,
    aspect_ratio: "16:9",
    duration: 5,
    frame_rate: 30,
    // ... other parameters
  }
}
```

#### 2. Image-to-Video Strategy

- **Type**: `image-to-video`
- **Requirements**: Source image обязателен, prompt опционален
- **Models**: VEO2, VEO3, KLING 2.1
- **Payload Format**: Params format с `params.config`

```typescript
{
  params: {
    config: {
      prompt: "animate this image naturally", // Default if empty
      duration: 8,
      width: 1920,
      height: 1080,
      aspect_ratio: "16:9",
      // ... other parameters
    },
    file_ids: ["image-file-id"],
    references: [{
      type: "source",
      reference_url: "https://image-url.com/image.png"
    }],
    generation_config: {
      name: "google-cloud/veo2",
      type: "image_to_video",
      // ... model-specific config
    }
  }
}
```

#### 3. Video-to-Video Strategy (Future)

- **Type**: `video-to-video`
- **Requirements**: Source video обязателен, prompt обязателен
- **Use Cases**: Style transfer, effects, transformations

## Implementation

### Strategy Factory

```typescript
export class VideoGenerationStrategyFactory {
  private strategies = new Map<string, VideoGenerationStrategy>();

  constructor() {
    this.registerStrategy(new TextToVideoStrategy());
    this.registerStrategy(new ImageToVideoStrategy());
    this.registerStrategy(new VideoToVideoStrategy());
  }

  registerStrategy(strategy: VideoGenerationStrategy): void {
    this.strategies.set(strategy.type, strategy);
  }

  getStrategy(type: string): VideoGenerationStrategy | null {
    return this.strategies.get(type) || null;
  }
}
```

### Main Generation Function

```typescript
export async function generateVideoWithStrategy(
  generationType: string,
  params: VideoGenerationParams | ImageToVideoParams
): Promise<VideoGenerationResult> {
  const factory = new VideoGenerationStrategyFactory();
  const strategy = factory.getStrategy(generationType);

  if (!strategy) {
    return { success: false, error: `Unsupported type: ${generationType}` };
  }

  // Validate parameters
  const validation = strategy.validate(params);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Special handling for image-to-video with direct FormData
  if (strategy.type === "image-to-video" && params.sourceImageFile) {
    return await generateImageToVideoDirectly(params);
  }

  // Generate JSON payload for text-to-video and other cases
  const payload = strategy.generatePayload(params);

  // Use unified endpoint for all generation types
  const endpoint = "/api/v1/projects/generate";

  // Make API call with JSON payload
  const response = await fetch(`${config.url}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  // Process and return result
}
```

## UI Integration

### Form Validation Fix

Кнопка генерации теперь корректно валидируется для разных типов:

```tsx
disabled={
  disabled ||
  isGenerating ||
  (formData.generationType === 'text-to-video' && !formData.prompt.trim()) ||
  (formData.generationType === 'image-to-video' && !formData.sourceImage)
}
```

### Animation Description

- **Text-to-Video**: Prompt обязателен
- **Image-to-Video**: Animation Description опционален (default: "animate this image naturally")

## Adding New Generation Types

### Example: Audio-to-Video Strategy

```typescript
export class AudioToVideoStrategy implements VideoGenerationStrategy {
  readonly type = "audio-to-video";
  readonly requiresSourceImage = false;
  readonly requiresPrompt = true;

  validate(params: any): { valid: boolean; error?: string } {
    if (!params.sourceAudioId && !params.sourceAudioUrl) {
      return {
        valid: false,
        error: "Source audio required for audio-to-video",
      };
    }
    if (!params.prompt?.trim()) {
      return { valid: false, error: "Prompt required for audio-to-video" };
    }
    return { valid: true };
  }

  generatePayload(params: any): any {
    return {
      type: "audio_sync",
      audio_source: params.sourceAudioId || params.sourceAudioUrl,
      visual_prompt: params.prompt,
      // ... audio-specific parameters
    };
  }
}
```

### Registration

```typescript
// In factory constructor or configuration
factory.registerStrategy(new AudioToVideoStrategy());
```

### UI Extension

```tsx
// Add new tab in VideoGeneratorForm
<TabsTrigger
  value="audio-to-video"
  className="flex items-center gap-2"
>
  <AudioIcon className="size-4" />
  Audio to Video
</TabsTrigger>
```

## Benefits

1. **Модульность**: Каждый тип генерации инкапсулирован в отдельной стратегии
2. **Расширяемость**: Новые типы добавляются без изменения существующего кода
3. **Валидация**: Специфичные правила валидации для каждого типа
4. **Поддержка**: Легко поддерживать и тестировать отдельные стратегии
5. **Унификация**: Единый интерфейс для всех типов генерации

## Files Modified

- `lib/ai/api/video-generation-strategies.ts` - Новая архитектура стратегий
- `app/api/generate/video/route.ts` - Интеграция с strategy pattern
- `app/tools/video-generator/components/video-generator-form.tsx` - Исправление валидации
- `app/tools/video-generator/hooks/use-video-generator.ts` - Поддержка опционального prompt

## Testing

```bash
# Test text-to-video generation
curl -X POST /api/generate/video \
  -H "Content-Type: application/json" \
  -d '{"generationType": "text-to-video", "prompt": "Ocean waves", "model": "azure-openai/sora"}'

# Test image-to-video generation
curl -X POST /api/generate/video \
  -F "generationType=image-to-video" \
  -F "sourceImage=@image.jpg" \
  -F "prompt=" \
  -F "model=google-cloud/veo2"
```

## Next Steps

1. Добавить поддержку video-to-video генерации
2. Реализовать audio-to-video стратегию
3. Добавить batch generation strategies
4. Создать configuration-based strategy registration
5. Реализовать strategy-specific caching
