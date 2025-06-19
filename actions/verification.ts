import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';
import type { ApiResponse } from '@/types/api';

// Interface pour les données de vérification
export interface VehicleVerificationData {
  codeUnique: string;
  marque: string;
  modele: string;
  typeVehicule: string;
  numeroImmatriculation: string;
  anneeFabrication: number;
  capaciteAssises: number;
  anneeEnregistrement: number;
  proprietaire: {
    nom: string;
    telephone: string;
  };
  itineraire: {
    nom: string;
    description: string;
  };
  statut: string;
  dateVerification: string;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  data: VehicleVerificationData | null;
}

// Vérifier un véhicule par son code unique
export async function verifyVehicleByCode(codeUnique: string): Promise<VerificationResponse> {
  try {
    const response = await apiRequest<VehicleVerificationData>(
      `/api/v1/verify/${codeUnique}`
    );

    if (response.error) {
      return {
        success: false,
        message: response.error,
        data: null
      };
    }

    return {
      success: true,
      message: 'Véhicule vérifié avec succès',
      data: response.data
    };

  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    return {
      success: false,
      message: 'Erreur de connexion au serveur',
      data: null
    };
  }
}

// Obtenir les statistiques de vérification
export async function getVerificationStats(): Promise<ApiResponse<{
  totalVehicules: number;
  vehiculesActifs: number;
  pourcentageActifs: number;
} | null>> {
  try {
    const response = await apiRequest<{
      totalVehicules: number;
      vehiculesActifs: number;
      pourcentageActifs: number;
    }>('/verify/stats/overview');

    return response;

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return {
      data: null,
      error: 'Erreur lors de la récupération des statistiques'
    };
  }
}

// Fonction utilitaire pour valider le format du code unique
export function isValidCodeUnique(code: string): boolean {
  // Format attendu: LSH-25-SA000001 (3 lettres, 2 chiffres, 2 lettres, 6 chiffres)
  const codePattern = /^[A-Z]{3}-\d{2}-[A-Z]{2}\d{6}$/;
  return codePattern.test(code);
}

// Fonction pour formater l'affichage du code unique
export function formatCodeUnique(code: string): string {
  return code.toUpperCase().replace(/\s+/g, '');
}
