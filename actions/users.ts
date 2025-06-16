import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';
import type { 
  User, 
  CreateUserForm, 
  UpdateUserForm, 
  ChangePasswordForm,
  ApiResponse, 
  PaginatedResponse,
  SearchParams 
} from '@/types/api';

// Créer un utilisateur
export async function createUser(userData: CreateUserForm): Promise<ApiResponse<User>> {
  try {
    const result = await apiRequest<User>('/api/v1/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });    // Afficher un message de succès
    if (result.data && !result.error) {
      toast.success("✅ Utilisateur créé avec succès !");
    }

    return result;
  } catch (error) {
    // Afficher un message d'erreur
    toast.error("❌ Impossible de créer l'utilisateur. Veuillez réessayer.");
    throw error;
  }
}

// Authentifier un utilisateur
export async function loginUser(credentials: { email: string; password: string }): Promise<ApiResponse<{ user: User; token: string }>> {
  return apiRequest<{ user: User; token: string }>('/api/v1/users/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

// Obtenir tous les utilisateurs avec pagination et filtres
export async function getUsers(params: SearchParams = {}): Promise<PaginatedResponse<User>> {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/api/v1/users?${queryString}` : '/api/v1/users';
  
  return apiRequest<any>(endpoint);
}

// Obtenir un utilisateur par ID
export async function getUserById(id: string): Promise<ApiResponse<User>> {
  return apiRequest<User>(`/api/v1/users/${id}`);
}

// Mettre à jour un utilisateur
export async function updateUser(id: string, userData: UpdateUserForm): Promise<ApiResponse<User>> {
  try {
    const result = await apiRequest<User>(`/api/v1/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });

    // Afficher un message de succès
    if (result.data && !result.error) {
      toast.success("✅ Utilisateur modifié avec succès !");
    }

    return result;
  } catch (error) {
    // Afficher un message d'erreur
    toast.error("❌ Impossible de modifier l'utilisateur. Veuillez réessayer.");
    throw error;
  }
}

// Supprimer un utilisateur
export async function deleteUser(id: string): Promise<ApiResponse<{ message: string }>> {
  try {
    const result = await apiRequest<{ message: string }>(`/api/v1/users/${id}`, {
      method: 'DELETE',
    });

    // Afficher un message de succès
    if (result.data && !result.error) {
      toast.success("🗑️ Utilisateur supprimé avec succès !");
    }

    return result;
  } catch (error) {
    // Afficher un message d'erreur
    toast.error("❌ Impossible de supprimer l'utilisateur. Veuillez réessayer.");
    throw error;
  }
}

// Changer le mot de passe d'un utilisateur
export async function changeUserPassword(id: string, passwordData: ChangePasswordForm): Promise<ApiResponse<{ message: string }>> {
  try {
    const result = await apiRequest<{ message: string }>(`/api/v1/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });

    // Afficher un message de succès
    if (result.data && !result.error) {
      toast.success("🔑 Mot de passe modifié avec succès !");
    }

    return result;
  } catch (error) {
    // Afficher un message d'erreur
    toast.error("❌ Impossible de modifier le mot de passe. Veuillez réessayer.");
    throw error;
  }
}
