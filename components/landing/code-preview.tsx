'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

const code = `POST /api/workflows/slash HTTP/1.1
Authorization: Bearer <user session>
Content-Type: application/json

{
  "command": "extract links from https://example.com"
}`.trim();

export default function CodePreview() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty('--mx', `${x}px`);
      el.style.setProperty('--my', `${y}px`);
    };
    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto grid items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8">
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
          >
            Ship to production in minutes
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mt-4 text-base text-muted-foreground sm:text-lg"
          >
            A straightforward API and webhooks make it simple to trigger workflows and consume results.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          {/* shimmering accent */}
          <motion.div
            aria-hidden
            ref={glowRef}
            className="absolute -inset-1 rounded-xl blur [background:radial-gradient(320px_320px_at_var(--mx,_50%)_var(--my,_50%),theme(colors.emerald.400/.35),transparent_40%)] sm:[background:radial-gradient(400px_400px_at_var(--mx,_50%)_var(--my,_50%),theme(colors.emerald.400/.35),transparent_40%)]"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative rounded-xl border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-hidden">
            <div className="px-4 py-2 text-xs text-muted-foreground border-b flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300/60" />
              <span className="ml-2">request.http</span>
            </div>
            <pre className="max-h-[320px] overflow-auto bg-slate-900 p-4 text-xs leading-6 text-emerald-100 sm:text-sm">
{code}
            </pre>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


