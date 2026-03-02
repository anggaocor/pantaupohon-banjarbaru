import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },

  transpilePackages: ['react-leaflet'],

  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig