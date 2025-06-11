import { apiRequest } from '@/lib/api';
import type { 
  AuditLog,
  ApiResponse, 
  PaginatedResponse,
  SearchParams 
} from '@/types/api';

// Obtenir les logs d'audit avec pagination et filtres
export async function getAuditLogs(params: SearchParams = {}): Promise<PaginatedResponse<AuditLog>> {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/api/v1/audit?${queryString}` : '/api/v1/audit';
  
  return apiRequest<any>(endpoint);
}

// Obtenir un log d'audit par ID
export async function getAuditLogById(id: string): Promise<ApiResponse<AuditLog>> {
  return apiRequest<AuditLog>(`/api/v1/audit/${id}`);
}

// Obtenir les logs d'audit pour un utilisateur spécifique
export async function getAuditLogsByUser(userId: string, params: SearchParams = {}): Promise<PaginatedResponse<AuditLog>> {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const endpoint = queryString 
    ? `/api/v1/audit/user/${userId}?${queryString}` 
    : `/api/v1/audit/user/${userId}`;
  
  return apiRequest<any>(endpoint);
}

// Obtenir les logs d'audit pour une table spécifique
export async function getAuditLogsByTable(table: string, params: SearchParams = {}): Promise<PaginatedResponse<AuditLog>> {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const endpoint = queryString 
    ? `/api/v1/audit/table/${table}?${queryString}` 
    : `/api/v1/audit/table/${table}`;
  
  return apiRequest<any>(endpoint);
}

// Obtenir les logs d'audit pour un enregistrement spécifique
export async function getAuditLogsByRecord(table: string, recordId: string): Promise<ApiResponse<AuditLog[]>> {
  return apiRequest<AuditLog[]>(`/api/v1/audit/record/${table}/${recordId}`);
}

// Obtenir les statistiques d'audit
export async function getAuditStats(params: {
  dateFrom?: string;
  dateTo?: string;
} = {}): Promise<ApiResponse<{
  totalLogs: number;
  actionsByType: Array<{ action: string; count: number }>;
  tablesByActivity: Array<{ table: string; count: number }>;
  usersByActivity: Array<{ userEmail: string; count: number }>;
  dailyActivity: Array<{ date: string; count: number }>;
}>> {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/api/v1/audit/stats?${queryString}` : '/api/v1/audit/stats';
  
  return apiRequest<any>(endpoint);
}
