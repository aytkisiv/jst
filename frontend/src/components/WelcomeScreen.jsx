import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Character images directly from Stitch project
const CHARACTERS = [
  {
    name: 'Bro',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuANyw0YhtljKfcb_S-ldp1Yo2sPbKbW7ubPUNSGNsNm-ka0g447ceaO9HInvcdPVQLhEkHtV1fZJEmz95Urug44x56XwPXgn2FeA5ZarQ6dHdI120VLs5lhCunFeIdS7JgHLNhU1b2AfKM3ybbkbdZwzyBWosBcR_CYv_4DuvMn3kbBFIw4CAZTJLHjiPVavKBinpSMtWXQIMyhN2ufMbB3E48jP8cjHGRAmYG15WxmwEz7Jt589WNsVfaNpOcPEgB2YznVN6puE_w',
    glow: 'rgba(124,92,191,0.35)',
    anim: 'floating',
  },
  {
    name: 'Roaster',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEbTIIadNYYw5yMPwa3gHG9vmTDrlSSv4dSOWx_rG-n95_moE51LyGqpoCljA4Ujfn9lwsZ5z_tzV3EtDlJ1A8NIPiRBjiNWqGGox79YLplVLNWarGM9xGzOvb93GDZKZULd8K6M43xE48yDSnT83L8CIfN45FgUuAS9bWreKV1BIqdONdkfbgfSqEdTEzHu2R2pegXSxJXe1mBk2va_QKufR11l5Pz6K-UQmRqdF9ARK7oqtK7a-XRXaNSgQipC2vHkxkUpNZfVM',
    glow: 'rgba(252,121,189,0.35)',
    anim: 'floating-delayed-1',
  },
  {
    name: 'Sensei',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1u_rAiRMVqyDBgJX0oyzHPkunsEGCSzE0su-mLWKmEjF2b0TIxAwy6rB_hhnWhEckblyBSCM8PoONwwE8Na1FM9n1MNWUqnslF1Un4hyutekNeqlvSKpjp_54KcNG5QVC1g6gOkhD8wpftRFK0FGMJkv8UnGlDbdUqkQqsSunsVoGZhIJlwV_nz94Wt8LIb7maP9yf9BKZCmv-SDtxB0HxNKw56-UU34J-VteMz1xPg863VgmjDPRSL0xQcEFTsUti6tTwdJi8uA',
    glow: 'rgba(164,48,115,0.30)',
    anim: 'floating-delayed-2',
  },
  {
    name: 'Unit-7',
    src: 'https://lh3.googleusercontent.com/aida/ADBb0ujsnbfEPaW9VFj-ea1GQg-Z3JOqcVrL5hfbuSPOhqrUvFNCCUcYVVGatW0vQnyscUihKozUk-X6gw7k3YbnF4GRtUsUqsveASjCezgqfFMDnadrGrDQHRn0UuFv0XHLaju7DFwz5ENcoo9cLdzJC6uL2dL8Ru7wkhZYh6cGG74gkr5bOuCm7RIz1pRXWrkYANEGiDUpiT8Lz3lAJ8zDxJVupQxltKpLHsoyO6B1Iaz3FsWz2HxIhCrpzbOT7IPfHTVHyOQKRQojXA',
    glow: 'rgba(95,66,172,0.30)',
    anim: 'floating',
  },
  {
    name: 'Alex',
    src: 'https://lh3.googleusercontent.com/aida/ADBb0uhAvZUladZerR-GKAJ5IyMV3v5QFFvE6GXrYbkRtx2KvAL_HJLmI-QKue2UeLZDWTuOSfq7NRq1znF4Aiuj7N-D9xJ8Al4ov97Hgl4wKvOWEAic0LToL9_HRh0hHiuGKKYWm0MLeX1j9GGphBnCdlp5TgYGWqjh5El2hP-AjuxWzDz6-ZmxSA7FJEPMs2T8F7FBjFVJmJCWCjmfNfX5M0nInlkR3VHlc2r8qkzUiyT8xbmwMjQKPTV39jRMqKlWqx-URfBzYqxSRg',
    glow: 'rgba(124,92,191,0.25)',
    anim: 'floating-delayed-1',
  },
];

/**
 * Landing screen — 1:1 with Stitch "Welcome Screen (RU High Fidelity)".
 * Navigates to /test on CTA click.
 */
export default function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @keyframes floating {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes floating-delayed-1 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes floating-delayed-2 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%   { box-shadow: 0 15px 35px rgba(124,92,191,0.25), 0 0 0 0 rgba(124,92,191,0.4); }
          70%  { box-shadow: 0 15px 35px rgba(124,92,191,0.25), 0 0 0 15px rgba(124,92,191,0); }
          100% { box-shadow: 0 15px 35px rgba(124,92,191,0.25), 0 0 0 0 rgba(124,92,191,0); }
        }
        .floating      { animation: floating 4s ease-in-out infinite; }
        .floating-delayed-1 { animation: floating-delayed-1 4.5s ease-in-out infinite 0.5s; }
        .floating-delayed-2 { animation: floating-delayed-2 3.8s ease-in-out infinite 1s; }
        .pulse-glow    { animation: pulse-glow 2.5s ease-in-out infinite; }
        .glass-panel {
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.5);
        }
      `}</style>

      {/* Base white */}
      <div style={{ position: 'fixed', inset: 0, zIndex: -2, background: '#fff' }} />

      {/* Mesh gradient */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: -1,
        backgroundImage: `
          radial-gradient(at 0% 50%, rgba(124,92,191,0.4) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(252,121,189,0.4) 0px, transparent 50%)
        `,
        opacity: 0.8,
        mixBlendMode: 'multiply',
      }} />

      {/* Grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px)',
        backgroundSize: '8.33% 100%',
        opacity: 0.5,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 10,
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '64px 20px',
        fontFamily: "'Inter', system-ui, sans-serif",
        color: '#0b1c30',
        overflowX: 'hidden',
      }}>

        {/* Header */}
        <header style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '24px 80px',
        }}>
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}
          >
            <span style={{ fontSize: 32, fontWeight: 800, color: '#7c5cbf', letterSpacing: '-0.01em', lineHeight: '40px' }}>
              just to study
            </span>
            <span style={{ fontSize: 16, color: '#494551', display: 'none' }}>просто учиться</span>
          </motion.div>

          <motion.div
            className="glass-panel"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }}
            style={{
              borderRadius: 9999, padding: '8px 16px',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(124,92,191,0.08)',
              fontSize: 12, fontWeight: 600, color: '#494551',
            }}
          >
            🇷🇺 RU · 🇬🇧 EN
          </motion.div>
        </header>

        {/* Main content */}
        <main style={{
          width: '100%', maxWidth: 768,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', textAlign: 'center',
          gap: 40,
        }}>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.15 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <h1 style={{
              fontSize: 48, lineHeight: '56px', fontWeight: 700,
              letterSpacing: '-0.02em', margin: 0, color: '#0b1c30',
            }}>
              Твой AI-репетитор.{' '}
              <br />
              <span style={{
                backgroundImage: 'linear-gradient(to right, #7c5cbf, #fc79bd)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Всегда на связи.
              </span>
            </h1>
            <p style={{ fontSize: 18, lineHeight: '28px', color: '#494551', margin: 0, maxWidth: 480, alignSelf: 'center' }}>
              Учи английский через живой разговор — без скучных учебников.
            </p>
          </motion.div>

          {/* Characters — equal height row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.25 }}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 }}
          >
            {CHARACTERS.map((c, i) => (
              <div key={c.name} className={c.anim} style={{ position: 'relative', cursor: 'pointer' }}>
                {/* Glow behind */}
                <div style={{
                  position: 'absolute', inset: -4, borderRadius: '50%',
                  background: c.glow, filter: 'blur(16px)', opacity: 0.6,
                  transition: 'opacity 0.3s',
                }} />
                <div style={{
                  width: i === 2 ? 80 : 64,
                  height: i === 2 ? 80 : 64,
                  borderRadius: '50%', overflow: 'hidden',
                  border: '2px solid rgba(255,255,255,0.8)',
                  boxShadow: `0 10px 30px ${c.glow}`,
                  position: 'relative', zIndex: 1,
                  background: '#fff',
                }}>
                  <img
                    src={c.src} alt={c.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', transform: 'scale(1.1)' }}
                  />
                </div>
              </div>
            ))}
          </motion.div>

          {/* Social proof */}
          <motion.div
            className="glass-panel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.35 }}
            style={{
              borderRadius: 9999, padding: '8px 24px',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              boxShadow: '0 10px 30px rgba(124,92,191,0.05)',
            }}
          >
            <div style={{ display: 'flex', color: '#fc79bd' }}>
              {[...Array(5)].map((_, i) => (
                <span key={i} className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>star</span>
              ))}
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#494551', marginLeft: 4 }}>
              Уже учатся 2 400+ человек
            </span>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.42 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
          >
            <motion.button
              onClick={() => navigate('/test')}
              className="pulse-glow"
              whileHover={{ scale: 1.05, boxShadow: '0 20px 45px rgba(124,92,191,0.35)' }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              style={{
                background: 'linear-gradient(to right, #7c5cbf, #fc79bd)',
                color: '#fff', border: 'none', cursor: 'pointer',
                borderRadius: 9999,
                padding: '16px 40px',
                fontSize: 20, lineHeight: '28px', fontWeight: 600,
                fontFamily: "'Inter', system-ui, sans-serif",
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              Начать бесплатно
              <span className="material-symbols-outlined" style={{ fontSize: 22, transition: 'transform 0.2s' }}>
                arrow_forward
              </span>
            </motion.button>

            <span style={{ fontSize: 12, fontWeight: 600, color: '#7b7583' }}>
              Без регистрации · Бесплатно
            </span>
          </motion.div>

        </main>
      </div>
    </>
  );
}
