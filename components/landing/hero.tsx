'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Code } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative py-20 md:py-32 bg-gradient-to-b from-background to-primary/10 overflow-hidden">
      <div className="container text-center max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="absolute top-0 left-0 w-full h-full"
          style={{
            background:
              'radial-gradient(circle, rgba(var(--primary-rgb), 0.1) 0%, rgba(var(--background-rgb), 0) 70%)',
          }}
        />
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
        >
          Supercharge Your Workflows with{' '}
          <span className="text-primary">AIScrape</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-6 text-lg text-muted-foreground sm:text-xl md:text-2xl"
        >
          The ultimate platform for building, managing, and scaling complex web
          scraping workflows. Unlock AI-powered insights with ease.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center sm:space-x-4 space-y-4 sm:space-y-0"
        >
          <Link href="/sign-up">
            <Button size="lg" className="text-lg px-8 py-6 shadow-lg w-full sm:w-auto">
              Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="#features">
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 shadow-lg"
            >
              <Code className="mr-2 h-5 w-5" />
              View Features
            </Button>
          </Link>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-4 text-sm text-muted-foreground"
        >
          100 free credits for all new users!
        </motion.p>
      </div>
    </section>
  );
}
