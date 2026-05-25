import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';

import broImg     from '../assets/characters/bro.png';
import roasterImg from '../assets/characters/roaster.png';
import senseiImg  from '../assets/characters/sensei.png';
import alexImg    from '../assets/characters/alex.png';
import unit7Img   from '../assets/characters/unit7.png';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const CHAR_IMAGES = { bro: broImg, roaster: roasterImg, sensei: senseiImg, alex: alexImg, unit7: unit7Img };

/** Character-specific closing quote */
const charQuote = (character, correct, mistakes) => {
  if (mistakes === 0) {
    const perfect = { bro: 'bro you went off fr no cap 🔥', roaster: 'okay okay… i\'m lowkey impressed 😏', sensei: 'excellent, young one. your mind is clear 🧘', alex: 'perfect session! real progress right there 🌟', unit7: 'ZERO ERRORS DETECTED. UNIT-7 APPROVES ✅' };
    return perfect[character] ?? perfect.bro;
  }
  const imperfect = {
    bro:     `not bad bro 🙌 you mixed up ${mistakes > 1 ? 'a few things' : 'one thing'}, but we'll fix that next time fr 💪`,
    roaster: `you made ${mistakes} mistake${mistakes > 1 ? 's' : ''}… my grandma speaks better English 💀 we'll drill it`,
    sensei:  `${mistakes} mistake${mistakes > 1 ? 's' : ''} today. study these and grow stronger, student 📜`,
    alex:    `${mistakes} area${mistakes > 1 ? 's' : ''} to polish — keep going, you're doing great! ✨`,
    unit7:   `${mistakes} SYNTAX ERROR${mistakes > 1 ? 'S' : ''} DETECTED. DEBUGGING RECOMMENDED. UNIT-7 WILL ASSIST 🤖`,
  };
  return imperfect[character] ?? imperfect.bro;
};

/**
 * Session summary screen — pixel-perfect Stitch implementation (light design).
 * Calls POST /api/session/end once on mount to fetch xp_total and new badges.
 */
export default function SessionRecap() {
  const navigate  = useNavigate();
  const calledRef = useRef(false);

  const sessionId = useGameStore((s) => s.sessionId);
  const xp        = useGameStore((s) => s.xp);
  const streak    = useGameStore((s) => s.streak);
  const character = useGameStore((s) => s.character) ?? 'bro';
  const messages  = useGameStore((s) => s.messages);

  const [xpEarned, setXpEarned] = useState(0);
  const [badges,   setBadges]   = useState([]);
  const [loading,  setLoading]  = useState(true);

  const tutorMsgs = messages.filter((m) => m.role === 'tutor');
  const correct   = tutorMsgs.filter((m) => m.is_correct !== false).length;
  const mistakes  = tutorMsgs.filter((m) => m.is_correct === false).length;
  const totalMsgs = messages.filter((m) => m.role === 'user').length;

  // Extract grammar correction pairs: { wrong: string, right: string }
  const reviewPairs = messages.reduce((acc, msg, i) => {
    if (msg.role === 'tutor' && msg.is_correct === false && msg.correction) {
      const prev = messages[i - 1];
      if (prev?.role === 'user') acc.push({ wrong: prev.content, right: msg.correction });
    }
    return acc;
  }, []).slice(0, 3);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    if (!sessionId) { setLoading(false); return; }

    fetch(`${API_BASE}/api/session/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then((r) => r.json())
      .then(({ data }) => {
        if (data) {
          setXpEarned(data.xp_total ?? 0);
          setBadges(data.badges_earned ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  const charImg   = CHAR_IMAGES[character] ?? CHAR_IMAGES.bro;
  const earnedXp  = xpEarned || xp;
  const xpMax     = 1000;
  const xpPct     = Math.min((xp / xpMax) * 100, 100);
  const quote     = charQuote(character, correct, mistakes);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #ede5ff 0%, #e8ecff 55%, #f5e8ff 100%)',
      fontFamily: 'Inter, sans-serif',
      color: '#1a0d2e',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ═══ TOP NAV ═══ */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', flexShrink: 0 }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#6343a4', letterSpacing: '-0.01em' }}>just to study</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#6343a4', background: 'rgba(99,67,164,0.1)', borderRadius: 99, padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 4 }}>
            {earnedXp} XP ⚡
          </span>
          <img
            src={charImg}
            alt="avatar"
            style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center 12%', border: '2px solid #7c5cbf' }}
          />
        </div>
      </nav>

      {/* ═══ MAIN CONTENT ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 16px 48px' }}>

        {/* Avatar floats above card */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.1 }}
          style={{ position: 'relative', zIndex: 2, marginBottom: -32 }}>
          <img
            src={charImg}
            alt={character}
            style={{
              width: 76, height: 76, borderRadius: '50%',
              objectFit: 'cover', objectPosition: 'center 12%',
              border: '4px solid white',
              boxShadow: '0 8px 32px rgba(99,67,164,0.22)',
            }}
          />
          {/* Badge glow */}
          <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,191,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
        </motion.div>

        {/* ─── CARD ─── */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: 'white',
            borderRadius: 24,
            width: '100%',
            maxWidth: 440,
            boxShadow: '0 20px 64px rgba(99,67,164,0.13)',
            overflow: 'hidden',
          }}>

          {/* Card header */}
          <div style={{ padding: '44px 28px 20px', textAlign: 'center' }}>
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              style={{ fontSize: 26, fontWeight: 800, margin: '0 0 10px', color: '#1a0d2e', letterSpacing: '-0.02em' }}>
              Session Complete! 🎉
            </motion.h1>
            {/* Topic chip */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(99,67,164,0.09)', color: '#6343a4',
              borderRadius: 99, padding: '5px 16px',
              fontSize: 13, fontWeight: 600,
              border: '1px solid rgba(99,67,164,0.15)',
            }}>
              Present Perfect vs Past Simple
            </span>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', borderTop: '1px solid #f2edff', borderBottom: '1px solid #f2edff' }}>
            {[
              { icon: '💬', value: totalMsgs, label: 'messages' },
              { icon: '✓',  value: correct,   label: 'correct',  color: '#10b981' },
              { icon: '✗',  value: mistakes,  label: 'mistakes', color: '#ef4444' },
            ].map(({ icon, value, label, color }, i) => (
              <div key={i} style={{
                flex: 1, padding: '18px 0', textAlign: 'center',
                borderRight: i < 2 ? '1px solid #f2edff' : 'none',
              }}>
                <div style={{ fontSize: 15, marginBottom: 3 }}>{icon}</div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', delay: 0.3 + i * 0.08 }}
                  style={{ fontSize: 24, fontWeight: 800, color: color ?? '#1a0d2e', lineHeight: 1 }}>
                  {value}
                </motion.div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* XP bar + streak */}
          <div style={{ padding: '20px 28px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                style={{ fontSize: 14, fontWeight: 700, color: '#6343a4' }}>
                +{earnedXp} XP earned
              </motion.span>
              <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>
                Streak: {streak} {streak === 1 ? 'day' : 'days'} 🔥
              </span>
            </div>
            <div style={{ height: 10, borderRadius: 99, background: '#f2edff', overflow: 'hidden', marginBottom: 6 }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(xpPct, 1)}%` }}
                transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(to right, #6343a4, #a43073)' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#c4b5d4', marginBottom: 20 }}>
              <span>{Math.max(xp - earnedXp, 0)}</span>
              <span>{xp} / {xpMax} XP</span>
            </div>
          </div>

          {/* Grammar review */}
          <AnimatePresence>
            {reviewPairs.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                style={{ padding: '0 28px 20px' }}>
                <div style={{ height: 1, background: '#f2edff', marginBottom: 16 }} />
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1a0d2e', margin: '0 0 12px' }}>📝 What to review:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {reviewPairs.map((pair, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.1, ease: 'easeOut' }}
                      style={{ background: '#faf8ff', borderRadius: 12, padding: '11px 14px', border: '1px solid #f0ebff' }}>
                      <div style={{ fontSize: 13, color: '#ef4444', textDecoration: 'line-through', marginBottom: 5, opacity: 0.85 }}>
                        ✗ {pair.wrong}
                      </div>
                      <div style={{ fontSize: 13, color: '#10b981', fontWeight: 500 }}>
                        ✓ {pair.right}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* New badges */}
          <AnimatePresence>
            {badges.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ padding: '0 28px 20px' }}>
                <div style={{ height: 1, background: '#f2edff', marginBottom: 16 }} />
                <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>
                  New achievements
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {badges.map((badge, i) => (
                    <motion.div
                      key={badge}
                      initial={{ opacity: 0, scale: 0.3 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.12, type: 'spring', stiffness: 300 }}
                      style={{
                        background: 'rgba(99,67,164,0.09)', border: '1px solid rgba(99,67,164,0.18)',
                        borderRadius: 10, padding: '8px 14px',
                        display: 'flex', alignItems: 'center', gap: 8,
                        fontSize: 13, fontWeight: 600, color: '#6343a4',
                      }}>
                      {badge}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Character quote */}
          <div style={{ padding: '0 28px 28px' }}>
            <div style={{ height: 1, background: '#f2edff', marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <img
                src={charImg}
                alt="avatar"
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center 12%', border: '2px solid #e8e0ff', flexShrink: 0 }}
              />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                style={{
                  fontSize: 13, color: '#4b5563', lineHeight: 1.55, margin: 0,
                  background: '#f8f5ff', borderRadius: '4px 12px 12px 12px',
                  padding: '10px 14px', border: '1px solid #ede8ff',
                }}>
                "{quote}"
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* ─── ACTION BUTTONS ─── */}
        <div style={{ width: '100%', maxWidth: 440, marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <motion.button
            onClick={() => navigate('/map')}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', padding: '16px 0', borderRadius: 99,
              background: 'linear-gradient(135deg, #6343a4 0%, #a43073 100%)',
              border: 'none', color: 'white', fontSize: 16, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 8px 28px rgba(99,67,164,0.35)',
              letterSpacing: '-0.01em',
            }}>
            Continue learning →
          </motion.button>
          <motion.button
            onClick={() => navigate('/')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 14, cursor: 'pointer', padding: '4px 0' }}>
            Back to map
          </motion.button>
        </div>
      </div>
    </div>
  );
}
