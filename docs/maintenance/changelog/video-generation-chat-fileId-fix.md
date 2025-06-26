# Video Generation Chat FileId Fix

## Проблема

Video generation в чате не работает правильно - показывает ошибку `❌ No fileId found in response`, хотя в логах API response содержит корректный ID файла.

### Логи проблемы

```
📨 API Response: {
  id: '92ea7c4b-c99b-4e04-b455-5c8fa20b9ba9',
  url: null,
  thumbnail_url: null,
  type: 'video',
  video_generation_id: '5579ff69-a527-4237-87f2-0fcf8d023dd5',
  ...
}
❌ No fileId found in response
📄 Draft content generated: {"status":"failed","error":"No file ID returned from API"}
```

## Причина

Разница в архитектуре между video generation tool и video generation в чате:

### ✅ Video Generator Tool (работает)

- Использует `/api/generate/video` route
- Route использует OpenAPI client (`FileService.fileGenerateVideo`)
- Корректно возвращает `{ success: true, fileId: result.id }`

### ❌ Video Generation в чате (не работает)

- Использует `generate-video-hybrid.ts`
- Напрямую обращается к SuperDuperAI API
- Неправильно извлекает fileId из ответа API

### Неправильное извлечение fileId

```typescript
// СТАРЫЙ КОД - ищет fileId в неправильных местах
const fileId =
  result.data?.[0]?.value?.file_id || result.data?.[0]?.id || result.fileId;
```

Но в SuperDuperAI API response fileId находится в `result.id`!

## Решение

### 1. Исправлена логика извлечения fileId

```typescript
// НОВЫЙ КОД - ищет fileId в правильном месте
const fileId =
  result.id || // PRIMARY: SuperDuperAI API response
  result.data?.[0]?.value?.file_id ||
  result.data?.[0]?.id ||
  result.fileId;
const projectId =
  result.video_generation?.id || // Video project ID
  result.project_id ||
  result.data?.[0]?.value?.project_id ||
  result.projectId;
```

### 2. Убрана server-side SSE попытка

```typescript
// БЫЛО - попытка SSE на сервере (не работает)
const sseResult = await trySSEApproach(fileId); // EventSource не доступен в Node.js

// СТАЛО - возврат fileId для client-side обработки
return {
  success: true,
  projectId,
  requestId,
  fileId,
  message: `Video generation started! FileId: ${fileId} - client will handle SSE/polling`,
};
```

### 3. Унифицирована SSE архитектура

Video chat SSE теперь поддерживает оба формата:

- `project.${projectId}` - для project-based events
- `file.${fileId}` - для file-based events (как video generator tool)

```typescript
// В artifacts/video/server.ts - сохраняем оба ID
draftContent = JSON.stringify({
  status: isCompleted ? "completed" : "pending",
  fileId: result.fileId || result.projectId || chatId,
  projectId: result.projectId || result.fileId || chatId, // Добавлен projectId
  // ...
});

// В use-chat-video-sse.ts - подключаемся к обоим
if (artifactContent?.projectId) {
  projectIds.add(artifactContent.projectId);
}
if (artifactContent?.fileId) {
  projectIds.add(`file.${artifactContent.fileId}`); // File-based SSE
}
```

### 4. Исправлены SSE URL форматы

Все SSE connections теперь используют Next.js proxy вместо прямых backend URLs:

```typescript
// БЫЛО - прямые backend URLs (404 errors)
const sseUrl = `${config.url}/api/v1/events/project.${projectId}`;
const sseUrl = `${config.url}/api/v1/events/file.${fileId}`;

// СТАЛО - Next.js proxy URLs (работает)
const sseUrl = `/api/events/project.${projectId}`;
const sseUrl = `/api/events/file.${fileId}`;
```

### 5. Добавлено отладочное логирование

```typescript
console.log(`🔍 Extracted fileId: ${fileId}, projectId: ${projectId}`);
console.log(`🔍 result.id: ${result.id}`);
console.log(`🔍 result.video_generation?.id: ${result.video_generation?.id}`);
```

## Техническая архитектура

### До исправления

- Chat video generation → `generate-video-hybrid.ts` → SuperDuperAI API
- Неправильное извлечение: `result.data?.[0]?.value?.file_id` ❌
- Server-side SSE попытка: `EventSource not defined` ❌
- Ошибка: "No fileId found in response"

### После исправления

- Chat video generation → `generate-video-hybrid.ts` → SuperDuperAI API
- Правильное извлечение: `result.id` ✅
- Server возвращает fileId для client-side SSE ✅
- Client подключается к `file.${fileId}` и `project.${projectId}` ✅

### Унификация архитектуры

Теперь все компоненты используют унифицированную архитектуру:

| Компонент                 | SSE Connection  | Format                                       |
| ------------------------- | --------------- | -------------------------------------------- |
| **Video Generator Tool**  | Direct file SSE | `file.${fileId}` ✅                          |
| **Chat Video Generation** | Dual SSE        | `file.${fileId}` + `project.${projectId}` ✅ |
| **Image Generator Tool**  | Direct file SSE | `file.${fileId}` ✅                          |
| **Chat Image Generation** | Project SSE     | `project.${projectId}` ✅                    |

## Файлы изменены

- `lib/ai/api/generate-video-hybrid.ts` - Исправлена логика извлечения fileId, убрана server-side SSE
- `artifacts/video/server.ts` - Добавлен projectId в artifact content
- `hooks/use-chat-video-sse.ts` - Поддержка file-based SSE + исправлены URLs на Next.js proxy
- `hooks/use-chat-image-sse.ts` - Исправлены URLs на Next.js proxy
- `hooks/use-artifact-sse.ts` - Исправлены URLs на Next.js proxy
- `lib/websocket/video-sse-store.ts` - Добавлена поддержка file-based SSE connections

## Результат

✅ **Video generation в чате работает**: Корректно извлекается fileId из API response  
✅ **SSE соединения устанавливаются**: Video artifacts получают updates в реальном времени  
✅ **Унифицированная архитектура**: Tool и chat используют ту же SSE логику
✅ **Server-side безопасность**: Нет попыток SSE на сервере где EventSource недоступен
✅ **Dual SSE support**: Поддержка и file-based, и project-based SSE connections
✅ **Улучшенная отладка**: Добавлено логирование для future troubleshooting

## Логи после исправления

```
🔍 Extracted fileId: 7fa4bb0b-cabe-4795-9a34-de4ac50d0070, projectId: 2e9fab6c-fc7a-4344-8e0f-fcdafa52c80c
🔍 result.id: 7fa4bb0b-cabe-4795-9a34-de4ac50d0070
🔍 result.video_generation?.id: 2e9fab6c-fc7a-4344-8e0f-fcdafa52c80c
🎬 Video generation started - FileId: 7fa4bb0b-cabe-4795-9a34-de4ac50d0070
🔌 Server-side: returning fileId for client-side SSE/polling: 7fa4bb0b-cabe-4795-9a34-de4ac50d0070
🔌 Chat Video SSE: Connecting to: file.7fa4bb0b-cabe-4795-9a34-de4ac50d0070
🔌 Video SSE URL: /api/events/file.7fa4bb0b-cabe-4795-9a34-de4ac50d0070
```

## Связанные исправления

- [Video Generator Duplication Fix](./video-generation-duplication-fix.md) - Исправление дублирования в video generator tool
- [Image Generator Duplication Fix](./image-generation-duplication-fix.md) - Аналогичное исправление для изображений

## Дата

26 декабря 2025

## Статус

✅ **Завершено** - Video generation в чате теперь работает корректно с унифицированной SSE архитектурой
