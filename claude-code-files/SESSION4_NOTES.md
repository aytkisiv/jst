# SESSION 4 — Полный отчёт по проекту
_Дата: 25 мая 2026_

---

## Стек

**Frontend:** React + Vite + Tailwind + Framer Motion + Zustand  
**Backend:** Node.js + Express + PostgreSQL  
**AI:** Claude Haiku (`claude-haiku-4-5-20251001`) — быстрый, дешёвый  
**Voice STT:** ElevenLabs `scribe_v1`  
**Voice TTS:** ElevenLabs `eleven_turbo_v2_5` — быстрее multilingual_v2 в 2-3x  
**Deploy:** Nginx + PM2 на VPS `144.172.104.248`, HTTPS (self-signed cert)  
**GitHub:** https://github.com/aytkisiv/jst (приватный)  

---

## Сервер

```bash
pm2 restart jst-backend --update-env   # рестарт бэкенда
pm2 logs jst-backend --lines 30        # логи

cd /root/JST/frontend && npm run build  # сборка фронта
# dist/ раздаётся nginx напрямую — деплой = пересборка

nginx root: /root/JST/frontend/dist
backend port: 3000
ecosystem: /root/JST/ecosystem.config.js
backend .env: /root/JST/backend/.env
```

---

## Структура проекта

```
/root/JST/
├── frontend/src/
│   ├── components/
│   │   ├── TutorChat.jsx       — основной чат
│   │   ├── VoiceOverlay.jsx    — войс режим (стейт машина)
│   │   ├── CharacterSelect.jsx
│   │   ├── LevelTest.jsx
│   │   ├── GrammarCard.jsx     — карточка исправления ошибки
│   │   └── TopicMap.jsx
│   ├── hooks/
│   │   ├── useVoice.js         — STT + TTS + VAD логика
│   │   ├── useTutor.js         — Claude стриминг, история сообщений
│   │   └── useLevelTest.js
│   ├── store/gameStore.js      — Zustand: character, level, xp, mood
│   └── utils/renderMd.jsx      — markdown рендер для чата и войса
├── backend/
│   ├── routes/
│   │   ├── chat.js             — POST /api/chat/stream (SSE)
│   │   ├── voice.js            — POST /api/voice/tts, /api/voice/stt
│   │   └── test.js             — уровневый тест
│   └── services/
│       ├── claude.js           — Claude API, промпты, стриминг
│       └── elevenlabs.js       — TTS сервис, cleanForTTS()
└── claude-code-files/
    └── prompts/
        ├── tutor-system.md     — системный промпт туторa
        └── level-test.md       — промпт для теста уровня
```

---

## Персонажи и голоса ElevenLabs

| Персонаж | Voice ID | Голос | Описание |
|---|---|---|---|
| Bro | `TX3LPaxmHKxFdv7VOQHJ` | Liam | Young, casual, American |
| Roaster | `SOYHLrjzK2X1ezoPC6cr` | Harry | Fierce, young, rough |
| Sensei | `cjVigY5qzO86Huf0OWal` | Eric | Smooth, trustworthy |
| Alex | `onwK4e9ZLuTAKqWW03F9` | Daniel | British, formal |
| Unit-7 | `pNInz6obpgDQGcFmaJgB` | Adam | Dominant, robotic |

Голоса в `/root/JST/backend/routes/voice.js` в `VOICE_MAP`.

---

## Промпт система

Персонажи **НЕ хранятся в промпт файле** — они в `claude.js` как константы `PERSONALITIES{}`.  
В `tutor-system.md` есть плейсхолдер `{personality}` — заменяется при загрузке.  
Уровень — плейсхолдер `{level}` — A1/A2/B1/B2/C1.  
Промпт читается с диска при каждом запросе — **рестарт не нужен** после изменения промпта.

```js
// claude.js
function loadTutorPrompt(level, character) { ... }  // инджектит только одного персонажа
```

**VOICE MODE:** когда `voice_mode: true` — к промпту добавляется:  
`"VOICE MODE: один короткий ответ, никакого markdown"`

---

## Войс система (useVoice.js)

### Полный цикл
```
Пользователь говорит
→ MediaRecorder (audio/webm;codecs=opus)
→ VAD (AnalyserNode) — SILENCE_RMS=10, SILENCE_MS=1500мс
→ blob > 1000 bytes → POST /api/voice/stt
→ ElevenLabs scribe_v1 → transcript
→ onSpeechEnd(text) → VoiceOverlay → onSend(text)
→ POST /api/chat/stream → Claude Haiku streaming
→ lastTutorMsg обновляется (только когда streaming=false!)
→ doSpeak(text) → POST /api/voice/tts
→ MediaSource streaming → audio.play() (первый чанк)
```

### Важные детали
- **КРИТИЧНО:** `lastTutorMsg` в TutorChat фильтрует `!m.streaming` — без этого войс получает пустой текст и не озвучивает
- `onSpeechEmpty` — если STT вернул пусто (шум), авто-перезапуск слушания (до 3 раз)
- `hasSpokenRef` — бот не говорит первым, ждёт пока пользователь скажет хоть что-то
- STT аннотации типа `(whooshing sound)` стрипаются на бэкенде regex'ом

### VoiceOverlay состояния
```
idle → listening → processing → speaking → listening → ...
           ↑ onSpeechEmpty (re-listen)
           ↑ interrupt (tap orb)
```

### TTS стриминг (новое в Session 4)
Вместо `await res.blob()` — MediaSource API:
- Начинает play() после первого чанка
- Fallback на blob если браузер не поддерживает MediaSource

---

## useTutor.js — важные детали

- История обрезается до **последних 12 сообщений** перед отправкой в Claude
- Туторное сообщение добавляется сразу с `content: ''` и `streaming: true`
- После `done` event — контент заполняется, `streaming: false`
- `sendMessage(text, { voiceMode: true })` — войс режим

---

## Что было исправлено в Session 4

1. **Войс не работал** — `doSpeak('')` вызывался на пустом контенте (streaming placeholder). Фикс: `lastTutorMsg` фильтрует `!m.streaming`
2. **STT возвращал "(whooshing sound)"** — бэкенд стрипает parenthetical аннотации ElevenLabs
3. **Зависал в speaking** — `doSpeak('')` → `if (!text) doListen()` guard
4. **onSpeechEmpty** — авто-перезапуск если ничего не услышал
5. **Персонажи смешивались** — раньше все 5 в промпте, Claude путался. Теперь только один инджектится
6. **Голоса:** Roaster → Harry (fierce), Sensei → Eric (smooth)
7. **Войс-промпт** — `voice_mode: true` даёт краткие ответы без markdown
8. **История обрезана** до 12 сообщений
9. **TTS стриминг** — MediaSource вместо blob

---

## Известные проблемы / TODO

### Мобилка / Safari (не сделано)
- iOS не поддерживает `audio/webm` → нужен fallback `audio/mp4`
- `audio.play()` на iOS нужна "разблокировка" при первом тапе
- Виртуальная клавиатура перекрывает input
- VAD: `AudioContext` нужен unlock gesture на iOS

### VAD (средний приоритет)
- SILENCE_MS=1500 — иногда обрывает фразу на паузе
- Нет минимального времени записи
- Push-to-talk как альтернативный режим

### Другое
- Fallback "Hmm, let me think about that" — появляется когда Claude отдаёт невалидный JSON, звучит странно в голосе
- Живой транскрипт во время записи (как WhatsApp)

---

## Git

```bash
git add -A
git commit -m "описание"
git push
# remote уже настроен на github.com/aytkisiv/jst
# credentials сохранены в ~/.git-credentials
```

---

## Ключи (в /root/JST/backend/.env)

- `ANTHROPIC_API_KEY` — Claude
- `ELEVENLABS_API_KEY` — TTS + STT (менялся, важно рестартить бэкенд после смены)
- `DATABASE_URL` — PostgreSQL
- `VOICE_BRO`, `VOICE_ROASTER` и т.д. — можно переопределить голоса через env
