'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Logo iconSize={28} />
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-3">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Get Started</Button>
            </Link>
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
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
                <Link href="/sign-in">
                  <Button variant="ghost" className="w-full justify-start">Sign In</Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Get Started</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
