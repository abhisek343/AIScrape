'use client';

import { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import NextTopLoader from 'nextjs-toploader';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

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
      {/* <ReactQueryDevtools /> */}
    </QueryClientProvider>
  );
}
