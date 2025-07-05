# Image Generation (text-to-image)

## Recent Updates

- **January 15, 2025**: [Optimized artifact content structure](artifact-content-structure.md) - Reduced storage by 80%
- **January 15, 2025**: [Phase 1 Optimization](../../maintenance/changelog/optimize-image-artifact-content-phase1.md) - Removed redundant data from artifacts

## Overview

Image generation в проекте реализована через современную архитектуру с использованием паттерна "стратегия" (strategy pattern). Поддерживается только режим text-to-image (генерация по текстовому prompt).

- Используется единая точка входа: `generateImageWithStrategy('text-to-image', params)`
- Все параметры и логика генерации централизованы в папке `lib/ai/api/image-generation/`
- Артефакты создаются через handler `artifacts/image/server.ts`, который вызывает только text-to-image стратегию

## Архитектура

- `generateImageWithStrategy(type, params)` — основная функция, выбирающая стратегию по типу
- `TextToImageStrategy` — реализует генерацию по prompt
- Все параметры (prompt, model, style, resolution, shotSize, negativePrompt, seed, batchSize) передаются явно
- Нет поддержки image-to-image, sourceImageId, file и т.д. (можно добавить позже)

## Пример использования

```ts
import { generateImageWithStrategy } from "@/lib/ai/api/image-generation";

const result = await generateImageWithStrategy("text-to-image", {
  prompt: "A futuristic cityscape at sunset",
  model: { id: "flux-dev", label: "Flux Dev" },
  style: { id: "flux_steampunk", label: "Steampunk" },
  resolution: {
    width: 1024,
    height: 1024,
    label: "1024x1024",
    aspectRatio: "1:1",
    qualityType: "hd",
  },
  shotSize: { id: "long_shot", label: "Long Shot" },
  negativePrompt: "",
  seed: 12345,
  batchSize: 1,
});
```

## Handler для артефактов

В `artifacts/image/server.ts` используется только text-to-image:

```ts
const result = await generateImageWithStrategy("text-to-image", params);
```

## Особенности

- Нет dual-mode, нет polling, только text-to-image
- Все параметры валидируются стратегией
- Легко расширяется для новых режимов (image-to-image и др.)

## Расширение

Чтобы добавить новые режимы (например, image-to-image), реализуйте новую стратегию и зарегистрируйте её в фабрике стратегий.
