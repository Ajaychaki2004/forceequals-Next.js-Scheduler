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
  poweredByHeader: false,
  serverExternalPackages: ['@prisma/client'],
  outputFileTracingRoot: process.cwd(),
  outputFileTracingExcludes: {
    '/*': ['**/*_client-reference-manifest.js']
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Prevent issues with route groups in parentheses
  transpilePackages: [],
  webpack(config) {
    return config;
  }
}

export default nextConfig
