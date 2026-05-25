const { Router } = require('express');
const db = require('../db/queries');

const router = Router();

/**
 * POST /api/user/init
 * body: { user_id? }
 * Returns existing user if user_id provided, otherwise creates new user.
 */
router.post('/init', async (req, res, next) => {
  try {
    const { user_id } = req.body ?? {};

    if (user_id) {
      const user = await db.getUser(user_id);
      if (!user) {
        return res.status(404).json({ data: null, error: 'User not found' });
      }
      return res.json({ data: { user_id: user.id }, error: null });
    }

    const user = await db.createUser();
    return res.json({ data: { user_id: user.id }, error: null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
