'use client';

import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  {
    q: 'How does the free trial work?',
    a: 'You get full access for 14 days with 5,000 credits. No credit card required. Upgrade anytime, cancel anytime.'
  },
  {
    q: 'Is AIScrape compliant for enterprise use?',
    a: 'Yes. We offer audit logs, SSO, encryption at rest and in transit, and optional dedicated infrastructure.'
  },
  {
    q: 'Do you support rotating proxies and headless browsers?',
    a: 'Absolutely. Our managed runtime includes smart rotation, anti-bot evasion, and Chromium-based execution.'
  },
  {
    q: 'Can I integrate with my stack?',
    a: 'Use our REST API and webhooks or export directly to your warehouse, queue, or storage.'
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
            className="text-4xl md:text-5xl font-bold tracking-tight"
          >
            Frequently asked questions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mt-4 text-muted-foreground max-w-2xl mx-auto"
          >
            Everything you need to know about getting started and scaling with AIScrape.
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



