/**
 * Cache système pour les logos PDF
 * Charge les logos une seule fois et les réutilise pour toutes les générations PDF
 */

// Cache en mémoire pour les logos
const logoCache: {
  logoSID: string | null
  logoMairie: string | null
  loading: Promise<void> | null
} = {
  logoSID: null,
  logoMairie: null,
  loading: null
}

/**
 * Convertit une image en base64
 */
async function loadImageAsBase64(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Impossible de créer le contexte canvas'))
        return
      }
      
      ctx.drawImage(img, 0, 0)
      const dataURL = canvas.toDataURL('image/png')
      resolve(dataURL)
    }
    
    img.onerror = () => {
      reject(new Error(`Erreur lors du chargement de l'image: ${imagePath}`))
    }
    
    img.src = imagePath
  })
}

/**
 * Précharge les logos dans le cache
 * À appeler au démarrage de l'application ou avant la première génération PDF
 */
export async function preloadLogos(): Promise<void> {
  // Si déjà en cours de chargement, attendre
  if (logoCache.loading) {
    return logoCache.loading
  }

  // Si déjà chargés, retourner immédiatement
  if (logoCache.logoSID && logoCache.logoMairie) {
    return Promise.resolve()
  }

  console.log('🖼️ Préchargement des logos PDF...')

  // Créer une promesse de chargement
  logoCache.loading = (async () => {
    try {
      const [logoSID, logoMairie] = await Promise.all([
        loadImageAsBase64('/logo-sid.jpeg').catch((error) => {
          console.warn('⚠️ Logo SID non disponible:', error)
          return null
        }),
        loadImageAsBase64('/logo-mairie.png').catch((error) => {
          console.warn('⚠️ Logo Mairie non disponible:', error)
          return null
        })
      ])

      logoCache.logoSID = logoSID
      logoCache.logoMairie = logoMairie

      console.log('✅ Logos PDF préchargés en cache')
    } finally {
      logoCache.loading = null
    }
  })()

  return logoCache.loading
}

/**
 * Récupère le logo SID depuis le cache
 * Si non chargé, le charge automatiquement
 */
export async function getCachedLogoSID(): Promise<string | null> {
  if (!logoCache.logoSID && !logoCache.loading) {
    await preloadLogos()
  } else if (logoCache.loading) {
    await logoCache.loading
  }
  
  return logoCache.logoSID
}

/**
 * Récupère le logo Mairie depuis le cache
 * Si non chargé, le charge automatiquement
 */
export async function getCachedLogoMairie(): Promise<string | null> {
  if (!logoCache.logoMairie && !logoCache.loading) {
    await preloadLogos()
  } else if (logoCache.loading) {
    await logoCache.loading
  }
  
  return logoCache.logoMairie
}

/**
 * Vide le cache (utile pour forcer un rechargement)
 */
export function clearLogoCache(): void {
  logoCache.logoSID = null
  logoCache.logoMairie = null
  logoCache.loading = null
  console.log('🗑️ Cache des logos vidé')
}

/**
 * Vérifie si les logos sont en cache
 */
export function areLogosCached(): boolean {
  return logoCache.logoSID !== null && logoCache.logoMairie !== null
}

/**
 * Hook React pour précharger les logos au montage du composant
 */
export function usePreloadLogos() {
  if (typeof window !== 'undefined') {
    // Précharger dès que possible
    preloadLogos().catch((error) => {
      console.error('Erreur lors du préchargement des logos:', error)
    })
  }
}
