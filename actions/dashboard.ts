import { apiRequest } from '@/lib/api';
import type { DashboardStats, ApiResponse } from '@/types/api';

// Obtenir les statistiques du tableau de bord
export async function getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
  return apiRequest<DashboardStats>('/api/v1/dashboard/stats');
}

// Obtenir les statistiques d'activité récente
export async function getRecentActivity(days: number = 7): Promise<ApiResponse<{
  nouveauxUtilisateurs: number;
  nouveauxProprietaires: number;
  nouveauxVehicules: number;
  nouveauxDocuments: number;
}>> {
  return apiRequest<any>(`/api/v1/dashboard/recent-activity?days=${days}`);
}

// Obtenir les tendances de création
export async function getCreationTrends(days: number = 30): Promise<ApiResponse<Array<{
  date: string;
  users: number;
  proprietaires: number;
  vehicules: number;
  documents: number;
}>>> {
  return apiRequest<any>(`/api/v1/dashboard/trends?days=${days}`);
}

// Obtenir la répartition par type
export async function getDistribution(type: 'users' | 'vehicules' | 'documents' | 'proprietaires'): Promise<ApiResponse<Array<{
  category: string;
  count: number;
  percentage: number;
}>>> {
  return apiRequest<any>(`/api/v1/dashboard/distribution/${type}`);
}

// Obtenir un résumé rapide pour les widgets
export async function getQuickSummary(): Promise<ApiResponse<{
  totalUsers: number;
  totalProprietaires: number;
  totalVehicules: number;
  totalDocuments: number;
  todayRegistrations: number;
  weeklyGrowth: {
    users: number;
    proprietaires: number;
    vehicules: number;
    documents: number;
  };
}>> {
  return apiRequest<any>('/api/v1/dashboard/summary');
}

// Obtenir les statistiques des véhicules par catégorie avec filtres temporels
export async function getVehicleStatsByCategory(period?: 'day' | 'week' | 'month'): Promise<ApiResponse<{
  stats: Array<{
    category: string;
    count: number;
    totalRevenue: number;
    standardPrice: number;
    label: string;
  }>;
  totals: {
    totalVehicles: number;
    totalRevenue: number;
    averageRevenuePerVehicle: number;
  };
  period: string;
}>> {
  const params = period ? `?period=${period}` : '';
  return apiRequest<any>(`/api/v1/dashboard/vehicles-by-category${params}`);
}

// Obtenir l'évolution des revenus par période
export async function getRevenueEvolution(days: number = 30): Promise<ApiResponse<Array<{
  date: string;
  BUS: { count: number; revenue: number };
  MINI_BUS: { count: number; revenue: number };
  TAXI: { count: number; revenue: number };
  total: { count: number; revenue: number };
}>>> {
  return apiRequest<any>(`/api/v1/dashboard/revenue-evolution?days=${days}`);
}
