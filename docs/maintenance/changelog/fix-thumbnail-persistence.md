# Fix Thumbnail Persistence in Artifact Gallery

**Date**: 2025-01-27  
**Type**: Critical Bug Fix  
**Component**: Artifact Gallery & Thumbnails  
**Status**: ✅ Completed

## Problem

Thumbnails не сохранялись корректно в базу данных для изображений и видео, что приводило к отсутствию preview в Artifact Gallery. SuperDuperAI API возвращал `thumbnail_url`, но они не попадали в базу данных.

### Issues Found:

1. **Missing Database Updates**: SSE и polling обработчики обновляли только content артефактов, не вызывая PATCH API для thumbnail
2. **No Thumbnail Persistence**: Когда генерация завершалась, `thumbnailUrl` не сохранялся в Database.thumbnailUrl поле
3. **Gallery Shows Icons**: В галерее показывались только иконки типов файлов вместо реальных thumbnails

## Solution Applied

### 1. Image Thumbnails ✅

**File**: `artifacts/image/client.tsx`

- Добавлен PATCH вызов в функцию `updateContent()`
- При `status === 'completed'` и наличии `imageUrl` вызывается `/api/document PATCH`
- Для изображений используется `imageUrl` как thumbnail

```typescript
// AICODE-FIX: Update thumbnail in database when image completes
if (
  newContent.status === "completed" &&
  newContent.imageUrl &&
  documentId &&
  documentId !== "undefined"
) {
  const thumbnailUrl = newContent.imageUrl; // For images, use imageUrl as thumbnail
  fetch(`/api/document?id=${encodeURIComponent(documentId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      thumbnailUrl,
      metadata: {
        imageUrl: newContent.imageUrl,
        prompt: newContent.prompt,
        model: newContent.model?.name || newContent.model?.id,
        resolution: newContent.resolution,
      },
    }),
  }).catch((err) => console.error("Failed to update thumbnail", err));
}
```

### 2. Video Thumbnails ✅

**File**: `artifacts/video/client.tsx`

- Добавлен PATCH вызов в SSE обработчик `handleSSEMessage()`
- Добавлен PATCH вызов в polling обработчик
- Для видео используется `thumbnail_url` из SuperDuperAI API response

```typescript
// AICODE-FIX: Update thumbnail in database when video completes
if (current.documentId && current.documentId !== "undefined" && thumbnailUrl) {
  fetch(`/api/document?id=${encodeURIComponent(current.documentId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      thumbnailUrl,
      metadata: {
        videoUrl: videoUrl,
        thumbnailUrl: thumbnailUrl,
        prompt: currentContent.prompt,
        model: currentContent.model?.name || currentContent.model?.id,
        resolution: currentContent.resolution,
      },
    }),
  }).catch((err) => console.error("Failed to update video thumbnail", err));
}
```

### 3. Gallery Display ✅

**File**: `app/gallery/components/document-card.tsx`

- Уже правильно реализован: сначала проверяет `document.thumbnailUrl`
- Fallback на `document.metadata?.imageUrl` если thumbnailUrl отсутствует
- Иконка типа файла как последний fallback

## Result

✅ **Image thumbnails** теперь сохраняются в базу при завершении генерации  
✅ **Video thumbnails** теперь сохраняются в базу при завершении генерации  
✅ **Gallery shows previews** вместо иконок для всех артефактов  
✅ **Metadata preserved** - сохраняется дополнительная информация об артефактах

## Files Modified

```
artifacts/image/client.tsx - добавлен PATCH вызов для image thumbnails
artifacts/video/client.tsx - добавлены PATCH вызовы для video thumbnails (SSE + polling)
docs/maintenance/changelog/fix-thumbnail-persistence.md - документация
```

## Testing

1. ✅ Сгенерируйте изображение в чате
2. ✅ Дождитесь завершения генерации
3. ✅ Проверьте `/gallery` - должен появиться thumbnail
4. ✅ Сгенерируйте видео в чате
5. ✅ Дождитесь завершения генерации
6. ✅ Проверьте `/gallery` - должен появиться video thumbnail

## Technical Details

### API Flow

1. **Generation completes** → SSE/polling получает результат с URL
2. **Artifact content updated** → updateContent() вызывается
3. **PATCH /api/document** → thumbnailUrl сохраняется в базу
4. **Gallery refresh** → новые thumbnails отображаются

### Database Schema

```sql
-- Document table уже имеет поля:
thumbnailUrl: text (URL thumbnail изображения)
metadata: jsonb (дополнительные данные)
```

**Status**: All thumbnails now persist correctly! 🖼️🎬
