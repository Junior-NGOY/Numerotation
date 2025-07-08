import jsPDF from 'jspdf'
import { generateQRCode, generateVehicleQRData } from './qr-generator'
import { formatPrice, getVehicleTypeDescription } from './pricing-utils'

// Fonction pour convertir un nombre en lettres (français)
function convertirNombreEnLettres(nombre: number): string {
  const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const dizaines = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
  const exceptions = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];

  if (nombre === 0) return 'zéro';
  if (nombre < 0) return 'moins ' + convertirNombreEnLettres(-nombre);

  let resultat = '';

  // Millions
  if (nombre >= 1000000) {
    const millions = Math.floor(nombre / 1000000);
    if (millions === 1) {
      resultat += 'un million ';
    } else {
      resultat += convertirNombreEnLettres(millions) + ' millions ';
    }
    nombre %= 1000000;
  }

  // Milliers
  if (nombre >= 1000) {
    const milliers = Math.floor(nombre / 1000);
    if (milliers === 1) {
      resultat += 'mille ';
    } else {
      resultat += convertirNombreEnLettres(milliers) + ' mille ';
    }
    nombre %= 1000;
  }

  // Centaines
  if (nombre >= 100) {
    const centaines = Math.floor(nombre / 100);
    if (centaines === 1) {
      resultat += 'cent ';
    } else {
      resultat += unites[centaines] + ' cent ';
    }
    nombre %= 100;
  }

  // Dizaines et unités
  if (nombre >= 20) {
    const dizaine = Math.floor(nombre / 10);
    const unite = nombre % 10;
    
    if (dizaine === 7) {
      if (unite === 1) {
        resultat += 'soixante et onze ';
      } else if (unite === 0) {
        resultat += 'soixante-dix ';
      } else {
        resultat += 'soixante-' + exceptions[unite] + ' ';
      }
    } else if (dizaine === 9) {
      if (unite === 0) {
        resultat += 'quatre-vingt-dix ';
      } else {
        resultat += 'quatre-vingt-' + exceptions[unite] + ' ';
      }
    } else if (dizaine === 8) {
      if (unite === 0) {
        resultat += 'quatre-vingts ';
      } else {
        resultat += 'quatre-vingt-' + unites[unite] + ' ';
      }
    } else {
      resultat += dizaines[dizaine];
      if (unite === 1 && dizaine !== 8) {
        resultat += ' et un ';
      } else if (unite > 0) {
        resultat += '-' + unites[unite] + ' ';
      } else {
        resultat += ' ';
      }
    }
  } else if (nombre >= 10) {
    resultat += exceptions[nombre - 10] + ' ';
  } else if (nombre > 0) {
    resultat += unites[nombre] + ' ';
  }

  return resultat.trim();
}

// Fonction pour formater le prix en lettres
function formatPrixEnLettres(prix: number): string {
  const prixEnLettres = convertirNombreEnLettres(prix);
  return prixEnLettres.charAt(0).toUpperCase() + prixEnLettres.slice(1) + ' francs congolais';
}

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
  const pageHeight = doc.internal.pageSize.getHeight()    // FILIGRANE EN ARRIÈRE-PLAN - TRIPLE PARALLÈLE
  doc.saveGraphicsState()
  doc.setTextColor(248, 248, 248) // Couleur très pâle
  doc.setFontSize(45) // Taille réduite pour avoir 3 filigranes
  // Calcul précis du centre exact de la page
  const centerX = pageWidth / 2
  const centerY = pageHeight / 2
  
  // Filigrane central
  doc.text('NUMEROTATION', centerX, centerY, {
    angle: 45,
    align: 'center',
    baseline: 'middle'
  })
  
  // Filigrane à gauche
  doc.text('NUMEROTATION', centerX - 60, centerY, {
    angle: 45,
    align: 'center',
    baseline: 'middle'
  })
  
  // Filigrane à droite
  doc.text('NUMEROTATION', centerX + 60, centerY, {
    angle: 45,
    align: 'center',
    baseline: 'middle'
  })
  
  doc.restoreGraphicsState()
    // === EN-TÊTE OFFICIEL COMPACT ===
  const headerHeight = 50
  
  // PARTIE GAUCHE - République + Province + Mairie
  const leftStartX = 15
  
  // Informations officielles du gouvernement (tailles réduites)
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text('RÉPUBLIQUE DÉMOCRATIQUE DU CONGO', leftStartX, 12)
  
  doc.setFontSize(10)
  doc.text('PROVINCE : HAUT-KATANGA', leftStartX, 19)
    // Logo Mairie si disponible (plus compact)
  if (logoMairieDataURL) {
    const logoMairieSize = 20
    doc.addImage(logoMairieDataURL, 'PNG', leftStartX, 23, logoMairieSize, logoMairieSize)
    
    // Texte à côté du logo Mairie
    doc.setFontSize(9)
    doc.text('Ville : Lubumbashi', leftStartX + logoMairieSize + 5, 30)
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('BUREAU DE LA MAIRIE', leftStartX + logoMairieSize + 5, 37)
  } else {
    // Fallback textuel pour la Mairie
    doc.setFontSize(9)
    doc.text('Ville : Lubumbashi', leftStartX, 28)
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('BUREAU DE LA MAIRIE', leftStartX, 35)
  }
    // PARTIE DROITE - Logo SID (plus compact)
  if (logoSIDDataURL) {
    const logoSIDSize = 22
    const logoSIDX = pageWidth - logoSIDSize - 15
    doc.addImage(logoSIDDataURL, 'JPEG', logoSIDX, 8, logoSIDSize, logoSIDSize * 0.8)
    
    // Texte SID sous le logo
    doc.setFontSize(7)
    doc.setTextColor(220, 53, 69) // Rouge SID
    doc.text('SID', logoSIDX + logoSIDSize/2, logoSIDSize + 15, { align: 'center' })
    doc.text('Société Internationale', logoSIDX + logoSIDSize/2, logoSIDSize + 19, { align: 'center' })
    doc.text('D\'approvisionnement', logoSIDX + logoSIDSize/2, logoSIDSize + 23, { align: 'center' })
  } else {
    // Fallback textuel pour SID
    const sidTextX = pageWidth - 60
    doc.setFontSize(14)
    doc.setTextColor(220, 53, 69)
    doc.text('SID', sidTextX, 18)
    doc.setFontSize(8)
    doc.text('Société Internationale', sidTextX, 25)
    doc.text('D\'approvisionnement', sidTextX, 30)
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    doc.text('Service d\'Enregistrement', sidTextX, 37)
  }
    // Ligne de séparation officielle
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(1)
  doc.line(15, headerHeight, pageWidth - 15, headerHeight)  // === ENCADRÉ FBN-BANK À DEUX COLONNES ===
  const bankBoxY = headerHeight + 8
  const bankBoxHeight = 20  // Augmenté pour une meilleure visibilité
  const bankBoxWidth = pageWidth - 30
  const col1Width = bankBoxWidth * 0.2  // 20% pour VOLET A
  const col2Width = bankBoxWidth * 0.8  // 80% pour les informations bancaires
  
  // Dessiner le cadre principal
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(1)
  doc.rect(15, bankBoxY, bankBoxWidth, bankBoxHeight)
  
  // Dessiner la ligne de séparation verticale entre les colonnes
  doc.setLineWidth(0.5)
  doc.line(15 + col1Width, bankBoxY, 15 + col1Width, bankBoxY + bankBoxHeight)
  
  // COLONNE 1 - VOLET A (20% de l'espace)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text('VOLET A', 15 + col1Width/2, bankBoxY + bankBoxHeight/2, { align: 'center', baseline: 'middle' })
  // COLONNE 2 - Informations bancaires (80% de l'espace)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)  // Taille augmentée de 10 à 11
  doc.setTextColor(0, 0, 0)
  
  // Position de la marge droite de la colonne 2
  const col2RightMargin = 15 + bankBoxWidth - 5  // 5px de marge depuis le bord droit du cadre
  
  // Première ligne dans la colonne 2 - alignée à droite
  doc.text('A verser à FBN-BANK : 00014-25000-2042090896316 | CDF 90%', col2RightMargin, bankBoxY + 8, { align: 'right' })
  
  // Deuxième ligne dans la colonne 2 - alignée à droite (interligne réduit)
  doc.setFontSize(10)  // Taille augmentée de 9 à 10
  doc.text('10% retenus à la source pour les services', col2RightMargin, bankBoxY + 14, { align: 'right' })
  
  // Remettre la police normale pour la suite
  doc.setFont('helvetica', 'normal')// === TITRE DU DOCUMENT ===
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text(`NOTE DE PERCEPTION N° ${vehiculeData.codeUnique || 'N/A'}`, pageWidth / 2, bankBoxY + bankBoxHeight + 12, { align: 'center' })
  
  // === TEXTES LÉGAUX ===
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text('Textes Légaux : - Arrêté Urbain N°011/Bur-Mairie/Ville/Lshi/2025 du 11 Juin 2025', pageWidth / 2, bankBoxY + bankBoxHeight + 22, { align: 'center' })
  doc.setFont('helvetica', 'normal')
    
  // === CORPS DU DOCUMENT ===
  let currentY = headerHeight + 65
    // SECTION I. PROPRIÉTAIRE avec encadré simple
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text('I. INFORMATIONS DU PROPRIÉTAIRE', 20, currentY)
  // Contenu propriétaire avec alignement structuré
  doc.setFontSize(10)
  currentY += 10
    // Définir les colonnes pour un alignement parfait avec données rapprochées
  const labelCol1 = 20     // Première colonne labels
  const dataCol1 = 70      // Première colonne données (plus près)
  const labelCol2 = 120    // Deuxième colonne labels
  const dataCol2 = 155     // Deuxième colonne données (plus près)
  
  // Ligne 1: Nom et Prénom
  doc.setTextColor(25, 118, 210) // Bleu professionnel pour les labels
  doc.text('Nom et Prénom :', labelCol1, currentY)
  doc.setTextColor(0, 0, 0) // Noir pour les données
  doc.text(`${proprietaireData.prenom || ''} ${proprietaireData.nom || ''}`, dataCol1, currentY)
  currentY += 6
  
  // Ligne 2: Adresse complète (sur toute la largeur)
  doc.setTextColor(25, 118, 210)
  doc.text('Adresse complète :', labelCol1, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${proprietaireData.adresse || 'Non spécifiée'}`, dataCol1, currentY)
  
  currentY += 6
  
  // Ligne 3: Type de pièce - Lieu de délivrance
  doc.setTextColor(25, 118, 210)
  doc.text('Type de pièce :', labelCol1, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${proprietaireData.typePiece || 'N/A'}`, dataCol1, currentY)
  
  doc.setTextColor(25, 118, 210)
  doc.text('Délivrée à :', labelCol2, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${proprietaireData.lieuDelivrance || 'N/A'}`, dataCol2, currentY)
    currentY += 6
  
  // Ligne 4: Numéro de pièce - Téléphone
  doc.setTextColor(25, 118, 210)
  doc.text('Numéro de pièce :', labelCol1, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${proprietaireData.numeroPiece || 'N/A'}`, dataCol1, currentY)
  
  doc.setTextColor(25, 118, 210)
  doc.text('Téléphone :', labelCol2, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${proprietaireData.telephone || 'Non spécifié'}`, dataCol2, currentY)
  
  currentY += 10    // SECTION II. VÉHICULE
  doc.setFontSize(12);  doc.text('II. CARACTÉRISTIQUES DU VÉHICULE', 20, currentY)
  // Contenu véhicule avec alignement structuré
  doc.setFontSize(10)
  currentY += 10
    // Utiliser les mêmes colonnes pour la cohérence avec données rapprochées
  const vLabelCol1 = 20     // Première colonne labels
  const vDataCol1 = 70      // Première colonne données (plus près)
  const vLabelCol2 = 120    // Deuxième colonne labels
  const vDataCol2 = 155     // Deuxième colonne données (plus près)
  
  // Ligne 1: Marque - Modèle
  doc.setTextColor(25, 118, 210) // Bleu professionnel pour les labels
  doc.text('Marque :', vLabelCol1, currentY)
  doc.setTextColor(0, 0, 0) // Noir pour les données
  doc.text(`${vehiculeData.marque || 'Non spécifiée'}`, vDataCol1, currentY)
  
  doc.setTextColor(25, 118, 210)
  doc.text('Modèle :', vLabelCol2, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${vehiculeData.modele || 'Non spécifié'}`, vDataCol2, currentY)
    currentY += 6
  
  // Ligne 2: Type de véhicule - Année de fabrication
  doc.setTextColor(25, 118, 210)
  doc.text('Type de véhicule :', vLabelCol1, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${getVehicleTypeDescription(vehiculeData.typeVehicule) || vehiculeData.typeVehicule || 'Non spécifié'}`, vDataCol1, currentY)
  
  doc.setTextColor(25, 118, 210)
  doc.text('Année fabrication :', vLabelCol2, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${vehiculeData.anneeFabrication || 'N/A'}`, vDataCol2, currentY)
  
  currentY += 7
  
  // Ligne 3: Numéro d'immatriculation - Nombre de places
  doc.setTextColor(25, 118, 210)
  doc.text('N° immatriculation :', vLabelCol1, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${vehiculeData.numeroImmatriculation || 'Non spécifiée'}`, vDataCol1, currentY)
  
  doc.setTextColor(25, 118, 210)
  doc.text('Nombre de places :', vLabelCol2, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${vehiculeData.capaciteAssises || '0'}`, vDataCol2, currentY)
  currentY += 7
    // Ligne 4: Numéro de châssis (sur toute la largeur car peut être long)
  doc.setTextColor(25, 118, 210)
  doc.text('N° de châssis :', vLabelCol1, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${vehiculeData.numeroChassis || 'Non spécifié'}`, vDataCol1, currentY)
    currentY += 10
    // SECTION III. ADMINISTRATIVE
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text('III. INFORMATIONS ADMINISTRATIVES', 20, currentY)
  currentY += 10
  doc.setFontSize(10)
    // Utiliser les mêmes colonnes pour la cohérence avec données rapprochées
  const aLabelCol1 = 20     // Première colonne labels
  const aDataCol1 = 70      // Première colonne données (plus près)
  const aLabelCol2 = 120    // Deuxième colonne labels  
  const aDataCol2 = 155     // Deuxième colonne données (plus près)
    // Ligne 1: Prix d'enregistrement - Année d'enregistrement
  doc.setTextColor(25, 118, 210) // Bleu professionnel pour les labels
  doc.text('Prix enregistrement :', aLabelCol1, currentY)
  doc.setTextColor(0, 0, 0) // Noir pour les données
  doc.text(`${formatPrice(vehiculeData.prixEnregistrement)}`, aDataCol1, currentY)
  
  doc.setTextColor(25, 118, 210)
  doc.text('Code unique :', aLabelCol2, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${vehiculeData.codeUnique || 'N/A'}`, aDataCol2, currentY)
  currentY += 7
  
  // Ligne 2: Nous disons (prix en lettres)
  doc.setTextColor(25, 118, 210)
  doc.text('Nous disons :', aLabelCol1, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${formatPrixEnLettres(vehiculeData.prixEnregistrement)}`, aDataCol1, currentY)
  currentY += 7
  
  // Ligne 3: Année enregistrement
  doc.setTextColor(25, 118, 210)
  doc.text('Année enregistrement :', aLabelCol1, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${vehiculeData.anneeEnregistrement || new Date().getFullYear()}`, aDataCol1, currentY)
    currentY += 10
  
  // SECTION IV. ITINÉRAIRE AUTORISÉ
  doc.setFontSize(12)
  doc.text('IV. ITINÉRAIRE AUTORISÉ', 20, currentY)  // QR CODE - Positionné à côté de la section itinéraire (remonté davantage)
  const qrSize = 35
  const qrX = pageWidth - qrSize - 20  // Position à droite avec marge
  const qrY = currentY - 20   // Légèrement au-dessus de la ligne du dessus
  doc.addImage(qrCodeDataURL, 'PNG', qrX, qrY, qrSize, qrSize)
  
  doc.setFontSize(7)
  doc.setTextColor(0, 0, 0)
  doc.text('QR Code de', qrX + qrSize/2, qrY + qrSize + 4, { align: 'center' })
  doc.text('vérification', qrX + qrSize/2, qrY + qrSize + 8, { align: 'center' })
  
  // Date sous le QR code (encore plus remontée)
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, qrX + qrSize/2, qrY + qrSize + 11, { align: 'center' })
  
  currentY += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 102, 204) // Même couleur que les autres attributs
  // Ajuster la largeur du texte pour éviter le QR code
  const itineraire = doc.splitTextToSize(vehiculeData.itineraire?.nom || 'Itinéraire non spécifié', pageWidth - qrSize - 50)
  doc.text(itineraire, 20, currentY)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0) // Remettre en noir pour le reste
  currentY += Math.max(10, itineraire.length * 3) + 5
    // === PIED DE PAGE AVEC SIGNATURES ===
  // Ligne de séparation simple - abaissée pour laisser place à la date sous le QR
  currentY += 5  // Ajouter de l'espace avant la ligne
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.line(15, currentY, pageWidth - 15, currentY)
  
  currentY += 8
    // Pied de page avec deux signatures : "Redevable | PPU"
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  
  // Position X pour les deux sections
  const redevableX = 25  // Redevable à l'extrême gauche
  const ppuX = pageWidth - 60  // P.P.U à l'extrême droite
  
  // Redevable (extrême gauche)
  doc.text('Redevable', redevableX, currentY)
  doc.text('____________________', redevableX, currentY + 15)
  
  // P.P.U (extrême droite)
  doc.text('P.P.U', ppuX, currentY)
  doc.text('____________________', ppuX, currentY + 15)
  currentY += 23
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(`Document généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`, 20, currentY)
  doc.text('Ce document est authentique et vérifiable via le QR Code ci-dessus', 20, currentY + 5)
  // Version info pour diagnostic déploiement
  doc.setFontSize(6)
  doc.setTextColor(200, 200, 200)
  doc.text('PDF-GEN-V2.5-FIX-DEPLOYED', 20, currentY + 10)

  // Télécharger le PDF
  const filename = `Note_Perception_${vehiculeData.codeUnique || vehiculeData.numeroImmatriculation || 'TEMP'}_${new Date().toISOString().split("T")[0]}.pdf`
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
    // FILIGRANE DISCRET - CENTRÉ AVEC GRANDE TAILLE
  doc.saveGraphicsState()
  doc.setTextColor(250, 250, 250)
  doc.setFontSize(90) // Taille plus grande
  // Calcul précis du centre de la page
  const centerX = pageWidth / 2
  const centerY = pageHeight / 2
  doc.text('NUMEROTATION', centerX, centerY, {
    angle: 45,
    align: 'center',
    baseline: 'middle'
  })
  doc.restoreGraphicsState()
  
  // === EN-TÊTE ADMINISTRATIF ROBUSTE ===
  const headerHeight = 75
  
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
  let currentY = headerHeight + 50
  
  // I. PROPRIÉTAIRE
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text('I. IDENTITÉ DU PROPRIÉTAIRE', 20, currentY)
  // Données propriétaire avec alignement structuré
  doc.setFontSize(10)
  currentY += 12
    // Utiliser les mêmes colonnes pour la cohérence avec données rapprochées
  const pLabelCol1 = 10     // Première colonne labels
  const pDataCol1 = 50      // Première colonne données (plus près)
  const pLabelCol2 = 120    // Deuxième colonne labels
  const pDataCol2 = 155     // Deuxième colonne données (plus près)
  
  // Ligne 1: Nom et Prénom
  doc.setTextColor(25, 118, 210) // Bleu professionnel pour les labels
  doc.text('Nom et Prénom(s) :', pLabelCol1, currentY)
  doc.setTextColor(0, 0, 0) // Noir pour les données
  doc.text(`${proprietaireData.prenom || ''} ${proprietaireData.nom || ''}`, pDataCol1, currentY)
  
  currentY += 10
  
  // Ligne 2: Adresse complète (sur toute la largeur)
  doc.setTextColor(25, 118, 210)
  doc.text('Adresse de résidence :', pLabelCol1, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${proprietaireData.adresse || 'Non spécifiée'}`, pDataCol1, currentY)
  
  currentY += 10
  
  // Ligne 3: Type de pièce - Lieu de délivrance
  doc.setTextColor(25, 118, 210)
  doc.text('Type de pièce :', pLabelCol1, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${proprietaireData.typePiece || 'N/A'}`, pDataCol1, currentY)
  
  doc.setTextColor(25, 118, 210)
  doc.text('Délivrée à :', pLabelCol2, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${proprietaireData.lieuDelivrance || 'N/A'}`, pDataCol2, currentY)
  
  currentY += 10
  
  // Ligne 4: Numéro de pièce - Téléphone
  doc.setTextColor(25, 118, 210)
  doc.text('Numéro de pièce :', pLabelCol1, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${proprietaireData.numeroPiece || 'N/A'}`, pDataCol1, currentY)
  
  doc.setTextColor(25, 118, 210)
  doc.text('Téléphone :', pLabelCol2, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${proprietaireData.telephone || 'Non spécifié'}`, pDataCol2, currentY)
  
  currentY += 18
    // II. VÉHICULE (avec QR code)
  doc.setFontSize(12)
  doc.text('II. CARACTÉRISTIQUES TECHNIQUES', 20, currentY)    // QR CODE OFFICIEL - Repositionné plus à droite et remonté
  const qrSize = 40
  const qrX = pageWidth - 55  // Plus à droite (était à -75)
  const qrY = currentY - 2  // Légèrement au-dessus de la ligne du dessus
  
  doc.addImage(qrCodeDataURL, 'PNG', qrX, qrY, qrSize, qrSize)
  
  doc.setFontSize(7)
  doc.setTextColor(0, 0, 0)
  doc.text('CODE DE', qrX + qrSize/2, qrY + qrSize + 6, { align: 'center' })
  doc.text('VÉRIFICATION', qrX + qrSize/2, qrY + qrSize + 10, { align: 'center' })
  doc.text('OFFICIEL', qrX + qrSize/2, qrY + qrSize + 14, { align: 'center' })
  // Données véhicule avec alignement structuré
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  currentY += 12
  
  // Utiliser les mêmes colonnes pour la cohérence avec données rapprochées
  const v2LabelCol1 = 20     // Première colonne labels
  const v2DataCol1 = 70      // Première colonne données (plus près)
  const v2LabelCol2 = 120    // Deuxième colonne labels
  const v2DataCol2 = 155     // Deuxième colonne données (plus près)
  
  // Ligne 1: Marque - Modèle
  doc.setTextColor(25, 118, 210) // Bleu professionnel pour les labels
  doc.text('Marque :', v2LabelCol1, currentY)
  doc.setTextColor(0, 0, 0) // Noir pour les données
  doc.text(`${vehiculeData.marque || 'N/A'}`, v2DataCol1, currentY)
  
  doc.setTextColor(25, 118, 210)
  doc.text('Modèle :', v2LabelCol2, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${vehiculeData.modele || 'N/A'}`, v2DataCol2, currentY)
  
  currentY += 10
  
  // Ligne 2: Catégorie - Année de fabrication
  doc.setTextColor(25, 118, 210)
  doc.text('Catégorie :', v2LabelCol1, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${getVehicleTypeDescription(vehiculeData.typeVehicule) || vehiculeData.typeVehicule || 'N/A'}`, v2DataCol1, currentY)
  
  doc.setTextColor(25, 118, 210)
  doc.text('Année fabrication :', v2LabelCol2, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${vehiculeData.anneeFabrication || 'N/A'}`, v2DataCol2, currentY)
  
  currentY += 10
  
  // Ligne 3: Plaque d'immatriculation - Nombre de places
  doc.setTextColor(25, 118, 210)
  doc.text('N° immatriculation :', v2LabelCol1, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${vehiculeData.numeroImmatriculation || 'N/A'}`, v2DataCol1, currentY)
  
  doc.setTextColor(25, 118, 210)
  doc.text('Nombre de places :', v2LabelCol2, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${vehiculeData.capaciteAssises || '0'}`, v2DataCol2, currentY)
  
  currentY += 10
  
  // Ligne 4: Numéro de châssis (sur toute la largeur car peut être long)
  doc.setTextColor(25, 118, 210)
  doc.text('Numéro de châssis :', v2LabelCol1, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${vehiculeData.numeroChassis || 'N/A'}`, v2DataCol1, currentY)
  
  doc.setTextColor(25, 118, 210)
  doc.text('Nombre de places :', 130, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${vehiculeData.capaciteAssises || '0'}`, 185, currentY)
  
  currentY += 20
  // III. ADMINISTRATION
  doc.setFontSize(12)
  doc.text('III. DONNÉES ADMINISTRATIVES', 20, currentY)
  
  currentY += 12
  doc.setFontSize(10)
  
  // Utiliser les mêmes colonnes pour la cohérence avec données rapprochées
  const a2LabelCol1 = 20     // Première colonne labels
  const a2DataCol1 = 70      // Première colonne données (plus près)
  const a2LabelCol2 = 120    // Deuxième colonne labels  
  const a2DataCol2 = 155     // Deuxième colonne données (plus près)
    // Ligne 1: Droits d'enregistrement - Année fiscale
  doc.setTextColor(25, 118, 210) // Bleu professionnel pour les labels
  doc.text('Droits enregistrement :', a2LabelCol1, currentY)
  doc.setTextColor(0, 0, 0) // Noir pour les données  doc.text(`${formatPrice(vehiculeData.prixEnregistrement)}`, a2DataCol1, currentY)
  
  doc.setTextColor(25, 118, 210)
  doc.text('Code de référence :', a2LabelCol2, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${vehiculeData.codeUnique || 'N/A'}`, a2DataCol2, currentY)
  
  currentY += 10
  
  // Ligne 2: Nous disons (prix en lettres)
  doc.setTextColor(25, 118, 210)
  doc.text('Nous disons :', a2LabelCol1, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${formatPrixEnLettres(vehiculeData.prixEnregistrement)}`, a2DataCol1, currentY)
  
  currentY += 10
  
  // Ligne 3: Année fiscale
  doc.setTextColor(25, 118, 210)
  doc.text('Année fiscale :', a2LabelCol1, currentY)
  doc.setTextColor(0, 0, 0)
  doc.text(`${vehiculeData.anneeEnregistrement || new Date().getFullYear()}`, a2DataCol1, currentY)
  
  currentY += 20
  
  // IV. ITINÉRAIRE
  const itineraireHeight = 30
  doc.setFontSize(12)
  doc.text('IV. ITINÉRAIRE COMMERCIAL AUTORISÉ', 20, currentY)
  
  currentY += 15
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 102, 204) // Même couleur que les autres attributs
  const itineraire = doc.splitTextToSize(vehiculeData.itineraire?.nom || 'Tous itinéraires autorisés sur le territoire de Lubumbashi', pageWidth - 50)
  doc.text(itineraire, 20, currentY)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0) // Remettre en noir pour le reste
  
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
  
  // Côté droit - SID
  doc.text('SID - SERVICE D\'ENREGISTREMENT', pageWidth - 85, currentY)
  doc.text('Le Responsable Technique', pageWidth - 85, currentY + 6)
  doc.text('_______________________', pageWidth - 85, currentY + 20)
  
  // Petits logos en signature si disponibles
  if (logoMairieDataURL) {
    doc.addImage(logoMairieDataURL, 'PNG', 70, currentY + 8, 12, 12)
  }
  if (logoSIDDataURL) {
    doc.addImage(logoSIDDataURL, 'JPEG', pageWidth - 40, currentY + 8, 15, 12)
  }
    // Pied de page technique
  currentY += 28
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
