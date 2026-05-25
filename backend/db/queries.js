const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Fetch a user by ID.
 * @param {string} id - UUID of the user
 * @returns {Promise<object|null>}
 */
async function getUser(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] ?? null;
}

/**
 * Create a new user and return the created row.
 * @returns {Promise<object>}
 */
async function createUser() {
  const { rows } = await pool.query(
    'INSERT INTO users DEFAULT VALUES RETURNING *'
  );
  return rows[0];
}

/**
 * Create a new chat session for a user.
 * @param {string} userId
 * @param {string} character - one of: bro, roaster, sensei, alex, unit7
 * @param {string} level - one of: a1, a2, b1, b2, c1
 * @returns {Promise<object>}
 */
async function createSession(userId, character, level) {
  const { rows } = await pool.query(
    `INSERT INTO sessions (user_id, character, level)
     VALUES ($1, $2, $3) RETURNING *`,
    [userId, character, level]
  );
  return rows[0];
}

/**
 * Add a message to a session.
 * @param {string} sessionId
 * @param {string} role - 'user' or 'assistant'
 * @param {string} content
 * @param {string|null} mood
 * @returns {Promise<object>}
 */
async function addMessage(sessionId, role, content, mood = null) {
  const { rows } = await pool.query(
    `INSERT INTO messages (session_id, role, content, mood)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [sessionId, role, content, mood]
  );
  return rows[0];
}

/**
 * Get the progress record for a user.
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
async function getProgress(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM progress WHERE user_id = $1',
    [userId]
  );
  return rows[0] ?? null;
}

/**
 * Insert or update a user's progress record.
 * @param {string} userId
 * @param {{ xp?: number, streak?: number, level?: string }} fields
 * @returns {Promise<object>}
 */
async function upsertProgress(userId, fields = {}) {
  const xp = fields.xp ?? 0;
  const streak = fields.streak ?? 0;
  const level = fields.level ?? null;
  const { rows } = await pool.query(
    `INSERT INTO progress (user_id, xp, streak, level, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id) DO UPDATE
       SET xp         = EXCLUDED.xp,
           streak     = EXCLUDED.streak,
           level      = COALESCE(EXCLUDED.level, progress.level),
           updated_at = NOW()
     RETURNING *`,
    [userId, xp, streak, level]
  );
  return rows[0];
}

/**
 * Award a badge to a user. No-op if the badge was already earned.
 * @param {string} userId
 * @param {string} badgeType
 * @returns {Promise<object|null>} inserted row, or null if already existed
 */
async function addBadge(userId, badgeType) {
  const { rows } = await pool.query(
    `INSERT INTO badges (user_id, badge_type)
     VALUES ($1, $2)
     ON CONFLICT (user_id, badge_type) DO NOTHING
     RETURNING *`,
    [userId, badgeType]
  );
  return rows[0] ?? null;
}

/**
 * Check whether a user already has a specific badge.
 * @param {string} userId
 * @param {string} badgeType
 * @returns {Promise<boolean>}
 */
async function checkBadge(userId, badgeType) {
  const { rows } = await pool.query(
    `SELECT EXISTS (
       SELECT 1 FROM badges WHERE user_id = $1 AND badge_type = $2
     ) AS has_badge`,
    [userId, badgeType]
  );
  return rows[0].has_badge;
}

/**
 * Idempotently add XP for a specific message.
 * Uses message_id as the idempotency key via xp_events table.
 * Duplicate calls with the same messageId are silent no-ops.
 * @param {string} userId
 * @param {string} messageId - UUID of the message that earned XP
 * @param {number} amount - XP to add
 * @returns {Promise<boolean>} true if XP was added, false if already processed
 */
async function addXP(userId, messageId, amount) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rowCount } = await client.query(
      `INSERT INTO xp_events (message_id, user_id, amount)
       VALUES ($1, $2, $3)
       ON CONFLICT (message_id) DO NOTHING`,
      [messageId, userId, amount]
    );

    if (rowCount === 0) {
      await client.query('ROLLBACK');
      return false;
    }

    await client.query(
      `UPDATE progress SET xp = xp + $2, updated_at = NOW() WHERE user_id = $1`,
      [userId, amount]
    );

    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  getUser,
  createUser,
  createSession,
  addMessage,
  getProgress,
  upsertProgress,
  addBadge,
  checkBadge,
  addXP,
};
