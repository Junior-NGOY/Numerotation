"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Route, Plus, Edit, Trash2, Search, MapPin, Clock, Ruler } from "lucide-react"

// Type pour le formulaire local
interface ItineraireForm {
  nom: string;
  description?: string;
  distance?: number;
  duree?: number;
  isActive?: boolean;
}
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { ApiDataTable } from "@/components/api-data-table"
import { usePaginatedApiCall, useApiMutation } from "@/hooks/use-api"
import { 
  getItineraires, 
  createItineraire, 
  updateItineraire, 
  deleteItineraire,
  type CreateItineraireForm,
  type UpdateItineraireForm
} from "@/actions/itineraires"
import { type Itineraire } from "@/types/api"
import { toast } from "sonner"

export default function ItinerairesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItineraire, setEditingItineraire] = useState<Itineraire | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Form management
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ItineraireForm>()
  // API calls
  const { data, loading, error, refetch, pagination, updateParams } = usePaginatedApiCall(getItineraires, {
    page: 1,
    limit: 10,
    search: searchTerm
  })
  const createMutation = useApiMutation(async (params?: CreateItineraireForm) => {
    if (!params) throw new Error('Données requises pour la création')
    return createItineraire(params)
  })
  
  const updateMutation = useApiMutation(async (params?: { id: string; data: UpdateItineraireForm }) => {
    if (!params) throw new Error('Données requises pour la mise à jour')
    return updateItineraire(params.id, params.data)
  })
  
  const deleteMutation = useApiMutation(async (params?: string) => {
    if (!params) throw new Error('ID requis pour la suppression')
    return deleteItineraire(params)
  })
  // Search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateParams({ search: searchTerm, page: 1 })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, updateParams])

  const handleEdit = (itineraire: Itineraire) => {
    setEditingItineraire(itineraire)
    setValue("nom", itineraire.nom)
    setValue("description", itineraire.description || "")
    setValue("distance", itineraire.distance || undefined)
    setValue("duree", itineraire.duree || undefined)
    setValue("isActive", itineraire.isActive)
    setIsDialogOpen(true)
  }
  const handleDelete = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet itinéraire ?")) {
      const result = await deleteMutation.mutate(id)
      if (result) {
        refetch()
      }
    }
  }

  const onSubmit = async (data: ItineraireForm) => {
    try {
      if (editingItineraire) {
        const result = await updateMutation.mutate({ id: editingItineraire.id, data })
        if (result) {
          toast.success("Itinéraire mis à jour avec succès!")
        }
      } else {
        const { isActive, ...createData } = data
        const result = await createMutation.mutate(createData)
        if (result) {
          toast.success("Itinéraire créé avec succès!")
        }
      }
      
      setIsDialogOpen(false)
      setEditingItineraire(null)
      reset()
      refetch()
    } catch (error) {
      console.error("Erreur lors de la soumission:", error)
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingItineraire(null)
    reset()
  }

  // Table columns
  const columns = [
    {
      accessorKey: "nom",
      header: "Nom de l'itinéraire",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <Route className="h-4 w-4 text-blue-600" />
          <span className="font-medium">{row.original.nom}</span>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }: any) => (
        <span className="text-sm text-gray-600">
          {row.original.description || "Aucune description"}
        </span>
      ),
    },
    {
      accessorKey: "distance",
      header: "Distance",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-1">
          <Ruler className="h-3 w-3 text-green-600" />
          <span className="text-sm">
            {row.original.distance ? `${row.original.distance} km` : "Non spécifiée"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "duree",
      header: "Durée",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3 text-orange-600" />
          <span className="text-sm">
            {row.original.duree ? `${row.original.duree} min` : "Non spécifiée"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Statut",
      cell: ({ row }: any) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
    {
      accessorKey: "_count.vehicules",
      header: "Véhicules",
      cell: ({ row }: any) => (
        <Badge variant="outline">
          {row.original._count.vehicules} véhicule(s)
        </Badge>
      ),
    },
    {
      accessorKey: "createdBy.name",
      header: "Créé par",
      cell: ({ row }: any) => (
        <span className="text-sm text-gray-600">
          {row.original.createdBy.name}
        </span>
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
            disabled={deleteMutation.loading || row.original._count.vehicules > 0}
            title={row.original._count.vehicules > 0 ? "Impossible de supprimer un itinéraire utilisé par des véhicules" : "Supprimer l'itinéraire"}
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
        <div className="container mx-auto py-8">
          <div className="flex items-center mb-8">
            <Link href="/">
              <Button variant="outline" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Gestion des Itinéraires</h1>
          </div>
          <Card>
            <CardContent className="p-6">
              <p className="text-red-600">Une erreur est survenue lors du chargement des itinéraires.</p>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="outline" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Route className="h-8 w-8 mr-3 text-blue-600" />
                Gestion des Itinéraires
              </h1>
              <p className="text-gray-600 mt-1">
                Gérez les itinéraires pour l'enregistrement des véhicules
              </p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleDialogClose()}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel Itinéraire
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                  {editingItineraire ? 'Modifier l\'itinéraire' : 'Nouvel itinéraire'}
                </DialogTitle>
                <DialogDescription>
                  {editingItineraire 
                    ? 'Modifiez les informations de l\'itinéraire' 
                    : 'Ajoutez un nouvel itinéraire pour les véhicules'
                  }
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="nom">Nom de l'itinéraire *</Label>
                  <Input
                    id="nom"
                    {...register("nom", { required: "Le nom est requis" })}
                    placeholder="Ex: Parcours A - Centre Ville"
                  />
                  {errors.nom && (
                    <p className="text-sm text-red-600 mt-1">{errors.nom.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Description détaillée de l'itinéraire (optionnel)"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="distance">Distance (km)</Label>
                    <Input
                      id="distance"
                      type="number"
                      step="0.1"
                      {...register("distance", { 
                        valueAsNumber: true,
                        validate: value => !value || value > 0 || "La distance doit être positive"
                      })}
                      placeholder="0.0"
                    />
                    {errors.distance && (
                      <p className="text-sm text-red-600 mt-1">{errors.distance.message}</p>
                    )}
                  </div>                  <div>
                    <Label htmlFor="duree">Durée (min)</Label>
                    <Input
                      id="duree"
                      type="number"
                      {...register("duree", { 
                        valueAsNumber: true,
                        validate: value => !value || (typeof value === 'number' && value > 0) || "La durée doit être positive"
                      })}
                      placeholder="0"
                    />
                    {errors.duree && (
                      <p className="text-sm text-red-600 mt-1">{errors.duree.message}</p>
                    )}
                  </div>
                </div>

                {editingItineraire && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      {...register("isActive")}
                    />
                    <Label htmlFor="isActive">Itinéraire actif</Label>
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleDialogClose}
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
                    {editingItineraire ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Barre de recherche */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                placeholder="Rechercher un itinéraire par nom ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table des itinéraires */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Itinéraires</CardTitle>            <CardDescription>
              {pagination?.total || 0} itinéraire(s) au total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApiDataTable
              columns={columns}
              data={data || []}
              loading={loading}
              pagination={pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }}
              onPageChange={(page) => updateParams({ page })}
              onLimitChange={(limit) => updateParams({ limit, page: 1 })}
            />
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}
