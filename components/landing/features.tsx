'use client';

import { motion } from 'framer-motion';
import {
  BarChart,
  Bot,
  Lock,
  Zap,
  DollarSign,
  Clock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

const features = [
  {
    icon: <Zap className="h-10 w-10 text-primary" />,
    title: 'Workflow Automation',
    description:
      'Build and execute multi-step workflows with our intuitive drag-and-drop editor.',
  },
  {
    icon: <Bot className="h-10 w-10 text-primary" />,
    title: 'AI-Powered Scraping',
    description:
      'Leverage AI to intelligently navigate and extract data from complex websites.',
  },
  {
    icon: <Lock className="h-10 w-10 text-primary" />,
    title: 'Secure Credential Storage',
    description:
      'Safely store API keys and other sensitive credentials with end-to-end encryption.',
  },
  {
    icon: <BarChart className="h-10 w-10 text-primary" />,
    title: 'Advanced Analytics',
    description:
      'Monitor performance and usage with real-time charts and detailed analytics.',
  },
  {
    icon: <DollarSign className="h-10 w-10 text-primary" />,
    title: 'Stripe Billing',
    description:
      'Manage subscriptions and track usage transparently with our integrated Stripe billing system.',
  },
  {
    icon: <Clock className="h-10 w-10 text-primary" />,
    title: 'Scheduled Executions',
    description:
      'Automate your workflows by scheduling them to run at specific intervals.',
  },
  {
    icon: <ShieldCheck className="h-10 w-10 text-primary" />,
    title: 'Reliable & Secure',
    description:
      'Our platform is built with security in mind, ensuring your data is always protected.',
  },
  {
    icon: <TrendingUp className="h-10 w-10 text-primary" />,
    title: 'Scalable Infrastructure',
    description:
      'Our robust infrastructure is designed to handle workflows of any scale.',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-16 md:py-24 bg-background">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Everything You Need to Succeed
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            AIScrape provides a comprehensive suite of tools to help you
            automate data collection efficiently, securely, and at scale.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 bg-card border rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-center justify-center h-16 w-16 bg-primary/10 rounded-full mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
