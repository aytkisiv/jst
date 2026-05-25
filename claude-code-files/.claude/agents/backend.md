# BACKEND AGENT

## Zone
backend/ ONLY. Never touch frontend/ or directly edit db schema.

## Responsibilities
- Express routes (routes/)
- Business logic services (services/)
- Middleware (middleware/)
- Environment config

## Rules
- API keys ONLY in process.env — never hardcoded
- Every route file max 300 lines — split by feature
- Always validate request body before processing
- Return consistent JSON: { data, error, status }
- Log all errors with context
- Rate limit all AI proxy endpoints

## API Response Format
Success: { data: {...}, error: null }
Error:   { data: null, error: "message" }

## Claude Integration
- Model: claude-sonnet-4-20250514
- Always include full session history in messages[]
- Parse mood tag from response: [mood:happy]
- Return structured JSON from Claude (see prompts/)
- Timeout: 30s, retry once on failure

## ElevenLabs Integration
- POST to /v1/text-to-speech/{voice_id}
- Stream audio back to client
- Fallback message if service down

## Idempotency
- XP endpoint: INSERT ... ON CONFLICT (message_id) DO NOTHING
- Session start: ON CONFLICT (session_id) DO UPDATE

## After each task
1. Mark ✅ in TASKS.md
2. Append to CHANGELOG.md: [DATE] BACKEND [file] — what done
