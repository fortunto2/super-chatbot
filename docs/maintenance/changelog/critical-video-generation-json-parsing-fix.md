# Critical Fix: Video Generation JSON Parsing Error

**Date**: 2025-01-15  
**Type**: Critical Bug Fix  
**Component**: Video Generation / Artifact System  
**Status**: ✅ Completed

## Problem Description

После упрощения video title возникла критическая ошибка:

```
Error: No JSON parameters found in readable title
    at Object.onCreateDocument (artifacts/video/server.ts:31:16)
```

**Root Cause**:

1. `artifacts/video/server.ts` ожидает JSON параметры в конце title для извлечения настроек видео генерации
2. Когда мы упростили title до `Video: "prompt"`, это сломало логику парсинга параметров
3. Server код использует regex `/\{.*\}$/` для поиска JSON в title

## Solution

### 1. ✅ Восстановлены JSON параметры в title

**Before**:

```typescript
const readableTitle = `Video: "${prompt}"`;
```

**After**:

```typescript
const readableTitle = `Video: "${prompt}" ${JSON.stringify(videoParams)}`;
```

### 2. ✅ UI правильно обрабатывает новый формат

`components/artifact.tsx` уже содержит правильную логику в `getDisplayTitle()`:

```typescript
if (title.startsWith("Video:")) {
  // Extract readable part before JSON
  const jsonMatch = title.match(/\{.*\}$/);
  if (jsonMatch) {
    return title.substring(0, title.length - jsonMatch[0].length).trim();
  }
}
```

## Result

✅ **Backend**: JSON параметры доступны для парсинга настроек  
✅ **Frontend**: Пользователь видит только `Video: "prompt"` без технических деталей  
✅ **No Breaking Changes**: Логика остается совместимой с существующим кодом

## Files Modified

- `lib/ai/tools/configure-video-generation.ts` (восстановлены JSON параметры в title)

## Testing

1. Генерируйте видео в чате: `"create a video with a dancing robot"`
2. ✅ Ожидаемый result: title показывает только prompt без технических деталей
3. ✅ Backend корректно парсит JSON параметры для генерации

## Key Insight

Этот fix показывает важность баланса между UX (скрытие технических деталей) и внутренней логикой системы (потребность в параметрах для обработки). Решение: hybrid title format где JSON параметры присутствуют для backend, но скрыты от пользователя через UI logic.
