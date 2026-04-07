/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use standalone output in production
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),

  // Performance optimizations - tree-shake heavy packages
  experimental: {
    // Keep webpack in-process so compile errors are surfaced reliably.
    webpackBuildWorker: false,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      'date-fns',
      'date-fns-tz',
      'recharts',
    ],
  },

  // Compiler optimizations
  // compiler: {
  //   removeConsole: process.env.NODE_ENV === 'production',
  // },

  // Image optimization with modern formats
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Aggressive caching headers for static assets
  async headers() {
    // Avoid immutable dev caching on chunk files; it can break HMR and hydration.
    if (process.env.NODE_ENV !== 'production') {
      return [];
    }

    return [
      {
        // Next static assets are content-hashed, safe to cache long-term.
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
