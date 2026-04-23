import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@Noblesse/shared'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
};

export default nextConfig;