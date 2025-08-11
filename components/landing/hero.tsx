'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, CheckCircle, Users, TrendingUp, Zap } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-600/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 bg-[size:20px_20px] opacity-40" />
      {/* Floating orbs */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-10 -left-10 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl"
        animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-20 right-10 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl"
        animate={{ y: [0, -18, 0], x: [0, -8, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="mx-auto max-w-5xl text-center">
          {/* Social proof badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium mb-8 border border-emerald-200 dark:border-emerald-800"
          >
            <CheckCircle className="h-4 w-4" />
            Trusted by 2,500+ companies worldwide
          </motion.div>

          <div className="relative">
            <motion.div
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute inset-x-0 -top-3 h-10 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 blur-2xl"
            />
            <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white"
            >
            Enterprise web scraping
            <span className="block bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 bg-clip-text text-transparent">
              that actually works
            </span>
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto leading-relaxed"
          >
            Build production-ready data pipelines with our visual workflow builder. 
            Scale from thousands to millions of pages with enterprise-grade reliability.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/sign-up">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200">
                Start free trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="lg" variant="outline" className="border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 px-8 py-4 text-lg">
                <Play className="mr-2 h-5 w-5" />
                Watch demo
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto"
          >
            <div className="text-center p-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg mb-4">
                <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">2,500+</div>
              <div className="text-slate-600 dark:text-slate-400">Active users</div>
            </div>
            <div className="text-center p-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg mb-4">
                <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">99.9%</div>
              <div className="text-slate-600 dark:text-slate-400">Uptime SLA</div>
            </div>
            <div className="text-center p-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg mb-4">
                <Zap className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">5min</div>
              <div className="text-slate-600 dark:text-slate-400">Setup time</div>
            </div>
          </motion.div>
        </div>
      </div>
      {/* Removed mock screenshot per request */}
    </section>
  );
}
