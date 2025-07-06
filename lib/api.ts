// Configuration de base pour les appels API
import { getApiBaseUrl } from './api-config';

// Fonction pour obtenir l'URL API avec fallback sécurisé
function getSecureApiBaseUrl(): string {
  try {
    return getApiBaseUrl();
  } catch (error) {
    console.warn('Erreur lors de la récupération de l\'URL API, utilisation du fallback:', error);
    // Fallback direct pour Vercel
    if (typeof window !== 'undefined' && window.location.hostname === 'numerotation.vercel.app') {
      return 'https://web-production-a371d.up.railway.app';
    }
    return 'https://web-production-a371d.up.railway.app';
  }
}

const API_BASE_URL = getSecureApiBaseUrl();

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
  
  // S'assurer que API_BASE_URL a le bon format
  let baseUrl = API_BASE_URL;
  if (baseUrl && !baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }
  
  const url = `${baseUrl}${endpoint}`;
  
  // Debug: afficher toutes les informations importantes
  console.log('🔗 Configuration API Debug:');
  console.log('   - NODE_ENV:', process.env.NODE_ENV);
  console.log('   - window.location.hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server-side');
  console.log('   - NEXT_PUBLIC_API_URL (env):', process.env.NEXT_PUBLIC_API_URL);
  console.log('   - API_BASE_URL (brute):', API_BASE_URL);
  console.log('   - baseUrl (normalisée):', baseUrl);
  console.log('   - endpoint:', endpoint);
  console.log('   - URL finale:', url);
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    return {
      data: null as T,
      error: error instanceof Error ? error.message : 'Une erreur inconnue s\'est produite',
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
  
  // S'assurer que API_BASE_URL a le bon format
  let baseUrl = API_BASE_URL;
  if (baseUrl && !baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }
  
  const url = `${baseUrl}${endpoint}`;
  const config: RequestInit = {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    body: formData,
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    return {
      data: null as T,
      error: error instanceof Error ? error.message : 'Une erreur inconnue s\'est produite',
    };
  }
}
