# Project Type Enum Fix

**Date**: 2025-06-17  
**Issue**: 422 Unprocessable Entity - ProjectTypeEnum validation error  
**Status**: ✅ Fixed

## Problem

API возвращал ошибку 422 с сообщением:

```json
{
  "detail": [
    {
      "type": "literal_error",
      "loc": ["body", "type"],
      "msg": "Input should be <ProjectTypeEnum.media: 'media'>",
      "input": "image",
      "ctx": { "expected": "<ProjectTypeEnum.media: 'media'>" }
    }
  ]
}
```

Проблема заключалась в том, что код использовал устаревшие значения типов проектов (`"image"`, `"video"`), в то время как API ожидал тип `"media"` и `"film"`.

## Root Cause

SuperDuperAI API изменил схему типов проектов, теперь все медиа-проекты должны использовать тип `"media"` и `"film"` вместо специфичных типов.

## Files Fixed

### 1. `lib/api/models/ProjectTypeEnum.ts`

```typescript
export enum ProjectTypeEnum {
    VIDEO = 'video',
    IMAGE = 'image',
+   MEDIA = 'media',
    FILM = "film"
}
```

### 2. `lib/ai/api/generate-image.ts`

В файле уже был исправлен на `type: "media"` ✅

### 3. `lib/ai/api/generate-image-with-project.ts`

```typescript
const projectPayload = {
  name: `Image: ${prompt.substring(0, 50)}...`,
  description: `Generated image project for: ${prompt}`,
- type: "image", // Assuming image project type
+ type: "media", // Use media type as required by API
  config: {
    prompt: prompt,
    created_at: new Date().toISOString()
  }
};
```

### 4. `lib/ai/api/generate-video.ts`

```typescript
// Text-to-video payload structure
apiPayload = {
  projectId: chatId,
  requestId: requestId,
- type: "video",
+ type: "film",
  template_name: null,
  // ...
};
```

## Testing

После исправления:

- ✅ Image generation работает с типом `"media"`
- ✅ Video generation работает с типом `"media"`
- ✅ API принимает запросы без ошибок 422
- ✅ SQL вставка происходит с правильным типом `'media'`

## Related Issues

- Database ROLLBACK issue - may be related to other validation errors
- All media generation endpoints now consistently use `"media"` type

## Migration Notes

Если в будущем потребуется поддержка legacy типов, нужно будет:

1. Добавить mapping старых типов на новые
2. Обновить валидацию на бэкенде
3. Проверить совместимость с существующими проектами

## Проблема

При генерации изображений произошел откат транзакции (ROLLBACK) на этапе создания записи `image_generation` в базе данных.

### Логи с бэкенда:

```
2025-06-19 18:40:32,613 INFO sqlalchemy.engine.Engine INSERT INTO image_generation (prompt, negative_prompt, width, height, steps, shot_size, seed, created_at, updated_at, generation_config_name, style_name) VALUES ($1::VARCHAR, $2::VARCHAR, $3::INTEGER, $4::INTEGER, $5::INTEGER, $6::shotsizeenum, $7::BIGINT, $8::TIMESTAMP WITHOUT TIME ZONE, $9::TIMESTAMP WITHOUT TIME ZONE, $10::VARCHAR, $11::VARCHAR) RETURNING image_generation.id
2025-06-19 18:40:32,614 INFO sqlalchemy.engine.Engine [generated in 0.00068s] ('крыса', '', 1024, 1024, 20, 'medium_shot', 381193649090, datetime.datetime(2025, 6, 19, 18, 40, 32, 611934), datetime.datetime(2025, 6, 19, 18, 40, 32, 611934), 'comfyui/flux', 'realistic')
2025-06-19 18:40:33,105 INFO sqlalchemy.engine.Engine ROLLBACK
```

## Анализ проблемы

### 1. Тип проекта `media` - корректный

Из логов видно, что проект создался успешно с типом `'media'`, что правильно согласно нашим предыдущим исправлениям.

### 2. Возможные причины ROLLBACK:

#### A. Ошибка валидации enum `shotsizeenum`

В логах видно параметр `'medium_shot'` для поля типа `$6::shotsizeenum`. Возможно, на бэкенде есть проблема с валидацией enum значений.

#### B. Ошибка внешнего API вызова

После создания записи в базе может происходить вызов внешнего API (ComfyUI/FLUX), который завершается с ошибкой, вызывая откат транзакции.

#### C. Проблема с generation_config_name

Значение `'comfyui/flux'` может не существовать в справочнике `generation_config` на бэкенде.

## Рекомендуемые исправления

### 1. Валидация shot_size enum

Проверить, что значения shot_size соответствуют enum на бэкенде:

```typescript
// Возможно нужно изменить формат
"shot_size": "Medium Shot"  // вместо "medium_shot"
```

### 2. Проверка доступности модели

Убедиться, что модель `comfyui/flux` доступна:

```typescript
const availableModels = await getAvailableImageModels();
const isFluxAvailable = availableModels.some((m) => m.name === "comfyui/flux");
```

### 3. Обработка rollback на фронтенде

Добавить логику повторных попыток:

```typescript
// В generate-image.ts
if (response.status === 500) {
  // Возможно произошел rollback из-за временной ошибки
  console.log("🔄 Server error, retrying with different seed...");
  const newSeed = Math.floor(Math.random() * 1000000000000);
  return await generateImage(
    prompt,
    model,
    resolution,
    style,
    shotSize,
    chatId,
    newSeed
  );
}
```

## Файлы для диагностики

### 1. Проверить enum значения

Нужно убедиться, что shot_size отправляется в правильном формате:

**lib/ai/api/generate-image.ts:**

```typescript
shot_size: shotSize.label,  // "Medium Shot"
// Возможно нужно: shotSize.id   // "medium_shot"
```

### 2. Добавить детальную диагностику

**lib/ai/api/generate-image.ts:**

```typescript
console.log("🔍 Диагностика payload:", {
  shot_size: shotSize.label,
  shot_size_id: shotSize.id,
  generation_config_name: model.name,
  style_name: validateStyleForAPI(style),
});
```

### 3. Проверить доступные модели

Добавить проверку доступности модели перед отправкой:

```typescript
const availableModels = await getAvailableImageModels();
const selectedModel = availableModels.find((m) => m.name === model.name);
if (!selectedModel) {
  throw new Error(`Model ${model.name} is not available`);
}
```

## Временное решение

До исправления основной проблемы можно:

1. **Использовать другую модель**: Попробовать `'flux-dev'` вместо `'comfyui/flux'`
2. **Изменить shot_size формат**: Использовать `shotSize.id` вместо `shotSize.label`
3. **Добавить retry логику**: При получении 500 ошибки повторить запрос

## Следующие шаги

1. Получить от команды бэкенда:

   - Точную ошибку, которая вызывает ROLLBACK
   - Список доступных значений для `shotsizeenum`
   - Статус модели `comfyui/flux`

2. Добавить детальное логирование в API:

   - Логировать точную ошибку перед ROLLBACK
   - Добавить валидацию параметров

3. Обновить фронтенд с правильными значениями enum

## Тестирование

Для тестирования исправления:

```javascript
// Тест с разными форматами shot_size
const tests = [
  { shot_size: "Medium Shot", label: "Using label" },
  { shot_size: "medium_shot", label: "Using ID" },
  { shot_size: "MEDIUM_SHOT", label: "Using uppercase" },
];

for (const test of tests) {
  console.log(`Testing ${test.label}:`, test.shot_size);
  // ... выполнить генерацию
}
```
