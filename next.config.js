/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use standalone output in production
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;
