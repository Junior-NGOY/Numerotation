/**
 * Utilitaires pour la gestion des prix d'enregistrement des véhicules côté frontend
 */

export type TypeVehicule = 'BUS' | 'MINI_BUS' | 'TAXI';

/**
 * Calcule le prix d'enregistrement en fonction du type de véhicule
 * @param typeVehicule - Type du véhicule (BUS, MINI_BUS, TAXI)
 * @returns Prix en francs CFA
 */
export function calculateRegistrationPrice(typeVehicule: TypeVehicule): number {
  const pricingMap: Record<TypeVehicule, number> = {
    BUS: 90000,      // 90,000 FC
    MINI_BUS: 60000, // 60,000 FC
    TAXI: 30000      // 30,000 FC
  };

  return pricingMap[typeVehicule];
}

/**
 * Formate le prix en francs CFA avec séparateur de milliers (points)
 * @param price - Prix à formater
 * @returns Prix formaté avec l'unité (ex: 90.000 FC)
 */
export function formatPrice(price: number): string {
  // Convertir le nombre en chaîne et ajouter des points comme séparateurs de milliers
  const formattedNumber = price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedNumber} FC`;
}

/**
 * Alias pour formatPrice - formate une devise en francs CFA
 * @param amount - Montant à formater
 * @returns Montant formaté avec l'unité
 */
export function formatCurrency(amount: number): string {
  return formatPrice(amount);
}

/**
 * Obtient la description du type de véhicule
 * @param typeVehicule - Type du véhicule
 * @returns Description lisible du type
 */
export function getVehicleTypeDescription(typeVehicule: TypeVehicule): string {
  const descriptions: Record<TypeVehicule, string> = {
    BUS: 'Bus',
    MINI_BUS: 'Mini Bus',
    TAXI: 'Taxi'
  };

  return descriptions[typeVehicule];
}

/**
 * Obtient tous les types de véhicules avec leurs prix
 * @returns Array des types avec prix et descriptions
 */
export function getAllVehicleTypes() {
  return [
    {
      type: 'BUS' as TypeVehicule,
      description: 'Bus',
      price: 90000,
      formattedPrice: formatPrice(90000)
    },
    {
      type: 'MINI_BUS' as TypeVehicule,
      description: 'Mini Bus',
      price: 60000,
      formattedPrice: formatPrice(60000)
    },
    {
      type: 'TAXI' as TypeVehicule,
      description: 'Taxi',
      price: 30000,
      formattedPrice: formatPrice(30000)
    }
  ];
}
