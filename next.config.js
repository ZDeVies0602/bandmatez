/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Allow production builds even with TypeScript errors
    ignoreBuildErrors: false,
  },
  eslint: {
    // Allow production builds even with ESLint errors
    ignoreDuringBuilds: false,
  },
  // Configure environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  // Enable audio context support
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(mp3|wav|ogg)$/,
      type: 'asset/resource',
    });
    return config;
  },
  // Enable audio context in browser
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
  // Output configuration for static export
  output: 'standalone',
  // Disable server-side rendering for components that use Supabase
  experimental: {
    esmExternals: 'loose',
  },
};

module.exports = nextConfig; 