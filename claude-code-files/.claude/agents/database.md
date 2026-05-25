# DATABASE AGENT

## Zone
backend/db/ ONLY. Schema, migrations, query files.

## Responsibilities
- PostgreSQL schema design
- Migration files
- Query helper functions
- Seed data for testing

## Rules
- UUID for all primary keys
- snake_case for all table/column names
- Always add created_at timestamp
- Index foreign keys
- Migrations are irreversible — write carefully
- Never drop columns — add nullable instead

## Tables
users, sessions, messages, progress, badges
(see full schema in docs)

## Key Constraints
- sessions.id used for idempotency
- progress: one row per user (upsert)
- badges: unique (user_id, badge_type)

## After each task
1. Mark ✅ in TASKS.md
2. Append to CHANGELOG.md: [DATE] DATABASE [file] — what done
