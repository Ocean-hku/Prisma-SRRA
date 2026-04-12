import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Layout } from './components/ui/Layout';
import { BackgroundNoise } from './components/effects/BackgroundNoise';
import { Home } from './pages/Home';
import { Assessment } from './pages/Assessment';
import { Result } from './pages/Result';
import { useQuizStore } from './store/useQuizStore';

function App() {
  const hasDemo = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).has('demo');
  }, []);

  const [started, setStarted] = useState(hasDemo);
  const { isFinished } = useQuizStore();

  return (
    <>
      <BackgroundNoise />
      <Layout>
        <AnimatePresence mode="wait">
          {!started ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              transition={{ duration: 0.8 }}
              className="flex flex-1"
            >
              <Home onStart={() => setStarted(true)} />
            </motion.div>
          ) : !isFinished ? (
            <motion.div
              key="assessment"
              initial={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -50, filter: "blur(10px)" }}
              transition={{ duration: 0.8 }}
              className="flex flex-1"
            >
              <Assessment />
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="flex flex-1"
            >
              <Result />
            </motion.div>
          )}
        </AnimatePresence>
      </Layout>
    </>
  );
}

export default App;
