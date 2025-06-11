import jsPDF from 'jspdf'
import { generateQRCode, generateVehicleQRData } from './qr-generator'
import { formatPrice, getVehicleTypeDescription } from './pricing-utils'

interface VehicleRegistration {
  id?: string
  proprietaire: {
    nom: string
    prenom: string
    adresse: string
    telephone: string
    numeroPieceIdentite: string
    typePieceIdentite: string
  }
  vehicule: {
    marque: string
    modele: string
    annee: number
    couleur: string
    numeroChassis: string
    numeroMoteur: string
    typeCarburant: string
    nombrePlaces: number
    usageVehicule: string
    puissanceFiscale: number
  }
  immatriculation: {
    numeroImmatriculation: string
    dateImmatriculation: string
    prefixe: string
    numeroSerie: string
  }
  itineraire?: {
    pointDepart: string
    pointArrivee: string
    dateDepart: string
    heureDepart: string
  }
}

// Fonction utilitaire pour charger une image et la convertir en base64
const loadImageAsBase64 = (imagePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      canvas.width = img.width
      canvas.height = img.height
      
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        const dataURL = canvas.toDataURL('image/jpeg', 0.9)
        resolve(dataURL)
      } else {
        reject(new Error('Impossible de créer le contexte canvas'))
      }
    }
    
    img.onerror = () => {
      reject(new Error(`Impossible de charger l'image: ${imagePath}`))
    }
    
    img.src = imagePath
  })
}

// Générateur PDF professionnel avec logos administratifs RDC
export const generateVehiclePDF = async (vehiculeData: any, proprietaireData: any) => {
  const doc = new jsPDF()
  
  // Charger les logos avec gestion d'erreurs
  let logoSIDDataURL: string | null = null
  let logoMairieDataURL: string | null = null
  
  try {
    logoSIDDataURL = await loadImageAsBase64('/logo-sid.jpeg')
    console.log('✅ Logo SID chargé')
  } catch (error) {
    console.warn('⚠️ Logo SID non disponible:', error)
  }
  
  try {
    logoMairieDataURL = await loadImageAsBase64('/logo-mairie.png')
    console.log('✅ Logo Mairie chargé')
  } catch (error) {
    console.warn('⚠️ Logo Mairie non disponible:', error)
  }
  
  // Générer le QR code pour le véhicule
  const qrData = generateVehicleQRData(vehiculeData)
  const qrCodeDataURL = await generateQRCode(qrData)
    // Configuration des dimensions
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // FILIGRANE EN ARRIÈRE-PLAN
  doc.saveGraphicsState()
  doc.setTextColor(248, 248, 248) // Couleur très pâle
  doc.setFontSize(70)
  doc.text('NUMEROTATION', pageWidth / 2, pageHeight / 2, {
    angle: 45,
    align: 'center'
  })
  doc.restoreGraphicsState()
  
  // === EN-TÊTE OFFICIEL ===
  const headerHeight = 70
  
  // Arrière-plan subtil pour l'en-tête
  doc.setFillColor(250, 250, 250)
  doc.rect(0, 0, pageWidth, headerHeight, 'F')
  
  // PARTIE GAUCHE - République + Province + Mairie
  const leftStartX = 15
  
  // Informations officielles du gouvernement
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('RÉPUBLIQUE DÉMOCRATIQUE DU CONGO', leftStartX, 15)
  
  doc.setFontSize(12)
  doc.text('PROVINCE : HAUT-KATANGA', leftStartX, 23)
  
  // Logo Mairie si disponible
  if (logoMairieDataURL) {
    const logoMairieSize = 25
    doc.addImage(logoMairieDataURL, 'PNG', leftStartX, 28, logoMairieSize, logoMairieSize)
    
    // Texte à côté du logo Mairie
    doc.setFontSize(11)
    doc.text('Ville : Lubumbashi', leftStartX + logoMairieSize + 5, 38)
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('BUREAU DE LA MAIRIE', leftStartX + logoMairieSize + 5, 46)
  } else {
    // Fallback textuel pour la Mairie
    doc.setFontSize(11)
    doc.text('Ville : Lubumbashi', leftStartX, 35)
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('BUREAU DE LA MAIRIE', leftStartX, 43)
  }
  
  // PARTIE DROITE - Logo SID
  if (logoSIDDataURL) {
    const logoSIDSize = 30
    const logoSIDX = pageWidth - logoSIDSize - 15
    doc.addImage(logoSIDDataURL, 'JPEG', logoSIDX, 10, logoSIDSize, logoSIDSize * 0.8)
    
    // Texte SID sous le logo
    doc.setFontSize(8)
    doc.setTextColor(220, 53, 69) // Rouge SID
    doc.text('SID', logoSIDX + logoSIDSize/2, logoSIDSize + 18, { align: 'center' })
    doc.text('Société Internationale', logoSIDX + logoSIDSize/2, logoSIDSize + 23, { align: 'center' })
    doc.text('D\'approvisionnement', logoSIDX + logoSIDSize/2, logoSIDSize + 28, { align: 'center' })
  } else {
    // Fallback textuel pour SID
    const sidTextX = pageWidth - 60
    doc.setFontSize(16)
    doc.setTextColor(220, 53, 69)
    doc.text('SID', sidTextX, 20)
    doc.setFontSize(9)
    doc.text('Société Internationale', sidTextX, 28)
    doc.text('D\'approvisionnement', sidTextX, 35)
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('Service d\'Enregistrement', sidTextX, 45)
  }
  
  // Ligne de séparation officielle
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(1)
  doc.line(15, headerHeight, pageWidth - 15, headerHeight)
  
  // === TITRE DU DOCUMENT ===
  doc.setFontSize(18)
  doc.setTextColor(0, 0, 0)
  doc.text('CERTIFICAT D\'ENREGISTREMENT DE VÉHICULE', pageWidth / 2, headerHeight + 15, { align: 'center' })
  
  // Numéro de référence
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Réf. N° ${vehiculeData.codeUnique || 'N/A'}`, pageWidth - 20, headerHeight + 15, { align: 'right' })
  doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, pageWidth - 20, headerHeight + 22, { align: 'right' })
  
  // === CORPS DU DOCUMENT ===
  let currentY = headerHeight + 35
  
  // SECTION I. PROPRIÉTAIRE avec encadré officiel
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.8)
  doc.rect(15, currentY, pageWidth - 30, 50)
  
  // En-tête de section
  doc.setFillColor(240, 240, 240)
  doc.rect(15, currentY, pageWidth - 30, 12, 'F')
  
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('I. INFORMATIONS DU PROPRIÉTAIRE', 20, currentY + 8)
  
  // Contenu propriétaire
  doc.setFontSize(11)
  currentY += 18
  doc.text(`Nom et Prénom : ${proprietaireData.prenom || ''} ${proprietaireData.nom || ''}`, 20, currentY)
  currentY += 8
  doc.text(`Adresse complète : ${proprietaireData.adresse || 'Non spécifiée'}`, 20, currentY)
  currentY += 8
  doc.text(`Téléphone : ${proprietaireData.telephone || 'Non spécifié'}`, 20, currentY)
  currentY += 8
  doc.text(`Pièce d'identité : ${proprietaireData.typePiece || ''} N° ${proprietaireData.numeroPiece || ''}`, 20, currentY)
  doc.text(`Délivrée à : ${proprietaireData.lieuDelivrance || 'N/A'}`, 120, currentY)
  
  currentY += 15
  
  // SECTION II. VÉHICULE
  doc.setDrawColor(0, 0, 0)
  doc.rect(15, currentY, pageWidth - 85, 65) // Espace réservé pour QR code
  
  // En-tête de section véhicule
  doc.setFillColor(240, 240, 240)
  doc.rect(15, currentY, pageWidth - 85, 12, 'F')
  
  doc.setFontSize(14)
  doc.text('II. CARACTÉRISTIQUES DU VÉHICULE', 20, currentY + 8)
  
  // Contenu véhicule
  doc.setFontSize(11)
  currentY += 18
  doc.text(`Marque : ${vehiculeData.marque || 'Non spécifiée'}`, 20, currentY)
  doc.text(`Modèle : ${vehiculeData.modele || 'Non spécifié'}`, 100, currentY)
  currentY += 8
  doc.text(`Type de véhicule : ${getVehicleTypeDescription(vehiculeData.typeVehicule) || vehiculeData.typeVehicule || 'Non spécifié'}`, 20, currentY)
  currentY += 8
  doc.text(`N° d'immatriculation : ${vehiculeData.numeroImmatriculation || 'Non spécifiée'}`, 20, currentY)
  currentY += 8
  doc.text(`N° de châssis : ${vehiculeData.numeroChassis || 'Non spécifié'}`, 20, currentY)
  currentY += 8
  doc.text(`Année de fabrication : ${vehiculeData.anneeFabrication || 'N/A'}`, 20, currentY)
  doc.text(`Nombre de places : ${vehiculeData.capaciteAssises || '0'}`, 100, currentY)
  
  // QR CODE avec encadré officiel
  const qrSize = 35
  const qrX = pageWidth - 70
  const qrY = currentY - 40
  
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(1)
  doc.rect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 18)
  
  doc.setFillColor(255, 255, 255)
  doc.rect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 16, 'F')
  
  doc.addImage(qrCodeDataURL, 'PNG', qrX, qrY, qrSize, qrSize)
  
  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)
  doc.text('QR Code de', qrX + qrSize/2, qrY + qrSize + 5, { align: 'center' })
  doc.text('vérification', qrX + qrSize/2, qrY + qrSize + 9, { align: 'center' })
  
  currentY += 15
  
  // SECTION III. ADMINISTRATIVE
  doc.setDrawColor(0, 0, 0)
  doc.rect(15, currentY, pageWidth - 30, 35)
  
  doc.setFillColor(240, 240, 240)
  doc.rect(15, currentY, pageWidth - 30, 12, 'F')
  
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('III. INFORMATIONS ADMINISTRATIVES', 20, currentY + 8)
  
  currentY += 18
  doc.setFontSize(11)
  doc.text(`Prix d'enregistrement : ${formatPrice(vehiculeData.prixEnregistrement)}`, 20, currentY)
  doc.text(`Année d'enregistrement : ${vehiculeData.anneeEnregistrement || new Date().getFullYear()}`, 120, currentY)
  currentY += 8
  doc.text(`Code unique : ${vehiculeData.codeUnique || 'N/A'}`, 20, currentY)
  
  currentY += 20
  
  // SECTION IV. ITINÉRAIRE AUTORISÉ
  doc.setDrawColor(0, 0, 0)
  doc.rect(15, currentY, pageWidth - 30, 25)
  
  doc.setFillColor(240, 240, 240)
  doc.rect(15, currentY, pageWidth - 30, 12, 'F')
  
  doc.setFontSize(14)
  doc.text('IV. ITINÉRAIRE AUTORISÉ', 20, currentY + 8)
  
  currentY += 18
  doc.setFontSize(10)
  const itineraire = doc.splitTextToSize(vehiculeData.itineraire || 'Itinéraire non spécifié', pageWidth - 50)
  doc.text(itineraire, 20, currentY)
  
  currentY += Math.max(10, itineraire.length * 5) + 20
  
  // === PIED DE PAGE OFFICIEL ===
  // Ligne de séparation
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.line(15, currentY, pageWidth - 15, currentY)
  
  currentY += 10
  
  // Signatures et cachets
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  
  // Colonne gauche - Mairie
  doc.text('Le Maire de la Ville de Lubumbashi', 25, currentY)
  doc.text('_________________________', 25, currentY + 20)
  doc.text('Signature et cachet', 25, currentY + 25)
  
  // Colonne droite - SID
  doc.text('SID - Service d\'Enregistrement', pageWidth - 80, currentY)
  doc.text('_________________________', pageWidth - 80, currentY + 20)
  doc.text('Signature et cachet', pageWidth - 80, currentY + 25)
  
  // Informations techniques en bas
  currentY += 35
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(`Document généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`, 20, currentY)
  doc.text('Ce document est authentique et vérifiable via le QR Code ci-dessus', 20, currentY + 5)
  
  // Télécharger le PDF
  const filename = `Certificat_Enregistrement_${vehiculeData.numeroImmatriculation || 'TEMP'}_${new Date().toISOString().split("T")[0]}.pdf`
  doc.save(filename)
  
  return filename
}

// Version alternative avec design administratif officiel et gestion des logos manquants
export const generateVehiclePDFWithFallback = async (vehiculeData: any, proprietaireData: any) => {
  const doc = new jsPDF()
  
  // Tentative de chargement des logos
  let logoSIDDataURL: string | null = null
  let logoMairieDataURL: string | null = null
  
  const logoSources = [
    { path: '/logo-sid.jpeg', type: 'SID', format: 'JPEG' },
    { path: '/logo-sid.jpg', type: 'SID', format: 'JPEG' },
    { path: '/logo-sid.png', type: 'SID', format: 'PNG' }
  ]
  
  const logoMairieSources = [
    { path: '/logo-mairie.png', type: 'MAIRIE', format: 'PNG' },
    { path: '/logo-mairie.jpg', type: 'MAIRIE', format: 'JPEG' }
  ]
  
  // Charger logo SID
  for (const { path, format } of logoSources) {
    try {
      logoSIDDataURL = await loadImageAsBase64(path)
      console.log(`✅ Logo SID chargé: ${path}`)
      break
    } catch (error) {
      console.warn(`⚠️ Tentative échouée pour ${path}`)
    }
  }
  
  // Charger logo Mairie
  for (const { path, format } of logoMairieSources) {
    try {
      logoMairieDataURL = await loadImageAsBase64(path)
      console.log(`✅ Logo Mairie chargé: ${path}`)
      break
    } catch (error) {
      console.warn(`⚠️ Tentative échouée pour ${path}`)
    }
  }
  
  // Générer le QR code
  const qrData = generateVehicleQRData(vehiculeData)
  const qrCodeDataURL = await generateQRCode(qrData)
    const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // FILIGRANE DISCRET
  doc.saveGraphicsState()
  doc.setTextColor(250, 250, 250)
  doc.setFontSize(60)
  doc.text('NUMEROTATION', pageWidth / 2, pageHeight / 2, {
    angle: 45,
    align: 'center'
  })
  doc.restoreGraphicsState()
  
  // === EN-TÊTE ADMINISTRATIF ROBUSTE ===
  const headerHeight = 75
  
  // Bordure d'en-tête
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(2)
  doc.rect(10, 5, pageWidth - 20, headerHeight)
  
  // PARTIE GAUCHE avec ou sans logo Mairie
  const leftContentX = 15
  
  if (logoMairieDataURL) {
    const logoMairieSize = 28
    doc.addImage(logoMairieDataURL, 'PNG', leftContentX, 10, logoMairieSize, logoMairieSize)
    
    // Texte à côté du logo
    const textX = leftContentX + logoMairieSize + 5
    doc.setFontSize(13)
    doc.setTextColor(0, 0, 0)
    doc.text('RÉPUBLIQUE DÉMOCRATIQUE DU CONGO', textX, 18)
    doc.setFontSize(11)
    doc.text('PROVINCE : HAUT-KATANGA', textX, 26)
    
    // Texte sous le logo
    doc.setFontSize(10)
    doc.text('Ville : Lubumbashi', leftContentX, logoMairieSize + 18)
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text('BUREAU DE LA MAIRIE', leftContentX, logoMairieSize + 26)
  } else {
    // Fallback textuel pour la Mairie
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text('RÉPUBLIQUE DÉMOCRATIQUE DU CONGO', leftContentX, 18)
    doc.setFontSize(12)
    doc.text('PROVINCE : HAUT-KATANGA', leftContentX, 26)
    doc.setFontSize(11)
    doc.text('Ville : Lubumbashi', leftContentX, 36)
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('BUREAU DE LA MAIRIE', leftContentX, 44)
  }
  
  // PARTIE DROITE avec ou sans logo SID
  if (logoSIDDataURL) {
    const logoSIDSize = 32
    const logoSIDX = pageWidth - logoSIDSize - 15
    doc.addImage(logoSIDDataURL, 'JPEG', logoSIDX, 8, logoSIDSize, logoSIDSize * 0.8)
    
    // Texte SID
    doc.setFontSize(7)
    doc.setTextColor(220, 53, 69)
    doc.text('SID', logoSIDX + logoSIDSize/2, logoSIDSize + 18, { align: 'center' })
    doc.text('Société Internationale', logoSIDX + logoSIDSize/2, logoSIDSize + 22, { align: 'center' })
    doc.text('D\'approvisionnement', logoSIDX + logoSIDSize/2, logoSIDSize + 26, { align: 'center' })
  } else {
    // Fallback textuel pour SID
    const sidTextX = pageWidth - 60
    doc.setFontSize(16)
    doc.setTextColor(220, 53, 69)
    doc.text('SID', sidTextX, 20)
    doc.setFontSize(9)
    doc.text('Société Internationale', sidTextX, 28)
    doc.text('D\'approvisionnement', sidTextX, 35)
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('Service d\'Enregistrement', sidTextX, 45)
  }
  
  // Ligne de séparation
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(1.5)
  doc.line(15, headerHeight + 5, pageWidth - 15, headerHeight + 5)
  
  // === TITRE PRINCIPAL ===
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('CERTIFICAT OFFICIEL D\'ENREGISTREMENT DE VÉHICULE', pageWidth / 2, headerHeight + 20, { align: 'center' })
  
  // Informations de référence
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`Réf: ${vehiculeData.codeUnique || 'N/A'}`, pageWidth - 20, headerHeight + 20, { align: 'right' })
  doc.text(`${new Date().toLocaleDateString("fr-FR")}`, pageWidth - 20, headerHeight + 27, { align: 'right' })
  
  // === SECTIONS STRUCTURÉES ===
  let currentY = headerHeight + 40
  
  // I. PROPRIÉTAIRE
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(1)
  doc.rect(15, currentY, pageWidth - 30, 55)
  
  // En-tête section
  doc.setFillColor(245, 245, 245)
  doc.rect(15, currentY, pageWidth - 30, 15, 'F')
  doc.setDrawColor(0, 0, 0)
  doc.line(15, currentY + 15, pageWidth - 15, currentY + 15)
  
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text('I. IDENTITÉ DU PROPRIÉTAIRE', 20, currentY + 10)
  
  // Données propriétaire
  doc.setFontSize(10)
  currentY += 22
  doc.text(`Nom et Prénom(s) : ${proprietaireData.prenom || ''} ${proprietaireData.nom || ''}`, 20, currentY)
  currentY += 8
  doc.text(`Adresse de résidence : ${proprietaireData.adresse || 'Non spécifiée'}`, 20, currentY)
  currentY += 8
  doc.text(`Numéro de téléphone : ${proprietaireData.telephone || 'Non spécifié'}`, 20, currentY)
  currentY += 8
  doc.text(`Type de pièce : ${proprietaireData.typePiece || 'N/A'}`, 20, currentY)
  doc.text(`N° : ${proprietaireData.numeroPiece || 'N/A'}`, 100, currentY)
  doc.text(`Lieu : ${proprietaireData.lieuDelivrance || 'N/A'}`, 150, currentY)
  
  currentY += 20
  
  // II. VÉHICULE (avec espace QR code)
  doc.setDrawColor(0, 0, 0)
  doc.rect(15, currentY, pageWidth - 85, 70)
  
  doc.setFillColor(245, 245, 245)
  doc.rect(15, currentY, pageWidth - 85, 15, 'F')
  doc.setDrawColor(0, 0, 0)
  doc.line(15, currentY + 15, pageWidth - 85, currentY + 15)
  
  doc.setFontSize(12)
  doc.text('II. CARACTÉRISTIQUES TECHNIQUES', 20, currentY + 10)
  
  // QR CODE OFFICIEL
  const qrSize = 40
  const qrX = pageWidth - 75
  const qrY = currentY + 5
  
  // Encadré QR
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(2)
  doc.rect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 25)
  
  doc.setFillColor(255, 255, 255)
  doc.rect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 23, 'F')
  
  doc.addImage(qrCodeDataURL, 'PNG', qrX, qrY, qrSize, qrSize)
  
  doc.setFontSize(7)
  doc.setTextColor(0, 0, 0)
  doc.text('CODE DE', qrX + qrSize/2, qrY + qrSize + 6, { align: 'center' })
  doc.text('VÉRIFICATION', qrX + qrSize/2, qrY + qrSize + 10, { align: 'center' })
  doc.text('OFFICIEL', qrX + qrSize/2, qrY + qrSize + 14, { align: 'center' })
  
  // Données véhicule
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  currentY += 22
  doc.text(`Marque : ${vehiculeData.marque || 'N/A'}`, 20, currentY)
  doc.text(`Modèle : ${vehiculeData.modele || 'N/A'}`, 80, currentY)
  currentY += 8
  doc.text(`Catégorie : ${getVehicleTypeDescription(vehiculeData.typeVehicule) || vehiculeData.typeVehicule || 'N/A'}`, 20, currentY)
  currentY += 8
  doc.text(`Plaque d'immatriculation : ${vehiculeData.numeroImmatriculation || 'N/A'}`, 20, currentY)
  currentY += 8
  doc.text(`Numéro de châssis : ${vehiculeData.numeroChassis || 'N/A'}`, 20, currentY)
  currentY += 8
  doc.text(`Année de fabrication : ${vehiculeData.anneeFabrication || 'N/A'}`, 20, currentY)
  doc.text(`Nombre de places : ${vehiculeData.capaciteAssises || '0'}`, 80, currentY)
  
  currentY += 20
  
  // III. ADMINISTRATION
  doc.setDrawColor(0, 0, 0)
  doc.rect(15, currentY, pageWidth - 30, 40)
  
  doc.setFillColor(245, 245, 245)
  doc.rect(15, currentY, pageWidth - 30, 15, 'F')
  doc.line(15, currentY + 15, pageWidth - 15, currentY + 15)
  
  doc.setFontSize(12)
  doc.text('III. DONNÉES ADMINISTRATIVES', 20, currentY + 10)
  
  currentY += 22
  doc.setFontSize(10)
  doc.text(`Droits d'enregistrement : ${formatPrice(vehiculeData.prixEnregistrement)}`, 20, currentY)
  doc.text(`Année fiscale : ${vehiculeData.anneeEnregistrement || new Date().getFullYear()}`, 120, currentY)
  currentY += 8
  doc.text(`Code de référence unique : ${vehiculeData.codeUnique || 'N/A'}`, 20, currentY)
  
  currentY += 20
  
  // IV. ITINÉRAIRE
  const itineraireHeight = 30
  doc.setDrawColor(0, 0, 0)
  doc.rect(15, currentY, pageWidth - 30, itineraireHeight)
  
  doc.setFillColor(245, 245, 245)
  doc.rect(15, currentY, pageWidth - 30, 15, 'F')
  doc.line(15, currentY + 15, pageWidth - 15, currentY + 15)
  
  doc.setFontSize(12)
  doc.text('IV. ITINÉRAIRE COMMERCIAL AUTORISÉ', 20, currentY + 10)
  
  currentY += 22
  doc.setFontSize(9)
  const itineraire = doc.splitTextToSize(vehiculeData.itineraire || 'Tous itinéraires autorisés sur le territoire de Lubumbashi', pageWidth - 50)
  doc.text(itineraire, 20, currentY)
  
  currentY += itineraireHeight - 10
  
  // === AUTHENTIFICATION OFFICIELLE ===
  currentY += 15
  
  // Ligne de validation
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(1)
  doc.line(15, currentY, pageWidth - 15, currentY)
  
  currentY += 10
  
  // Signatures officielles
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  
  // Côté gauche - Mairie
  doc.text('POUR LE MAIRE', 25, currentY)
  doc.text('Le Secrétaire Général', 25, currentY + 6)
  doc.text('_______________________', 25, currentY + 20)
  doc.text('Signature et cachet officiel', 25, currentY + 26)
  
  // Côté droit - SID
  doc.text('SID - SERVICE D\'ENREGISTREMENT', pageWidth - 85, currentY)
  doc.text('Le Responsable Technique', pageWidth - 85, currentY + 6)
  doc.text('_______________________', pageWidth - 85, currentY + 20)
  doc.text('Signature et cachet', pageWidth - 85, currentY + 26)
  
  // Petits logos en signature si disponibles
  if (logoMairieDataURL) {
    doc.addImage(logoMairieDataURL, 'PNG', 70, currentY + 8, 12, 12)
  }
  if (logoSIDDataURL) {
    doc.addImage(logoSIDDataURL, 'JPEG', pageWidth - 40, currentY + 8, 15, 12)
  }
  
  // Pied de page technique
  currentY += 35
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  doc.text(`Document généré automatiquement le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`, 20, currentY)
  doc.text('Vérification possible via QR Code - Document authentique et incontestable', 20, currentY + 4)
  doc.text(`Référence système: ${vehiculeData.codeUnique || 'N/A'}`, 20, currentY + 8)
  
  // Télécharger
  const filename = `Certificat_Officiel_${vehiculeData.numeroImmatriculation || 'TEMP'}_${new Date().toISOString().split("T")[0]}.pdf`
  doc.save(filename)
  
  return filename
}

// Fonction de test pour vérifier que les logos peuvent être chargés
export const testLogoAvailability = async () => {
  console.log('🧪 Test de disponibilité des logos...')
  
  const results = {
    sidLogo: false,
    mairieLogo: false
  }
  
  // Test logo SID
  try {
    const logoSIDDataURL = await loadImageAsBase64('/logo-sid.jpeg')
    console.log('✅ Logo SID chargé avec succès')
    console.log('🔍 Prévisualisation SID (premiers 50 caractères):', logoSIDDataURL.substring(0, 50))
    results.sidLogo = true
  } catch (error) {
    console.error('❌ Impossible de charger le logo SID:', error)
  }
  
  // Test logo Mairie
  try {
    const logoMairieDataURL = await loadImageAsBase64('/logo-mairie.png')
    console.log('✅ Logo Mairie chargé avec succès')
    console.log('🔍 Prévisualisation Mairie (premiers 50 caractères):', logoMairieDataURL.substring(0, 50))
    results.mairieLogo = true
  } catch (error) {
    console.error('❌ Impossible de charger le logo Mairie:', error)
  }
  
  // Résumé
  const totalLogos = Object.values(results).filter(Boolean).length
  console.log(`📊 Résultat: ${totalLogos}/2 logos disponibles`)
  
  if (totalLogos === 0) {
    console.log('💡 Vérifiez que les fichiers logo-sid.jpeg et logo-mairie.png existent dans le dossier public/')
  }
  
  return results
}
