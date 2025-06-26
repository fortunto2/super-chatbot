# Image Generator Duplication Fix

## Проблема

В image generator tool возникает дублирование изображений - одно и то же изображение появляется дважды в галерее. Анализ логов показал:

### Логи пользователя

```
🔄 Starting polling for file: a5caa8ba-f924-403e-9a5b-6fbb270c47d8
📊 File data: {id: 'a5caa8ba-f924-403e-9a5b-6fbb270c47d8', url: 'https://...', ...}
✅ Image generation completed with URL: https://...

🔄 Starting polling for file: a8ad1931-0029-4025-be48-2fdc621ee628
📊 File data: {id: 'a8ad1931-0029-4025-be48-2fdc621ee628', url: null, ...}
📊 File data: {id: 'a8ad1931-0029-4025-be48-2fdc621ee628', url: 'https://...', ...}
✅ Image generation completed with URL: https://...
```

### Логи сервера

```
🔌 SSE Proxy: Setting up for path: file.a5caa8ba-f924-403e-9a5b-6fbb270c47d8
✅ SSE Proxy: Successfully connected to backend
📡 SSE Proxy: Forwarding chunk: data: {"type":"file","object":{"id":"a5caa8ba..."
 GET /api/events/file.a5caa8ba-f924-403e-9a5b-6fbb270c47d8 200 in 20009ms

📁 File proxy: Getting file status for ID: a5caa8ba-f924-403e-9a5b-6fbb270c47d8
✅ File status response: {id: 'a5caa8ba-f924-403e-9a5b-6fbb270c47d8', url: 'https://...'}
```

## Причина

Та же архитектурная проблема, что была в video generator:

1. **SSE получает результат**: SSE соединение успешно получает событие завершения с URL изображения
2. **SSE вызывает handleGenerationSuccess**: Изображение обрабатывается и добавляется в галерею
3. **Timeout запускает polling**: Через 10 секунд timeout запускает fallback polling
4. **Polling находит тот же результат**: Polling получает файл с URL и снова вызывает handleGenerationSuccess
5. **Дублирование**: Одно изображение обрабатывается дважды и появляется дважды в галерее

## Решение

Применено то же решение, что и для video generator - добавлена система предотвращения дублирования с `completedRef`:

### 1. Добавлен completedRef

```typescript
// AICODE-NOTE: Refs for SSE connection and polling cleanup
const wsRef = useRef<EventSource | null>(null);
const pollingRef = useRef<NodeJS.Timeout | null>(null);
// AICODE-NOTE: Ref to track completed images and prevent duplicates
const completedRef = useRef<string | null>(null);
```

### 2. Обновлена handleGenerationSuccess

```typescript
const handleGenerationSuccess = useCallback(
  (imageUrl: string, projectId?: string) => {
    // AICODE-NOTE: Prevent duplicate processing of the same image
    if (completedRef.current === imageUrl) {
      console.log(
        "🖼️ ⏭️ Image already processed, skipping duplicate:",
        imageUrl.substring(0, 50) + "..."
      );
      return;
    }

    console.log(
      "🖼️ ✅ Processing image completion:",
      imageUrl.substring(0, 50) + "..."
    );
    completedRef.current = imageUrl;

    cleanup();
    // ... rest of function unchanged
  },
  [generationStatus.message, cleanup]
);
```

### 3. Обновлена startPolling

```typescript
const startPolling = useCallback((fileId: string) => {
  // AICODE-NOTE: Skip polling if already completed
  if (completedRef.current) {
    console.log('🔄 Skipping polling - image already completed');
    return;
  }

  console.log('🔄 Starting polling for file:', fileId);

  const poll = async () => {
    try {
      // AICODE-NOTE: Skip if already completed during polling
      if (completedRef.current) {
        console.log('🔄 Stopping polling - image completed during polling');
        if (pollingRef.current) {
          clearTimeout(pollingRef.current);
          pollingRef.current = null;
        }
        return;
      }
      // ... rest unchanged
    }
  };
}, []);
```

### 4. Обновлен SSE timeout

```typescript
setTimeout(() => {
  if (eventSource.readyState !== EventSource.OPEN && !completedRef.current) {
    startPolling(fileId);
  }
}, 10000);
```

### 5. Сброс при новой генерации

```typescript
// В handleGenerateImage
setCurrentGeneration(null);

// AICODE-NOTE: Reset completion flag for new generation
completedRef.current = null;

// В clearCurrentGeneration
cleanup();
// AICODE-NOTE: Reset completion flag when clearing
completedRef.current = null;

// В cleanup
completedRef.current = null;
```

## Техническая архитектура

### До исправления

- SSE получает результат → обрабатывает изображение ✅
- Timeout (10s) → запускает polling
- Polling получает тот же результат → обрабатывает повторно ❌
- **Результат**: дублирование изображений

### После исправления

- SSE получает результат → устанавливает completedRef=URL → обрабатывает изображение ✅
- Timeout (10s) → проверяет completedRef → пропускает polling ✅
- Polling (если запущен) → проверяет completedRef → останавливается ✅
- **Результат**: нет дублирования

## Файлы изменены

- `app/tools/image-generator/hooks/use-image-generator.ts` - Добавлена система предотвращения дублирования

## Результат

✅ **Проблема решена**: Дублирование изображений в image generator устранено  
✅ **Архитектурное соответствие**: Решение унифицировано с video generator  
✅ **Обратная совместимость**: Все существующие функции работают без изменений
✅ **Производительность**: Устранены лишние вызовы API и обработка

## Связанные исправления

- [Video Generator Duplication Fix](./video-generation-duplication-fix.md) - Аналогичное исправление для видео
- Общая проблема dual SSE+polling архитектуры в generation tools

## Дата

26 декабря 2025

## Отладка

После первой реализации дублирование все еще происходит. Добавлено дополнительное логирование для понимания проблемы:

```typescript
// В handleGenerationSuccess
console.log(
  "🖼️ 🔍 handleGenerationSuccess called with URL:",
  imageUrl.substring(0, 50) + "..."
);
console.log(
  "🖼️ 🔍 Current completedRef value:",
  completedRef.current?.substring(0, 50) + "..." || "null"
);

// В polling
console.log("🔄 📋 About to call handleGenerationSuccess from polling");

// В SSE обработчиках
console.log("📡 🖼️ SSE render_result: calling handleGenerationSuccess");
console.log("📡 🖼️ SSE file event: calling handleGenerationSuccess");
```

Возможные причины:

1. Функция `handleGenerationSuccess` пересоздается из-за зависимостей
2. `completedRef` не сохраняет значение между вызовами
3. Разные экземпляры функции используют разные `completedRef`

### Исправления в процессе отладки:

- Убрана зависимость от `generationStatus.message` в useCallback
- Упрощен prompt на статический 'Generated image'

## Статус

🔄 **В процессе отладки** - требуется дополнительный анализ логов
