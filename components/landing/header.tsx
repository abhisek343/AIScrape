'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';

export default function Header() {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container flex items-center justify-between h-16 max-w-screen-2xl">
        <div className="flex items-center space-x-2">
          <Logo iconSize={24} />
        </div>
        <nav className="flex items-center space-x-4">
          <Link href="/sign-in">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/sign-up">
            <Button>Sign Up</Button>
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
