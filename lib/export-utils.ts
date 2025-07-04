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

// Interface pour les données de statistiques d'export
export interface DashboardExportData {
  stats: {
    totalVehicules: number;
    totalProprietaires: number;
    totalUtilisateurs: number;
    totalDocuments: number;
    revenusTotal: number;
  };
  vehicleStats: Array<{
    category: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  revenueEvolution: Array<{
    date: string;
    total: number;
    Bus: number;
    'Mini Bus': number;
    Taxi: number;
  }>;
  period: 'day' | 'week' | 'month';
  generatedAt: string;
}

// Exporter les statistiques au format Excel
export const exportStatisticsToExcel = async (data: DashboardExportData) => {
  try {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    
    // Informations du classeur
    workbook.creator = 'Vehicle Registration System';
    workbook.created = new Date();
    
    // 1. Feuille de résumé
    const summarySheet = workbook.addWorksheet('Résumé');
    summarySheet.addRow(['STATISTIQUES GÉNÉRALES - ' + getPeriodLabel(data.period).toUpperCase()]);
    summarySheet.addRow(['Généré le:', data.generatedAt]);
    summarySheet.addRow([]);
    
    summarySheet.addRow(['Indicateurs clés', 'Valeur']);
    summarySheet.addRow(['Total véhicules', data.stats.totalVehicules]);
    summarySheet.addRow(['Total propriétaires', data.stats.totalProprietaires]);
    summarySheet.addRow(['Total utilisateurs', data.stats.totalUtilisateurs]);
    summarySheet.addRow(['Total documents', data.stats.totalDocuments]);
    summarySheet.addRow(['Revenus total', formatPrice(data.stats.revenusTotal)]);
    
    // Style pour l'en-tête
    summarySheet.getRow(1).font = { bold: true, size: 14 };
    summarySheet.getRow(4).font = { bold: true };
    
    // 2. Feuille des statistiques par type de véhicule
    const vehicleSheet = workbook.addWorksheet('Véhicules par type');
    vehicleSheet.addRow(['RÉPARTITION PAR TYPE DE VÉHICULE']);
    vehicleSheet.addRow([]);
    vehicleSheet.addRow(['Type', 'Nombre', 'Revenus', 'Pourcentage']);
    
    data.vehicleStats.forEach(stat => {
      vehicleSheet.addRow([
        stat.category,
        stat.count,
        formatPrice(stat.revenue),
        `${stat.percentage.toFixed(1)}%`
      ]);
    });
    
    vehicleSheet.getRow(1).font = { bold: true, size: 14 };
    vehicleSheet.getRow(3).font = { bold: true };
    
    // 3. Feuille de l'évolution des revenus
    const revenueSheet = workbook.addWorksheet('Évolution revenus');
    revenueSheet.addRow(['ÉVOLUTION DES REVENUS']);
    revenueSheet.addRow([]);
    revenueSheet.addRow(['Date', 'Total', 'Bus', 'Mini Bus', 'Taxi']);
    
    data.revenueEvolution.forEach(item => {
      revenueSheet.addRow([
        item.date,
        formatPrice(item.total),
        formatPrice(item.Bus),
        formatPrice(item['Mini Bus']),
        formatPrice(item.Taxi)
      ]);
    });
    
    revenueSheet.getRow(1).font = { bold: true, size: 14 };
    revenueSheet.getRow(3).font = { bold: true };
    
    // Ajuster la largeur des colonnes
    [summarySheet, vehicleSheet, revenueSheet].forEach(sheet => {
      sheet.columns.forEach(column => {
        column.width = 20;
      });
    });
    
    // Télécharger le fichier
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const filename = generateExportFilename('statistiques', {
      period: data.period,
      format: 'excel'
    });
    
    downloadFile(blob, `${filename}.xlsx`);
    
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error);
    return { success: false, error: 'Erreur lors de la génération du fichier Excel' };
  }
};

// Exporter les statistiques au format PDF
export const exportStatisticsToPDF = async (data: DashboardExportData) => {
  try {
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF();
    let yPosition = 20;
    
    // En-tête du document
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Statistiques du Système d\'Enregistrement', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Période: ${getPeriodLabel(data.period)}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Généré le: ${data.generatedAt}`, 20, yPosition);
    yPosition += 20;
    
    // 1. Statistiques générales
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Résumé général', 20, yPosition);
    yPosition += 10;
    
    const generalStats = [
      ['Total véhicules', data.stats.totalVehicules.toString()],
      ['Total propriétaires', data.stats.totalProprietaires.toString()],
      ['Total utilisateurs', data.stats.totalUtilisateurs.toString()],
      ['Total documents', data.stats.totalDocuments.toString()],
      ['Revenus total', formatPrice(data.stats.revenusTotal)]
    ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Indicateur', 'Valeur']],
      body: generalStats,
      margin: { left: 20 },
      styles: { fontSize: 10 }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 20;
    
    // 2. Répartition par type de véhicule
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Répartition par type de véhicule', 20, yPosition);
    yPosition += 10;
    
    const vehicleStatsData = data.vehicleStats.map(stat => [
      stat.category,
      stat.count.toString(),
      formatPrice(stat.revenue),
      `${stat.percentage.toFixed(1)}%`
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Type', 'Nombre', 'Revenus', 'Pourcentage']],
      body: vehicleStatsData,
      margin: { left: 20 },
      styles: { fontSize: 10 }
    });
    
    // Nouvelle page pour l'évolution des revenus si nécessaire
    if ((doc as any).lastAutoTable.finalY > 250) {
      doc.addPage();
      yPosition = 20;
    } else {
      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }
    
    // 3. Évolution des revenus
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Évolution des revenus', 20, yPosition);
    yPosition += 10;
    
    const revenueData = data.revenueEvolution.slice(0, 10).map(item => [
      item.date,
      formatPrice(item.total),
      formatPrice(item.Bus),
      formatPrice(item['Mini Bus']),
      formatPrice(item.Taxi)
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Total', 'Bus', 'Mini Bus', 'Taxi']],
      body: revenueData,
      margin: { left: 20 },
      styles: { fontSize: 10 }
    });
    
    // Télécharger le PDF
    const filename = generateExportFilename('statistiques', {
      period: data.period,
      format: 'pdf'
    });
    
    doc.save(`${filename}.pdf`);
    
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error);
    return { success: false, error: 'Erreur lors de la génération du fichier PDF' };
  }
};

// Fonction utilitaire pour obtenir le label de la période
const getPeriodLabel = (period: 'day' | 'week' | 'month'): string => {
  switch (period) {
    case 'day': return 'Journalier';
    case 'week': return 'Hebdomadaire';
    case 'month': return 'Mensuel';
    default: return 'Inconnu';
  }
};

// Générer un nom de fichier pour les exports de statistiques
const generateExportFilename = (type: string, options: { 
  period?: string; 
  format?: string; 
}): string => {
  const today = new Date().toISOString().split('T')[0];
  let filename = `${type}_${options.period || 'general'}_${today}`;
  
  if (options.format) {
    filename += `_${options.format}`;
  }
  
  return filename;
};

// Fonction utilitaire pour télécharger un fichier
const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
