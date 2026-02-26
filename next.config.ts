import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Untuk Leaflet
  transpilePackages: ['react-leaflet'],
}

export default nextConfig