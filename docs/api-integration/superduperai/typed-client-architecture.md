**Date:** June 24, 2025

# Typed Client Architecture for SuperDuperAI Integration

## Overview

The Super Chatbot project implements a **Typed Proxy Architecture** for SuperDuperAI API integration, ensuring security, type safety, and maintainability. This architecture prevents direct external API calls from the frontend and provides end-to-end type safety using OpenAPI-generated models.

## Architecture Diagram

```
Frontend Components
    ↓ (typed interfaces)
Typed Frontend Clients (FileClient, GenerationClient, ModelsClient)
    ↓ (HTTP requests to internal endpoints)
Internal Next.js API Routes (/api/generate/*, /api/file/*, /api/config/*)
    ↓ (OpenAPI client calls)
Auto-generated OpenAPI Client (lib/api/)
    ↓ (HTTPS with Bearer token)
SuperDuperAI External API (https://dev-editor.superduperai.co)
```

## Architecture Components

### 1. **Server-side OpenAPI Integration**

```typescript
// lib/config/superduperai.ts
export function configureSuperduperAI(): SuperduperAIConfig {
  const config = getSuperduperAIConfig();
  
  // Configure the generated OpenAPI client
  OpenAPI.BASE = config.url;
  OpenAPI.TOKEN = config.token;
  
  return config;
}
```

**Key Features:**
- Server-side OpenAPI client configuration
- Secure token handling (never exposed to client)
- Dynamic model discovery with caching
- Type-safe API calls using generated models

### 2. **Proxy API Endpoints**

#### File API (`/api/file/[id]`)
```typescript
// Uses: IFileRead from OpenAPI models
const fileData: IFileRead = await FileService.fileGetById({ id: fileId });
```

#### Generation APIs
- `/api/generate/image` - Uses `GenerateImagePayload`, `IImageGenerationCreate`
- `/api/generate/video` - Uses `GenerateVideoPayload`, `IVideoGenerationCreate`

#### Models API (`/api/config/models`)
```typescript
// Returns: ModelsResponse with IGenerationConfigRead[]
{
  success: true,
  data: {
    imageModels: IGenerationConfigRead[],
    videoModels: IGenerationConfigRead[],
    allModels: IGenerationConfigRead[]
  }
}
```

### 3. **Typed Frontend Clients**

#### FileClient
```typescript
// lib/api/client/file-client.ts
export class FileClient {
  async getById(fileId: string): Promise<IFileRead>
}

export const fileClient = new FileClient();
```

#### GenerationClient
```typescript
// lib/api/client/generation-client.ts
export interface ImageGenerationInput {
  prompt: string;
  model: { name: string };
  resolution: { width: number; height: number };
  // ... other fields
}

export class GenerationClient {
  async generateImage(payload: ImageGenerationInput): Promise<GenerationResponse>
  async generateVideo(payload: VideoGenerationInput): Promise<GenerationResponse>
}
```

#### ModelsClient
```typescript
// lib/api/client/models-client.ts
export class ModelsClient {
  async getModels(): Promise<ModelsResponse>
  async getImageModels(): Promise<IGenerationConfigRead[]>
  async getVideoModels(): Promise<IGenerationConfigRead[]>
}
```

### 4. **React Hooks**

#### useModels Hook
```typescript
// hooks/use-models.ts
export function useModels(): UseModelsReturn {
  return {
    imageModels: IGenerationConfigRead[],
    videoModels: IGenerationConfigRead[],
    isLoading: boolean,
    error: string | null,
    refreshModels: () => Promise<void>
  };
}
```

**Usage Example:**
```typescript
function MyComponent() {
  const { imageModels, isLoading, error } = useModels();
  
  if (isLoading) return <div>Loading models...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <select>
      {imageModels.map(model => (
        <option key={model.name} value={model.name}>
          {model.label || model.name}
        </option>
      ))}
    </select>
  );
}
```

### 5. **Model Adapters**

```typescript
// lib/utils/model-adapters.ts
export interface AdaptedModel extends IGenerationConfigRead {
  id: string;
  label: string;
  description: string;
  value: string;
  workflowPath: string;
  price: number;
}

export function adaptOpenAPIModel(model: IGenerationConfigRead): AdaptedModel
export function adaptOpenAPIModels(models: IGenerationConfigRead[]): AdaptedModel[]
```

## Benefits

### 1. **Type Safety**
- All API responses use OpenAPI generated types
- Frontend gets same types as backend
- Compile-time error detection
- IntelliSense support

### 2. **Security**
- API tokens never exposed to frontend
- All external API calls go through server proxy
- No CORS issues
- Request validation on server

### 3. **Performance**
- Client-side caching (1 hour TTL)
- Server-side caching for models
- Efficient data fetching
- Automatic cache invalidation

### 4. **Consistency**
- Single source of truth for types
- Consistent data structures
- Unified error handling
- Standardized response formats

### 5. **Maintainability**
- Auto-generated types from OpenAPI spec
- Clear separation of concerns
- Easy to test and debug
- Scalable architecture

## Usage Patterns

### 1. **Image Generation**
```typescript
import { generationClient } from '@/lib/api/client/generation-client';

const payload: ImageGenerationInput = {
  prompt: "A beautiful sunset",
  model: { name: "comfyui/flux" },
  resolution: { width: 1024, height: 1024 },
  style: { id: "watercolor" },
  shotSize: { id: "Medium Shot" }
};

const result = await generationClient.generateImage(payload);
```

### 2. **File Status Checking**
```typescript
import { fileClient } from '@/lib/api/client/file-client';

const fileData: IFileRead = await fileClient.getById(fileId);

if (fileData.url) {
  // File is ready
  console.log('File URL:', fileData.url);
} else if (fileData.tasks?.some(task => task.status === 'error')) {
  // Generation failed
  console.error('Generation failed');
}
```

### 3. **Dynamic Model Loading**
```typescript
import { useModels } from '@/hooks/use-models';

function ModelSelector() {
  const { imageModels, isLoading } = useModels();
  
  return (
    <select disabled={isLoading}>
      {imageModels.map(model => (
        <option key={model.name} value={model.name}>
          {model.name} - ${model.params?.price || 0}
        </option>
      ))}
    </select>
  );
}
```

## Testing

### Test Files
- `tests/typed-client-test.js` - Tests generation and file APIs
- `tests/models-client-test.js` - Tests models API

### Running Tests
```bash
# Test generation APIs
node tests/typed-client-test.js

# Test models API  
node tests/models-client-test.js
```

## Migration Guide

### From Direct OpenAPI Calls
```typescript
// Before ❌
import { FileService } from '@/lib/api/services/FileService';
configureClientOpenAPI();
const fileData = await FileService.fileGetById({ id: fileId });

// After ✅
import { fileClient } from '@/lib/api/client/file-client';
const fileData = await fileClient.getById(fileId);
```

### From Manual Fetch Calls
```typescript
// Before ❌
const response = await fetch('/api/generate/image', {
  method: 'POST',
  body: JSON.stringify(payload)
});

// After ✅
import { generationClient } from '@/lib/api/client/generation-client';
const result = await generationClient.generateImage(payload);
```

## Error Handling

All clients provide consistent error handling:

```typescript
try {
  const result = await generationClient.generateImage(payload);
} catch (error) {
  console.error('Generation failed:', error.message);
  // error.message contains user-friendly error description
}
```

## Environment Configuration

### Server-side (.env)
```env
SUPERDUPERAI_URL=https://dev-editor.superduperai.co
SUPERDUPERAI_TOKEN=your_api_token_here
```

### Middleware Configuration
```typescript
// middleware.ts - Allow proxy endpoints
if (pathname.startsWith('/api/generate/')) return NextResponse.next();
if (pathname.startsWith('/api/file/')) return NextResponse.next();
if (pathname.startsWith('/api/config/')) return NextResponse.next();
```

## Future Enhancements

1. **Real-time Updates** - WebSocket integration for live status updates
2. **Advanced Caching** - Redis-based caching for production
3. **Rate Limiting** - API rate limiting and quota management
4. **Monitoring** - Request/response logging and metrics
5. **Validation** - Runtime validation using OpenAPI schemas 