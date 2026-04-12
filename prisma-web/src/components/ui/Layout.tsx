import React from 'react';
import { motion } from 'framer-motion';
import { ConstellationBg } from './ConstellationBg';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-transparent text-white selection:bg-primary/30 relative flex flex-col items-center">
      <ConstellationBg />
      {/* Dynamic grain overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-30 mix-blend-overlay noise-bg" />
      
      {/* Content wrapper */}
      <main className="relative z-10 flex w-full max-w-7xl flex-1 flex-col px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};