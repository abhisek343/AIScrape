'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useCallback, useRef } from 'react';
import { Briefcase, ShoppingCart, Newspaper, Banknote, Microscope, Rocket } from 'lucide-react';

const cases = [
  {
    icon: Briefcase,
    title: 'Lead generation',
    desc: 'Prospect at scale across directories, review sites, and social profiles.',
  },
  {
    icon: ShoppingCart,
    title: 'E‑commerce pricing',
    desc: 'Monitor prices, stock, and content across retailers and marketplaces.',
  },
  {
    icon: Newspaper,
    title: 'News & research',
    desc: 'Track coverage, references, and insights from millions of pages.',
  },
  {
    icon: Banknote,
    title: 'Investment signals',
    desc: 'Extract alternative data for quant models and due diligence.',
  },
  {
    icon: Microscope,
    title: 'Compliance monitoring',
    desc: 'Audit web content changes for regulated industries and vendors.',
  },
  {
    icon: Rocket,
    title: 'Market intelligence',
    desc: 'Continuously analyze competitor launches, pages, and messaging.',
  },
];

export default function UseCases() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 10;
    const rotateX = -(py - 0.5) * 10;
    el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }, []);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
  }, []);

  return (
    <section ref={containerRef} id="use-cases" className="relative py-20 md:py-28 overflow-hidden">
      {/* Enhanced layered background */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-b from-slate-50 via-emerald-50/30 to-white dark:from-slate-950 dark:via-emerald-950/10 dark:to-slate-950"
        style={{ y: backgroundY }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,theme(colors.emerald.500/0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,theme(colors.emerald.400/0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/3 via-transparent to-emerald-400/5" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-semibold mb-6 border border-emerald-200/60 dark:border-emerald-800/60 backdrop-blur-sm"
          >
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Use Cases
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white"
          >
            Purpose‑built for your team
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto"
          >
            Each use case includes a ready‑to‑run template and live example you can clone.
          </motion.p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c, idx) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.25, 0.25, 0, 1] }}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative overflow-hidden rounded-2xl border border-emerald-100/60 dark:border-emerald-800/40 bg-white/90 dark:bg-slate-900/90 shadow-lg shadow-emerald-100/20 dark:shadow-emerald-900/10 will-change-transform backdrop-blur-sm"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {/* Gradient border on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
              
              <motion.div
                aria-hidden
                initial={{ width: 0 }}
                whileHover={{ width: '100%' }}
                transition={{ duration: 0.35 }}
                className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400"
              />
              <div className="p-6 relative">
                <div className="inline-flex w-12 h-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/60 dark:to-emerald-800/40 text-emerald-700 dark:text-emerald-300 group-hover:scale-110 transition-transform duration-300 shadow-md shadow-emerald-200/30 dark:shadow-emerald-900/30">
                  <c.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">{c.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{c.desc}</p>
              </div>
              <div className="px-6 pb-4 text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 group-hover:gap-2 transition-all duration-300">
                Explore template 
                <span className="transform group-hover:translate-x-1 transition-transform duration-300">→</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


