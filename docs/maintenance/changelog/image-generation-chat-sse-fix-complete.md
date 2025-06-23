# Полное исправление генерации изображений в чате (SSE)

**Дата**: 2025-01-21  
**Статус**: ✅ Завершено  
**Тип**: Критическое исправление функциональности

## Описание проблемы

Генерация изображений в чате не работала из-за:

1. **Отсутствие обработки file_id** - SuperDuperAI API возвращает file_id вместо прямых URL
2. **Пустые SSE обработчики** - artifact SSE не обрабатывал события
3. **chatId undefined** - неправильная передача projectId
4. **Статус "Disconnected"** - неправильная проверка SSE подключения

## Этап 1: Базовая поддержка SSE событий

### Расширение `use-image-event-handler.ts`

- ✅ Обработка события `file` с поддержкой file_id
- ✅ Резолюция file_id через `FileService.fileGetById()`
- ✅ Новые события: `render_progress`, `render_result`, `task_status`
- ✅ Автоматический polling при завершении задач
- ✅ Проверка типов файлов через `FileTypeEnum.IMAGE`

### Ручная проверка в `use-image-generation.ts`

- ✅ Метод `forceCheckResults()` как в standalone версии
- ✅ Использование Next.js API route `/api/project/{id}`
- ✅ Поддержка как прямых URL, так и file_id

### UI улучшения в `components/image-editor.tsx`

- ✅ Кнопка "Check for results" при генерации
- ✅ Состояние загрузки "Checking..."

## Этап 2: Исправление критических проблем

### Проблемы при тестировании:

```
use-image-generation.ts:139 🎮 Creating event handlers array for chatId: undefined
use-image-generation.ts:146 🎮 Should connect WebSocket: false chatId: undefined
```

### Исправления:

**1. Artifact SSE обработка (`artifacts/image/client.tsx`)**

```typescript
// Добавлена полная обработка событий в artifact SSE
eventHandlers: [
  (message) => {
    // Handle file events
    if (message.type === "file" && message.object) {
      if (fileObject.url) {
        /* прямой URL */
      } else if (fileObject.file_id) {
        /* резолюция через FileService */
      }
    }

    // Handle render_progress
    if (message.type === "render_progress") {
      /* обновление прогресса */
    }

    // Handle render_result
    if (message.type === "render_result") {
      /* финальный результат */
    }
  },
];
```

**2. Правильная передача projectId (`components/image-editor.tsx`)**

```typescript
// Использование projectId из initialState для артефактов
const effectiveProjectId = initialState?.projectId || chatId;
const imageGeneration = useImageGeneration(effectiveProjectId);

// Инициализация tracking для артефактов
if (initialState?.projectId && initialState.status === "processing") {
  imageGeneration.startTracking(initialState.projectId, initialState.requestId);
}
```

**3. Статус SSE подключения**

```typescript
// Экспорт статуса в globals
window.artifactSSEStatus[projectId] = artifactSSE.isConnected;

// Проверка в ImageEditor
const getConnectionStatus = () => {
  if (initialState?.projectId) {
    return window.artifactSSEStatus?.[initialState.projectId] || false;
  }
  return imageGeneration.isConnected;
};
```

**4. Улучшенная ручная проверка**

```typescript
const handleForceCheck = async () => {
  const projectId = initialState?.projectId || imageGeneration.projectId;
  const project = await fetch(`/api/project/${projectId}`);

  // Поиск изображений и file_id
  if (initialState?.projectId && setArtifact) {
    // Обновление artifact content
    setArtifact((prev) => ({
      ...prev,
      content: JSON.stringify(updatedContent),
    }));
  }
};
```

## Файлы изменены

1. **`hooks/use-image-event-handler.ts`**

   - Обработка file_id через FileService
   - События render_progress, render_result, task_status
   - Автоматический polling при завершении

2. **`hooks/use-image-generation.ts`**

   - Метод forceCheckResults()
   - Обновлены интерфейсы типов

3. **`components/image-editor.tsx`**

   - Правильная передача projectId
   - Инициализация tracking для артефактов
   - Улучшенная проверка статуса подключения
   - Кнопка "Check for results"

4. **`artifacts/image/client.tsx`**

   - Полная обработка SSE событий
   - Автоматическое обновление artifact content
   - Экспорт статуса подключения

5. **`lib/utils/image-utils.ts`**
   - Добавлено поле requestId в ImageState

## Технические детали

### Обработка file_id в артефактах

```typescript
if (fileObject.file_id) {
  const { FileService, FileTypeEnum } = await import("@/lib/api");
  const fileResponse = await FileService.fileGetById({
    id: fileObject.file_id,
  });

  if (fileResponse.type === FileTypeEnum.IMAGE) {
    setArtifact((prev) => ({
      ...prev,
      content: JSON.stringify({ ...parsed, imageUrl: fileResponse.url }),
    }));
  }
}
```

### Статус подключения

```typescript
// Глобальное отслеживание
window.artifactSSEStatus = { [projectId]: isConnected };

// Проверка в UI
const isConnected =
  window.artifactSSEStatus?.[projectId] || initialState.status === "processing";
```

## Тестирование

- ✅ Генерация изображений в чате через AI ассистента
- ✅ Получение результатов через SSE file события
- ✅ Резолюция file_id в URL автоматически
- ✅ Ручная проверка кнопкой "Check for results"
- ✅ Правильный статус подключения "Connected/Disconnected"
- ✅ Обновление artifact content в реальном времени

## Результат

🎯 **Генерация изображений в чате полностью исправлена**

- **SSE события**: корректно обрабатываются все типы (file, render_progress, render_result)
- **file_id резолюция**: автоматическое преобразование в URL через FileService
- **Статус подключения**: показывает реальное состояние SSE
- **Ручная проверка**: работает для обоих режимов (артефакт/standalone)
- **projectId**: правильная передача и использование

Теперь пользователи получают изображения автоматически через SSE или могут проверить результаты вручную при необходимости.
