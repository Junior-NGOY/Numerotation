# Actions API Frontend

Ce dossier contient toutes les fonctions pour interagir avec l'API backend du système d'enregistrement des véhicules.

## Structure

```
actions/
├── index.ts          # Export principal de toutes les actions
├── users.ts          # Actions pour la gestion des utilisateurs
├── proprietaires.ts  # Actions pour la gestion des propriétaires
├── vehicules.ts      # Actions pour la gestion des véhicules
├── documents.ts      # Actions pour la gestion des documents
├── dashboard.ts      # Actions pour les statistiques du tableau de bord
└── audit.ts          # Actions pour les logs d'audit
```

## Configuration

### Variables d'environnement

Créez un fichier `.env.local` dans le dossier frontend avec :

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Types

Tous les types TypeScript sont définis dans `types/api.ts` et correspondent exactement au schéma Prisma du backend.

## Utilisation

### Import des actions

```typescript
import { 
  getProprietaires, 
  createProprietaire, 
  updateProprietaire,
  deleteProprietaire 
} from '@/actions'
```

### Utilisation basique

```typescript
// Récupérer tous les propriétaires
const response = await getProprietaires({ page: 1, limit: 10 })

if (response.error) {
  console.error('Erreur:', response.error)
} else {
  console.log('Données:', response.data)
}
```

### Avec les hooks personnalisés

Pour une utilisation plus avancée avec gestion d'état, utilisez les hooks dans `hooks/use-api.ts` :

```typescript
import { usePaginatedApiCall, useApiMutation } from '@/hooks/use-api'
import { getProprietaires, createProprietaire } from '@/actions'

function ProprietairesComponent() {
  // Pour les listes paginées
  const {
    data: proprietaires,
    loading,
    error,
    pagination,
    updateParams,
    refetch
  } = usePaginatedApiCall(getProprietaires, { page: 1, limit: 10 })

  // Pour les mutations (create, update, delete)
  const createMutation = useApiMutation(createProprietaire)

  const handleCreate = async (data) => {
    const result = await createMutation.mutate(data)
    if (result) {
      // Succès
      refetch() // Recharger la liste
    } else {
      // Erreur dans createMutation.error
    }
  }

  // ...
}
```

## Actions disponibles

### Utilisateurs (`users.ts`)

- `createUser(userData)` - Créer un utilisateur
- `loginUser(credentials)` - Authentifier un utilisateur
- `getUsers(params)` - Liste des utilisateurs avec pagination
- `getUserById(id)` - Détails d'un utilisateur
- `updateUser(id, userData)` - Modifier un utilisateur
- `deleteUser(id)` - Supprimer un utilisateur
- `changeUserPassword(id, passwordData)` - Changer le mot de passe

### Propriétaires (`proprietaires.ts`)

- `createProprietaire(data)` - Créer un propriétaire
- `getProprietaires(params)` - Liste des propriétaires avec pagination et recherche
- `getProprietaireById(id)` - Détails d'un propriétaire
- `updateProprietaire(id, data)` - Modifier un propriétaire
- `deleteProprietaire(id)` - Supprimer un propriétaire
- `searchProprietaireByNumeroPiece(numero)` - Recherche par numéro de pièce

### Véhicules (`vehicules.ts`)

- `createVehicule(data)` - Créer un véhicule
- `getVehicules(params)` - Liste des véhicules avec pagination et filtres
- `getVehiculeById(id)` - Détails d'un véhicule
- `getVehiculeByCodeUnique(code)` - Recherche par code unique
- `getVehiculesByProprietaire(proprietaireId)` - Véhicules d'un propriétaire
- `updateVehicule(id, data)` - Modifier un véhicule
- `deleteVehicule(id)` - Supprimer un véhicule
- `checkVehiculeUniqueness(data)` - Vérifier l'unicité des identifiants

### Documents (`documents.ts`)

- `uploadDocument(file, data)` - Uploader un document
- `getDocuments(params)` - Liste des documents
- `getDocumentById(id)` - Détails d'un document
- `getDocumentsByProprietaire(id)` - Documents d'un propriétaire
- `getDocumentsByVehicule(id)` - Documents d'un véhicule
- `updateDocument(id, data)` - Modifier un document
- `deleteDocument(id)` - Supprimer un document
- `downloadDocument(id)` - Télécharger un document
- `generateCompletePdf(vehiculeId)` - Générer un PDF complet
- `generateQrCode(vehiculeId)` - Générer un QR code

### Dashboard (`dashboard.ts`)

- `getDashboardStats()` - Statistiques complètes du tableau de bord
- `getRecentActivity(days)` - Activité récente
- `getCreationTrends(days)` - Tendances de création
- `getDistribution(type)` - Répartition par type
- `getQuickSummary()` - Résumé rapide pour les widgets

### Audit (`audit.ts`)

- `getAuditLogs(params)` - Liste des logs d'audit
- `getAuditLogById(id)` - Détails d'un log
- `getAuditLogsByUser(userId)` - Logs d'un utilisateur
- `getAuditLogsByTable(table)` - Logs d'une table
- `getAuditLogsByRecord(table, recordId)` - Logs d'un enregistrement
- `getAuditStats(params)` - Statistiques d'audit

## Gestion des erreurs

Toutes les actions retournent un objet avec cette structure :

```typescript
{
  data: T | null,
  error: string | null
}
```

Pour les listes paginées :

```typescript
{
  data: {
    [entityName]: T[],
    pagination: {
      page: number,
      limit: number,
      total: number,
      totalPages: number
    }
  },
  error: string | null
}
```

## Authentification

L'authentification est gérée automatiquement :

1. Lors de la connexion, le token JWT est stocké dans `localStorage`
2. Toutes les requêtes API incluent automatiquement le header `Authorization`
3. En cas de token expiré, l'utilisateur est redirigé vers la page de connexion

## Migration des pages existantes

Pour migrer une page existante utilisant les données fictives :

1. Remplacez les imports de `@/lib/mock-data` par `@/actions`
2. Utilisez les hooks `usePaginatedApiCall` ou `useApiMutation`
3. Adaptez la gestion des erreurs et du chargement
4. Testez avec le backend en cours d'exécution

Exemple de migration disponible dans :
- `app/proprietaires/page-with-api.tsx`
- `app/dashboard/page-with-api.tsx`
