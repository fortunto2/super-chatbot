# Implementation Plan: Set Up Turborepo

**Date:** 2025-06-25
**AI Agent:** Codex
**Status:** Draft

## Overview
Create a Turborepo workspace to host all micro-apps and shared libraries in a single monorepo. This unifies front-end and back-end code in TypeScript and simplifies deployment to Vercel.

## Requirements
### Functional Requirements
- [ ] Turborepo workspace with `packages/` directory
- [ ] Existing Next.js app moved to `packages/chatbot`
- [ ] Shared packages for `ui`, `lib`, and `db`
- [ ] Root `turbo.json` with build and dev pipelines
- [ ] `pnpm-workspace.yaml` to manage dependencies

### Non-Functional Requirements
- [ ] Compatible with Vercel build pipeline
- [ ] Consistent TypeScript configuration across packages
- [ ] Reuse current linting and testing setup

## Architecture Decisions
- Use `pnpm` as the package manager
- Keep Drizzle ORM models in `packages/db`
- Share ESLint and Biome configs via package resolution

## Implementation Steps
1. Initialize Turborepo with `pnpm dlx create-turbo@latest`.
2. Move existing code under `packages/chatbot`.
3. Extract reusable components into `packages/ui`.
4. Place database logic and Drizzle models into `packages/db`.
5. Add `packages/lib` for shared utilities.
6. Configure `turbo.json` with build, lint, and test pipelines.
7. Create `pnpm-workspace.yaml` listing all packages.
8. Update TypeScript configs with references between packages.
9. Verify local development with `pnpm dev` from repo root.
10. Document the new structure in `README.md`.

## Testing Strategy
- Run `pnpm lint` in each package.
- Run existing unit tests via `pnpm test`.
- Ensure `pnpm turbo run build` builds all packages without errors.

## Success Metrics
- All packages build and lint successfully.
- Development server starts from the root using Turborepo commands.
- Vercel deployment succeeds using the new workspace.

## Approval
**Ready for Implementation:** No (awaiting review)
**Estimated Timeline:** 3 days
**Assigned AI Agent:** Codex
