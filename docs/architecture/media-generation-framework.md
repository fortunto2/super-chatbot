# Media Generation Framework Architecture

## 🏗️ Overview

The Media Generation Framework is a scalable, Object-Oriented architecture designed to support multiple media generation types (image, video, audio, text, 3D) with a unified API and consistent behavior.

## 📋 Key Design Principles

### 1. **Single Responsibility Principle (SRP)**

- Each class has one specific responsibility
- BaseMediaGenerator handles common generation workflow
- Specific generators handle media-type specifics
- Components are focused on single UI concerns

### 2. **Open/Closed Principle (OCP)**

- Framework is open for extension (new media types)
- Closed for modification (core logic remains stable)
- New generators extend BaseMediaGenerator without changing existing code

### 3. **Template Method Pattern**

- BaseMediaGenerator defines the workflow template
- Subclasses implement specific steps
- Consistent generation process across all media types

### 4. **Factory Pattern**

- MediaGeneratorFactory manages generator creation
- Supports registration of new generator types
- Provides singleton instances with cleanup

### 5. **Configuration-Driven Design**

- Media settings loaded dynamically from API
- Type-safe configuration interfaces
- Extensible for new media properties

## 🏛️ Architecture Components

### Core Layer (`lib/media-generation/core/`)

#### BaseMediaGenerator (Abstract Class)

```typescript
abstract class BaseMediaGenerator<TSettings, TResult> {
  // Template Method - defines workflow
  async generate(request: GenerationRequest): Promise<TResult>;

  // Abstract methods (implemented by subclasses)
  protected abstract fetchConfiguration(): Promise<MediaGenerationConfig>;
  protected abstract prepareRequest(request): Promise<any>;
  protected abstract callGenerationAPI(prepared): Promise<any>;
  protected abstract postProcessResult(result): Promise<TResult>;

  // Common functionality
  protected waitForCompletion(apiResult): Promise<any>;
  protected trySSEConnection(fileId): Promise<any>;
  protected fallbackToPolling(fileId): Promise<any>;
}
```

**Responsibilities:**

- Workflow orchestration (generate → API call → SSE/polling → result)
- Event handling (onStart, onProgress, onSuccess, onError, onComplete)
- Smart polling integration with 7-minute timeout
- Configuration management and caching
- Common validation logic

### Generator Layer (`lib/media-generation/generators/`)

#### ImageGenerator

```typescript
class ImageGenerator extends BaseMediaGenerator<
  ImageSettings,
  ImageGenerationResult
> {
  // Image-specific configuration loading
  protected async fetchConfiguration(): Promise<
    MediaGenerationConfig<ImageSettings>
  >;

  // Image API request preparation
  protected async prepareRequest(request): Promise<any>;

  // Image generation API call
  protected async callGenerationAPI(prepared): Promise<any>;

  // Image result post-processing
  protected async postProcessResult(result): Promise<ImageGenerationResult>;

  // Convenience methods
  async generateSingle(prompt, options): Promise<ImageGenerationResult>;
  async generateBatch(
    prompt,
    batchSize,
    options
  ): Promise<ImageGenerationResult>;
}
```

#### VideoGenerator

```typescript
class VideoGenerator extends BaseMediaGenerator<
  VideoSettings,
  VideoGenerationResult
> {
  // Video-specific implementations
  // Similar structure to ImageGenerator but for video

  // Convenience methods
  async generateTextToVideo(prompt, options): Promise<VideoGenerationResult>;
  async generateImageToVideo(
    prompt,
    sourceImageId,
    options
  ): Promise<VideoGenerationResult>;
  async generateShortClip(prompt, options): Promise<VideoGenerationResult>;
  async generateLongClip(prompt, options): Promise<VideoGenerationResult>;
}
```

### Factory Layer (`lib/media-generation/factory/`)

#### MediaGeneratorFactory (Singleton)

```typescript
class MediaGeneratorFactory {
  private generators = new Map<MediaType, GeneratorRegistration>();
  private instances = new Map<MediaType, BaseMediaGenerator>();

  // Registration management
  register(registration: GeneratorRegistration): void;
  unregister(type: MediaType): void;

  // Instance creation
  create<T>(type: MediaType): T;
  createNew<T>(type: MediaType): T;

  // Availability checks
  isAvailable(type: MediaType): boolean;
  getEnabledTypes(): MediaType[];

  // Configuration
  setEnabled(type: MediaType, enabled: boolean): void;

  // Cleanup
  destroyAll(): void;
  destroy(type: MediaType): void;
}
```

**Registration System:**

```typescript
interface GeneratorRegistration {
  type: MediaType;
  generator: new () => BaseMediaGenerator;
  displayName: string;
  description: string;
  icon?: string;
  category?: string;
  isEnabled?: boolean;
}
```

### Hook Layer (`lib/media-generation/hooks/`)

#### useMediaGenerator (Universal Hook)

```typescript
function useMediaGenerator<TSettings, TResult>(
  options: UseMediaGeneratorOptions<TSettings>
): UseMediaGeneratorReturn<TSettings, TResult> {
  // State management
  const [state, setState] = useState<UseMediaGeneratorState<TResult>>();

  // Generator initialization
  const initializeGenerator = useCallback();

  // Actions
  const generate = useCallback();
  const generateWithPrompt = useCallback();
  const reset = useCallback();
  const clearResults = useCallback();

  // Returns unified interface
  return { ...state, ...actions, generator, config };
}
```

**Convenience Hooks:**

```typescript
// Pre-configured hooks for specific media types
export function useImageGenerator() {
  return useMediaGenerator({
    mediaType: "image",
    autoInit: true,
    persistResults: true,
    storageKey: "generated-images",
  });
}

export function useVideoGenerator() {
  return useMediaGenerator({
    mediaType: "video",
    autoInit: true,
    persistResults: true,
    storageKey: "generated-videos",
  });
}
```

### Component Layer (`lib/media-generation/components/`)

#### MediaGeneratorForm (Universal Component)

```typescript
function MediaGeneratorForm<TSettings extends MediaSettings>({
  mediaType,
  config,
  onGenerate,
  isGenerating,
  disabled,
  initialPrompt,
  initialSettings,
}: MediaGeneratorFormProps<TSettings>) {
  // Configuration-driven form rendering
  // Type-safe settings management
  // Universal form validation
  // Media-specific field extensions
}
```

**Type-Safe Wrappers:**

```typescript
export function ImageGeneratorForm(
  props: Omit<MediaGeneratorFormProps, "mediaType">
) {
  return (
    <MediaGeneratorForm
      {...props}
      mediaType="image"
    />
  );
}

export function VideoGeneratorForm(
  props: Omit<MediaGeneratorFormProps, "mediaType">
) {
  return (
    <MediaGeneratorForm
      {...props}
      mediaType="video"
    />
  );
}
```

## 🔄 Generation Workflow

### 1. Initialization Phase

```typescript
// Factory creates generator instance
const imageGen = createImageGenerator();

// Configuration loaded from API
const config = await imageGen.loadConfig();

// Event handlers attached
imageGen.on("onProgress", handleProgress);
imageGen.on("onSuccess", handleSuccess);
```

### 2. Generation Phase

```typescript
// Request prepared
const request = {
  prompt: "A beautiful sunset",
  settings: {
    model: config.defaultSettings.model,
    resolution: { width: 1024, height: 1024 },
    style: { id: "realistic" },
    // ...other settings
  },
};

// Template method workflow
const result = await imageGen.generate(request);
```

### 3. Internal Workflow

```mermaid
graph TD
    A[generate() called] --> B[validateRequest()]
    B --> C[prepareRequest()]
    C --> D[callGenerationAPI()]
    D --> E[waitForCompletion()]
    E --> F{SSE Available?}
    F -->|Yes| G[trySSEConnection()]
    F -->|No| H[fallbackToPolling()]
    G --> I{Success?}
    H --> I
    I -->|Yes| J[postProcessResult()]
    I -->|No| K[Error Handling]
    J --> L[Return Result]
    K --> M[Throw Error]
```

### 4. Smart Polling Integration

- **7-minute maximum timeout** enforced
- **Exponential backoff** on errors
- **Rate limiting protection** (HTTP 429 handling)
- **Centralized management** prevents duplicates
- **Real-time progress** updates

## 🚀 Usage Examples

### Basic Usage

```typescript
import { createImageGenerator } from "@/lib/media-generation";

// Create generator
const imageGen = createImageGenerator();

// Generate single image
const result = await imageGen.generateSingle("A beautiful landscape", {
  style: { id: "realistic" },
  resolution: { width: 1024, height: 1024 },
});

console.log("Generated image:", result.imageUrl);
```

### React Hook Usage

```typescript
import { useImageGenerator } from "@/lib/media-generation";

function ImageGeneratorComponent() {
  const {
    generateWithPrompt,
    isGenerating,
    currentResult,
    progress,
    generatedItems,
    config,
  } = useImageGenerator();

  const handleGenerate = async () => {
    try {
      await generateWithPrompt("A beautiful sunset");
    } catch (error) {
      console.error("Generation failed:", error);
    }
  };

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
      >
        Generate Image
      </button>
      {progress && <div>{progress.message}</div>}
      {currentResult && <img src={currentResult.imageUrl} />}
    </div>
  );
}
```

### Component Usage

```typescript
import { ImageGeneratorForm, useImageGenerator } from "@/lib/media-generation";

function ImageGeneratorPage() {
  const { generateWithPrompt, isGenerating, config, currentResult } =
    useImageGenerator();

  return (
    <div>
      <ImageGeneratorForm
        config={config}
        onGenerate={generateWithPrompt}
        isGenerating={isGenerating}
      />
      {currentResult && <img src={currentResult.imageUrl} />}
    </div>
  );
}
```

## 🔧 Adding New Media Types

### 1. Create Generator Class

```typescript
// lib/media-generation/generators/audio-generator.ts
export interface AudioSettings extends MediaSettings {
  duration: number;
  quality: "low" | "medium" | "high";
  genre?: string;
}

export class AudioGenerator extends BaseMediaGenerator<
  AudioSettings,
  AudioGenerationResult
> {
  constructor() {
    super("audio", "/api/generate/audio", 7 * 60 * 1000);
  }

  protected async fetchConfiguration(): Promise<
    MediaGenerationConfig<AudioSettings>
  > {
    // Load audio-specific configuration
  }

  protected async prepareRequest(
    request: GenerationRequest<AudioSettings>
  ): Promise<any> {
    // Prepare audio API request
  }

  protected async callGenerationAPI(preparedRequest: any): Promise<any> {
    // Call audio generation API
  }

  protected async postProcessResult(
    apiResult: any
  ): Promise<AudioGenerationResult> {
    // Process audio result
  }
}
```

### 2. Register with Factory

```typescript
// lib/media-generation/factory/generator-factory.ts
this.register({
  type: "audio",
  generator: AudioGenerator,
  displayName: "Audio Generator",
  description: "Generate music and sound effects",
  icon: "🎵",
  category: "Audio",
  isEnabled: true,
});
```

### 3. Create Convenience Exports

```typescript
// lib/media-generation/index.ts
export function createAudioGenerator() {
  return generatorFactory.create<AudioGenerator>("audio");
}

export function useAudioGenerator() {
  return useMediaGenerator({
    mediaType: "audio",
    autoInit: true,
    persistResults: true,
    storageKey: "generated-audio",
  });
}
```

## 📊 Benefits of This Architecture

### 1. **Scalability**

- Easy to add new media types
- Consistent behavior across all generators
- Centralized configuration management

### 2. **Maintainability**

- Clear separation of concerns
- Type-safe interfaces
- Comprehensive error handling

### 3. **Reusability**

- Common components work with any media type
- Shared hooks reduce code duplication
- Universal form handling

### 4. **Performance**

- Smart polling prevents resource waste
- Singleton pattern for efficient memory usage
- Event-driven architecture for real-time updates

### 5. **Developer Experience**

- Intuitive API design
- Comprehensive TypeScript support
- Rich documentation and examples

### 6. **Testing**

- Mockable dependencies
- Isolated unit testing
- Integration test support

## 🔒 Error Handling Strategy

### 1. **Validation Errors**

- Input validation at form level
- Settings validation in generators
- Clear user-facing error messages

### 2. **API Errors**

- Network error handling
- Rate limiting protection
- Retry logic with exponential backoff

### 3. **Generation Errors**

- Timeout protection (7 minutes max)
- Graceful SSE failure fallback
- Progress tracking for transparency

### 4. **State Management Errors**

- Safe state updates
- Error boundary integration
- Cleanup on unmount

## 🚦 Migration Path

### Phase 1: Framework Implementation ✅

- [x] Create base architecture
- [x] Implement Image and Video generators
- [x] Build factory pattern
- [x] Create universal hooks and components

### Phase 2: Integration (Next)

- [ ] Migrate existing image generator tool
- [ ] Migrate existing video generator tool
- [ ] Update chat integration
- [ ] Add comprehensive tests

### Phase 3: Extension (Future)

- [ ] Add Audio generator
- [ ] Add Text generator
- [ ] Add 3D model generator
- [ ] Advanced configuration options

This architecture provides a solid foundation for current needs while ensuring easy expansion for future media generation capabilities.
