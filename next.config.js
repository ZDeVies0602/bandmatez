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
};

module.exports = nextConfig; 