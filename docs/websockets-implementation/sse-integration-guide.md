# Server-Sent Events (SSE) Integration Guide

## 📋 Обзор архитектуры

Система SSE позволяет получать real-time обновления от сервера без необходимости постоянного polling. Используется Redis pubsub для масштабируемости.

### Компоненты системы:

1. **Backend SSE Endpoint** - `/api/v1/events/{channel}`
2. **Redis Pubsub** - для передачи сообщений между сервисами
3. **Frontend EventSource Client** - для подключения к SSE
4. **Event Handlers** - для обработки входящих событий

---

## 🔧 Backend Implementation

### 1. SSE Endpoint

```python
# backend/api/v1/endpoints/sse.py
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse
from core.pubsub import pubsub_client
from config import settings

router = APIRouter()

@router.get("/{channel}")
async def subscribe(channel: str):
    async def event_generator():
        if settings.TEST_MODE:
            yield {"data": '{"type":"test","message":"SSE endpoint working"}'}
            return

        async with pubsub_client.subscribe(channel=channel) as subscriber:
            async for event in subscriber:
                yield {"data": event.message}

    return EventSourceResponse(event_generator())
```

### 2. Pubsub Client Configuration

```python
# backend/core/pubsub.py
from broadcaster import Broadcast
from config import settings

def use_pubsub_client() -> Broadcast:
    return Broadcast(settings.REDIS_URL)

pubsub_client = use_pubsub_client()
```

### 3. Event Service для отправки событий

```python
# backend/pipeline/services/event_service.py
from pipeline.core.pubsub import use_pubsub_client
from pipeline.schemas.services.websocket import WSMessage

async def send_event(channel: str, message: WSMessage):
    async with use_pubsub_client() as pubsub_client:
        await pubsub_client.publish(
            channel=channel,
            message=message.model_dump_json()
        )
```

### 4. Структура сообщений

```python
# backend/pipeline/schemas/services/websocket.py
from pydantic import BaseModel
from pipeline.enums.websocket import WSMessageTypeEnum

class WSMessage(BaseModel):
    type: WSMessageTypeEnum  # Тип события
    object: dict | str       # Данные события

# backend/pipeline/enums/websocket.py
class WSMessageTypeEnum(str, Enum):
    task = "task"
    data = "data"
    file = "file"
    entity = "entity"
    scene = "scene"
    render_progress = "render_progress"
    render_result = "render_result"
```

### 5. Пример отправки события

```python
# В любом pipeline flow или задаче
from pipeline.services.event_service import send_event
from pipeline.schemas.services.websocket import WSMessage
from pipeline.enums.websocket import WSMessageTypeEnum

async def some_task(project_id: str):
    # Выполняем какую-то работу...
    result = await do_some_work()

    # Отправляем событие
    await send_event(
        channel=f"project.{project_id}",
        message=WSMessage(
            type=WSMessageTypeEnum.data,
            object=result.model_dump()
        )
    )
```

---

## 🌐 Frontend Implementation

### 1. EventSource Store Factory

```typescript
// frontend/src/shared/utils/event-source-store-factory.ts
import { create } from "zustand";
import type { WSMessage } from "@/shared/api";

export type EventHandler = (eventData: WSMessage) => void;

type EventSourceStore = {
    connection: EventSource | null;
    handlers: EventHandler[];
    addHandlers: (handlers: EventHandler[]) => void;
    removeHandlers: (handlers: EventHandler[]) => void;
    initConnection: (url: string, handlers: EventHandler[]) => void;
};

export const createEventSourceStore = (name: string) =>
    create<EventSourceStore>((set, get) => ({
        connection: null,
        handlers: [],
        addHandlers: (newHandlers) => {
            const { handlers } = get();
            set({ handlers: [...handlers, ...newHandlers] });
        },
        removeHandlers: (delHandlers) => {
            const { handlers, connection } = get();
            const filteredHandlers = handlers.filter(
                (h) => !delHandlers.includes(h)
            );
            set({ handlers: filteredHandlers });

            if (filteredHandlers.length === 0 && connection) {
                connection.close();
                set({ connection: null });
            }
        },
        initConnection: (url, handlers) => {
            const { connection, addHandlers, removeHandlers } = get();

            if (connection) {
                if ((connection as any).url === url) return;
                connection.close();
            }

            const eventSource = new EventSource(url);
            const channel = url.split("/").pop();

            eventSource.onopen = () => {
                addHandlers(handlers);
                console.log(`${name} SSE connected. Channel: ${channel}`);
            };

            eventSource.onerror = () => {
                console.log(`${name} SSE error. Channel: ${channel}`);
            };

            eventSource.onmessage = (event) => {
                const { handlers } = get();
                const eventData = JSON.parse(event.data) as WSMessage;
                handlers.forEach((h) => h(eventData));
            };

            eventSource.addEventListener("error", () => {
                removeHandlers(handlers);
                console.log(`${name} SSE disconnected. Channel: ${channel}`);
            });

            set({ connection: eventSource });
        },
    }));
```

### 2. Создание конкретных Store

```typescript
// frontend/src/entities/project/store/event-source.ts
import { createEventSourceStore } from "@/shared/utils";

export const useProjectEventSourceStore = createEventSourceStore("Project");

// frontend/src/entities/file/store/event-source.ts
import { createEventSourceStore } from "@/shared/utils";

export const useFileEventSourceStore = createEventSourceStore("File");
```

### 3. Хуки для подключения

```typescript
// frontend/src/entities/project/hooks/event-source.ts
"use client";

import { useEffect } from "react";
import { useProjectEventSourceStore } from "@/entities/project";
import type { EventHandler } from "@/shared/utils";

type Props = {
    projectId: string;
    eventHandlers: EventHandler[];
};

export const useProjectEvents = ({ projectId, eventHandlers }: Props) => {
    const { initConnection, removeHandlers } = useProjectEventSourceStore();

    useEffect(() => {
        const baseUrl =
            process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
        const url = `${baseUrl}/api/v1/events/project.${projectId}`;

        initConnection(url, eventHandlers);

        return () => {
            removeHandlers(eventHandlers);
        };
    }, [projectId]);
};
```

### 4. Event Handlers

```typescript
// frontend/src/entities/file/hooks/event-handler.ts
import type { IFileRead, WSMessage } from "@/shared/api";
import { WSMessageTypeEnum } from "@/shared/api";
import { useQueryClient } from "@tanstack/react-query";
import { unshiftOrReplace, type EventHandler } from "@/shared/utils";
import { fileKeys } from "@/entities/file";

export const useFileEventHandler = (): EventHandler => {
    const queryClient = useQueryClient();

    return (eventData: WSMessage) => {
        if (eventData.type === WSMessageTypeEnum.FILE) {
            const object = eventData.object as IFileRead;

            // Обновляем список файлов
            queryClient.setQueriesData(
                { queryKey: fileKeys.list._def },
                (oldData?: IResponsePaginated_IFileRead_) => {
                    if (!oldData) return;
                    return {
                        ...oldData,
                        items: unshiftOrReplace(oldData.items, object, "id"),
                    };
                }
            );

            // Обновляем конкретный файл
            queryClient.setQueriesData(
                { queryKey: fileKeys.getById._def },
                () => object
            );
        }
    };
};
```

---

## 🚀 Использование в компонентах

### Базовое подключение

```typescript
// В React компоненте
import { useProjectEvents } from "@/entities/project";
import { useFileEventHandler } from "@/entities/file";

export const MyComponent = ({ projectId }: { projectId: string }) => {
    const fileEventHandler = useFileEventHandler();

    useProjectEvents({
        projectId,
        eventHandlers: [fileEventHandler],
    });

    return <div>Content that updates in real-time</div>;
};
```

### Множественные обработчики

```typescript
import { useProjectEvents } from "@/entities/project";
import { useFileEventHandler } from "@/entities/file";
import { useProjectEventHandler } from "@/entities/project";

export const ComplexComponent = ({ projectId }: { projectId: string }) => {
    const fileEventHandler = useFileEventHandler();
    const projectEventHandler = useProjectEventHandler();

    useProjectEvents({
        projectId,
        eventHandlers: [fileEventHandler, projectEventHandler],
    });

    return <div>Complex content with multiple event types</div>;
};
```

---

## 📝 Конвенции и каналы

### Формат каналов

-   **Проект**: `project.{projectId}`
-   **Файл**: `file.{fileId}`
-   **Тест**: `test`

### Типы событий

| Тип               | Описание                   | Структура object                 |
| ----------------- | -------------------------- | -------------------------------- |
| `task`            | Статус задачи              | `{id, status, progress, ...}`    |
| `data`            | Данные проекта             | `{type, project_id, value, ...}` |
| `file`            | Файл создан/обновлен       | `IFileRead`                      |
| `entity`          | Сущность создана/обновлена | `IEntityRead`                    |
| `scene`           | Сцена создана/обновлена    | `ISceneRead`                     |
| `render_progress` | Прогресс рендера           | `{progress: number}`             |
| `render_result`   | Результат рендера          | `IFileRead`                      |

---

## ⚙️ Настройка для нового проекта

### 1. Backend Requirements

```bash
pip install fastapi sse-starlette broadcaster[redis]
```

### 2. Environment Variables

```env
REDIS_URL=redis://localhost:6379
TEST_MODE=false
```

### 3. FastAPI Router Registration

```python
# main.py
from api.v1.endpoints import sse

app.include_router(
    sse.router,
    prefix="/api/v1/events",
    tags=["events"],
)
```

### 4. Frontend Dependencies

```bash
npm install zustand @tanstack/react-query
```

### 5. TypeScript Types

Сгенерируйте типы из OpenAPI схемы или создайте вручную:

```typescript
export type WSMessage = {
    type: WSMessageTypeEnum;
    object: Record<string, any> | string;
};

export enum WSMessageTypeEnum {
    TASK = "task",
    DATA = "data",
    FILE = "file",
    // ... другие типы
}
```

---

## 🔒 Безопасность

### Рекомендации:

1. **Аутентификация**: Добавьте проверку JWT токена в SSE эндпоинт
2. **Авторизация**: Проверяйте права доступа к каналам
3. **Rate Limiting**: Ограничьте количество подключений на пользователя
4. **Валидация каналов**: Проверяйте формат и существование ресурсов

### Пример с аутентификацией:

```python
from fastapi import Depends, HTTPException
from api.dependencies.user import get_current_user

@router.get("/{channel}")
async def subscribe(
    channel: str,
    user: User = Depends(get_current_user)
):
    # Проверка прав доступа
    if not validate_channel_access(channel, user):
        raise HTTPException(status_code=403, detail="Access denied")

    # ... остальной код
```

---

## 🐛 Отладка

### Логирование событий

```typescript
// В event handler
return (eventData: WSMessage) => {
    console.log("Received SSE event:", eventData);
    // ... обработка
};
```

### Проверка подключения

```bash
# Тест SSE эндпоинта
curl -N -H "Accept: text/event-stream" \
  "http://localhost:8000/api/v1/events/test"
```

### Redis мониторинг

```bash
# Мониторинг Redis pubsub
redis-cli monitor
```

---

## 📚 Примеры интеграции

### Уведомления о статусе задач

```python
# Backend
await send_event(
    channel=f"project.{project_id}",
    message=WSMessage(
        type=WSMessageTypeEnum.task,
        object={
            "id": task.id,
            "status": "completed",
            "progress": 100,
            "result_url": "https://example.com/result.mp4"
        }
    )
)
```

```typescript
// Frontend
const taskEventHandler: EventHandler = (eventData) => {
    if (eventData.type === WSMessageTypeEnum.TASK) {
        const task = eventData.object as TaskUpdate;
        showNotification(`Task ${task.status}: ${task.progress}%`);
    }
};
```

### Обновление прогресса в реальном времени

```python
# Backend
for progress in range(0, 101, 10):
    await send_event(
        channel=f"project.{project_id}",
        message=WSMessage(
            type=WSMessageTypeEnum.render_progress,
            object={"progress": progress}
        )
    )
    await asyncio.sleep(1)
```

```typescript
// Frontend
const progressEventHandler: EventHandler = (eventData) => {
    if (eventData.type === WSMessageTypeEnum.RENDER_PROGRESS) {
        const { progress } = eventData.object as { progress: number };
        setProgress(progress);
    }
};
```

---

## ✅ Лучшие практики

1. **Ресурсы**: Всегда очищайте EventSource соединения при unmount
2. **Обработка ошибок**: Оборачивайте event handlers в try-catch
3. **Типизация**: Используйте строгую типизацию для WSMessage объектов
4. **Производительность**: Избегайте создания новых handlers на каждый рендер
5. **Тестирование**: Используйте TEST_MODE для юнит-тестов
6. **Мониторинг**: Логируйте подключения и ошибки для мониторинга
