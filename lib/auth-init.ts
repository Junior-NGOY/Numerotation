// Script d'initialisation pour l'authentification

// Configuration de l'URL de base de l'API
function getApiBaseUrl(): string {
  let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  // Supprimer le slash final s'il existe
  baseUrl = baseUrl.replace(/\/$/, '');
  
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

export async function initializeAuth() {
  if (typeof window === 'undefined') return false;
  
  // Vérifier si on a déjà un token valide
  const existingToken = localStorage.getItem('auth_token');
  if (existingToken) {
    console.log('✅ Token d\'authentification existant trouvé');
    return true;
  }

  console.log('🔄 Tentative d\'authentification automatique...');
  
  try {
    // Tenter de se connecter automatiquement avec les identifiants de test
    const response = await fetch(`${API_BASE_URL}/api/v1/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@vehicleregistration.com',
        password: 'admin123'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur HTTP:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('📝 Réponse d\'authentification:', result);
    
    if (result.data && result.data.token && result.data.user) {
      // Stocker le token et l'utilisateur
      localStorage.setItem('auth_token', result.data.token);
      localStorage.setItem('user', JSON.stringify({
        id: result.data.user.id,
        email: result.data.user.email,
        name: result.data.user.name,
        role: result.data.user.role
      }));
      
      console.log('✅ Authentification automatique réussie pour:', result.data.user.email);
      return true;
    } else {
      console.error('❌ Structure de réponse d\'authentification invalide:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'authentification automatique:', error);
    return false;
  }
}

// Fonction pour forcer l'authentification
export async function ensureAuthenticated() {
  const token = localStorage.getItem('auth_token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) {
    console.log('🔄 Authentification requise...');
    return await initializeAuth();
  }
  
  console.log('✅ Utilisateur déjà authentifié');
  return true;
}

// Fonction pour tester la validité d'un token
export async function validateToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/vehicules`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.ok;
  } catch (error) {
    console.error('❌ Erreur lors de la validation du token:', error);
    return false;
  }
}
