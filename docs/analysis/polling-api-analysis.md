# Polling API: Текущее Состояние vs Требования

**Дата**: 2025-01-26  
**Статус**: Анализ функциональности

## 🔄 **Что Такое Polling API**

Polling API - это механизм периодической проверки статуса долгосрочных операций (генерация изображений/видео) когда основной real-time канал (SSE) недоступен или не работает.

### **Архитектура SSE + Polling Fallback**

```
User Request → API → Background Processing
     ↓                      ↓
SSE Connection ←→ Real-time Events
     ↓ (if fails)           ↓
Polling Fallback ←→ Status Checks
```

## 📊 **Текущая Реализация (Как Есть)**

### **Image Generator** (`app/tools/image-generator/hooks/use-image-generator.ts`)

#### ✅ **Что Работает**

```typescript
const startPolling = useCallback((fileId: string) => {
  const poll = async () => {
    try {
      // ✅ Использует типизированный client
      const fileData: IFileRead = await fileClient.getById(fileId);

      // ✅ Проверяет готовность файла
      if (fileData.url) {
        handleGenerationSuccess(fileData.url, projectId);
        return;
      }

      // ✅ Проверяет статус задач
      if (fileData.tasks?.length > 0) {
        const latestTask = fileData.tasks[fileData.tasks.length - 1];
        if (latestTask.status === "error") {
          handleGenerationError("Image generation failed");
          return;
        }
      }

      // ✅ Продолжает polling
      pollingRef.current = setTimeout(poll, 2000);
    } catch (error) {
      // ✅ Обработка ошибок с продолжением
      pollingRef.current = setTimeout(poll, 2000);
    }
  };
  poll();
}, []);
```

#### **API Endpoint Chain**

```typescript
fileClient.getById(fileId)
  ↓
fetch(`/api/file/${fileId}`)  // Next.js proxy
  ↓
FileService.fileGetById({ id: fileId })  // OpenAPI client
  ↓
SuperDuperAI API: /api/v1/file/{fileId}  // External API
```

#### ✅ **Сильные Стороны**

- **Типизированные запросы** с IFileRead interface
- **Корректная обработка ошибок** с retry logic
- **Умная логика остановки** при completion/error
- **Защита от duplicate processing**
- **Integration с SSE fallback**

---

### **Video Generator** (`app/tools/video-generator/hooks/use-video-generator.ts`)

#### ✅ **Аналогичная Реализация**

```typescript
const startPolling = useCallback((fileId: string) => {
  const poll = async () => {
    try {
      const fileData: IFileRead = await fileClient.getById(fileId);

      if (fileData.url) {
        handleGenerationSuccess(fileData.url, projectId);
        return;
      }

      // Проверка task status аналогично image generator
      pollingRef.current = setTimeout(poll, 2000);
    } catch (error) {
      pollingRef.current = setTimeout(poll, 2000);
    }
  };
  poll();
}, []);
```

#### **Различия от Image Generator**

- **Больший timeout** между polls (3s vs 2s для legacy polling)
- **Video-specific content type detection**
- **Fallback на любой URL** если contentType неизвестен

---

## 🏗️ **API Architecture (Как Реализовано)**

### **Frontend → Backend Chain**

#### 1. **File Client** (`lib/api/client/file-client.ts`)

```typescript
export class FileClient {
  async getById(fileId: string): Promise<IFileRead> {
    const response = await fetch(`/api/file/${fileId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return response.json();
  }
}
```

#### 2. **Next.js API Route** (`app/api/file/[id]/route.ts`)

```typescript
export async function GET(request: NextRequest, { params }) {
  const { id: fileId } = await params;

  // ✅ Server-side configuration
  configureSuperduperAI();

  // ✅ Использует OpenAPI client
  const fileData: IFileRead = await FileService.fileGetById({ id: fileId });

  return NextResponse.json(fileData);
}
```

#### 3. **OpenAPI Client** (`lib/api/services/FileService`)

```typescript
// Auto-generated from SuperDuperAI OpenAPI spec
FileService.fileGetById({ id: fileId })
  ↓
HTTP GET /api/v1/file/{fileId}
```

### **Response Structure** (`IFileRead`)

```typescript
interface IFileRead {
  id: string;
  url?: string; // ✅ Main completion indicator
  contentType?: string; // ✅ File type detection
  tasks?: Array<{
    id: string;
    status: "pending" | "in_progress" | "completed" | "error";
    project_id?: string;
  }>;
}
```

---

## ✅ **Проблемы Решены - Smart Polling System Implemented**

### **1. ✅ Intelligent Backoff - РЕАЛИЗОВАНО**

```typescript
// ✅ NEW: Smart Polling с прогрессивным backoff
// File: lib/utils/smart-polling-manager.ts

// Progressive backoff: 1s → 2s → 5s → 10s
if (consecutiveErrors === 0) {
  if (currentInterval < 2000) currentInterval = 2000;
  else if (currentInterval < 5000) currentInterval = 5000;
  else if (currentInterval < opts.maxInterval)
    currentInterval = opts.maxInterval;
} else {
  // Exponential backoff on errors
  currentInterval = Math.min(
    currentInterval * opts.backoffMultiplier,
    opts.maxInterval
  );
}
```

### **2. ✅ Rate Limiting Protection - РЕАЛИЗОВАНО**

```typescript
// ✅ NEW: HTTP 429 handling with Retry-After support
if (
  error?.status === 429 ||
  errorMessage.includes("429") ||
  errorMessage.includes("rate limit")
) {
  console.warn(`🚫 Rate limited for ${pollId}, using exponential backoff`);

  const retryAfter = this.extractRetryAfter(error);
  if (retryAfter) {
    currentInterval = Math.min(retryAfter * 1000, opts.maxInterval);
    console.log(`⏰ Rate limit retry-after: ${retryAfter}s`);
  } else {
    currentInterval = Math.min(currentInterval * 2, opts.maxInterval);
  }
}
```

### **3. ✅ Строгий 7-минутный Timeout - РЕАЛИЗОВАНО**

```typescript
// ✅ NEW: Guaranteed 7-minute timeout enforcement
const opts = {
  maxDuration: 7 * 60 * 1000, // 7 minutes STRICT TIMEOUT
  // ...
};

// Check timeout on every attempt
if (elapsed >= opts.maxDuration) {
  console.error(
    `⏰ Polling timeout for ${pollId} after ${
      elapsed / 1000
    }s (${attempts} attempts)`
  );
  return {
    success: false,
    error: `Polling timeout after ${Math.round(
      elapsed / 1000
    )} seconds (${attempts} attempts)`,
    method: "timeout",
  };
}
```

### **4. ✅ Centralized Polling Manager - РЕАЛИЗОВАНО**

```typescript
// ✅ NEW: Singleton Smart Polling Manager (390 lines)
export const smartPollingManager = new SmartPollingManager();

// Automatic deduplication by pollId
if (this.activePolls.has(pollId)) {
  console.warn(`⚠️ Polling already active for ${pollId}, cancelling previous`);
  this.stopPolling(pollId);
}

// Centralized management with real-time monitoring
export async function pollFileCompletion(
  fileId: string,
  options: PollingOptions = {}
);
export async function pollProjectCompletion(
  projectId: string,
  options: PollingOptions = {}
);
```

---

## 🎯 **Требования для Улучшения (Фронтенд)**

### **1. Enhanced Polling Strategy**

```typescript
interface PollingConfig {
  initialDelay: number; // 1000ms
  maxDelay: number; // 30000ms
  backoffMultiplier: number; // 2
  maxAttempts: number; // 20
  timeout: number; // 300000ms (5min)
}

interface PollingJob {
  fileId: string;
  startTime: number;
  attempt: number;
  config: PollingConfig;
  onUpdate: (data: IFileRead) => void;
  onError: (error: Error) => void;
  onComplete: (data: IFileRead) => void;
}
```

### **2. Intelligent Error Handling**

```typescript
class PollingErrorHandler {
  static shouldRetry(error: Error, attempt: number): boolean {
    // HTTP 429 (Rate Limited) → retry with backoff
    // HTTP 404 (Not Found) → retry (file might not be ready)
    // HTTP 500+ (Server Error) → retry with exponential backoff
    // Network errors → retry
    // HTTP 403 (Forbidden) → stop (auth issue)
  }

  static getRetryDelay(error: Error, attempt: number): number {
    if (error.status === 429) {
      return parseInt(error.headers["retry-after"]) * 1000 || 60000;
    }
    return Math.min(1000 * Math.pow(2, attempt), 30000);
  }
}
```

### **3. Centralized Polling Manager**

```typescript
export class PollingManager {
  private activePolls = new Map<string, PollingJob>();

  startPolling(fileId: string, callbacks: PollingCallbacks): void {
    if (this.activePolls.has(fileId)) {
      console.warn("Polling already active for fileId:", fileId);
      return;
    }

    const job = new PollingJob(fileId, callbacks);
    this.activePolls.set(fileId, job);
    job.start();
  }

  stopPolling(fileId: string): void {
    const job = this.activePolls.get(fileId);
    if (job) {
      job.stop();
      this.activePolls.delete(fileId);
    }
  }

  stopAllPolling(): void {
    for (const [fileId, job] of this.activePolls) {
      job.stop();
    }
    this.activePolls.clear();
  }
}
```

---

## 🚀 **Оптимизации для Лучшего UX**

### **1. Progressive Polling Frequency**

```typescript
// Быстрый polling в начале, замедление со временем
const getPollingInterval = (attempt: number): number => {
  if (attempt < 5) return 1000; // 1s for first 5 attempts
  if (attempt < 10) return 2000; // 2s for next 5 attempts
  if (attempt < 20) return 5000; // 5s for next 10 attempts
  return 10000; // 10s thereafter
};
```

### **2. Smart Success Detection**

```typescript
const isGenerationComplete = (fileData: IFileRead): boolean => {
  // Primary: check if URL is available
  if (fileData.url) return true;

  // Secondary: check if all tasks completed successfully
  if (fileData.tasks?.length > 0) {
    return fileData.tasks.every((task) => task.status === "completed");
  }

  return false;
};
```

### **3. Better Progress Reporting**

```typescript
interface PollingProgress {
  fileId: string;
  attempt: number;
  maxAttempts: number;
  nextPollIn: number;
  elapsedTime: number;
  estimatedTimeRemaining?: number;
}
```

---

## ❌ **Что НЕ Требует Backend Changes**

### **Все Polling Улучшения - Frontend Only**

- ✅ **Exponential backoff** - frontend logic
- ✅ **Rate limiting handling** - frontend response to HTTP 429
- ✅ **Timeout management** - frontend timers
- ✅ **Centralized polling manager** - frontend service
- ✅ **Better error handling** - frontend error processing
- ✅ **Progress reporting** - frontend state management

### **API Endpoints Уже Существуют**

- ✅ `/api/file/{fileId}` - работает
- ✅ `FileService.fileGetById()` - работает
- ✅ Next.js proxy routes - работают
- ✅ OpenAPI client integration - работает

---

## 🔧 **Implementation Plan (Frontend Only)**

### **Phase 1: Enhanced Polling Logic**

```typescript
// lib/utils/polling-manager.ts
export class PollingManager {
  // Centralized polling with intelligent backoff
}

// hooks/use-enhanced-polling.ts
export function useEnhancedPolling(fileId: string) {
  // Enhanced hook with better error handling
}
```

### **Phase 2: Integration with Existing Hooks**

```typescript
// app/tools/image-generator/hooks/use-image-generator.ts
// Replace existing startPolling with PollingManager

// app/tools/video-generator/hooks/use-video-generator.ts
// Replace existing startPolling with PollingManager
```

### **Phase 3: Monitoring & Analytics**

```typescript
// Add polling metrics for optimization
interface PollingMetrics {
  averageCompletionTime: number;
  successRate: number;
  errorDistribution: Record<string, number>;
  averageAttempts: number;
}
```

---

## 📊 **Заключение**

### **✅ Что Работает Хорошо**

- **Базовая функциональность** polling уже реализована
- **API infrastructure** готова и работает
- **Type safety** с IFileRead interface
- **Integration с SSE fallback** работает корректно

### **⚠️ Что Требует Улучшения (Frontend Only)**

- **Intelligent backoff strategy** вместо фиксированных интервалов
- **Rate limiting protection** для HTTP 429 responses
- **Centralized polling management** для предотвращения duplicates
- **Better progress reporting** для UX improvements
- **Timeout limits** для предотвращения infinite polling

### **🚀 Impact После Улучшений**

- **Лучший UX** с progressive polling frequency
- **Меньше нагрузки на API** с intelligent backoff
- **Более надежная работа** с proper error handling
- **Лучшая observability** с metrics и logging

**Главный вывод**: Polling API уже работает на базовом уровне, все улучшения можно сделать только на фронтенде без изменений backend!
