import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const LEVEL_NAMES = {
  a1: 'Beginner',
  a2: 'Elementary',
  b1: 'Intermediate',
  b2: 'Upper-Intermediate',
  b2plus: 'Advanced',
  c1: 'Proficient',
};

const CONFETTI = [
  { color: '#7c5cbf', top: '15%', left: '10%',  size: 8  },
  { color: '#a43073', top: '25%', right: '15%', size: 6  },
  { color: '#775cc7', top: '10%', right: '30%', size: 10 },
  { color: '#fc79bd', top: '50%', left: '5%',   size: 8  },
  { color: '#eaddff', bottom: '20%', right: '10%', size: 12 },
  { color: '#7c5cbf', bottom: '30%', left: '20%', size: 6  },
  { color: '#fc79bd', bottom: '15%', left: '40%', size: 7  },
  { color: '#775cc7', top: '40%', right: '8%',  size: 9  },
];

const stagger = (i) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.34, 1.56, 0.64, 1], delay: i * 0.07 } },
});

/**
 * Result screen after level test completes.
 * Reads result from router state or Zustand store.
 * Matches Stitch "Test Result (Success)" design.
 */
export default function TestResult() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const result = state?.result ?? { level: 'b1', score: 4, message: 'Хороший результат! Начнём.', focus: 'tenses' };

  const levelName = LEVEL_NAMES[result.level] ?? result.level?.toUpperCase() ?? '—';
  const levelLabel = result.level?.toUpperCase().replace('PLUS', '+') ?? '—';

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, sans-serif",
      minHeight: '100vh', position: 'relative',
      overflowX: 'hidden', color: '#0b1c30',
      backgroundColor: '#f8f9ff',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '96px 20px 48px',
    }}>

      {/* Mesh background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `
          radial-gradient(at 0% 0%, rgba(206,189,255,0.4) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(255,175,211,0.4) 0px, transparent 50%),
          radial-gradient(at 50% 50%, rgba(255,255,255,0.8) 0px, transparent 100%)
        `,
        backgroundAttachment: 'fixed',
      }} />

      {/* Grid dots */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='%237c5cbf' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E")`,
      }} />

      {/* Confetti dots */}
      {CONFETTI.map((c, i) => (
        <div key={i} style={{
          position: 'fixed', zIndex: 1, pointerEvents: 'none',
          width: c.size, height: c.size, borderRadius: '50%',
          background: c.color, opacity: 0.6,
          top: c.top, left: c.left, right: c.right, bottom: c.bottom,
        }} />
      ))}

      {/* Fixed top nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px',
        background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 10px 30px rgba(124,92,191,0.08)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.4)',
          borderRadius: 9999, padding: '6px 12px',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#6343a4', fontVariationSettings: "'FILL' 1" }}>star</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#6343a4' }}>120 XP</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#0b1c30', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Level Test · Complete
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ width: 32, height: 4, background: '#6343a4', borderRadius: 9999 }} />
            ))}
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,218,214,0.3)', border: '1px solid rgba(255,255,255,0.4)',
          borderRadius: 9999, padding: '6px 12px',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#ba1a1a', fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#ba1a1a' }}>{result.score ?? 0}</span>
        </div>
      </nav>

      {/* Main card */}
      <motion.main
        style={{ width: '100%', maxWidth: 448, position: 'relative', zIndex: 10 }}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <div style={{
          background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 20px 40px rgba(124,92,191,0.12)',
          borderRadius: 32, padding: 32,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          {/* Top highlight */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.8), transparent)',
          }} />

          {/* Icon */}
          <motion.div {...stagger(0)} style={{ marginBottom: 24 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: '#d3e4fe', border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 4px 12px rgba(124,92,191,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', fontSize: 36,
            }}>
              🎯
              <div style={{
                position: 'absolute', top: -8, right: -8,
                width: 32, height: 32, borderRadius: '50%',
                background: '#a43073', border: '2px solid #fff',
                boxShadow: '0 2px 6px rgba(164,48,115,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#fff' }}>check</span>
              </div>
            </div>
          </motion.div>

          {/* Level name */}
          <motion.h2 {...stagger(1)} style={{
            fontSize: 48, lineHeight: '56px', fontWeight: 700,
            letterSpacing: '-0.02em', color: '#0b1c30', margin: '0 0 8px',
          }}>
            {levelName}
          </motion.h2>

          {/* Level label */}
          <motion.p {...stagger(2)} style={{
            fontSize: 20, lineHeight: '28px', fontWeight: 600,
            color: '#7c5cbf', margin: '0 0 16px',
          }}>
            {levelLabel} Level · {result.score ?? 0}/6
          </motion.p>

          {/* Message */}
          <motion.p {...stagger(3)} style={{
            fontSize: 16, lineHeight: '24px', color: '#494551',
            margin: '0 0 32px', padding: '0 16px',
          }}>
            {result.message}
          </motion.p>

          {/* Divider */}
          <div style={{
            width: '100%', height: 1, marginBottom: 32,
            background: 'linear-gradient(to right, transparent, rgba(203,195,211,0.5), transparent)',
          }} />

          {/* Stats pills */}
          <motion.div {...stagger(4)} style={{
            display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
            gap: 10, marginBottom: 32, width: '100%',
          }}>
            {[
              { icon: 'quiz',              label: `6/6 Questions`,        color: '#6343a4' },
              { icon: 'done_all',          label: `${result.score ?? 0} Correct`, color: '#a43073' },
              { icon: 'bar_chart',         label: `Level ${levelLabel}`,  color: '#5f42ac' },
            ].map((s) => (
              <div key={s.icon} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.6)',
                boxShadow: '0 4px 12px rgba(124,92,191,0.06)',
                borderRadius: 9999, padding: '8px 16px',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: s.color }}>
                  {s.icon}
                </span>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#0b1c30' }}>{s.label}</span>
              </div>
            ))}
          </motion.div>

          {/* XP callout */}
          <motion.div {...stagger(5)} style={{
            width: '100%', borderRadius: 16, padding: 16, marginBottom: 32,
            background: 'rgba(234,221,255,0.3)', border: '1px solid rgba(124,92,191,0.1)',
            backdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <span className="material-symbols-outlined" style={{ color: '#6343a4', fontVariationSettings: "'FILL' 1" }}>stars</span>
            <span style={{
              fontSize: 20, fontWeight: 700,
              background: 'linear-gradient(135deg, #6343a4, #a43073)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              +120 XP · First test done 🔥
            </span>
          </motion.div>

          {/* Actions */}
          <motion.div {...stagger(6)} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <motion.button
              onClick={() => navigate('/characters')}
              whileHover={{ scale: 1.02, y: -2, boxShadow: '0 16px 32px rgba(124,92,191,0.3)' }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              style={{
                width: '100%', border: 'none', cursor: 'pointer', borderRadius: 9999,
                padding: '16px 32px', color: '#fff',
                background: 'linear-gradient(135deg, #7c5cbf 0%, #fc79bd 100%)',
                boxShadow: '0 10px 25px rgba(124,92,191,0.25)',
                fontSize: 20, fontWeight: 600,
                fontFamily: "'Inter', system-ui, sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              Выбрать персонажа
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_right_alt</span>
            </motion.button>

            <button
              onClick={() => navigate('/test')}
              style={{
                width: '100%', border: 'none', cursor: 'pointer',
                background: 'transparent', borderRadius: 9999,
                padding: '12px 32px',
                fontSize: 14, fontWeight: 500, color: '#494551',
                fontFamily: "'Inter', system-ui, sans-serif",
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.color = '#7c5cbf'}
              onMouseLeave={(e) => e.target.style.color = '#494551'}
            >
              Пройти снова
            </button>
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}
