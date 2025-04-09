'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, UserPlus, Workflow, BarChart } from 'lucide-react';

const steps = [
  {
    icon: <UserPlus className="h-10 w-10 text-primary" />,
    title: 'Sign Up & Get Credits',
    description:
      'Create your account in seconds and receive 100 free credits to start exploring the platform.',
  },
  {
    icon: <Workflow className="h-10 w-10 text-primary" />,
    title: 'Build Your Workflow',
    description:
      'Use our intuitive drag-and-drop editor to design your data extraction workflows with ease.',
  },
  {
    icon: <BarChart className="h-10 w-10 text-primary" />,
    title: 'Monitor & Analyze',
    description:
      'Track performance with real-time analytics and manage your usage efficiently.',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 md:py-24 bg-primary/10">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Get Started in 3 Simple Steps
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Start automating your data extraction tasks in minutes. Our streamlined
            process makes it easy to get up and running.
          </p>
        </div>
        <div className="relative">
          <div
            className="absolute left-1/2 h-full w-px bg-border -translate-x-1/2"
            aria-hidden="true"
          />
          <div className="space-y-16">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center"
              >
                <div
                  className={`flex-1 ${
                    index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'
                  }`}
                >
                  <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 bg-background p-2 rounded-full border">
                  <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
                    {step.icon}
                  </div>
                </div>
                <div className="flex-1" />
              </motion.div>
            ))}
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <Link href="/sign-up">
            <Button size="lg" className="text-lg px-8 py-6 shadow-lg">
              Start Scraping Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
