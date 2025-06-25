# Implementation Plan: Port Python API Endpoints to Next.js

**Date:** 2025-06-25
**AI Agent:** Codex
**Status:** Draft

## Overview
Move essential FastAPI endpoints into Next.js API routes under the new Turborepo. This allows the Python backend to be decommissioned once parity is achieved.

## Requirements
### Functional Requirements
- [ ] Recreate all required API endpoints in `app/api/*/route.ts`
- [ ] Maintain request/response formats for backward compatibility
- [ ] Use typed proxy pattern with the existing OpenAPI client

### Non-Functional Requirements
- [ ] Match current authentication logic using NextAuth sessions
- [ ] Provide comprehensive error handling and logging
- [ ] Include SSE support where applicable

## Architecture Decisions
- Each micro-app will have its own API folder but share common proxy utilities
- Use Zod for input validation and typed responses
- Keep endpoint naming consistent with existing frontend calls

## Implementation Steps
1. Inventory all FastAPI routes currently in use by the frontend.
2. For each route, create a matching Next.js API route and implement the logic using the OpenAPI client.
3. Add unit tests covering success and failure cases.
4. Ensure SSE or polling endpoints are replicated using existing utilities.
5. Update frontend fetch calls to point at the new routes.
6. Remove Python API dependencies once all routes are migrated.

## Testing Strategy
- Unit tests for each route with mocked OpenAPI client responses
- Integration tests hitting the routes via Supertest
- Smoke tests via Playwright for critical flows

## Success Metrics
- All migrated endpoints respond with the same data as the Python API
- No regressions in existing generator and chat features
- Python backend can be shut down without breaking functionality

## Approval
**Ready for Implementation:** No (awaiting review)
**Estimated Timeline:** 5 days
**Assigned AI Agent:** Codex
