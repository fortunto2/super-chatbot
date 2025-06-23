# SuperDuperAPI Documentation

## Real-time Communication

### SSE (Server-Sent Events)

-   **[📚 Полное руководство по интеграции SSE](./sse-integration-guide.md)** - Детальное описание архитектуры и реализации
-   **[🚀 Быстрый старт с SSE](./sse-quick-start.md)** - Руководство для быстрого внедрения в новый проект
-   **[SSE Integration Guide](./sse.md)** - Implementation details and usage (deprecated)
-   **[WebSocket vs SSE Migration Analysis](./websocket-vs-sse.md)** - Comprehensive comparison and migration benefits

## Quick Reference

### SSE Endpoints

-   **Endpoint:** `/api/v1/events/{channel}`
-   **Channels:**
    -   `project.{project_id}` - Project-scoped events
    -   `file.{file_id}` - File generation events
    -   `user.{user_id}` - User-level notifications

### Message Types

-   `task` - Task status updates
-   `data` - Data processing updates
-   `file` - File generation progress
-   `entity` - Entity updates
-   `scene` - Scene modifications
-   `render_progress` - Video rendering progress
-   `render_result` - Rendering completion

### Usage Example

```bash
curl -N -H "Accept: text/event-stream" \
  "http://127.0.0.1:8000/api/v1/events/project.123"
```

---

_For more documentation, see the `/backend/docs` directory._
