"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FileUpload } from "@/components/ui/file-upload"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Upload, User, Plus, Edit, Trash2, Eye, Search, FileText } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { ApiDataTable } from "@/components/api-data-table"
import DocumentEditor from "@/components/document-editor"
import { usePaginatedApiCall, useApiMutation } from "@/hooks/use-api"
import { useDebounce } from "@/hooks/use-debounce"
import { getProprietaires, createProprietaire, updateProprietaire, deleteProprietaire } from "@/actions/proprietaires"
import type { Proprietaire, CreateProprietaireForm } from "@/types/api"
import { toast } from "sonner"

export default function ProprietairesPage() {  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProprietaire, setEditingProprietaire] = useState<Proprietaire | null>(null)
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  // Débounce pour la recherche automatique (500ms de délai)
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Utilisation des hooks API avec wrappers pour gérer les types
  const {
    data: proprietaires,
    loading,
    error,
    pagination,
    updateParams,
    refetch
  } = usePaginatedApiCall(getProprietaires, { page: 1, limit: 10 })

  // Effet pour déclencher la recherche automatiquement
  useEffect(() => {
    updateParams({ search: debouncedSearchTerm, page: 1 })
  }, [debouncedSearchTerm, updateParams])
  // Wrappers pour les mutations
  const createMutation = useApiMutation(async (params?: { data: CreateProprietaireForm; file?: File }) => {
    if (!params) throw new Error('Données requises pour la création')
    return createProprietaire(params.data, params.file)
  })
  
  const updateMutation = useApiMutation(async (params?: { id: string; data: Partial<CreateProprietaireForm> }) => {
    if (!params) throw new Error('Données requises pour la mise à jour')
    return updateProprietaire(params.id, params.data)
  })
  
  const deleteMutation = useApiMutation(async (params?: string) => {
    if (!params) throw new Error('ID requis pour la suppression')
    return deleteProprietaire(params)
  })

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateProprietaireForm>()
  const onSubmit = async (data: CreateProprietaireForm) => {
    let result;
    
    if (editingProprietaire) {
      // Modification
      result = await updateMutation.mutate({ id: editingProprietaire.id, data })
    } else {
      // Création avec fichier optionnel
      const file = selectedFiles.length > 0 ? selectedFiles[0] : undefined
      result = await createMutation.mutate({ data, file })
    }

    if (result) {
      setIsDialogOpen(false)
      setEditingProprietaire(null)
      setSelectedFiles([])
      reset()
      refetch()
    } else {
      const errorMessage = editingProprietaire ? updateMutation.error : createMutation.error
      toast.error(errorMessage || "Une erreur est survenue")
    }
  }

  const handleEdit = (proprietaire: Proprietaire) => {
    setEditingProprietaire(proprietaire)
    setValue("nom", proprietaire.nom)
    setValue("prenom", proprietaire.prenom)
    setValue("adresse", proprietaire.adresse)
    setValue("telephone", proprietaire.telephone)
    setValue("numeroPiece", proprietaire.numeroPiece)
    setValue("typePiece", proprietaire.typePiece)
    setValue("lieuDelivrance", proprietaire.lieuDelivrance)
    setValue("dateDelivrance", proprietaire.dateDelivrance)
    setIsDialogOpen(true)
  }
  const handleDelete = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce propriétaire ?")) {
      const result = await deleteMutation.mutate(id)
      if (result) {
        refetch()
      } else {
        toast.error(deleteMutation.error || "Erreur lors de la suppression")
      }
    }
  }
  const handleSearch = () => {
    updateParams({ search: searchTerm, page: 1 })
  }
  
  const handlePageChange = (page: number) => {
    updateParams({ page })
  }

  const handleLimitChange = (limit: number) => {
    updateParams({ limit, page: 1 })
  }

  const getTypePieceLabel = (type: string) => {
    const labels = {
      'CARTE_IDENTITE': 'Carte d\'Identité',
      'PASSEPORT': 'Passeport',
      'PERMIS_SEJOUR': 'Permis de Séjour'
    }
    return labels[type as keyof typeof labels] || type
  }

  const columns = [
    {
      accessorKey: "nom",
      header: "Nom",
    },
    {
      accessorKey: "prenom", 
      header: "Prénom",
    },
    {
      accessorKey: "telephone",
      header: "Téléphone",
    },
    {
      accessorKey: "numeroPiece",
      header: "N° Pièce",
    },
    {
      accessorKey: "typePiece",
      header: "Type Pièce",
      cell: ({ row }: any) => (
        <Badge variant="outline">
          {getTypePieceLabel(row.original.typePiece)}
        </Badge>
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Gestion des Propriétaires</h1>
              <p className="text-gray-600">Enregistrement et gestion des propriétaires de véhicules</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingProprietaire(null)
                reset()
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Propriétaire
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProprietaire ? 'Modifier le Propriétaire' : 'Nouveau Propriétaire'}
                </DialogTitle>
                <DialogDescription>
                  {editingProprietaire 
                    ? 'Modifiez les informations du propriétaire'
                    : 'Enregistrez un nouveau propriétaire de véhicule'
                  }
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Informations personnelles */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informations Personnelles</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nom">Nom *</Label>
                        <Input
                          id="nom"
                          {...register("nom", { required: "Le nom est requis" })}
                          placeholder="Nom de famille"
                        />
                        {errors.nom && (
                          <p className="text-sm text-red-600 mt-1">{errors.nom.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="prenom">Prénom *</Label>
                        <Input
                          id="prenom"
                          {...register("prenom", { required: "Le prénom est requis" })}
                          placeholder="Prénom"
                        />
                        {errors.prenom && (
                          <p className="text-sm text-red-600 mt-1">{errors.prenom.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="adresse">Adresse *</Label>
                      <Textarea
                        id="adresse"
                        {...register("adresse", { required: "L'adresse est requise" })}
                        placeholder="Adresse complète"
                        rows={3}
                      />
                      {errors.adresse && (
                        <p className="text-sm text-red-600 mt-1">{errors.adresse.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="telephone">Téléphone *</Label>
                      <Input
                        id="telephone"
                        {...register("telephone", { required: "Le téléphone est requis" })}
                        placeholder="+33 6 12 34 56 78"
                      />
                      {errors.telephone && (
                        <p className="text-sm text-red-600 mt-1">{errors.telephone.message}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Documents d'identité */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pièce d'Identité</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="typePiece">Type de Pièce *</Label>
                        <Select onValueChange={(value) => setValue("typePiece", value as any)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CARTE_IDENTITE">Carte d'Identité</SelectItem>
                            <SelectItem value="PASSEPORT">Passeport</SelectItem>
                            <SelectItem value="PERMIS_SEJOUR">Permis de Séjour</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="numeroPiece">Numéro de Pièce *</Label>
                        <Input
                          id="numeroPiece"
                          {...register("numeroPiece", { required: "Le numéro de pièce est requis" })}
                          placeholder="Numéro"
                        />
                        {errors.numeroPiece && (
                          <p className="text-sm text-red-600 mt-1">{errors.numeroPiece.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="lieuDelivrance">Lieu de Délivrance *</Label>
                        <Input
                          id="lieuDelivrance"
                          {...register("lieuDelivrance", { required: "Le lieu de délivrance est requis" })}
                          placeholder="Ville/Pays"
                        />
                        {errors.lieuDelivrance && (
                          <p className="text-sm text-red-600 mt-1">{errors.lieuDelivrance.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="dateDelivrance">Date de Délivrance *</Label>
                        <Input
                          id="dateDelivrance"
                          type="date"
                          {...register("dateDelivrance", { required: "La date de délivrance est requise" })}
                        />
                        {errors.dateDelivrance && (
                          <p className="text-sm text-red-600 mt-1">{errors.dateDelivrance.message}</p>
                        )}
                      </div>
                    </div>                    {/* Upload/Gestion de documents */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Documents du propriétaire</h4>
                      {editingProprietaire ? (
                        // Mode édition: bouton pour ouvrir le gestionnaire
                        <Button 
                          type="button"
                          variant="outline" 
                          className="w-full"
                          onClick={() => setIsDocumentDialogOpen(true)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Gérer les documents du propriétaire
                        </Button>
                      ) : (
                        // Mode création: utiliser FileUpload simple
                        <FileUpload
                          onFileSelect={setSelectedFiles}
                          onFileRemove={(index) => {
                            setSelectedFiles(prev => prev.filter((_, i) => i !== index))
                          }}
                          selectedFiles={selectedFiles}
                          accept="image/*,.pdf"
                          multiple={false}
                          maxFiles={1}
                          maxSize={10}
                          label="Scan de la pièce d'identité (optionnel)"
                          description="Glissez-déposez une image ou PDF de la pièce d'identité"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.loading || updateMutation.loading}
                  >
                    {(createMutation.loading || updateMutation.loading) && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    )}
                    {editingProprietaire ? 'Modifier' : 'Enregistrer'}
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
                  placeholder="Rechercher par nom, prénom ou numéro de pièce..."
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

        {/* Table des propriétaires */}        <Card>
          <CardHeader>
            <CardTitle>Liste des Propriétaires</CardTitle>
            <CardDescription>
              {pagination?.total || 0} propriétaire(s) au total
            </CardDescription>
          </CardHeader>          <CardContent>            <ApiDataTable
              columns={columns}
              data={proprietaires || []}
              loading={loading}
              pagination={pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          </CardContent>        </Card>

        {/* Dialog séparé pour la gestion des documents */}
        <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gestion des Documents</DialogTitle>
              <DialogDescription>
                {editingProprietaire && 
                  `Gérez les documents du propriétaire ${editingProprietaire.prenom} ${editingProprietaire.nom}`
                }
              </DialogDescription>
            </DialogHeader>
            
            {editingProprietaire && (
              <DocumentEditor
                entityType="proprietaire"
                entityId={editingProprietaire.id}
                entityName={`${editingProprietaire.prenom} ${editingProprietaire.nom}`}
                compact={false}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  )
}
