# Artifact Share Links Implementation

**Date:** January 15, 2025
**Type:** Feature
**Status:** Implemented

## Summary

Added ability to share artifacts via direct links. Users can now copy a shareable link to any artifact (image, text, video, or spreadsheet) and view it on a standalone page.

## Changes Made

### 1. Added Share Button to All Artifacts

Added a new Share button to the action bar of all artifact types:
- **Image artifacts** - Copy link to share generated images
- **Text artifacts** - Copy link to share text documents  
- **Video artifacts** - Copy link to share generated videos
- **Sheet artifacts** - Copy link to share spreadsheets

### 2. Created Standalone Artifact View Route

Added new route `/artifact/[id]` that:
- Loads artifact from database using existing API
- Displays artifact using existing artifact components
- Shows appropriate error messages for:
  - Not found artifacts
  - Unauthorized access
  - Unknown artifact types
- Provides simple navigation back to chat

### 3. Updated Action Context

Modified `ArtifactActions` component to include `documentId` in the action context, allowing actions to access the artifact's ID for generating share links.

## Implementation Details

### Share Button Implementation
```typescript
{
  icon: <ShareIcon size={18} />,
  description: 'Copy artifact link',
  onClick: (context) => {
    const documentId = (context as any).documentId;
    if (documentId && documentId !== 'init') {
      const shareUrl = `${window.location.origin}/artifact/${documentId}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success('Artifact link copied to clipboard!');
    } else {
      toast.error('Unable to generate share link - artifact not saved yet');
    }
  },
}
```

### Route Structure
- Path: `/artifact/[id]`
- Client-side rendered for better UX
- Uses existing `/api/document?id={id}` endpoint
- Reuses existing artifact components for consistency

## User Experience

1. User creates/views an artifact in chat
2. Clicks the Share button in artifact actions
3. Link is copied to clipboard with success toast
4. Anyone with the link can view the artifact (if they have permission)
5. Standalone view shows artifact with minimal UI and "Back to Chat" navigation

## Security Considerations

- Authentication check via API endpoint
- Only artifact owner can view (for now)
- Future enhancement: Add public/private visibility settings

## Benefits

- Easy sharing of generated content
- Direct access to specific artifacts
- Consistent display using existing components
- No duplicate code - reuses existing artifact system 