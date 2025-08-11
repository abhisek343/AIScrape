'use client';

import { motion } from 'framer-motion';
import { Bot, Boxes, LayoutGrid } from 'lucide-react';

const items = [
  {
    icon: LayoutGrid,
    title: 'Visual builder',
    desc: 'Compose dependable workflows with nodes, branches, and validations.'
  },
  {
    icon: Bot,
    title: 'AI extraction',
    desc: 'Use AI to structure messy HTML into clean JSON reliably.'
  },
  {
    icon: Boxes,
    title: 'Runtime & retries',
    desc: 'Headless browser, smart waiting, anti-bot, and automatic retries.'
  }
];

export default function Showcase() {
  return (
    <section id="showcase" className="relative py-20 md:py-28">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-600/10 via-transparent to-transparent" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold tracking-tight"
          >
            Build beautifully. Ship confidently.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
          >
            A refined UI, glassy surfaces, and gentle motion help you think clearly about your data flows.
          </motion.p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              whileHover={{ y: -8, scale: 1.01 }}
              className="relative rounded-2xl"
            >
              {/* Gradient border */}
              <div className="p-[1px] rounded-2xl bg-gradient-to-br from-emerald-400/80 via-emerald-300/40 to-transparent">
                {/* Card */}
                <div className="h-full rounded-2xl bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border">
                  <div className="p-6 md:p-8">
                    <div className="inline-flex w-12 h-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                    <p className="mt-2 text-muted-foreground">{item.desc}</p>
                    <div className="mt-6 h-36 rounded-xl bg-muted/60 border flex items-center justify-center text-muted-foreground">
                      Preview
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


