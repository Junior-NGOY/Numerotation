// Export Excel avec la bibliothèque xlsx
import * as XLSX from 'xlsx'
import { generateVehicleQRData } from './qr-generator'
import { formatPrice, getVehicleTypeDescription } from './pricing-utils'

export const exportToExcel = (data: any[], filename: string) => {
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

const convertToCSV = (data: any[]): string => {
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

export const prepareVehiculeDataForExport = (vehiculesWithProprietaires: any[]) => {
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
      
      // ITINÉRAIRE (correction du nom de champ)
      "Itinéraire": item.itineraire?.nom || item.itineraire?.pointDepart 
        ? `${item.itineraire.pointDepart} → ${item.itineraire.pointArrivee}`
        : 'Non spécifié',
      "Point Départ": item.itineraire?.pointDepart || 'Non spécifié',
      "Point Arrivée": item.itineraire?.pointArrivee || 'Non spécifié',
      "Date Départ": item.itineraire?.dateDepart 
        ? new Date(item.itineraire.dateDepart).toLocaleDateString("fr-FR")
        : 'Non spécifiée',
      "Heure Départ": item.itineraire?.heureDepart || 'Non spécifiée',
      
      // INFORMATIONS ADMINISTRATIVES
      "Code Unique": item.codeUnique || 'Non généré',
      "Prix Enregistrement": formatPrice(item.prixEnregistrement || 0),
      "Année Enregistrement": item.anneeEnregistrement || new Date().getFullYear(),
      "Date Création": item.createdAt ? new Date(item.createdAt).toLocaleDateString("fr-FR") : 'Non spécifiée',
      "Date Mise à Jour": item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("fr-FR") : 'Non spécifiée',
      
      // DONNÉES QR CODE
      "Données QR Code": qrData,
      "URL Vérification": `${window.location.origin}/vehicules/verify/${item.codeUnique || ''}`,
      
      // MÉTADONNÉES
      "Créé Par": item.createdBy?.name || 'Système',
      "Statut": 'Actif'
    }
  })
}

// Fonction pour préparer les données des propriétaires pour l'export
export const prepareProprietaireDataForExport = (proprietaires: any[]) => {
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

// Fonction d'export Excel avancée avec formatage personnalisé
export const exportToExcelAdvanced = (data: any[], filename: string, sheetName: string = 'Données') => {
  if (data.length === 0) {
    console.warn('Aucune donnée à exporter')
    return
  }

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
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  
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
export const exportToCSV = (data: any[], filename: string) => {
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
  vehiculesData: any[], 
  proprietairesData: any[], 
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
      console.log('- Itinéraire pointDepart:', sample.itineraire.pointDepart)
      console.log('- Itinéraire pointArrivee:', sample.itineraire.pointArrivee)
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
    const mainColumnWidths = Object.keys(fullData[0]).map(key => {
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
        "Itinéraire": item.itineraire?.nom || 'Non spécifié',
        "Point Départ": item.itineraire?.pointDepart || 'Non spécifié',
        "Point Arrivée": item.itineraire?.pointArrivee || 'Non spécifié',
        "Date Départ": item.itineraire?.dateDepart 
          ? new Date(item.itineraire.dateDepart).toLocaleDateString("fr-FR")
          : 'Non spécifiée',
        "Heure Départ": item.itineraire?.heureDepart || 'Non spécifiée'
      }))
    
    if (itinerairesData.length > 0) {
      const itinerairesSheet = XLSX.utils.json_to_sheet(itinerairesData)
      itinerairesSheet['!cols'] = Array(8).fill({ wch: 18 })
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
