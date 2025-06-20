import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';
import type { 
  ApiResponse, 
  PaginatedResponse,
  SearchParams 
} from '@/types/api';

// Interface pour les documents avec informations complètes
export interface DocumentWithDetails {
  id: string;
  nom: string;
  type: string;
  chemin: string;
  taille?: number;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
  source?: 'proprietaire' | 'vehicule';
  proprietaire?: {
    id: string;
    nom: string;
    prenom: string;
  };
  vehicule?: {
    id: string;
    marque: string;
    modele: string;
    numeroImmatriculation: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface DocumentPreview {
  id: string;
  nom: string;
  type: string;
  mimeType?: string;
  taille?: number;
  createdAt: string;
  updatedAt: string;
  fileUrl: string;
  canPreview: boolean;
  proprietaire?: {
    id: string;
    nom: string;
    prenom: string;
  };
  vehicule?: {
    id: string;
    marque: string;
    modele: string;
    numeroImmatriculation: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ProprietaireDocuments {
  documents: DocumentWithDetails[];
  proprietaire: {
    id: string;
    nom: string;
    prenom: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface VehiculeDocuments {
  documents: DocumentWithDetails[];
  vehicule: {
    id: string;
    marque: string;
    modele: string;
    numeroImmatriculation: string;
    proprietaire: {
      id: string;
      nom: string;
      prenom: string;
    };
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DocumentsSearchResult {
  documents: DocumentWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    search?: string;
    type?: string;
    proprietaireId?: string;
    vehiculeId?: string;
    dateFrom?: string;
    dateTo?: string;
    source?: string;
  };
}

// Récupérer tous les documents d'un propriétaire (inclut ses véhicules)
export async function getDocumentsByProprietaire(
  proprietaireId: string, 
  searchParams: SearchParams = {}
): Promise<ApiResponse<ProprietaireDocuments>> {
  try {
    const params = new URLSearchParams();
    if (searchParams.page) params.append('page', searchParams.page.toString());
    if (searchParams.limit) params.append('limit', searchParams.limit.toString());

    const queryString = params.toString();
    const url = `/api/v1/access/proprietaires/${proprietaireId}/documents${queryString ? `?${queryString}` : ''}`;
    
    const result = await apiRequest<ProprietaireDocuments>(url);
    return result;
  } catch (error) {
    toast.error("❌ Impossible de charger les documents du propriétaire.");
    throw error;
  }
}

// Récupérer tous les documents d'un véhicule
export async function getDocumentsByVehicule(
  vehiculeId: string, 
  searchParams: SearchParams = {}
): Promise<ApiResponse<VehiculeDocuments>> {
  try {
    const params = new URLSearchParams();
    if (searchParams.page) params.append('page', searchParams.page.toString());
    if (searchParams.limit) params.append('limit', searchParams.limit.toString());

    const queryString = params.toString();
    const url = `/api/v1/access/vehicules/${vehiculeId}/documents${queryString ? `?${queryString}` : ''}`;
    
    const result = await apiRequest<VehiculeDocuments>(url);
    return result;
  } catch (error) {
    toast.error("❌ Impossible de charger les documents du véhicule.");
    throw error;
  }
}

// Prévisualiser un document
export async function getDocumentPreview(documentId: string): Promise<ApiResponse<DocumentPreview>> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    // Debug logging pour voir si on a un token
    console.log('🔍 getDocumentPreview Debug:', {
      documentId,
      hasToken: !!token,
      tokenLength: token?.length || 0
    });
    
    let url = `/api/v1/access/documents/${documentId}/preview`;
    
    // Ajouter le token en query param si disponible
    if (token) {
      url += `?token=${encodeURIComponent(token)}`;
    }
    
    const result = await apiRequest<DocumentPreview>(url);
    
    console.log('🔍 getDocumentPreview Result:', {
      success: !!result.data,
      error: result.error,
      hasFileUrl: !!(result.data?.fileUrl)
    });
    
    return result;
  } catch (error) {
    console.error('🔍 getDocumentPreview Error:', error);
    toast.error("❌ Impossible de charger la prévisualisation du document.");
    throw error;
  }
}

// Obtenir l'URL du fichier avec token d'authentification
export function getDocumentFileUrl(documentId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  // Pour les requêtes directes (img src, iframe src), on ne peut pas ajouter de headers
  // Le backend doit gérer l'authentification via query params ou sessions
  return `${baseUrl}/api/v1/access/documents/${documentId}/file${token ? `?token=${encodeURIComponent(token)}` : ''}`;
}

// Obtenir l'URL du fichier avec token d'authentification
export function getDocumentFileUrlWithToken(documentId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return `${baseUrl}/api/v1/access/documents/${documentId}/file${token ? `?token=${encodeURIComponent(token)}` : ''}`;
}

// Télécharger un document
export async function downloadDocument(documentId: string, fileName?: string): Promise<void> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    if (!token) {
      toast.error("❌ Authentification requise pour télécharger le document.");
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const url = `${baseUrl}/api/v1/access/documents/${documentId}/file`;
    
    // Tenter de télécharger via fetch avec authentification
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    // Obtenir le blob du fichier
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    // Créer un lien de téléchargement
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName || `document-${documentId}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Nettoyer l'URL du blob
    window.URL.revokeObjectURL(downloadUrl);
    
    toast.success("📥 Téléchargement du document réussi.");
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error);
    toast.error("❌ Erreur lors du téléchargement du document.");
    throw error;
  }
}

// Supprimer un document
export async function deleteDocument(documentId: string): Promise<ApiResponse<{ message: string }>> {
  try {
    const result = await apiRequest<{ message: string }>(`/api/v1/documents/${documentId}`, {
      method: 'DELETE'
    });
    
    if (result.data) {
      toast.success("✅ Document supprimé avec succès");
    }
    
    return result;
  } catch (error) {
    console.error('🔍 deleteDocument Error:', error);
    toast.error("❌ Erreur lors de la suppression du document.");
    throw error;
  }
}

// Recherche globale de documents avec filtres
export async function searchDocuments(filters: {
  search?: string;
  type?: string;
  proprietaireId?: string;
  vehiculeId?: string;
  dateFrom?: string;
  dateTo?: string;
  source?: 'proprietaire' | 'vehicule';
  page?: number;
  limit?: number;
}): Promise<ApiResponse<DocumentsSearchResult>> {
  try {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = `/api/v1/access/documents/search${queryString ? `?${queryString}` : ''}`;
    
    const result = await apiRequest<DocumentsSearchResult>(url);
    return result;
  } catch (error) {
    toast.error("❌ Erreur lors de la recherche de documents.");
    throw error;
  }
}

// Formater la taille du fichier
export function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Taille inconnue';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
}

// Obtenir l'icône du type de fichier
export function getFileTypeIcon(mimeType?: string): string {
  if (!mimeType) return '📄';
  
  if (mimeType.includes('image/')) return '🖼️';
  if (mimeType.includes('pdf')) return '📕';
  if (mimeType.includes('word')) return '📘';
  if (mimeType.includes('excel')) return '📗';
  
  return '📄';
}
