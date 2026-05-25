# TASKS

## How this works
- Main session writes tasks here
- Each agent picks up tasks from their section
- Mark ✅ when done, add to CHANGELOG.md
- Completed tasks are cleaned up each sprint

---

## SESSION 5 — AI Integration (активная сессия)

> **Контекст для сессии:**
> Sessions 1-4 завершены. Весь UI и backend готовы.
> Claude сервис уже есть в `backend/services/claude.js` — доработай его.
> TutorChat.jsx и useTutor.js уже существуют — дорабатывай, не переписывай.
> **ВАЖНО:** НЕ трогай VoiceOverlay.jsx, useVoice.js, SessionRecap.jsx — это зона Session 6.
> Читай `CLAUDE.md`, `.claude/agents/backend.md`, `.claude/agents/frontend.md`.
> Рабочий каталог: `/root/JST/`

### Зоны
- **BACKEND** → `backend/services/claude.js`, `backend/routes/chat.js`, `backend/routes/test.js`
- **FRONTEND** → `frontend/src/hooks/useTutor.js`, `frontend/src/components/TutorChat.jsx`, `frontend/src/components/GrammarCard.jsx`

---

### BACKEND agent

- [x] Доработать `backend/services/claude.js` ✅
- [x] Доработать `backend/routes/test.js` → `POST /api/test/question` ✅
- [x] Проверить: `POST /api/chat` с реальным сообщением возвращает валидный JSON с mood и reply ✅

---

### FRONTEND agent

- [x] Доработать `frontend/src/hooks/useTutor.js` ✅
- [x] Добавить `mood` в `frontend/src/store/gameStore.js` ✅
- [x] Доработать `frontend/src/components/TutorChat.jsx` ✅
- [x] Проверить полный флоу: отправить сообщение → получить ответ с mood → XP начислился → GrammarCard показался при ошибке ✅

---

### REVIEW agent
- [x] Claude API реально вызывается (не mock) — проверено, возвращает реальный ответ ✅
- [x] XP не дублируется при повторном рендере — xp_earned только из последнего tutor msg ✅
- [x] Mood корректно парсится из всех 5 значений — extractMoodTag + JSON field + нормализация ✅
- [x] Записать findings в BLOCKED ✅ — ничего не заблокировано

---

## SESSION 6 — Voice + Gamification (активная сессия, параллельно с Session 5)

> **Контекст для сессии:**
> Sessions 1-4 завершены. Session 5 идёт параллельно.
> **ВАЖНО:** НЕ трогай TutorChat.jsx, useTutor.js, claude.js — это зона Session 5.
> Создавай только НОВЫЕ файлы: useVoice.js, VoiceOverlay.jsx, SessionRecap.jsx.
> В TutorChat.jsx добавить ТОЛЬКО одну строку — импорт и рендер VoiceOverlay (в конце файла).
> Stitch MCP подключён — используй `mcp__stitch__get_screen`.
> Project ID в Stitch: `12468222436981707007`
> Читай `CLAUDE.md`, `.claude/agents/frontend.md`.
> Рабочий каталог: `/root/JST/`

### Зона
- **FRONTEND** → только новые файлы: `frontend/src/hooks/useVoice.js`, `frontend/src/components/VoiceOverlay.jsx`, `frontend/src/components/SessionRecap.jsx`
- Минимальное изменение в `TutorChat.jsx` — только добавить кнопку микрофона и рендер VoiceOverlay

---

### FRONTEND agent

- [x] `frontend/src/hooks/useVoice.js` ✅
- [x] `frontend/src/components/VoiceOverlay.jsx` ✅ — pixel-perfect Stitch, кольца от края орба, conditional on isListening, orb pulse при isSpeaking
- [x] `frontend/src/components/SessionRecap.jsx` ✅ — полный редизайн: светлый лавандовый фон, белая карточка, stats row, XP bar, grammar review, character quote
- [x] Добавить в `frontend/src/App.jsx` роут `/recap` → SessionRecap ✅
- [x] Минимально доработать `TutorChat.jsx` — кнопка микрофона + VoiceOverlay ✅
- [x] Проверить: билд проходит без ошибок ✅

---

### REVIEW agent
- [x] Fallback работает когда ElevenLabs отключён ✅ — catch блок → window.speechSynthesis
- [x] Mic permission denied обрабатывается ✅ — onerror с event.error === 'not-allowed' логирует + setIsListening(false)
- [x] SessionRecap не вызывает session/end повторно при ре-рендере ✅ — calledRef guard
- [x] Записать findings в BLOCKED ✅ — ничего не заблокировано

---

## SESSION 7 — Deploy (активная сессия)

> **Контекст для сессии:**
> Sessions 1-6 завершены. Весь UI и backend готовы и работают.
> Домен: `jst.isstina.uk` → IP `144.172.104.248`
> Backend: порт `3000` (Node.js/Express)
> Frontend: нужно собрать через `npm run build` → статика в `frontend/dist/`
> .env уже есть в `backend/.env` — не трогай, не перезаписывай
> Рабочий каталог: `/root/JST/`
> Читай `CLAUDE.md`

---

### DEPLOY agent

#### 1. PM2
- [x] Установить PM2 глобально: `npm install -g pm2` ✅
- [x] Создать `/root/JST/ecosystem.config.js` ✅
- [x] Запустить: `pm2 start ecosystem.config.js` ✅
- [x] Сохранить автозапуск: `pm2 save && pm2 startup` ✅
- [x] Проверить: `pm2 status` — jst-backend `online` ✅

#### 2. Frontend build
- [x] `cd /root/JST/frontend && npm run build` ✅
- [x] `frontend/dist/index.html` существует ✅
- [x] `base: '/'` — дефолт Vite ✅

#### 3. Nginx
- [x] nginx уже установлен ✅
- [x] Создан `/etc/nginx/sites-available/jst` ✅
- [x] Включён сайт, default удалён ✅
- [x] `nginx -t` — OK ✅
- [x] `systemctl restart nginx` — active ✅

#### 4. Проверка
- [x] `curl http://jst.isstina.uk` возвращает HTML ✅
- [x] `curl http://jst.isstina.uk/api/health` → `{"status":"ok"}` ✅
- [x] Сайт доступен по http://jst.isstina.uk ✅

#### 5. Changelog
- [x] Записано в `CHANGELOG.md` ✅

---

## BACKLOG
- [ ] Trading card generation on recap
- [ ] Meme on grammar mistake
- [ ] Lip sync animation (Web Audio API)
- [ ] Character hover comments
- [ ] Level up screen

---

## BLOCKED
_nothing blocked_
