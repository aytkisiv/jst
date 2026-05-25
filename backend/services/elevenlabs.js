const axios = require('axios');

const BASE_URL = 'https://api.elevenlabs.io/v1';

const CHAR_VOICE_SETTINGS = {
  bro:     { stability: 0.35, similarity_boost: 0.75, style: 0.45 },
  roaster: { stability: 0.35, similarity_boost: 0.75, style: 0.45 },
  sensei:  { stability: 0.75, similarity_boost: 0.82, style: 0.15 },
  alex:    { stability: 0.80, similarity_boost: 0.85, style: 0.1  },
  unit7:   { stability: 0.90, similarity_boost: 0.70, style: 0.05 },
};

/**
 * Clean text before TTS: remove markdown, replace blanks with spoken equivalents.
 */
function cleanForTTS(text) {
  return text
    .replace(/_{2,}/g, 'blank')          // ___ → "blank"
    .replace(/\*\*([^*]+)\*\*/g, '$1')   // **bold** → bold
    .replace(/\*([^*]+)\*/g, '$1')       // *italic* → italic
    .replace(/#{1,6}\s/g, '')            // ## headers → plain
    .replace(/`([^`]+)`/g, '$1')         // `code` → code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url) → text
    .trim();
}

/**
 * Stream audio from ElevenLabs TTS API.
 * Uses eleven_turbo_v2_5 for faster response (2-3x faster than multilingual_v2).
 * @param {{ text: string, voiceId: string, character?: string }} params
 */
async function textToSpeech({ text, voiceId, character = 'bro' }) {
  const voiceSettings = CHAR_VOICE_SETTINGS[character.toLowerCase()] ?? CHAR_VOICE_SETTINGS.bro;
  const cleanedText   = cleanForTTS(text);

  try {
    const response = await axios.post(
      `${BASE_URL}/text-to-speech/${voiceId}/stream`,
      {
        text: cleanedText,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: voiceSettings,
      },
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        responseType: 'stream',
        timeout: 15000,
      }
    );
    return response.data;
  } catch (err) {
    console.error(`[elevenlabs] tts failed: ${err.message}`);
    const error = new Error('tts_unavailable');
    error.ttsUnavailable = true;
    throw error;
  }
}

module.exports = { textToSpeech };
