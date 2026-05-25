import { useState, useRef, useCallback, useEffect } from 'react';
import useGameStore from '../store/gameStore';

/**
 * Voice hook: STT via MediaRecorder → ElevenLabs, TTS via ElevenLabs (browser fallback).
 * Works on HTTP and HTTPS — no Web Speech API dependency.
 */
export default function useVoice({ onSpeechEnd, onSpeechEmpty } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking,  setIsSpeaking]  = useState(false);
  const [transcript,  setTranscript]  = useState('');
  const isSupported = !!(navigator.mediaDevices?.getUserMedia);

  const mediaRecorderRef  = useRef(null);
  const chunksRef         = useRef([]);
  const silenceTimerRef   = useRef(null);
  const streamRef         = useRef(null);
  const audioRef          = useRef(null);
  const ttsAbortRef       = useRef(null);
  const vadFrameRef       = useRef(null);
  const onSpeechEndRef    = useRef(onSpeechEnd);
  const onSpeechEmptyRef  = useRef(onSpeechEmpty);

  const character = useGameStore((s) => s.character);

  useEffect(() => { onSpeechEndRef.current = onSpeechEnd; }, [onSpeechEnd]);
  useEffect(() => { onSpeechEmptyRef.current = onSpeechEmpty; }, [onSpeechEmpty]);

  useEffect(() => () => {
    _cleanup();
    audioRef.current?.pause();
  }, []);

  function _cleanup() {
    clearTimeout(silenceTimerRef.current);
    cancelAnimationFrame(vadFrameRef.current);
    if (mediaRecorderRef.current?.state !== 'inactive') {
      try { mediaRecorderRef.current?.stop(); } catch {}
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  // Silence detection via Web Audio AnalyserNode
  function _startVAD(stream, onSilence) {
    try {
      const ctx      = new AudioContext();
      const source   = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const buf           = new Uint8Array(analyser.fftSize);
      let   silentMs      = 0;
      let   lastTs        = performance.now();
      const SILENCE_RMS   = 10;
      const SILENCE_MS    = 1500;

      function tick() {
        vadFrameRef.current = requestAnimationFrame(tick);
        analyser.getByteTimeDomainData(buf);
        const now = performance.now();
        const dt  = now - lastTs;
        lastTs    = now;

        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += Math.abs(buf[i] - 128);
        const rms = sum / buf.length;

        if (rms < SILENCE_RMS) {
          silentMs += dt;
          if (silentMs >= SILENCE_MS) {
            cancelAnimationFrame(vadFrameRef.current);
            onSilence();
          }
        } else {
          silentMs = 0;
        }
      }
      tick();
    } catch {
      // VAD unavailable — max 8s recording
      silenceTimerRef.current = setTimeout(onSilence, 8000);
    }
  }

  async function _sendAudio(blob) {
    try {
      const form = new FormData();
      form.append('audio', blob, 'audio.webm');

      const res = await fetch('/api/voice/stt', { method: 'POST', body: form });
      if (!res.ok) throw new Error('stt_fail');

      const json = await res.json();
      const text = (json.data?.transcript ?? '').trim();
      if (text) {
        setTranscript(text);
        onSpeechEndRef.current?.(text);
      } else {
        // Nothing heard (noise/silence) — notify so overlay can re-listen
        onSpeechEmptyRef.current?.();
      }
    } catch (err) {
      console.warn('[useVoice] STT error:', err.message);
      onSpeechEmptyRef.current?.();
    }
  }

  const startListening = useCallback(async () => {
    if (isListening) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setTranscript('');
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };

      recorder.onstop = async () => {
        setIsListening(false);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        if (blob.size > 1000) await _sendAudio(blob);
      };

      recorder.start(100);
      setIsListening(true);

      _startVAD(stream, () => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      });
    } catch (err) {
      console.warn('[useVoice] mic error:', err.message);
      setIsListening(false);
    }
  }, [isListening, isSupported]);

  const stopListening = useCallback(() => {
    cancelAnimationFrame(vadFrameRef.current);
    clearTimeout(silenceTimerRef.current);
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
    return transcript;
  }, [transcript]);

  const stopSpeaking = useCallback(() => {
    // Abort in-flight TTS fetch so audio doesn't start playing after stop
    ttsAbortRef.current?.abort();
    ttsAbortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (text) => {
    if (!text) return;
    // Force-reset stuck isSpeaking state before starting
    audioRef.current?.pause();
    audioRef.current = null;
    setIsSpeaking(true);

    const abort = new AbortController();
    ttsAbortRef.current = abort;

    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, character: character || 'bro' }),
        signal: abort.signal,
      });

      if (!res.ok) throw new Error('tts_unavailable');

      const blob  = await res.blob();

      if (abort.signal.aborted) { setIsSpeaking(false); return; }

      const url   = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.volume = 1.0;
      audioRef.current = audio;
      ttsAbortRef.current = null;

      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      audio.onerror = (e) => {
        console.warn('[useVoice] audio error:', e);
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };
      audio.play().catch((e) => {
        console.warn('[useVoice] play() blocked:', e.message);
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      });
    } catch (err) {
      ttsAbortRef.current = null;
      if (err.name === 'AbortError') { setIsSpeaking(false); return; }
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang   = 'en-US';
      utt.onend  = () => setIsSpeaking(false);
      utt.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utt);
    }
  }, [isSpeaking, character]);

  return { isListening, isSpeaking, isSupported, transcript, startListening, stopListening, speak, stopSpeaking };
}
