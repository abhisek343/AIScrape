'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Github, Twitter, Linkedin } from 'lucide-react';
import Logo from '@/components/logo';

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="py-12 border-t border-border/40 bg-background"
    >
      <div className="container grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="flex flex-col space-y-4">
          <Logo iconSize={32} />
          <p className="text-muted-foreground">
            Automate your data extraction with AI-powered workflows.
          </p>
          <div className="flex space-x-4">
            <Link href="#" className="text-muted-foreground hover:text-primary">
              <Github />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary">
              <Twitter />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary">
              <Linkedin />
            </Link>
          </div>
        </div>
        <div className="flex flex-col space-y-2">
          <h3 className="font-semibold">Company</h3>
          <Link href="/about" className="text-muted-foreground hover:text-primary">
            About Us
          </Link>
          <Link href="/blog" className="text-muted-foreground hover:text-primary">
            Blog
          </Link>
          <Link href="/contact" className="text-muted-foreground hover:text-primary">
            Contact
          </Link>
        </div>
        <div className="flex flex-col space-y-2">
          <h3 className="font-semibold">Legal</h3>
          <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary">
            Privacy Policy
          </Link>
          <Link href="/terms-of-service" className="text-muted-foreground hover:text-primary">
            Terms of Service
          </Link>
        </div>
        <div className="flex flex-col space-y-2">
          <h3 className="font-semibold">Stay Updated</h3>
          <p className="text-muted-foreground">
            Subscribe to our newsletter for the latest updates.
          </p>
          <div className="flex space-x-2">
            <Input type="email" placeholder="Enter your email" />
            <Button>Subscribe</Button>
          </div>
        </div>
      </div>
      <div className="container text-center text-muted-foreground mt-8">
        <p>&copy; {new Date().getFullYear()} AIScrape. All rights reserved.</p>
      </div>
    </motion.footer>
  );
}
