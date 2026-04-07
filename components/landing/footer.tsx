'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Github, Twitter, Linkedin, Mail, ArrowRight, Zap } from 'lucide-react';
import Logo from '@/components/logo';
import { useState } from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  const columns = [
    {
      title: 'Product',
      links: [
        { name: 'Features', href: '#features' },
        { name: 'How It Works', href: '#how-it-works' },
        { name: 'Showcase', href: '#showcase' },
        { name: 'Pricing', href: '/billing' },
        { name: 'Integrations', href: '/integrations' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { name: 'Documentation', href: '/docs' },
        { name: 'API Reference', href: '/api' },
        { name: 'Blog', href: '/blog' },
        { name: 'Changelog', href: '/changelog' },
        { name: 'Status', href: '/status' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About', href: '/about' },
        { name: 'Careers', href: '/careers' },
        { name: 'Contact', href: '/contact' },
        { name: 'Partners', href: '/partners' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', href: '/privacy-policy' },
        { name: 'Terms of Service', href: '/terms-of-service' },
        { name: 'Cookie Policy', href: '/cookies' },
        { name: 'Security', href: '/security' },
      ],
    },
  ];

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter', color: 'hover:text-sky-400' },
    { icon: Linkedin, href: '#', label: 'LinkedIn', color: 'hover:text-blue-500' },
    { icon: Github, href: '#', label: 'GitHub', color: 'hover:text-purple-400' },
    { icon: Mail, href: 'mailto:hello@aiscrape.com', label: 'Email', color: 'hover:text-emerald-400' },
  ];

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative border-t border-emerald-500/10 bg-slate-950"
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,theme(colors.emerald.500/0.05),transparent_50%)]" />
      
      <div className="container relative mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 rounded-2xl border border-emerald-500/10 bg-gradient-to-br from-emerald-950/50 to-slate-900/50 p-6 backdrop-blur-sm sm:p-8"
        >
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold text-sm">Stay updated</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Get the latest updates</h3>
              <p className="text-slate-400">Join our newsletter for product updates, tips, and industry insights.</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full bg-slate-900/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 sm:w-64"
              />
              <Button 
                type="submit"
                className="h-12 w-full bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-500 sm:w-auto"
              >
                {isSubscribed ? 'Subscribed!' : 'Subscribe'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </div>
        </motion.div>

        {/* Main Footer Content */}
        <div className="mb-12 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {/* Brand Column */}
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-2">
            <Logo iconSize={32} />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              A practical platform to build, run, and monitor dependable web scraping at scale. 
              Trusted by 2,500+ companies worldwide.
            </p>
            
            {/* Social Links */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {socialLinks.map((social) => (
                <motion.div
                  key={social.label}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link 
                    href={social.href}
                    className={`w-10 h-10 rounded-xl bg-slate-900/50 border border-emerald-500/10 flex items-center justify-center text-slate-400 ${social.color} transition-all duration-300 hover:border-emerald-500/30 hover:bg-emerald-500/10`}
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-white mb-4 text-sm">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href} 
                      className="text-slate-400 hover:text-emerald-400 text-sm transition-colors duration-300 inline-flex items-center group"
                    >
                      {link.name}
                      <ArrowRight className="w-3 h-3 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-emerald-500/10">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <p className="text-sm text-slate-500">
              &copy; {currentYear} AIScrape. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm sm:gap-6">
              <Link href="/privacy-policy" className="text-slate-500 hover:text-emerald-400 transition-colors">
                Privacy
              </Link>
              <Link href="/terms-of-service" className="text-slate-500 hover:text-emerald-400 transition-colors">
                Terms
              </Link>
              <Link href="/cookies" className="text-slate-500 hover:text-emerald-400 transition-colors">
                Cookies
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-emerald-400">All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
