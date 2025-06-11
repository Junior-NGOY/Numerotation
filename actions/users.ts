import { apiRequest } from '@/lib/api';
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
  return apiRequest<User>('/api/v1/users/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
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
  return apiRequest<User>(`/api/v1/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
}

// Supprimer un utilisateur
export async function deleteUser(id: string): Promise<ApiResponse<{ message: string }>> {
  return apiRequest<{ message: string }>(`/api/v1/users/${id}`, {
    method: 'DELETE',
  });
}

// Changer le mot de passe d'un utilisateur
export async function changeUserPassword(id: string, passwordData: ChangePasswordForm): Promise<ApiResponse<{ message: string }>> {
  return apiRequest<{ message: string }>(`/api/v1/users/${id}/password`, {
    method: 'PUT',
    body: JSON.stringify(passwordData),
  });
}
