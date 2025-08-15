# Implementation Plan: User Accounts and Billing

**Date:** 2025-06-25
**AI Agent:** Codex
**Status:** Draft

## Overview
Implement user account management with Stripe subscriptions and a simple credit tracking system. This will enable paid tiers and usage limits across all micro-apps.

## Requirements
### Functional Requirements
- [ ] Stripe subscription checkout and billing portal
- [ ] Credit balance field on the user model
- [ ] Middleware enforcing credit usage limits

### Non-Functional Requirements
- [ ] Secure webhook handling for Stripe events
- [ ] Clear UI for managing subscription status
- [ ] Graceful handling of failed payments

## Architecture Decisions
- Use `@stripe/stripe-js` on the client and Stripe SDK on the server
- Store credits in the unified `users` table
- Deduct credits via database transactions when generations occur

## Implementation Steps
1. Create billing pages in `packages/chatbot` or `packages/account`.
2. Implement Stripe checkout session creation and webhook handlers.
3. Add `credits` column to the user schema with Drizzle migration.
4. Update generator and editor flows to decrement credits per usage.
5. Provide UI components to display current balance and purchase history.
6. Document billing setup and environment variables required.

## Testing Strategy
- Unit tests for webhook verification logic
- Integration tests simulating credit deduction
- Playwright smoke test completing a checkout and generating media

## Success Metrics
- Users can subscribe and manage billing without errors
- Credit balance updates correctly after each generation
- Failed payments trigger account notifications

## Approval
**Ready for Implementation:** No (awaiting review)
**Estimated Timeline:** 5 days
**Assigned AI Agent:** Codex
