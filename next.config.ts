import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  transpilePackages: ['react-leaflet'],

  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig