// Exporte toutes les actions pour un accès facile
export * from './users';
export * from './proprietaires';
export * from './vehicules';
export * from './documents';
export * from './dashboard';
export * from './audit';

// Types réexportés pour faciliter l'usage
export type {
  User,
  Proprietaire,
  Vehicule,
  Document,
  AuditLog,
  DashboardStats,
  CreateUserForm,
  UpdateUserForm,
  ChangePasswordForm,
  CreateProprietaireForm,
  CreateVehiculeForm,
  SearchParams,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';
