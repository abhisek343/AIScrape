import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';

import { Toaster } from '@/components/ui/sonner';
import AppProviders from '@/components/providers/app-providers';

import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'AIScrape',
  description: 'AI + web scraping = streamlined data workflows.',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/home"
      signUpFallbackRedirectUrl="/setup"
      appearance={{
        elements: {
          formButtonPrimary: 'bg-primary hover:bg-primary/90 text-sm !shadow-none',
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className="font-sans">
          <AppProviders>{children}</AppProviders>
          <Toaster richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
