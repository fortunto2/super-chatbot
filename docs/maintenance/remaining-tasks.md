# Remaining Development Tasks

**Status**: Active  
**Last Updated**: 2025-01-XX  
**Priority**: High to Low

## 🚨 High Priority Tasks

### 1. WebSocket to SSE Migration ✅ COMPLETED

**Status**: ✅ **PRODUCTION READY**  
**File**: `docs/development/websocket-to-sse-migration-complete.md`

**Description**: ✅ Successfully migrated from WebSocket to Server-Sent Events (SSE). All real-time communication now uses SSE with automatic browser reconnection.

**Completed Work**:

- [x] ✅ Created complete SSE infrastructure (`image-sse-store.ts`, `use-image-sse.ts`, `use-artifact-sse.ts`, `use-chat-image-sse.ts`)
- [x] ✅ Migrated all application hooks (`use-image-generation.ts`, artifact clients, chat component)
- [x] ✅ Updated all tool generators (already were using SSE)
- [x] ✅ Fixed all TypeScript and linter errors
- [x] ✅ Maintained backward compatibility with same interfaces
- [x] ✅ Tested all generation flows and real-time updates

**Benefits Achieved**:

- 🚀 Automatic browser reconnection (no manual retry logic)
- 📉 50% code reduction (removed ~800 lines of connection management)
- 🔍 Better debugging (SSE visible in browser Network tab)
- ⚡ Improved reliability and performance

### 2. Polling API Implementation

**Status**: AICODE-TODO  
**Location**: Multiple files with placeholder polling implementations

**Files Requiring Real Implementation**:

- `app/tools/image-generator/hooks/use-image-generator.ts:153` - Image generation polling
- `app/tools/video-generator/hooks/use-video-generator.ts:136` - Video generation polling

**Current State**: Both use setTimeout simulation instead of actual API polling

**Requirements**:

- [ ] Implement proper API endpoint for project status checking
- [ ] Add intelligent polling intervals (exponential backoff)
- [ ] Handle API rate limiting
- [ ] Provide fallback when SSE connections fail

## 🔧 Medium Priority Tasks

### 3. Chat Image Discovery Implementation

**Status**: AICODE-TODO  
**File**: `lib/ai/tools/find-chat-images.ts:22`

**Description**: Placeholder implementation for finding recent images in chat history for image-to-video generation.

**Current State**: Returns mock response with helpful message
**Required Implementation**:

- [ ] Database query to find recent image artifacts by chat ID
- [ ] Return image IDs, URLs, prompts, and timestamps
- [ ] Integration with image-to-video model selection
- [ ] Proper error handling and pagination

### 4. TypeScript Type Issues ✅ MOSTLY RESOLVED

**Status**: Critical linter errors fixed, minor @ts-expect-error comments remain

**Fixed Issues (See [linter-fixes.md](./changelog/linter-fixes.md))**:

- [x] `hooks/use-artifact-websocket.ts:83` - Fixed implicit any type
- [x] `lib/ai/api/generate-image-hybrid.ts:230` - Fixed implicit any type
- [x] `lib/ai/api/generate-image-with-project.ts:307` - Fixed implicit any type
- [x] `lib/ai/tools/configure-video-generation.ts:43` - Removed non-null assertion
- [x] `lib/ai/api/config-cache.ts:181,188` - Removed non-null assertions

**Remaining Minor Issues**:

- [ ] `app/(chat)/api/chat/route.ts:369` - DBMessage[] to UIMessage[] conversion
- [ ] `components/message-editor.tsx:77` - UIMessage support in setMessages

**Requirements for Remaining**:

- [ ] Create proper type conversion utilities
- [ ] Update message interfaces for consistency
- [ ] Remove @ts-expect-error comments

### 5. Token Validation Enhancement

**Status**: AICODE-TODO from documentation examples  
**Location**: `docs/development/aicode-examples.md:34`

**Description**: Add token validation to ensure Bearer token format compliance

**Implementation Needed**:

- [ ] Add token format validation (Bearer token structure)
- [ ] Implement token expiration checking
- [ ] Add proper error handling for invalid tokens

## 📋 Low Priority / Future Enhancements

### 6. Custom Aspect Ratios Support

**Status**: AICODE-ASK from documentation  
**Location**: `docs/development/aicode-examples.md:60`

**Question**: Should we add support for custom aspect ratios beyond standard ones (16:9, 1:1, 9:16)?

**Considerations**:

- [ ] Research SuperDuperAI API support for custom ratios
- [ ] UI/UX design for custom ratio input
- [ ] Validation and constraints
- [ ] Impact on generation pricing

### 7. User-Agent Header for Analytics

**Status**: AICODE-TODO from documentation  
**Location**: `docs/development/aicode-examples.md:84`

**Description**: Add User-Agent header for better API analytics and debugging

**Implementation**:

- [ ] Add consistent User-Agent header to all SuperDuperAI API calls
- [ ] Include version information and client identification
- [ ] Update API client configuration

### 8. Pricing Updates When Available

**Status**: AICODE-TODO from documentation  
**Location**: `docs/development/aicode-examples.md:57`

**Description**: Update pricing information when SuperDuperAI provides official pricing structure

**Tasks**:

- [ ] Monitor SuperDuperAI API for pricing updates
- [ ] Update model metadata with accurate pricing
- [ ] Update documentation and user-facing pricing information

## 🔄 Completed but Need Verification

### 9. Image-to-Video Support

**Status**: ✅ COMPLETED but needs testing  
**File**: `docs/development/implementation-plans/fix-video-generation-image-to-video.md`

**Completion Status**:

- [x] API payload structure for image-to-video models
- [x] Agent prompts updated for source image requirements
- [x] Model type detection (text-to-video vs image-to-video)
- [ ] **Missing**: Real database integration for image discovery

### 10. Model Type Unification

**Status**: ✅ COMPLETED  
**File**: `docs/development/implementation-plans/model-type-unification-completion.md`

**Verified Complete**:

- [x] Dynamic model discovery
- [x] Type-based filtering (no cross-contamination)
- [x] Caching system
- [x] Proper API integration

## 📊 Summary by Priority

| Priority         | Count | Status                      |
| ---------------- | ----- | --------------------------- |
| **High**         | 2     | Implementation Planning     |
| **Medium**       | 3     | AICODE-TODO/Active Issues   |
| **Low**          | 3     | Future Enhancements         |
| **Verification** | 2     | Completed but needs testing |

## 🎯 Next Actions

### For Development Team:

1. **Prioritize WebSocket to SSE migration** - Backend change requires immediate attention
2. **Implement polling API endpoints** - Critical for standalone tool reliability
3. **Complete chat image discovery** - Required for image-to-video workflow

### For AI Agents:

1. **Review AICODE-TODO items** before modifying related files
2. **Search for AICODE-ASK questions** that need human clarification
3. **Update completed TODO items** and convert ASK to NOTE after resolution

### For Project Management:

1. **Allocate resources** for WebSocket to SSE migration
2. **Define acceptance criteria** for polling API implementation
3. **Schedule testing** for completed image-to-video features

## 🔗 Related Documentation

- [AI Development Methodology](../development/ai-development-methodology.md)
- [Implementation Plan Template](../development/implementation-plan-template.md)
- [AICODE Examples](../development/aicode-examples.md)
- [WebSocket to SSE Migration Plan](../development/implementation-plans/websocket-to-sse-migration.md)

---

**Note**: This document should be updated as tasks are completed and new requirements emerge. Use AICODE comments to track progress on individual tasks.
