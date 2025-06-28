# Dual-Mode Video Generator Implementation

**Date:** January 15, 2025

## Overview
Successfully implemented tabbed interface for video generation with two distinct modes:
- **Text-to-Video**: Generate videos from text prompts only
- **Image-to-Video**: Animate existing images with optional text guidance

## Architecture Integration

### API Integration
- **Follows OpenAPI client architecture** from AGENTS.md
- **Uses existing label fields** from SuperDuperAI API (`model.label` or `model.name` via `getModelLabel()`)
- **Direct price display** from `model.params.price` without additional processing
- **Typed Proxy Architecture**: Frontend → Internal API Routes → OpenAPI Client → SuperDuperAI Backend
- **Security**: All API tokens kept server-side only

### Model Management
- **Dynamic filtering** using `GenerationTypeEnum.TEXT_TO_VIDEO` and `GenerationTypeEnum.IMAGE_TO_VIDEO`
- **Automatic model discovery** from SuperDuperAI API with proper type-based categorization
- **Human-readable names** using existing `getModelLabel()` function from `lib/config/superduperai.ts`

## Key Features

### Two Generation Modes

1. **Text-to-Video Mode**
   - Text description input for video generation
   - Supports models: Azure Sora, Google VEO2/VEO3 Text-to-Video, ComfyUI LTX
   - Uses `GenerationTypeEnum.TEXT_TO_VIDEO` filtering

2. **Image-to-Video Mode**
   - Drag-and-drop image upload component
   - Source image animation with text description (optional)
   - Supports models: Google VEO2/VEO3 Image-to-Video models
   - Uses `GenerationTypeEnum.IMAGE_TO_VIDEO` filtering

### Architecture Components

#### Frontend Components
- **Tabs UI**: Uses Radix UI tabs for mode switching
- **ImageUpload Component**: Drag-and-drop with validation
- **VideoGeneratorForm**: Updated with dual-mode support
- **Dynamic Model Filtering**: Separates models by generation type

#### Backend Proxy Architecture
Following AGENTS.md Typed Proxy Architecture:
```
Frontend → Internal API Routes → OpenAPI Client → SuperDuperAI Python Backend
```

#### Key Files Updated

1. **components/ui/tabs.tsx** - New Radix UI tabs component
2. **app/tools/video-generator/components/image-upload.tsx** - New drag-and-drop component
3. **app/tools/video-generator/components/video-generator-form.tsx** - Updated with tabs
4. **app/api/generate/video/route.ts** - Enhanced proxy with image upload support
5. **app/tools/video-generator/hooks/use-video-generator.ts** - Updated for dual-mode

### Technical Implementation

#### Model Filtering
Uses existing OpenAPI types for proper model separation:
```typescript
// Text-to-Video models
const textToVideoModels = allVideoModels.filter(model => 
  model.type === GenerationTypeEnum.TEXT_TO_VIDEO
);

// Image-to-Video models  
const imageToVideoModels = allVideoModels.filter(model => 
  model.type === GenerationTypeEnum.IMAGE_TO_VIDEO
);
```

#### Image Upload Flow
```typescript
// 1. Upload image via OpenAPI FileService
const uploadResult = await FileService.fileUpload({
  formData: { payload: sourceImageFile }
});

// 2. Create reference for video generation
const references = [{
  type: 'source',
  reference_id: uploadResult.id,
  reference_url: uploadResult.url
}];

// 3. Generate video with reference
const result = await FileService.fileGenerateVideo({
  requestBody: {
    type: "media",
    config: {
      prompt,
      references, // Include source image
      generation_config_name: selectedModel
    }
  }
});
```

#### API Proxy Enhancement
Updated `/api/generate/video` route to handle:
- **JSON requests** for text-to-video mode
- **FormData requests** for image-to-video mode with file upload
- **Proper OpenAPI client usage** with `FileService.fileUpload()` and `FileService.fileGenerateVideo()`

### UI/UX Features

#### ImageUpload Component
- **Drag-and-drop interface** with visual feedback
- **File validation**: JPEG, PNG, WebP (max 10MB)
- **Preview with remove option**
- **Loading states** during upload
- **Helpful tips** for image-to-video generation

#### Tabbed Interface
- **Clean separation** between text-to-video and image-to-video modes
- **Model filtering** shows only relevant models per tab
- **Context-sensitive prompts**: "Video Description" vs "Animation Description"
- **Model count display** for transparency

### Implementation Benefits

1. **OpenAPI Compliance**: Uses existing typed architecture
2. **Security**: API tokens remain server-side only  
3. **Type Safety**: End-to-end TypeScript support
4. **Maintainability**: Follows established patterns
5. **User Experience**: Intuitive tabbed interface
6. **Flexibility**: Supports both generation modes seamlessly

### Dependencies Added

- `@radix-ui/react-tabs`: For tabbed interface UI component

### Testing

- **TypeScript validation**: All type checks pass
- **OpenAPI integration**: Uses existing FileService methods
- **Form validation**: Zod schemas for both modes
- **Error handling**: Proper upload and generation error flows

### Future Enhancements

1. **Video-to-Video mode**: Third tab for video input
2. **Batch generation**: Multiple images/videos at once  
3. **Advanced controls**: Motion vectors, camera controls
4. **Preview optimization**: Better file format support

This implementation successfully adds dual-mode functionality while maintaining the existing OpenAPI architecture. 