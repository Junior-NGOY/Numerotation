// Script temporaire pour désactiver le CSP en développement
// À utiliser uniquement si les erreurs CSP persistent

/** @type {import('next').NextConfig} */
const nextConfigWithoutCSP = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // CSP désactivé pour debug
  async headers() {
    return []
  },
}

module.exports = nextConfigWithoutCSP

console.log("⚠️  CSP désactivé pour le développement")
console.log("📝 Pour réactiver le CSP, utilisez next.config.mjs")
