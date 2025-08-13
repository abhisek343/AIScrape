'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

const code = `POST /api/workflows/execute HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{
  "workflowId": "extract-products",
  "inputs": {
    "url": "https://example.com/category/shoes"
  }
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid gap-10 md:grid-cols-2 items-center">
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="text-4xl md:text-5xl font-bold tracking-tight"
          >
            Ship to production in minutes
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mt-4 text-lg text-muted-foreground"
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
            className="absolute -inset-1 rounded-xl blur [background:radial-gradient(400px_400px_at_var(--mx,_50%)_var(--my,_50%),theme(colors.emerald.400/.35),transparent_40%)]"
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
            <pre className="p-4 text-sm leading-6 text-emerald-100 bg-slate-900 max-h-[320px] overflow-auto">
{code}
            </pre>
          </div>
        </motion.div>
      </div>
    </section>
  );
}



