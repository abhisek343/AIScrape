'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
import Logo from '@/components/logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const columns = [
    {
      title: 'Product',
      links: [
        { name: 'Features', href: '#features' },
        { name: 'How It Works', href: '#how-it-works' },
        { name: 'Showcase', href: '#showcase' },
        { name: 'Integrations', href: '/integrations' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About', href: '/about' },
        { name: 'Blog', href: '/blog' },
        { name: 'Careers', href: '/careers' },
        { name: 'Contact', href: '/contact' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy', href: '/privacy-policy' },
        { name: 'Terms', href: '/terms-of-service' },
      ],
    },
  ];

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="border-t bg-background"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          <div>
            <Logo iconSize={28} />
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">
              A practical platform to build, run, and monitor dependable web scraping at scale.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-4 w-4" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Linkedin className="h-4 w-4" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Github className="h-4 w-4" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Mail className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold">{col.title}</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {col.links.map((l) => (
                  <li key={l.name}>
                    <Link href={l.href} className="hover:text-foreground">
                      {l.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t pt-6 text-xs text-muted-foreground">
          <div className="flex items-center justify-between flex-col gap-3 md:flex-row">
            <p>&copy; {currentYear} AIScrape. All rights reserved.</p>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span>Newsletter</span>
              <Input type="email" placeholder="Your email" className="h-8 w-56" />
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
