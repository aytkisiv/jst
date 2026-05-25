const { Router } = require('express');
const fs = require('fs');
const path = require('path');
const { callClaude, MODEL_FAST } = require('../services/claude');
const db = require('../db/queries');
const { aiRateLimit } = require('../middleware/rateLimit');

const router = Router();

const LEVEL_TEST_PATH = path.join(__dirname, '../../claude-code-files/prompts/level-test.md');

function extractPrompt(tag) {
  const raw = fs.readFileSync(LEVEL_TEST_PATH, 'utf8');
  const re = new RegExp('```' + tag + '\\n([\\s\\S]*?)```');
  const match = raw.match(re);
  return match ? match[1] : raw;
}

function loadBulkQuestionsPrompt() { return extractPrompt('bulk-questions'); }

/** System prompt for adaptive single-question generation. */
function adaptiveQuestionPrompt(difficulty) {
  return `You are an English grammar question generator.
Generate exactly ONE question at difficulty level: ${difficulty.toUpperCase()}.
Respond ONLY with a JSON object. No extra text, no markdown fences.

DIFFICULTY DEFINITIONS:
- easy: basic tenses (past simple, present simple, present continuous)
- medium: present perfect, past perfect, conditionals type 1-2, modals
- hard: complex conditionals type 2-3, passive voice, future perfect, mixed tenses

RETURN FORMAT:
{
  "type": "question",
  "question": "Fill in the blank / Choose the correct sentence / etc.",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correct": "A|B|C|D",
  "difficulty": "${difficulty}"
}

RULES:
- Exactly ONE clearly correct answer
- All 4 options must be plausible distractors
- Question text must start with: Fill in the blank: / Choose the correct sentence: / Spot the error: / Word choice: / Complete the sentence:
- Never repeat a question that appeared in the conversation history`;
}

/**
 * Determine next difficulty based on previous answers.
 * Adapts up on correct, down on incorrect.
 * @param {{ selected: string, correct?: string, difficulty?: string }[]} previousAnswers
 * @returns {'easy'|'medium'|'hard'}
 */
function nextDifficulty(previousAnswers) {
  const LEVELS = ['easy', 'medium', 'hard'];
  if (previousAnswers.length === 0) return 'medium';

  const last = previousAnswers[previousAnswers.length - 1];
  const wasCorrect = last.selected === last.correct;
  const currentIdx = LEVELS.indexOf(last.difficulty ?? 'medium');

  if (wasCorrect) return LEVELS[Math.min(currentIdx + 1, 2)];
  return LEVELS[Math.max(currentIdx - 1, 0)];
}

/**
 * Build conversation history for adaptive question endpoint.
 * @param {{ number: number, question: string, options: string[], difficulty: string, selected: string }[]} previousAnswers
 * @returns {{ role: string, content: string }[]}
 */
function buildHistory(previousAnswers) {
  const messages = [{ role: 'user', content: 'Begin English level assessment.' }];

  for (const entry of previousAnswers) {
    messages.push({
      role: 'assistant',
      content: JSON.stringify({
        type: 'question',
        number: entry.number,
        question: entry.question,
        options: entry.options,
        difficulty: entry.difficulty ?? 'medium',
      }),
    });
    messages.push({ role: 'user', content: `My answer: ${entry.selected}` });
  }

  if (previousAnswers.length > 0) {
    const alreadyAsked = previousAnswers
      .map((a, i) => `Q${i + 1}: "${a.question}"`)
      .join('\n');
    const lastIdx = messages.length - 1;
    messages[lastIdx].content +=
      `\n\nALREADY ASKED — DO NOT REPEAT:\n${alreadyAsked}`;
  }

  return messages;
}

const VERDICT_MESSAGES = {
  a1:     'Ты только начинаешь — и это отлично! Начнём с самого начала.',
  a2:     'Базу знаешь, но правила ещё расплывчатые. Разберёмся вместе.',
  b1:     'Понимаешь суть, но иногда путаешь времена. Отточим детали.',
  b2:     'Крепкая база! Осталось поработать над нюансами.',
  b2plus: 'Очень сильно! Займёмся сложными случаями.',
  c1:     'Впечатляет — ты реально знаешь язык. Углубимся в тонкости.',
};

/**
 * Compute level verdict from answers without calling Claude.
 * @param {{ difficulty: string, selected: string, correct: string }[]} answers
 * @returns {{ score: number, level: string, message: string, focus: string }}
 */
function scoreVerdict(answers) {
  const score = answers.filter((a) => a.selected === a.correct).length;
  const hardCorrect   = answers.filter((a) => a.difficulty === 'hard'   && a.selected === a.correct).length;
  const mediumCorrect = answers.filter((a) => a.difficulty === 'medium' && a.selected === a.correct).length;
  const easyCorrect   = answers.filter((a) => a.difficulty === 'easy'   && a.selected === a.correct).length;

  let level;
  if (score <= 1 && easyCorrect === 0)         level = 'a1';
  else if (score <= 2 && hardCorrect === 0 && mediumCorrect <= 1) level = 'a2';
  else if (score <= 3 || (score <= 4 && hardCorrect === 0))       level = 'b1';
  else if (score === 4 && hardCorrect <= 1)    level = 'b2';
  else if (score === 5 && hardCorrect <= 1)    level = 'b2';
  else if (score === 5 && hardCorrect >= 2)    level = 'b2plus';
  else                                          level = 'c1';

  const wrongTopics = answers
    .filter((a) => a.selected !== a.correct)
    .map((a) => a.difficulty)
    .join(', ');

  return {
    score,
    level,
    message: VERDICT_MESSAGES[level],
    focus: wrongTopics || 'Keep practising all tenses',
  };
}

function tryParseJSON(raw) {
  // Strip code fences
  let cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  try { return JSON.parse(cleaned); } catch {}

  // Try to extract a JSON array [...] or object {...} from anywhere in the text
  const arrayMatch = cleaned.match(/(\[[\s\S]*\])/);
  if (arrayMatch) { try { return JSON.parse(arrayMatch[1]); } catch {} }

  const objMatch = cleaned.match(/(\{[\s\S]*\})/);
  if (objMatch) { try { return JSON.parse(objMatch[1]); } catch {} }

  return null;
}

/**
 * POST /api/test/questions — generate all 6 questions in one call for instant UX.
 * body: { user_id }
 */
router.post('/questions', aiRateLimit, async (req, res, next) => {
  try {
    const { user_id } = req.body ?? {};
    if (!user_id) return res.status(400).json({ data: null, error: 'user_id is required' });

    const systemPrompt = loadBulkQuestionsPrompt();
    const messages = [{ role: 'user', content: 'Generate the 6 test questions now.' }];

    const raw = await callClaude(systemPrompt, messages, 2048, MODEL_FAST);
    const questions = tryParseJSON(raw);

    if (!Array.isArray(questions) || questions.length < 6) {
      throw new Error(`Expected array of questions, got ${questions?.length ?? 'invalid JSON'}`);
    }

    return res.json({ data: { questions }, error: null });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/test/question — adaptive single question or verdict after 6 answers.
 * body: { user_id, previous_answers: [{number, question, options, difficulty, selected, correct}] }
 */
router.post('/question', aiRateLimit, async (req, res, next) => {
  try {
    const { user_id, previous_answers = [] } = req.body ?? {};
    if (!user_id) {
      return res.status(400).json({ data: null, error: 'user_id is required' });
    }

    // After 6 answers → compute verdict locally (no Claude needed)
    if (previous_answers.length >= 6) {
      const verdict = scoreVerdict(previous_answers);
      await db.upsertProgress(user_id, { level: verdict.level });
      return res.json({ data: { type: 'verdict', ...verdict }, error: null });
    }

    // Generate next adaptive question
    const difficulty = nextDifficulty(previous_answers);
    const systemPrompt = adaptiveQuestionPrompt(difficulty);
    const messages = buildHistory(previous_answers);
    messages.push({ role: 'user', content: `Give me question ${previous_answers.length + 1} now at ${difficulty} difficulty.` });

    const raw = await callClaude(systemPrompt, messages);
    const question = tryParseJSON(raw);

    if (!question) {
      throw new Error('Claude returned invalid JSON for question');
    }

    return res.json({
      data: {
        type: 'question',
        number: previous_answers.length + 1,
        question: question.question,
        options: question.options,
        correct: question.correct,
        difficulty: question.difficulty ?? difficulty,
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/test/complete
 * body: { user_id, answers: [{number, question, options, difficulty, selected, correct}] }
 */
router.post('/complete', aiRateLimit, async (req, res, next) => {
  try {
    const { user_id, answers } = req.body ?? {};
    if (!user_id) {
      return res.status(400).json({ data: null, error: 'user_id is required' });
    }
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ data: null, error: 'answers array is required' });
    }

    const verdict = scoreVerdict(answers);
    await db.upsertProgress(user_id, { level: verdict.level });
    return res.json({ data: verdict, error: null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
