# SuperDuperAI API Integration Guide

## Overview

Super Chatbot uses [SuperDuperAI API](https://dev-editor.superduperai.co) as the primary backend for AI-powered media generation. This document provides comprehensive integration guidelines based on the [OpenAPI specification](https://dev-editor.superduperai.co/openapi.json).

## API Configuration

### Base Configuration
```typescript
const SUPERDUPERAI_CONFIG = {
  baseUrl: 'https://dev-editor.superduperai.co',
  apiVersion: 'v1',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 2000 // 2 seconds
}

const headers = {
  'Authorization': `Bearer ${process.env.SUPERDUPERAI_API_TOKEN}`,
  'Content-Type': 'application/json',
  'User-Agent': 'SuperChatbot/1.0'
}
```

### Environment Variables
```bash
# Required for SuperDuperAI integration
SUPERDUPERAI_API_TOKEN=your_api_token_here
SUPERDUPERAI_BASE_URL=https://dev-editor.superduperai.co
SUPERDUPERAI_WS_URL=wss://dev-editor.superduperai.co/ws
```

## Core API Endpoints

### Authentication
- `GET /api/v1/auth/login` - Initiate login flow
- `GET /api/v1/auth/callback` - Handle login callback
- `GET /api/v1/auth/token` - Get current token
- `GET /api/v1/auth/logout` - Logout user

### Image Generation
- `POST /api/v1/file/generate-image` - Create image generation
- `GET /api/v1/file/{id}` - Get file status
- `GET /api/v1/events/file.{id}` - SSE events for real-time updates

📋 **See detailed guide:** [Image Generation API Guide](./image-generation-api-guide.md)

### Video Generation
- `POST /api/v1/file/generate-video` - Create video generation
- `GET /api/v1/file/{id}` - Get file status
- `GET /api/v1/events/file.{id}` - SSE events for real-time updates

📋 **See detailed guide:** [Video Generation API Guide](./video-generation-api-guide.md)

### File Management
- `POST /api/v1/file` - Upload file
- `GET /api/v1/file/{id}` - Get file info
- `GET /api/v1/file/{id}/download` - Download file

## Integration Implementation

### Service Layer Pattern
```typescript
// lib/services/superduperai.ts
export class SuperDuperAIService {
  private baseUrl = process.env.SUPERDUPERAI_BASE_URL!
  private token = process.env.SUPERDUPERAI_API_TOKEN!
  private ws: WebSocket | null = null

  constructor() {
    this.initializeWebSocket()
  }

  async generateImage(params: ImageGenerationParams) {
    // Implementation details...
  }

  async generateVideo(params: VideoGenerationParams) {
    // Implementation details...
  }

  private initializeWebSocket() {
    // WebSocket setup...
  }
}
```

### API Route Integration
```typescript
// app/api/generate/image/route.ts
import { SuperDuperAIService } from '@/lib/services/superduperai'

export async function POST(request: Request) {
  try {
    const params = await request.json()
    const service = new SuperDuperAIService()
    const result = await service.generateImage(params)
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: 'Generation failed' },
      { status: 500 }
    )
  }
}
```

## Error Handling

### SuperDuperAI Error Types
```typescript
interface SuperDuperAIError {
  status: number
  message: string
  details?: any
}

const ERROR_CODES = {
  AUTHENTICATION_FAILED: 401,
  VALIDATION_ERROR: 422,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500
} as const
```

### Retry Logic Implementation
```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) break
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}
```

## WebSocket Integration

### Real-time Updates
```typescript
class SuperDuperAIWebSocket {
  private ws: WebSocket | null = null
  private eventHandlers = new Map<string, Function[]>()

  connect() {
    this.ws = new WebSocket('wss://dev-editor.superduperai.co/ws')
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      this.handleMessage(message)
    }
  }

  private handleMessage(message: any) {
    const { type, object } = message
    
    switch (type) {
      case 'render_progress':
        this.emit('progress', object)
        break
      case 'render_result':
        this.emit('complete', object)
        break
      case 'task':
        this.emit('task_update', object)
        break
    }
  }

  on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  private emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event) || []
    handlers.forEach(handler => handler(data))
  }
}
```

## Best Practices

### Performance Optimization
1. **Connection Pooling**: Reuse HTTP connections
2. **Caching**: Cache generation results
3. **Compression**: Use gzip compression
4. **CDN**: Serve media through CDN

### Security Measures
1. **API Key Protection**: Never expose API keys client-side
2. **Input Validation**: Validate all parameters
3. **Rate Limiting**: Implement client-side limits
4. **Error Sanitization**: Don't expose internal errors

### Monitoring
```typescript
// lib/monitoring/superduperai.ts
export class SuperDuperAIMonitoring {
  static trackApiCall(endpoint: string, duration: number, success: boolean) {
    console.log(`SuperDuperAI: ${endpoint} - ${duration}ms - ${success}`)
    
    // Send to analytics
    if (typeof window !== 'undefined') {
      // Client-side tracking
    } else {
      // Server-side tracking
    }
  }
}
```

## Testing

### Mock Service for Testing
```typescript
// lib/services/__mocks__/superduperai.ts
export class MockSuperDuperAIService {
  async generateImage(params: any) {
    return {
      id: 'mock-id',
      status: 'completed',
      url: 'https://example.com/mock-image.png'
    }
  }

  async generateVideo(params: any) {
    return {
      id: 'mock-id',
      status: 'completed',
      url: 'https://example.com/mock-video.mp4'
    }
  }
}
```

### Integration Tests
```typescript
// tests/integration/superduperai.test.ts
describe('SuperDuperAI Integration', () => {
  test('should generate image successfully', async () => {
    const service = new SuperDuperAIService()
    const result = await service.generateImage({
      prompt: 'Test image',
      width: 1024,
      height: 1024
    })
    
    expect(result.status).toBe('completed')
    expect(result.url).toBeTruthy()
  })
})
```

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Check API token validity
   - Verify environment variables

2. **Rate Limiting**
   - Implement exponential backoff
   - Monitor request frequency

3. **Generation Timeouts**
   - Increase timeout values
   - Use WebSocket for updates

4. **WebSocket Disconnections**
   - Implement reconnection logic
   - Handle connection state properly

## Migration Checklist

- [ ] Add SuperDuperAI environment variables
- [ ] Implement authentication flow
- [ ] Update image generation endpoints
- [ ] Update video generation endpoints
- [ ] Add WebSocket integration
- [ ] Update error handling
- [ ] Add monitoring and logging
- [ ] Update tests
- [ ] Update documentation

## References

- [SuperDuperAI OpenAPI Spec](https://dev-editor.superduperai.co/openapi.json)
- [WebSocket API Documentation](https://dev-editor.superduperai.co/ws)
- [Rate Limiting Guidelines](https://dev-editor.superduperai.co/rate-limits) 