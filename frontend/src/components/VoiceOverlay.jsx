import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useVoice from '../hooks/useVoice';
import useGameStore from '../store/gameStore';
import renderMd from '../utils/renderMd';

import broImg     from '../assets/characters/bro.png';
import roasterImg from '../assets/characters/roaster.png';
import senseiImg  from '../assets/characters/sensei.png';
import alexImg    from '../assets/characters/alex.png';
import unit7Img   from '../assets/characters/unit7.png';

const CHAR_IMAGES = { bro: broImg, roaster: roasterImg, sensei: senseiImg, alex: alexImg, unit7: unit7Img };
const CHAR_NAME   = { bro: 'Bro', roaster: 'Roaster', sensei: 'Sensei', alex: 'Alex', unit7: 'Unit-7' };

const CSS = `
  @keyframes voicePulseRing {
    0%   { transform:translate(-50%,-50%) scale(1);   opacity:.75; }
    100% { transform:translate(-50%,-50%) scale(2.2); opacity:0;   }
  }
  @keyframes voiceSoundWave {
    0%,100% { height:6px; }
    50%     { height:22px; }
  }
  @keyframes voicePulseDot { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes voiceOrbPulse {
    0%,100% { box-shadow:0 0 40px rgba(124,92,191,.5); }
    50%     { box-shadow:0 0 70px rgba(124,92,191,.9),0 0 110px rgba(252,121,189,.4); }
  }
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes voiceListenPulse {
    0%,100% { box-shadow:0 0 30px rgba(252,121,189,.4); }
    50%     { box-shadow:0 0 60px rgba(252,121,189,.8),0 0 90px rgba(124,92,191,.3); }
  }
  .vo-ring{position:absolute;width:128px;height:128px;left:50%;top:50%;border-radius:50%;transform-origin:center;pointer-events:none;}
  .vo-ring-1{animation:voicePulseRing 2s cubic-bezier(.4,0,.6,1) infinite 0s;}
  .vo-ring-2{animation:voicePulseRing 2s cubic-bezier(.4,0,.6,1) infinite .65s;}
  .vo-ring-3{animation:voicePulseRing 2s cubic-bezier(.4,0,.6,1) infinite 1.3s;}
  .vo-bar-1{animation:voiceSoundWave 1s ease-in-out infinite;}
  .vo-bar-2{animation:voiceSoundWave 1.2s ease-in-out infinite .2s;}
  .vo-bar-3{animation:voiceSoundWave .9s ease-in-out infinite .4s;}
  .vo-bar-4{animation:voiceSoundWave 1.1s ease-in-out infinite .1s;}
  .vo-dot{animation:voicePulseDot 2s cubic-bezier(.4,0,.6,1) infinite;}
  .vo-orb-speaking{animation:voiceOrbPulse 1.4s ease-in-out infinite;}
  .vo-orb-listening{animation:voiceListenPulse 1.4s ease-in-out infinite;}
  .vo-spinner{animation:spin 1s linear infinite;border-radius:50%;border:3px solid rgba(255,255,255,.2);border-top-color:white;}
  .vo-side-btn{color:rgba(255,255,255,.6);transition:color .2s;background:none;border:none;cursor:pointer;padding:0;}
  .vo-side-btn:hover{color:white;}
  .vo-side-btn:hover .vo-side-circle{background:rgba(255,255,255,.12);}
  .vo-side-circle{width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;transition:background .2s;}
  .vo-end-btn{background:none;border:none;cursor:pointer;padding:0;transition:transform .15s;transform:translateY(-20px);display:flex;flex-direction:column;align-items:center;gap:12px;}
  .vo-end-btn:hover{transform:translateY(-24px) scale(1.05);}
  .vo-end-btn:active{transform:translateY(-24px) scale(.95);}
`;

/*
  STATE MACHINE:
  ┌─────────────────────────────────────────────────────────┐
  │  idle ──► speaking ──► listening ──► processing          │
  │             ▲               │              │             │
  │             └───────────────┘ (new msg)    │             │
  │                                            ▼             │
  │                                         speaking         │
  │                                                          │
  │  INTERRUPT: tap orb while speaking → stop → listening   │
  └─────────────────────────────────────────────────────────┘
*/

const MicIcon = ({ size = 46 }) => (
  <svg viewBox="0 0 24 24" fill="white" width={size} height={size}>
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16c-2.47 0-4.52-1.8-4.93-4.15-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V21c0 .55.45 1 1 1s1-.45 1-1v-3.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" width="34" height="34">
    <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
);

const KeyboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M20 5H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/>
  </svg>
);

// Multipliers per bar give a natural uneven waveform shape
const BAR_MULTS = [0.5, 0.85, 1.0, 0.9, 0.6, 0.75, 0.45];

function AudioBars({ level }) {
  const MIN_H = 4;
  const MAX_H = 26;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, height: 30, verticalAlign: 'middle' }}>
      {BAR_MULTS.map((m, i) => (
        <span key={i} style={{
          display: 'block',
          width: 4,
          borderRadius: 9999,
          background: 'linear-gradient(to top, #7c5cbf, #fc79bd)',
          height: `${MIN_H + (MAX_H - MIN_H) * (level / 100) * m}px`,
          transition: 'height 80ms ease-out',
          opacity: 0.5 + 0.5 * (level / 100),
        }} />
      ))}
    </span>
  );
}

/**
 * Two-way voice dialog overlay.
 * Props:
 *   onSend(text)    — send user message to tutor
 *   onClose()       — close overlay
 *   lastTutorMsg    — latest tutor message object from useTutor
 *   isLoading       — tutor is generating a response
 */
export default function VoiceOverlay({ onSend, onClose, lastTutorMsg = null, isLoading = false }) {
  // ── state ──────────────────────────────────────────────
  const [phase, setPhase]         = useState('idle');
  // 'idle' | 'speaking' | 'listening' | 'processing' | 'error'
  const [tutorText, setTutorText] = useState(lastTutorMsg?.content ?? '');
  const [userText,  setUserText]  = useState('');
  const [seconds,   setSeconds]   = useState(0);
  const [micError,  setMicError]  = useState('');
  const [listenMode, setListenMode] = useState('auto'); // 'auto' | 'hold'


  const timerRef        = useRef(null);
  const lastMsgId       = useRef(lastTutorMsg?.id ?? null);
  const sentRef         = useRef(false);
  const hasSpokenRef    = useRef(false);
  const emptyRetryRef   = useRef(0);
  const listenModeRef   = useRef(listenMode); // always-current ref for effects

  useEffect(() => { listenModeRef.current = listenMode; }, [listenMode]);

  const character = useGameStore((s) => s.character) ?? 'bro';
  const charName  = CHAR_NAME[character]  ?? 'Bro';
  const charImg   = CHAR_IMAGES[character] ?? broImg;

  // ── voice hook ─────────────────────────────────────────
  const {
    isListening, isSpeaking, isSupported, transcript, audioLevel,
    startListening, stopListening, speak, stopSpeaking,
  } = useVoice({
    onSpeechEnd: (text) => {
      emptyRetryRef.current = 0;
      setUserText(text);
      setPhase('processing');
      sentRef.current      = true;
      hasSpokenRef.current = true;
      onSend(text);
    },
    onSpeechEmpty: () => {
      emptyRetryRef.current += 1;
      if (emptyRetryRef.current <= 3) {
        doListen();
      } else {
        // Too many empties in a row — go idle so user can tap to retry
        emptyRetryRef.current = 0;
        setPhase('idle');
      }
    },
  });

  // ── helpers ────────────────────────────────────────────
  function doSpeak(text) {
    if (!text) { doListen(); return; }
    setPhase('speaking');
    speak(text);
  }

  async function doListen({ noVAD = false } = {}) {
    setMicError('');
    setPhase('listening');
    try {
      if (!navigator.mediaDevices) throw new Error('HTTP_BLOCKED');
      await startListening({ noVAD });
    } catch (err) {
      const msg = err.message?.includes('HTTP_BLOCKED')
        ? 'Open the site via https:// — microphone requires a secure connection'
        : err.name === 'NotAllowedError' || err.message?.includes('Permission')
        ? 'Microphone access denied — allow it in browser settings'
        : `Mic error: ${err.message}`;
      setMicError(msg);
      setPhase('error');
    }
  }

  // Hold mode: called on pointerUp / pointerLeave — stops recording and sends immediately
  function handleHoldEnd() {
    if (listenMode !== 'hold' || phase !== 'listening') return;
    stopListening();
    setPhase('processing');
  }

  // ── lifecycle ──────────────────────────────────────────
  // Inject CSS + start timer
  useEffect(() => {
    const tag = document.createElement('style');
    tag.id = 'voice-overlay-css';
    tag.textContent = CSS;
    document.head.appendChild(tag);

    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);

    return () => {
      tag.remove();
      clearInterval(timerRef.current);
      stopSpeaking();
      stopListening();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On open: auto mode → start listening; hold mode → wait for user to press orb
  useEffect(() => {
    if (listenModeRef.current === 'auto') doListen();
    else setPhase('idle');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Speaking finished naturally → auto: start listening; hold: go idle (user initiates)
  useEffect(() => {
    if (!isSpeaking && phase === 'speaking') {
      if (listenModeRef.current === 'auto') doListen();
      else setPhase('idle');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpeaking]);

  // New tutor message arrived → speak it (only after user has spoken first)
  useEffect(() => {
    if (!lastTutorMsg || lastTutorMsg.id === lastMsgId.current) return;
    lastMsgId.current = lastTutorMsg.id;
    sentRef.current   = false;
    setTutorText(lastTutorMsg.content);
    setUserText('');
    // Don't speak if user hasn't initiated voice conversation yet
    if (hasSpokenRef.current) {
      doSpeak(lastTutorMsg.content);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastTutorMsg]);

  // ── orb tap handler ────────────────────────────────────
  function handleOrbTap() {
    if (listenMode === 'hold') {
      // In hold mode tap = interrupt speaking only
      if (phase === 'speaking') { stopSpeaking(); setPhase('idle'); }
      return;
    }
    // Auto mode
    if (phase === 'speaking') {
      stopSpeaking();
      doListen();
    } else if (phase === 'listening') {
      stopListening();
      setPhase('idle');
    } else if (phase === 'idle' || phase === 'error') {
      doListen();
    }
  }

  function handleOrbPointerDown(e) {
    if (listenMode !== 'hold') return;
    e.preventDefault();
    if (phase === 'speaking') stopSpeaking();
    if (phase !== 'listening') doListen({ noVAD: true });
  }

  // ── UI helpers ─────────────────────────────────────────
  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const HEADINGS = {
    speaking:   `${charName} is speaking…`,
    listening:  listenMode === 'hold' ? 'Recording…' : `${charName} is listening…`,
    processing: 'Thinking…',
    idle:       listenMode === 'hold' ? 'Hold orb to speak' : 'Tap orb to speak',
    error:      'Microphone error',
  };

  const ORB_HINT = {
    speaking:   'Tap to interrupt',
    listening:  listenMode === 'hold' ? 'Release to send' : 'Tap to stop',
    processing: '',
    idle:       listenMode === 'hold' ? 'Hold orb → release to send' : 'Tap to speak',
    error:      listenMode === 'hold' ? 'Hold to retry' : 'Tap to retry',
  };

  const orbGradient = {
    speaking:   'linear-gradient(135deg,#7c5cbf 0%,#fc79bd 100%)',
    listening:  'linear-gradient(135deg,#c43080 0%,#fc79bd 100%)',
    processing: 'linear-gradient(135deg,#3a3a5a 0%,#5a4a7a 100%)',
    idle:       'linear-gradient(135deg,#4a3a7a 0%,#7c5cbf 100%)',
  };

  // ── render ─────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        position:'fixed', inset:0, zIndex:9999,
        backgroundColor:'rgba(10,6,20,0.94)',
        backdropFilter:'blur(30px)',
        display:'flex', flexDirection:'column',
        color:'white', fontFamily:'Inter,sans-serif',
        paddingTop:'max(24px, env(safe-area-inset-top))',
        paddingLeft:'max(20px, env(safe-area-inset-left))',
        paddingRight:'max(20px, env(safe-area-inset-right))',
        paddingBottom:0,
        overflowY:'auto',
      }}>

      {/* bg glow */}
      <div style={{ position:'absolute', top:'38%', left:'50%', transform:'translate(-50%,-50%)', width:560, height:560, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,92,191,.18) 0%,rgba(252,121,189,.06) 50%,transparent 70%)', filter:'blur(60px)', pointerEvents:'none', zIndex:0 }} />

      {/* ── TOP BAR ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'relative', zIndex:20 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* badge */}
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.18)', borderRadius:9999, padding:'6px 16px', backdropFilter:'blur(12px)' }}>
            <span className="vo-dot" style={{ width:8, height:8, borderRadius:'50%', background:'#fc79bd', display:'block', flexShrink:0 }} />
            <span style={{ fontSize:11, letterSpacing:'.09em', fontWeight:600, color:'rgba(255,255,255,.9)', textTransform:'uppercase' }}>Voice Mode · Active</span>
          </div>
          {/* heading */}
          <AnimatePresence mode="wait">
            <motion.h2
              key={HEADINGS[phase]}
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
              transition={{ duration:.2 }}
              style={{ margin:0, fontSize:'clamp(18px, 5vw, 26px)', fontWeight:700, color:'white', letterSpacing:'-.01em' }}>
              {HEADINGS[phase]}
            </motion.h2>
          </AnimatePresence>
        </div>
        {/* timer */}
        <div style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:9999, padding:'8px 18px', fontSize:15, color:'rgba(255,255,255,.6)', fontVariantNumeric:'tabular-nums' }}>
          {formatTime(seconds)}
        </div>
      </div>

      {/* ── CENTER ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', width:'100%', maxWidth:640, margin:'0 auto', position:'relative', zIndex:10, gap:20, minHeight:0 }}>

        {/* Orb */}
        <div style={{ position:'relative', width:200, height:200, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {/* listening rings */}
          <AnimatePresence>
            {phase === 'listening' && (
              <>
                <span className="vo-ring vo-ring-1" style={{ border:'2px solid rgba(252,121,189,.5)' }} />
                <span className="vo-ring vo-ring-2" style={{ border:'2px solid rgba(124,92,191,.35)' }} />
                <span className="vo-ring vo-ring-3" style={{ border:'2px solid rgba(119,92,199,.15)' }} />
              </>
            )}
          </AnimatePresence>

          {/* orb button */}
          <motion.button
            className={phase === 'speaking' ? 'vo-orb-speaking' : phase === 'listening' ? 'vo-orb-listening' : ''}
            animate={phase === 'speaking' ? { scale:[1,1.05,1] } : { scale:1 }}
            transition={phase === 'speaking' ? { duration:1.4, repeat:Infinity, ease:'easeInOut' } : { duration:.2 }}
            onClick={handleOrbTap}
            onPointerDown={handleOrbPointerDown}
            onPointerUp={handleHoldEnd}
            onPointerLeave={handleHoldEnd}
            style={{
              position:'relative', zIndex:10,
              width:136, height:136, borderRadius:'50%',
              background: orbGradient[phase],
              border:'none', cursor: phase === 'processing' ? 'default' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 40px rgba(124,92,191,.5)',
              outline:'none',
            }}>
            {phase === 'processing'
              ? <div className="vo-spinner" style={{ width:44, height:44 }} />
              : <MicIcon />
            }
          </motion.button>
        </div>

        {/* Interrupt hint — prominent when speaking */}
        <AnimatePresence mode="wait">
          {phase === 'speaking' ? (
            <motion.button
              key="interrupt"
              initial={{ opacity:0, scale:.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:.9 }}
              onClick={handleOrbTap}
              style={{ margin:'-16px 0 0', background:'rgba(252,121,189,.15)', border:'1px solid rgba(252,121,189,.4)', borderRadius:9999, padding:'8px 20px', color:'#fc79bd', fontSize:13, fontWeight:700, cursor:'pointer', letterSpacing:'.03em' }}>
              ✋ Tap to interrupt
            </motion.button>
          ) : ORB_HINT[phase] ? (
            <motion.p
              key={ORB_HINT[phase]}
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ margin:'-16px 0 0', fontSize:13, color:'rgba(255,255,255,.4)', fontStyle:'italic' }}>
              {ORB_HINT[phase]}
            </motion.p>
          ) : null}
        </AnimatePresence>

        {/* Dialog card */}
        <div style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:16, overflow:'hidden', backdropFilter:'blur(24px)', boxShadow:'0 24px 48px -12px rgba(0,0,0,.6)' }}>

          {/* Tutor row */}
          <div style={{ padding:'20px 20px', display:'flex', gap:14 }}>
            <img src={charImg} alt={charName} style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', objectPosition:'center 12%', border:'2px solid #7c5cbf', flexShrink:0 }} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,.5)' }}>{charName}</span>
                {phase === 'speaking' && (
                  <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:16 }}>
                    <span className="vo-bar-1" style={{ width:4, borderRadius:9999, background:'#fc79bd', display:'block' }} />
                    <span className="vo-bar-2" style={{ width:4, borderRadius:9999, background:'#7c5cbf', display:'block' }} />
                    <span className="vo-bar-3" style={{ width:4, borderRadius:9999, background:'#775cc7', display:'block' }} />
                    <span className="vo-bar-4" style={{ width:4, borderRadius:9999, background:'#ffafd3', display:'block' }} />
                  </div>
                )}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={tutorText.slice(0, 40)}
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  transition={{ duration:.18 }}
                  style={{ margin:0, fontSize:14, lineHeight:'22px', color:'rgba(255,255,255,.85)', wordBreak:'break-word' }}>
                  {tutorText ? renderMd(tutorText, 'dark') : '"Say something to begin…"'}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height:1, background:'rgba(255,255,255,.08)', margin:'0 20px' }} />

          {/* User row / error */}
          <div style={{ padding:'16px 20px', display:'flex', gap:14, minHeight:64, alignItems:'flex-start' }}>
            <div style={{ width:44, height:44, borderRadius:'50%', background: phase === 'error' ? 'rgba(186,26,26,.4)' : 'linear-gradient(135deg,#6343a4,#fc79bd)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
              {phase === 'error' ? '⚠️' : '🎙'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <span style={{ fontSize:12, fontWeight:600, color: phase === 'error' ? '#ff8a80' : 'rgba(255,255,255,.5)', display:'block', marginBottom:6 }}>
                {phase === 'error' ? 'Error' : 'You'}
              </span>
              <p style={{ margin:0, fontSize:14, lineHeight:'22px', wordBreak:'break-word',
                color: phase === 'error' ? '#ff8a80' : userText ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.3)',
                fontStyle: userText || phase === 'error' ? 'normal' : 'italic' }}>
                {phase === 'error'
                  ? micError
                  : userText
                  ? userText
                  : phase === 'listening'
                  ? <AudioBars level={audioLevel} />
                  : phase === 'processing'
                  ? 'Sending…'
                  : 'Speak after the chime…'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ── */}
      <div style={{ width:'100%', maxWidth:448, margin:'0 auto', paddingTop:24, paddingBottom:'max(32px, env(safe-area-inset-bottom))', display:'flex', justifyContent:'space-between', alignItems:'center', position:'relative', zIndex:20 }}>

        {/* Switch to text */}
        <button className="vo-side-btn" onClick={onClose} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
          <div className="vo-side-circle"><KeyboardIcon /></div>
          <span style={{ fontSize:12, fontWeight:600 }}>Switch to text</span>
        </button>

        {/* End voice + mode toggle stacked */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
          {/* Auto / Hold toggle */}
          <div style={{ display:'flex', background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.15)', borderRadius:9999, padding:3, gap:2 }}>
            {['auto','hold'].map((m) => (
              <button key={m} onClick={() => setListenMode(m)} style={{
                background: listenMode === m ? 'rgba(124,92,191,.7)' : 'none',
                border: 'none', borderRadius:9999,
                padding:'4px 14px', fontSize:11, fontWeight:700,
                color: listenMode === m ? 'white' : 'rgba(255,255,255,.45)',
                cursor:'pointer', textTransform:'uppercase', letterSpacing:'.06em',
                transition:'all .15s',
              }}>{m}</button>
            ))}
          </div>

        {/* End voice */}
        <button className="vo-end-btn" onClick={onClose}>
          <div style={{ width:80, height:80, borderRadius:'50%', background:'#ba1a1a', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 12px 32px rgba(186,26,26,.4)', border:'1px solid rgba(255,255,255,.15)' }}>
            <CloseIcon />
          </div>
          <span style={{ fontSize:14, fontWeight:600, color:'#ffdad6' }}>End voice</span>
        </button>
        </div>

        {/* Skip / speak now */}
        <button className="vo-side-btn"
          onClick={() => {
            if (phase === 'speaking') { stopSpeaking(); doListen(); }
            else if (phase === 'listening') { stopListening(); setPhase('idle'); }
            else if (phase === 'idle') doListen();
          }}
          style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
          <div className="vo-side-circle" style={phase === 'listening' ? { background:'rgba(186,26,26,.2)', borderColor:'rgba(186,26,26,.5)' } : {}}>
            <MicIcon size={24} />
          </div>
          <span style={{ fontSize:12, fontWeight:600 }}>
            {phase === 'listening' ? 'Stop' : phase === 'speaking' ? 'Skip' : 'Speak'}
          </span>
        </button>
      </div>
    </motion.div>
  );
}
