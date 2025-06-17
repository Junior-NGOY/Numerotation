// Utilitaires pour la préparation des données d'export
import { formatPrice, getVehicleTypeDescription } from './pricing-utils'

// Interface pour les statistiques d'export
export interface ExportStatistics {
  revenusTotal: number
  repartitionTypes: Record<string, number>
  vehiculesParMois: Record<string, number>
  proprietairesParRegion?: Record<string, number>
  moyenneAge?: number
  capaciteTotale?: number
}

// Calculer les statistiques à partir des données véhicules
export const calculateVehicleStatistics = (vehicules: any[]): ExportStatistics => {
  const stats: ExportStatistics = {
    revenusTotal: 0,
    repartitionTypes: {},
    vehiculesParMois: {}
  }

  vehicules.forEach(vehicule => {
    // Revenus total
    stats.revenusTotal += vehicule.prixEnregistrement || 0

    // Répartition par type
    const type = vehicule.typeVehicule
    stats.repartitionTypes[type] = (stats.repartitionTypes[type] || 0) + 1

    // Véhicules par mois (basé sur la date de création)
    if (vehicule.createdAt) {
      const mois = new Date(vehicule.createdAt).toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long' 
      })
      stats.vehiculesParMois[mois] = (stats.vehiculesParMois[mois] || 0) + 1
    }
  })

  // Calculs additionnels
  stats.moyenneAge = vehicules.reduce((sum, v) => {
    const age = new Date().getFullYear() - (v.anneeFabrication || 2000)
    return sum + age
  }, 0) / vehicules.length

  stats.capaciteTotale = vehicules.reduce((sum, v) => sum + (v.capaciteAssises || 0), 0)

  return stats
}

// Préparer les données véhicules pour l'export avec toutes les informations nécessaires
export const prepareFullVehicleExportData = (vehiculesWithProprietaires: any[]) => {
  return vehiculesWithProprietaires.map((item, index) => {
    const ageVehicule = new Date().getFullYear() - (item.anneeFabrication || 2000)
    
    return {
      // IDENTIFIANT
      "N°": index + 1,
      
      // PROPRIÉTAIRE
      "Nom Complet Propriétaire": `${item.proprietaire?.prenom || ''} ${item.proprietaire?.nom || ''}`.trim(),
      "Téléphone": item.proprietaire?.telephone || 'Non spécifié',
      "Adresse": item.proprietaire?.adresse || 'Non spécifiée',
      "Type Pièce": item.proprietaire?.typePiece || 'Non spécifié',
      "N° Pièce": item.proprietaire?.numeroPiece || 'Non spécifié',
      "Lieu Délivrance": item.proprietaire?.lieuDelivrance || 'Non spécifié',
      "Date Délivrance": item.proprietaire?.dateDelivrance 
        ? new Date(item.proprietaire.dateDelivrance).toLocaleDateString("fr-FR")
        : 'Non spécifiée',
      
      // VÉHICULE
      "Marque": item.marque || 'Non spécifiée',
      "Modèle": item.modele || 'Non spécifié',
      "Type Véhicule": getVehicleTypeDescription(item.typeVehicule) || item.typeVehicule || 'Non spécifié',
      "Immatriculation": item.numeroImmatriculation || 'Non spécifiée',
      "N° Châssis": item.numeroChassis || 'Non spécifié',
      "Année Fabrication": item.anneeFabrication || 'Non spécifiée',
      "Âge (années)": ageVehicule,
      "Capacité Assises": item.capaciteAssises || 0,
      "Itinéraire": item.itineraire?.nom || 'Non spécifié',
      
      // ADMINISTRATIF
      "Code Unique": item.codeUnique || 'Non généré',
      "Prix Enregistrement (FC)": item.prixEnregistrement || 0,
      "Prix (formaté)": formatPrice(item.prixEnregistrement || 0),
      "Année Enregistrement": item.anneeEnregistrement || new Date().getFullYear(),
      
      // DATES
      "Date Création": item.createdAt 
        ? new Date(item.createdAt).toLocaleDateString("fr-FR")
        : 'Non spécifiée',
      "Heure Création": item.createdAt 
        ? new Date(item.createdAt).toLocaleTimeString("fr-FR")
        : 'Non spécifiée',
      "Dernière MAJ": item.updatedAt 
        ? new Date(item.updatedAt).toLocaleDateString("fr-FR")
        : 'Non spécifiée',
      
      // MÉTADONNÉES
      "Créé Par": item.createdBy?.name || 'Système',
      "Email Créateur": item.createdBy?.email || 'Non spécifié',
      "Statut": 'Actif',
      
      // VÉRIFICATION
      "URL Vérification QR": `${typeof window !== 'undefined' ? window.location.origin : ''}/vehicules/verify/${item.codeUnique || ''}`
    }
  })
}

// Préparer les données propriétaires pour l'export détaillé
export const prepareFullProprietaireExportData = (proprietaires: any[]) => {
  return proprietaires.map((item, index) => ({
    // IDENTIFIANT
    "N°": index + 1,
    
    // INFORMATIONS PERSONNELLES
    "Nom Complet": `${item.prenom || ''} ${item.nom || ''}`.trim(),
    "Prénom": item.prenom || 'Non spécifié',
    "Nom": item.nom || 'Non spécifié',
    "Téléphone": item.telephone || 'Non spécifié',
    "Adresse Complète": item.adresse || 'Non spécifiée',
    
    // PIÈCE D'IDENTITÉ
    "Type Pièce Identité": item.typePiece || 'Non spécifié',
    "Numéro Pièce": item.numeroPiece || 'Non spécifié',
    "Lieu Délivrance": item.lieuDelivrance || 'Non spécifié',
    "Date Délivrance": item.dateDelivrance 
      ? new Date(item.dateDelivrance).toLocaleDateString("fr-FR")
      : 'Non spécifiée',
    
    // STATISTIQUES
    "Nombre Véhicules": item._count?.vehicules || item.vehicules?.length || 0,
    "Nombre Documents": item._count?.documents || item.documents?.length || 0,
    
    // VÉHICULES (résumé)
    "Types Véhicules": item.vehicules?.map((v: any) => 
      getVehicleTypeDescription(v.typeVehicule) || v.typeVehicule
    ).join(', ') || 'Aucun',
    
    "Immatriculations": item.vehicules?.map((v: any) => 
      v.numeroImmatriculation
    ).join(', ') || 'Aucune',
    
    // FINANCIER
    "Total Investi (FC)": item.vehicules?.reduce((sum: number, v: any) => 
      sum + (v.prixEnregistrement || 0), 0
    ) || 0,
    
    "Total Investi (formaté)": formatPrice(
      item.vehicules?.reduce((sum: number, v: any) => 
        sum + (v.prixEnregistrement || 0), 0
      ) || 0
    ),
    
    // DATES
    "Date Enregistrement": item.createdAt 
      ? new Date(item.createdAt).toLocaleDateString("fr-FR")
      : 'Non spécifiée',
    "Dernière Activité": item.updatedAt 
      ? new Date(item.updatedAt).toLocaleDateString("fr-FR")
      : 'Non spécifiée',
    
    // MÉTADONNÉES
    "Enregistré Par": item.createdBy?.name || 'Système',
    "Email Créateur": item.createdBy?.email || 'Non spécifié',
    "Statut Compte": 'Actif'
  }))
}

// Générer un nom de fichier intelligent basé sur les données
export const generateExportFilename = (
  type: 'vehicules' | 'proprietaires' | 'rapport-complet' | 'synthese',
  options?: {
    dateDebut?: string,
    dateFin?: string,
    typeVehicule?: string,
    region?: string
  }
): string => {
  const today = new Date().toISOString().split('T')[0]
  let filename = `${type}_${today}`
  
  if (options?.dateDebut && options?.dateFin) {
    filename += `_periode_${options.dateDebut}_au_${options.dateFin}`
  }
  
  if (options?.typeVehicule) {
    filename += `_${options.typeVehicule.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
  }
  
  if (options?.region) {
    filename += `_${options.region.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
  }
  
  return filename
}

// Valider les données avant export
export const validateExportData = (data: any[]): { isValid: boolean, errors: string[] } => {
  const errors: string[] = []
  
  if (!Array.isArray(data)) {
    errors.push('Les données doivent être un tableau')
    return { isValid: false, errors }
  }
  
  if (data.length === 0) {
    errors.push('Aucune donnée à exporter')
    return { isValid: false, errors }
  }
  
  // Vérifier que tous les éléments ont au moins une propriété
  const invalidItems = data.filter(item => 
    !item || typeof item !== 'object' || Object.keys(item).length === 0
  )
  
  if (invalidItems.length > 0) {
    errors.push(`${invalidItems.length} élément(s) invalide(s) détecté(s)`)
  }
  
  return { 
    isValid: errors.length === 0, 
    errors 
  }
}
