import React from 'react';
import { motion } from 'framer-motion';

interface HomeProps {
  onStart: () => void;
}

export const Home: React.FC<HomeProps> = ({ onStart }) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-20 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="flex flex-col items-center text-center relative z-10"
      >
        <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-30 blur-3xl mix-blend-screen pointer-events-none">
          <div className="w-[300px] h-[300px] rounded-full bg-gradient-to-tr from-primary via-accent-pink to-accent-blue animate-spin-slow"></div>
        </div>

        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mb-8"
        >
          <span className="inline-block rounded-full border border-white/20 bg-white/5 px-6 py-2 text-xs md:text-sm tracking-[0.3em] text-white/70 backdrop-blur-md">
            棱镜 · SRRA
          </span>
        </motion.div>

        <h1 className="font-serif text-6xl md:text-8xl lg:text-[10rem] font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/20 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] mb-4">
          萌兽人格图鉴
        </h1>
        
        <p className="text-sm md:text-base tracking-[0.4em] text-white/50 mb-12 uppercase font-mono">
          Social · Rational · Rebellious · Ambition
        </p>
        
        <p className="max-w-2xl text-lg md:text-xl font-light leading-relaxed tracking-wide text-white/60 mb-12 px-4">
          摒弃非黑即白的性格标签。<br/>
          置身于4D引力波与15维人格光谱中，<br/>
          折射出你最隐秘、最复杂、最迷人的真实剖面。
        </p>

        <div className="flex flex-col items-center gap-6">
          <button
            onClick={onStart}
            className="group relative overflow-hidden rounded-full bg-white/5 px-12 py-5 font-bold tracking-widest text-white backdrop-blur-md border border-white/20 transition-all hover:bg-white/20 hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.05)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]"
          >
            <span className="relative z-10">开始探索</span>
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-primary/20 to-accent-blue/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
