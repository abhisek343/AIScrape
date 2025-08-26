'use client';

import { motion } from 'framer-motion';
import { Bot, Boxes, LayoutGrid } from 'lucide-react';

const items = [
  {
    icon: LayoutGrid,
    title: 'Visual builder',
    desc: 'Compose dependable workflows with nodes, branches, and validations.'
  },
  {
    icon: Bot,
    title: 'AI extraction',
    desc: 'Use AI to structure messy HTML into clean JSON reliably.'
  },
  {
    icon: Boxes,
    title: 'Runtime & retries',
    desc: 'Headless browser, smart waiting, anti-bot, and automatic retries.'
  }
];

export default function Showcase() {
  return (
    <section id="showcase" className="relative py-24 md:py-32 overflow-hidden">
      {/* Enhanced background with multiple layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-950/20" />
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-emerald-400/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,theme(colors.emerald.500/0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_40%_40%,theme(colors.emerald.400/0.1),transparent_50%)]" />
      
      {/* 3D Hexagonal Network Grid */}
      <div className="absolute inset-0 opacity-15">
        {/* Hexagonal 3D shapes */}
        <div className="absolute inset-0">
          {[
            { x: '8%', y: '20%', size: 'w-20 h-16', delay: 0.3, rotation: '0deg', type: 'hex' },
            { x: '92%', y: '25%', size: 'w-16 h-12', delay: 0.6, rotation: '30deg', type: 'diamond' },
            { x: '20%', y: '80%', size: 'w-18 h-14', delay: 0.9, rotation: '45deg', type: 'hex' },
            { x: '80%', y: '75%', size: 'w-22 h-18', delay: 1.2, rotation: '15deg', type: 'diamond' },
            { x: '50%', y: '10%', size: 'w-24 h-20', delay: 1.5, rotation: '60deg', type: 'hex' },
            { x: '15%', y: '50%', size: 'w-14 h-10', delay: 1.8, rotation: '-15deg', type: 'diamond' },
            { x: '85%', y: '55%', size: 'w-16 h-12', delay: 2.1, rotation: '75deg', type: 'hex' },
          ].map((shape, index) => (
            <motion.div
              key={`showcase-shape-${index}`}
              className={`absolute ${shape.size} transform-gpu`}
              style={{ 
                left: shape.x, 
                top: shape.y,
                transform: `rotate(${shape.rotation})`,
              }}
              initial={{ opacity: 0, scale: 0, rotateZ: -180 }}
              whileInView={{ 
                opacity: 1, 
                scale: 1, 
                rotateZ: 0,
                y: [0, -4, 0],
                rotateY: [0, 10, 0],
              }}
              viewport={{ once: true }}
              transition={{ 
                duration: 1.8, 
                delay: shape.delay,
                y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                rotateY: { duration: 8, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <div className="relative w-full h-full transform-gpu preserve-3d">
                {shape.type === 'hex' ? (
                  // Hexagonal shape
                  <div className="absolute inset-0">
                    <div className="w-full h-full bg-gradient-to-br from-emerald-200/60 to-emerald-300/40 dark:from-emerald-800/40 dark:to-emerald-900/60 shadow-xl shadow-emerald-500/20 border border-emerald-300/50 dark:border-emerald-700/50 backdrop-blur-sm"
                         style={{
                           clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)'
                         }}>
                      <div className="absolute inset-2 bg-gradient-to-br from-emerald-50/40 to-transparent dark:from-emerald-400/10"
                           style={{
                             clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)'
                           }} />
                    </div>
                    {/* 3D depth for hexagon */}
                    <div className="absolute top-1 right-0 w-2 h-full bg-gradient-to-b from-emerald-300/50 to-emerald-500/70 dark:from-emerald-700/60 dark:to-emerald-900/80 transform skew-y-12 origin-top-right"
                         style={{
                           clipPath: 'polygon(0% 0%, 80% 0%, 100% 50%, 80% 100%, 0% 100%)'
                         }} />
                  </div>
                ) : (
                  // Diamond shape
                  <div className="absolute inset-0">
                    <div className="w-full h-full bg-gradient-to-br from-emerald-100/60 to-emerald-200/40 dark:from-emerald-800/40 dark:to-emerald-900/60 shadow-xl shadow-emerald-500/20 border border-emerald-200/50 dark:border-emerald-800/50 backdrop-blur-sm transform rotate-45">
                      <div className="absolute inset-2 bg-gradient-to-br from-emerald-50/40 to-transparent dark:from-emerald-400/10" />
                    </div>
                    {/* 3D depth for diamond */}
                    <div className="absolute top-1 right-0 w-2 h-full bg-gradient-to-b from-emerald-300/40 to-emerald-500/60 dark:from-emerald-700/60 dark:to-emerald-900/80 transform rotate-45 skew-y-6 origin-top-right" />
                  </div>
                )}
                
                {/* Pulsing center dot */}
                <motion.div
                  className="absolute top-1/2 left-1/2 w-2 h-2 bg-emerald-400 rounded-full transform -translate-x-1 -translate-y-1"
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.6, 1, 0.6]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Advanced connection web */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="webGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.3 }} />
              <stop offset="25%" style={{ stopColor: '#34d399', stopOpacity: 0.5 }} />
              <stop offset="75%" style={{ stopColor: '#6ee7b7', stopOpacity: 0.4 }} />
              <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0.2 }} />
            </linearGradient>
            <filter id="webGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Intricate web pattern */}
          <motion.path
            d="M 100 160 L 300 120 L 500 200 L 700 180 L 900 140 L 1100 200"
            stroke="url(#webGradient)"
            strokeWidth="1.5"
            fill="none"
            filter="url(#webGlow)"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 3, delay: 0.5, ease: "easeInOut" }}
          />
          <motion.path
            d="M 200 320 L 400 280 L 600 360 L 800 340 L 1000 300"
            stroke="url(#webGradient)"
            strokeWidth="1.5"
            fill="none"
            filter="url(#webGlow)"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 3, delay: 1, ease: "easeInOut" }}
          />
          <motion.path
            d="M 150 600 L 350 560 L 550 620 L 750 600 L 950 580"
            stroke="url(#webGradient)"
            strokeWidth="1.5"
            fill="none"
            filter="url(#webGlow)"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 3, delay: 1.5, ease: "easeInOut" }}
          />
          {/* Vertical connections */}
          <motion.path
            d="M 300 120 L 280 280 L 350 560"
            stroke="url(#webGradient)"
            strokeWidth="1"
            fill="none"
            filter="url(#webGlow)"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2.5, delay: 2, ease: "easeInOut" }}
          />
          <motion.path
            d="M 700 180 L 720 340 L 750 600"
            stroke="url(#webGradient)"
            strokeWidth="1"
            fill="none"
            filter="url(#webGlow)"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2.5, delay: 2.5, ease: "easeInOut" }}
          />
        </svg>
      </div>
      
      {/* Enhanced floating elements */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-emerald-200/20 to-emerald-400/10 rounded-full blur-3xl"
        animate={{ 
          y: [0, 30, 0], 
          x: [0, 20, 0],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-64 h-64 bg-gradient-to-tl from-emerald-300/15 to-emerald-500/20 rounded-full blur-3xl"
        animate={{ 
          y: [0, -25, 0], 
          x: [0, -15, 0],
          opacity: [0.2, 0.5, 0.2]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-semibold mb-8 border border-emerald-200/60 dark:border-emerald-800/60 backdrop-blur-sm"
          >
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            Built for production
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.25, 0.25, 0, 1] }}
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-6"
          >
            Build dependable workflows.
            <span className="block bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 bg-clip-text text-transparent">
              Ship with retries and monitoring.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto leading-relaxed font-normal tracking-normal"
          >
            Visual builder, AI-assisted extraction, and a managed runtime with Chromium, smart waiting, and automatic retries.
          </motion.p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {items.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: idx * 0.15, ease: [0.25, 0.25, 0, 1] }}
              whileHover={{ y: -12, scale: 1.02 }}
              className="group relative"
            >
              {/* Enhanced gradient border with glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/40 via-emerald-400/20 to-emerald-600/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-lg"></div>
              <div className="relative p-[2px] rounded-3xl bg-gradient-to-br from-emerald-400/60 via-emerald-300/30 to-emerald-500/50 dark:from-emerald-600/40 dark:via-emerald-400/20 dark:to-emerald-700/30">
                {/* Enhanced Card */}
                <div className="h-full rounded-3xl bg-gradient-to-br from-white/95 via-white/85 to-emerald-50/30 dark:from-slate-900/95 dark:via-slate-800/85 dark:to-emerald-950/20 backdrop-blur-xl border border-emerald-100/60 dark:border-emerald-900/40 shadow-2xl shadow-emerald-100/20 dark:shadow-emerald-900/10 overflow-hidden">
                  {/* Background pattern */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/20 to-transparent dark:from-emerald-800/20 rounded-full blur-3xl"></div>
                  
                  <div className="relative p-8 md:p-10">
                    <div className="inline-flex w-16 h-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/60 dark:to-emerald-800/40 text-emerald-700 dark:text-emerald-300 shadow-lg shadow-emerald-200/30 dark:shadow-emerald-900/30 group-hover:scale-110 transition-transform duration-300">
                      <item.icon className="h-8 w-8 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300" />
                    </div>
                    
                    <h3 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-300">
                      {item.title}
                    </h3>
                    
                    <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                      {item.desc}
                    </p>
                    
                    {/* Enhanced preview area with gradient and animations */}
                    <div className="mt-8 h-40 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-emerald-100/40 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center relative overflow-hidden group-hover:shadow-lg group-hover:shadow-emerald-200/20 dark:group-hover:shadow-emerald-800/20 transition-all duration-500">
                      {/* Animated background */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 via-transparent to-emerald-500/10"
                        animate={{ x: [-100, 100] }}
                        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                      />
                      
                      {/* Preview content */}
                      <div className="relative z-10 text-emerald-600 dark:text-emerald-400 font-semibold text-lg">
                        <motion.div
                          initial={{ opacity: 0.6 }}
                          whileInView={{ opacity: 1 }}
                          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                          className="flex items-center gap-2"
                        >
                          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                          Interactive Preview
                        </motion.div>
                      </div>
                      
                      {/* Floating elements */}
                      <motion.div
                        className="absolute top-4 right-4 w-8 h-8 bg-emerald-300/20 rounded-full"
                        animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute bottom-4 left-4 w-6 h-6 bg-emerald-400/20 rounded-full"
                        animate={{ y: [0, 8, 0], opacity: [0.3, 0.8, 0.3] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}



