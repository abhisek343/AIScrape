'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, UserPlus, Workflow, BarChart3, CheckCircle, Play } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Sign up & connect',
    description: 'Create your account in 30 seconds. Connect your data sources and configure your workspace.',
    details: ['Free 14-day trial', 'No credit card required', 'Instant access to all features']
  },
  {
    number: '02',
    icon: Workflow,
    title: 'Build workflows',
    description: 'Design your scraping logic with our visual editor. Test and validate your workflows in real-time.',
    details: ['Drag & drop interface', 'Pre-built templates', 'Real-time testing']
  },
  {
    number: '03',
    icon: BarChart3,
    title: 'Deploy & scale',
    description: 'Launch your workflows to production. Monitor performance and scale automatically as needed.',
    details: ['One-click deployment', 'Auto-scaling', 'Real-time monitoring']
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-muted/50 dark:bg-background/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white"
          >
            From idea to production in
            <span className="block bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
              less than 10 minutes
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto"
          >
            Our streamlined process gets you from concept to collecting data faster than any other platform.
          </motion.p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-200 via-cyan-200 to-indigo-200 dark:from-indigo-800 dark:via-cyan-800 dark:to-indigo-800 transform -translate-y-1/2 z-0">
            <div className="absolute inset-0 animate-pulse [mask-image:linear-gradient(to_right,transparent,black,transparent)] bg-[linear-gradient(90deg,theme(colors.emerald.400/.0)_0%,theme(colors.emerald.400/.5)_50%,theme(colors.emerald.400/.0)_100%)]"></div>
          </div>

          <div className="grid gap-8 lg:gap-12 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative"
              >
                {/* Step number */}
                <div className="relative z-10 mx-auto w-16 h-16 bg-white dark:bg-slate-800 border-4 border-emerald-200 dark:border-emerald-800 rounded-full flex items-center justify-center mb-6">
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{step.number}</span>
                </div>

                 <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg text-center relative overflow-hidden">
                   <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-400/10 rounded-full blur-2xl" />
                   <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl mb-6">
                    <step.icon className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{step.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">{step.description}</p>
                  
                  <ul className="space-y-2 text-sm">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-16"
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Ready to start building?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Join thousands of developers and businesses who trust AIScrape for their data collection needs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/sign-up">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">
                  Start free trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button size="lg" variant="outline" className="border-slate-300 dark:border-slate-600 px-8">
                  <Play className="mr-2 h-4 w-4" />
                  Watch demo
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
