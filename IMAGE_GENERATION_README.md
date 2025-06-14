# Система генерации изображений

## Обзор

Система состоит из нескольких ключевых компонентов:

1. **Инструмент AI (`configure-image-generation.ts`)** - принимает запросы от чат-бота и создает артефакты
2. **API генерации (`generate-image.ts`)** - отправляет запросы на сервер
3. **WebSocket система** - получает обновления прогресса в реальном времени
4. **Компонент ImageEditor** - UI для генерации и просмотра изображений
5. **Система артефактов** - обрабатывает потоковые обновления

## Поток данных

1. Пользователь запрашивает изображение через чат
2. AI вызывает инструмент `configureImageGeneration`
3. Инструмент создает документ через `createDocument`
4. Сервер (`artifacts/image/server.ts`) генерирует изображение
5. Подключается к `wss://editor.superduperai.co/api/v1/ws/project.{projectId}`
6. WebSocket отправляет обновления прогресса
7. Клиент получает и отображает результат

## Основные файлы

### 1. API для генерации изображений

- **Файл**: `lib/ai/api/generate-image.ts`
- **Функция**: `generateImage()`
- Отправляет запрос на бэкенд `https://editor.superduperai.co/api/v1/project/image`
- Возвращает `projectId` для отслеживания через WebSocket

### 2. WebSocket клиент

- **Файл**: `lib/ai/api/websocket-client.ts`
- **Класс**: `ImageGenerationWebSocket`
- Подключается к `wss://editor.superduperai.co/ws/project/{projectId}`
- Обрабатывает статусы: `pending`, `processing`, `completed`, `failed`

### 3. React хук для управления состоянием

- **Файл**: `hooks/use-image-generation.ts`
- **Хук**: `useImageGeneration()`
- Управляет состоянием генерации и WebSocket соединением

### 4. Артефакт для отображения

- **Серверная часть**: `artifacts/image/server.ts`
- **Клиентская часть**: `artifacts/image/client.tsx`
- **Компонент**: `components/image-editor.tsx`

### 5. AI инструмент

- **Файл**: `lib/ai/tools/configure-image-generation.ts`
- Создает артефакты с параметрами генерации

## Как это работает

1. **Пользователь запрашивает генерацию изображения**

   ```typescript
   // AI инструмент создает артефакт
   configureImageGeneration.execute({
     prompt: "A beautiful sunset",
     style: "cinematic",
   });
   ```

2. **Создается артефакт**

   ```typescript
   // Артефакт содержит параметры генерации
   {
     type: 'artifact',
     kind: 'image',
     content: JSON.stringify({
       status: 'pending',
       prompt: "A beautiful sunset",
       settings: { style, resolution, model, shotSize }
     })
   }
   ```

3. **Серверная часть артефакта запускает генерацию**

   ```typescript
   // artifacts/image/server.ts
   const result = await generateImage(
     style,
     resolution,
     prompt,
     model,
     shotSize
   );
   // Возвращает projectId
   ```

4. **Клиентская часть подключается к WebSocket**

   ```typescript
   // components/image-editor.tsx
   imageGeneration.generateImageAsync(...params);
   // Автоматически подключается к WebSocket для получения обновлений
   ```

5. **Отображается прогресс в реальном времени**
   - Статус: pending → processing → completed/failed
   - Прогресс: 0% → 100%
   - Финальное изображение отображается по URL

## Использование

### Базовое использование через AI инструмент

```typescript
// Генерация с настройками по умолчанию
await configureImageGeneration.execute({
  prompt: "A majestic mountain landscape",
});

// Генерация с кастомными настройками
await configureImageGeneration.execute({
  prompt: "A futuristic city",
  style: "cinematic",
  resolution: "1920x1080",
  model: "flux-pro",
  shotSize: "long-shot",
});
```

### Прямое использование хука

```typescript
function MyComponent() {
  const imageGeneration = useImageGeneration();

  const handleGenerate = async () => {
    await imageGeneration.generateImageAsync(
      { id: "flux_steampunk", label: "Steampunk" }, // style
      { width: 1024, height: 1024, label: "1024x1024" }, // resolution
      "A steampunk robot", // prompt
      { id: "flux-dev", label: "Flux Dev" }, // model
      { id: "close-up", label: "Close-Up" } // shotSize
    );
  };

  return (
    <div>
      <button onClick={handleGenerate}>Generate Image</button>
      {imageGeneration.isGenerating && (
        <div>Progress: {imageGeneration.progress}%</div>
      )}
      {imageGeneration.imageUrl && (
        <img
          src={imageGeneration.imageUrl}
          alt="Generated"
        />
      )}
    </div>
  );
}
```

## Конфигурация

### Доступные стили

Стили загружаются динамически через API `getStyles()` из `lib/ai/api/get-styles.ts`

### Доступные разрешения

```typescript
const RESOLUTIONS = [
  { width: 1024, height: 1024, label: "1024x1024", aspectRatio: "1:1" },
  { width: 1920, height: 1080, label: "1920×1080", aspectRatio: "16:9" },
  // ... другие разрешения
];
```

### Доступные модели

```typescript
const IMAGE_MODELS = [
  { id: "flux-dev", label: "Flux Dev" },
  { id: "flux-pro", label: "Flux Pro Ultra 1.1" },
];
```

## Тестирование

Для тестирования WebSocket соединения используйте файл `test-image-generation.html`:

```bash
# Откройте файл в браузере
open test-image-generation.html
```

## Обработка ошибок

Система автоматически обрабатывает:

- Ошибки сети
- Таймауты WebSocket
- Переподключения (до 5 попыток)
- Ошибки API бэкенда

## Совместимость

Система поддерживает:

- Новый формат с WebSocket отслеживанием
- Старый формат с base64 изображениями (для обратной совместимости)

## Исправленные проблемы

### 1. Уменьшен размер данных в артефакте

- ❌ **Было**: Большой JSON с availableResolutions, availableStyles и другими массивами передавался в начальном контенте
- ✅ **Стало**: Данные загружаются из сервера как раньше, компактный JSON в артефакте

### 2. Заменена загрузка прогресса

- ❌ **Было**: Прогресс-бар с процентами (которые не приходят с WebSocket)
- ✅ **Стало**: Скелетон-загрузка, более подходящая для WebSocket

### 3. Исправлено отображение картинок

- ❌ **Было**: Картинка не появлялась в артефакте после генерации
- ✅ **Стало**: Артефакт обновляется когда приходит imageUrl и показывает готовую картинку

### 4. Убраны лишние консольные логи

- ❌ **Было**: Много console.log во всех компонентах
- ✅ **Стало**: Минимум логов, только для ошибок

### 5. ID проекта как ID чата

- ✅ **Подтверждено**: chatId используется как projectId везде в системе

## Поток работы

1. **Пользователь запрашивает изображение** → AI вызывает `configureImageGeneration`
2. **Создается артефакт** с начальным состоянием `pending`
3. **Серверная часть** запускает генерацию и возвращает JSON с настройками
4. **ImageEditor** подключается к WebSocket и показывает скелетон загрузки
5. **WebSocket получает результат** → обновляет состояние в хуке
6. **Артефакт обновляется** и показывает готовое изображение
7. **Картинка отправляется в чат** через experimental_attachments

## Основные файлы

- `artifacts/image/server.ts` - серверная логика артефакта
- `artifacts/image/client.tsx` - клиентская обертка артефакта
- `components/image-editor.tsx` - основной компонент редактора
- `hooks/use-image-generation.ts` - хук для управления состоянием
- `hooks/use-image-websocket.ts` - WebSocket подключение
- `hooks/use-image-event-handler.ts` - обработка событий WebSocket
