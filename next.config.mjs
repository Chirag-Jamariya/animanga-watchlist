/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // other experimental features
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
