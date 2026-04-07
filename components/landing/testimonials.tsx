'use client';

import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';

const testimonials = [
  {
    quote: "AIScrape reduced our data collection time by 80%. The visual workflow builder is incredibly intuitive and the scheduling features are rock-solid.",
    author: "Sarah Chen",
    role: "Data Engineering Lead",
    company: "TechFlow Inc",
    avatar: "SC",
    rating: 5
  },
  {
    quote: "We evaluated 5 different scraping solutions. AIScrape stood out for its reliability, ease of use, and excellent support. Highly recommended!",
    author: "Marcus Rodriguez",
    role: "CTO",
    company: "DataVantage",
    avatar: "MR",
    rating: 5
  },
  {
    quote: "The AI extraction feature is a game-changer. We went from messy HTML parsing to structured JSON in minutes. Best investment we've made.",
    author: "Emily Watson",
    role: "Product Manager",
    company: "MarketScope",
    avatar: "EW",
    rating: 5
  },
  {
    quote: "Enterprise-grade features without the enterprise complexity. The audit logs and retry mechanisms give us confidence at scale.",
    author: "David Park",
    role: "VP of Engineering",
    company: "ScaleOps",
    avatar: "DP",
    rating: 5
  }
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="relative py-24 md:py-32 overflow-hidden">
      {/* Dark layered background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,theme(colors.emerald.500/0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,theme(colors.emerald.400/0.05),transparent_50%)]" />
      
      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-600/10 via-transparent to-emerald-800/10" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-emerald-500/5 to-transparent" />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-300 rounded-full text-sm font-semibold mb-6 border border-emerald-500/20 backdrop-blur-sm"
          >
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Customer Stories
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.25, 0.25, 0, 1] }}
            className="mb-6 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl"
          >
            Loved by data teams
            <span className="block bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500 bg-clip-text text-transparent">
              worldwide
            </span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto max-w-3xl text-base leading-relaxed text-slate-400 sm:text-lg md:text-xl lg:text-2xl"
          >
            See why <span className="text-emerald-400 font-semibold">2,500+ companies</span> trust AIScrape for their critical data operations.
          </motion.p>
        </div>
        
        {/* Testimonials Grid */}
        <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.25, 0.25, 0, 1] }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative"
            >
              {/* Gradient border on hover */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/30 via-emerald-400/20 to-emerald-600/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
              
              <div className="relative h-full overflow-hidden rounded-2xl border border-emerald-500/10 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-emerald-950/20 p-5 backdrop-blur-sm sm:p-6">
                {/* Quote icon */}
                <div className="absolute top-4 right-4 opacity-10">
                  <Quote className="w-12 h-12 text-emerald-400" />
                </div>
                
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                  ))}
                </div>
                
                {/* Quote text */}
                <p className="text-slate-300 leading-relaxed mb-6 text-sm">
                  "{testimonial.quote}"
                </p>
                
                {/* Author info */}
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{testimonial.author}</div>
                    <div className="text-slate-500 text-xs">{testimonial.role}</div>
                    <div className="text-emerald-400 text-xs">{testimonial.company}</div>
                  </div>
                </div>
                
                {/* Glow effect */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Social proof stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 gap-6 sm:flex sm:flex-wrap sm:justify-center sm:gap-8 md:gap-16"
        >
          {[
            { value: "10M+", label: "Pages Scraped" },
            { value: "99.9%", label: "Uptime" },
            { value: "4.9/5", label: "Rating" },
            { value: "24/7", label: "Support" }
          ].map((stat, idx) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-slate-500 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
