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
AI agents must use **SuperDuperAI API** as the primary backend for media generation:
- **Base URL**: `https://dev-editor.superduperai.co`
- **Authentication**: Bearer token authentication required
- **WebSocket**: Real-time updates for generation progress
- **File Management**: Integrated file upload and download system

### Artifact Types
AI agents should handle these artifact types:
- `text`: Markdown documents with collaborative editing
- `code`: Syntax-highlighted code with execution capabilities
- `image`: Generated images with FLUX models
- `video`: Generated videos with SuperDuperAi Veo3 model
- `sheet`: Interactive spreadsheets with data manipulation

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

### Authentication Pattern
AI agents must authenticate with SuperDuperAI API:
```typescript
// SuperDuperAI API authentication
const SUPERDUPERAI_BASE_URL = 'https://dev-editor.superduperai.co'
const SUPERDUPERAI_TOKEN = process.env.SUPERDUPERAI_API_TOKEN

const headers = {
  'Authorization': `Bearer ${SUPERDUPERAI_TOKEN}`,
  'Content-Type': 'application/json'
}
```

### Image Generation Pattern
AI agents should use this pattern for image generation:
```typescript
// SuperDuperAI Image Generation
async function generateImage(params: ImageGenerationParams) {
  // 1. Create generation request
  const response = await fetch(`${SUPERDUPERAI_BASE_URL}/api/v1/generation/image`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: params.prompt,
      negative_prompt: params.negativePrompt,
      model: params.model || 'flux', // flux or sdxl
      width: params.width,
      height: params.height,
      quality: params.quality || 'hd', // hd, full_hd, sd
      style: params.style,
      shot_size: params.shotSize,
      seed: params.seed
    })
  })

  const generation = await response.json()
  
  // 2. Poll for completion or use WebSocket
  return await pollGenerationStatus('image', generation.id)
}

async function pollGenerationStatus(type: 'image' | 'video', id: string) {
  while (true) {
    const response = await fetch(
      `${SUPERDUPERAI_BASE_URL}/api/v1/generation/${type}/${id}`,
      { headers }
    )
    const result = await response.json()
    
    if (result.status === 'completed') {
      return result
    } else if (result.status === 'error') {
      throw new Error(result.error || 'Generation failed')
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
}
```

### Video Generation Pattern
AI agents should use this pattern for video generation:
```typescript
// SuperDuperAI Video Generation
async function generateVideo(params: VideoGenerationParams) {
  // 1. Create generation request
  const response = await fetch(`${SUPERDUPERAI_BASE_URL}/api/v1/generation/video`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: params.prompt,
      negative_prompt: params.negativePrompt,
      model: params.model || 'veo3',
      width: params.width,
      height: params.height,
      duration: params.duration || 10,
      fps: params.frameRate || 30,
      aspect_ratio: params.aspectRatio || '16:9',
      style: params.style,
      shot_size: params.shotSize,
      seed: params.seed,
      // Video-specific parameters
      references: params.references || []
    })
  })

  const generation = await response.json()
  
  // 2. Poll for completion or use WebSocket
  return await pollGenerationStatus('video', generation.id)
}
```

### WebSocket Real-time Updates Pattern
AI agents should implement WebSocket for real-time generation progress:
```typescript
// SuperDuperAI WebSocket integration
function connectToGenerationUpdates(generationId: string) {
  const ws = new WebSocket(`wss://dev-editor.superduperai.co/ws`)
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data)
    
    if (message.type === 'render_progress') {
      // Update progress in UI
      updateGenerationProgress(generationId, message.object.progress)
    } else if (message.type === 'render_result') {
      // Generation completed
      handleGenerationComplete(generationId, message.object)
    }
  }
  
  return ws
}
```

### File Download Pattern
AI agents should handle file downloads from SuperDuperAI:
```typescript
// Download generated media
async function downloadGeneratedMedia(type: 'image' | 'video', id: string) {
  const response = await fetch(
    `${SUPERDUPERAI_BASE_URL}/api/v1/generation/${type}/${id}/download`,
    {
      method: 'POST',
      headers
    }
  )
  
  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`)
  }
  
  return response.blob()
}

// Store in Vercel Blob
async function storeGeneratedMedia(blob: Blob, filename: string) {
  const file = new File([blob], filename)
  const result = await put(filename, file, {
    access: 'public',
    addRandomSuffix: true,
  })
  
  return result.url
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

### API Schema and Models
Based on the [SuperDuperAI OpenAPI specification](https://dev-editor.superduperai.co/openapi.json), AI agents must understand:

#### Image Generation Models
- **FLUX**: Primary model for high-quality image generation
- **SDXL**: Alternative model for specific use cases
- **Quality Types**: `full_hd`, `hd`, `sd`
- **Shot Sizes**: `Extreme Long Shot`, `Long Shot`, `Medium Shot`, `Medium Close-Up`, `Close-Up`, `Extreme Close-Up`, `Two-Shot`, `Detail Shot`

#### Video Generation Models  
- **Veo3**: Primary model for video generation (SuperDuperAI's flagship model)
- **Aspect Ratios**: `16:9`, `9:16`, `4:3`, `1:1`
- **Quality Support**: Full HD, HD, SD resolutions
- **Duration**: Configurable video length in seconds
- **FPS**: Frame rate control (24, 30, 60, 120)

#### Task Status Tracking
AI agents must handle these status values:
- `in_progress`: Generation is ongoing
- `completed`: Generation finished successfully
- `error`: Generation failed

#### WebSocket Message Types
- `task`: Task status updates
- `render_progress`: Real-time progress updates
- `render_result`: Final generation results
- `data`, `file`, `entity`, `scene`: Other data updates

### API Rate Limits and Best Practices
- **Authentication**: Bearer token required for all generation endpoints
- **Polling Frequency**: Poll status every 2 seconds maximum
- **Retry Logic**: Implement exponential backoff for failed requests
- **File Handling**: Use proper download endpoints for generated media
- **WebSocket**: Preferred for real-time updates over polling

### Error Handling Requirements
AI agents must handle these specific error cases:
- **401 Unauthorized**: Invalid or expired API token
- **422 Validation Error**: Invalid request parameters
- **429 Rate Limited**: Too many requests, implement backoff
- **500 Internal Error**: SuperDuperAI service issues

### Integration Checklist for AI Agents
- [ ] Authenticate with SuperDuperAI API using Bearer token
- [ ] Validate all parameters before sending requests
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
- Always use the latest API version and endpoints
- Implement proper authentication token management
- Monitor API usage and respect rate limits
- Cache generation results to avoid redundant API calls
- Implement proper error logging for debugging

This Agents.md guide helps ensure AI agents work effectively with the Super Chatbot codebase while maintaining code quality, security, and performance standards when integrating with SuperDuperAI API. 

**For comprehensive development methodology including implementation planning and persistent memory management, see [AI Development Methodology](./docs/ai-development-methodology.md).** 