import { apiRequest } from '@/lib/api';
import type { 
  Vehicule, 
  CreateVehiculeForm,
  ApiResponse, 
  PaginatedResponse,
  SearchParams 
} from '@/types/api';

// Créer un véhicule
export async function createVehicule(vehiculeData: CreateVehiculeForm): Promise<ApiResponse<Vehicule>> {
  return apiRequest<Vehicule>('/api/v1/vehicules', {
    method: 'POST',
    body: JSON.stringify(vehiculeData),
  });
}

// Obtenir tous les véhicules avec pagination et filtres
export async function getVehicules(params: SearchParams = {}): Promise<PaginatedResponse<Vehicule>> {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/api/v1/vehicules?${queryString}` : '/api/v1/vehicules';
  
  return apiRequest<any>(endpoint);
}

// Obtenir un véhicule par ID
export async function getVehiculeById(id: string): Promise<ApiResponse<Vehicule>> {
  return apiRequest<Vehicule>(`/api/v1/vehicules/${id}`);
}

// Obtenir un véhicule par code unique
export async function getVehiculeByCodeUnique(codeUnique: string): Promise<ApiResponse<Vehicule>> {
  return apiRequest<Vehicule>(`/api/v1/vehicules/code/${encodeURIComponent(codeUnique)}`);
}

// Obtenir les véhicules d'un propriétaire
export async function getVehiculesByProprietaire(proprietaireId: string, params: SearchParams = {}): Promise<PaginatedResponse<Vehicule>> {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const endpoint = queryString 
    ? `/api/v1/vehicules/proprietaire/${proprietaireId}?${queryString}` 
    : `/api/v1/vehicules/proprietaire/${proprietaireId}`;
  
  return apiRequest<any>(endpoint);
}

// Mettre à jour un véhicule
export async function updateVehicule(id: string, vehiculeData: Partial<CreateVehiculeForm>): Promise<ApiResponse<Vehicule>> {
  return apiRequest<Vehicule>(`/api/v1/vehicules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(vehiculeData),
  });
}

// Supprimer un véhicule
export async function deleteVehicule(id: string): Promise<ApiResponse<{ message: string }>> {
  return apiRequest<{ message: string }>(`/api/v1/vehicules/${id}`, {
    method: 'DELETE',
  });
}

// Rechercher des véhicules
export async function searchVehicules(query: string, params: SearchParams = {}): Promise<PaginatedResponse<Vehicule>> {
  const searchParams = new URLSearchParams({ search: query });
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && key !== 'search') {
      searchParams.append(key, String(value));
    }
  });

  return apiRequest<any>(`/api/v1/vehicules?${searchParams.toString()}`);
}

// Obtenir les statistiques des véhicules
export async function getVehiculesStats(): Promise<ApiResponse<{
  total: number;
  parType: Array<{ typeVehicule: string; count: number }>;
  parAnnee: Array<{ annee: number; count: number }>;
  recentCreations: number;
}>> {
  return apiRequest<any>('/api/v1/vehicules/stats');
}

// Vérifier l'unicité des identifiants
export async function checkVehiculeUniqueness(data: {
  numeroImmatriculation?: string;
  numeroChassis?: string;
  codeUnique?: string;
  excludeId?: string;
}): Promise<ApiResponse<{
  numeroImmatriculation: boolean;
  numeroChassis: boolean;
  codeUnique: boolean;
}>> {
  return apiRequest<any>('/api/v1/vehicules/check-uniqueness', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
