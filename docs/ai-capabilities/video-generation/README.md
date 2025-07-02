# Video Generation (text-to-video)

## Overview

Video generation реализована через современную архитектуру с использованием паттерна "стратегия" (strategy pattern). Поддерживается только режим text-to-video (генерация по текстовому prompt).

- Используется единая точка входа: `generateVideoWithStrategy('text-to-video', params)`
- Все параметры и логика генерации централизованы в папке `lib/ai/api/video-generation/`
- Артефакты создаются через handler `artifacts/video/server.ts`, который вызывает только text-to-video стратегию

## Архитектура

- `generateVideoWithStrategy(type, params)` — основная функция, выбирающая стратегию по типу
- `TextToVideoStrategy` — реализует генерацию по prompt
- Все параметры (prompt, model, style, resolution, shotSize, frameRate, duration, negativePrompt, seed) передаются явно
- Нет поддержки image-to-video, video-to-video, dual-mode и т.д. (можно добавить позже)

## Пример использования

```ts
import { generateVideoWithStrategy } from "@/lib/ai/api/video-generation";

const result = await generateVideoWithStrategy("text-to-video", {
  prompt: "A futuristic cityscape at sunset",
  model: { id: "comfyui/ltx", label: "LTX Video" },
  style: { id: "flux_steampunk", label: "Steampunk" },
  resolution: {
    width: 1216,
    height: 704,
    label: "HD",
    aspectRatio: "16:9",
    qualityType: "hd",
  },
  shotSize: { id: "long-shot", label: "Long Shot" },
  frameRate: 30,
  duration: 5,
  negativePrompt: "",
  seed: 12345,
});
```

## Handler для артефактов

В `artifacts/video/server.ts` используется только text-to-video:

```ts
const result = await generateVideoWithStrategy("text-to-video", params);
```

## Особенности

- Нет dual-mode, нет image-to-video, только text-to-video
- Все параметры валидируются стратегией
- Легко расширяется для новых режимов (image-to-video и др.)

## Расширение

Чтобы добавить новые режимы (например, image-to-video), реализуйте новую стратегию и зарегистрируйте её в фабрике стратегий.
