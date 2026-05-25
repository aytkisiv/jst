# CHANGELOG

## Format
[YYYY-MM-DD] [AGENT] [FILE/FEATURE] — description

## Log

[2026-05-24] SESSION6 [frontend/src/hooks/useVoice.js] — STT Web Speech API, auto-send на тишину 1.5s, TTS ElevenLabs + browser fallback
[2026-05-24] SESSION6 [frontend/src/components/VoiceOverlay.jsx] — pixel-perfect Stitch: тёмный overlay, pulsing rings от края орба (conditional isListening), orb pulse при isSpeaking, transcript card со sound wave bars, grammar check pill, End voice / Switch to text / Mute
[2026-05-24] SESSION6 [frontend/src/components/SessionRecap.jsx] — полный редизайн 1:1 Stitch: лавандовый bg, белая карточка, avatar floats above, stats row, XP bar, grammar review pairs, character quote, Continue learning / Back to map
[2026-05-24] SESSION6 [frontend/src/App.jsx] — роут /recap → SessionRecap добавлен
[2026-05-24] SESSION6 [frontend/src/components/TutorChat.jsx] — кнопка микрофона + isVoiceOpen state → VoiceOverlay

[2026-05-24] SETUP [.gitignore] — git init + .gitignore (node_modules, .env, dist, __pycache__, *.log)

[2026-05-24] DATABASE [backend/db/schema.sql] — таблицы users, sessions, messages, progress, badges, xp_events; индексы на все FK
[2026-05-24] DATABASE [backend/db/migrations/001_init.sql] — идемпотентная миграция с IF NOT EXISTS
[2026-05-24] DATABASE [backend/db/seed.sql] — тестовый пользователь UUID 000...001, сессия UUID 000...010
[2026-05-24] DATABASE [backend/db/queries.js] — getUser, createUser, createSession, addMessage, getProgress, upsertProgress, addBadge, checkBadge, addXP (idempotent via xp_events)

[2026-05-24] BACKEND [backend/package.json] — express, pg, dotenv, cors, express-rate-limit, uuid
[2026-05-24] BACKEND [backend/config/env.js] — валидация env при старте, бросает Error если нет ANTHROPIC_API_KEY/ELEVENLABS_API_KEY/DATABASE_URL
[2026-05-24] BACKEND [backend/.env.example] — шаблон переменных окружения
[2026-05-24] BACKEND [backend/middleware/error.js] — централизованный error handler { data: null, error: "message" }
[2026-05-24] BACKEND [backend/middleware/rateLimit.js] — aiRateLimit: 60 req/min для AI эндпоинтов
[2026-05-24] BACKEND [backend/index.js] — Express app, GET /health, порт из env; проверка запуска ✅

[2026-05-24] FRONTEND [frontend/] — React + Vite scaffold (npm create vite --template react)
[2026-05-24] FRONTEND [frontend/vite.config.js] — добавлен плагин @tailwindcss/vite
[2026-05-24] FRONTEND [frontend/src/index.css] — @import "tailwindcss", базовые стили
[2026-05-24] FRONTEND [frontend/src/store/gameStore.js] — Zustand store: userId, level, character, xp, streak, badges, sessionId, messages + actions
[2026-05-24] FRONTEND [frontend/src/constants/characters.js] — 5 персонажей: bro, roaster, sensei, alex, unit7
[2026-05-24] FRONTEND [frontend/src/constants/badges.js] — FIRST_LESSON, STREAK_3, XP_100, PERFECT_TEST
[2026-05-24] FRONTEND [frontend/src/App.jsx] — React Router v6, заглушки 7 роутов: /, /test, /result, /characters, /map, /chat, /recap; проверка запуска ✅

[2026-05-24] REVIEW — нет API ключей в frontend/src/; все файлы ≤ 180 строк; структура соответствует CLAUDE.md; BLOCKED пуст

[2026-05-24] BACKEND [backend/routes/user.js] — POST /api/user/init (create/get user by UUID)
[2026-05-24] BACKEND [backend/routes/test.js] — POST /api/test/question, POST /api/test/complete (adaptive logic)
[2026-05-24] BACKEND [backend/routes/session.js] — POST /api/session/start, POST /api/session/end
[2026-05-24] BACKEND [backend/routes/chat.js] — POST /api/chat (Claude proxy, парсинг JSON ответа)
[2026-05-24] BACKEND [backend/routes/voice.js] — POST /api/voice/tts (ElevenLabs стриминг, rate limit 30/min)
[2026-05-24] BACKEND [backend/routes/progress.js] — GET /api/progress/:user_id, POST /api/progress/xp, POST /api/badges/check
[2026-05-24] BACKEND [backend/services/claude.js] — sendMessage(), модель claude-sonnet-4-20250514, system prompt из tutor-system.md, timeout 30s + retry
[2026-05-24] BACKEND [backend/services/elevenlabs.js] — textToSpeech(), fallback при недоступности
[2026-05-24] BACKEND [backend/services/xp.js] — awardXP() idempotent via xp_events, checkBadges()
[2026-05-24] SETUP [backend/.env] — DATABASE_URL настроен, ANTHROPIC_API_KEY добавлен
[2026-05-24] SETUP [postgresql] — база justtostudy создана, миграция 001_init.sql применена
[2026-05-24] REVIEW — нет API ключей в коде; все файлы ≤ 400 строк; /api/user/init возвращает {data:{user_id}} ✅

[2026-05-24] SESSION 5 — AI Integration
[2026-05-24] BACKEND [backend/services/claude.js] — extractMoodTag() парсит [mood:X] из reply; tryParseJSON + retry на невалидный JSON; FALLBACK_RESPONSE заглушка; нормализация 5 mood значений
[2026-05-24] BACKEND [backend/routes/test.js] — /api/test/question полностью переписан: адаптивная сложность (nextDifficulty), adaptiveQuestionPrompt(), verdict после 6 вопросов; убран undefined loadLevelTestPrompt()
[2026-05-24] FRONTEND [frontend/src/store/gameStore.js] — добавлен mood:'happy' + setMood(mood) + reset включает mood
[2026-05-24] FRONTEND [frontend/src/hooks/useTutor.js] — исправлен парсинг ответа (json.data ?? {}); setMood() после каждого ответа; POST /api/badges/check с user_id; POST /api/progress/xp с user_id+message_id
[2026-05-24] FRONTEND [frontend/src/components/TutorChat.jsx] — MOOD_COLORS (5 цветов); аватар border+glow анимируется по mood; XP popup +N XP с Framer Motion анимацией (opacity/scale/y)

[2026-05-24] SESSION5-BACKEND [backend/services/claude.js] — extractMoodTag ([mood:X] из reply), JSON retry на невалидный ответ, fallback stub, нормализация mood к 5 значениям
[2026-05-24] SESSION5-BACKEND [backend/routes/test.js] — исправлен POST /api/test/question (вызывал несуществующий loadLevelTestPrompt); адаптивная логика: correct→harder, wrong→easier; после 6 ответов → verdict; tryParseJSON во всех роутах
[2026-05-24] SESSION5-FRONTEND [frontend/src/store/gameStore.js] — добавлены поле mood (default 'happy') и action setMood; mood сбрасывается в reset()
[2026-05-24] SESSION5-FRONTEND [frontend/src/hooks/useTutor.js] — исправлен баг: data.data вместо data при unwrap ответа; setMood из store; POST /api/badges/check после XP update; userId в XP/badges запросах
[2026-05-24] SESSION5-FRONTEND [frontend/src/components/TutorChat.jsx] — MOOD_COLORS map; avatar border + glow анимируются по mood; XP popup (+N XP float animation 1.5s); убран hardcoded +10 XP

[2026-05-24] SESSION5-FIX [frontend/src/App.jsx] — добавлен UserInit: POST /api/user/init при запуске, userId сохраняется в localStorage и Zustand
[2026-05-24] SESSION5-FIX [frontend/src/components/TopicMap.jsx] — session/start теперь передаёт user_id; исправлен парсинг session_id из json.data
[2026-05-24] SESSION5-FIX [frontend/src/hooks/useTutor.js] — начальное приветствие через sendMessage при первом sessionId; history role mapped tutor→assistant
[2026-05-24] SESSION5-FIX [frontend/src/components/TutorChat.jsx] — lastTutorMsg из локального state передаётся в VoiceOverlay как prop
[2026-05-24] SESSION5-FIX [frontend/src/components/VoiceOverlay.jsx] — принимает lastTutorMsg как prop вместо пустого useGameStore.messages
[2026-05-24] SESSION5-FIX [frontend/src/hooks/useVoice.js] — API_BASE = '' (относительный URL), TTS запросы идут через Vite proxy

[2026-05-25] SESSION 7 — Deploy
[2026-05-25] DEPLOY [ecosystem.config.js] — создан PM2 ecosystem конфиг; backend запущен как jst-backend; автозапуск через pm2 startup (systemd)
[2026-05-25] DEPLOY [backend/index.js] — dotenv.config() теперь явно указывает путь __dirname/.env (fix для запуска из нестандартного CWD); добавлен /api/health endpoint
[2026-05-25] DEPLOY [frontend/dist/] — production build через vite (458 модулей, gzip ~140KB JS)
[2026-05-25] DEPLOY [/etc/nginx/sites-available/jst] — nginx: SPA fallback + /api/ proxy_pass на 127.0.0.1:3000; default site удалён
[2026-05-25] RESULT — http://jst.isstina.uk возвращает HTML; http://jst.isstina.uk/api/health → {"status":"ok"}
