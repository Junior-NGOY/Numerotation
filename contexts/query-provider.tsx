"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState, type ReactNode } from "react"

/**
 * Provider React Query pour gérer le cache des données de l'API
 * Améliore les performances en évitant les requêtes inutiles
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Données considérées comme "fraîches" pendant 1 minute
            staleTime: 60 * 1000,
            // Garder en cache pendant 5 minutes
            gcTime: 5 * 60 * 1000,
            // Refetch automatiquement au focus de la fenêtre
            refetchOnWindowFocus: true,
            // Retry 2 fois en cas d'échec
            retry: 2,
            // Délai entre les retries (500ms, puis 1000ms)
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Retry 1 fois pour les mutations
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools visible seulement en développement */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  )
}
