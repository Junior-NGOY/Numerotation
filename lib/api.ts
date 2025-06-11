// Configuration de base pour les appels API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
  
  const url = `${API_BASE_URL}${endpoint}`;
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
