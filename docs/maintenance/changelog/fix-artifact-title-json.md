# Fix Artifact Title JSON Storage Issue

## Problem

AI agent was saving entire JSON configuration as artifact title in database, resulting in:
- Unreadable titles containing full JSON objects
- Massive data duplication (all available models, styles, etc.)
- Database bloat with huge title fields

Example of problematic title:
```json
{"prompt":"A dramatic scene","style":{"id":"flux_watercolor"},"resolution":{"width":1024},...[entire arrays of available options]}
```

## Root Cause

1. AI agent passes parameters as JSON in title: `title: JSON.stringify(imageParams)`
2. Server-side handlers expect JSON in title for parsing parameters
3. Title was saved to database as-is without extraction

## Solution

### 1. Server-side Title Extraction
Updated `lib/artifacts/server.ts` to extract human-readable titles:
- For image/video artifacts, parse JSON and use `prompt` as title
- Handle special video format: `Video: "prompt" {...}`
- Fallback to original title if parsing fails

### 2. Client-side Title Fixing
Updated `artifacts/image/client.tsx` to extract readable titles when saving updates:
- Check if title is JSON format
- Extract prompt as readable title
- Keep original for non-JSON titles

### 3. Title Length Limitation
Added 255 character limit for database storage:
- Truncates long titles to 252 chars + "..."
- Applied in both server and client side
- Prevents database issues with oversized titles
- Does not affect JSON parsing logic (truncation happens after extraction)

## Technical Details

### Changes Made

1. **lib/artifacts/server.ts**
   - Added title extraction logic in `onCreateDocument`
   - Keeps existing title in `onUpdateDocument`
   - Truncates final title to 255 characters

2. **artifacts/image/client.tsx**
   - Added title extraction in `saveArtifactToDatabase`
   - Truncates extracted title to 255 characters

3. **lib/ai/tools/configure-image-generation.ts**
   - Added TODO comment for future refactoring

## Future Improvements

1. Refactor to pass parameters separately from title
2. Add dedicated `parameters` field to document schema
3. Update createDocument tool to accept metadata parameter

## Benefits

- Human-readable titles in database
- Reduced storage usage
- Better user experience
- Cleaner data structure

## Migration

Existing documents with JSON titles will remain, but new documents will have readable titles. 