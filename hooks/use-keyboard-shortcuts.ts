import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  action: () => void
  description: string
}

/**
 * Hook personnalisé pour gérer les raccourcis clavier globaux
 * 
 * Exemples de raccourcis :
 * - Ctrl + K : Ouvrir la recherche globale
 * - Ctrl + N : Nouveau véhicule
 * - Ctrl + P : Générer PDF
 * - Escape : Fermer les modales
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Ignorer si l'utilisateur tape dans un input, textarea ou select
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        // Exception : permettre Escape même dans les inputs
        if (event.key !== 'Escape') {
          return
        }
      }

      shortcuts.forEach((shortcut) => {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatches = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey
        const shiftMatches = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey
        const altMatches = shortcut.altKey === undefined || event.altKey === shortcut.altKey
        const metaMatches = shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey

        if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
          event.preventDefault()
          shortcut.action()
        }
      })
    },
    [shortcuts, enabled]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])
}

/**
 * Hook pour les raccourcis clavier spécifiques à l'application
 */
export function useAppKeyboardShortcuts() {
  const router = useRouter()

  return {
    // Navigation
    goToDashboard: () => router.push('/dashboard'),
    goToVehicles: () => router.push('/vehicules'),
    goToOwners: () => router.push('/proprietaires'),
    goToRoutes: () => router.push('/itineraires'),
    goToDocuments: () => router.push('/documents'),
    goToUsers: () => router.push('/utilisateurs'),
    
    // Actions
    refresh: () => window.location.reload(),
  }
}
