import { useState, useEffect, useRef } from 'react'

/**
 * Hook pour une recherche optimisée avec gestion intelligente
 * @param searchFunction - Fonction de recherche à appeler
 * @param delay - Délai de debounce (défaut: 500ms)
 * @param minLength - Longueur minimale pour déclencher la recherche (défaut: 2)
 * @returns { search, loading, error, cancel }
 */
export function useOptimizedSearch<T>(
  searchFunction: (term: string) => Promise<T>,
  delay: number = 500,
  minLength: number = 2
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const search = async (term: string) => {
    // Annuler la recherche précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Réinitialiser l'état
    setError(null)

    // Vérifier la longueur minimale
    if (term.length < minLength) {
      setLoading(false)
      return null
    }

    // Créer un nouveau AbortController
    abortControllerRef.current = new AbortController()

    return new Promise<T | null>((resolve) => {
      timeoutRef.current = setTimeout(async () => {
        try {
          setLoading(true)
          const result = await searchFunction(term)
          setLoading(false)
          resolve(result)
        } catch (err) {
          if (err instanceof Error && err.name !== 'AbortError') {
            setError(err.message)
          }
          setLoading(false)
          resolve(null)
        }
      }, delay)
    })
  }

  const cancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setLoading(false)
  }

  // Nettoyage à la désactivation du composant
  useEffect(() => {
    return () => {
      cancel()
    }
  }, [])

  return { search, loading, error, cancel }
}
