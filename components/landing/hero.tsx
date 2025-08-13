'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
const WorkflowAnimation = dynamic(() => import('@/components/landing/workflow-animation'), { ssr: false });
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, CheckCircle, Users, TrendingUp, Zap } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Enhanced Background with multiple gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20" />
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/5 via-transparent to-emerald-400/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,theme(colors.emerald.500/0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_50%,theme(colors.emerald.400/0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,theme(colors.emerald.400/0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_80%_20%,theme(colors.emerald.500/0.1),transparent_50%)]" />
      
      {/* Beautiful Floating Orb System */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large Premium Orbs */}
        {[
          { size: 'w-32 h-32', x: '10%', y: '20%', delay: 0 },
          { size: 'w-24 h-24', x: '85%', y: '15%', delay: 0.5 },
          { size: 'w-28 h-28', x: '75%', y: '70%', delay: 1 },
          { size: 'w-20 h-20', x: '15%', y: '75%', delay: 1.5 },
          { size: 'w-36 h-36', x: '60%', y: '45%', delay: 2 },
        ].map((orb, index) => (
          <motion.div
            key={index}
            className={`absolute ${orb.size} transform-gpu`}
            style={{ left: orb.x, top: orb.y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0.4, 0.7, 0.4],
              scale: [0.8, 1.1, 0.8],
              y: [0, -30, 0],
              x: [0, 15, 0],
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              delay: orb.delay,
              ease: "easeInOut"
            }}
          >
            <div className="relative w-full h-full">
              {/* Outer glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/30 to-emerald-300/30 rounded-full blur-xl" />
              
              {/* Main orb */}
              <div className="absolute inset-2 bg-gradient-to-br from-emerald-200/80 via-emerald-300/60 to-emerald-400/40 dark:from-emerald-800/60 dark:via-emerald-700/40 dark:to-emerald-600/30 rounded-full backdrop-blur-sm border border-emerald-300/50 dark:border-emerald-700/50">
                
                {/* Inner highlight */}
                <div className="absolute inset-1 bg-gradient-to-br from-white/60 to-transparent dark:from-emerald-100/20 rounded-full" />
                
                {/* Center spark */}
                <motion.div
                  className="absolute top-1/2 left-1/2 w-2 h-2 bg-emerald-400 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>
          </motion.div>
        ))}
        
        {/* Medium Floating Elements */}
        {[
          { x: '12%', y: '25%', duration: 8, delay: 1, xMove: 15 },
          { x: '88%', y: '35%', duration: 7, delay: 2, xMove: -20 },
          { x: '25%', y: '60%', duration: 9, delay: 0.5, xMove: 10 },
          { x: '75%', y: '80%', duration: 6, delay: 3, xMove: -15 },
          { x: '45%', y: '15%', duration: 8.5, delay: 1.5, xMove: 5 },
          { x: '65%', y: '55%', duration: 7.5, delay: 2.5, xMove: -10 },
          { x: '30%', y: '40%', duration: 9.5, delay: 0.8, xMove: 18 },
          { x: '80%', y: '25%', duration: 6.5, delay: 3.2, xMove: -8 },
          { x: '15%', y: '75%', duration: 8.2, delay: 1.8, xMove: 12 },
          { x: '55%', y: '30%', duration: 7.8, delay: 2.8, xMove: -18 },
          { x: '85%', y: '65%', duration: 9.2, delay: 0.3, xMove: 8 },
          { x: '35%', y: '85%', duration: 6.8, delay: 3.5, xMove: -12 },
        ].map((particle, index) => (
          <motion.div
            key={`medium-${index}`}
            className="absolute w-4 h-4 bg-gradient-to-r from-emerald-400/60 to-emerald-300/40 rounded-full backdrop-blur-sm"
            style={{
              left: particle.x,
              top: particle.y,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 0.8, 0],
              scale: [0, 1, 0],
              y: [0, -60, -120],
              x: [0, particle.xMove],
            }}
            transition={{ 
              duration: particle.duration, 
              repeat: Infinity, 
              delay: particle.delay,
              ease: "easeOut"
            }}
          />
        ))}
        
        {/* Small Sparkle Particles */}
        {[
          { x: '8%', y: '20%', duration: 3.2, delay: 1.5 },
          { x: '92%', y: '15%', duration: 2.8, delay: 3.2 },
          { x: '23%', y: '35%', duration: 3.8, delay: 0.8 },
          { x: '77%', y: '45%', duration: 2.5, delay: 4.1 },
          { x: '45%', y: '12%', duration: 3.5, delay: 2.3 },
          { x: '67%', y: '28%', duration: 2.9, delay: 1.2 },
          { x: '15%', y: '58%', duration: 3.1, delay: 3.8 },
          { x: '85%', y: '72%', duration: 2.7, delay: 0.5 },
          { x: '38%', y: '85%', duration: 3.6, delay: 2.9 },
          { x: '72%', y: '62%', duration: 2.4, delay: 1.8 },
          { x: '52%', y: '38%', duration: 3.3, delay: 4.5 },
          { x: '28%', y: '75%', duration: 2.6, delay: 0.2 },
          { x: '88%', y: '42%', duration: 3.7, delay: 3.5 },
          { x: '12%', y: '48%', duration: 2.8, delay: 1.9 },
          { x: '65%', y: '18%', duration: 3.4, delay: 4.2 },
          { x: '42%', y: '68%', duration: 2.3, delay: 0.9 },
          { x: '78%', y: '82%', duration: 3.9, delay: 2.7 },
          { x: '18%', y: '32%', duration: 2.5, delay: 3.9 },
          { x: '58%', y: '88%', duration: 3.2, delay: 1.4 },
          { x: '82%', y: '58%', duration: 2.9, delay: 4.8 },
        ].map((sparkle, index) => (
          <motion.div
            key={`sparkle-${index}`}
            className="absolute w-1 h-1 bg-emerald-400 rounded-full"
            style={{
              left: sparkle.x,
              top: sparkle.y,
            }}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{ 
              duration: sparkle.duration, 
              repeat: Infinity, 
              delay: sparkle.delay,
              ease: "easeInOut"
            }}
          />
        ))}
        
        {/* Flowing Wave Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0 }} />
              <stop offset="50%" style={{ stopColor: '#34d399', stopOpacity: 0.8 }} />
              <stop offset="100%" style={{ stopColor: '#6ee7b7', stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          
          {/* Flowing wave paths */}
          {[25, 45, 65].map((y, index) => (
            <motion.path
              key={index}
              d={`M0,${y} Q25,${y-10} 50,${y} T100,${y}`}
              stroke="url(#waveGradient)"
              strokeWidth="0.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 1, 0] }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                delay: index * 1.5,
                ease: "easeInOut"
              }}
            />
          ))}
        </svg>


      </div>
      
      {/* Enhanced floating orbs with better animations */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-20 -left-20 h-96 w-96 rounded-full bg-gradient-to-br from-emerald-300/20 to-emerald-600/10 blur-3xl"
        animate={{ 
          y: [0, 30, 0], 
          x: [0, 15, 0],
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-10 right-10 h-80 w-80 rounded-full bg-gradient-to-bl from-emerald-200/25 to-emerald-500/15 blur-3xl"
        animate={{ 
          y: [0, -25, 0], 
          x: [0, -12, 0],
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-20 left-1/3 h-64 w-64 rounded-full bg-gradient-to-tr from-emerald-400/15 to-emerald-300/20 blur-3xl"
        animate={{ 
          y: [0, 20, 0], 
          x: [0, 10, 0],
          opacity: [0.1, 0.3, 0.1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="mx-auto max-w-5xl text-center">
          {/* Enhanced Social proof badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-50/80 to-emerald-100/60 dark:from-emerald-950/60 dark:to-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-semibold mb-10 border border-emerald-200/60 dark:border-emerald-800/60 backdrop-blur-sm shadow-lg shadow-emerald-100/20 dark:shadow-emerald-900/20"
          >
            <div className="flex items-center justify-center w-5 h-5 bg-emerald-500/20 rounded-full">
              <CheckCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            </div>
            Trusted by 2,500+ companies worldwide
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          </motion.div>

          <div className="relative">
            {/* Enhanced glowing effect */}
            <motion.div
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
              className="absolute inset-x-0 -top-6 h-16 bg-gradient-to-r from-emerald-500/0 via-emerald-400/30 to-emerald-500/0 blur-3xl"
            />
            <motion.div
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
              className="absolute inset-x-0 -top-2 h-8 bg-gradient-to-r from-emerald-600/0 via-emerald-300/40 to-emerald-600/0 blur-2xl"
            />
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.25, 0, 1] }}
              className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight md:tracking-tighter text-slate-900 dark:text-white leading-[0.95] mb-6"
            >
              <span className="block">
            Enterprise web scraping
              </span>
              <span className="block bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 bg-clip-text text-transparent font-extrabold relative">
              that actually works
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 0.3, 0], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 2 }}
                  className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 bg-clip-text text-transparent blur-sm"
                />
            </span>
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.25, 0, 1] }}
            className="text-lg md:text-xl lg:text-2xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto leading-relaxed font-light tracking-wide"
          >
            Build <span className="font-semibold text-emerald-600 dark:text-emerald-400">production-ready data pipelines</span> with our visual workflow builder. 
            Scale from thousands to millions of pages with <span className="font-semibold text-emerald-600 dark:text-emerald-400">enterprise-grade reliability</span>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.25, 0, 1] }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link href="/sign-up">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="relative group"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl blur opacity-70 group-hover:opacity-100 transition duration-300"></div>
                <Button size="lg" className="relative bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8 py-4 text-base font-semibold shadow-2xl shadow-emerald-500/25 transition-all duration-300 rounded-xl border border-emerald-500/20 overflow-hidden">
                  {/* sheen */}
                  <span className="pointer-events-none absolute inset-0 rounded-xl [mask-image:linear-gradient(120deg,transparent,rgba(255,255,255,.35),transparent)] translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                  Start free trial
                  <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </motion.div>
            </Link>
            <Link href="#demo">
              <motion.div
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button size="lg" variant="outline" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:border-emerald-300 dark:hover:border-emerald-700 px-10 py-5 text-lg font-semibold shadow-xl shadow-slate-200/50 dark:shadow-slate-800/50 transition-all duration-300 rounded-xl text-slate-700 dark:text-slate-300">
                  <Play className="mr-3 h-5 w-5" />
                Watch demo
              </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Animated Workflow Preview */}
          <div className="mt-12">
            <WorkflowAnimation />
          </div>

          {/* Enhanced Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: [0.25, 0.25, 0, 1] }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            {[
              { icon: Users, value: "2,500+", label: "Active users", delay: 0 },
              { icon: TrendingUp, value: "99.9%", label: "Uptime SLA", delay: 0.1 },
              { icon: Zap, value: "5min", label: "Setup time", delay: 0.2 }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.8 + stat.delay, ease: [0.25, 0.25, 0, 1] }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group text-center p-8 bg-gradient-to-br from-white/80 via-white/60 to-emerald-50/30 dark:from-slate-900/80 dark:via-slate-800/60 dark:to-emerald-950/20 backdrop-blur-md rounded-2xl border border-emerald-100/60 dark:border-emerald-900/40 shadow-2xl shadow-emerald-100/20 dark:shadow-emerald-900/10 hover:shadow-3xl hover:shadow-emerald-200/30 dark:hover:shadow-emerald-800/20 transition-all duration-500 relative overflow-hidden"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/60 dark:to-emerald-800/40 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-emerald-200/30 dark:shadow-emerald-900/30">
                    <stat.icon className="h-8 w-8 text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-300" />
              </div>
                  <div className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-300">{stat.value}</div>
                  <div className="text-slate-600 dark:text-slate-400 font-medium tracking-wide">{stat.label}</div>
            </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
      {/* Removed mock screenshot per request */}
    </section>
  );
}
