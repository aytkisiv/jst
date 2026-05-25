const { Router } = require('express');
const { Pool } = require('pg');
const db = require('../db/queries');
const { awardXP } = require('../services/xp');

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * GET /api/progress/:user_id
 */
router.get('/:user_id', async (req, res, next) => {
  try {
    const { user_id } = req.params;

    const progress = await db.getProgress(user_id);
    if (!progress) {
      return res.status(404).json({ data: null, error: 'Progress not found' });
    }

    const { rows: badgeRows } = await pool.query(
      'SELECT badge_type, earned_at FROM badges WHERE user_id = $1 ORDER BY earned_at',
      [user_id]
    );

    return res.json({
      data: {
        xp: progress.xp,
        streak: progress.streak,
        level: progress.level,
        badges: badgeRows,
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/progress/xp
 * body: { user_id, message_id, amount }
 */
router.post('/xp', async (req, res, next) => {
  try {
    const { user_id, message_id, amount } = req.body ?? {};
    if (!user_id || !message_id || amount == null) {
      return res.status(400).json({ data: null, error: 'user_id, message_id, and amount are required' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ data: null, error: 'amount must be a positive number' });
    }

    const awarded = await awardXP({ userId: user_id, messageId: message_id, amount });
    return res.json({ data: { awarded }, error: null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
