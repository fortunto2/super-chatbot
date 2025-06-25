# Technical Specifications

## Frontend Implementation Details

### Next.js Configuration
```typescript
// next.config.ts
experimental: {
  ppr: true, // Partial Pre-Rendering enabled
}
```

### Component Architecture
- **Server Components**: Used for static content and initial data loading
- **Client Components**: Interactive elements with `"use client"` directive
- **Hybrid Rendering**: Combines SSR and CSR for optimal performance

### State Management Pattern
```typescript
// Using SWR for client-side data fetching
import useSWR from 'swr'

function ChatHistory() {
  const { data, error, isLoading } = useSWR('/api/history', fetcher)
  // Component logic
}
```

## Backend API Architecture

### Route Structure
```
app/
├── (auth)/
│   ├── api/auth/[...nextauth]/
│   └── api/auth/guest/
├── (chat)/
│   ├── api/chat/
│   ├── api/document/
│   ├── api/files/upload/
│   ├── api/history/
│   ├── api/message-count/
│   ├── api/save-message/
│   ├── api/suggestions/
│   └── api/vote/
└── api/sentry-debug/
```

### Middleware Implementation
```typescript
// middleware.ts key features:
- Guest user authentication with regex pattern matching
- Sentry integration for request tracing
- Automatic redirection handling
- CSRF protection
- Rate limiting preparation
```

### Authentication Flow
```typescript
// NextAuth v5 configuration
- Guest authentication: /^guest-\d+$/
- Session management with JWT
- Secure cookie configuration
- Automatic user cleanup
```

## AI Agent System

### Tool Architecture
```typescript
// Tool registration pattern
export const toolName = tool({
  description: 'Tool description',
  parameters: z.object({
    // Zod schema validation
  }),
  execute: async (params) => {
    // Tool implementation
  }
})
```

### Available Tools
1. **create-document**: Creates editable documents with real-time collaboration
2. **update-document**: Modifies existing documents with version control
3. **configure-image-generation**: Handles FLUX Pro/Dev image generation
4. **configure-video-generation**: Manages Runway/Stable Video generation
5. **get-weather**: Fetches real-time weather data
6. **request-suggestions**: Generates contextual suggestions
7. **diagnose-styles**: Analyzes and recommends UI/UX improvements

### Image Generation Specifications
```typescript
// Supported resolutions
const RESOLUTIONS: MediaResolution[] = [
  { width: 1920, height: 1080, aspectRatio: "16:9", qualityType: "full_hd" },
  { width: 1024, height: 1024, aspectRatio: "1:1", qualityType: "hd" },
  // ... more resolutions
];

// Shot size options
enum ShotSizeEnum {
  EXTREME_LONG_SHOT = 'Extreme Long Shot',
  LONG_SHOT = 'Long Shot',
  MEDIUM_SHOT = 'Medium Shot',
  CLOSE_UP = 'Close-Up',
  // ... more shot sizes
}
```

### Video Generation Specifications
```typescript
// Frame rate options
const VIDEO_FRAME_RATES = [
  { value: 24, label: "24 FPS (Cinematic)" },
  { value: 30, label: "30 FPS (Standard)" },
  { value: 60, label: "60 FPS (Smooth)" },
  { value: 120, label: "120 FPS (High Speed)" }
];

// Supported models
const VIDEO_MODELS: VideoModel[] = [
  { id: 'superduperai-veo3', label: 'SuperDuperAi Veo3' },
  { id: 'runway-gen3', label: 'Runway Gen-3' },
  { id: 'runway-gen2', label: 'Runway Gen-2' },
  { id: 'stable-video', label: 'Stable Video Diffusion' }
];
```

## Database Schema

### Drizzle ORM Configuration
```typescript
// drizzle.config.ts
export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.POSTGRES_URL!,
  },
}
```

### Key Tables
- **users**: User authentication and profile data
- **chats**: Chat session management
- **messages**: Individual chat messages with metadata
- **documents**: Document artifacts and versions
- **media**: Generated images and videos
- **usage_tracking**: API usage and rate limiting

## File Storage Architecture

### Vercel Blob Integration
```typescript
// File upload pattern
import { put } from '@vercel/blob'

async function uploadFile(file: File) {
  const blob = await put(file.name, file, {
    access: 'public',
    addRandomSuffix: true,
  })
  return blob.url
}
```

### Supported File Types
- **Images**: PNG, JPEG, WebP, GIF
- **Videos**: MP4, WebM, MOV
- **Documents**: PDF, TXT, CSV, DOCX
- **Code**: JS, TS, PY, JSON, MD
- **Data**: XLS, XLSX, JSON, CSV

## WebSocket Implementation

### Real-time Features
```typescript
// WebSocket connection management
class WebSocketManager {
  private connections: Map<string, WebSocket>
  
  broadcast(message: any) {
    this.connections.forEach(ws => ws.send(JSON.stringify(message)))
  }
  
  handleConnection(ws: WebSocket, userId: string) {
    this.connections.set(userId, ws)
    // Connection handling logic
  }
}
```

### Message Streaming
- **AI Response Streaming**: Real-time token-by-token response
- **Progress Updates**: Generation progress for media
- **Typing Indicators**: User activity status
- **Connection Recovery**: Automatic reconnection handling

## Security Implementation

### Input Validation
```typescript
// Zod schema validation
const messageSchema = z.object({
  content: z.string().min(1).max(10000),
  chatId: z.string().optional(),
  attachments: z.array(z.object({
    type: z.enum(['image', 'document', 'code']),
    url: z.string().url()
  })).optional()
})
```

### CSRF Protection
```typescript
// Built-in Next.js CSRF protection
// Custom token validation for API routes
function validateCSRFToken(token: string) {
  // Token validation logic
}
```

### Rate Limiting
```typescript
// Rate limiting implementation
const rateLimiter = new Map<string, number[]>()

function checkRateLimit(userId: string, limit: number = 100) {
  const now = Date.now()
  const userRequests = rateLimiter.get(userId) || []
  // Rate limiting logic
}
```

## Performance Optimizations

### Database Optimizations
```sql
-- Example indexes for optimal query performance
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_users_email ON users(email);
```

### Caching Strategy
```typescript
// Redis caching for frequently accessed data
import { Redis } from 'redis'

const redis = new Redis(process.env.REDIS_URL)

async function getCachedData(key: string) {
  const cached = await redis.get(key)
  return cached ? JSON.parse(cached) : null
}
```

### Bundle Optimization
```typescript
// Dynamic imports for code splitting
const ImageEditor = dynamic(() => import('./ImageEditor'), {
  loading: () => <Loading />,
  ssr: false
})
```

## Monitoring & Analytics

### Sentry Configuration
```typescript
// sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
})
```

### Custom Metrics
```typescript
// Usage tracking implementation
async function trackUsage(userId: string, action: string, metadata?: any) {
  await db.insert(usageTracking).values({
    userId,
    action,
    metadata: JSON.stringify(metadata),
    timestamp: new Date()
  })
}
```

## Development Workflow

### Build Process
```bash
# Development
pnpm dev --turbo

# Production build
pnpm build

# Database migrations
pnpm db:migrate

# Testing
pnpm test
```

### Code Quality
```typescript
// Biome configuration
{
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noUnusedVariables": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentSize": 2
  }
}
```

### Testing Strategy
```typescript
// Playwright E2E tests
test('chat functionality', async ({ page }) => {
  await page.goto('/chat')
  await page.fill('[data-testid="message-input"]', 'Hello AI')
  await page.click('[data-testid="send-button"]')
  await expect(page.locator('[data-testid="ai-response"]')).toBeVisible()
})
```

## Deployment Configuration

### Vercel Settings
```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Environment Variables
```bash
# Required environment variables
AUTH_SECRET=              # NextAuth secret
POSTGRES_URL=            # Database connection
BLOB_READ_WRITE_TOKEN=   # Vercel Blob token
NEXT_PUBLIC_SENTRY_DSN=  # Sentry DSN
AZURE_OPENAI_API_KEY=    # Azure OpenAI key
REDIS_URL=               # Redis connection (optional)
```

## API Endpoints Documentation

### Chat API
- `POST /api/chat` - Send message and get AI response
- `GET /api/history` - Retrieve chat history
- `POST /api/save-message` - Save message to database
- `POST /api/vote` - Rate AI responses

### File API
- `POST /api/files/upload` - Upload files to blob storage
- `GET /api/document/:id` - Retrieve document content
- `PUT /api/document/:id` - Update document content

### Usage API
- `GET /api/message-count` - Get usage statistics
- `POST /api/suggestions` - Request contextual suggestions

## Error Handling Strategy

### Global Error Boundary
```typescript
// Error boundary for React components
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, { extra: errorInfo })
  }
}
```

### API Error Handling
```typescript
// Standardized error responses
interface APIError {
  error: string
  code: number
  details?: any
}

function handleAPIError(error: unknown): APIError {
  if (error instanceof ZodError) {
    return { error: 'Validation error', code: 400, details: error.errors }
  }
  // Other error handling
}
``` 