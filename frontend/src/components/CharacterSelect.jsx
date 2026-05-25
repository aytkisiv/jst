import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { CHARACTERS } from '../constants/characters';

import broImg    from '../assets/characters/bro.webp';
import roasterImg from '../assets/characters/roaster.webp';
import senseiImg  from '../assets/characters/sensei.webp';
import alexImg    from '../assets/characters/alex.webp';
import unit7Img   from '../assets/characters/unit7.webp';

const CHAR_IMAGES = { bro: broImg, roaster: roasterImg, sensei: senseiImg, alex: alexImg, unit7: unit7Img };


const CHAR_DATA = {
  bro: {
    ruName: 'Бро',
    emoji: '😎',
    tagline: 'Расслабленный кент со знанием грамматики',
    description: 'Объясняет через мемы, сленг и реальные ситуации. Никогда не давит. Если ошибся — скажет без осуждения, по-братски.',
    style: 'Casual · Сленг · Мемы',
    bestFor: 'Новичкам, которым скучно учиться',
    traits: ['Без стресса', 'Мемный стиль', 'Поддерживает'],
    quote: '"бро ты почти угадал 💀"',
    humor: 85, depth: 35, strictness: 15,
    accent: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
  },
  roaster: {
    ruName: 'Роастер',
    emoji: '🔥',
    tagline: 'Саркастичный, но по делу',
    description: 'Дружеские подколы после каждой ошибки. Зато запоминается. Жёсткий снаружи — реально помогает внутри. Скучать не придётся.',
    style: 'Сарказм · Прямо · Без воды',
    bestFor: 'Тем, кто любит вызов и не обижается',
    traits: ['Прямолинейный', 'Запоминается', 'Энергичный'],
    quote: '"серьёзно? ладно, слушай сюда 😤"',
    humor: 95, depth: 50, strictness: 45,
    accent: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
  },
  sensei: {
    ruName: 'Сенсей',
    emoji: '🧘',
    tagline: 'Мудрый. Спокойный. Точный',
    description: 'Каждое объяснение — как маленький урок дзен. Никаких лишних слов. Глубокие правила, понятные примеры, полное понимание.',
    style: 'Медитативно · Структурно · Глубоко',
    bestFor: 'Тем, кто хочет понять язык, а не просто выучить',
    traits: ['Терпелив', 'Глубокий анализ', 'Без суеты'],
    quote: '"Каждая ошибка — это путь к пониманию."',
    humor: 25, depth: 98, strictness: 65,
    accent: '#8b5cf6',
    bg: 'rgba(139,92,246,0.12)',
  },
  alex: {
    ruName: 'Профессор Алекс',
    emoji: '🎩',
    tagline: 'Британский стандарт. Никаких компромиссов',
    description: 'Профессор с кафедры лингвистики. Знает каждое правило и каждое исключение. Формальный тон, высокие стандарты, безупречный результат.',
    style: 'Академично · По-британски · Детально',
    bestFor: 'Перфекционистам и тем, кто готовится к экзаменам',
    traits: ['Строгий', 'Экспертный', 'Точный'],
    quote: '"Весьма близко. Но не совсем верно."',
    humor: 15, depth: 95, strictness: 90,
    accent: '#3b82f6',
    bg: 'rgba(59,130,246,0.12)',
  },
  unit7: {
    ruName: 'Юнит-7',
    emoji: '🤖',
    tagline: 'ИИ-тьютор с человеческими глюками',
    description: 'Обрабатывает язык как код. Иногда зависает. Иногда выдаёт что-то неожиданное. Но данные по грамматике — безупречны.',
    style: 'Логично · Системно · Непредсказуемо',
    bestFor: 'Любителям технологий и нестандартных объяснений',
    traits: ['Точные данные', 'Нестандартный', 'Запоминается'],
    quote: '"АНАЛИЗ ЗАВЕРШЁН. Ошибка обнаружена. 🤖"',
    humor: 65, depth: 80, strictness: 50,
    accent: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
  },
};

function StatBar({ label, value, accent }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs font-semibold text-gray-400">{label}</span>
        <span className="text-xs font-bold" style={{ color: accent }}>{value}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(to right, #7c5cbf, #e879a0)` }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export default function CharacterSelect() {
  const [index, setIndex] = useState(0);
  const setCharacter = useGameStore((s) => s.setCharacter);
  const xp = useGameStore((s) => s.xp);
  const navigate = useNavigate();

  const prev = () => setIndex((i) => (i - 1 + CHARACTERS.length) % CHARACTERS.length);
  const next = () => setIndex((i) => (i + 1) % CHARACTERS.length);

  const cur = CHARACTERS[index];
  const data = CHAR_DATA[cur.id];
  const prevChar = CHARACTERS[(index - 1 + CHARACTERS.length) % CHARACTERS.length];
  const nextChar = CHARACTERS[(index + 1) % CHARACTERS.length];

  const handleChoose = () => {
    setCharacter(cur.id);
    navigate('/map');
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col font-[Inter,sans-serif] overflow-x-hidden"
      style={{
        background: `
          radial-gradient(at 0% 0%, rgba(206,189,255,0.6) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(255,175,211,0.5) 0px, transparent 50%),
          #f8f9ff`,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
    >
      {/* Top bar */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-5 md:px-20 h-16"
        style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.3)' }}
      >
        <span className="text-xl font-bold text-[#6343a4]">just to study</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold text-[#6343a4]"
            style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.5)' }}>
            {xp} XP ⚡
          </div>
          <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold text-[#a43073]"
            style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.5)' }}>
            3 🔥
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center pt-8 pb-16 px-5 md:px-20 max-w-7xl mx-auto w-full">
        {/* Header */}
        <motion.div className="text-center mb-10 z-10" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h1 className="text-3xl md:text-5xl font-bold text-[#0b1c30] mb-2">Выбери своего тьютора</h1>
          <p className="text-sm font-medium text-[#6343a4]">⭐ Исходя из твоего уровня, рекомендуем Бро</p>
        </motion.div>

        {/* Carousel */}
        <div className="relative w-full flex items-end justify-center mb-6" style={{ height: 360 }}>

          {/* Prev ghost */}
          <motion.div
            className="absolute cursor-pointer select-none flex flex-col items-center justify-end"
            style={{ left: '4%', bottom: 0, width: 130, height: 280, opacity: 0.38, filter: 'blur(1.5px)', zIndex: 1 }}
            onClick={prev}
            whileHover={{ opacity: 0.55 }}
          >
            <img
              src={CHAR_IMAGES[prevChar.id]}
              alt={prevChar.name}
              className="w-full h-full object-contain object-bottom drop-shadow-lg"
              style={{ transform: 'scale(0.82)' }}
            />
          </motion.div>

          {/* Center character — animated video */}
          <AnimatePresence mode="wait">
            <motion.div
              key={cur.id}
              className="relative flex flex-col items-center justify-end"
              style={{ width: 220, height: 360, zIndex: 2 }}
              initial={{ opacity: 0, scale: 0.88, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 10 }}
              transition={{ duration: 0.28 }}
            >
              <img
                src={CHAR_IMAGES[cur.id]}
                alt={cur.name}
                className="w-full h-full"
                style={{ objectFit: 'contain', objectPosition: 'bottom', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.2))' }}
              />
            </motion.div>
          </AnimatePresence>

          {/* Next ghost */}
          <motion.div
            className="absolute cursor-pointer select-none flex flex-col items-center justify-end"
            style={{ right: '4%', bottom: 0, width: 130, height: 280, opacity: 0.38, filter: 'blur(1.5px)', zIndex: 1 }}
            onClick={next}
            whileHover={{ opacity: 0.55 }}
          >
            <img
              src={CHAR_IMAGES[nextChar.id]}
              alt={nextChar.name}
              className="w-full h-full object-contain object-bottom drop-shadow-lg"
              style={{ transform: 'scale(0.82)' }}
            />
          </motion.div>

          {/* Arrow buttons */}
          <button onClick={prev}
            className="absolute left-0 z-20 w-11 h-11 rounded-full flex items-center justify-center text-[#6343a4] hover:scale-105 transition-all"
            style={{ top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 10px 30px rgba(124,92,191,0.08)' }}>
            ←
          </button>
          <button onClick={next}
            className="absolute right-0 z-20 w-11 h-11 rounded-full flex items-center justify-center text-[#6343a4] hover:scale-105 transition-all"
            style={{ top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 10px 30px rgba(124,92,191,0.08)' }}>
            →
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex gap-2 mb-8">
          {CHARACTERS.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === index ? 28 : 8, height: 8,
                background: i === index ? '#7c5cbf' : 'rgba(124,92,191,0.22)',
              }} />
          ))}
        </div>

        {/* Info card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={cur.id}
            className="w-full max-w-2xl rounded-2xl p-6 md:p-8 relative overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 10px 40px rgba(124,92,191,0.1)' }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.28 }}
          >
            {/* accent glow top-right */}
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
              style={{ background: data.bg, filter: 'blur(28px)' }} />

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1 space-y-3 min-w-0">
                {/* Name + tagline */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{data.emoji}</span>
                    <h2 className="text-2xl font-bold" style={{ color: data.accent }}>{data.ruName}</h2>
                  </div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{data.tagline}</p>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-500 leading-relaxed">{data.description}</p>

                {/* Traits */}
                <div className="flex flex-wrap gap-2">
                  {data.traits.map((t) => (
                    <span key={t} className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: data.bg, color: data.accent }}>
                      {t}
                    </span>
                  ))}
                </div>

                {/* Style + bestFor */}
                <div className="space-y-1 text-xs text-gray-400">
                  <div>Стиль: <span className="font-semibold text-gray-600">{data.style}</span></div>
                  <div>Для кого: <span className="font-semibold text-gray-600">{data.bestFor}</span></div>
                </div>

                {/* Quote */}
                <div className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#6343a4] italic"
                  style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.5)' }}>
                  {data.quote}
                </div>
              </div>

              {/* Stats */}
              <div className="w-full md:w-48 shrink-0 space-y-3">
                <StatBar label="Юмор"      value={data.humor}      accent={data.accent} />
                <StatBar label="Глубина"   value={data.depth}      accent={data.accent} />
                <StatBar label="Строгость" value={data.strictness} accent={data.accent} />
              </div>
            </div>

            {/* CTA */}
            <div className="mt-6 flex flex-col items-center gap-2">
              <motion.button
                onClick={handleChoose}
                className="w-full md:w-auto px-8 py-4 rounded-full text-white text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(to right, #7c5cbf, #e879a0)', boxShadow: '0 10px 30px rgba(124,92,191,0.28)' }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Выбрать {data.ruName} →
              </motion.button>
              <button onClick={next} className="text-xs text-gray-400 hover:text-[#6343a4] transition-colors">
                или смотреть дальше
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </motion.div>
  );
}
