// Configuration de base pour les appels API
// Fonction pour normaliser l'URL de base
function getApiBaseUrl(): string {
  let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  // Si la variable d'environnement ne contient que le domaine (sans protocole), ajouter https://
  if (baseUrl && !baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }
  
  // Supprimer le slash final s'il existe
  baseUrl = baseUrl.replace(/\/$/, '');
  
  // Debug logging seulement en développement
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 API Base URL Debug:', {
      original: process.env.NEXT_PUBLIC_API_URL,
      processed: baseUrl,
      isLocal: baseUrl.includes('localhost')
    });
  }
  
  // Vérifier que l'URL est valide
  try {
    new URL(baseUrl);
    return baseUrl;
  } catch (error) {
    console.error('URL de base API invalide:', baseUrl, error);
    return 'http://localhost:8000';
  }
}

const API_BASE_URL = getApiBaseUrl();

// Configuration des timeouts
const DEFAULT_TIMEOUT = 30000; // 30 secondes
const UPLOAD_TIMEOUT = 60000; // 60 secondes pour les uploads

// Fonction utilitaire pour créer un timeout compatible avec tous les navigateurs
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  // Vérifier si AbortSignal.timeout est disponible (navigateurs modernes)
  if (typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs);
  }
  
  // Fallback pour les navigateurs plus anciens
  const controller = new AbortController();
  setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  
  return controller.signal;
}

import { ApiResponse, PaginatedResponse } from '@/types/api';

// Fonction utilitaire pour récupérer le token d'authentification
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Récupérer le token JWT stocké après connexion
  const token = localStorage.getItem('auth_token');
  
  // Pour le développement, créons un token de test si l'utilisateur existe
  if (!token) {
    const user = localStorage.getItem('user');
    if (user) {
      // En développement, on peut créer un token temporaire pour tester
      // Dans un vrai environnement, ceci devrait être obtenu via l'API de login
      console.warn('Aucun token trouvé, authentification requise');
      return null;
    }
    return null;
  }
  
  return token;
}

// Fonction utilitaire pour faire des requêtes API
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Debug logging seulement en développement
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 API Request Debug:', {
      API_BASE_URL,
      endpoint,
      finalUrl: url,
      env: process.env.NEXT_PUBLIC_API_URL
    });
  }
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    // Ajouter un timeout de 30 secondes compatible avec tous les navigateurs
    signal: createTimeoutSignal(DEFAULT_TIMEOUT),
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Si on ne peut pas parser le JSON, garder le message par défaut
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('API Request Error:', error);
    }
    
    let errorMessage = 'Une erreur inconnue s\'est produite';
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'La requête a expiré (timeout)';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Erreur de connexion au serveur';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      data: null as T,
      error: errorMessage,
    };
  }
}

// Fonction pour les requêtes avec FormData (pour les uploads)
export async function apiRequestFormData<T>(
  endpoint: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    body: formData,
    // Timeout plus long pour les uploads, compatible avec tous les navigateurs
    signal: createTimeoutSignal(UPLOAD_TIMEOUT),
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Si on ne peut pas parser le JSON, garder le message par défaut
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('API Request Error:', error);
    }
    
    let errorMessage = 'Une erreur inconnue s\'est produite';
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'L\'upload a expiré (timeout)';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Erreur de connexion au serveur';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      data: null as T,
      error: errorMessage,
    };
  }
}
