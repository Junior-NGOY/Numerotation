import { toast as sonnerToast } from "sonner"

/**
 * Toast amélioré avec durées optimisées
 */
export const toast = {
  /**
   * Toast de succès
   */
  success: (message: string, description?: string) => {
    sonnerToast.success(message, {
      description,
      duration: 4000,
    })
  },

  /**
   * Toast d'erreur avec durée prolongée
   */
  error: (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
      duration: 6000,
    })
  },

  /**
   * Toast d'avertissement
   */
  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, {
      description,
      duration: 5000,
    })
  },

  /**
   * Toast d'information
   */
  info: (message: string, description?: string) => {
    sonnerToast.info(message, {
      description,
      duration: 4000,
    })
  },

  /**
   * Toast de chargement
   */
  loading: (message: string, description?: string) => {
    return sonnerToast.loading(message, {
      description,
    })
  },

  /**
   * Toast de promesse avec états automatiques
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      duration: 4000,
    })
  },

  /**
   * Rejeter un toast existant
   */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId)
  },
}

/**
 * Toasts contextuels prédéfinis pour l'application
 */
export const appToasts = {
  pdfGenerated: (vehicleCount: number, fileSize?: string) => {
    toast.success(
      "PDF généré avec succès",
      `${vehicleCount} véhicule${vehicleCount > 1 ? "s" : ""} exporté${vehicleCount > 1 ? "s" : ""}${fileSize ? ` (${fileSize})` : ""}`
    )
  },

  excelExported: (rows: number) => {
    toast.success(
      "Export Excel réussi",
      `${rows} ligne${rows > 1 ? "s" : ""} exportée${rows > 1 ? "s" : ""}`
    )
  },

  vehicleCreated: (immatriculation: string) => {
    toast.success(
      "Véhicule créé",
      `Le véhicule ${immatriculation} a été ajouté avec succès`
    )
  },

  vehicleUpdated: (immatriculation: string) => {
    toast.success(
      "Véhicule mis à jour",
      `Les modifications du véhicule ${immatriculation} ont été enregistrées`
    )
  },

  vehicleDeleted: () => {
    toast.success("Véhicule supprimé", "Le véhicule a été supprimé avec succès")
  },

  networkError: () => {
    toast.error(
      "Erreur de connexion",
      "Impossible de se connecter au serveur. Vérifiez votre connexion internet."
    )
  },

  serverError: (message?: string) => {
    toast.error(
      "Erreur serveur",
      message || "Une erreur s'est produite. Veuillez réessayer plus tard."
    )
  },

  validationError: (field: string) => {
    toast.warning(
      "Erreur de validation",
      `Le champ "${field}" contient des données invalides`
    )
  },

  noDataSelected: () => {
    toast.warning(
      "Aucune donnée sélectionnée",
      "Veuillez sélectionner au moins un élément"
    )
  },

  sessionExpired: () => {
    toast.error(
      "Session expirée",
      "Votre session a expiré. Veuillez vous reconnecter."
    )
  },

  copySuccess: () => {
    toast.success("Copié", "Le contenu a été copié dans le presse-papiers")
  },

  saveSuccess: () => {
    toast.success("Enregistré", "Les modifications ont été enregistrées")
  },

  deleteConfirm: (itemName: string) => {
    toast.warning(
      "Suppression confirmée",
      `${itemName} sera supprimé définitivement`
    )
  },
}
