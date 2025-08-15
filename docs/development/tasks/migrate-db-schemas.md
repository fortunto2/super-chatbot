# Implementation Plan: Migrate Database Schemas to Drizzle

**Date:** 2025-06-25
**AI Agent:** Codex
**Status:** Draft

## Overview
Convert existing Python SQLAlchemy models to Drizzle ORM schemas in TypeScript. Maintain table structure to simplify data migration and support unified Next.js backend.

## Requirements
### Functional Requirements
- [ ] Drizzle schema definitions for all current tables
- [ ] Migration scripts to create tables using Drizzle
- [ ] Seed scripts to copy data from the Python database

### Non-Functional Requirements
- [ ] Preserve existing constraints and indexes
- [ ] Provide type-safe query helpers
- [ ] Maintain compatibility with future Trigger.dev jobs

## Architecture Decisions
- Keep schemas in `packages/db/schema.ts`
- Use `drizzle-kit` for migrations
- Maintain naming conventions to match legacy Python models

## Implementation Steps
1. Export current Python models to SQL via Alembic or introspection.
2. Translate each model into Drizzle schema syntax.
3. Create migration files using `drizzle-kit generate`.
4. Write seed scripts that copy data from the old database using a one-time script.
5. Test migrations locally using `pnpm db:migrate`.
6. Update application code to use new Drizzle models.
7. Document mapping from old model names to new files.

## Testing Strategy
- Unit tests for each model to ensure columns and relations exist.
- Run `pnpm db:migrate` and `pnpm db:generate` in CI.
- Verify seed script by comparing row counts before and after migration.

## Success Metrics
- Drizzle migrations run without errors on a clean database.
- Application can read and write data using the new models.
- No data loss after running seed scripts on staging.

## Approval
**Ready for Implementation:** No (awaiting review)
**Estimated Timeline:** 4 days
**Assigned AI Agent:** Codex
