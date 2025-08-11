'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Workflow, 
  Calendar, 
  BarChart3, 
  Shield, 
  Globe, 
  Zap, 
  Database, 
  Lock, 
  Code, 
  AlertTriangle,
  TrendingUp,
  Users,
  ArrowRight
} from 'lucide-react';

const mainFeatures = [
  {
    icon: Workflow,
    title: 'Visual Workflow Builder',
    description: 'Design complex scraping logic with our intuitive drag-and-drop interface. No coding required.',
    color: 'primary'
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Run workflows on custom schedules with intelligent retry logic and timezone support.',
    color: 'chart-1'
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description: 'Monitor performance, track success rates, and get detailed insights into your data operations.',
    color: 'chart-2'
  }
];

const additionalFeatures = [
  { icon: Shield, title: 'Enterprise Security', desc: 'SOC 2 compliant with end-to-end encryption' },
  { icon: Globe, title: 'Global Infrastructure', desc: 'Deploy across multiple regions for optimal performance' },
  { icon: Zap, title: 'High Performance', desc: 'Process thousands of pages per minute' },
  { icon: Database, title: 'Data Processing', desc: 'Clean, validate, and transform data automatically' },
  { icon: Lock, title: 'Secure Credentials', desc: 'Safely store and manage API keys and secrets' },
  { icon: Code, title: 'API & Webhooks', desc: 'Integrate with your existing tools and workflows' },
  { icon: AlertTriangle, title: 'Smart Alerts', desc: 'Get notified when workflows fail or need attention' },
  { icon: TrendingUp, title: 'Scalable Architecture', desc: 'Auto-scale based on demand without manual intervention' },
  { icon: Users, title: 'Team Collaboration', desc: 'Share workflows and manage permissions across teams' }
];

export default function Features() {
  return (
    <section id="features" className="py-20 md:py-28 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white"
          >
            Everything you need for production scraping
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto"
          >
            Build, deploy, and monitor web scraping workflows with enterprise-grade tools designed for scale and reliability.
          </motion.p>
        </div>

        {/* Main Features */}
        <div className="grid gap-8 md:grid-cols-3 mb-20">
          {mainFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-6 bg-emerald-100 dark:bg-emerald-900/40`}>
                <feature.icon className={`h-7 w-7 text-emerald-700 dark:text-emerald-300`} />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Additional Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-16"
        >
          {additionalFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className="flex items-start gap-4 p-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                <feature.icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{feature.title}</h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{feature.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center p-8 bg-gradient-to-r from-emerald-100/50 to-emerald-50/30 dark:from-emerald-900/30 dark:to-emerald-900/10 rounded-2xl border border-emerald-200 dark:border-emerald-900"
        >
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Ready to scale your data operations?
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
            Join thousands of companies using AIScrape to automate their web data collection workflows.
          </p>
          <div className="flex items-center justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
                Start free trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
