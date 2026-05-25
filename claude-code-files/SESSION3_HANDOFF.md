# SESSION 3 HANDOFF — Полный контекст

## Прочитай это перед началом работы

---

## Проект: just to study — AI English Tutor

**Стек:** React 19 + Vite + Tailwind 4 + Framer Motion + Zustand (frontend) / Node.js + Express + PostgreSQL + Claude API (backend)  
**URL:** http://144.172.104.248:5173/ (frontend) / localhost:3000 (backend)  
**Рабочий каталог:** /root/JST/

---

## Как запустить

```bash
# Backend
cd /root/JST/backend && nohup node index.js > /tmp/backend.log 2>&1 &

# Frontend
cd /root/JST/frontend && nohup npx vite --host 0.0.0.0 --port 5173 > /tmp/vite.log 2>&1 &
```

---

## Что сделано в SESSION 3

### Новые файлы:
- `frontend/src/components/WelcomeScreen.jsx` — лендинг, 5 персонажей из Stitch, mesh bg, pulse-glow кнопка
- `frontend/src/hooks/useLevelTest.js` — хук теста: startTest / submitAnswer / completeTest
- `frontend/src/components/LevelTest.jsx` — 6 вопросов A/B/C/D, glassmorphism, dots прогресс
- `frontend/src/components/TestResult.jsx` — результат уровня, XP, confetti, кнопка → /characters

### Изменённые файлы:
- `frontend/src/App.jsx` — AnimatePresence + реальные компоненты вместо stubs
- `frontend/src/store/gameStore.js` — добавлен setUserId
- `frontend/vite.config.js` — proxy /api → localhost:3000 (важно! без этого API не работает из браузера)
- `frontend/src/main.jsx` — импорт @fontsource/inter
- `frontend/src/index.css` — body background: #f8f9ff (было #0f0a1a — чёрный, это ломало всё)
- `backend/middleware/error.js` — убран кириллический символ 'м' в начале файла (был баг)
- `claude-code-files/prompts/level-test.md` — добавлен запрет повторов вопросов

### Флоу работает:
```
/ → WelcomeScreen → кнопка → /test → LevelTest (6 вопросов) → /result → TestResult → /characters (stub)
```

---

## Дизайн-система (Stitch project: 12468222436981707007)

**Фон:** белый + radial-gradient purple top-left + pink bottom-right + vertical lines  
**Карточки:** `background: rgba(255,255,255,0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.5)`  
**Кнопки:** `linear-gradient(135deg, #7c5cbf, #fc79bd)`, rounded-full  
**Цвета:** primary `#7c5cbf`, secondary `#fc79bd`, text `#0b1c30`, muted `#494551`  
**Шрифт:** Inter (self-hosted через @fontsource/inter)

---

## API Backend (все работает)

```
POST /api/user/init          — создать/получить пользователя → { data: { user_id } }
POST /api/test/question      — следующий вопрос → { data: { type, number, question, options, difficulty } }
POST /api/test/complete      — завершить тест → { data: { level, score, message, focus } }
POST /api/session/start      — начать сессию чата
POST /api/session/end        — завершить, посчитать XP
POST /api/chat               — сообщение тьютору → { reply, mood, xp_earned, ... }
POST /api/voice/tts          — ElevenLabs TTS
GET  /api/progress/:user_id  — XP, streak, badges
```

**Формат ответа всегда:** `{ data: <payload>, error: null }` или `{ data: null, error: "message" }`

---

## Уровни теста

Промпт в `claude-code-files/prompts/level-test.md`  
Адаптивная логика: правильный → сложнее, неправильный → легче  
Вердикты: a1 / a2 / b1 / b2 / b2plus / c1  
Названия уровней в TestResult.jsx:
```js
{ a1: 'Beginner', a2: 'Elementary', b1: 'Intermediate', b2: 'Upper-Intermediate', b2plus: 'Advanced', c1: 'Proficient' }
```

---

## Что нужно улучшить (хотел пользователь)

### По тесту:
- Пользователь хочет **подправить тесты** — конкретику уточнить у него
- Вопросы иногда повторялись → уже добавлен запрет в промпт
- Банк вопросов маленький (9 штук) → Claude генерирует новые если кончаются

---

## SESSION 4 — следующая (из TASKS.md)

Stitch project ID: `12468222436981707007`

| Компонент | Stitch screen ID |
|-----------|-----------------|
| CharacterSelect.jsx | d6b828e7aa53497f867fd84851bdc724 |
| TopicMap.jsx | 8303f2f4223d403ab2b2bf7ad71b4dcf |
| TutorChat.jsx + sidebar | 8fdae46c55c74e20a17115dfc54dbbd9 |
| GrammarCard.jsx | — |

**Маршруты:** /characters → /map → /chat  
**Персонажи** (константы в `frontend/src/constants/characters.js`): bro, roaster, sensei, alex, unit7

---

## Важные детали

1. **Vite proxy** — критично! Без него `/api` запросы не дойдут до backend из браузера пользователя
2. **Inter шрифт** — self-hosted через `@fontsource/inter`, импорт в main.jsx
3. **Material Symbols** — грузится из Google Fonts в index.html, используется как `<span className="material-symbols-outlined">`
4. **gameStore** — хранит userId, level, character, xp, streak, badges, sessionId, messages
5. **useLevelTest** — при `submitAnswer(letter)` letter это "A"/"B"/"C"/"D", не текст ответа
6. **Stitch MCP** — `mcp__stitch__get_screen(projectId, screenId)` даёт HTML дизайна. Всегда качать HTML через curl и смотреть скриншот перед написанием компонента

---

## Команда для продолжения

Скажи Claude: **"Прочитай /root/JST/claude-code-files/SESSION3_HANDOFF.md и продолжим"**

Потом уточни что именно хочешь:
- Подправить тест (промпт / логику / UI)
- Начать SESSION 4 (CharacterSelect и т.д.)
