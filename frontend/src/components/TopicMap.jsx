import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';

const TOPICS = [
  { id: 'present-perfect', title: 'Present Perfect', subtitle: 'vs Past Simple', unlocked: true,  active: true  },
  { id: 'past-simple',     title: 'Past Simple',     subtitle: 'Открывается после Present Perfect', unlocked: false, active: false },
  { id: 'present-cont',   title: 'Present Continuous', subtitle: 'Скоро', unlocked: false, active: false },
  { id: 'future',          title: 'Future Tenses',   subtitle: 'Скоро', unlocked: false, active: false },
  { id: 'modals',          title: 'Modal Verbs',      subtitle: 'Скоро', unlocked: false, active: false },
];

const CHAR_EMOJI = { bro: '😎', roaster: '🔥', sensei: '🧘', alex: '🎩', unit7: '🤖' };
const CHAR_GREET = {
  bro:     'Бро готов, когда ты готов 👊',
  roaster: 'Ну давай, покончим с этим 😤',
  sensei:  'Сосредоточь разум, ученик 🙏',
  alex:    'Что ж, начнём? 🎩',
  unit7:   'ИНИЦИАЛИЗАЦИЯ УРОКА... 🤖',
};

export default function TopicMap() {
  const navigate  = useNavigate();
  const character = useGameStore((s) => s.character);
  const userId    = useGameStore((s) => s.userId);
  const xp        = useGameStore((s) => s.xp);
  const [loading, setLoading] = useState(false);

  const charKey = character || 'bro';
  const xpMax = 1000;
  const xpPct = Math.min((xp / xpMax) * 100, 100);

  const reset = useGameStore((s) => s.reset);

  const handleReset = () => {
    reset();
    navigate('/');
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, character: charKey, topic: 'present-perfect' }),
      });
      if (res.ok) {
        const json = await res.json();
        const sid = json.data?.session_id ?? json.data?.id;
        if (sid) useGameStore.setState({ sessionId: sid });
      }
    } catch {
      // continue to chat even if session start fails
    } finally {
      setLoading(false);
      navigate('/chat');
    }
  };

  return (
    <motion.div
      className="min-h-screen font-[Inter,sans-serif] relative overflow-x-hidden"
      style={{ backgroundColor: '#f8f9ff' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
    >
      {/* Blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(206,189,255,0.55) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,175,211,0.45) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        {/* grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(124,92,191,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,92,191,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Header */}
      <header className="flex justify-between items-center px-5 md:px-20 pt-6 pb-4 max-w-7xl mx-auto">
        <span className="text-2xl font-bold text-[#6343a4]">just to study</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full text-sm font-medium text-[#6343a4]"
            style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 10px 30px rgba(124,92,191,0.08)' }}>
            <span>{xp} XP ⚡</span>
            <div className="w-px h-4 bg-purple-200" />
            <span>3 🔥</span>
          </div>
          <button
            onClick={handleReset}
            title="Сбросить прогресс и начать заново"
            className="px-3 py-2 rounded-full text-xs font-semibold text-gray-400 hover:text-red-400 transition-colors"
            style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.5)' }}>
            ↺ Reset
          </button>
        </div>
      </header>

      <main className="px-5 md:px-20 pb-32 pt-8 max-w-2xl mx-auto relative z-10">
        {/* Hero */}
        <motion.section className="text-center mb-12" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h1 className="text-4xl md:text-5xl font-bold text-[#7c5cbf] mb-4">Твой путь обучения</h1>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-2xl border-2 border-white">
              {CHAR_EMOJI[charKey]}
            </div>
            <p className="text-lg font-semibold text-gray-500">{CHAR_GREET[charKey]}</p>
          </div>
        </motion.section>

        {/* XP bar */}
        <div className="mb-8 px-1">
          <div className="flex justify-between text-xs font-semibold text-[#6343a4] mb-1">
            <span>⚡ Прогресс XP</span>
            <span>{xp} / {xpMax}</span>
          </div>
          <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(124,92,191,0.15)' }}>
            <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(to right, #7c5cbf, #e879a0)' }}
              initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
          </div>
        </div>

        {/* Topic nodes */}
        <section className="relative w-full py-8">
          {/* Vertical dotted line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 z-0"
            style={{ background: 'repeating-linear-gradient(to bottom, rgba(124,92,191,0.3) 0px, rgba(124,92,191,0.3) 8px, transparent 8px, transparent 16px)' }} />

          <div className="flex flex-col gap-12 relative z-10 items-center">
            {TOPICS.map((topic, i) => (
              <motion.div
                key={topic.id}
                className={`w-full relative ${topic.active ? 'max-w-sm' : 'max-w-xs'} ${!topic.unlocked ? 'opacity-50' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: topic.unlocked ? 1 : (1 - i * 0.15), y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                {/* connector dot */}
                <div className={`absolute left-1/2 -top-6 -translate-x-1/2 rounded-full border-2 border-white z-20 ${
                  topic.active ? 'w-4 h-4 shadow-[0_0_15px_rgba(124,92,191,0.6)]' : 'w-3 h-3'
                }`}
                  style={{ background: topic.active ? '#6343a4' : '#7b7583' }} />

                {topic.active ? (
                  <motion.div
                    className="rounded-2xl p-6 relative overflow-hidden cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 15px 40px rgba(124,92,191,0.2)' }}
                    animate={{ scale: [1, 1.015, 1], boxShadow: ['0 15px 40px rgba(124,92,191,0.2)', '0 20px 50px rgba(124,92,191,0.3)', '0 15px 40px rgba(124,92,191,0.2)'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <div className="absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-xl"
                      style={{ background: '#fc79bd', color: '#76014e' }}>
                      НАЧАТЬ
                    </div>
                    <div className="flex flex-col items-center text-center mt-2">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 text-3xl"
                        style={{ background: 'rgba(124,92,191,0.12)' }}>
                        📖
                      </div>
                      <h2 className="text-lg font-bold text-[#0b1c30] mb-1">{topic.title}</h2>
                      <p className="text-sm text-gray-500 mb-6">{topic.subtitle}</p>
                      <button
                        onClick={handleStart}
                        disabled={loading}
                        className="w-full py-3 rounded-full text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg transition-all hover:opacity-90 disabled:opacity-70"
                        style={{ background: '#6343a4', boxShadow: '0 10px 25px rgba(99,67,164,0.25)' }}
                      >
                        {loading ? 'Загрузка…' : 'Начать урок →'}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="rounded-2xl p-5 flex items-center gap-4"
                    style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.5)', filter: 'grayscale(50%)' }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-xl"
                      style={{ background: 'rgba(211,228,254,0.8)' }}>
                      🔒
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#0b1c30]">{topic.title}</div>
                      <div className="text-xs text-gray-400">{topic.subtitle}</div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </motion.div>
  );
}
