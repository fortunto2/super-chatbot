# FormData Universal Fix for API Generation

## Problem

When running `pnpm generate-api`, the OpenAPI TypeScript code generator creates import statements that use the Node.js `form-data` package:

```typescript
import FormData from "form-data";
```

This causes errors in browser environments where the native `FormData` API should be used instead.

## Root Cause

The openapi-typescript-codegen library generates code optimized for Node.js environments by default, but our Next.js application runs in both browser and server environments.

## Solution

Modified `lib/api/core/request.ts` to use universal FormData support:

### 1. Universal FormData Import

```typescript
// AICODE: Universal FormData support for both browser and Node.js environments
// Use native FormData in browser, lazy load form-data for Node.js
let FormDataClass: any = null;

const getFormDataClass = () => {
  if (FormDataClass) return FormDataClass;

  if (typeof window !== "undefined") {
    // Browser environment - use native FormData
    FormDataClass = window.FormData;
  } else {
    // Node.js environment - use native FormData (available in Node.js 18+) or form-data package
    if (typeof globalThis.FormData !== "undefined") {
      FormDataClass = globalThis.FormData;
    } else {
      // Fallback to form-data package for older Node.js versions
      try {
        FormDataClass = eval("require")("form-data");
      } catch (e) {
        throw new Error(
          "FormData not available. Please upgrade to Node.js 18+ or install form-data package"
        );
      }
    }
  }

  return FormDataClass;
};
```

### 2. Updated FormData Detection

```typescript
export const isFormData = (value: any): boolean => {
  // AICODE: Check for both browser FormData and Node.js form-data
  const FormData = getFormDataClass();
  return (
    value instanceof FormData ||
    (typeof window === "undefined" &&
      value &&
      typeof value.append === "function")
  );
};
```

### 3. Updated FormData Creation

```typescript
export const getFormData = (options: ApiRequestOptions): any => {
  if (options.formData) {
    const FormData = getFormDataClass();
    const formData = new FormData();
    // ... rest of the implementation
  }
  return undefined;
};
```

## Benefits

- ✅ Works in both browser and Node.js environments
- ✅ No breaking changes to existing API calls
- ✅ Maintains type safety
- ✅ Compatible with generated API code
- ✅ No need to modify the generation process

## Implementation Notes

- The fix uses runtime environment detection (`typeof window !== 'undefined'`)
- Fallback detection for Node.js environments checks for `append` method
- Changes are marked with `AICODE:` comments for tracking
- The solution is forward-compatible with future API regenerations

## Related Files

- `lib/api/core/request.ts` - Main implementation
- `package.json` - Contains `generate-api` script configuration

## Testing

After applying this fix:

1. Run `pnpm generate-api` to regenerate API code
2. Run `pnpm build` to ensure no TypeScript errors
3. Test file uploads in both development and production environments

## Maintenance

When regenerating API code with `pnpm generate-api`, these manual changes will need to be reapplied since the file is marked as generated code.
