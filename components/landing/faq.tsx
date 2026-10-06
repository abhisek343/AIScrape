'use client';

import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  {
    q: 'Can I run AIScrape without paid infrastructure?',
    a: 'Yes. The core demo runs PostgreSQL, Redis, the Next.js app, a BullMQ worker, and local Chromium with Docker Compose. Authenticated UI, Gemini, Stripe, and remote-browser features require their own test credentials.'
  },
  {
    q: 'Why is workflow execution handled by a worker?',
    a: 'Browser automation is long-running and resource-heavy. AIScrape persists the execution plan, enqueues an execution ID in BullMQ, and lets a separate worker run Chromium tasks while the web request returns promptly.'
  },
  {
    q: 'How are browser targets constrained?',
    a: 'The browser path accepts HTTP(S) targets, rejects private and reserved network destinations, resolves hostnames before use, supports host allowlists, and includes robots-policy and per-host pacing controls.'
  },
  {
    q: 'Does the queue benchmark represent production capacity?',
    a: 'No. The included benchmark measures Redis/BullMQ enqueue throughput only. End-to-end browser capacity must be measured separately with representative workflows and infrastructure.'
  }
];

export default function FAQ() {
  return (
    <section id="faq" className="py-20 md:py-28 bg-muted/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight"
          >
            Project questions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mt-4 text-muted-foreground max-w-2xl mx-auto"
          >
            What the repository can reproduce, how execution works, and where the current boundaries are.
          </motion.p>
        </div>

        <div className="mx-auto max-w-3xl relative">
          <div className="pointer-events-none absolute -top-10 -left-16 w-40 h-40 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -right-16 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl" />
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((item, idx) => (
              <AccordionItem key={item.q} value={`item-${idx}`}>
                <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
