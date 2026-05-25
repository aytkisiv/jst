const { Router } = require('express');
const { checkBadges } = require('../services/xp');

const router = Router();

/**
 * POST /api/badges/check
 * body: { user_id }
 */
router.post('/check', async (req, res, next) => {
  try {
    const { user_id } = req.body ?? {};
    if (!user_id) {
      return res.status(400).json({ data: null, error: 'user_id is required' });
    }

    const newBadges = await checkBadges({ userId: user_id });
    return res.json({ data: { new_badges: newBadges }, error: null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
