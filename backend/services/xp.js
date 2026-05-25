const db = require('../db/queries');

const BADGE_RULES = [
  { type: 'XP_100',   check: (p) => p.xp >= 100 },
  { type: 'STREAK_3', check: (p) => p.streak >= 3 },
];

/**
 * Idempotently award XP for a message.
 * @param {{ userId: string, messageId: string, amount: number }} params
 * @returns {Promise<boolean>} true if XP was newly awarded
 */
async function awardXP({ userId, messageId, amount }) {
  return db.addXP(userId, messageId, amount);
}

/**
 * Check badge thresholds and award any newly earned badges.
 * @param {{ userId: string }} params
 * @returns {Promise<string[]>} list of newly earned badge types
 */
async function checkBadges({ userId }) {
  const progress = await db.getProgress(userId);
  if (!progress) return [];

  const newBadges = [];

  for (const rule of BADGE_RULES) {
    if (!rule.check(progress)) continue;

    const already = await db.checkBadge(userId, rule.type);
    if (already) continue;

    const awarded = await db.addBadge(userId, rule.type);
    if (awarded) newBadges.push(rule.type);
  }

  return newBadges;
}

module.exports = { awardXP, checkBadges };
