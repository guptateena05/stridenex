import React from 'react';
import { motion } from 'framer-motion';

export default function PartnerHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-32 overflow-hidden bg-[#0A0F1C]">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[35rem] h-[35rem] bg-indigo-600/20 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-blue-300 text-sm font-semibold tracking-[0.2em] uppercase">StrideNex Partner Network</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6 leading-[1.2]">
            Turn Your Trust Into a <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 drop-shadow-sm">
              Growth Engine
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            Join the ground-level distribution network. Enable stakeholders to bring their communities into StrideNex, unlocking new revenue streams and better student outcomes.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.button 
              onClick={() => document.getElementById('partner-form')?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-bold shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] transition-all flex items-center justify-center gap-2"
            >
              <span>Become a Partner</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </motion.button>
            
            <motion.button 
              onClick={() => document.getElementById('partner-tiers')?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium backdrop-blur-sm transition-all"
            >
              Explore Tiers
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
