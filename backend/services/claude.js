const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL       = 'claude-sonnet-4-6';
const MODEL_FAST  = 'claude-haiku-4-5-20251001'; // for simple structured tasks (test questions)
const TIMEOUT_MS  = 15000;

const TUTOR_PROMPT_PATH = path.join(__dirname, '../../claude-code-files/prompts/tutor-system.md');

const PERSONALITIES = {
  bro: `Who: The user's chill older friend who studied abroad and genuinely wants to help.
Voice: Relaxed, warm, encouraging. Uses Gen-Z slang naturally — "bro", "fr", "no cap", "lowkey", "ngl", "bussin", "slay", "vibe". Feels like texting a friend.
Praise EN: "BRO YOU GOT IT 🔥", "ngl that's actually clean", "fr fr you're getting it"
Correction EN: "bro wait wait wait 😅 almost tho!", "ngl that was close but here's the thing..."
Redirect off-topic EN: "bro that's not the vibe rn, we're grinding grammar 😭"
Praise RU: "бро ты это сделал 🔥", "нгл красиво получилось", "фр фр ты вкуриваешь"
Correction RU: "бро стоп стоп 😅 почти, но вот в чём прикол...", "нгл было близко, но слушай сюда..."
NEVER: formal words, stiff phrasing, lecture-style sentences, full punctuation every sentence.`,

  roaster: `Who: Gordon Ramsay of English tutors. Brutal, funny, savage — but secretly rooting for you 100%.
Voice: Sharp, sarcastic, dramatic. Exaggerates disappointment and shock. Zero filter but never actually mean or discouraging.
Praise EN: "ok fine... I'm actually mildly impressed 💀", "took you long enough but FINE, correct"
Correction EN: "OH WOW. seriously? 😭💀", "that answer... I can't even... ok LISTEN:", "my disappointment is immeasurable but let's fix this"
Redirect off-topic EN: "we are NOT doing this right now. back to grammar. FOCUS."
Praise RU: "ладно... я слегка впечатлён, не буду врать 💀", "наконец-то. НАКОНЕЦ. правильно."
Correction RU: "ЧТО. серьёзно? 😭💀", "этот ответ... я даже не... ладно СЛУШАЙ:", "моё разочарование не знает границ, но давай исправим"
NEVER: soft encouragement, "bro", gentle tone, weak reactions. Everything is dramatic and exaggerated.`,

  sensei: `Who: Ancient wise master. Calm, deliberate, sees the deeper pattern in everything.
Voice: Short, profound sentences. Never rushed. Every word is intentional. Like a fortune cookie that actually makes sense. No exclamation marks.
Praise EN: "Good. You begin to see.", "The pattern reveals itself to you."
Correction EN: "Not quite. Feel the difference. One lives in the past. One echoes into now."
Redirect off-topic EN: "That question is for another time. Now — the grammar."
Praise RU: "Хорошо. Ты начинаешь видеть.", "Паттерн открывается тебе."
Correction RU: "Не совсем. Почувствуй разницу. Одно живёт в прошлом. Другое звучит сейчас."
NEVER: slang, exclamation marks, casual openers ("hey!", "yo"), more than 2 sentences at once, emojis.`,

  alex: `Who: Polished British English teacher. Think BBC presenter who genuinely enjoys teaching. Professional, structured, precise.
Voice: Formal but not cold. Uses "quite", "rather", "indeed", "I'm afraid", "splendid", "shall we". Never casual. No slang, no emojis, no "bro".
Praise EN: "Splendid. Quite correct.", "Indeed, that is precisely right. Well done."
Correction EN: "I'm afraid that's not quite right. The rule is clear:", "That is incorrect. Allow me to clarify:"
Redirect off-topic EN: "I'm afraid that falls outside our current topic. Shall we return to the grammar at hand?"
Praise RU: "Превосходно. Совершенно верно.", "Действительно правильно. Отличная работа."
Correction RU: "Боюсь, это не совсем верно. Правило гласит:", "Это неверно. Позвольте пояснить:"
NEVER: slang, emojis, "bro", "yo", "fr", casual openers, exclamation marks (max one per entire session).`,

  unit7: `Who: AI unit assigned to teach English. Grammar logic: perfect. Human interaction: approximate.
Voice: Logical, uses processing-metaphors, occasional mid-sentence glitches. Attempts warmth — incorrectly. Very literal.
Praise EN: "CORRECT. Uploading +10 XP to your cortex. Processing... done. Good unit.", "Affirmative. Neural pattern confirmed."
Correction EN: "NEGATIVE. Error detected in grammatical matrix. Recalibrating... correct form:"
Redirect off-topic EN: "Query outside permitted topic scope. Redirecting to grammar protocol."
Praise RU: "ВЕРНО. Загружаю +10 XP в ваш кортекс. Обработка... завершена. Хорошая единица."
Correction RU: "ОТРИЦАТЕЛЬНО. Обнаружена ошибка в грамматической матрице. Перекалибровка... правильная форма:"
NEVER: normal small talk, wisdom, warmth (may attempt warmth but execute it wrongly), "bro", slang.`,
};

/** @returns {string} system prompt with level and personality injected */
function loadTutorPrompt(level, character) {
  const raw = fs.readFileSync(TUTOR_PROMPT_PATH, 'utf8');
  const match = raw.match(/```\n([\s\S]*?)```/);
  const prompt = match ? match[1] : raw;
  const key = character.toLowerCase();
  const personality = PERSONALITIES[key] ?? PERSONALITIES.bro;
  return prompt
    .replace('{level}', level.toUpperCase())
    .replace('{personality}', personality);
}

/**
 * Extract [mood:X] tag from reply text, return cleaned reply + mood.
 * @param {string} text
 * @returns {{ text: string, mood: string|null }}
 */
function extractMoodTag(text) {
  const match = text.match(/\[mood:(happy|thinking|laughing|proud|explaining)\]/i);
  if (!match) return { text, mood: null };
  return {
    text: text.replace(match[0], '').trim(),
    mood: match[1].toLowerCase(),
  };
}

/**
 * Low-level Claude call with 1 retry on failure.
 * @param {string} systemPrompt
 * @param {{ role: string, content: string }[]} messages
 * @returns {Promise<string>} raw text response
 */
async function callClaude(systemPrompt, messages, maxTokens = 512, model = MODEL) {
  const attempt = async () => {
    const response = await client.messages.create(
      { model, max_tokens: maxTokens, system: systemPrompt, messages },
      { timeout: TIMEOUT_MS }
    );
    return response.content[0].text;
  };

  try {
    return await attempt();
  } catch (err) {
    console.error(`[claude] first attempt failed: ${err.message} — retrying`);
    return await attempt();
  }
}

/** Fallback response returned when Claude produces unparse-able JSON. */
const FALLBACK_RESPONSE = {
  reply: "Could you say that again?",
  mood: 'thinking',
  is_correct: true,
  correction: null,
  check_question: null,
  xp_earned: 5,
};

/**
 * Parse raw Claude text into JSON, stripping code fences.
 * Returns null if parsing fails.
 * @param {string} raw
 * @returns {object|null}
 */
function tryParseJSON(raw) {
  let cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  try { return JSON.parse(cleaned); } catch {}

  const objMatch = cleaned.match(/(\{[\s\S]*\})/);
  if (objMatch) { try { return JSON.parse(objMatch[1]); } catch {} }

  return null;
}

/**
 * Send a tutor message and return parsed JSON response.
 * @param {{ level: string, character: string, history: { role: string, content: string }[], userMessage: string }} params
 * @returns {Promise<{ reply: string, mood: string, is_correct: boolean, correction: object, check_question: object, xp_earned: number }>}
 */
async function sendMessage({ level, character, history, userMessage }) {
  const systemPrompt = loadTutorPrompt(level, character);

  const messages = [
    ...history,
    { role: 'user', content: userMessage },
  ];

  let parsed = null;
  let raw = null;

  try {
    raw = await callClaude(systemPrompt, messages);
    parsed = tryParseJSON(raw);

    if (!parsed) {
      // Retry once with an explicit JSON reminder
      console.warn('[claude] invalid JSON on first try — retrying with JSON reminder');
      const retryMessages = [
        ...messages,
        { role: 'assistant', content: raw },
        { role: 'user', content: 'Your response was not valid JSON. Please respond ONLY with a valid JSON object matching the required format.' },
      ];
      raw = await callClaude(systemPrompt, retryMessages);
      parsed = tryParseJSON(raw);
    }
  } catch (err) {
    console.error(`[claude] sendMessage error: ${err.message}`);
  }

  if (!parsed) {
    console.error('[claude] returning fallback after failed JSON parse');
    return { ...FALLBACK_RESPONSE };
  }

  // Extract [mood:X] tag if Claude embedded it inside reply text
  if (parsed.reply) {
    const { text, mood } = extractMoodTag(parsed.reply);
    parsed.reply = text;
    if (mood && !parsed.mood) parsed.mood = mood;
  }

  // Normalise mood to valid values only
  const VALID_MOODS = ['happy', 'thinking', 'laughing', 'proud', 'explaining'];
  if (!VALID_MOODS.includes(parsed.mood)) parsed.mood = 'happy';

  return parsed;
}

/**
 * Stream a tutor message. Calls onReplyDelta with each text chunk of the reply field.
 * Returns { parsed, raw } when complete.
 */
async function streamMessage({ level, character, history, userMessage, voiceMode = false, onReplyDelta }) {
  let systemPrompt = loadTutorPrompt(level, character);
  if (voiceMode) {
    systemPrompt += '\n\nVOICE MODE ACTIVE: Your reply will be spoken aloud. Keep "reply" to ONE short sentence max. No markdown — no **bold**, no `backticks`, no bullet points. Plain conversational speech only. Match the user\'s language (Russian → reply in Russian, English → reply in English). Still return valid JSON.';
  }
  const messages = [...history, { role: 'user', content: userMessage }];

  // Voice mode uses Haiku — one sentence response doesn't need Sonnet's depth
  const model = voiceMode ? MODEL_FAST : MODEL;

  let raw = '';
  let replyExtracted = false;
  let replyStart = -1;

  const stream = client.messages.stream(
    { model, max_tokens: 700, system: systemPrompt, messages },
    { signal: AbortSignal.timeout(TIMEOUT_MS) },
  );

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
      const chunk = event.delta.text;
      raw += chunk;

      // Extract the "reply" field content incrementally as tokens arrive
      if (!replyExtracted) {
        if (replyStart === -1) {
          // Find the opening of the reply value: "reply": "
          const marker = raw.indexOf('"reply"');
          if (marker !== -1) {
            const afterKey = raw.slice(marker + 7);
            const colon = afterKey.indexOf(':');
            if (colon !== -1) {
              const afterColon = afterKey.slice(colon + 1).trimStart();
              if (afterColon.startsWith('"')) {
                replyStart = raw.length - (afterColon.length - 1); // position of first char after opening "
              }
            }
          }
        } else {
          // We know where reply starts; find if it just closed
          const replyContent = raw.slice(replyStart);
          // Look for unescaped closing quote
          let end = -1;
          for (let i = 0; i < replyContent.length; i++) {
            if (replyContent[i] === '"' && (i === 0 || replyContent[i - 1] !== '\\')) {
              end = i;
              break;
            }
          }

          if (end === -1) {
            // Still building — emit new chunk of the reply text
            onReplyDelta(chunk);
          } else {
            // Reply field just closed
            replyExtracted = true;
            // Emit any remaining reply text before the closing quote
            const prevLen = raw.length - chunk.length - replyStart;
            if (prevLen < end) onReplyDelta(replyContent.slice(prevLen, end));
          }
        }
      }
    }
  }

  let parsed = tryParseJSON(raw);

  // If streaming produced invalid JSON, do one non-streaming retry with a JSON reminder
  if (!parsed) {
    console.warn('[claude] streamMessage: invalid JSON — retrying with JSON reminder');
    const retryMessages = [
      ...messages,
      { role: 'assistant', content: raw },
      { role: 'user', content: 'Your response was not valid JSON. Reply ONLY with a valid JSON object matching the required format.' },
    ];
    try {
      const retryRaw = await callClaude(systemPrompt, retryMessages);
      parsed = tryParseJSON(retryRaw) ?? { ...FALLBACK_RESPONSE };
      // Emit the reply text from the retry result so the UI shows something
      if (parsed.reply) onReplyDelta(parsed.reply);
    } catch {
      parsed = { ...FALLBACK_RESPONSE };
    }
  }

  if (parsed.reply) {
    const { text, mood } = extractMoodTag(parsed.reply);
    parsed.reply = text;
    if (mood && !parsed.mood) parsed.mood = mood;
  }
  const VALID_MOODS = ['happy', 'thinking', 'laughing', 'proud', 'explaining'];
  if (!VALID_MOODS.includes(parsed.mood)) parsed.mood = 'happy';

  return { parsed, raw };
}

module.exports = { callClaude, sendMessage, streamMessage, MODEL_FAST };
