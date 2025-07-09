# Document Gallery Implementation Plan

**Date:** July 5, 2025
**Feature:** Document Gallery with Grid View, Filters, and Search
**Author:** AI Assistant

## Overview

Implementation of a comprehensive document gallery that displays user's own and public documents (artifacts) in a grid layout with advanced filtering, search capabilities, and click-through to individual artifact pages. This feature extends the existing Document API rather than creating a new API endpoint.

## Requirements

1. **Gallery Page** at `/gallery` route (displays as "Artifacts" in UI)
2. **Grid Layout** showing document thumbnails/previews
3. **Document Types** support: image, video, text, sheet (displayed as artifact types)
4. **Visibility Toggle**: Switch between "My Artifacts" and "Public Artifacts"
5. **Search Functionality**: Search by title, tags, and content
6. **Filters**:
   - Type filter (image/video/text/sheet)
   - Model filter (FLUX Pro/Dev, VEO3, etc.)
   - Date range filter
   - Sort options (newest/oldest, most viewed)
7. **Click Navigation**: Click on document card opens `/artifact/[id]` (existing route)
8. **Responsive Design**: Mobile-friendly grid layout
9. **Backward Compatibility**: Use existing Document table and API structure

## Phase 1: Database Schema Updates

### 1.1 Update Document Table
```sql
ALTER TABLE "Document" ADD COLUMN "visibility" varchar DEFAULT 'private';
ALTER TABLE "Document" ADD COLUMN "tags" jsonb DEFAULT '[]';
ALTER TABLE "Document" ADD COLUMN "model" varchar;
ALTER TABLE "Document" ADD COLUMN "viewCount" integer DEFAULT 0;
ALTER TABLE "Document" ADD COLUMN "thumbnailUrl" text;
ALTER TABLE "Document" ADD COLUMN "metadata" jsonb DEFAULT '{}';
```

### 1.2 Create Indexes
```sql
CREATE INDEX idx_document_visibility ON "Document"(visibility);
CREATE INDEX idx_document_kind ON "Document"(kind);
CREATE INDEX idx_document_userId ON "Document"(userId);
CREATE INDEX idx_document_createdAt ON "Document"(createdAt DESC);
CREATE INDEX idx_document_title ON "Document" USING gin(to_tsvector('english', title));
CREATE INDEX idx_document_tags ON "Document" USING gin(tags);
```

### 1.3 Update Drizzle Schema
Update `lib/db/schema.ts`:
- Add visibility field with enum ['public', 'private']
- Add tags field as json
- Add model field as varchar
- Add viewCount as integer
- Add thumbnailUrl as text
- Add metadata as json

## Phase 2: API Implementation

### 2.1 Extend Document API
**Update existing endpoint:** `GET /api/document`
**Add new query parameters:**
- `list` (boolean): Enable list mode (returns multiple documents)
- `page` (number): Page number for pagination
- `limit` (number): Items per page (default: 20)
- `kind` (string): Filter by document kind (image/video/text/sheet)
- `model` (string): Filter by generation model
- `dateFrom` (string): Start date filter
- `dateTo` (string): End date filter
- `search` (string): Search query
- `sort` (string): Sort option (newest/oldest/popular)
- `visibility` (string): Filter by visibility (mine/public/all)
- `userId` (string): Filter by specific user (for public view)

**Response for list mode:**
```typescript
{
  documents: Array<{
    id: string
    title: string
    kind: ArtifactKind
    thumbnailUrl?: string
    createdAt: Date
    userId: string
    username?: string
    model?: string
    tags: string[]
    viewCount: number
    visibility: 'public' | 'private'
    metadata: {
      prompt?: string
      resolution?: string
      duration?: number
    }
  }>
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}
```

### 2.2 Update Existing Document Functions
Extend `lib/db/queries.ts`:
- Update `getDocumentsById` to `getDocuments` with filter support
- Add `getPublicDocuments` function
- Add `searchDocuments` function with full-text search
- Add `incrementDocumentViewCount` function

### 2.3 Permission Updates
Update document API to:
- Allow viewing public documents without ownership check
- Track view counts for public documents
- Include username in response for public documents

## Phase 3: UI Components

### 3.1 Gallery Page Component
```
app/gallery/                # Using /gallery route to avoid confusion with /artifact/[id]
  page.tsx                 # Main gallery page
  layout.tsx              # Gallery layout
  components/
    document-gallery.tsx   # Gallery grid component
    document-card.tsx      # Individual document card
    gallery-filters.tsx    # Filter sidebar
    gallery-search.tsx     # Search bar component
    gallery-skeleton.tsx   # Loading skeleton
```

### 3.2 Artifact Card Design
- **Image/Video**: Show thumbnail or first frame
- **Text**: Show snippet with gradient fade
- **Sheet**: Show data preview or chart
- **Metadata Display**: Model badge, date, view count
- **Hover Effects**: Scale and shadow animation
- **Click Handler**: Navigate to `/artifact/[id]`

### 3.3 Filter Sidebar
- **Ownership Toggle**: My Artifacts / Public Artifacts
- **Type Checkboxes**: Image, Video, Text, Sheet
- **Model Dropdown**: Dynamic list from available models
- **Date Range Picker**: Calendar component
- **Sort Dropdown**: Newest, Oldest, Most Popular
- **Clear Filters Button**

### 3.4 Search Implementation
- **Debounced Search**: 300ms delay
- **Search Suggestions**: Recent searches
- **Clear Search Button**
- **Loading State**: During search

## Phase 4: Thumbnail Generation

### 4.1 Image Artifacts
- Use existing imageUrl as thumbnail
- Resize to 400x300 for performance

### 4.2 Video Artifacts
- Extract first frame as thumbnail
- Store in Vercel Blob storage

### 4.3 Text Artifacts
- Generate preview image with title and snippet
- Use Canvas API or server-side generation

### 4.4 Sheet Artifacts
- Generate chart preview if data contains charts
- Show data table preview otherwise

## Phase 5: Performance Optimization

### 5.1 Pagination
- Server-side pagination with cursor-based approach
- Load 20 items per page
- Infinite scroll option

### 5.2 Caching
- Cache public artifacts list for 5 minutes
- Use React Query for client-side caching
- Implement stale-while-revalidate pattern

### 5.3 Image Optimization
- Use Next.js Image component
- Lazy loading for below-fold content
- Blur placeholder for images

## Phase 6: Security & Permissions

### 6.1 Access Control
- Only artifact owner can see private artifacts
- Public artifacts visible to all users
- Guest users can view public artifacts

### 6.2 Rate Limiting
- Limit API requests to 100/minute per user
- Implement search rate limiting

## Phase 7: Testing Strategy

### 7.1 Unit Tests
- Test filter logic
- Test search functionality
- Test pagination

### 7.2 Integration Tests
- Test API endpoints
- Test database queries
- Test permission checks

### 7.3 E2E Tests
- Test gallery navigation
- Test filter interactions
- Test search functionality
- Test responsive design

## Implementation Order

1. **Week 1**: Database schema updates and migration
2. **Week 1**: API endpoints implementation
3. **Week 2**: Gallery page and basic grid layout
4. **Week 2**: Filter sidebar implementation
5. **Week 3**: Search functionality
6. **Week 3**: Thumbnail generation system
7. **Week 4**: Performance optimization
8. **Week 4**: Testing and bug fixes

## Dependencies

- **New Dependencies**:
  - `react-intersection-observer` for infinite scroll
  - `date-fns` for date formatting
  - `framer-motion` for animations

- **Existing Dependencies**:
  - Next.js Image component
  - Radix UI components
  - Tailwind CSS
  - Drizzle ORM

## Migration Strategy

1. **Backward Compatibility**: Existing artifacts work without modification
2. **Default Values**: All existing artifacts default to 'private' visibility
3. **Gradual Migration**: Generate thumbnails on-demand for existing artifacts

## Risks and Mitigations

1. **Risk**: Performance with large datasets
   **Mitigation**: Implement proper indexing and pagination

2. **Risk**: Thumbnail generation load
   **Mitigation**: Queue-based background processing

3. **Risk**: Search performance
   **Mitigation**: Use PostgreSQL full-text search with proper indexes

## Success Metrics

1. **Page Load Time**: < 2 seconds for initial load
2. **Search Response**: < 500ms for search results
3. **User Engagement**: 50% of users use filters
4. **Error Rate**: < 0.1% API error rate

## Future Enhancements

1. **Collections**: Group artifacts into collections
2. **Sharing**: Share collections or individual artifacts
3. **Comments**: Add commenting system
4. **Analytics**: View analytics for public artifacts
5. **Export**: Bulk export functionality

## AICODE Comments Strategy

```typescript
// AICODE-NOTE: Gallery uses cursor-based pagination for performance with large datasets
// AICODE-NOTE: Thumbnails are generated on-demand and cached in Vercel Blob
// AICODE-TODO: Implement collection feature after initial release
// AICODE-ASK: Should we implement view count tracking for private artifacts?
```

## Approval Checklist

- [ ] Database schema changes reviewed
- [ ] API design approved
- [ ] UI/UX mockups approved
- [ ] Performance targets agreed
- [ ] Security considerations addressed
- [ ] Testing strategy approved

---

**Status:** Awaiting Approval
**Last Updated:** July 5, 2025 