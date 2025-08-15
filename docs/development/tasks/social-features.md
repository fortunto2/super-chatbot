# Implementation Plan: Social Features

**Date:** 2025-06-25
**AI Agent:** Codex
**Status:** Draft

## Overview
Add basic social functionality such as following other users, liking artifacts, and sharing content. These features will encourage user engagement across micro-apps.

## Requirements
### Functional Requirements
- [ ] Database tables for follows and likes
- [ ] API routes to follow/unfollow and like/unlike artifacts
- [ ] UI components showing follower counts and like buttons

### Non-Functional Requirements
- [ ] Rate limiting to prevent abuse
- [ ] Notifications via SSE when a user is followed
- [ ] Accessible components that work on mobile

## Architecture Decisions
- Use Drizzle migrations for new tables `follows` and `likes`
- Share social components across packages via `packages/ui/social`
- Deliver notifications using existing SSE channel infrastructure

## Implementation Steps
1. Define Drizzle schemas and migrations for social tables.
2. Implement API routes `/api/social/follow` and `/api/social/like`.
3. Create React components `FollowButton` and `LikeButton` in shared UI.
4. Update user profile pages to show follower counts and liked artifacts.
5. Emit SSE events when follow or like actions occur.
6. Write documentation explaining social features and usage limits.

## Testing Strategy
- Unit tests for social API routes
- Integration tests ensuring SSE events fire
- Playwright smoke test following a user and liking an artifact

## Success Metrics
- Users can follow each other and like content without errors
- SSE notifications appear in real time
- Database constraints prevent duplicate follows or likes

## Approval
**Ready for Implementation:** No (awaiting review)
**Estimated Timeline:** 4 days
**Assigned AI Agent:** Codex
