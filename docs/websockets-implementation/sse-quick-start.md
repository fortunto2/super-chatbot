# SSE Quick Start Guide

## 🚀 Быстрый старт за 5 минут

### 1. Backend Setup

```python
# 1. Установите зависимости
pip install fastapi sse-starlette broadcaster[redis]

# 2. Создайте SSE эндпоинт
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse
from broadcaster import Broadcast

REDIS_URL = "redis://localhost:6379"
pubsub_client = Broadcast(REDIS_URL)

router = APIRouter()

@router.get("/events/{channel}")
async def subscribe(channel: str):
    async def event_generator():
        async with pubsub_client.subscribe(channel=channel) as subscriber:
            async for event in subscriber:
                yield {"data": event.message}
    return EventSourceResponse(event_generator())

# 3. Подключите роутер
app.include_router(router, prefix="/api/v1")
```

### 2. Отправка событий

```python
import json
from broadcaster import Broadcast

async def send_notification(project_id: str, message: str):
    pubsub = Broadcast(REDIS_URL)

    event_data = {
        "type": "notification",
        "object": {"message": message, "timestamp": "2024-01-01T00:00:00Z"}
    }

    async with pubsub:
        await pubsub.publish(
            channel=f"project.{project_id}",
            message=json.dumps(event_data)
        )
```

### 3. Frontend подключение

```typescript
// 1. Создайте EventSource соединение
const eventSource = new EventSource(
    "http://localhost:8000/api/v1/events/project.123"
);

// 2. Обработайте входящие события
eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("Received:", data);

    if (data.type === "notification") {
        alert(data.object.message);
    }
};

// 3. Очистите ресурсы
eventSource.onopen = () => console.log("Connected");
eventSource.onerror = () => console.log("Error occurred");

// При unmount компонента
eventSource.close();
```

### 4. React Hook пример

```typescript
import { useEffect, useState } from "react";

export const useSSE = (channel: string) => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const eventSource = new EventSource(`/api/v1/events/${channel}`);

        eventSource.onmessage = (event) => {
            setData(JSON.parse(event.data));
        };

        return () => eventSource.close();
    }, [channel]);

    return data;
};

// Использование
function MyComponent() {
    const notification = useSSE("project.123");

    return <div>{notification && <p>{notification.object.message}</p>}</div>;
}
```

### 5. Тестирование

```bash
# Тест подключения
curl -N -H "Accept: text/event-stream" \
  "http://localhost:8000/api/v1/events/project.123"

# Отправка тестового события (в Python)
await send_notification("123", "Hello World!")
```

---

## 🔧 Готовые компоненты

Скопируйте эти файлы в ваш проект для быстрого старта:

### EventSource Store (Zustand)

```typescript
// utils/event-source-store.ts
import { create } from "zustand";

type EventHandler = (data: any) => void;

type EventSourceStore = {
    connection: EventSource | null;
    handlers: EventHandler[];
    connect: (url: string, handlers: EventHandler[]) => void;
    disconnect: () => void;
};

export const useEventSourceStore = create<EventSourceStore>((set, get) => ({
    connection: null,
    handlers: [],

    connect: (url, handlers) => {
        const { connection } = get();

        if (connection) connection.close();

        const eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handlers.forEach((handler) => handler(data));
        };

        set({ connection: eventSource, handlers });
    },

    disconnect: () => {
        const { connection } = get();
        if (connection) {
            connection.close();
            set({ connection: null, handlers: [] });
        }
    },
}));
```

### React Query интеграция

```typescript
// hooks/use-realtime-data.ts
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useEventSourceStore } from "../utils/event-source-store";

export const useRealtimeData = (channel: string, queryKey: string[]) => {
    const queryClient = useQueryClient();
    const { connect, disconnect } = useEventSourceStore();

    useEffect(() => {
        const handler = (data: any) => {
            // Обновляем кеш React Query
            queryClient.setQueryData(queryKey, data.object);
        };

        connect(`/api/v1/events/${channel}`, [handler]);

        return () => disconnect();
    }, [channel, queryKey]);
};
```

---

## 📱 Примеры использования

### Real-time уведомления

```typescript
const NotificationComponent = ({ userId }: { userId: string }) => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const eventSource = new EventSource(`/api/v1/events/user.${userId}`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "notification") {
                setNotifications((prev) => [data.object, ...prev]);
            }
        };

        return () => eventSource.close();
    }, [userId]);

    return (
        <div>
            {notifications.map((notif) => (
                <div key={notif.id}>{notif.message}</div>
            ))}
        </div>
    );
};
```

### Прогресс выполнения задач

```typescript
const TaskProgress = ({ taskId }: { taskId: string }) => {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("pending");

    useEffect(() => {
        const eventSource = new EventSource(`/api/v1/events/task.${taskId}`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "progress") {
                setProgress(data.object.progress);
            } else if (data.type === "status") {
                setStatus(data.object.status);
            }
        };

        return () => eventSource.close();
    }, [taskId]);

    return (
        <div>
            <p>Status: {status}</p>
            <progress
                value={progress}
                max="100"
            >
                {progress}%
            </progress>
        </div>
    );
};
```

---

## ✅ Checklist для внедрения

-   [ ] Установлены backend зависимости (`sse-starlette`, `broadcaster`)
-   [ ] Настроен Redis сервер
-   [ ] Создан SSE эндпоинт
-   [ ] Подключен роутер к FastAPI приложению
-   [ ] Реализована функция отправки событий
-   [ ] Создан EventSource клиент на фронтенде
-   [ ] Добавлена обработка ошибок
-   [ ] Протестировано подключение
-   [ ] Добавлено логирование
-   [ ] Настроено CORS (если нужно)

---

## 🚨 Возможные проблемы

1. **CORS ошибки**: Добавьте домен фронтенда в CORS middleware
2. **Соединение не устанавливается**: Проверьте Redis подключение
3. **События не приходят**: Убедитесь что канал совпадает
4. **Утечки памяти**: Не забывайте закрывать EventSource соединения

---

Этого руководства достаточно для быстрого внедрения SSE в ваш проект! Для более детальной информации см. [полную документацию](./sse-integration-guide.md).
