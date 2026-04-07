'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useState, useCallback } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  scale: number;
}

export default function CTA() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    // Create particles
    const newParticles: Particle[] = [];
    for (let i = 0; i < 12; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: 0,
        y: 0,
        angle: (i * 30) + Math.random() * 20,
        scale: 0.5 + Math.random() * 0.5
      });
    }
    setParticles(newParticles);
    
    // Clear particles after animation
    setTimeout(() => setParticles([]), 1000);
  }, []);

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Enhanced background with mesh gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-700" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(52,211,153,0.3),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(16,185,129,0.2),transparent_50%)]" />
      
      {/* Floating orbs */}
      <motion.div
        className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/10 blur-3xl"
        animate={{ 
          y: [0, -20, 0], 
          x: [0, 10, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-emerald-400/20 blur-3xl"
        animate={{ 
          y: [0, 15, 0], 
          x: [0, -10, 0],
          scale: [1, 1.15, 1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.25, 0, 1] }}
          className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur-sm"
        >
          {/* Glass effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 rounded-3xl" />
          
          <div className="relative p-6 text-center sm:p-10 md:p-16">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-emerald-100 rounded-full text-sm font-semibold mb-6 border border-white/20 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4" />
              Start for free today
            </motion.div>
            
            <motion.h3 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl"
            >
              Ready to transform your
              <span className="block">data workflows?</span>
            </motion.h3>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-emerald-50/90 sm:text-lg md:text-xl"
            >
              Join thousands of teams who've automated their data collection with AIScrape. 
              Set up your first workflow in under 5 minutes.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center"
            >
              <Link href="/sign-up" className="w-full sm:w-auto">
                <motion.div
                  className="group relative w-full"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={() => setIsHovering(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Particle burst effect */}
                  {particles.map((particle) => (
                    <motion.div
                      key={particle.id}
                      className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full pointer-events-none"
                      initial={{ 
                        x: 0, 
                        y: 0, 
                        opacity: 1, 
                        scale: particle.scale 
                      }}
                      animate={{ 
                        x: Math.cos(particle.angle * Math.PI / 180) * 100,
                        y: Math.sin(particle.angle * Math.PI / 180) * 100,
                        opacity: 0,
                        scale: 0
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  ))}
                  
                  <div className="absolute -inset-1 bg-white/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Button 
                    size="lg" 
                    className="group relative w-full overflow-hidden rounded-xl bg-white px-6 py-5 text-base font-bold text-emerald-900 shadow-2xl shadow-black/20 transition-all duration-300 hover:bg-emerald-50 sm:w-auto sm:px-10 sm:py-6 sm:text-lg"
                  >
                    {/* Shimmer effect */}
                    <span className="pointer-events-none absolute inset-0 rounded-xl [mask-image:linear-gradient(120deg,transparent,rgba(255,255,255,.5),transparent)] translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                    
                    <span className="relative flex items-center gap-2">
                      Start free trial
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                    </span>
                  </Button>
                </motion.div>
              </Link>
              
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-center text-sm text-emerald-100/70"
              >
                No credit card required • 14-day free trial
              </motion.p>
            </motion.div>
            
            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 flex flex-wrap justify-center items-center gap-6 text-emerald-100/60 text-sm"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-300 rounded-full" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-300 rounded-full" />
                <span>GDPR Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-300 rounded-full" />
                <span>99.9% Uptime SLA</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
