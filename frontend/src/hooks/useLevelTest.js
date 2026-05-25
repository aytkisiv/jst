import { useState, useCallback, useRef } from 'react';
import useGameStore from '../store/gameStore';

const API = '/api';

const INITIAL_STATE = {
  pools: { easy: [], medium: [], hard: [] },
  questions: [],   // the 6 questions shown to user (selected adaptively)
  currentIndex: 0,
  answers: [],
  isLoading: false,
  result: null,
  error: null,
};

// Adaptive difficulty: correct→harder, wrong→easier
const NEXT_DIFFICULTY = {
  correct: { easy: 'medium', medium: 'hard', hard: 'hard' },
  wrong:   { easy: 'easy',   medium: 'easy', hard: 'medium' },
};

/**
 * Manages the full level-test flow.
 * All 9 questions (3 easy + 3 medium + 3 hard) are loaded in ONE API call at start.
 * Adaptive selection from pools — instant navigation between questions.
 *
 * @returns {{ questions, currentIndex, answers, isLoading, result, error, startTest, submitAnswer }}
 */
export default function useLevelTest() {
  const [state, setState] = useState(INITIAL_STATE);
  const { userId, setUserId, setLevel } = useGameStore();
  const startingRef = useRef(false);

  const setPartial = (patch) => setState((s) => ({ ...s, ...patch }));

  /** Ensure we have a user_id, creating one if needed. */
  const ensureUser = useCallback(async () => {
    if (userId) return userId;
    const res = await fetch(`${API}/user/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    setUserId(json.data.user_id);
    return json.data.user_id;
  }, [userId, setUserId]);

  /**
   * Pick next question from the pool. Falls back to adjacent difficulty if pool empty.
   * @param {object} pools - mutable copy of pools
   * @param {'easy'|'medium'|'hard'} difficulty
   */
  function pickFromPool(pools, difficulty) {
    const fallback = ['medium', 'easy', 'hard'];
    const order = [difficulty, ...fallback.filter((d) => d !== difficulty)];
    for (const d of order) {
      if (pools[d].length > 0) return pools[d].shift();
    }
    return null;
  }

  /** POST /api/test/complete and save level to store. */
  const completeTest = useCallback(async (uid, finalAnswers) => {
    setPartial({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API}/test/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: uid, answers: finalAnswers }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setLevel(json.data.level);
      setPartial({ isLoading: false, result: json.data });
    } catch (err) {
      setPartial({ isLoading: false, error: err.message });
    }
  }, [setLevel]);

  /**
   * Load all 9 questions in a single API call, then pick Q1 from medium pool.
   * StrictMode guard prevents double-invocation.
   */
  const startTest = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    setState(INITIAL_STATE);
    setPartial({ isLoading: true });
    try {
      const uid = await ensureUser();
      const res = await fetch(`${API}/test/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: uid }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      // Sort into difficulty pools
      const all = json.data.questions;
      const pools = {
        easy:   all.filter((q) => q.difficulty === 'easy'),
        medium: all.filter((q) => q.difficulty === 'medium'),
        hard:   all.filter((q) => q.difficulty === 'hard'),
      };

      // Pick Q1 from medium pool
      const q1 = pickFromPool(pools, 'medium');
      setState((s) => ({
        ...s, isLoading: false, pools, questions: q1 ? [q1] : [],
      }));
    } catch (err) {
      setPartial({ isLoading: false, error: err.message });
      startingRef.current = false;
    }
  }, [ensureUser]);

  /**
   * Record selected answer, pick next question adaptively from pool (no API call).
   * After 6 answers — call complete.
   * @param {string} selected — letter chosen, e.g. "A"
   */
  const submitAnswer = useCallback(async (selected) => {
    const { pools, questions, currentIndex, answers } = state;
    const current = questions[currentIndex];
    if (!current) return;

    const isCorrect = selected === current.correct;
    const newAnswer = {
      number: currentIndex + 1,
      question: current.question,
      options: current.options,
      difficulty: current.difficulty ?? 'medium',
      correct: current.correct ?? null,
      selected,
    };
    const newAnswers = [...answers, newAnswer];

    if (newAnswers.length >= 6) {
      setState((s) => ({ ...s, answers: newAnswers, currentIndex: s.currentIndex + 1 }));
      const uid = await ensureUser();
      await completeTest(uid, newAnswers);
      return;
    }

    // Pick next question adaptively
    const nextDifficulty = NEXT_DIFFICULTY[isCorrect ? 'correct' : 'wrong'][current.difficulty ?? 'medium'];
    const poolsCopy = {
      easy:   [...pools.easy],
      medium: [...pools.medium],
      hard:   [...pools.hard],
    };
    const nextQ = pickFromPool(poolsCopy, nextDifficulty);

    setState((s) => ({
      ...s,
      pools: poolsCopy,
      answers: newAnswers,
      currentIndex: s.currentIndex + 1,
      questions: nextQ ? [...s.questions, nextQ] : s.questions,
    }));
  }, [state, ensureUser, completeTest]);

  return { ...state, startTest, submitAnswer };
}
