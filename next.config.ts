import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Untuk Leaflet
  transpilePackages: ['react-leaflet'],
   eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig