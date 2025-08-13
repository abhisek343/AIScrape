'use client';

import { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NextTopLoader from 'nextjs-toploader';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 1,
      },
      mutations: {
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <NextTopLoader color="#10b981" showSpinner={false} />
      {/* Set the initial theme for new visitors to dark */}
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
      >
        {children}
      </ThemeProvider>
      {/* Devtools intentionally not bundled to keep client bundle small */}
    </QueryClientProvider>
  );
}
