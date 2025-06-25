# Implementation Plan: Generators Micro-App

**Date:** 2025-06-25
**AI Agent:** Codex
**Status:** Draft

## Overview
Create a dedicated micro-application for image, video, and prompt generation tools. This app will reuse shared generator components and provide real-time feedback via SSE.

## Requirements
### Functional Requirements
- [ ] Next.js package at `packages/generators`
- [ ] Pages for image, video, and prompt generators
- [ ] Integration with SuperDuperAI API via internal proxy routes
- [ ] Gallery/history of generated artifacts

### Non-Functional Requirements
- [ ] SSE updates for generation progress
- [ ] Mobile-friendly responsive design
- [ ] Shared authentication and credit tracking logic

## Architecture Decisions
- Use shared hooks from `packages/lib` for generation API calls
- Keep UI components in `packages/ui/generators`
- Store generated files in Vercel Blob with links in the database

## Implementation Steps
1. Scaffold `packages/generators` with routing for `/image`, `/video`, and `/prompt`.
2. Implement generator forms using existing components from the chat.
3. Create API routes to start generations and poll results.
4. Reuse SSE utilities for progress updates.
5. Add a simple gallery page listing previous generations per user.
6. Connect credit usage to the billing system.

## Testing Strategy
- Unit tests for generator hooks
- Integration tests for API routes with mocked OpenAPI client
- Playwright smoke tests generating an image and a video

## Success Metrics
- Users can generate media without visiting the chat interface
- SSE updates display progress in real time
- Generated artifacts appear in the gallery with correct metadata

## Approval
**Ready for Implementation:** No (awaiting review)
**Estimated Timeline:** 4 days
**Assigned AI Agent:** Codex
