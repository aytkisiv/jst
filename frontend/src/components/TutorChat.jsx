import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useTutor from '../hooks/useTutor';
import GrammarCard from './GrammarCard';
import VoiceOverlay from './VoiceOverlay';
import useGameStore from '../store/gameStore';

import renderMd   from '../utils/renderMd';
import broImg     from '../assets/characters/bro.png';
import roasterImg from '../assets/characters/roaster.png';
import senseiImg  from '../assets/characters/sensei.png';
import alexImg    from '../assets/characters/alex.png';
import unit7Img   from '../assets/characters/unit7.png';

const CHAR_IMAGES = { bro: broImg, roaster: roasterImg, sensei: senseiImg, alex: alexImg, unit7: unit7Img };
const CHAR_NAME   = { bro: 'Бро', roaster: 'Роастер', sensei: 'Сенсей', alex: 'Алекс', unit7: 'Юнит-7' };
const CHAR_COLOR  = { bro: '#f59e0b', roaster: '#ef4444', sensei: '#8b5cf6', alex: '#3b82f6', unit7: '#7c5cbf' };

const MOOD_COLORS = {
  happy:      '#f59e0b',
  thinking:   '#6366f1',
  laughing:   '#ec4899',
  proud:      '#10b981',
  explaining: '#3b82f6',
};

const LESSON_STEPS = [
  { label: 'Введение',            done: true,  active: false },
  { label: 'Базовая форма',       done: true,  active: false },
  { label: 'vs Past Simple',      done: false, active: true  },
  { label: 'Временные выражения', done: false, active: false },
  { label: 'Практика',            done: false, active: false },
];

const glass = {
  background: 'rgba(255,255,255,0.6)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.5)',
};

/* ─── Typing indicator ─── */
function TypingBubble() {
  return (
    <div className="flex gap-1.5 items-center px-4 py-3 w-fit"
      style={{ ...glass, borderRadius: '4px 16px 16px 16px', boxShadow: '0 4px 20px rgba(124,92,191,0.06)' }}>
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="block w-2 h-2 rounded-full bg-[#6343a4]"
          animate={{ scale: [0.4, 1, 0.4], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }} />
      ))}
    </div>
  );
}

/* ─── Chat bubbles ─── */
function TutorBubble({ msg }) {
  return (
    <motion.div className="flex flex-col gap-1.5 items-start"
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <div className="max-w-[80%] px-4 py-3 text-[15px] leading-relaxed text-[#0b1c30]"
        style={{ ...glass, background: 'rgba(255,255,255,0.82)', borderRadius: '4px 18px 18px 18px', boxShadow: '0 8px 24px rgba(124,92,191,0.07)' }}>
        {renderMd(msg.content)}
        {msg.is_correct === false && <GrammarCard correction={msg.correction} />}
      </div>
      {msg.check_question && (
        <span className="text-[11px] text-[#6343a4]/60 ml-3 flex items-center gap-1">✔ проверочный вопрос</span>
      )}
    </motion.div>
  );
}

function UserBubble({ msg }) {
  return (
    <motion.div className="flex justify-end"
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <div className="max-w-[80%] px-4 py-3 text-[15px] leading-relaxed text-white"
        style={{ background: 'linear-gradient(135deg, #6343a4 0%, #fc79bd 100%)', borderRadius: '18px 4px 18px 18px', boxShadow: '0 8px 28px rgba(99,67,164,0.22)' }}>
        {msg.content}
      </div>
    </motion.div>
  );
}

function useIsMobile() {
  const [m, setM] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = (e) => setM(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return m;
}

/* ─── Main ─── */
export default function TutorChat() {
  const [input, setInput]         = useState('');
  const [isVoiceOpen, setVoiceOpen] = useState(false);
  const chatRef  = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const character = useGameStore((s) => s.character);
  const xp        = useGameStore((s) => s.xp);
  const level     = useGameStore((s) => s.level);
  const mood      = useGameStore((s) => s.mood ?? 'happy');

  const { messages, isLoading, error, sendMessage } = useTutor();

  const charKey    = character || 'bro';
  const xpMax      = 1000;
  const xpPct      = Math.min((xp / xpMax) * 100, 100);
  const correct    = messages.filter((m) => m.role === 'tutor' && m.is_correct !== false).length;
  const mistakes   = messages.filter((m) => m.role === 'tutor' && m.is_correct === false).length;
  const moodColor  = MOOD_COLORS[mood] ?? CHAR_COLOR[charKey];

  // XP popup
  const [xpPopup, setXpPopup] = useState(null);
  const prevMsgCount = useRef(0);

  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      const newest = messages[messages.length - 1];
      if (newest?.role === 'tutor' && newest.xp_earned > 0) {
        setXpPopup(newest.xp_earned);
        const t = setTimeout(() => setXpPopup(null), 2000);
        return () => clearTimeout(t);
      }
      prevMsgCount.current = messages.length;
    }
  }, [messages]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#f8f9ff', color: '#0b1c30', height: '100dvh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* XP popup */}
      <AnimatePresence>
        {xpPopup && (
          <motion.div
            style={{ position: 'fixed', top: 80, right: 24, zIndex: 999, fontWeight: 800, fontSize: 22, color: '#22c55e',
              textShadow: '0 2px 8px rgba(34,197,94,0.4)', pointerEvents: 'none' }}
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.1, 1, 1], y: [0, -20, -30, -50] }}
            transition={{ duration: 1.5 }}>
            +{xpPopup} XP
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(to right, rgba(99,67,164,0.05) 1px, transparent 1px)',
        backgroundSize: '24px 100%' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle at 20% 30%, rgba(252,121,189,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(99,67,164,0.15) 0%, transparent 50%)' }} />

      {/* Row layout */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'row', height: '100dvh', width: '100%' }}>

        {/* ══ LEFT: main chat ══ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* ── Top bar ── */}
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '12px 14px 6px' : '20px 20px 8px', flexShrink: 0, paddingTop: isMobile ? 'max(12px, env(safe-area-inset-top))' : 20 }}>
            {/* Back */}
            <button onClick={() => navigate('/map')}
              style={{ ...glass, width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#494551', cursor: 'pointer', fontSize: 18, boxShadow: '0 10px 30px rgba(124,92,191,0.08)', border: '1px solid rgba(255,255,255,0.5)' }}>
              ←
            </button>

            {/* Center: name + level */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#6343a4' }}>{CHAR_NAME[charKey]}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#6343a4', background: 'rgba(211,228,254,0.9)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 99, padding: '2px 12px' }}>
                {level ? level.toUpperCase() : 'B1'}
              </span>
            </div>

            {/* Right: XP + streak */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ ...glass, borderRadius: 99, padding: isMobile ? '4px 10px' : '6px 12px', fontSize: isMobile ? 12 : 13, fontWeight: 700, color: '#7c5cbf', boxShadow: '0 10px 30px rgba(124,92,191,0.08)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {xp} XP ⚡
              </div>
              {!isMobile && (
                <div style={{ ...glass, borderRadius: 99, padding: '6px 12px', fontSize: 13, fontWeight: 700, color: '#a43073', boxShadow: '0 10px 30px rgba(124,92,191,0.08)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  3 🔥
                </div>
              )}
            </div>
          </header>

          {/* ── Character section ── */}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: 'center', padding: isMobile ? '8px 14px' : '16px 0 12px', flexShrink: 0, position: 'relative', gap: isMobile ? 10 : 0 }}>
            {/* glow */}
            {!isMobile && (
              <motion.div animate={{ background: `${moodColor}50` }} transition={{ duration: 0.6 }}
                style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 160, height: 160, borderRadius: '50%', filter: 'blur(36px)', pointerEvents: 'none' }} />
            )}

            {/* avatar */}
            <motion.div
              animate={{ borderColor: moodColor, boxShadow: `0 ${isMobile ? 8 : 16}px ${isMobile ? 20 : 40}px ${moodColor}44` }}
              transition={{ duration: 0.6 }}
              style={{ width: isMobile ? 52 : 112, height: isMobile ? 52 : 112, borderRadius: '50%', overflow: 'hidden', border: `${isMobile ? 2 : 4}px solid`, position: 'relative', zIndex: 1, flexShrink: 0 }}>
              <img src={CHAR_IMAGES[charKey]} alt={CHAR_NAME[charKey]}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 12%' }} />
            </motion.div>

            {/* on mobile: name + topic inline; on desktop: topic pill below */}
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#6343a4' }}>{CHAR_NAME[charKey]}</span>
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>📚 Present Perfect vs Past Simple</span>
              </div>
            ) : (
              <div style={{ ...glass, background: 'rgba(255,255,255,0.85)', borderRadius: 99, padding: '6px 16px', marginTop: 10, fontSize: 12, fontWeight: 600, color: '#6343a4', boxShadow: '0 8px 24px rgba(124,92,191,0.1)', display: 'flex', alignItems: 'center', gap: 6, position: 'relative', zIndex: 1 }}>
                📚 Present Perfect vs Past Simple
              </div>
            )}
          </div>

          {/* ── Messages ── */}
          <main ref={chatRef}
            style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '8px 12px 8px' : '12px 20px 8px', display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 16, maxWidth: 720, width: '100%', margin: '0 auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,67,164,0.15) transparent' }}>

            {messages.length === 0 && !isLoading && (
              <motion.p style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', marginTop: 32 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {CHAR_NAME[charKey]} готов. Напиши что-нибудь!
              </motion.p>
            )}

            <AnimatePresence>
              {messages.map((msg) =>
                msg.role === 'user'
                  ? <UserBubble key={msg.id} msg={msg} />
                  : <TutorBubble key={msg.id} msg={msg} />
              )}
            </AnimatePresence>

            {isLoading && <TypingBubble />}
            {error && <p style={{ textAlign: 'center', fontSize: 12, color: '#ef4444' }}>Ошибка соединения — попробуй ещё раз</p>}
          </main>

          {/* ── Input ── */}
          <footer style={{ padding: isMobile ? '6px 12px 0' : '8px 20px 0', paddingBottom: isMobile ? 'max(16px, env(safe-area-inset-bottom))' : 28, flexShrink: 0, maxWidth: 720, width: '100%', margin: '0 auto' }}>
            <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginBottom: 10, letterSpacing: '0.03em', fontWeight: 500 }}>
              Пиши или держи микрофон для речи
            </p>
            <div style={{ ...glass, background: 'rgba(255,255,255,0.85)', borderRadius: 99, padding: '6px 6px 6px 6px', display: 'flex', alignItems: 'center', boxShadow: '0 12px 36px rgba(124,92,191,0.1)' }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                disabled={isLoading}
                placeholder="Напиши свой ответ..."
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', paddingLeft: 16, paddingRight: 8, fontSize: 15, color: '#0b1c30' }}
              />
              {/* mic */}
              <motion.button
                title="Голосовой ввод"
                onClick={() => setVoiceOpen(true)}
                style={{ width: 44, height: 44, borderRadius: '50%', background: '#6343a4', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 6, flexShrink: 0 }}
                animate={{ boxShadow: ['0 0 0 0 rgba(99,67,164,0.35)', '0 0 0 9px rgba(99,67,164,0)', '0 0 0 0 rgba(99,67,164,0)'] }}
                transition={{ duration: 2, repeat: Infinity }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="2" width="6" height="12" rx="3"/>
                  <path d="M5 10a7 7 0 0 0 14 0"/>
                  <line x1="12" y1="19" x2="12" y2="22"/>
                  <line x1="9" y1="22" x2="15" y2="22"/>
                </svg>
              </motion.button>
              {/* send */}
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                style={{ width: 36, height: 36, borderRadius: '50%', background: input.trim() ? 'rgba(99,67,164,0.12)' : 'rgba(211,228,254,0.5)', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6343a4', fontSize: 14, opacity: input.trim() ? 1 : 0.4, flexShrink: 0, transition: 'opacity 0.2s' }}>
                ➤
              </button>
            </div>
          </footer>
        </div>

        {/* ══ RIGHT: sidebar ══ */}
        <aside style={{ width: 272, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100vh', background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderLeft: '1px solid rgba(255,255,255,0.3)', padding: '28px 20px', gap: 0, overflowY: 'auto' }}
          className="hidden lg:flex">

          {/* XP */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#7b7583', textTransform: 'uppercase', letterSpacing: '0.08em' }}>⚡ XP</span>
              {xpPopup && <span style={{ fontSize: 11, fontWeight: 700, color: '#2e7d32' }}>+{xpPopup} XP</span>}
            </div>
            <div style={{ height: 14, borderRadius: 99, background: 'rgba(203,195,211,0.35)', overflow: 'hidden', marginBottom: 8 }}>
              <motion.div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(to right, #6343a4, #a43073)', boxShadow: '0 0 10px rgba(99,67,164,0.3)' }}
                animate={{ width: `${Math.max(xpPct, 1)}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
            </div>
            <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#6343a4' }}>{xp} / {xpMax}</p>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.4)', marginBottom: 24 }} />

          {/* Streak */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#7b7583', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>🔥 Серия</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 40, fontWeight: 800, color: '#a43073', lineHeight: 1 }}>3</span>
              <span style={{ fontSize: 14, color: '#7b7583' }}>дней</span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, fontStyle: 'italic', color: '#6343a4' }}>Не останавливайся!</p>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.4)', marginBottom: 24 }} />

          {/* Lesson progress */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#7b7583', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>📖 Этот урок</div>
            <div style={{ position: 'relative', paddingLeft: 4 }}>
              {/* connector line */}
              <div style={{ position: 'absolute', left: 11, top: 8, bottom: 8, width: 1.5, background: 'rgba(203,195,211,0.4)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {LESSON_STEPS.map((step) => (
                  <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
                    {/* dot */}
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                      border: step.done || step.active ? '2px solid white' : '2px solid #cbc3d3',
                      background: step.done ? '#2e7d32' : step.active ? '#6343a4' : 'white',
                      boxShadow: step.active ? '0 0 0 4px rgba(99,67,164,0.18)' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, color: 'white', fontWeight: 700,
                    }}>
                      {step.done ? '✓' : ''}
                    </div>
                    <span style={{
                      fontSize: 13,
                      fontWeight: step.active ? 700 : 400,
                      color: step.active ? '#6343a4' : step.done ? '#494551' : '#cbc3d3',
                    }}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.4)', marginBottom: 24 }} />

          {/* Stats */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#7b7583', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Статистика</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '✓', color: '#2e7d32', label: 'Правильно', val: correct },
                { icon: '✗', color: '#ba1a1a', label: 'Ошибок',    val: mistakes },
                { icon: '💬', color: '#6343a4', label: 'Сообщений', val: messages.length },
              ].map(({ icon, color, label, val }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#0b1c30' }}>
                  <span style={{ color, fontWeight: 700, width: 16, textAlign: 'center' }}>{icon}</span>
                  {label}: <strong style={{ marginLeft: 'auto', color: '#6343a4' }}>{val}</strong>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* XP popup */}
      <AnimatePresence>
        {xpPopup && (
          <motion.div
            key="xp-popup"
            style={{ position: 'fixed', bottom: 120, right: 32, fontSize: 22, fontWeight: 800, color: '#2e7d32', zIndex: 9999, pointerEvents: 'none', textShadow: '0 2px 8px rgba(46,125,50,0.3)' }}
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.1, 1, 1], y: [0, -20, -30, -50] }}
            transition={{ duration: 1.5, times: [0, 0.2, 0.6, 1] }}>
            +{xpPopup} XP ⚡
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVoiceOpen && (
          <VoiceOverlay
            onSend={(text) => { sendMessage(text); }}
            onClose={() => setVoiceOpen(false)}
            lastTutorMsg={[...messages].reverse().find((m) => m.role === 'tutor' && !m.streaming) ?? null}
            isLoading={isLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
