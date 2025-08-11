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
    <section aria-label="Trusted by" className="py-10 md:py-12 border-y bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-sm uppercase tracking-wider text-emerald-600 dark:text-emerald-400"
          >
            Trusted by data-driven teams
          </motion.p>
        </div>
        <div className="relative overflow-hidden">
          <motion.div
            className="flex items-center gap-10 md:gap-14 whitespace-nowrap opacity-80"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 22, ease: 'linear', repeat: Infinity }}
          >
            {all.map((logo, idx) => (
              <div key={`${logo.name}-${idx}`} className="flex items-center justify-center">
                <span className="text-sm md:text-base font-semibold tracking-wide text-muted-foreground/70">
                  {logo.name}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}


