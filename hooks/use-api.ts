import { useState, useEffect, useCallback } from 'react'

interface PaginationParams {
  page: number
  limit: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface PaginatedResponse<T> {
  data: {
    items: T[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  } | null
  error: string | null
}

interface ApiCallResult<T> {
  data: T[] | null
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  } | null
  updateParams: (newParams: Partial<PaginationParams>) => void
  refetch: () => void
}

export function usePaginatedApiCall<T>(
  apiFunction: (params: PaginationParams) => Promise<PaginatedResponse<T>>,
  initialParams: PaginationParams,
  enabled: boolean = true
): ApiCallResult<T> {
  const [data, setData] = useState<T[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<{
    page: number
    limit: number
    total: number
    totalPages: number
  } | null>(null)
  const [params, setParams] = useState<PaginationParams>(initialParams)
  const fetchData = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      console.log('🔄 Appel API avec params:', params)
      const response = await apiFunction(params)
      
      console.log('✅ Réponse API reçue:', response)
      
      if (response && response.data && response.data.items) {
        setData(response.data.items)
        setPagination(response.data.pagination)
      } else if (response && !response.error) {
        console.warn('⚠️ Réponse API sans données:', response)
        setData([])
        setPagination({
          page: params.page,
          limit: params.limit,
          total: 0,
          totalPages: 0
        })
      } else {
        console.error('❌ Erreur dans la réponse API:', response?.error)
        setError(response?.error || 'Erreur inconnue')
        setData(null)
        setPagination(null)
      }
    } catch (err) {
      console.error('❌ Erreur API:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setData(null)
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [apiFunction, params, enabled])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const updateParams = useCallback((newParams: Partial<PaginationParams>) => {
    setParams(prev => ({ ...prev, ...newParams }))
  }, [])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    pagination,
    updateParams,
    refetch
  }
}

// Hook simple pour les appels API sans pagination
export function useApiCall<T>(
  apiFunction: () => Promise<T>,
  enabled: boolean = true
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchData = useCallback(async () => {
    if (!enabled) {
      console.log('🚫 API call disabled')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🔄 Appel API simple... Function:', apiFunction.name)
      const response = await apiFunction()
      console.log('✅ Réponse API simple reçue:', response)
      
      // Vérifier si la réponse a le bon format
      if (response && typeof response === 'object' && 'data' in response) {
        setData(response)
      } else {
        console.warn('⚠️ Format de réponse inattendu:', response)
        setData(response)
      }
    } catch (err) {
      console.error('❌ Erreur API simple:', err)
      
      // Plus de détails sur l'erreur
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Erreur de connexion au serveur - Vérifiez que le backend est démarré')
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Erreur inconnue')
      }
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [apiFunction, enabled])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch
  }
}

// Hook pour les mutations (CREATE, UPDATE, DELETE)
interface MutationResult<T, P = any> {
  mutate: (params?: P) => Promise<T | null>
  data: T | null
  loading: boolean
  error: string | null
  reset: () => void
}

export function useApiMutation<T, P = any>(
  mutationFunction: (params?: P) => Promise<T>
): MutationResult<T, P> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (params?: P): Promise<T | null> => {
    setLoading(true)
    setError(null)

    try {
      console.log('🔄 Mutation en cours avec params:', params)
      const response = await mutationFunction(params)
      console.log('✅ Mutation réussie:', response)
      setData(response)
      return response
    } catch (err) {
      console.error('❌ Erreur mutation:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      setData(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [mutationFunction])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    mutate,
    data,
    loading,
    error,
    reset
  }
}

export default usePaginatedApiCall