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
  const [audioLevel,  setAudioLevel]  = useState(0); // 0-100, live RMS during recording
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

      const buf             = new Uint8Array(analyser.fftSize);
      let   silentMs        = 0;
      let   lastTs          = performance.now();
      const SILENCE_RMS     = 10;
      const SILENCE_MS      = 2200;  // longer pause before cutting off
      const MIN_RECORD_MS   = 800;   // don't trigger VAD in first 800ms
      const startTs         = performance.now();

      function tick() {
        vadFrameRef.current = requestAnimationFrame(tick);
        analyser.getByteTimeDomainData(buf);
        const now = performance.now();
        const dt  = now - lastTs;
        lastTs    = now;

        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += Math.abs(buf[i] - 128);
        const rms = sum / buf.length;

        // Skip VAD in the first MIN_RECORD_MS to avoid cutting off fast starters
        setAudioLevel(Math.min(100, Math.round((rms / 35) * 100)));

        if (now - startTs < MIN_RECORD_MS) return;

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

  /**
   * Start recording. Pass { noVAD: true } for push-to-talk mode —
   * recording continues until stopListening() is called manually.
   */
  const startListening = useCallback(async ({ noVAD = false } = {}) => {
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
        setAudioLevel(0);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        if (blob.size > 1000) await _sendAudio(blob);
      };

      recorder.start(100);
      setIsListening(true);

      if (!noVAD) {
        _startVAD(stream, () => {
          if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        });
      }
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
      if (abort.signal.aborted) { setIsSpeaking(false); return; }

      // Try streaming playback via MediaSource — starts audio before full download
      const streamed = await _playStreaming(res, abort.signal);
      if (!streamed) {
        // Fallback: wait for full blob (older browsers)
        const blob = await res.blob();
        if (abort.signal.aborted) { setIsSpeaking(false); return; }
        const url   = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.volume = 1.0;
        audioRef.current = audio;
        ttsAbortRef.current = null;
        audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
        audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
        audio.play().catch(() => setIsSpeaking(false));
      }
    } catch (err) {
      ttsAbortRef.current = null;
      if (err.name === 'AbortError') { setIsSpeaking(false); return; }
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang    = 'en-US';
      utt.onend   = () => setIsSpeaking(false);
      utt.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utt);
    }
  }, [character]);

  // Stream TTS audio via MediaSource — plays as chunks arrive instead of waiting for full blob.
  // Returns true if streaming succeeded, false if MSE not available/supported.
  async function _playStreaming(res, abortSignal) {
    if (!window.MediaSource || !MediaSource.isTypeSupported('audio/mpeg')) return false;

    return new Promise((resolve) => {
      const mediaSource = new MediaSource();
      const url         = URL.createObjectURL(mediaSource);
      const audio       = new Audio(url);
      audio.volume      = 1.0;
      audioRef.current  = audio;
      ttsAbortRef.current = null;

      mediaSource.addEventListener('sourceopen', async () => {
        let sourceBuffer;
        try {
          sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
        } catch {
          URL.revokeObjectURL(url);
          resolve(false);
          return;
        }

        const reader = res.body.getReader();
        let playStarted = false;

        const appendChunk = (chunk) => new Promise((done) => {
          const doAppend = () => {
            try { sourceBuffer.appendBuffer(chunk); } catch { done(); return; }
            sourceBuffer.addEventListener('updateend', done, { once: true });
          };
          sourceBuffer.updating ? sourceBuffer.addEventListener('updateend', doAppend, { once: true }) : doAppend();
        });

        try {
          while (!abortSignal?.aborted) {
            const { done, value } = await reader.read();
            if (done) {
              // Wait for any pending append before closing
              if (sourceBuffer.updating) {
                await new Promise((d) => sourceBuffer.addEventListener('updateend', d, { once: true }));
              }
              mediaSource.endOfStream();
              break;
            }
            await appendChunk(value);
            // Start playback as soon as first chunk is buffered
            if (!playStarted) {
              playStarted = true;
              audio.play().catch(() => {});
            }
          }

          if (abortSignal?.aborted) {
            audio.pause();
            URL.revokeObjectURL(url);
            setIsSpeaking(false);
            return;
          }

          audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
          audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
          resolve(true);
        } catch {
          URL.revokeObjectURL(url);
          resolve(false);
        }
      }, { once: true });

      // If sourceopen never fires, fall back
      setTimeout(() => {
        if (mediaSource.readyState !== 'open') { URL.revokeObjectURL(url); resolve(false); }
      }, 3000);
    });
  }

  return { isListening, isSpeaking, isSupported, transcript, audioLevel, startListening, stopListening, speak, stopSpeaking };
}
