# AI Tools Architecture

## Основные компоненты

### 1. Типы (`lib/types/media-settings.ts`)

- `MediaOption` - базовый тип для выборов (стиль, качество)
- `MediaResolution` - разрешение с соотношением сторон
- `ImageGenerationConfig` - настройки для изображений

### 2. Инструменты (`lib/ai/tools/`)

- `configureImageGeneration` - настройки генерации изображений
- `configureVideoGeneration` - настройки генерации видео
- `listVideoModels` - список доступных видео моделей
- `findBestVideoModel` - автоматический выбор оптимальной видео модели
- `enhancePrompt` - улучшение промптов с переводом и оптимизацией
- `diagnoseImageGeneration` - диагностика проблем с генерацией изображений
- Все инструменты используют AI SDK `tool()` функцию

### 3. Компоненты

- `MediaSettings` - универсальный UI для настроек изображений

## Создание нового инструмента

### Базовый пример

```typescript
// lib/ai/tools/my-tool.ts
import { tool } from "ai";
import { z } from "zod";

export const myTool = tool({
  description: "Description of what the tool does",
  parameters: z.object({
    param1: z.string().describe("Parameter description"),
    param2: z.number().optional().describe("Optional parameter"),
  }),
  execute: async ({ param1, param2 }) => {
    // Tool logic here
    return { result: "data" };
  },
});
```

### Добавление в роут

```typescript
// app/(chat)/api/chat/route.ts
import { myTool } from '@/lib/ai/tools/my-tool';

experimental_activeTools: [
  'myTool',
],

tools: {
  myTool,
}
```

## Инструмент для запросов к внешнему серверу

### Создание API инструмента

```typescript
// lib/ai/tools/external-api.ts
import { tool } from "ai";
import { z } from "zod";

export const callExternalAPI = tool({
  description: "Makes requests to your external server with user data",
  parameters: z.object({
    endpoint: z.string().describe("API endpoint to call"),
    userData: z.string().describe("User data to send"),
    method: z.enum(["GET", "POST"]).optional().default("POST"),
  }),
  execute: async ({ endpoint, userData, method }) => {
    try {
      const baseUrl =
        process.env.EXTERNAL_API_BASE_URL || "http://localhost:3001";

      const requestOptions: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EXTERNAL_API_TOKEN}`,
        },
      };

      if (method === "POST") {
        requestOptions.body = JSON.stringify({
          data: userData,
          timestamp: new Date().toISOString(),
          source: "chatbot",
        });
      }

      const response = await fetch(`${baseUrl}${endpoint}`, requestOptions);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
```

### Переменные окружения

```env
# .env.local
EXTERNAL_API_BASE_URL=http://your-server.com/api
EXTERNAL_API_TOKEN=your-secret-token
```

### Использование в чате

Пользователь: "Получи данные о пользователе ID 123"

ИИ вызовет инструмент:

```typescript
callExternalAPI({
  endpoint: "/users/123",
  userData: "user_id: 123",
  method: "GET",
});
```

### Обработка ответа в компоненте

```typescript
// components/message.tsx
if (toolName === "callExternalAPI" && state === "result") {
  const { result } = toolInvocation;

  if (result.success) {
    return (
      <div className="p-4 bg-green-50 rounded-lg">
        <h4>Данные получены с сервера:</h4>
        <pre className="text-sm">{JSON.stringify(result.data, null, 2)}</pre>
      </div>
    );
  } else {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <h4>Ошибка запроса:</h4>
        <p>{result.error}</p>
      </div>
    );
  }
}
```

## Примеры использования инструментов

### 1. Улучшение промптов (enhancePrompt)

```typescript
// Пользователь: "улучши мой промпт: мальчик с мячиком"
enhancePrompt({
  originalPrompt: "мальчик с мячиком",
  mediaType: "image",
  enhancementLevel: "detailed",
  includeNegativePrompt: true
});

// Результат:
// {
//   enhancedPrompt: "boy with ball, professional photography, sharp focus, excellent composition, masterpiece quality, best quality, ultra detailed",
//   negativePrompt: "blurry, low quality, pixelated, distorted, bad anatomy, poorly drawn, amateur, low resolution, artifacts, noise",
//   improvements: ["Translated Russian words to English", "Added quality terms", ...]
// }
```

### 2. Получение данных пользователя

```typescript
// Пользователь: "Покажи мою статистику"
callExternalAPI({
  endpoint: "/user/stats",
  userData: JSON.stringify({ userId: userContext.id }),
  method: "GET",
});
```

### 2. Отправка пользовательских данных

```typescript
// Пользователь: "Сохрани мои настройки: theme=dark, lang=ru"
callExternalAPI({
  endpoint: "/user/settings",
  userData: JSON.stringify({ theme: "dark", lang: "ru" }),
  method: "POST",
});
```

### 3. Поиск в базе данных

```typescript
// Пользователь: "Найди товары по запросу 'телефон'"
callExternalAPI({
  endpoint: "/search",
  userData: JSON.stringify({ query: "телефон", category: "electronics" }),
  method: "POST",
});
```

## Структура внешнего API

Ваш сервер должен принимать запросы в формате:

```typescript
// POST /api/endpoint
{
  "data": "user input data",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "source": "chatbot"
}
```

И возвращать:

```typescript
{
  "status": "success",
  "data": { /* ваши данные */ },
  "message": "Optional message"
}
```
