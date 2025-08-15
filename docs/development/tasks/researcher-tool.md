# Implementation Plan: Researcher Marketing Tool

**Date:** 2025-06-25
**AI Agent:** Codex
**Status:** Draft

## Overview
Implement a tool for researching marketing trends and copying popular video ideas. The tool will gather trending topics and help generate content ideas.

## Requirements
### Functional Requirements
- [ ] Package `packages/researcher`
- [ ] Page displaying trending video topics
- [ ] Integration with external APIs (e.g., YouTube or TikTok trends)
- [ ] Option to send selected trends to generators or the editor

### Non-Functional Requirements
- [ ] Cache external API results to reduce rate limits
- [ ] Provide simple analytics on trend popularity
- [ ] Responsive design using shared `ui` components

## Architecture Decisions
- Use server actions to fetch trend data on demand
- Store cached results in the database with TTL
- Allow cross-package imports to re-use generation utilities

## Implementation Steps
1. Scaffold `packages/researcher` with a dashboard page.
2. Implement API routes that call external trend services.
3. Store results in a `trends` table via Drizzle with an expiration column.
4. Add UI components to view, sort, and select trends.
5. Provide buttons to open selected trends in the generator or editor packages.
6. Document API keys required for trend providers.

## Testing Strategy
- Unit tests for external API wrappers
- Integration tests for caching logic
- Playwright smoke test visiting the trends page and triggering a generator

## Success Metrics
- Trend data loads within two seconds with caching
- Users can convert trends into generation prompts easily
- Minimal API rate limit errors during normal use

## Approval
**Ready for Implementation:** No (awaiting review)
**Estimated Timeline:** 4 days
**Assigned AI Agent:** Codex
