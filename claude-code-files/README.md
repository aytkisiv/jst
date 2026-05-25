# just to study — AI English Tutor

AI-powered English tutor with voice conversation, gamification, and personalized learning.

## What it does
- Determines user's English level (CEFR A1-C1) via adaptive test
- Connects user with an AI tutor character (Bro, Roaster, Sensei, Alex, Unit-7)
- Teaches Present Perfect vs Past Simple through real voice/chat conversation
- Adapts explanations to user level in real time
- Gamifies learning: XP, streaks, badges, topic map

## Material
**Murphy's "English Grammar in Use", Units 7-8**
Topic: Present Perfect vs Past Simple
Chosen because: classic pain point for Russian speakers, rich enough for demo, compact for system prompt.

## Stack
- **Frontend:** React + Vite, Tailwind CSS, Framer Motion, Zustand
- **Backend:** Node.js + Express, PostgreSQL
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Voice:** ElevenLabs TTS + Web Speech API STT
- **Deploy:** Nginx + PM2 on VPS

## Key decisions
- **Voice-first:** Web Speech API (STT) + ElevenLabs (TTS) for natural conversation
- **Continuous mode:** auto-send after 1.5s silence, supports 10-20 min sessions
- **Level adaptation:** 5 CEFR levels, tutor adjusts depth/length/humor per level
- **Mood tags:** Claude returns `[mood:happy]` → avatar state switches in real time
- **Idempotency:** XP uses `ON CONFLICT DO NOTHING` to prevent double-counting
- **API security:** all keys server-side only, never in frontend

## Setup
```bash
# Clone
git clone https://github.com/yourusername/just-to-study
cd just-to-study

# Backend
cd backend
cp .env.example .env
# Fill in: ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, DATABASE_URL
npm install
npm run migrate
npm start

# Frontend
cd ../frontend
npm install
npm run dev
```

## What I'd add with more time
- RAG system for multiple textbook chapters
- Real-time lip sync animation (Web Audio API)
- Trading card generation on session end
- User accounts + persistent progress across devices
- More topics beyond Present Perfect
- Mobile app (React Native)

## Built with
Claude Code (AI coding agent), Google Stitch (UI design),
Nano Banana (character illustrations), Kling (character animations)
