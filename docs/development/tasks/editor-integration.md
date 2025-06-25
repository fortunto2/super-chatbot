# Implementation Plan: Legacy Editor Integration

**Date:** 2025-06-25
**AI Agent:** Codex
**Status:** Draft

## Overview
Integrate the existing storyboard editor from `editor.superduperai.co` into the Turborepo. The editor will reuse generator modules while maintaining compatibility with legacy projects.

## Requirements
### Functional Requirements
- [ ] Package `packages/editor` containing the legacy editor
- [ ] Shared modules for image and video generation embedded within the editor
- [ ] Import existing React components and adjust build configuration

### Non-Functional Requirements
- [ ] Preserve current user project data structure
- [ ] Support Remotion-based video rendering
- [ ] Maintain feature parity with the standalone editor

## Architecture Decisions
- Embed the editor as a separate Next.js app to simplify build
- Use module federation or shared packages for generator components
- Keep old routes available for compatibility via redirects

## Implementation Steps
1. Copy the legacy editor code into `packages/editor`.
2. Replace Python API calls with internal Next.js routes using the typed proxy pattern.
3. Integrate Remotion.js player from the old codebase.
4. Ensure generator modules are imported from `packages/generators`.
5. Add environment variables for any external services used by the editor.
6. Test loading existing projects and rendering videos inside the new app.

## Testing Strategy
- Unit tests for custom hooks and utilities inside the editor
- Manual smoke test loading an existing storyboard and exporting video
- Playwright script verifying that the editor loads and basic tools work

## Success Metrics
- Editor runs within the Turborepo without errors
- Users can open, edit, and export projects using the new backend
- Shared generator modules reduce duplicated code

## Approval
**Ready for Implementation:** No (awaiting review)
**Estimated Timeline:** 5 days
**Assigned AI Agent:** Codex
