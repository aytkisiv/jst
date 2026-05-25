import { useState, useCallback, useEffect, useRef } from 'react';
import useGameStore from '../store/gameStore';

export default function useTutor() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const greetedRef = useRef(false);

  const sessionId = useGameStore((s) => s.sessionId);
  const userId    = useGameStore((s) => s.userId);
  const character = useGameStore((s) => s.character);
  const addXP     = useGameStore((s) => s.addXP);
  const setMood   = useGameStore((s) => s.setMood);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    const userMsg = { id: Date.now(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    const tutorId = Date.now() + 1;
    setMessages((prev) => [...prev, { id: tutorId, role: 'tutor', content: '', streaming: true }]);

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
          character: character || 'bro',
          history: messages.map((m) => ({
            role: m.role === 'tutor' ? 'assistant' : m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let event;
          try { event = JSON.parse(line.slice(6)); } catch { continue; }

          if (event.type === 'delta') {
            setMessages((prev) => prev.map((m) =>
              m.id === tutorId ? { ...m, content: m.content + event.text } : m
            ));
          } else if (event.type === 'done') {
            const d = event.data ?? {};
            setMessages((prev) => prev.map((m) =>
              m.id === tutorId ? {
                ...m,
                content: d.reply ?? m.content,
                streaming: false,
                mood: d.mood ?? 'happy',
                is_correct: d.is_correct ?? true,
                correction: d.correction ?? null,
                check_question: d.check_question ?? null,
                xp_earned: d.xp_earned ?? 0,
              } : m
            ));
            if (d.mood) setMood(d.mood);
            if (d.xp_earned > 0) {
              addXP(d.xp_earned);
              fetch('/api/progress/xp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, message_id: tutorId, amount: d.xp_earned }),
              }).catch(() => {});
            }
          } else if (event.type === 'error') {
            throw new Error(event.message);
          }
        }
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tutorId));
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [messages, sessionId, userId, character, isLoading, addXP, setMood]);

  useEffect(() => {
    if (!sessionId || greetedRef.current) return;
    greetedRef.current = true;
    sendMessage('Start the lesson. Greet me and give me the first task.');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return { messages, isLoading, error, sendMessage };
}
