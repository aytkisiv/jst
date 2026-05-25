import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import useGameStore from './store/gameStore';
import WelcomeScreen from './components/WelcomeScreen';
import LevelTest from './components/LevelTest';
import TestResult from './components/TestResult';
import CharacterSelect from './components/CharacterSelect';
import TopicMap from './components/TopicMap';
import TutorChat from './components/TutorChat';
import SessionRecap from './components/SessionRecap';

/** Sync userId with backend on startup. Uses persisted userId if available. */
function UserInit() {
  const setUserId = useGameStore((s) => s.setUserId);
  const userId    = useGameStore((s) => s.userId);

  useEffect(() => {
    // Pass existing userId to server to restore the same user record
    fetch('/api/user/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId ?? undefined }),
    })
      .then((r) => r.json())
      .then((json) => {
        const id = json.data?.user_id;
        if (id && id !== userId) setUserId(id);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"           element={<WelcomeScreen />} />
        <Route path="/test"       element={<LevelTest />} />
        <Route path="/result"     element={<TestResult />} />
        <Route path="/characters" element={<CharacterSelect />} />
        <Route path="/map"        element={<TopicMap />} />
        <Route path="/chat"       element={<TutorChat />} />
        <Route path="/recap"      element={<SessionRecap />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <UserInit />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
