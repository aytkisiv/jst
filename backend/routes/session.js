const { Router } = require('express');
const { Pool } = require('pg');
const db = require('../db/queries');
const { checkBadges } = require('../services/xp');

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * POST /api/session/start
 * body: { user_id, character }
 */
router.post('/start', async (req, res, next) => {
  try {
    const { user_id, character } = req.body ?? {};
    if (!user_id || !character) {
      return res.status(400).json({ data: null, error: 'user_id and character are required' });
    }

    const progress = await db.getProgress(user_id);
    const level = progress?.level ?? 'b1';

    const session = await db.createSession(user_id, character, level);
    return res.json({ data: { session_id: session.id }, error: null });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/session/end
 * body: { session_id }
 */
router.post('/end', async (req, res, next) => {
  try {
    const { session_id } = req.body ?? {};
    if (!session_id) {
      return res.status(400).json({ data: null, error: 'session_id is required' });
    }

    // Mark session as ended
    const { rows: sessionRows } = await pool.query(
      'UPDATE sessions SET ended_at = NOW() WHERE id = $1 AND ended_at IS NULL RETURNING user_id',
      [session_id]
    );

    if (sessionRows.length === 0) {
      return res.status(404).json({ data: null, error: 'Session not found or already ended' });
    }

    const userId = sessionRows[0].user_id;

    // Total XP earned during this session
    const { rows: xpRows } = await pool.query(
      `SELECT COALESCE(SUM(xe.amount), 0)::int AS total
       FROM xp_events xe
       JOIN messages m ON m.id = xe.message_id
       WHERE m.session_id = $1`,
      [session_id]
    );
    const xpTotal = xpRows[0].total;

    const badgesEarned = await checkBadges({ userId });

    return res.json({ data: { xp_total: xpTotal, badges_earned: badgesEarned }, error: null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
