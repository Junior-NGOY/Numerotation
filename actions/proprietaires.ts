import { apiRequest } from '@/lib/api';
import type { 
  Proprietaire, 
  CreateProprietaireForm,
  ApiResponse, 
  PaginatedResponse,
  SearchParams 
} from '@/types/api';

// Créer un propriétaire
export async function createProprietaire(proprietaireData: CreateProprietaireForm): Promise<ApiResponse<Proprietaire>> {
  return apiRequest<Proprietaire>('/api/v1/proprietaires', {
    method: 'POST',
    body: JSON.stringify(proprietaireData),
  });
}

// Obtenir tous les propriétaires avec pagination et filtres
export async function getProprietaires(params: SearchParams = {}): Promise<PaginatedResponse<Proprietaire>> {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/api/v1/proprietaires?${queryString}` : '/api/v1/proprietaires';
  
  return apiRequest<any>(endpoint);
}

// Obtenir un propriétaire par ID
export async function getProprietaireById(id: string): Promise<ApiResponse<Proprietaire>> {
  return apiRequest<Proprietaire>(`/api/v1/proprietaires/${id}`);
}

// Mettre à jour un propriétaire
export async function updateProprietaire(id: string, proprietaireData: Partial<CreateProprietaireForm>): Promise<ApiResponse<Proprietaire>> {
  return apiRequest<Proprietaire>(`/api/v1/proprietaires/${id}`, {
    method: 'PUT',
    body: JSON.stringify(proprietaireData),
  });
}

// Supprimer un propriétaire
export async function deleteProprietaire(id: string): Promise<ApiResponse<{ message: string }>> {
  return apiRequest<{ message: string }>(`/api/v1/proprietaires/${id}`, {
    method: 'DELETE',
  });
}

// Rechercher des propriétaires par numéro de pièce
export async function searchProprietaireByNumeroPiece(numeroPiece: string): Promise<ApiResponse<Proprietaire[]>> {
  return apiRequest<Proprietaire[]>(`/api/v1/proprietaires/search/${encodeURIComponent(numeroPiece)}`);
}

// Obtenir les statistiques des propriétaires
export async function getProprietairesStats(): Promise<ApiResponse<{
  total: number;
  parTypePiece: Array<{ typePiece: string; count: number }>;
  recentCreations: number;
}>> {
  return apiRequest<any>('/api/v1/proprietaires/stats');
}
