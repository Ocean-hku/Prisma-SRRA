import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { questions } from '../data/questions_v2';
import { useQuizStore } from '../store/useQuizStore';
import { Dimension } from '../types';

export const Assessment: React.FC = () => {
  const { answers, answerQuestion, isFinished } = useQuizStore();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const answeredCounts = Object.keys(answers).length;

  const [currentViewIndex, setCurrentViewIndex] = React.useState<number>(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            if (id && id.startsWith('q-')) {
              const idx = parseInt(id.replace('q-', ''), 10);
              setCurrentViewIndex((prev) => (idx > prev || idx < prev ? idx : prev));
            }
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 0.5,
      }
    );

    const container = containerRef.current;
    if (container) {
      const elements = container.querySelectorAll('[id^="q-"]');
      elements.forEach((el) => observerRef.current?.observe(el));
    }

    return () => observerRef.current?.disconnect();
  }, [answeredCounts]);

  const handleOptionClick = (questionId: number, optionId: string, weights: Partial<Record<Dimension, number>>, scenario: string, idx: number) => {
    // Allows answering next question or modifying previous answers
    if (idx > answeredCounts) return; 
    
    answerQuestion(questionId, optionId, weights, scenario);
    
    // Auto scroll to next question if it exists
    if (idx === answeredCounts || idx < answeredCounts) {
      setTimeout(() => {
        const nextEl = document.getElementById(`q-${idx + 1}`);
        if (nextEl) {
          nextEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 400);
    }
  };

  const progress = ((currentViewIndex) / questions.length) * 100;

  return (
    <div className="flex flex-1 flex-col w-full h-full relative">
      {/* Sticky Progress Bar Inside Main Flow */}
      <div className="sticky top-0 left-0 w-full h-1.5 bg-white/5 z-[100] backdrop-blur-sm">
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-accent-pink to-accent-blue shadow-[0_0_15px_rgba(124,58,237,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs font-mono tracking-widest text-white/50 bg-black/40 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
          {Math.min(currentViewIndex + 1, questions.length)} / {questions.length}
        </div>
      </div>

      {/* Scrolling Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto scroll-smooth pb-[50vh] px-4 md:px-12 pt-20"
      >
        <div className="max-w-3xl mx-auto flex flex-col gap-[20vh]">
          {questions.map((q, idx) => {
            const isVisible = idx <= answeredCounts;
            const isCurrent = idx === answeredCounts;
            const isAnswered = idx < answeredCounts;

            if (!isVisible) return null;

            const selectedOptionId = answers[q.id]?.optionId;

            return (
              <motion.div
                id={`q-${idx}`}
                key={q.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: isAnswered ? 0.6 : 1, y: 0, scale: isAnswered ? 0.95 : 1 }}
                transition={{ duration: 0.6 }}
                className={`flex flex-col gap-8 transition-all duration-700 ${isAnswered ? 'grayscale-[30%]' : ''}`}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold tracking-widest text-primary">
                      {q.scenario}
                    </span>
                    <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs tracking-widest text-white/50">
                      {q.level}
                    </span>
                  </div>
                  <h2 className="font-serif text-2xl md:text-4xl leading-relaxed text-white/90">
                    {q.text.replace(/^场景 \d+：/, '').replace(/^【[^】]+】\s*/, '')}
                  </h2>
                </div>

                <div className="flex flex-col gap-3">
                  {q.options.map((option) => {
                    const isSelected = selectedOptionId === option.id;
                    return (
                      <motion.button
                        key={option.id}
                        onClick={() => handleOptionClick(q.id, option.id, option.weights, q.scenario, idx)}
                        whileHover={{ scale: 1.02, x: 10 }}
                        whileTap={{ scale: 0.98 }}
                        className={`group relative flex w-full items-center justify-between rounded-2xl border p-5 text-left backdrop-blur-sm transition-all duration-300
                          ${isSelected 
                            ? 'border-primary bg-primary/20 text-white shadow-[0_0_15px_rgba(var(--color-primary),0.3)]' 
                            : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:border-primary/50'
                          }`}
                      >
                        <span className="text-base md:text-lg font-light tracking-wide leading-relaxed">
                          {option.text}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
          
          {/* Finish Button */}
          {isFinished && (
            <motion.div 
              id={`q-${questions.length}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-center py-20"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 rounded-full border border-primary flex items-center justify-center animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-primary blur-md" />
                </div>
                <p className="text-xl tracking-widest font-serif text-white/70">所有潜意识已采集完毕</p>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="mt-4 opacity-0" // Just a dummy to keep space if needed, store already handles transition to result
                >
                  生成报告
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
