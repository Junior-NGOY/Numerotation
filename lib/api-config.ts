// Force la configuration API en cas de problème de déploiement
// Ce fichier peut être utilisé pour debugger les problèmes d'URL

export const API_CONFIG = {
  production: 'https://web-production-a371d.up.railway.app',
  development: 'http://localhost:8000',
  vercel: 'https://web-production-a371d.up.railway.app'
};

export function getApiBaseUrl(): string {
  // Forcer l'URL en cas de problème
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    console.log('🔧 Détection hostname:', hostname);
    
    if (hostname === 'numerotation.vercel.app') {
      console.log('🔧 Environnement Vercel détecté, utilisation URL Railway');
      return API_CONFIG.vercel;
    }
    
    if (hostname === 'localhost') {
      console.log('🔧 Environnement local détecté');
      return API_CONFIG.development;
    }
  }
  
  // Fallback sur les variables d'environnement
  let envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    // S'assurer que l'URL a le bon protocole
    if (!envUrl.startsWith('http://') && !envUrl.startsWith('https://')) {
      envUrl = `https://${envUrl}`;
    }
    console.log('🔧 Utilisation variable d\'environnement (normalisée):', envUrl);
    return envUrl;
  }
  
  // Dernier fallback
  console.log('🔧 Utilisation URL par défaut production');
  return API_CONFIG.production;
}
