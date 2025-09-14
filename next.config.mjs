/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: [],
    serverActions: {
      bodySizeLimit: '2mb',
    }
  },
}

export default nextConfig
