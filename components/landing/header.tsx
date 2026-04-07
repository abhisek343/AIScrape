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
      className="fixed left-0 right-0 top-3 z-50 flex justify-center px-3 sm:top-6 sm:px-4"
    >
      <div
        className={cn(
          "relative flex w-full max-w-5xl items-center justify-between gap-3 px-3 py-2.5 sm:px-6 sm:py-3",
          "bg-white/70 dark:bg-black/70 backdrop-blur-xl border border-white/20 dark:border-white/10",
          "rounded-2xl shadow-2xl shadow-black/5 dark:shadow-black/20",
          "transition-all duration-300 ease-in-out",
          scrolled && "bg-white/90 dark:bg-black/90 shadow-xl"
        )}
      >
        {/* Brand */}
        <div className="min-w-0 flex-1 flex items-center justify-start">
          <Logo iconSize={24} fontSize="text-lg sm:text-xl" />
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
        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
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
                <Button size="sm" className="rounded-full bg-emerald-600 px-3 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 sm:px-4">
                  Get Started
                </Button>
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden rounded-full p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
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
            className="pointer-events-none absolute left-0 right-0 top-full mt-2 flex w-full justify-center px-3 sm:px-4"
          >
            <div className="pointer-events-auto flex w-full max-w-5xl flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900">
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
                  <Link href="/sign-up" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">Get Started</Button>
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
