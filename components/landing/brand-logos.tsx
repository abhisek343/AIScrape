'use client';

import { motion } from 'framer-motion';

const logos = [
  { name: 'Acme', width: 96 },
  { name: 'Globex', width: 96 },
  { name: 'Umbrella', width: 96 },
  { name: 'Soylent', width: 96 },
  { name: 'Initech', width: 96 },
  { name: 'Hooli', width: 96 },
];

export default function BrandLogos() {
  const all = [...logos, ...logos];
  return (
    <section aria-label="Trusted by" className="relative py-16 md:py-20 overflow-hidden">
      {/* Enhanced background */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/30 via-white/80 to-emerald-50/30 dark:from-emerald-950/20 dark:via-slate-900/80 dark:to-emerald-950/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,theme(colors.emerald.500/0.05),transparent_70%)]" />
      
      {/* Subtle border effects */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-200/60 to-transparent dark:via-emerald-800/40" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-200/60 to-transparent dark:via-emerald-800/40" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-semibold mb-4 border border-emerald-200/60 dark:border-emerald-800/60 backdrop-blur-sm"
          >
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            Trusted Globally
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg font-semibold tracking-wide text-slate-600 dark:text-slate-300"
          >
            Trusted by data-driven teams worldwide
          </motion.p>
        </div>
        
        <div className="relative overflow-hidden">
          {/* Gradient fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white dark:from-slate-900 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10" />
          
          <motion.div
            className="flex items-center gap-12 md:gap-16 whitespace-nowrap"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
          >
            {all.map((logo, idx) => (
              <motion.div 
                key={`${logo.name}-${idx}`} 
                className="flex items-center justify-center group relative"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-lg md:text-xl font-semibold tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300 select-none">
                  {logo.name}
                </span>
                <span className="pointer-events-none absolute -bottom-2 left-1/2 h-px w-0 group-hover:w-8 -translate-x-1/2 bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-300" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}


