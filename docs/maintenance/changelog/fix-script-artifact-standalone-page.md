# Fix: Script Artifact Standalone Page Access

## Problem

Script artifacts created through the chat interface could not be opened in standalone mode (`/artifact/{id}` pages) due to authentication/authorization issues.

## Root Cause

1. **Default Visibility**: All documents were created with `visibility: 'private'` by default
2. **API Authorization Logic**: The `/api/document` endpoint required authentication before checking document visibility, blocking access to public documents
3. **Missing Public Access**: No mechanism for public access to script artifacts

## Solution

### 1. Fixed API Authorization Logic

**File**: `app/(chat)/api/document/route.ts`

Modified the API endpoint to check document visibility before requiring authentication:

```typescript
// OLD: Always required auth first
if (!session?.user?.id) {
  return new Response("Unauthorized", { status: 401 });
}

// NEW: Check document first, auth only for private docs
const documents = await getDocumentsById({ id });
const [document] = documents;

if (document.visibility === "public") {
  // Public documents accessible without auth
  await incrementDocumentViewCount({ id });
  return Response.json(documents, { status: 200 });
} else {
  // Private documents require auth
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  // ... auth checks
}
```

### 2. Updated Document Creation Logic

**File**: `lib/db/queries.ts`

Modified `saveDocument` function to support visibility parameter and default script artifacts to public:

```typescript
export async function saveDocument({
  // ... existing params
  visibility,
}: {
  // ... existing types
  visibility?: "public" | "private";
}) {
  // Set default visibility based on kind
  const defaultVisibility =
    visibility || (kind === "script" ? "public" : "private");

  return await db.insert(document).values({
    // ... existing fields
    visibility: defaultVisibility,
  });
}
```

### 3. Enhanced Error Handling

**File**: `app/artifact/[id]/page.tsx`

Added better debugging and error reporting:

```typescript
// Fixed parameter extraction
const id = params.id as string;

// Added validation
if (!id) {
  setError("Invalid artifact ID");
  return;
}

// Enhanced error logging
const errorText = await response.text();
console.error("API Error:", response.status, errorText);
```

## Impact

- ✅ Script artifacts now public by default
- ✅ Standalone pages work without authentication for public documents
- ✅ Private documents still require proper authentication
- ✅ Existing private documents remain protected
- ✅ Better error handling and debugging

## Migration Notes

- **Existing Documents**: Previously created script documents remain private and require user authentication
- **New Documents**: Script documents created after this fix are public by default
- **Other Artifact Types**: Text, image, video, sheet artifacts remain private by default

## Testing

1. Create new script via chat interface
2. Click standalone link or navigate to `/artifact/{id}`
3. Should open without requiring login
4. Test with both authenticated and unauthenticated sessions

## Additional Fix: Content Passing Issue

### 4. Fixed Content Parameter Passing

**Files**: `lib/ai/tools/create-document.ts`, `artifacts/script/server.ts`

**Problem**: Script content was not being passed from the generation API to the document handler, resulting in title being saved instead of actual script content.

**Root Cause**: The `createDocument` tool did not accept or pass the `content` parameter to document handlers.

**Solution**:

```typescript
// lib/ai/tools/create-document.ts
parameters: z.object({
  title: z.string(),
  kind: z.enum(artifactKinds),
  content: z.string().optional(), // Added content parameter
}),

execute: async ({ title, kind, content }) => {
  await documentHandler.onCreateDocument({
    id,
    title,
    content, // Now properly passed
    dataStream,
    session,
  });
}
```

**Impact**: Script artifacts now contain the actual generated script content rather than just the prompt.

## Files Modified

- `app/(chat)/api/document/route.ts` - API authorization logic
- `lib/db/queries.ts` - Document creation with visibility
- `app/artifact/[id]/page.tsx` - Error handling improvements
- `lib/artifacts/server.ts` - Interface updates
- `lib/ai/tools/create-document.ts` - Content parameter passing
- `artifacts/script/server.ts` - Improved content handling and logging
