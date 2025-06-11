import { apiRequest, apiRequestFormData } from '@/lib/api';
import type { 
  Document,
  ApiResponse, 
  PaginatedResponse,
  SearchParams,
  Vehicule 
} from '@/types/api';

// Uploader un document
export async function uploadDocument(
  file: File,
  data: {
    nom: string;
    type: 'PIECE_IDENTITE' | 'PERMIS_CONDUIRE' | 'CARTE_ROSE' | 'PDF_COMPLET' | 'QR_CODE';
    proprietaireId?: string;
    vehiculeId?: string;
  }
): Promise<ApiResponse<Document>> {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('nom', data.nom);
  formData.append('type', data.type);
  
  if (data.proprietaireId) {
    formData.append('proprietaireId', data.proprietaireId);
  }
  
  if (data.vehiculeId) {
    formData.append('vehiculeId', data.vehiculeId);
  }

  return apiRequestFormData<Document>('/api/v1/documents/upload', formData);
}

// Obtenir tous les documents avec pagination et filtres
export async function getDocuments(params: SearchParams = {}): Promise<PaginatedResponse<Document>> {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/api/v1/documents?${queryString}` : '/api/v1/documents';
  
  return apiRequest<any>(endpoint);
}

// Obtenir un document par ID
export async function getDocumentById(id: string): Promise<ApiResponse<Document>> {
  return apiRequest<Document>(`/api/v1/documents/${id}`);
}

// Obtenir les documents d'un propriétaire
export async function getDocumentsByProprietaire(proprietaireId: string): Promise<ApiResponse<Document[]>> {
  return apiRequest<Document[]>(`/api/v1/documents/proprietaire/${proprietaireId}`);
}

// Obtenir les documents d'un véhicule
export async function getDocumentsByVehicule(vehiculeId: string): Promise<ApiResponse<Document[]>> {
  return apiRequest<Document[]>(`/api/v1/documents/vehicule/${vehiculeId}`);
}

// Mettre à jour un document
export async function updateDocument(id: string, documentData: {
  nom?: string;
  type?: 'PIECE_IDENTITE' | 'PERMIS_CONDUIRE' | 'CARTE_ROSE' | 'PDF_COMPLET' | 'QR_CODE';
}): Promise<ApiResponse<Document>> {
  return apiRequest<Document>(`/api/v1/documents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(documentData),
  });
}

// Supprimer un document
export async function deleteDocument(id: string): Promise<ApiResponse<{ message: string }>> {
  return apiRequest<{ message: string }>(`/api/v1/documents/${id}`, {
    method: 'DELETE',
  });
}

// Télécharger un document
export async function downloadDocument(id: string): Promise<Blob | null> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/documents/${id}/download`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors du téléchargement');
    }

    return await response.blob();
  } catch (error) {
    console.error('Erreur lors du téléchargement du document:', error);
    return null;
  }
}

// Générer un PDF complet pour un véhicule
export async function generateCompletePdf(vehiculeId: string): Promise<ApiResponse<Document>> {
  return apiRequest<Document>('/api/v1/documents/generate-pdf', {
    method: 'POST',
    body: JSON.stringify({ vehiculeId }),
  });
}

// Générer un QR code pour un véhicule
export async function generateQrCode(vehiculeId: string): Promise<ApiResponse<Document>> {
  return apiRequest<Document>('/api/v1/documents/generate-qr', {
    method: 'POST',
    body: JSON.stringify({ vehiculeId }),
  });
}

// Obtenir les statistiques des documents
export async function getDocumentsStats(): Promise<ApiResponse<{
  total: number;
  parType: Array<{ type: string; count: number }>;
  recentUploads: number;
}>> {
  return apiRequest<any>('/api/v1/documents/stats');
}

// Obtenir tous les véhicules avec leurs propriétaires pour la génération de documents
export async function getVehiculesForDocuments(): Promise<PaginatedResponse<Vehicule>> {
  return apiRequest<any>('/api/v1/vehicules?limit=1000');
}
