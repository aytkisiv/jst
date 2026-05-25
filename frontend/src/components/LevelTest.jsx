import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useLevelTest from '../hooks/useLevelTest';

const LETTERS = ['A', 'B', 'C', 'D'];
const TOTAL = 6;

/** Parse "A) has gone" or "A: has gone" → { letter: "A", text: "has gone" } */
function parseOption(raw, index) {
  const match = raw.match(/^([A-D])[):.\s]\s*(.+)$/);
  return match
    ? { letter: match[1], text: match[2].trim() }
    : { letter: LETTERS[index] ?? String(index + 1), text: raw.trim() };
}

/** Render question text: split on _____ and inject underline span */
function QuestionText({ text }) {
  if (!text) return null;
  const parts = text.split(/_{3,}/);
  if (parts.length === 1) {
    return <span>{text}</span>;
  }
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <span style={{
              display: 'inline-block', width: 80,
              borderBottom: '2.5px solid #7c5cbf',
              margin: '0 6px', verticalAlign: 'middle',
            }} />
          )}
        </span>
      ))}
    </>
  );
}

/**
 * Level test screen — 6 adaptive questions from Claude.
 * Matches Stitch "Level Test (Refined Glassmorphism)" design.
 */
export default function LevelTest() {
  const navigate = useNavigate();
  const { questions, currentIndex, answers, isLoading, result, error, startTest, submitAnswer } = useLevelTest();
  const [selected, setSelected] = useState(null);
  const [animKey, setAnimKey] = useState(0);

  // Start test on mount
  useEffect(() => { startTest(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Navigate to result when done
  useEffect(() => {
    if (result) navigate('/result', { state: { result } });
  }, [result, navigate]);

  const currentQuestion = questions[currentIndex];
  const answeredCount = answers.length;
  const options = currentQuestion?.options?.map(parseOption) ?? [];

  function handleSelect(letter) {
    if (isLoading) return;
    setSelected(letter);
  }

  async function handleNext() {
    if (!selected || isLoading) return;
    const letter = selected;
    setSelected(null);
    setAnimKey((k) => k + 1);
    await submitAnswer(letter);
  }

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, sans-serif",
      minHeight: '100vh', position: 'relative',
      overflowX: 'hidden', color: '#0b1c30',
    }}>
      {/* Background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: -2,
        backgroundColor: '#ffffff',
        backgroundImage: `
          radial-gradient(circle at 0% 0%, rgba(124,92,191,0.35) 0%, transparent 60%),
          radial-gradient(circle at 100% 100%, rgba(252,121,189,0.35) 0%, transparent 60%)
        `,
      }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(to right, rgba(124,92,191,0.04) 1px, transparent 1px)',
        backgroundSize: '60px 100%',
      }} />

      <div style={{
        maxWidth: 672, margin: '0 auto',
        padding: '64px 20px 120px',
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
      }}>

        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
          {/* XP badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.8)',
            boxShadow: '0 10px 40px rgba(124,92,191,0.1)',
            borderRadius: 9999, padding: '8px 16px',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#6343a4', fontVariationSettings: "'FILL' 1" }}>star</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6343a4' }}>120 XP</span>
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, margin: '0 16px' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#7b7583', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              Level Test
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {[...Array(TOTAL)].map((_, i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: i < answeredCount + (currentQuestion ? 1 : 0)
                    ? '#6343a4'
                    : 'rgba(99,67,164,0.2)',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>
          </div>

          {/* Streak */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.8)',
            boxShadow: '0 10px 40px rgba(124,92,191,0.1)',
            borderRadius: 9999, padding: '8px 16px',
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#a43073' }}>{answeredCount}</span>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#a43073', fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
          </div>
        </header>

        {/* Question + answers */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', marginBottom: 32 }}>

          {/* Loading state */}
          {isLoading && !currentQuestion && (
            <div style={{ textAlign: 'center', color: '#7b7583', fontSize: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                border: '3px solid rgba(124,92,191,0.2)',
                borderTopColor: '#7c5cbf',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 16px',
              }} />
              {answeredCount >= 6 ? 'Считаем результат...' : 'Загружаем вопрос...'}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ textAlign: 'center', color: '#ba1a1a', padding: 24, background: '#ffdad6', borderRadius: 16 }}>
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {currentQuestion && (
              <motion.div
                key={animKey}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                {/* Question card */}
                <div style={{
                  background: 'rgba(255,255,255,0.5)',
                  backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
                  border: '1px solid rgba(255,255,255,0.8)',
                  boxShadow: '0 10px 40px rgba(124,92,191,0.1)',
                  borderRadius: 24, padding: '48px 32px',
                  textAlign: 'center', marginBottom: 32,
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* Inner glow border */}
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: 24,
                    border: '2px solid rgba(255,255,255,0.8)',
                    pointerEvents: 'none',
                  }} />
                  <h2 style={{
                    fontSize: 28, lineHeight: '36px', fontWeight: 600,
                    color: '#0b1c30', margin: '0 0 16px',
                  }}>
                    <QuestionText text={currentQuestion.question} />
                  </h2>
                  <p style={{ fontSize: 16, color: '#494551', margin: 0 }}>
                    Choose the correct form to complete the sentence.
                  </p>
                </div>

                {/* Answer options 2×2 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {options.map((opt) => {
                    const isActive = selected === opt.letter;
                    return (
                      <motion.button
                        key={opt.letter}
                        onClick={() => handleSelect(opt.letter)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                          borderRadius: 9999, padding: '16px 24px',
                          display: 'flex', alignItems: 'center', gap: 16,
                          cursor: isLoading ? 'default' : 'pointer',
                          border: 'none', textAlign: 'left',
                          transition: 'all 0.25s ease',
                          ...(isActive ? {
                            background: 'linear-gradient(135deg, #7c5cbf, #fc79bd)',
                            boxShadow: '0 12px 25px rgba(252,121,189,0.3)',
                            color: '#fff',
                          } : {
                            background: 'rgba(255,255,255,0.4)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.8)',
                            boxShadow: 'inset 0 0 15px rgba(255,255,255,0.5), 0 5px 15px rgba(124,92,191,0.05)',
                            color: '#0b1c30',
                          }),
                        }}
                      >
                        <span style={{
                          width: 32, height: 32, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 500, flexShrink: 0,
                          ...(isActive
                            ? { background: 'rgba(255,255,255,0.2)', color: '#fff' }
                            : { background: 'rgba(255,255,255,0.4)', color: '#494551' }),
                        }}>
                          {opt.letter}
                        </span>
                        <span style={{ fontSize: 18, lineHeight: '28px', fontWeight: 400 }}>
                          {opt.text}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </main>
      </div>

      {/* Floating bottom bar */}
      <div style={{
        position: 'fixed', bottom: 32,
        left: '50%', transform: 'translateX(-50%)',
        width: '92%', maxWidth: 672, zIndex: 50,
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.8)',
          boxShadow: '0 30px 60px rgba(124,92,191,0.2)',
          borderRadius: 9999, padding: '12px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {/* Back */}
          <button
            onClick={() => navigate('/')}
            style={{
              width: 48, height: 48, borderRadius: '50%', border: 'none',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#494551', transition: 'background 0.2s',
            }}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>

          {/* Next */}
          <motion.button
            onClick={handleNext}
            disabled={!selected || isLoading}
            whileHover={selected && !isLoading ? { scale: 1.02, y: -2 } : {}}
            whileTap={selected && !isLoading ? { scale: 0.97 } : {}}
            style={{
              background: selected && !isLoading
                ? 'linear-gradient(to right, #6343a4, #fc79bd)'
                : 'rgba(124,92,191,0.3)',
              color: '#fff', border: 'none', cursor: selected ? 'pointer' : 'default',
              borderRadius: 9999, padding: '12px 32px',
              fontSize: 14, fontWeight: 500, letterSpacing: '0.01em',
              fontFamily: "'Inter', system-ui, sans-serif",
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: selected ? '0 8px 20px rgba(124,92,191,0.3)' : 'none',
              transition: 'all 0.25s ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            {isLoading ? 'Загрузка...' : 'Next Question'}
          </motion.button>

          {/* Counter */}
          <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#7b7583' }}>
            {answeredCount + (currentQuestion ? 1 : 0)}/{TOTAL}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
