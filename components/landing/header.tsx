'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  const navigation = [
    { name: 'Features', href: '#features' },
    { name: 'Showcase', href: '#showcase' },
    { name: 'Use Cases', href: '#use-cases' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Blog', href: '/blog' }, // ensure route exists or remove
  ];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.25, 0, 1] }}
      className="sticky top-0 z-50 w-full border-b border-emerald-100/60 dark:border-emerald-900/40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60 shadow-lg shadow-emerald-100/10 dark:shadow-emerald-900/10"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Logo iconSize={32} />
          </motion.div>

         {/* Desktop nav */}
         <nav className="hidden md:flex items-center space-x-1" aria-label="Primary">
            {navigation.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
              >
                <Link
                  href={item.href}
                  className="relative px-4 py-2 text-sm font-medium tracking-normal text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200 rounded-lg hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 group"
                >
                  {item.name}
                  <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-300 group-hover:w-8 group-hover:left-1/2 group-hover:-translate-x-1/2"></span>
                </Link>
              </motion.div>
            ))}
          </nav>

          <motion.div 
            className="hidden md:flex items-center space-x-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="hidden xl:block text-xs text-muted-foreground pr-4">
              <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live preview
              </span>
            </div>
            {isSignedIn ? (
              // Show user info and sign out when signed in
              <>
                <Link href="/home">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="ghost" className="font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all duration-300">
                      Dashboard
                    </Button>
                  </motion.div>
                </Link>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="ghost" 
                    onClick={() => signOut()}
                    className="font-semibold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-300"
                  >
                    Sign Out
                  </Button>
                </motion.div>
              </>
            ) : (
              // Show sign in and sign up when not signed in
              <>
                <Link href="/sign-in">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="ghost" className="font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all duration-300">
                      Sign In
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/sign-up">
                  <motion.div 
                    whileHover={{ scale: 1.05, y: -1 }} 
                    whileTap={{ scale: 0.95 }}
                    className="relative group"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg blur opacity-70 group-hover:opacity-100 transition duration-300"></div>
                    <Button className="relative bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold shadow-lg shadow-emerald-500/20 transition-all duration-300 border border-emerald-500/20">
                      Get Started
                    </Button>
                  </motion.div>
                </Link>
              </>
            )}
          </motion.div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Toggle menu</span>
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2 }}
            id="mobile-menu"
            className="md:hidden border-t"
          >
            <div className="px-2 pt-2 pb-3 space-y-1" role="menu" aria-label="Mobile">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 space-y-2">
                {isSignedIn ? (
                  // Show dashboard and sign out for mobile when signed in
                  <>
                    <Link href="/home">
                      <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      onClick={() => signOut()}
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  // Show sign in and sign up for mobile when not signed in
                  <>
                    <Link href="/sign-in">
                      <Button variant="ghost" className="w-full justify-start">Sign In</Button>
                    </Link>
                    <Link href="/sign-up">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
