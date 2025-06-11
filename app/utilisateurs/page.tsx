"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Users, Plus, Edit, Trash2, Shield, User, Loader2 } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { RoleGuard } from "@/components/role-guard"
import { ApiDataTable } from "@/components/api-data-table"
import { usePaginatedApiCall, useApiMutation } from "@/hooks/use-api"
import { getUsers, createUser, updateUser, deleteUser } from "@/actions/users"
import type { User as UserType, CreateUserForm, UpdateUserForm } from "@/types/api"

// Form interface for creating/editing users
type UserForm = CreateUserForm & { 
  confirmPassword?: string;
}

export default function UtilisateursPage() {
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const form = useForm<UserForm>()
  // API Hooks
  const {
    data: users,
    loading: loadingUsers,
    error: errorUsers,
    pagination,
    updateParams,
    refetch: refetchUsers
  } = usePaginatedApiCall(getUsers, { page: 1, limit: 10 })

  // Wrappers pour les mutations
  const createMutation = useApiMutation(async (params?: CreateUserForm) => {
    if (!params) throw new Error('Données requises pour la création')
    return createUser(params)
  })
  
  const updateMutation = useApiMutation(async (params?: { id: string; userData: UpdateUserForm }) => {
    if (!params) throw new Error('Données requises pour la mise à jour')
    return updateUser(params.id, params.userData)
  })
  
  const deleteMutation = useApiMutation(async (params?: string) => {
    if (!params) throw new Error('ID requis pour la suppression')
    return deleteUser(params)
  })
  const handleCreateUser = async (data: UserForm) => {
    const { confirmPassword, ...userData } = data
    const result = await createMutation.mutate(userData)
    if (result) {
      setIsCreateDialogOpen(false)
      form.reset()
      refetchUsers()
    }
  }

  const handleUpdateUser = async (data: UserForm) => {
    console.log('Submitting update user form with data:', data)
    if (!selectedUser) return
    // Pour la modification, on ne traite que les champs présents dans le formulaire d'édition
    const { confirmPassword, password, ...userData } = data
    console.log('Sending userData to API:', userData)
    const result = await updateMutation.mutate({
      id: selectedUser.id,
      userData
    })
    if (result) {
      console.log('Update successful:', result)
      setIsEditDialogOpen(false)
      setSelectedUser(null)
      form.reset()
      refetchUsers()
    } else {
      console.log('Update failed or returned no result')
    }
  }

  const handleDeleteUser = async (user: UserType) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.name} ?`)) {
      const result = await deleteMutation.mutate(user.id)
      if (result) {
        refetchUsers()
      }
    }
  }
  const openEditDialog = (user: UserType) => {
    console.log('Opening edit dialog for user:', user)
    setSelectedUser(user)
    form.reset({
      name: user.name,
      email: user.email,
      role: user.role,
    })
    console.log('Form values after reset:', form.getValues())
    setIsEditDialogOpen(true)
  }

  const handlePageChange = (page: number) => {
    updateParams({ page })
  }

  // Columns for the data table
  const columns = [
    {
      accessorKey: "user",
      header: "Utilisateur",
      cell: ({ row }: { row: { original: UserType } }) => {
        const user = row.original
        return (
          <div className="min-w-0">
            <p className="font-medium truncate">{user.name}</p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>
        )
      },
    },
    {
      accessorKey: "role",
      header: "Rôle",
      cell: ({ row }: { row: { original: UserType } }) => {
        const user = row.original
        return (
          <Badge variant={user.role === "ADMIN" ? "destructive" : "secondary"}>
            {user.role === "ADMIN" ? "Administrateur" : "Utilisateur"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "isActive",
      header: "Statut",
      cell: ({ row }: { row: { original: UserType } }) => {
        const user = row.original
        return (
          <Badge variant={user.isActive ? "default" : "outline"}>
            {user.isActive ? "Actif" : "Inactif"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "lastLogin",
      header: "Dernière Connexion",
      cell: ({ row }: { row: { original: UserType } }) => {
        const user = row.original
        return (
          <span className="text-sm">
            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString("fr-FR") : "Jamais connecté"}
          </span>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date Création",
      cell: ({ row }: { row: { original: UserType } }) => {
        const user = row.original
        return (
          <span className="text-sm">{new Date(user.createdAt).toLocaleDateString("fr-FR")}</span>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: UserType } }) => {
        const user = row.original
        return (
          <div className="flex flex-wrap gap-1">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => openEditDialog(user)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDeleteUser(user)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  // Calculate stats from real data
  const totalUsers = users?.length || 0
  const totalAdmins = users?.filter(u => u.role === "ADMIN").length || 0
  const activeUsers = users?.filter(u => u.isActive).length || 0

  return (    <AuthGuard>
      <RoleGuard allowedRoles={["ADMIN"]}>
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100">
          <div className="container mx-auto px-4 py-4 sm:py-8">
            <div className="mb-6">
              <Link href="/">
                <Button variant="outline" className="mb-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à l'accueil
                </Button>
              </Link>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Gestion des Utilisateurs</h1>
                  <p className="text-gray-600">Gérez les comptes utilisateurs du système</p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Nouvel Utilisateur
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                      <DialogDescription>
                        Remplissez les informations pour créer un nouveau compte
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom complet *</Label>
                        <Input
                          id="name"
                          {...form.register("name", { required: "Le nom est obligatoire" })}
                          placeholder="Nom et prénom"
                        />
                        {form.formState.errors.name && (
                          <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          {...form.register("email", {
                            required: "L'email est obligatoire",
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: "Email invalide",
                            },
                          })}
                          placeholder="email@exemple.com"
                        />
                        {form.formState.errors.email && (
                          <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role">Rôle *</Label>
                        <Select
                          onValueChange={(value: "ADMIN" | "USER") => form.setValue("role", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un rôle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">Administrateur</SelectItem>
                            <SelectItem value="USER">Utilisateur</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.formState.errors.role && (
                          <p className="text-red-500 text-sm">{form.formState.errors.role.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Mot de passe *</Label>
                        <Input
                          id="password"
                          type="password"
                          {...form.register("password", {
                            required: "Le mot de passe est obligatoire",
                            minLength: {
                              value: 6,
                              message: "Le mot de passe doit contenir au moins 6 caractères",
                            },
                          })}
                          placeholder="Mot de passe"
                        />
                        {form.formState.errors.password && (
                          <p className="text-red-500 text-sm">{form.formState.errors.password.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          {...form.register("confirmPassword", {
                            required: "Veuillez confirmer le mot de passe",
                            validate: (value) =>
                              value === form.watch("password") || "Les mots de passe ne correspondent pas",
                          })}
                          placeholder="Confirmer le mot de passe"
                        />
                        {form.formState.errors.confirmPassword && (
                          <p className="text-red-500 text-sm">{form.formState.errors.confirmPassword.message}</p>
                        )}
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          Annuler
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createMutation.loading}
                        >
                          {createMutation.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Créer
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Modifier l'utilisateur</DialogTitle>
                  <DialogDescription>
                    Modifiez les informations de l'utilisateur
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleUpdateUser)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nom complet *</Label>
                    <Input
                      id="edit-name"
                      {...form.register("name", { required: "Le nom est obligatoire" })}
                      placeholder="Nom et prénom"
                    />
                    {form.formState.errors.name && (
                      <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      {...form.register("email", {
                        required: "L'email est obligatoire",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Email invalide",
                        },
                      })}
                      placeholder="email@exemple.com"
                    />
                    {form.formState.errors.email && (
                      <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-role">Rôle *</Label>
                    <Select
                      onValueChange={(value: "ADMIN" | "USER") => form.setValue("role", value)}
                      value={form.watch("role")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Administrateur</SelectItem>
                        <SelectItem value="USER">Utilisateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateMutation.loading}
                    >
                      {updateMutation.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Modifier
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Utilisateurs</p>
                    <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Administrateurs</p>
                    <p className="text-2xl font-bold text-gray-900">{totalAdmins}</p>
                  </div>
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Utilisateurs Actifs</p>
                    <p className="text-2xl font-bold text-gray-900">{activeUsers}</p>
                  </div>
                  <User className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* Error Display */}
            {errorUsers && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">
                  Erreur lors du chargement des utilisateurs: {errorUsers}
                </p>
              </div>
            )}

            {/* Data Table */}            <ApiDataTable<UserType>
              data={users || []}
              columns={columns}
              loading={loadingUsers}
              pagination={pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }}
              onPageChange={handlePageChange}            />
          </div>
        </div>
      </RoleGuard>
    </AuthGuard>
  )
}
