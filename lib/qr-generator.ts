import QRCode from 'qrcode'
import jsPDF from 'jspdf'
import { Vehicule } from '@/types/api'

/**
 * Génère un QR code sous forme de data URL
 * @param data - Les données à encoder dans le QR code
 * @returns Promise<string> - Data URL du QR code généré
 */
export async function generateQRCode(data: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    return qrCodeDataURL
  } catch (error) {
    console.error('Erreur lors de la génération du QR code:', error)
    throw new Error('Impossible de générer le QR code')
  }
}

/**
 * Génère les données JSON pour le QR code d'un véhicule
 * @param vehicule - Les données du véhicule
 * @returns string - JSON string à encoder dans le QR code
 */
export function generateVehicleQRData(vehicule: Vehicule): string {
  const qrData = {
    id: vehicule.id,
    codeUnique: vehicule.codeUnique,
    numeroImmatriculation: vehicule.numeroImmatriculation,
    typeVehicule: vehicule.typeVehicule,
    marque: vehicule.marque,
    modele: vehicule.modele,
    anneeEnregistrement: vehicule.anneeEnregistrement,
    dateCreation: new Date().toISOString()
  }
  
  return JSON.stringify(qrData)
}

/**
 * Génère une étiquette PDF avec QR code intégré
 * @param vehicule - Les données du véhicule
 * @returns Promise<void> - Télécharge automatiquement le PDF
 */
export async function generateQRLabel(vehicule: Vehicule): Promise<void> {
  try {
    // Générer les données QR
    const qrData = generateVehicleQRData(vehicule)
    const qrCodeDataURL = await generateQRCode(qrData)
    
    // Créer le PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    
    // Configuration des styles
    doc.setFontSize(18)
    doc.setTextColor(40, 40, 40)
    
    // Titre principal
    doc.text('TRANSPORT PUBLIC', 105, 30, { align: 'center' })
    doc.setFontSize(14)
    doc.text('Véhicule Enregistré', 105, 40, { align: 'center' })
    
    // Ligne de séparation
    doc.setLineWidth(0.5)
    doc.line(30, 45, 180, 45)
    
    // QR Code centré
    const qrSize = 60
    const qrX = (210 - qrSize) / 2 // Centrer horizontalement sur A4
    const qrY = 60
    
    doc.addImage(qrCodeDataURL, 'PNG', qrX, qrY, qrSize, qrSize)
    
    // Informations du véhicule sous le QR code
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text(vehicule.numeroImmatriculation, 105, qrY + qrSize + 20, { align: 'center' })
    
    doc.setFontSize(12)
    doc.text(`${vehicule.marque} ${vehicule.modele}`, 105, qrY + qrSize + 30, { align: 'center' })
    doc.text(`Type: ${vehicule.typeVehicule}`, 105, qrY + qrSize + 40, { align: 'center' })
    doc.text(`Année: ${vehicule.anneeEnregistrement}`, 105, qrY + qrSize + 50, { align: 'center' })
    
    // Code unique
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Code: ${vehicule.codeUnique}`, 105, qrY + qrSize + 65, { align: 'center' })
      // Informations de génération
    doc.setFontSize(8)
    doc.text(`Enregistré le ${new Date().toLocaleDateString("fr-FR")}`, 105, qrY + qrSize + 85, { align: 'center' })
    doc.text('Système d\'Enregistrement des Véhicules', 105, qrY + qrSize + 95, { align: 'center' })
    
    // Cadre décoratif
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(1)
    doc.rect(20, 20, 170, qrY + qrSize + 90)    // Ajouter le filigrane "ENREGISTREMENT"
    doc.saveGraphicsState()
    doc.setTextColor(235, 235, 235) // Couleur grise pâle mais visible
    doc.setFontSize(30) // Taille adaptée pour l'étiquette
    
    // Calculer la position pour centrer le filigrane
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    
    // Rotation et positionnement du filigrane
    doc.text('ENREGISTREMENT', pageWidth / 2, pageHeight / 2, {
      angle: -45, // Rotation de 45 degrés
      align: 'center'
    })
    
    doc.restoreGraphicsState()
    
    // Télécharger le PDF
    const fileName = `etiquette_qr_${vehicule.numeroImmatriculation}_${new Date().toISOString().split("T")[0]}.pdf`
    doc.save(fileName)
    
  } catch (error) {
    console.error('Erreur lors de la génération de l\'étiquette QR:', error)
    throw new Error('Impossible de générer l\'étiquette QR')
  }
}

/**
 * Génère un QR code pour affichage dans le navigateur
 * @param vehicule - Les données du véhicule
 * @returns Promise<string> - Data URL du QR code pour affichage
 */
export async function generateVehicleQRPreview(vehicule: Vehicule): Promise<string> {
  const qrData = generateVehicleQRData(vehicule)
  return generateQRCode(qrData)
}

// Utilitaires pour la génération de QR codes
export const generateQRCodeUrl = (data: string, size: number = 150): string => {
  const encodedData = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}`;
};

export const generateQRCodeForVehicule = (vehicule: any): string => {
  // Créer une URL vers le détail du véhicule ou utiliser le code unique
  const vehiculeUrl = `${window.location.origin}/vehicules/${vehicule.id}`;
  return generateQRCodeUrl(vehiculeUrl);
};

export const generateQRCodeForDocument = (documentUrl: string): string => {
  return generateQRCodeUrl(documentUrl);
};
