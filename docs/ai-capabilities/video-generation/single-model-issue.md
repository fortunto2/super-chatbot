# Проблема: Только одна видео модель в компоненте настроек

## Симптомы

Из логов видно следующее поведение:
```
Error fetching video models: Error: Failed to fetch models: Not Found
🎬 ✅ Loaded video models: [ 'comfyui/ltx' ]
```

В компоненте настроек видео генерации отображается только одна модель: `comfyui/ltx`, хотя согласно документации должны быть доступны множество моделей.

## Анализ проблемы

### 1. Несоответствие API Endpoints ✅ ИСПРАВЛЕНО

**Проблема**: В коде есть конфликт между endpoint'ами для получения моделей:

```typescript
// В lib/config/superduperai.ts
export const API_ENDPOINTS = {
  LIST_MODELS: '/api/v1/generation-config',
}
```

**Результат**: Функция `getAvailableVideoModels()` использовала неправильный endpoint и получала ошибку 404 "Not Found".

### 2. Несоответствие формата ответа API ✅ ИСПРАВЛЕНО

**Проблема**: После исправления endpoint'а возникла новая ошибка в строке 82:

```
> 82 |     const videoConfigs = data.filter((config: any) => 
     |                              ^
```

**Причина**: Старая система ожидала прямой массив от `fetch().json()`, но новая система HTTP клиента возвращает структуру `{ success: boolean, data: T }`.

```typescript
// Старый код (проблемный):
const data = await response.json(); // Ожидал массив напрямую
const videoConfigs = data.filter(...); // Ошибка если data не массив

// Новый код (исправленный):
const response = await apiGet(API_ENDPOINTS.LIST_MODELS);
const data = response.data; // Извлекаем data из обертки
if (!Array.isArray(data)) { // Проверяем что это массив
  throw new Error('API returned invalid data format');
}
```

### 3. ✅ ИСПРАВЛЕНО: Неправильная структура API ответа

**Основная проблема**: API SuperDuperAI возвращает пагинированный ответ:

```json
{
  "items": [...],
  "total": 21,
  "limit": 5,
  "offset": 0,
  "next": {...}
}
```

А не массив или `{ data: [...] }`. 

**Финальное исправление**:

```typescript
// БЫЛО (неправильно):
const data = response.data; // Ожидали массив
const videoConfigs = data.filter(...); // data - объект с полем items!

// СТАЛО (правильно):
const apiResponse = response.data;
if (!apiResponse.items) {
  throw new Error('API returned invalid response structure');
}
const data = apiResponse.items; // Извлекаем массив из поля items
const videoConfigs = data.filter(...); // Теперь data - массив
```

### 4. Фактические модели в API

**Обнаружено**: API содержит 7 видео моделей для image-to-video:

- `google-cloud/veo3` - Google VEO3 (Image-to-Video) - $3/sec
- `google-cloud/veo2` - Google VEO2 (Image-to-Video) - $2/sec  
- `fal-ai/minimax/video-01/image-to-video` - Minimax
- `fal-ai/minimax/video-01-live/image-to-video` - Minimax Live
- `fal-ai/kling-video/v2.1/standard/image-to-video` - KLING 2.1 Standard
- `fal-ai/kling-video/v2.1/pro/image-to-video` - KLING 2.1 Pro  
- `comfyui/ltx` - LTX (Local) - $0.4/sec

### 5. ✅ FIXED: Wrong Generate Prompt for Video 

**Problem**: When clicking "Generate Video" button, the system was creating a prompt for **image generation** instead of video generation.

**Root Cause**: In `components/artifacts/media-settings.tsx`, the `handleGenerate` function had hardcoded Russian text "Создай изображение" (Create image) for all media types.

```typescript
// BEFORE (incorrect):
const generateMessage = `Создай изображение: ${prompt}. Используй...`;

// AFTER (fixed):
const mediaType = isVideoConfig ? 'video' : 'image';
const generateMessage = `Generate ${mediaType}: ${prompt}. Use...`;
```

**Resolution**: 
- Updated `handleGenerate` to detect media type dynamically
- Changed all text to English as per project rules
- Now correctly generates "Generate video:" for video generation
- And "Generate image:" for image generation

### 3. Две параллельные системы

В проекте используются две системы для получения моделей:

#### Старая система (проблемная):
- Файл: `lib/config/superduperai.ts`
- Функция: `getAvailableVideoModels()`
- Endpoint: `/api/v1/generation-configs` (с 's')
- Результат: Ошибка 404, fallback к LTX

#### Новая система (работающая):
- Файл: `lib/ai/api/config-cache.ts`
- Функция: `getCachedGenerationConfigs()`
- Endpoint: `/api/v1/generation-config` (без 's')
- Результат: Успешно получает модели

### 3. Fallback к единственной модели

Когда `getAvailableVideoModels()` получает ошибку, выполняется fallback:

```typescript
catch (error) {
  console.error('Error fetching video models:', error);
  
  // AICODE-NOTE: Ultimate fallback to ensure system still works
  return [
    {
      id: 'comfyui/ltx',
      name: 'LTX Video',
      description: 'LTX Video - High quality video generation by Lightricks',
      maxDuration: 30,
      maxResolution: { width: 1216, height: 704 },
      supportedFrameRates: [30],
      pricePerSecond: 0.4,
      workflowPath: 'LTX/default.json',
      supportedAspectRatios: ['16:9', '1:1', '9:16', '21:9'],
      supportedQualities: ['hd', 'sd'],
    },
  ];
}
```

Это объясняет, почему в компоненте настроек видна только одна модель.

## Решения

### ✅ Исправление 1: Правильный endpoint (ПРИМЕНЕНО)

В файле `lib/config/superduperai.ts` изменить:

```typescript
export const API_ENDPOINTS = {
  LIST_MODELS: '/api/v1/generation-config',
}
```

### ✅ Исправление 2: Правильная обработка ответа API (ПРИМЕНЕНО)

Обновить функцию `getAvailableVideoModels()`:

```typescript
const { apiGet } = await import('@/lib/ai/api/http-client');
const response = await apiGet(API_ENDPOINTS.LIST_MODELS);

if (!response.success) {
  throw new Error(`Failed to fetch models: ${response.error}`);
}

const data = response.data;

if (!Array.isArray(data)) {
  console.error('API returned non-array data:', data);
  throw new Error('API returned invalid data format');
}
```

### Решение 3: Унифицировать на новую систему (Дополнительно рекомендуется)

Заменить использование старой системы на новую во всех местах:

#### В `lib/ai/tools/configure-video-generation.ts`:
```typescript
import { getCachedGenerationConfigs } from '@/lib/ai/api/config-cache';
const allConfigs = await getCachedGenerationConfigs();
const videoConfigs = allConfigs.filter(c => c.type === 'image_to_video');
```

#### В `artifacts/video/server.ts`:
```typescript
import { getCachedGenerationConfigs } from '@/lib/ai/api/config-cache';
const allConfigs = await getCachedGenerationConfigs();
const videoConfigs = allConfigs.filter(c => c.type === 'image_to_video');
```

### Решение 4: Проверить переменные окружения

Убедиться что установлены правильные переменные:

```env
SUPERDUPERAI_TOKEN=your_token_here
SUPERDUPERAI_URL=https://dev-editor.superduperai.co
```

## Диагностические команды

### Проверить новую систему:
```bash
curl "http://localhost:3000/api/config/generation?action=video-models"
```

### Проверить статус кэша:
```bash
curl "http://localhost:3000/api/config/generation?action=cache-status"
```

### Принудительно обновить кэш:
```bash
curl "http://localhost:3000/api/config/generation?action=refresh"
```

### Проверить доступность SuperDuperAI API напрямую:
```bash
curl -H "Authorization: Bearer $SUPERDUPERAI_TOKEN" \
  "https://dev-editor.superduperai.co/api/v1/generation-config"
```

## Ожидаемые модели после исправления

После решения проблемы должны быть доступны:

### Бюджетные модели (Non-VIP):
- **LTX** (`comfyui/ltx`) - $0.40/sec
- **LipSync** (`comfyui/lip-sync`) - $0.40/sec

### Премиум модели (VIP Required):
- **Google VEO3** (`google-cloud/veo3`) - $3.00/sec
- **Google VEO2** (`google-cloud/veo2`) - $2.00/sec  
- **KLING 2.1** (`fal-ai/kling-video/v2.1/*`) - $1.00-2.00/sec
- **Minimax** (`fal-ai/minimax/*`) - $1.20/sec
- **OpenAI Sora** (`azure-openai/sora`) - $2.00/sec

## Временное решение

Пока проблема не исправлена, можно проверить доступные модели через новую систему:

```typescript
// В браузерной консоли на странице приложения
fetch('/api/config/generation?action=video-models')
  .then(r => r.json())
  .then(data => console.log('Available models:', data));
```

## Связанные файлы

- `lib/config/superduperai.ts` - Старая система с проблемным endpoint
- `lib/ai/api/config-cache.ts` - Новая рабочая система
- `lib/ai/tools/configure-video-generation.ts` - Использует старую систему
- `artifacts/video/server.ts` - Использует старую систему
- `docs/ai-capabilities/video-generation/models-guide.md` - Документация по моделям

## Приоритет исправления

Эта проблема критична, так как ограничивает функциональность видео генерации одной моделью, лишая пользователей выбора между бюджетными и премиум опциями. 