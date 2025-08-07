// Export Excel avec la bibliothèque xlsx
import * as XLSX from 'xlsx'
import { generateVehicleQRData, generateQRCodeUrl, generateQRCodeForVehicule } from './qr-generator'
import { formatPrice, getVehicleTypeDescription } from './pricing-utils'

// Types pour améliorer la sécurité des types
interface ExportVehiculeData {
  [key: string]: any
}

interface ExportProprietaireData {
  [key: string]: any
}

// Fonctions utilitaires pour le formatage
const formatDate = (date: string | Date): string => {
  if (!date) return 'Non spécifiée'
  return new Date(date).toLocaleDateString('fr-FR')
}

const mapTypePiece = (type: string): string => {
  const mapping: { [key: string]: string } = {
    'CARTE_IDENTITE': 'Carte d\'identité',
    'PASSEPORT': 'Passeport',
    'PERMIS_SEJOUR': 'Permis de séjour'
  }
  return mapping[type] || type
}

const mapTypeVehicule = (type: string): string => {
  const mapping: { [key: string]: string } = {
    'BUS': 'Bus',
    'MINI_BUS': 'Mini-bus',
    'TAXI': 'Taxi'
  }
  return mapping[type] || type
}

// Fonctions utilitaires pour les filtres de date
const isToday = (date: string | Date): boolean => {
  const today = new Date()
  const compareDate = new Date(date)
  return (
    compareDate.getDate() === today.getDate() &&
    compareDate.getMonth() === today.getMonth() &&
    compareDate.getFullYear() === today.getFullYear()
  )
}

const isSpecificDate = (date: string | Date, targetDate: string): boolean => {
  const compareDate = new Date(date)
  const target = new Date(targetDate)
  return (
    compareDate.getDate() === target.getDate() &&
    compareDate.getMonth() === target.getMonth() &&
    compareDate.getFullYear() === target.getFullYear()
  )
}

const isInDateRange = (date: string | Date, startDate: string, endDate: string): boolean => {
  const compareDate = new Date(date)
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Mettre les heures à 00:00:00 pour la date de début et 23:59:59 pour la date de fin
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)
  
  return compareDate >= start && compareDate <= end
}

const filterDataByDate = (data: any[], dateField: string = 'createdAt', options: {
  type: 'today' | 'specific' | 'range',
  specificDate?: string,
  startDate?: string,
  endDate?: string
}) => {
  return data.filter(item => {
    const itemDate = item[dateField]
    if (!itemDate) return false

    switch (options.type) {
      case 'today':
        return isToday(itemDate)
      case 'specific':
        return options.specificDate ? isSpecificDate(itemDate, options.specificDate) : false
      case 'range':
        return options.startDate && options.endDate 
          ? isInDateRange(itemDate, options.startDate, options.endDate)
          : false
      default:
        return true
    }
  })
}

export const exportToExcel = (data: Array<{[key: string]: any}>, filename: string) => {
  if (data.length === 0) {
    console.warn('Aucune donnée à exporter')
    return
  }

  // Créer un nouveau classeur
  const workbook = XLSX.utils.book_new()
  
  // Convertir les données en feuille de calcul
  const worksheet = XLSX.utils.json_to_sheet(data)
  
  // Ajuster la largeur des colonnes
  const columnWidths = Object.keys(data[0]).map(key => ({
    wch: Math.max(key.length, 15) // Largeur minimale de 15 caractères
  }))
  worksheet['!cols'] = columnWidths
  
  // Ajouter la feuille au classeur
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Données')
  
  // Générer et télécharger le fichier Excel
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  
  const link = document.createElement('a')
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Nettoyer l'URL
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }
}

const convertToCSV = (data: Array<{[key: string]: any}>): string => {
  if (data.length === 0) return ""

  const headers = Object.keys(data[0])
  const csvHeaders = headers.join(",")

  const csvRows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header]
        // Échapper les guillemets et entourer de guillemets si nécessaire
        if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      })
      .join(","),
  )

  return [csvHeaders, ...csvRows].join("\n")
}

export const prepareVehiculeDataForExport = (vehiculesWithProprietaires: any[]): Array<{[key: string]: any}> => {
  return vehiculesWithProprietaires.map((item) => {
    // Générer les données QR pour chaque véhicule
    const qrData = generateVehicleQRData(item)
    
    return {
      // INFORMATIONS PROPRIÉTAIRE (correction des noms de champs)
      "Prénom Propriétaire": item.proprietaire?.prenom || 'Non spécifié',
      "Nom Propriétaire": item.proprietaire?.nom || 'Non spécifié',
      "Téléphone Propriétaire": item.proprietaire?.telephone || 'Non spécifié',
      "Adresse Propriétaire": item.proprietaire?.adresse || 'Non spécifiée',
      "Type Pièce Identité": item.proprietaire?.typePiece || 'Non spécifié',
      "Numéro Pièce Identité": item.proprietaire?.numeroPiece || 'Non spécifié',
      "Lieu Délivrance": item.proprietaire?.lieuDelivrance || 'Non spécifié',
      "Date Délivrance": item.proprietaire?.dateDelivrance 
        ? new Date(item.proprietaire.dateDelivrance).toLocaleDateString("fr-FR")
        : 'Non spécifiée',
      
      // INFORMATIONS VÉHICULE
      "Marque Véhicule": item.marque || 'Non spécifiée',
      "Modèle Véhicule": item.modele || 'Non spécifié',
      "Type Véhicule": getVehicleTypeDescription(item.typeVehicule) || item.typeVehicule || 'Non spécifié',
      "Numéro Immatriculation": item.numeroImmatriculation || 'Non spécifiée',
      "Numéro Châssis": item.numeroChassis || 'Non spécifié',
      "Année Fabrication": item.anneeFabrication || 'Non spécifiée',
      "Capacité Assises": item.capaciteAssises || '0',
      
      // ITINÉRAIRE
      "Itinéraire": item.itineraire?.nom || 'Non spécifié',
      
      // INFORMATIONS ADMINISTRATIVES
      "Code Unique": item.codeUnique || 'Non généré',
      "Prix Enregistrement": formatPrice(item.prixEnregistrement || 0),
      "Année Enregistrement": item.anneeEnregistrement || new Date().getFullYear(),
      "Date Création": item.createdAt ? new Date(item.createdAt).toLocaleDateString("fr-FR") : 'Non spécifiée',
      "Date Mise à Jour": item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("fr-FR") : 'Non spécifiée',
      
      // DONNÉES QR CODE
      "Données QR Code": qrData,
      "URL Vérification": `${window.location.origin}/vehicules/verify/${item.codeUnique || ''}`,
      "QR Code Image": generateQRCodeUrl(`${window.location.origin}/vehicules/verify/${item.codeUnique || ''}`),
      
      // MÉTADONNÉES
      "Créé Par": item.createdBy?.name || 'Système',
      "Statut": 'Actif'
    }
  })
}

// Fonction pour préparer les données des propriétaires pour l'export
export const prepareProprietaireDataForExport = (proprietaires: any[]): Array<{[key: string]: any}> => {
  return proprietaires.map((item) => ({
    // INFORMATIONS PERSONNELLES
    "Prénom": item.prenom || 'Non spécifié',
    "Nom": item.nom || 'Non spécifié',
    "Téléphone": item.telephone || 'Non spécifié',
    "Adresse": item.adresse || 'Non spécifiée',
    
    // PIÈCE D'IDENTITÉ (correction des noms de champs)
    "Type Pièce Identité": item.typePiece || 'Non spécifié',
    "Numéro Pièce Identité": item.numeroPiece || 'Non spécifié',
    "Lieu Délivrance": item.lieuDelivrance || 'Non spécifié',
    "Date Délivrance": item.dateDelivrance 
      ? new Date(item.dateDelivrance).toLocaleDateString("fr-FR")
      : 'Non spécifiée',
    
    // STATISTIQUES
    "Nombre de Véhicules": item._count?.vehicules || 0,
    "Nombre de Documents": item._count?.documents || 0,
    
    // MÉTADONNÉES
    "Date Création": item.createdAt ? new Date(item.createdAt).toLocaleDateString("fr-FR") : 'Non spécifiée',
    "Date Mise à Jour": item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("fr-FR") : 'Non spécifiée',
    "Créé Par": item.createdBy?.name || 'Système',
    "Statut": 'Actif'
  }))
}

// Fonction pour nettoyer les noms de feuilles Excel
const sanitizeSheetName = (name: string): string => {
  // Remplacer les caractères interdits : \ / ? * [ ]
  return name
    .replace(/[:\\\/\?\*\[\]]/g, '-')
    .substring(0, 31) // Excel limite les noms de feuilles à 31 caractères
    .trim()
}

// Fonction d'export Excel avancée avec formatage personnalisé
export const exportToExcelAdvanced = (data: Array<{[key: string]: any}>, filename: string, sheetName: string = 'Données') => {
  if (data.length === 0) {
    console.warn('Aucune donnée à exporter')
    return
  }

  // Nettoyer le nom de la feuille
  const cleanSheetName = sanitizeSheetName(sheetName)

  // Créer un nouveau classeur
  const workbook = XLSX.utils.book_new()
  
  // Convertir les données en feuille de calcul
  const worksheet = XLSX.utils.json_to_sheet(data)
  
  // Configuration des largeurs de colonnes automatiques
  const columnWidths = Object.keys(data[0]).map(key => {
    // Calculer la largeur maximale nécessaire pour cette colonne
    const headerLength = key.length
    const maxDataLength = Math.max(
      ...data.map(row => {
        const value = row[key]
        return value ? String(value).length : 0
      })
    )
    
    return {
      wch: Math.max(headerLength, Math.min(maxDataLength, 50)) // Maximum 50 caractères
    }
  })
  
  worksheet['!cols'] = columnWidths
  
  // Ajouter des styles pour l'en-tête (si supporté)
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  
  // Ajouter la feuille au classeur
  XLSX.utils.book_append_sheet(workbook, worksheet, cleanSheetName)
  
  // Générer et télécharger le fichier Excel
  try {
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      compression: true 
    })
    
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Nettoyer l'URL
      setTimeout(() => URL.revokeObjectURL(url), 100)
      
      console.log(`Fichier Excel exporté: ${filename}_${new Date().toISOString().split('T')[0]}.xlsx`)
    }
  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error)
    
    // Fallback vers CSV en cas d'erreur
    exportToCSV(data, filename)
  }
}

// Fonction de fallback pour export CSV (garde l'ancienne logique comme backup)
export const exportToCSV = (data: Array<{[key: string]: any}>, filename: string) => {
  const csvContent = convertToCSV(data)
  const BOM = '\uFEFF' // BOM UTF-8 pour Excel
  const finalContent = BOM + csvContent

  const blob = new Blob([finalContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }
}

// Export Excel avec plusieurs feuilles (véhicules + propriétaires + statistiques)
export const exportToExcelMultiSheet = (
  vehiculesData: Array<{[key: string]: any}>, 
  proprietairesData: Array<{[key: string]: any}>, 
  statistiques?: any
) => {
  try {
    // Créer un nouveau classeur
    const workbook = XLSX.utils.book_new()
    
    // Feuille 1: Véhicules
    if (vehiculesData.length > 0) {
      const vehiculesSheet = XLSX.utils.json_to_sheet(vehiculesData)
      
      // Largeurs de colonnes pour véhicules
      const vehiculeColumns = Object.keys(vehiculesData[0]).map(key => ({
        wch: Math.max(key.length, Math.min(
          Math.max(...vehiculesData.map(row => String(row[key] || '').length)), 
          50
        ))
      }))
      vehiculesSheet['!cols'] = vehiculeColumns
      
      XLSX.utils.book_append_sheet(workbook, vehiculesSheet, 'Véhicules')
    }
    
    // Feuille 2: Propriétaires
    if (proprietairesData.length > 0) {
      const proprietairesSheet = XLSX.utils.json_to_sheet(proprietairesData)
      
      // Largeurs de colonnes pour propriétaires
      const proprietaireColumns = Object.keys(proprietairesData[0]).map(key => ({
        wch: Math.max(key.length, Math.min(
          Math.max(...proprietairesData.map(row => String(row[key] || '').length)), 
          50
        ))
      }))
      proprietairesSheet['!cols'] = proprietaireColumns
      
      XLSX.utils.book_append_sheet(workbook, proprietairesSheet, 'Propriétaires')
    }
    
    // Feuille 3: Statistiques (si fournies)
    if (statistiques) {
      const statsData = [
        { 'Métrique': 'Total Véhicules', 'Valeur': vehiculesData.length },
        { 'Métrique': 'Total Propriétaires', 'Valeur': proprietairesData.length },
        { 'Métrique': 'Date Export', 'Valeur': new Date().toLocaleDateString('fr-FR') },
        { 'Métrique': 'Heure Export', 'Valeur': new Date().toLocaleTimeString('fr-FR') },
        ...Object.entries(statistiques).map(([key, value]) => ({
          'Métrique': key,
          'Valeur': value
        }))
      ]
      
      const statsSheet = XLSX.utils.json_to_sheet(statsData)
      statsSheet['!cols'] = [{ wch: 25 }, { wch: 20 }]
      
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistiques')
    }
    
    // Générer et télécharger
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      compression: true 
    })
    
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const filename = `rapport_complet_vehicules_${new Date().toISOString().split('T')[0]}.xlsx`
    
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setTimeout(() => URL.revokeObjectURL(url), 100)
      
      console.log(`Rapport Excel multi-feuilles exporté: ${filename}`)
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'export Excel multi-feuilles:', error)
  }
}

// Export spécialisé pour rapport de synthèse
export const exportSynthesisReport = (data: {
  vehicules: any[],
  proprietaires: any[],
  statistiques: any,
  periode?: { debut: string, fin: string }
}) => {
  const { vehicules, proprietaires, statistiques, periode } = data
  
  try {
    const workbook = XLSX.utils.book_new()
    
    // Page de couverture / Résumé exécutif
    const summaryData = [
      { 'Information': 'Rapport de Synthèse - Enregistrement Véhicules' },
      { 'Information': '' },
      { 'Information': `Date de génération: ${new Date().toLocaleDateString('fr-FR')}` },
      { 'Information': `Période analysée: ${periode?.debut || 'Début'} - ${periode?.fin || 'Aujourd\'hui'}` },
      { 'Information': '' },
      { 'Information': 'RÉSUMÉ EXÉCUTIF' },
      { 'Information': `Total véhicules enregistrés: ${vehicules.length}` },
      { 'Information': `Total propriétaires: ${proprietaires.length}` },
      { 'Information': `Revenus générés: ${formatPrice(statistiques.revenusTotal || 0)}` },
      { 'Information': '' },
      { 'Information': 'RÉPARTITION PAR TYPE DE VÉHICULE' },
      ...Object.entries(statistiques.repartitionTypes || {}).map(([type, count]) => ({
        'Information': `${type}: ${count}`
      }))
    ]
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData)
    summarySheet['!cols'] = [{ wch: 60 }]
    
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé')
    
    // Données détaillées véhicules
    if (vehicules.length > 0) {
      const vehiculesSheet = XLSX.utils.json_to_sheet(vehicules)
      vehiculesSheet['!cols'] = Object.keys(vehicules[0]).map(() => ({ wch: 18 }))
      XLSX.utils.book_append_sheet(workbook, vehiculesSheet, 'Détail Véhicules')
    }
    
    // Données détaillées propriétaires
    if (proprietaires.length > 0) {
      const proprietairesSheet = XLSX.utils.json_to_sheet(proprietaires)
      proprietairesSheet['!cols'] = Object.keys(proprietaires[0]).map(() => ({ wch: 18 }))
      XLSX.utils.book_append_sheet(workbook, proprietairesSheet, 'Détail Propriétaires')
    }
    
    // Téléchargement
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const filename = `synthese_vehicules_${new Date().toISOString().split('T')[0]}.xlsx`
    
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setTimeout(() => URL.revokeObjectURL(url), 100)
    
  } catch (error) {
    console.error('Erreur lors de l\'export du rapport de synthèse:', error)
  }
}

// Fonction de diagnostic pour vérifier la structure des données
export const diagnosticVehiculeData = (vehiculesWithProprietaires: any[]) => {
  console.log('🔍 DIAGNOSTIC DES DONNÉES VÉHICULES POUR EXPORT')
  console.log('Nombre de véhicules:', vehiculesWithProprietaires.length)
  
  if (vehiculesWithProprietaires.length > 0) {
    const sample = vehiculesWithProprietaires[0]
    console.log('📋 Échantillon de données:')
    console.log('- Véhicule ID:', sample.id)
    console.log('- Marque:', sample.marque)
    console.log('- Propriétaire présent:', !!sample.proprietaire)
    
    if (sample.proprietaire) {
      console.log('- Propriétaire nom:', sample.proprietaire.nom)
      console.log('- Propriétaire adresse:', sample.proprietaire.adresse)
      console.log('- Propriétaire typePiece:', sample.proprietaire.typePiece)
      console.log('- Propriétaire lieuDelivrance:', sample.proprietaire.lieuDelivrance)
      console.log('- Propriétaire dateDelivrance:', sample.proprietaire.dateDelivrance)
    }
    
    console.log('- Itinéraire présent:', !!sample.itineraire)
    if (sample.itineraire) {
      console.log('- Itinéraire nom:', sample.itineraire.nom)
    }
    
    console.log('📊 Structure complète du premier véhicule:')
    console.log(JSON.stringify(sample, null, 2))
  }
}

// Export Excel détaillé avec regroupement par catégories
export const exportToExcelDetailed = (vehiculesWithProprietaires: any[], filename: string) => {
  if (vehiculesWithProprietaires.length === 0) {
    console.warn('Aucune donnée à exporter')
    return
  }

  try {
    // Créer un nouveau classeur
    const workbook = XLSX.utils.book_new()
    
    // Données complètes pour la feuille principale
    const fullData = prepareVehiculeDataForExport(vehiculesWithProprietaires)
    
    // 1. Feuille principale avec toutes les données
    const mainSheet = XLSX.utils.json_to_sheet(fullData)
    
    // Largeurs de colonnes optimisées
    const mainColumnWidths = Object.keys(fullData[0] || {}).map(key => {
      const headerLength = key.length
      const maxDataLength = Math.max(
        ...fullData.map(row => {
          const value = row[key]
          return value ? String(value).length : 0
        })
      )
      return {
        wch: Math.max(headerLength + 2, Math.min(maxDataLength + 2, 60))
      }
    })
    
    mainSheet['!cols'] = mainColumnWidths
    XLSX.utils.book_append_sheet(workbook, mainSheet, 'Données Complètes')
    
    // 2. Feuille résumé propriétaires
    const proprietairesData = vehiculesWithProprietaires.map(item => ({
      "Nom Complet": `${item.proprietaire?.prenom || ''} ${item.proprietaire?.nom || ''}`.trim(),
      "Téléphone": item.proprietaire?.telephone || 'Non spécifié',
      "Adresse": item.proprietaire?.adresse || 'Non spécifiée',
      "Type Pièce": item.proprietaire?.typePiece || 'Non spécifié',
      "Numéro Pièce": item.proprietaire?.numeroPiece || 'Non spécifié',
      "Lieu Délivrance": item.proprietaire?.lieuDelivrance || 'Non spécifié',
      "Date Délivrance": item.proprietaire?.dateDelivrance 
        ? new Date(item.proprietaire.dateDelivrance).toLocaleDateString("fr-FR")
        : 'Non spécifiée',
      "Véhicule": `${item.marque || ''} ${item.modele || ''}`.trim(),
      "Immatriculation": item.numeroImmatriculation || 'Non spécifiée'
    }))
    
    const proprietairesSheet = XLSX.utils.json_to_sheet(proprietairesData)
    proprietairesSheet['!cols'] = Array(9).fill({ wch: 20 })
    XLSX.utils.book_append_sheet(workbook, proprietairesSheet, 'Propriétaires')
    
    // 3. Feuille itinéraires
    const itinerairesData = vehiculesWithProprietaires
      .filter(item => item.itineraire)
      .map(item => ({
        "Véhicule": `${item.marque || ''} ${item.modele || ''}`.trim(),
        "Immatriculation": item.numeroImmatriculation || 'Non spécifiée',
        "Propriétaire": `${item.proprietaire?.prenom || ''} ${item.proprietaire?.nom || ''}`.trim(),
        "Itinéraire": item.itineraire?.nom || 'Non spécifié'
      }))
    
    if (itinerairesData.length > 0) {
      const itinerairesSheet = XLSX.utils.json_to_sheet(itinerairesData)
      itinerairesSheet['!cols'] = Array(4).fill({ wch: 18 })
      XLSX.utils.book_append_sheet(workbook, itinerairesSheet, 'Itinéraires')
    }
    
    // 4. Feuille statistiques
    const stats = {
      "Total Véhicules": vehiculesWithProprietaires.length,
      "Propriétaires Avec Adresse": vehiculesWithProprietaires.filter(v => v.proprietaire?.adresse).length,
      "Véhicules Avec Itinéraire": vehiculesWithProprietaires.filter(v => v.itineraire).length,
      "Types de Pièces": [...new Set(vehiculesWithProprietaires.map(v => v.proprietaire?.typePiece).filter(Boolean))].length,
      "Types de Véhicules": [...new Set(vehiculesWithProprietaires.map(v => v.typeVehicule).filter(Boolean))].length,
      "Année Fabrication Min": Math.min(...vehiculesWithProprietaires.map(v => v.anneeFabrication || 9999).filter(y => y !== 9999)),
      "Année Fabrication Max": Math.max(...vehiculesWithProprietaires.map(v => v.anneeFabrication || 0)),
    }
    
    const statsData = Object.entries(stats).map(([key, value]) => ({
      "Statistique": key,
      "Valeur": value
    }))
    
    const statsSheet = XLSX.utils.json_to_sheet(statsData)
    statsSheet['!cols'] = [{ wch: 25 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistiques')
    
    // Générer et télécharger
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      compression: true 
    })
    
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}_détaillé_${new Date().toISOString().split('T')[0]}.xlsx`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setTimeout(() => URL.revokeObjectURL(url), 100)
      
      console.log(`✅ Fichier Excel détaillé exporté: ${filename}_détaillé_${new Date().toISOString().split('T')[0]}.xlsx`)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'export Excel détaillé:', error)
  }
}

// Export Excel spécifique pour un propriétaire et ses véhicules
export const exportProprietaireVehicules = (proprietaire: any, vehicules: any[]) => {
  console.log("🔍 Début de l'export Excel pour le propriétaire:", proprietaire.nom, proprietaire.prenom);
  
  try {
    // Créer un nouveau classeur
    const workbook = XLSX.utils.book_new()
    
    // Informations du propriétaire
    const proprietaireData = [
      { 'Champ': 'Nom', 'Valeur': proprietaire.nom },
      { 'Champ': 'Prénom', 'Valeur': proprietaire.prenom },
      { 'Champ': 'Adresse', 'Valeur': proprietaire.adresse },
      { 'Champ': 'Téléphone', 'Valeur': proprietaire.telephone },
      { 'Champ': 'Numéro de pièce', 'Valeur': proprietaire.numeroPiece },
      { 'Champ': 'Type de pièce', 'Valeur': mapTypePiece(proprietaire.typePiece) },
      { 'Champ': 'Lieu de délivrance', 'Valeur': proprietaire.lieuDelivrance },
      { 'Champ': 'Date de délivrance', 'Valeur': formatDate(proprietaire.dateDelivrance) },
      { 'Champ': 'Nombre de véhicules', 'Valeur': vehicules.length.toString() }
    ]

    const proprietaireSheet = XLSX.utils.json_to_sheet(proprietaireData)
    proprietaireSheet['!cols'] = [{ wch: 20 }, { wch: 30 }]
    XLSX.utils.book_append_sheet(workbook, proprietaireSheet, 'Propriétaire')

    // Ses véhicules
    if (vehicules.length > 0) {
      const vehiculesData = vehicules.map(v => ({
        'Code unique': v.codeUnique,
        'Marque': v.marque,
        'Modèle': v.modele,
        'Type': mapTypeVehicule(v.typeVehicule),
        'Immatriculation': v.numeroImmatriculation,
        'Châssis': v.numeroChassis,
        'Année fabr.': v.anneeFabrication,
        'Capacité': v.capaciteAssises,
        'Itinéraire': v.itineraire?.nom || 'Non défini',
        'Prix enreg.': `${v.prixEnregistrement?.toLocaleString() || 0} FCFA`,
        'Documents': v._count?.documents || 0,
        'Date création': formatDate(v.createdAt)
      }))

      const vehiculesSheet = XLSX.utils.json_to_sheet(vehiculesData)
      vehiculesSheet['!cols'] = Array(12).fill({ wch: 15 })
      XLSX.utils.book_append_sheet(workbook, vehiculesSheet, 'Véhicules')
    }

    // Générer et télécharger
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      compression: true 
    })
    
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const filename = `proprietaire_${proprietaire.nom}_${proprietaire.prenom}_vehicules_${new Date().toISOString().split('T')[0]}.xlsx`
    
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setTimeout(() => URL.revokeObjectURL(url), 100)
      
      console.log(`✅ Export terminé pour le propriétaire ${proprietaire.nom} ${proprietaire.prenom} avec ${vehicules.length} véhicule(s)`)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'export Excel du propriétaire:', error)
  }
}

// Export Excel avancé avec images QR (nécessite ExcelJS)
export const exportToExcelWithQRImages = async (vehiculesWithProprietaires: any[], filename: string) => {
  if (vehiculesWithProprietaires.length === 0) {
    console.warn('Aucune donnée à exporter')
    return
  }

  try {
    // Dynamically import ExcelJS only when needed
    const ExcelJS = await import('exceljs');
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Système d\'enregistrement des véhicules';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Véhicules avec QR Codes');

    // Définir les colonnes
    worksheet.columns = [
      { header: 'Code Unique', key: 'codeUnique', width: 15 },
      { header: 'Marque', key: 'marque', width: 15 },
      { header: 'Modèle', key: 'modele', width: 15 },
      { header: 'Propriétaire', key: 'proprietaire', width: 25 },
      { header: 'Immatriculation', key: 'immatriculation', width: 18 },
      { header: 'URL Vérification', key: 'urlVerification', width: 50 },
      { header: 'QR Code', key: 'qrCode', width: 20 }
    ];

    // Styliser l'en-tête
    worksheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Ajouter les données
    for (let i = 0; i < vehiculesWithProprietaires.length; i++) {
      const item = vehiculesWithProprietaires[i];
      const rowIndex = i + 2; // +2 car la ligne 1 est l'en-tête
      
      const urlVerification = `${window.location.origin}/vehicules/verify/${item.codeUnique || ''}`;
      const qrCodeUrl = generateQRCodeUrl(urlVerification, 100);

      // Ajouter les données de base
      worksheet.addRow({
        codeUnique: item.codeUnique || 'Non généré',
        marque: item.marque || 'Non spécifiée',
        modele: item.modele || 'Non spécifié',
        proprietaire: `${item.proprietaire?.prenom || ''} ${item.proprietaire?.nom || ''}`.trim() || 'Non spécifié',
        immatriculation: item.numeroImmatriculation || 'Non spécifiée',
        urlVerification: urlVerification,
        qrCode: `=HYPERLINK("${qrCodeUrl}", "QR Code")`
      });

      // Ajuster la hauteur de la ligne pour les QR codes
      worksheet.getRow(rowIndex).height = 60;
    }

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      if (column && column.key !== 'qrCode') {
        let maxLength = 0;
        column.eachCell?.({ includeEmpty: true }, cell => {
          if (cell.value && cell.value.toString().length > maxLength) {
            maxLength = cell.value.toString().length;
          }
        });
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      }
    });

    // Générer le fichier
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_avec_qr_${new Date().toISOString().split('T')[0]}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 100);

    console.log('✅ Export Excel avec QR codes terminé');

  } catch (error) {
    console.error('❌ Erreur lors de l\'export Excel avec QR codes:', error);
    
    // Fallback vers l'export standard
    console.log('📋 Utilisation de l\'export standard comme fallback...');
    const data = prepareVehiculeDataForExport(vehiculesWithProprietaires);
    exportToExcel(data, filename);
  }
};

// Export Excel pour les véhicules créés aujourd'hui
export const exportVehiculesToday = (vehiculesWithProprietaires: any[], filename?: string) => {
  const todayVehicules = filterDataByDate(vehiculesWithProprietaires, 'createdAt', { type: 'today' })
  const finalFilename = filename || `vehicules_${new Date().toISOString().split('T')[0]}`
  
  console.log(`📅 Export des véhicules d'aujourd'hui: ${todayVehicules.length} véhicule(s) trouvé(s)`)
  
  if (todayVehicules.length === 0) {
    console.warn('Aucun véhicule créé aujourd\'hui')
    return
  }
  
  const data = prepareVehiculeDataForExport(todayVehicules)
  exportToExcelAdvanced(data, finalFilename, `Véhicules du ${new Date().toLocaleDateString('fr-FR')}`)
}

// Export Excel pour les véhicules d'une date spécifique
export const exportVehiculesForSpecificDate = (
  vehiculesWithProprietaires: any[], 
  targetDate: string, 
  filename?: string
) => {
  const specificDateVehicules = filterDataByDate(vehiculesWithProprietaires, 'createdAt', { 
    type: 'specific', 
    specificDate: targetDate 
  })
  
  const dateStr = new Date(targetDate).toLocaleDateString('fr-FR')
  const finalFilename = filename || `vehicules_${targetDate}`
  
  console.log(`📅 Export des véhicules du ${dateStr}: ${specificDateVehicules.length} véhicule(s) trouvé(s)`)
  
  if (specificDateVehicules.length === 0) {
    console.warn(`Aucun véhicule créé le ${dateStr}`)
    return
  }
  
  const data = prepareVehiculeDataForExport(specificDateVehicules)
  exportToExcelAdvanced(data, finalFilename, `Véhicules du ${dateStr}`)
}

// Export Excel pour une période donnée
export const exportVehiculesForDateRange = (
  vehiculesWithProprietaires: any[], 
  startDate: string, 
  endDate: string, 
  filename?: string
) => {
  const rangeVehicules = filterDataByDate(vehiculesWithProprietaires, 'createdAt', { 
    type: 'range', 
    startDate, 
    endDate 
  })
  
  const startDateStr = new Date(startDate).toLocaleDateString('fr-FR')
  const endDateStr = new Date(endDate).toLocaleDateString('fr-FR')
  const finalFilename = filename || `vehicules_${startDate}_${endDate}`
  
  console.log(`📅 Export des véhicules du ${startDateStr} au ${endDateStr}: ${rangeVehicules.length} véhicule(s) trouvé(s)`)
  
  if (rangeVehicules.length === 0) {
    console.warn(`Aucun véhicule créé entre le ${startDateStr} et le ${endDateStr}`)
    return
  }
  
  const data = prepareVehiculeDataForExport(rangeVehicules)
  exportToExcelAdvanced(data, finalFilename, `Véhicules ${startDateStr} - ${endDateStr}`)
}

// Export Excel multi-feuilles avec filtres par date
export const exportVehiculesMultiSheetByDate = (
  vehiculesWithProprietaires: any[], 
  proprietaires: any[],
  options: {
    includeToday?: boolean,
    includeWeek?: boolean,
    includeMonth?: boolean,
    customDateRange?: { start: string, end: string }
  } = {}
) => {
  try {
    const workbook = XLSX.utils.book_new()
    const today = new Date()
    
    // Feuille 1: Tous les véhicules
    if (vehiculesWithProprietaires.length > 0) {
      const allVehiculesData = prepareVehiculeDataForExport(vehiculesWithProprietaires)
      const allSheet = XLSX.utils.json_to_sheet(allVehiculesData)
      allSheet['!cols'] = Object.keys(allVehiculesData[0]).map(() => ({ wch: 18 }))
      XLSX.utils.book_append_sheet(workbook, allSheet, 'Tous les véhicules')
    }
    
    // Feuille 2: Véhicules d'aujourd'hui
    if (options.includeToday !== false) {
      const todayVehicules = filterDataByDate(vehiculesWithProprietaires, 'createdAt', { type: 'today' })
      if (todayVehicules.length > 0) {
        const todayData = prepareVehiculeDataForExport(todayVehicules)
        const todaySheet = XLSX.utils.json_to_sheet(todayData)
        todaySheet['!cols'] = Object.keys(todayData[0]).map(() => ({ wch: 18 }))
        XLSX.utils.book_append_sheet(workbook, todaySheet, `Aujourd'hui (${todayVehicules.length})`)
      }
    }
    
    // Feuille 3: Véhicules de cette semaine
    if (options.includeWeek !== false) {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay()) // Début de semaine (dimanche)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6) // Fin de semaine (samedi)
      
      const weekVehicules = filterDataByDate(vehiculesWithProprietaires, 'createdAt', { 
        type: 'range', 
        startDate: weekStart.toISOString().split('T')[0], 
        endDate: weekEnd.toISOString().split('T')[0] 
      })
      
      if (weekVehicules.length > 0) {
        const weekData = prepareVehiculeDataForExport(weekVehicules)
        const weekSheet = XLSX.utils.json_to_sheet(weekData)
        weekSheet['!cols'] = Object.keys(weekData[0]).map(() => ({ wch: 18 }))
        XLSX.utils.book_append_sheet(workbook, weekSheet, `Cette semaine (${weekVehicules.length})`)
      }
    }
    
    // Feuille 4: Véhicules de ce mois
    if (options.includeMonth !== false) {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      
      const monthVehicules = filterDataByDate(vehiculesWithProprietaires, 'createdAt', { 
        type: 'range', 
        startDate: monthStart.toISOString().split('T')[0], 
        endDate: monthEnd.toISOString().split('T')[0] 
      })
      
      if (monthVehicules.length > 0) {
        const monthData = prepareVehiculeDataForExport(monthVehicules)
        const monthSheet = XLSX.utils.json_to_sheet(monthData)
        monthSheet['!cols'] = Object.keys(monthData[0]).map(() => ({ wch: 18 }))
        XLSX.utils.book_append_sheet(workbook, monthSheet, `Ce mois (${monthVehicules.length})`)
      }
    }
    
    // Feuille 5: Période personnalisée
    if (options.customDateRange) {
      const customVehicules = filterDataByDate(vehiculesWithProprietaires, 'createdAt', { 
        type: 'range', 
        startDate: options.customDateRange.start, 
        endDate: options.customDateRange.end 
      })
      
      if (customVehicules.length > 0) {
        const customData = prepareVehiculeDataForExport(customVehicules)
        const customSheet = XLSX.utils.json_to_sheet(customData)
        customSheet['!cols'] = Object.keys(customData[0]).map(() => ({ wch: 18 }))
        
        const startDateStr = new Date(options.customDateRange.start).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
        const endDateStr = new Date(options.customDateRange.end).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
        XLSX.utils.book_append_sheet(workbook, customSheet, sanitizeSheetName(`${startDateStr}-${endDateStr} (${customVehicules.length})`))
      }
    }
    
    // Feuille statistiques par date
    const statsData = [
      { 'Période': 'Total général', 'Nombre': vehiculesWithProprietaires.length },
      { 'Période': 'Aujourd\'hui', 'Nombre': filterDataByDate(vehiculesWithProprietaires, 'createdAt', { type: 'today' }).length },
      { 'Période': 'Cette semaine', 'Nombre': filterDataByDate(vehiculesWithProprietaires, 'createdAt', { 
        type: 'range', 
        startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
        endDate: today.toISOString().split('T')[0] 
      }).length },
      { 'Période': 'Ce mois', 'Nombre': filterDataByDate(vehiculesWithProprietaires, 'createdAt', { 
        type: 'range', 
        startDate: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0], 
        endDate: today.toISOString().split('T')[0] 
      }).length },
      { 'Période': 'Date génération', 'Nombre': new Date().toLocaleDateString('fr-FR') }
    ]
    
    const statsSheet = XLSX.utils.json_to_sheet(statsData)
    statsSheet['!cols'] = [{ wch: 20 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistiques')
    
    // Générer et télécharger
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      compression: true 
    })
    
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const filename = `vehicules_par_periode_${today.toISOString().split('T')[0]}.xlsx`
    
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setTimeout(() => URL.revokeObjectURL(url), 100)
      
      console.log(`✅ Rapport Excel multi-périodes exporté: ${filename}`)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'export Excel multi-périodes:', error)
  }
}

// Fonction de rapport quotidien automatisé
export const generateDailyReport = (vehiculesWithProprietaires: any[], proprietaires: any[]) => {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const todayDisplay = today.toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  
  try {
    const workbook = XLSX.utils.book_new()
    
    // Filtrer les données d'aujourd'hui
    const todayVehicules = filterDataByDate(vehiculesWithProprietaires, 'createdAt', { type: 'today' })
    const todayProprietaires = filterDataByDate(proprietaires, 'createdAt', { type: 'today' })
    
    // Page de résumé du jour
    const summaryData = [
      { 'Information': `RAPPORT QUOTIDIEN - ${todayDisplay}` },
      { 'Information': '' },
      { 'Information': 'RÉSUMÉ DU JOUR' },
      { 'Information': `Nouveaux véhicules enregistrés: ${todayVehicules.length}` },
      { 'Information': `Nouveaux propriétaires: ${todayProprietaires.length}` },
      { 'Information': `Revenus générés: ${formatPrice(todayVehicules.reduce((sum, v) => sum + (v.prixEnregistrement || 0), 0))}` },
      { 'Information': '' },
      { 'Information': 'STATISTIQUES CUMULÉES' },
      { 'Information': `Total véhicules: ${vehiculesWithProprietaires.length}` },
      { 'Information': `Total propriétaires: ${proprietaires.length}` },
      { 'Information': '' },
      { 'Information': 'RÉPARTITION PAR TYPE (AUJOURD\'HUI)' },
      ...Object.entries(
        todayVehicules.reduce((acc: any, v) => {
          const type = mapTypeVehicule(v.typeVehicule)
          acc[type] = (acc[type] || 0) + 1
          return acc
        }, {})
      ).map(([type, count]) => ({
        'Information': `${type}: ${count}`
      }))
    ]
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData)
    summarySheet['!cols'] = [{ wch: 60 }]
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé du jour')
    
    // Détail des véhicules d'aujourd'hui
    if (todayVehicules.length > 0) {
      const vehiculesData = prepareVehiculeDataForExport(todayVehicules)
      const vehiculesSheet = XLSX.utils.json_to_sheet(vehiculesData)
      vehiculesSheet['!cols'] = Object.keys(vehiculesData[0]).map(() => ({ wch: 18 }))
      XLSX.utils.book_append_sheet(workbook, vehiculesSheet, `Véhicules (${todayVehicules.length})`)
    }
    
    // Détail des propriétaires d'aujourd'hui
    if (todayProprietaires.length > 0) {
      const proprietairesData = prepareProprietaireDataForExport(todayProprietaires)
      const proprietairesSheet = XLSX.utils.json_to_sheet(proprietairesData)
      proprietairesSheet['!cols'] = Object.keys(proprietairesData[0]).map(() => ({ wch: 20 }))
      XLSX.utils.book_append_sheet(workbook, proprietairesSheet, `Propriétaires (${todayProprietaires.length})`)
    }
    
    // Comparaison avec les jours précédents
    const comparaisonData = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayVehicules = filterDataByDate(vehiculesWithProprietaires, 'createdAt', { 
        type: 'specific', 
        specificDate: dateStr 
      })
      
      comparaisonData.push({
        'Date': date.toLocaleDateString('fr-FR'),
        'Jour': date.toLocaleDateString('fr-FR', { weekday: 'long' }),
        'Véhicules': dayVehicules.length,
        'Revenus': `${dayVehicules.reduce((sum, v) => sum + (v.prixEnregistrement || 0), 0).toLocaleString()} FCFA`
      })
    }
    
    const comparaisonSheet = XLSX.utils.json_to_sheet(comparaisonData)
    comparaisonSheet['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(workbook, comparaisonSheet, '7 derniers jours')
    
    // Générer et télécharger
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      compression: true 
    })
    
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const filename = `rapport_quotidien_${todayStr}.xlsx`
    
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setTimeout(() => URL.revokeObjectURL(url), 100)
      
      console.log(`✅ Rapport quotidien généré: ${filename}`)
      console.log(`📊 Véhicules aujourd'hui: ${todayVehicules.length}`)
      console.log(`👥 Propriétaires aujourd'hui: ${todayProprietaires.length}`)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération du rapport quotidien:', error)
  }
}

// Fonction pour obtenir les statistiques des créations par jour
export const getDailyCreationStats = (vehiculesWithProprietaires: any[], days: number = 30) => {
  const stats = []
  const today = new Date()
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const dayVehicules = filterDataByDate(vehiculesWithProprietaires, 'createdAt', { 
      type: 'specific', 
      specificDate: dateStr 
    })
    
    stats.push({
      date: dateStr,
      dateDisplay: date.toLocaleDateString('fr-FR'),
      dayName: date.toLocaleDateString('fr-FR', { weekday: 'long' }),
      vehicleCount: dayVehicules.length,
      revenue: dayVehicules.reduce((sum, v) => sum + (v.prixEnregistrement || 0), 0)
    })
  }
  
  return stats.reverse() // Plus ancien en premier
}
