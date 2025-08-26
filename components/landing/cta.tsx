'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function CTA() {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-emerald-600 to-emerald-500 text-white"
        >
          <motion.div
            aria-hidden
            className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-2xl"
            animate={{ y: [0, -10, 0], x: [0, 10, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden
            className="absolute -left-20 -bottom-24 h-64 w-64 rounded-full bg-black/10 blur-2xl"
            animate={{ y: [0, 12, 0], x: [0, -8, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
              Start building reliable web data pipelines today
            </h3>
            <p className="mt-3 text-emerald-50/90 max-w-2xl mx-auto">
              Build your first workflow in minutes. Schedule runs and stream results to your stack.
            </p>
            <div className="mt-6 flex justify-center">
              <Link href="/sign-up">
                <Button size="lg" variant="secondary" className="text-emerald-900">
                  Start free trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


