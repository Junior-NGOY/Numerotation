import { apiRequest, apiRequestFormData } from '@/lib/api';
import { toast } from 'sonner';
import type { 
  Proprietaire, 
  CreateProprietaireForm,
  ApiResponse, 
  PaginatedResponse,
  SearchParams,
  Vehicule
} from '@/types/api';

// Créer un propriétaire avec possibilité d'upload de pièce d'identité
export async function createProprietaire(proprietaireData: CreateProprietaireForm, file?: File): Promise<ApiResponse<Proprietaire>> {
  try {
    let result: ApiResponse<Proprietaire>;
    
    if (file) {
      // Utiliser FormData pour l'upload de fichier
      const formData = new FormData();
      
      // Ajouter les données du propriétaire
      Object.entries(proprietaireData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      
      // Ajouter le fichier
      formData.append('file', file);
      
      result = await apiRequestFormData<Proprietaire>('/api/v1/proprietaires', formData);
    } else {
      // Utiliser JSON si pas de fichier
      result = await apiRequest<Proprietaire>('/api/v1/proprietaires', {
        method: 'POST',
        body: JSON.stringify(proprietaireData),
      });
    }    // Afficher un message de succès
    if (result.data && !result.error) {
      toast.success("✅ Propriétaire ajouté avec succès !");
    }

    return result;
  } catch (error) {
    // Afficher un message d'erreur
    toast.error("❌ Impossible d'ajouter le propriétaire. Veuillez réessayer.");
    throw error;
  }
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
  try {
    const result = await apiRequest<Proprietaire>(`/api/v1/proprietaires/${id}`, {
      method: 'PUT',
      body: JSON.stringify(proprietaireData),
    });    // Afficher un message de succès
    if (result.data && !result.error) {
      toast.success("✅ Propriétaire modifié avec succès !");
    }

    return result;
  } catch (error) {
    // Afficher un message d'erreur
    toast.error("❌ Impossible de modifier le propriétaire. Veuillez réessayer.");
    throw error;
  }
}

// Supprimer un propriétaire
export async function deleteProprietaire(id: string): Promise<ApiResponse<{ message: string }>> {
  try {
    const result = await apiRequest<{ message: string }>(`/api/v1/proprietaires/${id}`, {
      method: 'DELETE',
    });    // Afficher un message de succès
    if (result.data && !result.error) {
      toast.success("🗑️ Propriétaire supprimé avec succès !");
    }

    return result;
  } catch (error) {
    // Afficher un message d'erreur
    toast.error("❌ Impossible de supprimer le propriétaire. Veuillez réessayer.");
    throw error;
  }
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

// Obtenir un propriétaire avec tous ses véhicules
export async function getProprietaireWithVehicules(id: string): Promise<ApiResponse<Proprietaire & { 
  vehicules: Vehicule[] 
}>> {
  return apiRequest<Proprietaire & { vehicules: Vehicule[] }>(`/api/v1/proprietaires/${id}`);
}

// Vérifier l'unicité du numéro de pièce
export async function checkProprietaireUniqueness(data: {
  numeroPiece: string;
  excludeId?: string;
}): Promise<ApiResponse<{ numeroPiece: boolean }>> {
  return apiRequest<{ numeroPiece: boolean }>('/api/v1/proprietaires/check-uniqueness', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
