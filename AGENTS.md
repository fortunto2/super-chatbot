# Super Chatbot Agents.md Guide for AI Assistants

This Agents.md file provides comprehensive guidance for AI assistants working with the Super Chatbot codebase. The project is built with Next.js 15 App Router, TypeScript, and includes advanced AI capabilities for text, image, and video generation.

## AI-First Development Methodology

### Two-Phase Development Process

AI agents working on this project should follow a structured two-phase development approach:

#### Phase 1: Implementation Planning
Before writing any code, AI agents must:
1. **Create a detailed implementation plan** that includes:
   - Architecture decisions and component structure
   - Database schema changes if needed
   - API endpoints and data flow
   - Integration points with SuperDuperAI API
   - Testing strategy and test cases
   - Deployment considerations
   - Dependencies and potential conflicts

2. **Review and validate the plan**:
   - Check for logical inconsistencies
   - Verify alignment with existing architecture
   - Ensure all requirements are addressed
   - Identify potential edge cases

3. **Get human approval** before proceeding to implementation

#### Phase 2: Code Implementation
Only after plan approval:
1. Execute the implementation following the approved plan
2. Write code with proper AICODE comments (see below)
3. Implement tests as specified in the plan
4. Create Pull Request with plan reference

### AICODE Comment System for AI Memory

AI agents must use a structured comment system to maintain context and memory across sessions:

#### Comment Types
- `AICODE-NOTE`: Important information for future AI sessions about complex logic, architecture decisions, or implementation details
- `AICODE-TODO`: Tasks or improvements to be addressed in future sessions
- `AICODE-ASK`: Questions from AI agents that require human clarification or decision

#### Usage Patterns
```typescript
// AICODE-NOTE: This WebSocket connection handles real-time SuperDuperAI generation updates
// AICODE-NOTE: Using exponential backoff to handle rate limiting gracefully
const connectToGenerationUpdates = (generationId: string) => {
  // AICODE-TODO: Add connection retry logic with max attempts
  const ws = new WebSocket(`wss://dev-editor.superduperai.co/ws`)
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data)
    // AICODE-ASK: Should we validate message schema here or trust SuperDuperAI API?
    
    if (message.type === 'render_progress') {
      updateGenerationProgress(generationId, message.object.progress)
    }
  }
  
  return ws
}
```

#### AI Agent Workflow with AICODE Comments
1. **Before modifying any file**: Search for existing AICODE comments using grep
2. **Check current date**: Always run `date` command to verify current date before writing documentation with dates
3. **Read and understand context**: Process all AICODE-NOTE comments in the file
4. **Address questions**: Convert AICODE-ASK comments to AICODE-NOTE after human clarification
5. **Add new comments**: Document complex logic and decisions for future sessions
6. **Update TODO items**: Mark completed AICODE-TODO items or create new ones

#### Search Pattern for AI Agents
Always start file modifications with:
```bash
# Check current date first
date

# Then search for AICODE comments
grep -r "AICODE-" /path/to/file
```

## Project Structure for AI Agent Navigation

- `/app`: Next.js App Router structure that AI agents should understand
  - `/(auth)`: Authentication routes and auto-login functionality
  - `/(chat)`: Main chat interface and API routes
  - `/api`: API endpoints for AI agents to interact with
  - `/debug`: Development debugging tools
- `/components`: React components for AI agents to extend
  - `/ui`: Reusable UI components with Radix UI primitives
  - `/artifacts`: Specialized components for rendering AI-generated content
- `/lib`: Core utilities and configurations for AI agents
  - `/ai`: AI SDK integration and tools
  - `/db`: Database schema and migrations
  - `/types`: TypeScript type definitions
  - `/utils`: Helper functions and utilities
- `/hooks`: Custom React hooks for AI agents to utilize
- `/docs`: Documentation that AI agents should reference and update
- `/tests`: Test files that AI agents should maintain and extend
- `/artifacts`: Generated content storage structure

## AI-Specific Architecture for Agent Understanding

**IMPORTANT**: All AI agents must follow the [AI-First Development Methodology](./docs/development/ai-development-methodology.md) which includes:
- Two-phase development (Planning → Implementation)  
- AICODE comment system for persistent memory
- Implementation plan templates and approval process

### AI Tools System
AI agents should understand these core tools:
- `create-document`: For creating editable documents
- `update-document`: For modifying existing documents  
- `configure-image-generation`: For FLUX Pro/Dev image generation via SuperDuperAI API
- `configure-video-generation`: For SuperDuperAi api (Veo3) video generation via SuperDuperAI API
- `get-weather`: For real-time weather data
- `request-suggestions`: For generating contextual suggestions
- `diagnose-styles`: For UI/UX analysis and recommendations

### SuperDuperAI Backend Integration
AI agents must use **SuperDuperAI API** with auto-generated OpenAPI client as the primary backend for media generation:
- **Base URL**: `https://dev-editor.superduperai.co`
- **Authentication**: Bearer token authentication required
- **OpenAPI Client**: Auto-generated TypeScript client for type safety
- **WebSocket**: Real-time updates for generation progress
- **File Management**: Integrated file upload and download system

### Artifact Types
AI agents should handle these artifact types:
- `text`: Markdown documents with collaborative editing
- `code`: Syntax-highlighted code with execution capabilities
- `image`: Generated images with FLUX models
- `video`: Generated videos with SuperDuperAi Veo3 model
- `sheet`: Interactive spreadsheets with data manipulation

## AI Agent Workflow and Tool Architecture

### Chat AI Agent Tool Chain

The AI agent in chat interface (`app/(chat)/api/chat/route.ts`) uses AI SDK `streamText()` with 8 registered tools for intelligent content generation:

```
📱 User Input → 🌐 Chat API → 🤖 AI Agent → 🔧 Tool Chain → 📄 Artifact Creation
```

#### Available Tools
- `configureImageGeneration`: FLUX Pro/Dev image generation with intelligent parameter selection
- `configureVideoGeneration`: Video generation with model-specific optimization
- `enhancePrompt`: Automatic prompt enhancement and translation (Russian → English)
- `createDocument`: Dynamic artifact creation with real-time progress tracking
- `updateDocument`: Collaborative document editing capabilities
- `requestSuggestions`: Context-aware suggestion generation
- `listVideoModels`: Dynamic video model discovery and caching
- `findBestVideoModel`: Intelligent model selection based on requirements

#### AI Agent Decision Matrix
The AI agent intelligently decides tool usage based on:

**Prompt Enhancement (`enhancePrompt`):**
- Russian text detected → Automatic translation
- Short prompts (<50 characters or <5 words) → Quality enhancement
- Missing technical terms → Professional terminology addition

**Model Selection Logic:**
- Text-to-video: Prioritizes `sora` model
- Image-to-video: Prioritizes `veo2` model
- Text-to-image: Selects based on quality vs. cost analysis
- Dynamic model loading via API with 1-hour caching

**Parameter Intelligence:**
- **Resolutions**: Flexible parsing ("1920x1080", "full hd", "4k", "square")
- **Styles**: Partial matching, case-insensitive ("photorealistic", "anime", "oil painting")
- **Shot Sizes**: Professional terminology ("close-up", "medium-shot", "wide-angle")
- **Batch Processing**: Automatic optimization (1-3 images based on request)

#### Tool Chain Execution Flow
```
1. User Message Analysis
   ↓
2. Enhancement Decision (enhancePrompt if needed)
   ↓
3. Generation Configuration (configureImageGeneration/configureVideoGeneration)
   ↓
4. Artifact Creation (createDocument with real-time progress)
   ↓
5. WebSocket/SSE Updates (live progress tracking)
   ↓
6. Final Result Display
```

#### Key Implementation Files
- **Chat API**: `app/(chat)/api/chat/route.ts` - Main AI agent endpoint
- **System Prompts**: `lib/ai/prompts.ts` - AI agent instructions and behavior
- **Tool Implementations**: `lib/ai/tools/` - Individual tool logic
- **Configuration**: `lib/config/superduperai.ts` - Model discovery and caching
- **Generation Logic**: `lib/ai/api/image-generation/`, `lib/ai/api/video-generation/`

#### Debug and Testing
- API payload logging in artifacts for parameter verification
- Real-time progress tracking via SSE/WebSocket
- Comprehensive error handling with user-friendly messages
- Model discovery with fallback to cached configurations

## Coding Conventions for AI Agents

### General Conventions for Agent Implementation

- **FOLLOW THE METHODOLOGY**: Always use the two-phase development process outlined in [AI Development Methodology](./docs/ai-development-methodology.md)
- **Search for AICODE comments** before modifying any file: `grep -r "AICODE-" path/to/file`
- Use TypeScript for all code generated by AI agents
- Follow Next.js 15 App Router conventions and best practices
- AI agents should use Server Components by default, Client Components when needed
- All comments and code should be in English, even when communicating in other languages
- Use `"use client"` directive only when necessary for interactivity
- Implement proper error boundaries and error handling
- **Document complex logic** with AICODE-NOTE comments
- **Track tasks** with AICODE-TODO comments
- **Ask questions** with AICODE-ASK comments

### React Components Guidelines for AI Agents

- AI agents should use Server Components for static content
- Use Client Components for interactive elements with proper `"use client"` directive
- Follow the established component structure in `/components`
- Use Radix UI primitives for accessibility and consistency
- Implement proper TypeScript interfaces for all props
- File naming convention: kebab-case for directories, PascalCase for components

### API Routes Standards for AI Agents

- AI agents should use Next.js App Router API routes (`app/api/**/route.ts`)
- Implement proper authentication middleware checks
- Use Zod for request/response validation
- Follow REST conventions for endpoint design
- Implement proper error handling with standardized error responses
- Use streaming for real-time AI responses

### Styling Standards for AI Agents

- AI agents should use Tailwind CSS for all styling
- Follow utility-first approach consistently
- Use CSS variables for theme customization
- Implement dark/light mode support
- Use Framer Motion for animations when appropriate
- Follow the existing design system patterns

## Database and Storage Guidelines for AI Agents

### Database Operations
AI agents should use Drizzle ORM for database operations:
```typescript
// Example pattern for AI agents
import { db } from '@/lib/db'
import { chats, messages } from '@/lib/db/schema'

// Always use transactions for related operations
await db.transaction(async (tx) => {
  const chat = await tx.insert(chats).values(chatData)
  await tx.insert(messages).values(messageData)
})
```

### File Storage
AI agents should use Vercel Blob for file storage:
```typescript
// Example pattern for AI agents
import { put } from '@vercel/blob'

const blob = await put(filename, file, {
  access: 'public',
  addRandomSuffix: true,
})
```

## SuperDuperAI API Integration Patterns

### Typed Proxy Architecture (Updated: January 15, 2025)

AI agents must follow the **Typed Proxy Architecture** where frontend never makes direct OpenAPI calls to external APIs. All communication goes through internal Next.js API routes that act as secure proxies using OpenAPI models for type safety.

#### Architecture Overview
```
Current Implementation:
Frontend → Internal API Routes → OpenAPI Client → SuperDuperAI Python Backend (API requests)
Frontend → Direct SSE Connection → SuperDuperAI Python Backend SSE (Real-time events)

Future Plan:
Frontend → Internal API Routes → OpenAPI Client → SuperDuperAI Python Backend (API requests)
Frontend → Internal SSE Proxy → SuperDuperAI Python Backend SSE (Optional for some use cases)
```

**Key Principles:**
- **Security**: External API tokens never exposed to frontend
- **Type Safety**: OpenAPI models used throughout the stack
- **Consistency**: Unified error handling and response format for API requests
- **Performance**: Server-side caching and optimization
- **Maintainability**: Single source of truth for API integration
- **Real-time Performance**: SSE events use direct connections for optimal latency (may add proxy option in future)

### OpenAPI Client Setup
AI agents must use the auto-generated OpenAPI client for SuperDuperAI API:
```bash
# Generate OpenAPI client (run when API schema changes)
pnpm generate-api
```

### Typed Client Architecture Pattern
AI agents should use typed frontend clients that communicate with internal proxy APIs:

```typescript
// Frontend Typed Clients (lib/api/client/)
import { FileClient } from '@/lib/api/client/file-client'
import { GenerationClient } from '@/lib/api/client/generation-client'
import { ModelsClient } from '@/lib/api/client/models-client'

// Example usage in React hooks
const fileClient = new FileClient()
const generationClient = new GenerationClient()
const modelsClient = new ModelsClient()

// Type-safe operations
const fileData = await fileClient.getById(fileId)
const result = await generationClient.generateImage(params)
const models = await modelsClient.getImageModels()
```

### Internal API Routes as Secure Proxies
AI agents must create internal API routes that use OpenAPI client server-side:

```typescript
// app/api/generate/image/route.ts
import { FileService } from '@/lib/api'

export async function POST(request: Request) {
  // Configure OpenAPI client server-side only
  configureServerOpenAPI()
  
  const params = await request.json()
  
  // Use OpenAPI client with typed models
  const result = await FileService.fileGenerateImage({
    requestBody: {
      prompt: params.prompt,
      config_id: params.modelId,
      params: {
        width: params.width,
        height: params.height,
        quality: params.quality
      }
    }
  })
  
  return Response.json(result)
}
```

### Authentication Pattern
AI agents must configure OpenAPI client only on server-side:
```typescript
// Server-side OpenAPI configuration only
import { OpenAPI } from '@/lib/api'

function configureServerOpenAPI() {
  OpenAPI.BASE = process.env.SUPERDUPERAI_BASE_URL || 'https://dev-editor.superduperai.co'
  OpenAPI.TOKEN = process.env.SUPERDUPERAI_API_TOKEN // Never expose to frontend
}

// Frontend uses internal endpoints
const response = await fetch('/api/generate/image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(params)
})
```

### Model Discovery Pattern with Typed Proxy
AI agents should use typed clients for model discovery through internal proxy APIs:

```typescript
// Frontend: Use typed client for model discovery
import { ModelsClient } from '@/lib/api/client/models-client'
import { useModels } from '@/hooks/use-models'

// React hook for model discovery with caching
function useImageModels() {
  const { imageModels, loading, error } = useModels()
  return { models: imageModels, loading, error }
}

// Direct client usage
const modelsClient = new ModelsClient()
const imageModels = await modelsClient.getImageModels()
const videoModels = await modelsClient.getVideoModels()

// Server-side API route (app/api/config/models/route.ts)
import { GenerationConfigService, type IGenerationConfigRead } from '@/lib/api'
import { configureServerOpenAPI } from '@/lib/config/superduperai'

export async function GET() {
  configureServerOpenAPI() // Configure OpenAPI client server-side only
  
  // Fetch models using OpenAPI client server-side
  const [imageResponse, videoResponse] = await Promise.all([
    GenerationConfigService.generationConfigGetList({
      type: 'text_to_image,image_to_image'
    }),
    GenerationConfigService.generationConfigGetList({
      type: 'text_to_video,image_to_video'
    })
  ])
  
  return Response.json({
    imageModels: imageResponse.items || [],
    videoModels: videoResponse.items || [],
    total: (imageResponse.items?.length || 0) + (videoResponse.items?.length || 0)
  })
}

// Type aliases for compatibility
export type ImageModel = IGenerationConfigRead
export type VideoModel = IGenerationConfigRead
```

### Image Generation Pattern with Typed Proxy
AI agents should use this pattern for image generation through internal proxy APIs:

```typescript
// Frontend: Use typed client instead of direct OpenAPI calls
import { GenerationClient } from '@/lib/api/client/generation-client'

async function generateImage(params: ImageGenerationParams) {
  const generationClient = new GenerationClient()
  
  // Type-safe generation through internal proxy
  const result = await generationClient.generateImage({
    prompt: params.prompt,
    negativePrompt: params.negativePrompt,
    modelId: params.model,
    width: params.width,
    height: params.height,
    quality: params.quality || 'hd',
    style: params.style,
    shotSize: params.shotSize,
    seed: params.seed
  })
  
  return result
}

// Server-side API route (app/api/generate/image/route.ts)
import { FileService } from '@/lib/api'
import { configureServerOpenAPI } from '@/lib/config/superduperai'

export async function POST(request: Request) {
  configureServerOpenAPI() // Configure OpenAPI client server-side only
  
  const params = await request.json()
  
  // Use OpenAPI client with typed models server-side
  const result = await FileService.fileGenerateImage({
    requestBody: {
      prompt: params.prompt,
      negative_prompt: params.negativePrompt,
      config_id: params.modelId,
      params: {
        width: params.width,
        height: params.height,
        quality: params.quality,
        style: params.style,
        shot_size: params.shotSize,
        seed: params.seed
      }
    }
  })
  
  return Response.json(result)
}
```

### Video Generation Pattern with Typed Proxy
AI agents should use this pattern for video generation through internal proxy APIs:

```typescript
// Frontend: Use typed client instead of direct OpenAPI calls
import { GenerationClient } from '@/lib/api/client/generation-client'

async function generateVideo(params: VideoGenerationParams) {
  const generationClient = new GenerationClient()
  
  // Type-safe generation through internal proxy
  const result = await generationClient.generateVideo({
    prompt: params.prompt,
    negativePrompt: params.negativePrompt,
    modelId: params.model,
    width: params.width,
    height: params.height,
    duration: params.duration || 10,
    frameRate: params.frameRate || 30,
    aspectRatio: params.aspectRatio || '16:9',
    style: params.style,
    shotSize: params.shotSize,
    seed: params.seed,
    references: params.references || []
  })
  
  return result
}

// Server-side API route (app/api/generate/video/route.ts)
import { FileService } from '@/lib/api'
import { configureServerOpenAPI } from '@/lib/config/superduperai'

export async function POST(request: Request) {
  configureServerOpenAPI() // Configure OpenAPI client server-side only
  
  const params = await request.json()
  
  // Use OpenAPI client with typed models server-side
  const result = await FileService.fileGenerateVideo({
    requestBody: {
      prompt: params.prompt,
      negative_prompt: params.negativePrompt,
      config_id: params.modelId,
      params: {
        width: params.width,
        height: params.height,
        duration: params.duration,
        fps: params.frameRate,
        aspect_ratio: params.aspectRatio,
        style: params.style,
        shot_size: params.shotSize,
        seed: params.seed,
        references: params.references
      }
    }
  })
  
  return Response.json(result)
}
```

### SSE Real-time Updates Pattern (Updated: June 15, 2025)
AI agents should implement Server-Sent Events (SSE) for real-time generation progress. SuperDuperAI Python backend supports three types of SSE channels:

#### SSE Channel Types (SuperDuperAI Python Backend)
1. **File-based events** (Default): `${config.url}/api/v1/events/file.{fileId}` - Recommended for generators
2. **Project-based events** (Legacy): `${config.url}/api/v1/events/project.{projectId}` - Legacy approach
3. **User-based events**: `${config.url}/api/v1/events/user.{userId}` - Global user notifications

#### Current Implementation Status
**✅ Currently**: SSE connections go **directly** to SuperDuperAI Python backend (e.g., `https://dev-editor.superduperai.co/api/v1/events/file.{fileId}`)

**🔮 Future Plan**: SSE events may be optionally proxied through Next.js API routes for additional security/transformation when needed

**Note**: Regular API requests (generation, models) are already proxied through Next.js backend, but SSE events currently use direct connections for real-time performance.

#### File-based SSE Pattern (Recommended - Current Implementation)
```typescript
// AICODE-NOTE: File-based SSE is the default pattern for generators (direct connection)
function connectToFileUpdates(fileId: string) {
  const config = getSuperduperAIConfig()
  // Direct connection to SuperDuperAI Python backend SSE endpoint
  const eventSource = new EventSource(`${config.url}/api/v1/events/file.${fileId}`)
  
  eventSource.onopen = () => {
    console.log('🔌 SSE connected for file:', fileId)
  }
  
  eventSource.onmessage = (event) => {
    const message = JSON.parse(event.data)
    
    if (message.type === 'render_progress') {
      // Update progress in UI
      updateGenerationProgress(fileId, message.object.progress)
    } else if (message.type === 'render_result') {
      // Generation completed
      handleGenerationComplete(fileId, message.object)
    } else if (message.type === 'task') {
      // Task status updates
      handleTaskStatusUpdate(fileId, message.object)
    }
  }
  
  // AICODE-NOTE: Browser handles reconnection automatically
  eventSource.onerror = (error) => {
    console.error('❌ SSE error:', error)
    console.log('🔄 Browser will handle SSE reconnection automatically')
  }
  
  return eventSource
}

// AICODE-NOTE: Future plan - File-based SSE through Next.js proxy (not implemented yet)
function connectToFileUpdatesViaProxy(fileId: string) {
  // TODO: This is a planned feature - SSE proxy through Next.js API routes
  // Currently all SSE connections go directly to SuperDuperAI backend
  const eventSource = new EventSource(`/api/events/file/${fileId}`) // ← This endpoint does not exist yet
  
  eventSource.onopen = () => {
    console.log('🔌 SSE connected for file via proxy:', fileId)
  }
  
  eventSource.onmessage = (event) => {
    const message = JSON.parse(event.data)
    
    if (message.type === 'render_progress') {
      updateGenerationProgress(fileId, message.object.progress)
    } else if (message.type === 'render_result') {
      handleGenerationComplete(fileId, message.object)
    } else if (message.type === 'task') {
      handleTaskStatusUpdate(fileId, message.object)
    }
  }
  
  eventSource.onerror = (error) => {
    console.error('❌ SSE proxy error:', error)
  }
  
  return eventSource
}

// AICODE-NOTE: Project-based SSE (Legacy) - avoid in new implementations
function connectToProjectUpdates(projectId: string) {
  const config = getSuperduperAIConfig()
  // Legacy project-based SSE channel
  const eventSource = new EventSource(`${config.url}/api/v1/events/project.${projectId}`)
  
  eventSource.onopen = () => {
    console.log('🔌 SSE connected for project (legacy):', projectId)
  }
  
  eventSource.onmessage = (event) => {
    const message = JSON.parse(event.data)
    
    if (message.type === 'render_progress') {
      // Update progress in UI
      updateGenerationProgress(projectId, message.object.progress)
    } else if (message.type === 'render_result') {
      // Generation completed
      handleGenerationComplete(projectId, message.object)
    }
  }
  
  eventSource.onerror = (error) => {
    console.error('❌ SSE error:', error)
    console.log('🔄 Browser will handle SSE reconnection automatically')
  }
  
  return eventSource
}

// AICODE-NOTE: User-based SSE for global notifications
function connectToUserUpdates(userId: string) {
  const config = getSuperduperAIConfig()
  const eventSource = new EventSource(`${config.url}/api/v1/events/user.${userId}`)
  
  eventSource.onopen = () => {
    console.log('🔌 SSE connected for user:', userId)
  }
  
  eventSource.onmessage = (event) => {
    const message = JSON.parse(event.data)
    
    // Handle user-wide notifications
    handleUserNotification(userId, message)
  }
  
  eventSource.onerror = (error) => {
    console.error('❌ SSE error:', error)
    console.log('🔄 Browser will handle SSE reconnection automatically')
  }
  
  return eventSource
}
```

### File Operations Pattern with Typed Proxy
AI agents should handle file operations through internal proxy APIs:

```typescript
// Frontend: Use typed client for file operations
import { FileClient } from '@/lib/api/client/file-client'

async function getFileStatus(fileId: string) {
  const fileClient = new FileClient()
  
  // Type-safe file status through internal proxy
  const fileData = await fileClient.getById(fileId)
  
  return {
    status: fileData.tasks?.[0]?.status,
    progress: fileData.tasks?.[0]?.progress,
    downloadUrl: fileData.tasks?.[0]?.result?.file_url
  }
}

// Server-side API route (app/api/file/[id]/route.ts)
import { FileService, type IFileRead } from '@/lib/api'
import { configureServerOpenAPI } from '@/lib/config/superduperai'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  configureServerOpenAPI() // Configure OpenAPI client server-side only
  
  // Use OpenAPI client with typed models server-side
  const fileData = await FileService.fileGetById({
    id: params.id
  })
  
  return Response.json(fileData)
}

// Polling pattern with typed client
async function pollFileStatus(fileId: string): Promise<IFileRead> {
  const fileClient = new FileClient()
  
  while (true) {
    const fileData = await fileClient.getById(fileId)
    const latestTask = fileData.tasks?.[0]
    
    if (latestTask?.status === 'completed') {
      return fileData
    } else if (latestTask?.status === 'error') {
      throw new Error('Generation failed')
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
}
```

## AI Integration Patterns for Agents

### Tool Usage Pattern
AI agents should follow this pattern for tool integration:
```typescript
import { tool } from 'ai'
import { z } from 'zod'

export const toolName = tool({
  description: 'Clear description of tool functionality',
  parameters: z.object({
    // Zod schema for validation
  }),
  execute: async (params) => {
    // Tool implementation with proper error handling
  }
})
```

### Streaming Response Pattern
AI agents should implement streaming for real-time responses:
```typescript
// Example streaming implementation
export async function POST(request: Request) {
  const { messages } = await request.json()
  
  const result = await streamText({
    model: openai('gpt-4'),
    messages,
    tools: {
      // Available tools
    }
  })
  
  return result.toAIStreamResponse()
}
```

## Testing Requirements for AI Agents

AI agents should run tests with these commands:

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test -- tests/specific-test.spec.ts

# Run tests with coverage
pnpm test -- --coverage

# Run E2E tests
pnpm test:e2e
```

### Test Patterns for AI Agents
- Use Playwright for E2E testing of AI interactions
- Test AI tool functionality with mock responses
- Implement proper error case testing
- Test WebSocket connections and streaming

## Development Workflow for AI Agents

### Development Commands
```bash
# Start development server with Turbo
pnpm dev

# Run linting and formatting
pnpm lint
pnpm format

# Database operations
pnpm db:migrate    # Run migrations
pnpm db:studio     # Open database studio
pnpm db:generate   # Generate schema

# Build for production
pnpm build
```

### Code Quality Standards
AI agents should ensure:
- All code passes Biome linting and formatting
- TypeScript strict mode compliance
- Proper error handling and logging
- Accessibility standards compliance
- Performance optimization

## Security Guidelines for AI Agents

### Authentication and Authorization
- Always validate user sessions with NextAuth
- Implement proper rate limiting for AI endpoints
- Use guest authentication for anonymous users
- Validate all inputs with Zod schemas

### Data Validation
```typescript
// Example validation pattern for AI agents
import { z } from 'zod'

const messageSchema = z.object({
  content: z.string().min(1).max(10000),
  chatId: z.string().optional(),
  attachments: z.array(z.object({
    type: z.enum(['image', 'document', 'code']),
    url: z.string().url()
  })).optional()
})
```

## Deployment Guidelines for AI Agents

### Environment Variables
AI agents should be aware of these required environment variables:
- `AUTH_SECRET`: NextAuth secret key
- `POSTGRES_URL`: Database connection string
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob access token
- `AZURE_OPENAI_API_KEY`: Azure OpenAI API key
- `NEXT_PUBLIC_SENTRY_DSN`: Sentry monitoring DSN
- `SUPERDUPERAI_API_TOKEN`: SuperDuperAI API authentication token
- `SUPERDUPERAI_BASE_URL`: SuperDuperAI API base URL (https://dev-editor.superduperai.co)

### Vercel Deployment
- Use Vercel for optimal Next.js deployment
- Configure proper function timeouts for AI operations
- Set up proper environment variable management
- Enable Sentry monitoring for error tracking

## Error Handling Patterns for AI Agents

### API Error Handling
```typescript
// Standardized error response pattern
interface APIError {
  error: string
  code: number
  details?: any
}

function handleAPIError(error: unknown): APIError {
  if (error instanceof ZodError) {
    return { error: 'Validation error', code: 400, details: error.errors }
  }
  if (error instanceof DatabaseError) {
    return { error: 'Database error', code: 500 }
  }
  return { error: 'Internal server error', code: 500 }
}

// SuperDuperAI API Error Handling
async function handleSuperDuperAIError(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    
    switch (response.status) {
      case 401:
        throw new Error('SuperDuperAI authentication failed - check API token')
      case 422:
        throw new Error(`SuperDuperAI validation error: ${JSON.stringify(errorData)}`)
      case 429:
        throw new Error('SuperDuperAI rate limit exceeded')
      case 500:
        throw new Error('SuperDuperAI internal server error')
      default:
        throw new Error(`SuperDuperAI API error: ${response.status} ${response.statusText}`)
    }
  }
}

// Enhanced generation status polling with error handling
async function pollGenerationStatusWithRetry(
  type: 'image' | 'video', 
  id: string, 
  maxRetries: number = 3
) {
  let retries = 0
  
  while (true) {
    try {
      const response = await fetch(
        `${SUPERDUPERAI_BASE_URL}/api/v1/generation/${type}/${id}`,
        { headers }
      )
      
      await handleSuperDuperAIError(response)
      const result = await response.json()
      
      if (result.status === 'completed') {
        return result
      } else if (result.status === 'error') {
        throw new Error(result.error || 'Generation failed')
      }
      
      // Reset retry counter on successful request
      retries = 0
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, 2000))
      
    } catch (error) {
      retries++
      if (retries >= maxRetries) {
        throw new Error(`Generation polling failed after ${maxRetries} retries: ${error}`)
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, retries), 10000)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}
```

### Client Error Handling
```typescript
// Error boundary pattern for AI agents
'use client'

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundaryComponent
      fallback={<ErrorFallback />}
      onError={(error) => {
        console.error('AI Agent Error:', error)
        // Send to monitoring service
      }}
    >
      {children}
    </ErrorBoundaryComponent>
  )
}
```

## Performance Optimization for AI Agents

### Server Components Optimization
- Use Server Components for static content
- Implement proper caching strategies
- Optimize database queries with proper indexing
- Use streaming for AI responses

### Client-Side Optimization
- Implement proper loading states
- Use React Suspense for async components
- Optimize bundle size with dynamic imports
- Implement proper error boundaries

## Monitoring and Observability

### Sentry Integration
AI agents should implement proper error tracking:
```typescript
import * as Sentry from '@sentry/nextjs'

// Track AI operation errors
Sentry.addBreadcrumb({
  category: 'ai-operation',
  message: 'AI tool execution started',
  level: 'info'
})
```

### Performance Monitoring
- Track AI response times
- Monitor database query performance
- Track user interaction metrics
- Monitor error rates and patterns

## Pull Request Guidelines for AI Agents

When AI agents help create PRs, ensure they:

1. **Reference the implementation plan** that was approved for the feature
2. Include clear descriptions of AI functionality changes
3. Reference related issues or feature requests
4. Include proper test coverage for AI features as specified in the plan
5. Ensure all automated checks pass
6. Include documentation updates for new AI capabilities
7. Test AI tools with various input scenarios
8. Verify WebSocket functionality for real-time features
9. **Archive the implementation plan** in `/docs/implementation-plans/`
10. **Review and clean up AICODE comments** - convert ASK to NOTE, complete TODOs

## Documentation Standards for AI Agents

- **Follow the implementation plan** for documentation requirements
- **ALWAYS CHECK CURRENT DATE**: Run `date` command before writing any documentation with dates
- Update relevant documentation in `/docs` directory
- Include code examples in documentation
- Document any new AI tools or capabilities with AICODE-NOTE comments
- Keep API documentation current
- Include migration guides for breaking changes
- **Archive implementation plans** in `/docs/implementation-plans/` after completion
- **Use AICODE comments** to document complex architectural decisions for future agents

### Date Handling Requirements for AI Agents

**CRITICAL**: AI agents must verify current date before writing documentation:

```bash
# ALWAYS run this command first when working with dates
date

# Example output: Wed Jan 15 14:30:25 PST 2025
```

**When writing documentation with dates:**
- Use actual current date, not assumed dates
- Format dates consistently: `January 15, 2025` or `2025-01-15`
- For changelogs: Use format `**Date:** January 15, 2025`
- For implementation plans: Use current date in filename and content
- For version tags: Use current date for release documentation

**Common date-related files to check:**
- `/docs/maintenance/changelog/*.md` - Always use current date
- `/docs/development/implementation-plans/*.md` - Use current date for new plans
- Any documentation with "Date:" fields
- README files with "Last updated:" information
- Version documentation and release notes

**IMPORTANT**: When updating existing documentation, always verify and correct any outdated dates to reflect the actual current date when the work was completed.

## SuperDuperAI API Important Details

### OpenAPI Client Architecture
AI agents must use the auto-generated OpenAPI client based on the [SuperDuperAI OpenAPI specification](https://dev-editor.superduperai.co/openapi.json):

#### Generated Client Structure
- **Models**: Auto-generated TypeScript interfaces (`IGenerationConfigRead`, `GenerationTypeEnum`, etc.)
- **Services**: Type-safe API service classes (`GenerationConfigService`, `GenerationService`, etc.)
- **Core**: HTTP client infrastructure with authentication and error handling
- **Type Aliases**: Compatibility types (`VideoModel = IGenerationConfigRead`, `ImageModel = IGenerationConfigRead`)

#### Client Configuration
```typescript
import { OpenAPI } from '@/lib/api'
import { getSuperduperAIConfig } from '@/lib/config/superduperai'

// Configure OpenAPI client
const config = getSuperduperAIConfig()
OpenAPI.BASE = config.baseUrl
OpenAPI.TOKEN = config.token
```

### API Schema and Models
Based on the auto-generated OpenAPI client, AI agents must understand:

#### Generation Config Types
AI agents work with `IGenerationConfigRead` objects from the OpenAPI client:
```typescript
interface IGenerationConfigRead {
  id: string
  name: string
  label?: string
  type: GenerationTypeEnum // 'text_to_image', 'image_to_image', 'text_to_video', 'image_to_video', etc.
  source: string
  params: Record<string, any>
  price?: number
  workflowPath?: string
}
```

#### Image Generation Models
- **Model Discovery**: Use `GenerationConfigService.generationConfigGetList({ type: 'text_to_image' })`
- **Available Models**: FLUX Pro/Dev, Azure GPT Image, Google Imagen3/4, FAL AI models
- **Quality Types**: `full_hd`, `hd`, `sd`
- **Shot Sizes**: `Extreme Long Shot`, `Long Shot`, `Medium Shot`, `Medium Close-Up`, `Close-Up`, `Extreme Close-Up`, `Two-Shot`, `Detail Shot`

#### Video Generation Models  
- **Model Discovery**: Use `GenerationConfigService.generationConfigGetList({ type: 'text_to_video' })`
- **Available Models**: Google VEO2/VEO3, FAL AI KLING, ComfyUI LTX, Azure Sora
- **Aspect Ratios**: `16:9`, `9:16`, `4:3`, `1:1`
- **Quality Support**: Full HD, HD, SD resolutions
- **Duration**: Configurable video length in seconds
- **FPS**: Frame rate control (24, 30, 60, 120)

#### Task Status Tracking
AI agents must handle these status values:
- `in_progress`: Generation is ongoing
- `completed`: Generation finished successfully
- `error`: Generation failed

#### SSE Message Types
AI agents must handle these SSE message types across all channel types:
- `task`: Task status updates (available on file and project channels)
- `render_progress`: Real-time progress updates (available on file and project channels)
- `render_result`: Final generation results (available on file and project channels)
- `data`, `file`, `entity`, `scene`: Other data updates (channel-specific)

#### SSE Channel Selection Guidelines
- **Use file-based SSE** (`file.{fileId}`) for new generators - this is the default approach
- **Avoid project-based SSE** (`project.{projectId}`) - legacy pattern, projects are optional parameters
- **Use user-based SSE** (`user.{userId}`) for global notifications and cross-session updates
- **File generation flow**: File ID is primary, project ID is optional legacy parameter

### API Rate Limits and Best Practices
- **Authentication**: Bearer token required, configured via OpenAPI client
- **Model Caching**: Cache model lists for 1 hour to reduce API calls
- **Polling Frequency**: Poll status every 2 seconds maximum
- **Retry Logic**: Implement exponential backoff for failed requests
- **File Handling**: Use proper download endpoints for generated media
- **WebSocket**: Preferred for real-time updates over polling
- **Type Safety**: Leverage OpenAPI-generated types for better error handling

### Error Handling Requirements
AI agents must handle these specific error cases:
- **401 Unauthorized**: Invalid or expired API token
- **422 Validation Error**: Invalid request parameters
- **429 Rate Limited**: Too many requests, implement backoff
- **500 Internal Error**: SuperDuperAI service issues

### Integration Checklist for AI Agents
- [ ] Configure OpenAPI client with authentication
- [ ] Use `GenerationConfigService` for model discovery
- [ ] Cache model lists to reduce API overhead
- [ ] Use type-safe `GenerationService` for generation requests
- [ ] Validate all parameters using OpenAPI-generated types
- [ ] Implement proper error handling and retry logic
- [ ] Use WebSocket for real-time progress updates
- [ ] Download and store generated media in Vercel Blob
- [ ] Track generation status in local database
- [ ] Provide user feedback during generation process
- [ ] Handle generation failures gracefully

## AI Agent Collaboration Notes

### Multi-Agent Coordination
- Use consistent naming conventions across agents
- Share context through proper documentation
- Implement proper version control for AI-generated content
- Coordinate database schema changes
- Share SuperDuperAI API rate limits and usage tracking

### Knowledge Sharing
- Document AI tool capabilities and limitations
- Share best practices for AI integration
- Maintain up-to-date architecture documentation
- Coordinate on API design decisions
- Share SuperDuperAI API response patterns and error handling

### SuperDuperAI Integration Guidelines
- Use auto-generated OpenAPI client for type safety and consistency
- Regenerate client when API schema changes (`pnpm generate-api`)
- Implement proper authentication token management via OpenAPI configuration
- Monitor API usage and respect rate limits
- Cache model discovery results for 1 hour to reduce API calls
- Cache generation results to avoid redundant API calls
- Implement proper error logging for debugging
- Leverage TypeScript types from OpenAPI client for better development experience

## OpenAPI Migration Summary (Updated: January 15, 2025)

The Super Chatbot project has migrated from manual API integration to auto-generated OpenAPI client with **Typed Proxy Architecture** for SuperDuperAI API:

### Key Changes for AI Agents
- **Typed Proxy Architecture**: Frontend never makes direct OpenAPI calls, all communication through internal Next.js API routes
- **Security**: External API tokens kept server-side only, never exposed to frontend
- **Type Safety**: OpenAPI models used throughout entire stack (frontend → proxy → OpenAPI client)
- **Consistency**: Unified error handling and response format across all API operations
- **Performance**: Server-side caching and optimization with client-side typed interfaces

### Architecture Components
- **Frontend Typed Clients**: `FileClient`, `GenerationClient`, `ModelsClient` in `/lib/api/client/`
- **Internal API Routes**: `/api/generate/image`, `/api/generate/video`, `/api/file/[id]`, `/api/config/models`
- **React Hooks**: `useModels()` for dynamic model loading with caching
- **Model Adapters**: Convert OpenAPI types to UI-compatible formats

### Migration Benefits
- **Security**: API tokens never exposed to browser, all authentication server-side
- **Type Safety**: End-to-end type safety from UI to external API
- **Maintainability**: Single source of truth for API integration patterns
- **Performance**: Optimized caching at multiple levels (server-side API, client-side hooks)
- **Developer Experience**: IntelliSense support throughout the stack
- **Scalability**: Easy to add new endpoints following established proxy patterns

### Files Updated
- `lib/api/client/`: New typed frontend clients (3 files)
- `app/api/`: Updated proxy endpoints (4 files)
- `hooks/use-models.ts`: New React hook for model discovery
- `lib/utils/model-adapters.ts`: Utilities for type conversion
- `package.json`: Added OpenAPI generation script and dependencies

### Implementation Pattern for AI Agents
```typescript
// ✅ CORRECT: Use typed proxy architecture
const generationClient = new GenerationClient()
const result = await generationClient.generateImage(params)

// ❌ INCORRECT: Direct OpenAPI calls from frontend
const result = await GenerationService.generationCreateGeneration(...)
```

This Typed Proxy Architecture ensures AI agents work securely and efficiently with the Super Chatbot codebase while maintaining code quality, security, and performance standards when integrating with SuperDuperAI API. 

**For comprehensive development methodology including implementation planning and persistent memory management, see [AI Development Methodology](./docs/ai-development-methodology.md).** 
**For comprehensive development methodology including implementation planning and persistent memory management, see [AI Development Methodology](./docs/ai-development-methodology.md).** 