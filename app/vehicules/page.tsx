"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import dynamic from "next/dynamic"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FileUpload } from "@/components/ui/file-upload"
import { Combobox } from "@/components/ui/combobox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Upload, Car, Plus, Edit, Trash2, Eye, Search, FileText } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { ApiDataTable } from "@/components/api-data-table"
import { usePaginatedApiCall, useApiMutation } from "@/hooks/use-api"
import { useDebounce } from "@/hooks/use-debounce"
import { getVehicules, createVehicule, updateVehicule, deleteVehicule } from "@/actions/vehicules"
import { getProprietaires } from "@/actions/proprietaires"
import { getActiveItineraires, ActiveItineraire } from "@/actions/itineraires"
import type { Vehicule, CreateVehiculeForm, Proprietaire, Itineraire } from "@/types/api"
import { toast } from "sonner"
import { formatPrice, getVehicleTypeDescription, calculateRegistrationPrice } from "@/lib/pricing-utils"
import { PageWrapper } from "@/components/page-wrapper"

// Dynamic imports pour optimiser le chargement
const DocumentEditor = dynamic(() => import("@/components/document-editor"), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>,
  ssr: false
})

export default function VehiculesPage() {  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVehicule, setEditingVehicule] = useState<Vehicule | null>(null)
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVehicleType, setSelectedVehicleType] = useState<'BUS' | 'MINI_BUS' | 'TAXI' | null>(null)
  const [viewingVehicule, setViewingVehicule] = useState<Vehicule | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [itineraires, setItineraires] = useState<ActiveItineraire[]>([])
  const [itinerairesLoading, setItinerairesLoading] = useState(false)

  // Débounce pour la recherche automatique (500ms de délai)
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  // Utilisation des hooks API avec le même pattern que propriétaires
  const {
    data: vehicules,
    loading,
    error,
    pagination,
    updateParams,
    refetch
  } = usePaginatedApiCall(getVehicules, { page: 1, limit: 10 })

  // Provide default pagination values to prevent undefined errors
  const safePagination = pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }

  // Effet pour déclencher la recherche automatiquement
  useEffect(() => {
    updateParams({ search: debouncedSearchTerm, page: 1 })
  }, [debouncedSearchTerm, updateParams])  // Récupérer TOUS les propriétaires pour le formulaire (sans limite)
  const [proprietaires, setProprietaires] = useState<Proprietaire[]>([])
  const [proprietairesLoading, setProprietairesLoading] = useState(true)
  const [proprietairesError, setProprietairesError] = useState<string | null>(null)
  
  // Charger tous les propriétaires au montage
  useEffect(() => {
    const loadAllProprietaires = async () => {
      setProprietairesLoading(true)
      setProprietairesError(null)
      
      try {
        // Charger avec une limite très élevée pour tout avoir
        const response = await getProprietaires({ page: 1, limit: 999999 })
        
        if (response.data?.items) {
          setProprietaires(response.data.items)
          console.log('✅ Propriétaires chargés:', response.data.items.length, 'sur', response.data.pagination.total)
        } else if (response.error) {
          setProprietairesError(response.error)
          console.error('❌ Erreur chargement propriétaires:', response.error)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
        setProprietairesError(errorMessage)
        console.error('❌ Erreur chargement propriétaires:', error)
      } finally {
        setProprietairesLoading(false)
      }
    }
    
    loadAllProprietaires()
  }, [])

  // Charger les itinéraires actifs
  useEffect(() => {
    const loadItineraires = async () => {
      setItinerairesLoading(true)
      try {
        const response = await getActiveItineraires()
        if (response.data) {
          setItineraires(response.data)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des itinéraires:", error)
      } finally {
        setItinerairesLoading(false)
      }
    }
    
    loadItineraires()
  }, [])

  // Wrappers pour les mutations afin de gérer les types correctement
  const createMutation = useApiMutation(async (params?: { data: CreateVehiculeForm; files?: File[] }) => {
    if (!params) throw new Error('Données requises pour la création')
    return createVehicule(params.data, params.files)
  })
  
  const updateMutation = useApiMutation(async (params?: { id: string; data: Partial<CreateVehiculeForm> }) => {
    if (!params) throw new Error('Données requises pour la mise à jour')
    return updateVehicule(params.id, params.data)
  })  
  
  const deleteMutation = useApiMutation(async (params?: string) => {
    if (!params) throw new Error('ID requis pour la suppression')
    return deleteVehicule(params)
  })

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateVehiculeForm>()
  const onSubmit = async (data: CreateVehiculeForm) => {
    let result;
    
    if (editingVehicule) {
      // Modification
      result = await updateMutation.mutate({ id: editingVehicule.id, data })
    } else {
      // Création avec fichiers optionnels
      const files = selectedFiles.length > 0 ? selectedFiles : undefined
      result = await createMutation.mutate({ data, files })
    }

    if (result) {
      setIsDialogOpen(false)
      setEditingVehicule(null)
      setSelectedFiles([])
      reset()
      refetch()
    } else {
      const errorMessage = editingVehicule ? updateMutation.error : createMutation.error
      toast.error(errorMessage || "Une erreur est survenue")
    }
  }

  const handleEdit = (vehicule: Vehicule) => {
    setEditingVehicule(vehicule)
    setValue("proprietaireId", vehicule.proprietaireId)
    setValue("marque", vehicule.marque)
    setValue("modele", vehicule.modele)
    setValue("typeVehicule", vehicule.typeVehicule)
    setValue("numeroImmatriculation", vehicule.numeroImmatriculation)
    setValue("numeroChassis", vehicule.numeroChassis)
    setValue("anneeFabrication", vehicule.anneeFabrication)
    setValue("capaciteAssises", vehicule.capaciteAssises)
    setValue("itineraireId", vehicule.itineraireId)
    setIsDialogOpen(true)
  }
  
  const handleDelete = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce véhicule ?")) {
      const result = await deleteMutation.mutate(id)
      if (result) {
        refetch()
      } else {
        toast.error(deleteMutation.error || "Erreur lors de la suppression")
      }
    }
  }
  const handlePageChange = (page: number) => {
    updateParams({ page })
  }

  const handleLimitChange = (limit: number) => {
    updateParams({ limit, page: 1 })
  }

  const getProprietaireNom = (proprietaireId: string) => {
    const proprietaire = proprietaires?.find((p: Proprietaire) => p.id === proprietaireId)
    return proprietaire ? `${proprietaire.prenom} ${proprietaire.nom}` : "Propriétaire inconnu"
  }
  
  const getTypeVehiculeLabel = (type: string) => {
    return getVehicleTypeDescription(type as any) || type
  }

  // Colonnes pour desktop
  const desktopColumns = [
    {
      accessorKey: "vehicule",
      header: "Véhicule",
      cell: ({ row }: any) => (
        <div className="min-w-0">
          <p className="font-medium truncate">
            {row.original.marque} {row.original.modele}
          </p>
          <p className="text-sm text-muted-foreground">
            {row.original.anneeFabrication} - {row.original.capaciteAssises} places
          </p>
        </div>
      ),
    },
    {
      accessorKey: "proprietaire", 
      header: "Propriétaire",
      cell: ({ row }: any) => (
        <p className="text-sm truncate">{getProprietaireNom(row.original.proprietaireId)}</p>
      ),
    },
    {
      accessorKey: "typeVehicule",
      header: "Type",
      cell: ({ row }: any) => (
        <Badge variant="outline">
          {getTypeVehiculeLabel(row.original.typeVehicule)}
        </Badge>
      ),
    },
    {
      accessorKey: "numeroImmatriculation",
      header: "Immatriculation",
      cell: ({ row }: any) => (
        <span className="font-mono text-sm">{row.original.numeroImmatriculation}</span>
      ),
    },
    {
      accessorKey: "codeUnique",
      header: "Code Unique",
      cell: ({ row }: any) => (
        <span className="font-mono text-xs">{row.original.codeUnique}</span>
      ),
    },
    {
      accessorKey: "prixEnregistrement",
      header: "Prix",
      cell: ({ row }: any) => (
        <div className="text-right">
          <span className="font-semibold text-green-600">
            {formatPrice(row.original.prixEnregistrement)}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewingVehicule(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row.original)}
            disabled={updateMutation.loading}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
            disabled={deleteMutation.loading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  // Colonnes pour mobile (version simplifiée)
  const mobileColumns = [
    {
      accessorKey: "vehicule",
      header: "Véhicule",
      cell: ({ row }: any) => (
        <div className="min-w-0">
          <p className="font-medium text-sm">
            {row.original.marque} {row.original.modele}
          </p>
          <p className="text-xs text-muted-foreground">
            {getTypeVehiculeLabel(row.original.typeVehicule)} - {row.original.anneeFabrication}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.original.numeroImmatriculation}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "prix",
      header: "Prix",
      cell: ({ row }: any) => (
        <div className="text-right">
          <span className="font-semibold text-green-600 text-sm">
            {formatPrice(row.original.prixEnregistrement)}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex flex-col space-y-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewingVehicule(row.original)}
            className="w-full"
          >
            <Eye className="h-3 w-3 mr-1" />
            <span className="text-xs">Voir</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row.original)}
            disabled={updateMutation.loading}
            className="w-full"
          >
            <Edit className="h-3 w-3 mr-1" />
            <span className="text-xs">Modifier</span>
          </Button>
        </div>
      ),
    },
  ]

  if (error) {
    return (
      <AuthGuard>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={refetch}>Réessayer</Button>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="w-fit">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Gestion des Véhicules</h1>
              <p className="text-sm sm:text-base text-gray-600">Enregistrement et gestion des véhicules de transport</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingVehicule(null)
                reset()
              }} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nouveau Véhicule</span>
                <span className="sm:hidden">Nouveau</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingVehicule ? 'Modifier le Véhicule' : 'Nouveau Véhicule'}
                </DialogTitle>
                <DialogDescription>
                  {editingVehicule 
                    ? 'Modifiez les informations du véhicule'
                    : 'Enregistrez un nouveau véhicule de transport'
                  }
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Informations du propriétaire */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Propriétaire</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="proprietaireId">Propriétaire *</Label>
                        {!proprietairesLoading && (
                          <span className="text-xs text-muted-foreground">
                            {proprietaires?.length || 0} disponible(s)
                          </span>
                        )}
                      </div>
                      
                      {/* Message d'erreur */}
                      {proprietairesError && (
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded mb-2">
                          <p className="font-semibold">Erreur de chargement:</p>
                          <p>{proprietairesError}</p>
                        </div>
                      )}
                      
                      {/* Message si aucun propriétaire */}
                      {!proprietairesLoading && !proprietairesError && (!proprietaires || proprietaires.length === 0) && (
                        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded mb-2">
                          <p className="font-semibold">Aucun propriétaire trouvé</p>
                          <p>Veuillez d'abord ajouter un propriétaire dans la section "Propriétaires".</p>
                        </div>
                      )}
                      
                      <Combobox
                        options={
                          proprietairesLoading 
                            ? [] 
                            : (proprietaires || []).map((proprietaire: Proprietaire) => ({
                                value: proprietaire.id,
                                label: `${proprietaire.prenom} ${proprietaire.nom}`,
                                searchText: `${proprietaire.prenom} ${proprietaire.nom} ${proprietaire.telephone} ${proprietaire.numeroPiece}`,
                              }))
                        }
                        value={watch("proprietaireId")}
                        onValueChange={(value) => setValue("proprietaireId", value)}
                        placeholder={
                          proprietairesLoading 
                            ? "Chargement des propriétaires..." 
                            : proprietaires && proprietaires.length > 0
                              ? "Sélectionner le propriétaire"
                              : "Aucun propriétaire disponible"
                        }
                        searchPlaceholder="Rechercher par nom, téléphone ou N° pièce..."
                        emptyText={
                          proprietaires && proprietaires.length === 0
                            ? "Aucun propriétaire trouvé. Ajoutez-en un d'abord."
                            : "Aucun résultat"
                        }
                        disabled={proprietairesLoading || !proprietaires || proprietaires.length === 0}
                      />
                      {errors.proprietaireId && (
                        <p className="text-sm text-red-600 mt-1">Le propriétaire est requis</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Informations du véhicule */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informations du Véhicule</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="marque">Marque *</Label>
                        <Input
                          id="marque"
                          {...register("marque", { required: "La marque est requise" })}
                          placeholder="Ex: Mercedes, Renault"
                        />
                        {errors.marque && (
                          <p className="text-sm text-red-600 mt-1">{errors.marque.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="modele">Modèle *</Label>
                        <Input
                          id="modele"
                          {...register("modele", { required: "Le modèle est requis" })}
                          placeholder="Ex: Sprinter, Master"
                        />
                        {errors.modele && (
                          <p className="text-sm text-red-600 mt-1">{errors.modele.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="typeVehicule">Type de Véhicule *</Label>
                      <Select onValueChange={(value) => {
                        setValue("typeVehicule", value as any)
                        setSelectedVehicleType(value as any)
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le type" />
                        </SelectTrigger>
                        <SelectContent>
                         {/*  <SelectItem value="BUS">Bus - {formatPrice(90000)}</SelectItem> */}
                          <SelectItem value="TAXI">Taxi - {formatPrice(50000)}</SelectItem>
                          <SelectItem value="MINI_BUS">Mini Bus - {formatPrice(60000)}</SelectItem>
                        </SelectContent>
                      </Select>
                      {selectedVehicleType && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-green-800">
                            <strong>Prix d'enregistrement :</strong> {formatPrice(calculateRegistrationPrice(selectedVehicleType))}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>                        <Label htmlFor="numeroImmatriculation">N° Immatriculation * (8 caractères)</Label>
                        <Input
                          id="numeroImmatriculation"
                          {...register("numeroImmatriculation", { 
                            required: "Le numéro d'immatriculation est requis",
                            pattern: {
                              value: /^[A-Z0-9]{8}$/i,
                              message: "Le numéro d'immatriculation doit contenir exactement 8 caractères (lettres et chiffres)"
                            }
                          })}
                          placeholder="Ex: 5518AQ12"
                          maxLength={8}
                          style={{ textTransform: 'uppercase' }}
                          onChange={(e) => {
                            // Transformer en majuscules et supprimer les espaces
                            const value = e.target.value.replace(/\s+/g, '').toUpperCase();
                            e.target.value = value;
                            // Déclencher la validation du formulaire
                            register("numeroImmatriculation").onChange(e);
                          }}
                        />
                        {errors.numeroImmatriculation && (
                          <p className="text-sm text-red-600 mt-1">{errors.numeroImmatriculation.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="numeroChassis">N° Châssis *</Label>
                        <Input
                          id="numeroChassis"
                          {...register("numeroChassis", { required: "Le numéro de châssis est requis" })}
                          placeholder="Numéro de châssis"
                        />
                        {errors.numeroChassis && (
                          <p className="text-sm text-red-600 mt-1">{errors.numeroChassis.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="anneeFabrication">Année de Fabrication *</Label>
                        <Input
                          id="anneeFabrication"
                          type="number"
                          min="1990"
                          max="2025"
                          {...register("anneeFabrication", { 
                            required: "L'année de fabrication est requise",
                            valueAsNumber: true 
                          })}
                          placeholder="Ex: 2020"
                        />
                        {errors.anneeFabrication && (
                          <p className="text-sm text-red-600 mt-1">{errors.anneeFabrication.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="capaciteAssises">Capacité (places) *</Label>
                        <Input
                          id="capaciteAssises"
                          type="number"
                          min="1"
                          {...register("capaciteAssises", { 
                            required: "La capacité est requise",
                            valueAsNumber: true 
                          })}
                          placeholder="Ex: 25"
                        />
                        {errors.capaciteAssises && (
                          <p className="text-sm text-red-600 mt-1">{errors.capaciteAssises.message}</p>
                        )}
                      </div>
                    </div>                    <div>                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="itineraireId">Itinéraire</Label>
                        <Link href="/itineraires">
                          <Button type="button" variant="outline" size="sm">
                            Gérer les itinéraires
                          </Button>
                        </Link>
                      </div>
                      <Combobox
                        options={
                          itinerairesLoading
                            ? []
                            : (itineraires || []).map((itineraire) => ({
                                value: itineraire.id,
                                label: itineraire.nom,
                                searchText: `${itineraire.nom} ${itineraire.description || ''} ${itineraire.distance || ''} ${itineraire.duree || ''}`,
                              }))
                        }
                        value={watch("itineraireId") || ""}
                        onValueChange={(value) => setValue("itineraireId", value)}
                        placeholder={itinerairesLoading ? "Chargement..." : "Sélectionnez un itinéraire"}
                        searchPlaceholder="Rechercher un itinéraire..."
                        emptyText="Aucun itinéraire trouvé"
                        disabled={itinerairesLoading}
                      />
                      {itinerairesLoading && (
                        <p className="text-sm text-gray-500 mt-1">Chargement des itinéraires...</p>
                      )}
                      {!itinerairesLoading && (!itineraires || itineraires.length === 0) && (
                        <p className="text-sm text-orange-600 mt-1">
                          Aucun itinéraire disponible. 
                          <Link href="/itineraires" className="underline ml-1">
                            Créez-en un
                          </Link>
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>                {/* Téléversement/Gestion de documents */}                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Documents du véhicule</CardTitle>
                    <CardDescription>
                      {editingVehicule 
                        ? 'Cliquez sur le bouton pour gérer les documents du véhicule'
                        : 'Uploadez les documents relatifs au véhicule (carte rose, permis de conduire, etc.)'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {editingVehicule ? (
                      // Mode édition: bouton pour ouvrir le gestionnaire dans un dialog séparé
                      <Button 
                        type="button"
                        variant="outline" 
                        className="w-full"
                        onClick={() => setIsDocumentDialogOpen(true)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Gérer les documents du véhicule
                      </Button>
                    ) : (
                      // Mode création: utiliser FileUpload simple
                      <FileUpload
                        onFileSelect={setSelectedFiles}
                        onFileRemove={(index) => {
                          setSelectedFiles(prev => prev.filter((_, i) => i !== index))
                        }}
                        selectedFiles={selectedFiles}
                        accept="image/*,.pdf,.doc,.docx"
                        multiple={true}
                        maxFiles={5}
                        maxSize={10}
                        label="Documents du véhicule (optionnel)"
                        description="Glissez-déposez des documents (carte rose, permis de conduire, etc.)"
                      />
                    )}
                  </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.loading || updateMutation.loading}
                    className="w-full sm:w-auto"
                  >
                    {(createMutation.loading || updateMutation.loading) && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    )}
                    {editingVehicule ? 'Modifier' : 'Enregistrer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>        {/* Barre de recherche */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par marque, modèle, immatriculation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {loading && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Recherche...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table des véhicules */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Véhicules</CardTitle>
            <CardDescription>
              {safePagination.total || 0} véhicule(s) au total
            </CardDescription>
          </CardHeader>
          <CardContent>            {/* Desktop table */}
            <div className="hidden md:block">
              <ApiDataTable
                columns={desktopColumns}
                data={vehicules || []}
                loading={loading}                pagination={safePagination}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
              />
            </div>
            
            {/* Mobile table */}
            <div className="md:hidden">
              <ApiDataTable
                columns={mobileColumns}
                data={vehicules || []}
                loading={loading}
                pagination={safePagination}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Dialog de détails */}
        <Dialog open={!!viewingVehicule} onOpenChange={() => setViewingVehicule(null)}>
          <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails du Véhicule</DialogTitle>
              <DialogDescription>
                {viewingVehicule && `${viewingVehicule.marque} ${viewingVehicule.modele}`}
              </DialogDescription>
            </DialogHeader>
            {viewingVehicule && (
              <div className="space-y-4">
                <div>
                  <Label className="font-semibold">Véhicule</Label>
                  <p>{viewingVehicule.marque} {viewingVehicule.modele} ({viewingVehicule.anneeFabrication})</p>
                </div>
                <div>
                  <Label className="font-semibold">Type</Label>
                  <p>{getTypeVehiculeLabel(viewingVehicule.typeVehicule)}</p>
                </div>
                <div>
                  <Label className="font-semibold">Propriétaire</Label>
                  <p>{getProprietaireNom(viewingVehicule.proprietaireId)}</p>
                </div>
                <div>
                  <Label className="font-semibold">Immatriculation</Label>
                  <p>{viewingVehicule.numeroImmatriculation}</p>
                </div>
                <div>
                  <Label className="font-semibold">Châssis</Label>
                  <p>{viewingVehicule.numeroChassis}</p>
                </div>
                <div>
                  <Label className="font-semibold">Capacité</Label>
                  <p>{viewingVehicule.capaciteAssises} places assises</p>
                </div>                <div>
                  <Label className="font-semibold">Itinéraire</Label>
                  <p>{viewingVehicule.itineraire?.nom || "Itinéraire non spécifié"}</p>
                  {viewingVehicule.itineraire?.description && (
                    <p className="text-sm text-gray-600">{viewingVehicule.itineraire.description}</p>
                  )}                  {(viewingVehicule.itineraire?.distance || viewingVehicule.itineraire?.duree) && (
                    <p className="text-sm text-gray-500">
                      {viewingVehicule.itineraire.distance && `${viewingVehicule.itineraire.distance} km`}
                      {viewingVehicule.itineraire.distance && viewingVehicule.itineraire.duree && " - "}
                      {viewingVehicule.itineraire.duree && `${viewingVehicule.itineraire.duree} min`}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="font-semibold">Code unique</Label>
                  <p>{viewingVehicule.codeUnique}</p>
                </div>
                <div>
                  <Label className="font-semibold">Prix d'enregistrement</Label>
                  <p className="font-semibold text-green-600">
                    {formatPrice(viewingVehicule.prixEnregistrement)}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>        </Dialog>

        {/* Dialog séparé pour la gestion des documents */}
        <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gestion des Documents</DialogTitle>
              <DialogDescription>
                {editingVehicule && 
                  `Gérez les documents du véhicule ${editingVehicule.marque} ${editingVehicule.modele} (${editingVehicule.numeroImmatriculation})`
                }
              </DialogDescription>
            </DialogHeader>
            
            {editingVehicule && (
              <DocumentEditor
                entityType="vehicule"
                entityId={editingVehicule.id}
                entityName={`${editingVehicule.marque} ${editingVehicule.modele} (${editingVehicule.numeroImmatriculation})`}
                compact={false}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  )
}
