const { Router } = require('express');
const { Pool } = require('pg');
const db = require('../db/queries');
const { sendMessage, streamMessage } = require('../services/claude');
const { aiRateLimit } = require('../middleware/rateLimit');

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function getSession(session_id) {
  const { rows } = await pool.query(
    'SELECT id, user_id, character, level FROM sessions WHERE id = $1',
    [session_id]
  );
  return rows[0] ?? null;
}

/**
 * POST /api/chat/stream — SSE streaming endpoint
 * Streams reply tokens as they arrive, then sends full metadata at end.
 */
router.post('/stream', aiRateLimit, async (req, res) => {
  const { session_id, message, history = [] } = req.body ?? {};
  if (!session_id || !message) {
    return res.status(400).json({ error: 'session_id and message are required' });
  }

  const session = await getSession(session_id).catch(() => null);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  try {
    await db.addMessage(session_id, 'user', message, null);

    const { parsed, raw } = await streamMessage({
      level: session.level,
      character: session.character,
      history,
      userMessage: message,
      onReplyDelta: (text) => send({ type: 'delta', text }),
    });

    await db.addMessage(session_id, 'assistant', raw, parsed?.mood ?? null);
    send({ type: 'done', data: parsed });
  } catch (err) {
    send({ type: 'error', message: err.message });
  } finally {
    res.end();
  }
});

/**
 * POST /api/chat — legacy non-streaming endpoint (kept for compatibility)
 */
router.post('/', aiRateLimit, async (req, res, next) => {
  try {
    const { session_id, message, history = [] } = req.body ?? {};
    if (!session_id || !message) {
      return res.status(400).json({ data: null, error: 'session_id and message are required' });
    }

    const session = await getSession(session_id);
    if (!session) return res.status(404).json({ data: null, error: 'Session not found' });

    await db.addMessage(session_id, 'user', message, null);
    const response = await sendMessage({
      level: session.level,
      character: session.character,
      history,
      userMessage: message,
    });
    await db.addMessage(session_id, 'assistant', JSON.stringify(response), response.mood ?? null);
    return res.json({ data: response, error: null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
