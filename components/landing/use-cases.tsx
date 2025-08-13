'use client';

import { motion } from 'framer-motion';
import { useCallback } from 'react';
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
    <section id="use-cases" className="py-20 md:py-28 bg-gradient-to-b from-emerald-50/70 to-white dark:from-emerald-900/20 dark:to-transparent">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold tracking-tight"
          >
            Purpose‑built for your team
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
          >
            Ship reliable data pipelines with workflow templates tailored to common use cases.
          </motion.p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c, idx) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.05 }}
              whileHover={{ y: -6, scale: 1.01 }}
              whileTap={{ scale: 0.995 }}
              className="group relative overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm will-change-transform"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <motion.div
                aria-hidden
                initial={{ width: 0 }}
                whileHover={{ width: '100%' }}
                transition={{ duration: 0.35 }}
                className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400"
              />
              <div className="p-6">
                <div className="inline-flex w-12 h-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                  <c.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
              </div>
              <div className="px-6 pb-4 text-sm text-emerald-700 dark:text-emerald-300">
                Explore template →
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


