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
    <section id="features" className="relative py-24 md:py-32 overflow-hidden">
      {/* Enhanced background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-white to-slate-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,theme(colors.emerald.500/0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,theme(colors.emerald.400/0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,theme(colors.emerald.400/0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_70%_80%,theme(colors.emerald.500/0.08),transparent_50%)]" />
      
      {/* 3D Geometric Network */}
      <div className="absolute inset-0 opacity-20">
        {/* Smaller 3D shapes for features section */}
        <div className="absolute inset-0">
          {[
            { x: '5%', y: '10%', size: 'w-16 h-10', delay: 0.2, rotation: '8deg' },
            { x: '90%', y: '15%', size: 'w-12 h-8', delay: 0.5, rotation: '-12deg' },
            { x: '15%', y: '85%', size: 'w-18 h-12', delay: 0.8, rotation: '15deg' },
            { x: '85%', y: '90%', size: 'w-14 h-9', delay: 1.1, rotation: '-8deg' },
            { x: '50%', y: '5%', size: 'w-20 h-13', delay: 1.4, rotation: '6deg' },
          ].map((shape, index) => (
            <motion.div
              key={`features-shape-${index}`}
              className={`absolute ${shape.size} transform-gpu`}
              style={{ 
                left: shape.x, 
                top: shape.y,
                transform: `rotate(${shape.rotation})`,
              }}
              initial={{ opacity: 0, scale: 0, rotateY: -90 }}
              whileInView={{ 
                opacity: 1, 
                scale: 1, 
                rotateY: 0,
                y: [0, -3, 0],
              }}
              viewport={{ once: true }}
              transition={{ 
                duration: 1.2, 
                delay: shape.delay,
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <div className="relative w-full h-full transform-gpu preserve-3d">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/60 to-emerald-200/40 dark:from-emerald-800/40 dark:to-emerald-900/60 rounded-md shadow-xl shadow-emerald-500/15 border border-emerald-200/50 dark:border-emerald-800/50 backdrop-blur-sm">
                  <div className="absolute inset-1 bg-gradient-to-br from-emerald-50/30 to-transparent dark:from-emerald-400/10 rounded-sm" />
                </div>
                <div className="absolute top-0.5 right-0 w-1.5 h-full bg-gradient-to-b from-emerald-300/30 to-emerald-500/50 dark:from-emerald-700/50 dark:to-emerald-900/70 transform skew-y-6 origin-top-right rounded-r-md" />
                <div className="absolute bottom-0 left-0.5 right-0 h-1.5 bg-gradient-to-r from-emerald-400/30 to-emerald-600/50 dark:from-emerald-700/50 dark:to-emerald-900/70 transform skew-x-6 origin-bottom-left rounded-b-md" />
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Connecting neural network lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.2 }} />
              <stop offset="50%" style={{ stopColor: '#34d399', stopOpacity: 0.4 }} />
              <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0.1 }} />
            </linearGradient>
          </defs>
          
          <motion.path
            d="M 0 200 Q 300 150 600 300 Q 900 450 1200 250"
            stroke="url(#neuralGradient)"
            strokeWidth="1.5"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2.5, delay: 0.5, ease: "easeInOut" }}
          />
          <motion.path
            d="M 100 500 Q 400 400 700 550 Q 1000 650 1200 500"
            stroke="url(#neuralGradient)"
            strokeWidth="1.5"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2.5, delay: 1, ease: "easeInOut" }}
          />
        </svg>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Enhanced Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-semibold mb-8 border border-emerald-200/60 dark:border-emerald-800/60 backdrop-blur-sm"
          >
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            Production-Ready Features
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.25, 0.25, 0, 1] }}
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-6"
          >
            Everything you need for
            <span className="block bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 bg-clip-text text-transparent">
              production scraping
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto leading-relaxed"
          >
            Build, deploy, and monitor web scraping workflows with <span className="font-semibold text-emerald-600 dark:text-emerald-400">enterprise-grade tools</span> designed for scale and reliability.
          </motion.p>
        </div>

        {/* Enhanced Main Features */}
        <div className="grid gap-8 md:grid-cols-3 mb-24">
          {mainFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.15, ease: [0.25, 0.25, 0, 1] }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative"
            >
              {/* Gradient border effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/30 via-emerald-400/20 to-emerald-600/30 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
              
              <div className="relative p-10 bg-gradient-to-br from-white/90 via-white/80 to-emerald-50/30 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-emerald-950/20 rounded-3xl border border-emerald-100/60 dark:border-emerald-900/40 shadow-2xl shadow-emerald-100/20 dark:shadow-emerald-900/10 backdrop-blur-sm overflow-hidden">
                {/* Background pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/20 to-transparent dark:from-emerald-800/20 rounded-full blur-3xl"></div>
                
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-8 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/60 dark:to-emerald-800/40 shadow-lg shadow-emerald-200/30 dark:shadow-emerald-900/30 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-8 w-8 text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-300" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                    {feature.description}
                  </p>
                  
                  {/* Hover effect arrow */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    whileHover={{ opacity: 1, x: 0 }}
                    className="flex items-center mt-6 text-emerald-600 dark:text-emerald-400 font-semibold"
                  >
                    <span className="text-sm">Learn more</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Enhanced Additional Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.25, 0, 1] }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-20"
        >
          {additionalFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group flex items-start gap-5 p-6 bg-gradient-to-br from-white/80 to-emerald-50/20 dark:from-slate-900/80 dark:to-emerald-950/10 backdrop-blur-sm rounded-2xl border border-emerald-100/40 dark:border-emerald-900/30 shadow-lg shadow-emerald-100/10 dark:shadow-emerald-900/5 hover:shadow-xl hover:shadow-emerald-200/20 dark:hover:shadow-emerald-800/10 transition-all duration-300"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md shadow-emerald-200/20 dark:shadow-emerald-900/20">
                <feature.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-300" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-base mb-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-300">
                  {feature.title}
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Enhanced CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.25, 0, 1] }}
          className="relative text-center p-12 bg-gradient-to-br from-emerald-50/80 via-white/60 to-emerald-100/40 dark:from-emerald-950/40 dark:via-slate-900/60 dark:to-emerald-900/20 rounded-3xl border border-emerald-200/60 dark:border-emerald-900/40 shadow-2xl shadow-emerald-100/20 dark:shadow-emerald-900/10 backdrop-blur-sm overflow-hidden"
        >
          {/* Background effects */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-emerald-300/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-emerald-400/20 to-transparent rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-semibold mb-6 border border-emerald-200/60 dark:border-emerald-800/60"
            >
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              Join 2,500+ Companies
            </motion.div>
            
            <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-6">
              Ready to scale your
              <span className="block bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 bg-clip-text text-transparent">
                data operations?
              </span>
            </h3>
            
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
              Join thousands of companies using <span className="font-semibold text-emerald-600 dark:text-emerald-400">AIScrape</span> to automate their web data collection workflows with enterprise-grade reliability.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/sign-up">
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl blur opacity-70 group-hover:opacity-100 transition duration-300"></div>
                  <Button size="lg" className="relative bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-10 py-4 text-lg font-semibold shadow-2xl shadow-emerald-500/25 transition-all duration-300 rounded-xl">
                    Start free trial
                    <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                </motion.div>
              </Link>
              
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-sm text-slate-500 dark:text-slate-400"
              >
                No credit card required • Setup in 5 minutes
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
