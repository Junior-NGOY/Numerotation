// Types pour les réponses API
export interface ApiResponse<T> {
  data: T;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } | null;
  error: string | null;
}

// Types correspondant au backend Prisma
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    createdProprietaires: number;
    createdVehicules: number;
    createdDocuments: number;
  };
}

export interface Proprietaire {
  id: string;
  nom: string;
  prenom: string;
  adresse: string;
  telephone: string;
  numeroPiece: string;
  typePiece: 'CARTE_IDENTITE' | 'PASSEPORT' | 'PERMIS_SEJOUR';
  lieuDelivrance: string;
  dateDelivrance: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    vehicules: number;
    documents: number;
  };
}

export interface Vehicule {
  id: string;
  marque: string;
  modele: string;
  typeVehicule: 'BUS' | 'MINI_BUS' | 'TAXI';
  numeroImmatriculation: string;
  numeroChassis: string;
  anneeFabrication: number;
  capaciteAssises: number;
  itineraire: string;
  codeUnique: string;
  anneeEnregistrement: number;
  prixEnregistrement: number;
  proprietaireId: string;
  createdAt: string;
  updatedAt?: string;
  proprietaire?: {
    id: string;
    nom: string;
    prenom: string;
    telephone: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    documents: number;
  };
}

export interface Document {
  id: string;
  nom: string;
  type: 'PIECE_IDENTITE' | 'PERMIS_CONDUIRE' | 'CARTE_ROSE' | 'PDF_COMPLET' | 'QR_CODE';
  chemin: string;
  taille?: number;
  mimeType?: string;
  proprietaireId?: string;
  vehiculeId?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AuditLog {
  id: string;
  action: string;
  table: string;
  recordId: string;
  oldValues?: any;
  newValues?: any;
  userId?: string;
  userEmail?: string;
  createdAt: string;
}

export interface DashboardStats {
  general: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    totalProprietaires: number;
    totalVehicules: number;
    totalDocuments: number;
    totalRevenue: number;
  };
  activiteRecente: {
    nouveauxUtilisateurs: number;
    nouveauxProprietaires: number;
    nouveauxVehicules: number;
    nouveauxDocuments: number;
  };
  repartitions: {
    utilisateursParRole: Array<{ role: string; _count: { id: number } }>;
    vehiculesParType: Array<{ typeVehicule: string; _count: { id: number } }>;
    documentsParType: Array<{ type: string; _count: { id: number } }>;
    proprietairesParTypePiece: Array<{ typePiece: string; _count: { id: number } }>;
  };
  tendances: {
    creationsParJour: Array<{
      date: string;
      users: number;
      proprietaires: number;
      vehicules: number;
      documents: number;
    }>;
  };
}

// Types pour les formulaires
export interface CreateUserForm {
  email: string;
  name: string;
  password: string;
  role?: 'ADMIN' | 'USER';
}

export interface UpdateUserForm {
  email?: string;
  name?: string;
  role?: 'ADMIN' | 'USER';
  isActive?: boolean;
}

export interface ChangePasswordForm {
  oldPassword: string;
  newPassword: string;
}

export interface CreateProprietaireForm {
  nom: string;
  prenom: string;
  adresse: string;
  telephone: string;
  numeroPiece: string;
  typePiece: 'CARTE_IDENTITE' | 'PASSEPORT' | 'PERMIS_SEJOUR';
  lieuDelivrance: string;
  dateDelivrance: string;
}

export interface CreateVehiculeForm {
  marque: string;
  modele: string;
  typeVehicule: 'BUS' | 'MINI_BUS' | 'TAXI';
  numeroImmatriculation: string;
  numeroChassis: string;
  anneeFabrication: number;
  capaciteAssises: number;
  itineraire: string;
  codeUnique?: string; // Optionnel car généré automatiquement côté backend
  anneeEnregistrement?: number; // Optionnel, utilise l'année courante par défaut
  proprietaireId: string;
}

// Types pour les requêtes de recherche
export interface SearchParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: any;
}
