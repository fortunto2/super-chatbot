# Image Upload Fallback System for Video Generation

## Overview

Система fallback для обработки изображений в image-to-video генерации, которая решает проблемы с backend API (например, ошибки python-magic библиотеки) путем использования нескольких альтернативных методов загрузки.

## Problem Statement

Backend SuperDuperAI API иногда имеет проблемы с:

- `AttributeError: module 'magic' has no attribute 'Magic'`
- File type detection failures
- Upload service unavailability
- MIME type validation errors

## Solution Architecture

### Multiple Upload Methods

Система пытается 4 различных метода в порядке приоритета:

#### 1. Existing Image Reference (Priority 1)

```typescript
// Method 1: Use existing image ID/URL if available
if (params.sourceImageId || params.sourceImageUrl) {
  return {
    imageId: params.sourceImageId,
    imageUrl: params.sourceImageUrl,
    method: "existing",
  };
}
```

**Use Cases**:

- Previously uploaded images
- External image URLs
- Shared images from other generations

#### 2. Direct File Upload (Priority 2)

```typescript
// Method 2: Try direct file upload (current approach)
const uploadResult = await FileService.fileUpload({
  formData: { payload: params.sourceImageFile },
});

return {
  imageId: uploadResult.id,
  imageUrl: uploadResult.url,
  method: "upload",
};
```

**Use Cases**:

- Fresh file uploads
- When backend is working properly
- Normal operation mode

#### 3. Base64 Conversion (Priority 3)

```typescript
// Method 3: Try Base64 approach as fallback
const base64Data = await this.fileToBase64(params.sourceImageFile);
const dataUrl = `data:${params.sourceImageFile.type};base64,${base64Data}`;

return {
  imageUrl: dataUrl,
  method: "base64",
};
```

**Use Cases**:

- When file upload fails
- Backend file processing issues
- Small to medium images (< 2MB recommended)

#### 4. Object URL Creation (Priority 4)

```typescript
// Method 4: Try creating object URL as last resort
const objectUrl = URL.createObjectURL(params.sourceImageFile);

return {
  imageUrl: objectUrl,
  method: "direct",
};
```

**Use Cases**:

- Last resort fallback
- Local preview/testing
- When all other methods fail

## Implementation Details

### ImageToVideoStrategy Enhancement

```typescript
export class ImageToVideoStrategy implements VideoGenerationStrategy {
  async handleImageUpload(params: ImageToVideoParams): Promise<{
    imageId?: string;
    imageUrl?: string;
    method: "existing" | "upload" | "base64" | "direct";
    error?: string;
  }> {
    // Try each method with graceful fallback
    // Returns first successful method or error
  }

  private fileToBase64(file: File): Promise<string> {
    // Convert File to Base64 for embedded usage
  }
}
```

### Error Handling

```typescript
// Enhanced error messages for common issues
if (errorMessage.includes("magic") || errorMessage.includes("AttributeError")) {
  errorMessage =
    "Backend service error: File type detection failed. This is a temporary server issue.";
} else if (errorMessage.includes("upload")) {
  errorMessage =
    "Image upload failed. Please try with a different image or try again later.";
}
```

## Usage Examples

### Frontend Integration

```typescript
// Automatic fallback handling
const result = await generateVideoWithStrategy("image-to-video", {
  prompt: "animate this image",
  sourceImageFile: uploadedFile,
  model: veoModel,
  // ... other params
});

// Strategy automatically tries:
// 1. Direct upload
// 2. Base64 if upload fails
// 3. Object URL as last resort
```

### Method Selection Logic

```typescript
// Priority order based on reliability and compatibility
const methods = [
  "existing", // Most reliable - already processed
  "upload", // Best quality - server-side processing
  "base64", // Good fallback - embedded data
  "direct", // Last resort - local only
];
```

## Benefits

### 1. Resilience

- ✅ Handles backend service issues gracefully
- ✅ Multiple fallback options prevent total failures
- ✅ Automatic retry with different methods

### 2. User Experience

- ✅ No manual intervention required
- ✅ Transparent fallback process
- ✅ Informative error messages

### 3. Compatibility

- ✅ Works with various image formats
- ✅ Handles different backend states
- ✅ Future-proof for new upload methods

## Limitations & Considerations

### Base64 Method Limitations

- **Size Limit**: Recommended < 2MB for optimal performance
- **Memory Usage**: Higher memory consumption for large images
- **URL Length**: Very large images may exceed URL limits

### Object URL Method Limitations

- **Local Only**: Only works in same browser session
- **Limited Scope**: Cannot be shared or persisted
- **Temporary**: URLs expire when page reloads

### Performance Impact

```
Method            Speed    Reliability   Compatibility
existing          ⭐⭐⭐⭐⭐   ⭐⭐⭐⭐⭐      ⭐⭐⭐⭐⭐
upload            ⭐⭐⭐⭐     ⭐⭐⭐⭐       ⭐⭐⭐⭐⭐
base64            ⭐⭐⭐      ⭐⭐⭐⭐⭐      ⭐⭐⭐⭐
direct            ⭐⭐⭐⭐⭐   ⭐⭐⭐        ⭐⭐
```

## Configuration Options

### File Size Limits

```typescript
const UPLOAD_LIMITS = {
  direct: 10 * 1024 * 1024, // 10MB for direct upload
  base64: 2 * 1024 * 1024, // 2MB for base64 fallback
  objectUrl: 50 * 1024 * 1024, // 50MB for object URL
};
```

### Supported Image Formats

```typescript
const SUPPORTED_FORMATS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
];
```

## Error Recovery Strategies

### Common Backend Errors

#### Python Magic Error

```
Error: AttributeError: module 'magic' has no attribute 'Magic'
Solution: Automatic fallback to Base64 conversion
```

#### Upload Service Unavailable

```
Error: 500 Internal Server Error
Solution: Try Base64 then Object URL fallback
```

#### File Type Detection Failed

```
Error: Unsupported file type
Solution: Force Base64 encoding with explicit MIME type
```

## Testing Scenarios

### Test Case 1: Normal Operation

```typescript
// When backend works properly
const result = await strategy.handleImageUpload({
  sourceImageFile: jpegFile,
});
// Expected: { method: 'upload', imageId: '...', imageUrl: '...' }
```

### Test Case 2: Backend File Processing Error

```typescript
// When upload fails with magic error
const result = await strategy.handleImageUpload({
  sourceImageFile: pngFile,
});
// Expected: { method: 'base64', imageUrl: 'data:image/png;base64,...' }
```

### Test Case 3: All Methods Fail

```typescript
// When everything fails (edge case)
const result = await strategy.handleImageUpload({
  sourceImageFile: corruptedFile,
});
// Expected: { error: 'All image upload methods failed' }
```

## Monitoring & Logging

### Success Tracking

```
✅ Direct upload successful: image-id-123
⚠️ Direct upload failed, trying fallback methods...
✅ Base64 conversion successful
✅ Image processed via base64 method
```

### Error Tracking

```
❌ Direct upload failed: AttributeError magic
⚠️ Base64 conversion failed: File too large
❌ Object URL creation failed: Invalid file
❌ All image upload methods failed
```

## Future Enhancements

### 1. Smart Method Selection

- Pre-validate file before upload attempts
- Choose optimal method based on file size/type
- Cache method preferences per user

### 2. Progressive Upload

- Chunk large files for better reliability
- Resume interrupted uploads
- Compress images automatically

### 3. Advanced Fallbacks

- External image hosting integration (Cloudinary, AWS S3)
- Client-side image optimization
- Multiple backend endpoint support

## Integration with Strategy Pattern

The fallback system seamlessly integrates with the video generation strategy pattern:

```typescript
// In generateVideoWithStrategy function
if (
  strategy.type === "image-to-video" &&
  strategy instanceof ImageToVideoStrategy
) {
  const imageResult = await strategy.handleImageUpload(params);

  if (imageResult.error) {
    return {
      success: false,
      error: `Image processing failed: ${imageResult.error}`,
    };
  }

  // Update params with processed image data
  finalParams = {
    ...params,
    sourceImageId: imageResult.imageId,
    sourceImageUrl: imageResult.imageUrl,
  };

  console.log(`✅ Image processed via ${imageResult.method} method`);
}
```

This ensures that the image upload fallback system is automatically used for all image-to-video generations without requiring any changes to the calling code.
