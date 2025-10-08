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
  
  // S'assurer que API_BASE_URL a le bon format
  let baseUrl = API_BASE_URL;
  if (baseUrl && !baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }
  
  const url = `${baseUrl}${endpoint}`;
  
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
      // Essayer de récupérer les détails de l'erreur du serveur
      let errorMessage = `Erreur HTTP ${response.status}`;
      
      try {
        const errorData = await response.json();
        
        // Le serveur peut renvoyer l'erreur dans différents champs
        errorMessage = errorData.error || errorData.message || errorMessage;
        
        // Ajouter des détails supplémentaires si disponibles
        if (errorData.details) {
          errorMessage += `: ${errorData.details}`;
        }
      } catch (parseError) {
        // Si le JSON ne peut pas être parsé, utiliser le statut HTTP
        console.error('Impossible de parser la réponse d\'erreur:', parseError);
      }
      
      console.error(`API Error [${response.status}]:`, errorMessage);
      
      return {
        data: null as T,
        error: errorMessage,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    
    // Différencier les erreurs réseau des autres erreurs
    let errorMessage = 'Une erreur inconnue s\'est produite';
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
    } else if (error instanceof Error) {
      errorMessage = error.message;
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
      // Essayer de récupérer les détails de l'erreur du serveur
      let errorMessage = `Erreur HTTP ${response.status}`;
      
      try {
        const errorData = await response.json();
        
        // Le serveur peut renvoyer l'erreur dans différents champs
        errorMessage = errorData.error || errorData.message || errorMessage;
        
        // Ajouter des détails supplémentaires si disponibles
        if (errorData.details) {
          errorMessage += `: ${errorData.details}`;
        }
      } catch (parseError) {
        // Si le JSON ne peut pas être parsé, utiliser le statut HTTP
        console.error('Impossible de parser la réponse d\'erreur:', parseError);
      }
      
      console.error(`API Error [${response.status}]:`, errorMessage);
      
      return {
        data: null as T,
        error: errorMessage,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    
    // Différencier les erreurs réseau des autres erreurs
    let errorMessage = 'Une erreur inconnue s\'est produite';
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      data: null as T,
      error: errorMessage,
    };
  }
}
