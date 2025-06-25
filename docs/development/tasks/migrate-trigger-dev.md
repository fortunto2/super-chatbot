# Implementation Plan: Replace Prefect with Trigger.dev

**Date:** 2025-06-25
**AI Agent:** Codex
**Status:** Draft

## Overview
Replace existing Prefect flows with Trigger.dev jobs to manage background tasks and scheduling inside the Next.js environment.

## Requirements
### Functional Requirements
- [ ] Install `@trigger.dev/sdk` and set up client configuration
- [ ] Reimplement current Prefect flows as Trigger.dev jobs
- [ ] Provide HTTP endpoints or event triggers for each job

### Non-Functional Requirements
- [ ] Ensure jobs run reliably on Vercel
- [ ] Preserve current scheduling intervals
- [ ] Add logging and monitoring via Trigger.dev dashboard

## Architecture Decisions
- Jobs will live in `packages/jobs` with shared utilities
- Use event-based triggers for media generation tasks
- Keep job code TypeScript-only for uniformity

## Implementation Steps
1. Audit existing Prefect flows and document their triggers and outputs.
2. Add `@trigger.dev/sdk` and initialize a global `TriggerClient`.
3. Convert each flow into a job using `client.defineJob`.
4. Add HTTP endpoints or event emitters to start jobs from the app.
5. Implement error handling and retries according to Trigger.dev best practices.
6. Remove Prefect dependencies and configuration files.
7. Update documentation on how to run jobs locally and in production.

## Testing Strategy
- Unit tests for job functions with mocked external calls
- Integration tests triggering jobs via HTTP endpoints
- Manual smoke tests to ensure jobs execute in a deployed environment

## Success Metrics
- Jobs execute successfully on schedule or via triggers
- No regressions in generation tasks currently handled by Prefect
- Trigger.dev dashboard shows successful runs without excessive retries

## Approval
**Ready for Implementation:** No (awaiting review)
**Estimated Timeline:** 3 days
**Assigned AI Agent:** Codex
