/**
 * Lazy loader pour les fonctions PDF lourdes
 * Réduit la taille du bundle initial en chargeant les fonctions PDF uniquement quand nécessaire
 */

let pdfModule: typeof import("@/lib/pdf-generator-fixed") | null = null

/**
 * Charge dynamiquement le module PDF seulement quand nécessaire
 */
async function loadPDFModule() {
  if (!pdfModule) {
    pdfModule = await import("@/lib/pdf-generator-fixed")
  }
  return pdfModule
}

/**
 * Génère un PDF pour un seul véhicule (lazy-loaded)
 */
export async function lazyGenerateVehiclePDF(vehicule: any, proprietaire: any) {
  const module = await loadPDFModule()
  return module.generateVehiclePDF(vehicule, proprietaire)
}

/**
 * Génère un PDF multi-pages pour plusieurs véhicules (lazy-loaded)
 */
export async function lazyGenerateMultiPagePDF(
  vehicules: Array<{ vehicule: any; proprietaire: any }>,
  startDate?: string,
  endDate?: string
) {
  const module = await loadPDFModule()
  return module.generateMultiPagePDF(vehicules, startDate, endDate)
}
