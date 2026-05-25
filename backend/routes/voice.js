const { Router } = require('express');
const rateLimit  = require('express-rate-limit');
const multer     = require('multer');
const FormData   = require('form-data');
const axios      = require('axios');
const { textToSpeech } = require('../services/elevenlabs');

const router  = Router();
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Character → ElevenLabs voice ID (tuned per personality)
const VOICE_MAP = {
  bro:     process.env.VOICE_BRO     || 'TX3LPaxmHKxFdv7VOQHJ', // Liam   — Young, Casual, American
  roaster: process.env.VOICE_ROASTER || 'SOYHLrjzK2X1ezoPC6cr', // Harry  — Fierce, Young, Rough
  sensei:  process.env.VOICE_SENSEI  || 'cjVigY5qzO86Huf0OWal', // Eric   — Smooth, Trustworthy
  alex:    process.env.VOICE_ALEX    || 'onwK4e9ZLuTAKqWW03F9', // Daniel — Steady Broadcaster (British)
  unit7:   process.env.VOICE_UNIT7   || 'pNInz6obpgDQGcFmaJgB', // Adam   — Dominant, Firm (robotic)
};

const voiceRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { data: null, error: 'Rate limit exceeded. Please wait.' },
});

/**
 * POST /api/voice/tts
 * body: { text, character }
 */
router.post('/tts', voiceRateLimit, async (req, res, next) => {
  try {
    const { text, character } = req.body ?? {};
    if (!text || !character) {
      return res.status(400).json({ data: null, error: 'text and character are required' });
    }

    const charKey = character.toLowerCase();
    const voiceId = VOICE_MAP[charKey] ?? VOICE_MAP.bro;
    const stream  = await textToSpeech({ text, voiceId, character: charKey });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    stream.pipe(res);

    stream.on('error', (err) => {
      console.error(`[voice/tts] stream error: ${err.message}`);
      if (!res.headersSent) res.status(502).json({ data: null, error: 'tts_unavailable' });
    });
  } catch (err) {
    if (err.ttsUnavailable) return res.status(502).json({ data: null, error: 'tts_unavailable' });
    next(err);
  }
});

/**
 * POST /api/voice/stt
 * multipart: audio file (webm/ogg/wav)
 * Returns: { data: { transcript: string } }
 */
router.post('/stt', voiceRateLimit, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ data: null, error: 'audio file required' });
    }

    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: 'audio.webm',
      contentType: req.file.mimetype || 'audio/webm',
    });
    form.append('model_id', 'scribe_v1');

    const response = await axios.post(
      'https://api.elevenlabs.io/v1/speech-to-text',
      form,
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          ...form.getHeaders(),
        },
        timeout: 30000,
      }
    );

    const raw = response.data?.text ?? '';
    // Strip ElevenLabs parenthetical sound annotations: (whooshing sound), (music), etc.
    const transcript = raw.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
    console.log(`[voice/stt] raw="${raw}" → transcript="${transcript}" size=${req.file.size}B`);
    return res.json({ data: { transcript }, error: null });
  } catch (err) {
    console.error('[voice/stt] error:', err.response?.data || err.message);
    return res.status(502).json({ data: null, error: 'stt_unavailable' });
  }
});

module.exports = router;
