'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Github } from 'lucide-react';
import Logo from '@/components/logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const columns = [
    {
      title: 'Project',
      links: [
        { name: 'Features', href: '#features' },
        { name: 'How It Works', href: '#how-it-works' },
        { name: 'Use Cases', href: '#use-cases' },
        { name: 'FAQ', href: '#faq' },
      ],
    },
    {
      title: 'Site',
      links: [
        { name: 'About', href: '/about' },
        { name: 'Engineering Notes', href: '/blog' },
        { name: 'Contact', href: '/contact' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy note', href: '/privacy-policy' },
        { name: 'Responsible use', href: '/terms-of-service' },
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
              A portfolio/reference implementation of a visual, queue-backed browser automation system.
            </p>
            <div className="mt-4">
              <Link
                href="https://github.com/abhisek343/AIScrape"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Github className="h-4 w-4" />
                Source on GitHub
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
          <p>&copy; {currentYear} AIScrape.</p>
        </div>
      </div>
    </motion.footer>
  );
}
