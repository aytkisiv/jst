# just to study — AI English Tutor

## Product
Voice + chat AI tutor teaching English. React frontend, Node.js backend.
VPS deployment. API keys server-side only, never in frontend.

## Workflow
1. Main session reads TASKS.md → writes tasks for agents
2. Each agent works only in its zone (see Agents section)
3. After task done → mark ✅ in TASKS.md + append to CHANGELOG.md
4. Completed tasks are removed from TASKS.md on next sprint

## Code Rules
- Max 300-400 lines per file. If longer → split immediately
- One component per file, one hook per file
- No business logic inside components — hooks only
- No API calls in components — hooks only
- No hardcoded strings — use constants/
- JSDoc on every exported function

## Naming
- Components: PascalCase → TutorChat.jsx
- Hooks: camelCase → useTutor.js
- Routes: kebab-case → /api/voice/tts
- DB: snake_case → user_progress

## Stack
Frontend: React + Vite, Tailwind, Framer Motion, Zustand
Backend: Node.js + Express, PostgreSQL
AI: claude-sonnet-4-20250514
Voice: ElevenLabs TTS + Web Speech API STT
Deploy: Nginx + PM2 on VPS

## Security
NEVER put keys in frontend. Use process.env only.
Required: ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, DATABASE_URL

## Structure
frontend/src/
  components/   UI only
  hooks/        all logic
  store/        Zustand
  prompts/      AI prompts as constants
  constants/    characters, badges, material
  assets/       images, animations

backend/
  routes/       one file per domain
  services/     Claude, ElevenLabs, XP
  middleware/   auth, rateLimit, error
  db/           schema, migrations, queries

## Agents
FRONTEND → components/, hooks/, store/, assets/ only
BACKEND  → routes/, services/, middleware/ only
DATABASE → db/, migrations/ only
REVIEW   → read-only, checks all zones after sprint
