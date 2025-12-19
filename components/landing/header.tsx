'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { cn } from '@/lib/utils';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isSignedIn } = useUser();
  const { signOut } = useClerk();

  // Handle scroll for additional styling if needed (e.g. shrinking)
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: 'Features', href: '#features' },
    { name: 'Showcase', href: '#showcase' },
    { name: 'Use Cases', href: '#use-cases' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Blog', href: '/blog' },
  ];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, type: 'spring', bounce: 0.3 }}
      className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4"
    >
      <div
        className={cn(
          "relative flex items-center justify-between w-full max-w-5xl px-4 py-3 sm:px-6",
          "bg-white/70 dark:bg-black/70 backdrop-blur-xl border border-white/20 dark:border-white/10",
          "rounded-2xl shadow-2xl shadow-black/5 dark:shadow-black/20",
          "transition-all duration-300 ease-in-out",
          scrolled && "bg-white/90 dark:bg-black/90 shadow-xl"
        )}
      >
        {/* Brand */}
        <div className="flex-1 flex items-center justify-start">
          <Logo iconSize={28} fontSize="text-xl" />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href} className="relative px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group">
              {item.name}
              <span className="absolute inset-0 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/10 scale-0 group-hover:scale-100 transition-transform duration-200" />
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex-1 flex items-center justify-end gap-3">
          {isSignedIn ? (
            <>
              <Link href="/home" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="rounded-full hover:bg-emerald-50 text-emerald-700">Dashboard</Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="hidden sm:flex rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="rounded-full text-slate-600 hover:text-emerald-600">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30">
                  Get Started
                </Button>
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="absolute top-full left-0 right-0 mt-2 px-4 flex justify-center w-full pointer-events-none"
          >
            <div className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 pointer-events-auto flex flex-col gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
              {isSignedIn ? (
                <>
                  <Link href="/home" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full justify-start rounded-xl" variant="ghost">Dashboard</Button>
                  </Link>
                  <Button onClick={() => signOut()} className="w-full justify-start rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50" variant="ghost">Sign Out</Button>
                </>
              ) : (
                <>
                  <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full justify-start rounded-xl" variant="ghost">Sign In</Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
