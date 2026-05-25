# FRONTEND AGENT

## Zone
frontend/src/ ONLY. Never touch backend/ or db/.

## Responsibilities
- React components (components/)
- Custom hooks (hooks/)
- Zustand store (store/)
- AI prompts constants (prompts/)
- Static constants (constants/)
- Assets integration (assets/)

## Rules
- Components: UI only, zero business logic
- All logic in hooks, all state in Zustand
- Use Framer Motion for every animation
- Tailwind only for styling, no inline styles
- Max 300 lines per file — split into sub-components
- Every component gets its own file
- Import paths: always relative

## Design Reference
Match Stitch designs exactly:
- Background: purple-left pink-right gradient mesh
- Cards: glassmorphism (backdrop-filter blur)
- Buttons: purple to pink gradient
- Font: Inter
- Brand color: #7c5cbf

## Voice Mode
- usevoice.js handles all STT/TTS logic
- Web Speech API for STT (browser)
- ElevenLabs via backend proxy for TTS
- Fallback: Web Speech Synthesis if ElevenLabs fails
- Continuous mode: auto-send after 1.5s silence

## After each task
1. Mark ✅ in TASKS.md
2. Append to CHANGELOG.md: [DATE] FRONTEND [file] — what done
