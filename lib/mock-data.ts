export interface Proprietaire {
  id: string
  nom: string
  prenom: string
  adresse: string
  telephone: string
  numeroPiece: string
  typePiece: string
  lieuDelivrance: string
  dateDelivrance: string
  createdAt: string
}

export interface Vehicule {
  id: string
  proprietaireId: string
  marque: string
  modele: string
  typeVehicule: string
  numeroImmatriculation: string
  numeroChassis: string
  anneeFabrication: string
  capaciteAssises: string
  itineraire: string
  codeUnique: string
  anneeEnregistrement: string
  createdAt: string
}

export interface VehiculeWithProprietaire extends Vehicule {
  proprietaire: Proprietaire
}

// Données fictives des propriétaires
export const MOCK_PROPRIETAIRES: Proprietaire[] = [
  {
    id: "prop1",
    nom: "Dupont",
    prenom: "Jean",
    adresse: "123 Rue de la Paix, 75001 Paris, France",
    telephone: "+33 6 12 34 56 78",
    numeroPiece: "123456789",
    typePiece: "Carte d'Identité",
    lieuDelivrance: "Paris",
    dateDelivrance: "2020-01-15",
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "prop2",
    nom: "Martin",
    prenom: "Marie",
    adresse: "456 Avenue des Champs, 69000 Lyon, France",
    telephone: "+33 6 98 76 54 32",
    numeroPiece: "987654321",
    typePiece: "Passeport",
    lieuDelivrance: "Lyon",
    dateDelivrance: "2019-06-20",
    createdAt: "2024-01-20T14:30:00Z",
  },
  {
    id: "prop3",
    nom: "Durand",
    prenom: "Pierre",
    adresse: "789 Boulevard du Commerce, 13000 Marseille, France",
    telephone: "+33 6 11 22 33 44",
    numeroPiece: "456789123",
    typePiece: "Carte d'Identité",
    lieuDelivrance: "Marseille",
    dateDelivrance: "2021-03-10",
    createdAt: "2024-02-01T09:15:00Z",
  },
]

// Données fictives des véhicules
export const MOCK_VEHICULES: Vehicule[] = [
  {
    id: "veh1",
    proprietaireId: "prop1",
    marque: "Mercedes",
    modele: "Sprinter",
    typeVehicule: "Mini Bus",
    numeroImmatriculation: "AB-123-CD",
    numeroChassis: "WDB9066331234567",
    anneeFabrication: "2020",
    capaciteAssises: "25",
    itineraire: "Ligne A: Centre-ville - Aéroport",
    codeUnique: "VH-2024-001",
    anneeEnregistrement: "2024",
    createdAt: "2024-01-15T11:00:00Z",
  },
  {
    id: "veh2",
    proprietaireId: "prop2",
    marque: "Renault",
    modele: "Master",
    typeVehicule: "Bus",
    numeroImmatriculation: "EF-456-GH",
    numeroChassis: "VF1MA000012345678",
    anneeFabrication: "2019",
    capaciteAssises: "35",
    itineraire: "Ligne B: Gare - Université",
    codeUnique: "VH-2024-002",
    anneeEnregistrement: "2024",
    createdAt: "2024-01-20T15:00:00Z",
  },
  {
    id: "veh3",
    proprietaireId: "prop3",
    marque: "Toyota",
    modele: "Hiace",
    typeVehicule: "Taxi",
    numeroImmatriculation: "IJ-789-KL",
    numeroChassis: "JTFSH00P012345678",
    anneeFabrication: "2021",
    capaciteAssises: "8",
    itineraire: "Zone urbaine - Service taxi",
    codeUnique: "VH-2024-003",
    anneeEnregistrement: "2024",
    createdAt: "2024-02-01T10:00:00Z",
  },
  {
    id: "veh4",
    proprietaireId: "prop1",
    marque: "Iveco",
    modele: "Daily",
    typeVehicule: "Mini Bus",
    numeroImmatriculation: "MN-321-OP",
    numeroChassis: "ZCFC350A012345678",
    anneeFabrication: "2022",
    capaciteAssises: "20",
    itineraire: "Ligne C: Banlieue - Centre commercial",
    codeUnique: "VH-2024-004",
    anneeEnregistrement: "2024",
    createdAt: "2024-02-10T08:30:00Z",
  },
]

export const getVehiculesWithProprietaires = (): VehiculeWithProprietaire[] => {
  return MOCK_VEHICULES.map((vehicule) => ({
    ...vehicule,
    proprietaire: MOCK_PROPRIETAIRES.find((p) => p.id === vehicule.proprietaireId)!,
  }))
}

export const getProprietaireById = (id: string): Proprietaire | undefined => {
  return MOCK_PROPRIETAIRES.find((p) => p.id === id)
}

export const getVehiculeById = (id: string): Vehicule | undefined => {
  return MOCK_VEHICULES.find((v) => v.id === id)
}

// Données fictives des utilisateurs pour la gestion
export interface UtilisateurComplet {
  id: string
  email: string
  name: string
  role: "ADMIN" | "USER"
  createdAt: string
  lastLogin?: string
  isActive: boolean
}

export const MOCK_UTILISATEURS: UtilisateurComplet[] = [
  {
    id: "1",
    email: "admin@transport.com",
    name: "Administrateur Principal",
    role: "ADMIN",
    createdAt: "2024-01-01T10:00:00Z",
    lastLogin: "2024-06-04T16:19:30Z",
    isActive: true,
  },
  {
    id: "2",
    email: "user@transport.com",
    name: "Utilisateur Standard",
    role: "USER",
    createdAt: "2024-01-15T14:30:00Z",
    lastLogin: "2024-06-04T08:15:00Z",
    isActive: true,
  },
  {
    id: "3",
    email: "marie.dupont@transport.com",
    name: "Marie Dupont",
    role: "USER",
    createdAt: "2024-02-01T09:00:00Z",
    lastLogin: "2024-06-03T17:45:00Z",
    isActive: true,
  },
  {
    id: "4",
    email: "pierre.martin@transport.com",
    name: "Pierre Martin",
    role: "USER",
    createdAt: "2024-02-15T11:20:00Z",
    lastLogin: "2024-06-02T14:30:00Z",
    isActive: false,
  },
]

// Fonctions pour les statistiques
export const getStatistiques = () => {
  const today = new Date()
  const todayStr = today.toISOString().split("T")[0]

  // Statistiques totales
  const totalProprietaires = MOCK_PROPRIETAIRES.length
  const totalVehicules = MOCK_VEHICULES.length
  const totalUtilisateurs = MOCK_UTILISATEURS.length

  // Statistiques par type de véhicule
  const vehiculesParType = MOCK_VEHICULES.reduce(
    (acc, vehicule) => {
      acc[vehicule.typeVehicule] = (acc[vehicule.typeVehicule] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Statistiques journalières (simulation)
  const proprietairesAujourdhui = MOCK_PROPRIETAIRES.filter((p) => p.createdAt.startsWith(todayStr)).length

  const vehiculesAujourdhui = MOCK_VEHICULES.filter((v) => v.createdAt.startsWith(todayStr)).length

  // Évolution sur 7 jours (données simulées)
  const evolutionSemaine = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() - (6 - i))
    return {
      date: date.toISOString().split("T")[0],
      proprietaires: Math.floor(Math.random() * 5),
      vehicules: Math.floor(Math.random() * 8),
    }
  })

  return {
    totaux: {
      proprietaires: totalProprietaires,
      vehicules: totalVehicules,
      utilisateurs: totalUtilisateurs,
      documentsGeneres: totalVehicules * 2, // PDF + QR pour chaque véhicule
    },
    aujourdhui: {
      proprietaires: proprietairesAujourdhui,
      vehicules: vehiculesAujourdhui,
      connexions: Math.floor(Math.random() * 10) + 5,
    },
    vehiculesParType,
    evolutionSemaine,
  }
}

export const getUtilisateurs = (): UtilisateurComplet[] => {
  return MOCK_UTILISATEURS
}

export const getUtilisateurById = (id: string): UtilisateurComplet | undefined => {
  return MOCK_UTILISATEURS.find((u) => u.id === id)
}
