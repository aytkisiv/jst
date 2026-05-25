import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useGameStore = create(
  persist(
    (set) => ({
      // User identity
      userId:    null,
      level:     null,
      character: null,

      // Gamification
      xp:      0,
      streak:  0,
      badges:  [],

      // Tutor mood
      mood: 'happy',

      // Active chat session — intentionally NOT persisted (see partialize below)
      sessionId: null,
      messages:  [],

      setUserId:    (userId)    => set({ userId }),
      setLevel:     (level)     => set({ level }),
      setCharacter: (character) => set({ character }),
      setMood:      (mood)      => set({ mood }),
      addXP:        (amount)    => set((state) => ({ xp: state.xp + amount })),
      addMessage:   (message)   => set((state) => ({ messages: [...state.messages, message] })),

      reset: () => set({
        userId: null, level: null, character: null,
        xp: 0, streak: 0, badges: [], mood: 'happy',
        sessionId: null, messages: [],
      }),
    }),
    {
      name: 'jts-game-state',
      // Only persist identity + progress, not the active session chat
      partialize: (state) => ({
        userId:    state.userId,
        level:     state.level,
        character: state.character,
        xp:        state.xp,
        streak:    state.streak,
        badges:    state.badges,
      }),
    }
  )
);

export default useGameStore;
