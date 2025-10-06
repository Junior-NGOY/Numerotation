import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';
import type { 
  ApiResponse, 
  PaginatedResponse,
  SearchParams 
} from '@/types/api';

// Interface pour les itinéraires
export interface Itineraire {
  id: string;
  nom: string;
  description?: string;
  distance?: number;
  dureeEstimee?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    vehicules: number;
  };
}

export interface CreateItineraireForm {
  nom: string;
  description?: string;
  distance?: number;
  dureeEstimee?: number;
}

export interface UpdateItineraireForm extends Partial<CreateItineraireForm> {
  isActive?: boolean;
}

// Créer un itinéraire
export async function createItineraire(itineraireData: CreateItineraireForm): Promise<ApiResponse<Itineraire>> {
  try {
    const result = await apiRequest<Itineraire>('/api/v1/itineraires', {
      method: 'POST',
      body: JSON.stringify(itineraireData),
    });

    // Afficher un message de succès
    if (result.data && !result.error) {
      toast.success("✅ Itinéraire ajouté avec succès !");
    }

    return result;
  } catch (error) {
    // Afficher un message d'erreur
    toast.error("❌ Impossible d'ajouter l'itinéraire. Veuillez réessayer.");
    throw error;
  }
}

// Obtenir tous les itinéraires avec pagination
export async function getItineraires(params?: SearchParams): Promise<PaginatedResponse<Itineraire>> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());    const url = `/api/v1/itineraires${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const result = await apiRequest<{
      items: Itineraire[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(url);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    // Transform the backend response to match PaginatedResponse format
    return {
      data: result.data ? {
        items: result.data.items,
        pagination: result.data.pagination
      } : null,
      error: null
    };
  } catch (error) {
    toast.error("❌ Impossible de charger les itinéraires.");
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

// Type for active itineraries response (simplified)
export interface ActiveItineraire {
  id: string;
  nom: string;
  description?: string;
  distance?: number;
  duree?: number;
}

// Obtenir la liste des itinéraires actifs (pour les selects)
export async function getActiveItineraires(): Promise<ApiResponse<ActiveItineraire[]>> {
  try {
    const result = await apiRequest<ActiveItineraire[]>('/api/v1/itineraires/public/active');
    
    return result;
  } catch (error) {
    toast.error("❌ Impossible de charger les itinéraires actifs.");
    throw error;
  }
}

// Obtenir un itinéraire par ID
export async function getItineraireById(id: string): Promise<ApiResponse<Itineraire>> {
  try {
    const result = await apiRequest<Itineraire>(`/api/v1/itineraires/${id}`);
    
    return result;
  } catch (error) {
    toast.error("❌ Impossible de charger l'itinéraire.");
    throw error;
  }
}

// Mettre à jour un itinéraire
export async function updateItineraire(id: string, itineraireData: UpdateItineraireForm): Promise<ApiResponse<Itineraire>> {
  try {
    const result = await apiRequest<Itineraire>(`/api/v1/itineraires/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itineraireData),
    });

    // Afficher un message de succès
    if (result.data && !result.error) {
      toast.success("✅ Itinéraire modifié avec succès !");
    }

    return result;
  } catch (error) {
    // Afficher un message d'erreur
    toast.error("❌ Impossible de modifier l'itinéraire. Veuillez réessayer.");
    throw error;
  }
}

// Supprimer un itinéraire
export async function deleteItineraire(id: string): Promise<ApiResponse<void>> {
  try {
    const result = await apiRequest<void>(`/api/v1/itineraires/${id}`, {
      method: 'DELETE',
    });

    // Afficher un message de succès
    if (!result.error) {
      toast.success("✅ Itinéraire supprimé avec succès !");
    }

    return result;
  } catch (error) {
    // Afficher un message d'erreur
    toast.error("❌ Impossible de supprimer l'itinéraire. Veuillez réessayer.");
    throw error;
  }
}

// Type for itineraries statistics
export interface ItinerairesStats {
  totalItineraires: number;
  activeItineraires: number;
  inactiveItineraires: number;
  itinerairesWithVehicules: number;
  itinerairesWithoutVehicules: number;
  avgVehiculesPerItineraire: number;
}

// Obtenir les statistiques des itinéraires
export async function getItinerairesStats(): Promise<ApiResponse<ItinerairesStats>> {
  try {
    const result = await apiRequest<ItinerairesStats>(`/api/v1/itineraires/stats`);
    
    return result;
  } catch (error) {
    toast.error("❌ Impossible de charger les statistiques des itinéraires.");
    throw error;
  }
}
