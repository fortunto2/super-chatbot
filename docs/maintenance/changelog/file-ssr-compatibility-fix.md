# File Object SSR Compatibility Fix

**Date**: January 15, 2025  
**Type**: Bug Fix  
**Component**: Video Generator Form  
**Environment**: Next.js SSR  

## Issue
Runtime error "File is not defined" when loading the video generator page due to server-side rendering trying to access the browser-only `File` object in Zod validation schema.

```
Error: File is not defined
at app/tools/video-generator/components/video-generator-form.tsx (39:24)
```

## Root Cause
The `File` object is a browser Web API that doesn't exist in Node.js server environment. Next.js was attempting to execute the Zod schema validation during SSR, causing the error:

```typescript
// ❌ Problematic code
sourceImage: z.object({
  file: z.instanceof(File),  // File not available on server
  previewUrl: z.string()
}).optional(),
```

## Solution
Added environment detection to use different validation strategies for server vs client:

```typescript
// ✅ Fixed code
sourceImage: z.object({
  // AICODE-NOTE: Use any() instead of instanceof(File) for SSR compatibility
  file: typeof window !== 'undefined' ? z.instanceof(File) : z.any(),
  previewUrl: z.string()
}).optional(),
```

### How It Works
- **Server-side (SSR)**: `typeof window !== 'undefined'` is `false`, uses `z.any()` for loose validation
- **Client-side**: `typeof window !== 'undefined'` is `true`, uses `z.instanceof(File)` for strict validation

## Changes Made

### Files Modified
- `app/tools/video-generator/components/video-generator-form.tsx`
  - Updated Zod schema to handle SSR environment
  - Added environment detection for File object validation

## Testing
- ✅ Page loads without SSR errors
- ✅ Client-side validation still works properly
- ✅ File upload functionality preserved

## Key Insights
1. **SSR limitations**: Browser APIs like `File`, `Blob`, `FormData` aren't available on server
2. **Environment detection**: Use `typeof window !== 'undefined'` to detect client vs server
3. **Graceful degradation**: Use looser validation on server, strict validation on client
4. **Zod best practices**: Consider environment when using `instanceof` checks

## Related Issues
This pattern should be applied to any validation schemas that use browser-only objects:
- `File`, `Blob`, `FileList`
- `HTMLElement`, `HTMLInputElement`
- `Event`, `MouseEvent`, etc.

## Prevention
For future schemas involving browser APIs:
1. Always consider SSR compatibility
2. Use environment detection for browser-specific validations
3. Test components in both SSR and CSR modes 