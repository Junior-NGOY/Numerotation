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
  // CSP désactivé pour le développement - évite les problèmes de connexion
  async headers() {
    return []
  },
}

export default nextConfig
