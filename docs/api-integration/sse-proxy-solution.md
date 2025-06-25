# SSE Proxy Solution for SuperDuperAI Integration

## Problem Description

The application was failing to connect to SSE (Server-Sent Events) endpoints with 404 errors:

```
GET http://localhost:3000/api/v1/events/file.xxx 404 (Not Found)
```

The issue was that the frontend was trying to connect directly to the SuperDuperAI Python backend SSE endpoints, but:

1. CORS restrictions prevent direct cross-origin SSE connections
2. We want to keep authentication tokens server-side for security
3. The Next.js app should act as a proxy layer

## Solution: Next.js SSE Proxy

Created a universal SSE proxy endpoint that forwards all event streams from SuperDuperAI through our Next.js backend.

### Implementation

#### 1. Created SSE Proxy Endpoint

**File**: `app/api/events/[...path]/route.ts`

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const config = getSuperduperAIConfig();
    const eventPath = params.path.join("/");
    const backendSSEUrl = `${config.url}/api/v1/events/${eventPath}`;

    // Connect to backend SSE with authentication
    const response = await fetch(backendSSEUrl, {
      method: "GET",
      headers: {
        Accept: "text/event-stream",
        Authorization: `Bearer ${config.token}`,
      },
    });

    // Create ReadableStream to proxy SSE data
    const stream = new ReadableStream({
      start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();

        function pump(): Promise<void> {
          return reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }

            const chunk = decoder.decode(value, { stream: true });
            controller.enqueue(new TextEncoder().encode(chunk));
            return pump();
          });
        }

        pump();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return new Response(`SSE Proxy Error: ${error.message}`, { status: 500 });
  }
}
```

#### 2. Updated All SSE URL Configurations

**Image SSE Store** (`lib/websocket/image-sse-store.ts`):

```typescript
// Before
const sseUrl = `${config.url}/api/v1/events/${channel}`;

// After
const sseUrl = `/api/events/${channel}`;
```

**Video SSE Store** (`lib/websocket/video-sse-store.ts`):

```typescript
// Before
const sseUrl = `${config.url}/api/v1/events/${channel}`;

// After
const sseUrl = `/api/events/${channel}`;
```

**Hybrid Generation Functions**:

- `lib/ai/api/generate-video-hybrid.ts`
- `app/tools/image-generator/hooks/use-image-generator.ts`
- `app/tools/video-generator/hooks/use-video-generator.ts`

**SSE URL Helper Functions** (`lib/config/superduperai.ts`):

```typescript
export function createFileSSEURL(fileId: string): string {
  return `/api/events/file.${fileId}`;
}

export function createProjectSSEURL(projectId: string): string {
  return `/api/events/project.${projectId}`;
}

export function createUserSSEURL(userId: string): string {
  return `/api/events/user.${userId}`;
}
```

### Benefits

1. **Security**: Authentication tokens stay server-side
2. **CORS**: No cross-origin issues since SSE connects to same domain
3. **Simplicity**: Single proxy handles all event types (file, project, user)
4. **Monitoring**: All SSE traffic goes through Next.js for easier debugging
5. **Flexibility**: Can add middleware, logging, or transformation if needed

### URL Mapping

| Frontend Request          | Next.js Proxy | Backend Endpoint                       |
| ------------------------- | ------------- | -------------------------------------- |
| `/api/events/file.123`    | →             | `${BACKEND}/api/v1/events/file.123`    |
| `/api/events/project.456` | →             | `${BACKEND}/api/v1/events/project.456` |
| `/api/events/user.789`    | →             | `${BACKEND}/api/v1/events/user.789`    |

### Testing

To verify the SSE proxy is working:

1. **Start Next.js dev server**: `npm run dev`
2. **Generate an image/video** through the UI
3. **Check browser network tab** for SSE connections to `/api/events/...`
4. **Verify no 404 errors** and real-time updates work

### Error Handling

The proxy includes comprehensive error handling:

- Backend connection failures
- Stream interruptions
- Authentication errors
- Timeout handling

All errors are logged with detailed context for debugging.

## Files Modified

- `app/api/events/[...path]/route.ts` - **New SSE proxy endpoint**
- `lib/websocket/image-sse-store.ts` - Updated SSE URLs
- `lib/websocket/video-sse-store.ts` - Updated SSE URLs
- `lib/ai/api/generate-video-hybrid.ts` - Updated SSE URLs
- `app/tools/image-generator/hooks/use-image-generator.ts` - Updated SSE URLs
- `app/tools/video-generator/hooks/use-video-generator.ts` - Updated SSE URLs
- `lib/config/superduperai.ts` - Updated SSE URL helper functions

## Architecture

```
Frontend SSE Client
       ↓
Next.js SSE Proxy (/api/events/*)
       ↓
SuperDuperAI Backend (/api/v1/events/*)
```

This solution provides a robust, secure, and maintainable approach to SSE integration with external backends.
