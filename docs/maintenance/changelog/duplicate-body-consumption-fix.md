# Duplicate Request Body Consumption Fix

**Date**: January 15, 2025  
**Type**: Bug Fix  
**Component**: Video Generation API  
**Environment**: Next.js API Routes  

## Issue
Video generation API was failing with "The body has already been consumed" error when processing image-to-video requests with file uploads.

```
💥 Video API error: TypeError: The body has already been consumed.
    at consumeBody.next (<anonymous>)
    at POST (app/api/generate/video/route.ts:69:37)
```

## Root Cause
The code was reading the request body **twice**:
1. **Line 14**: `const formData = await request.formData()` - First read to extract form fields
2. **Line 69**: `const formData = await request.formData()` - Second read to get image file again

In web standards, request bodies can only be consumed **once**. The second read attempt throws an error.

## Solution
Refactored code to read request body only once and properly scope variables:

### Before (Problematic)
```typescript
// First read - scope limited to if block
if (contentType?.includes('multipart/form-data')) {
  const formData = await request.formData();
  const sourceImageFile = formData.get('sourceImage') as File | null;
  // ... extract other fields
}

// Second read - ERROR!
if (generationType === 'image-to-video' && contentType?.includes('multipart/form-data')) {
  const formData = await request.formData(); // ❌ Body already consumed
  const sourceImageFile = formData.get('sourceImage') as File | null;
}
```

### After (Fixed)
```typescript
// Single read with proper variable scoping
let sourceImageFile: File | null = null;

if (contentType?.includes('multipart/form-data')) {
  const formData = await request.formData(); // ✅ Read once
  sourceImageFile = formData.get('sourceImage') as File | null;
  // ... extract other fields
}

// Use already extracted file
if (generationType === 'image-to-video' && sourceImageFile) {
  // ✅ Use existing variable, no second read needed
  // ... upload logic
}
```

## Changes Made

### Files Modified
- `app/api/generate/video/route.ts`
  - Declared `sourceImageFile` at function scope level
  - Removed duplicate `request.formData()` call
  - Simplified condition check to use existing variable

### Key Improvements
1. **Single body consumption**: Request body read only once
2. **Proper variable scoping**: `sourceImageFile` available throughout function
3. **Simplified logic**: Direct file check instead of content-type + formData re-read
4. **Better error handling**: Eliminates consumption error completely

## Testing Results
- ✅ Text-to-video generation works
- ✅ Image-to-video generation with file upload works  
- ✅ No "body already consumed" errors
- ✅ File upload and processing logic preserved

## Key Insights
1. **Web Standards**: Request bodies are streams that can only be read once
2. **Variable Scoping**: Extract data once and scope appropriately for reuse
3. **API Design**: Plan data flow to avoid re-reading request bodies
4. **Error Prevention**: Use TypeScript to catch scope-related issues early

## Related Best Practices
For Next.js API routes handling mixed content types:
1. Read request body once at the start
2. Extract all needed data immediately
3. Store in appropriately scoped variables
4. Use extracted data throughout the function
5. Never attempt to re-read request streams