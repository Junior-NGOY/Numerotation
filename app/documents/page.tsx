"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, FileText, Download, FileSpreadsheet, Loader2 } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { DateExportOptions } from "@/components/date-export-options"
import { getVehiculesForDocuments, type ProgressCallback } from "@/actions/documents"
import { LoadingProgress } from "@/components/loading-progress"
import { PageWrapper } from "@/components/page-wrapper"
import { preloadLogos } from "@/lib/logo-cache"
import { TableSkeleton, VehicleCardSkeleton } from "@/components/skeleton-loaders"
import { NoVehiclesFound, NoDataInRange, ErrorState } from "@/components/empty-state"
import { toast, appToasts } from "@/lib/toast"
import type { Vehicule } from "@/types/api"

export default function DocumentsPage() {
  const [selectedVehicule, setSelectedVehicule] = useState("")
  const [vehicules, setVehicules] = useState<Vehicule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("ALL")
  const [generatingPDF, setGeneratingPDF] = useState(false)
  
  // État pour la barre de progression du chargement des véhicules
  const [loadingProgress, setLoadingProgress] = useState<{
    current: number
    total: number
    percentage: number
    loaded: number
    message: string
  } | null>(null)

  // État pour la barre de progression de génération PDF
  const [pdfProgress, setPdfProgress] = useState<{
    current: number
    total: number
    percentage: number
    message: string
  } | null>(null)

  // Filtrer les véhicules par période ET par type
  const filteredVehicules = vehicules.filter((v) => {
    // Filtre par période
    if (startDate && endDate) {
      const createdAt = new Date(v.createdAt)
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999) // Inclure toute la journée de fin
      if (!(createdAt >= start && createdAt <= end)) {
        return false
      }
    }
    
    // Filtre par type de véhicule
    if (selectedVehicleType !== "ALL" && v.typeVehicule !== selectedVehicleType) {
      return false
    }
    
    return true
  })

  // Statistiques par type
  const vehicleStats = {
    ALL: vehicules.length,
    BUS: vehicules.filter(v => v.typeVehicule === 'BUS').length,
    MINI_BUS: vehicules.filter(v => v.typeVehicule === 'MINI_BUS').length,
    TAXI: vehicules.filter(v => v.typeVehicule === 'TAXI').length,
  }

  // Précharger les logos au montage du composant
  useEffect(() => {
    preloadLogos().catch((error) => {
      console.error('Erreur lors du préchargement des logos:', error)
    })
  }, [])

  // Charger les véhicules depuis le backend avec barre de progression
  useEffect(() => {
    async function loadVehicules() {
      try {
        setLoading(true)
        setError(null)
        console.log('🚗 Chargement de tous les véhicules...')
        
        // Callback de progression
        const onProgress: ProgressCallback = (progress) => {
          setLoadingProgress(progress)
        }
        
        const response = await getVehiculesForDocuments(onProgress)
        
        if (response.error) {
          setError(response.error)
        } else {
          // L'endpoint retourne une structure paginée avec data.items
          const vehiculesData = response.data?.items || []
          setVehicules(vehiculesData)
          console.log(`✅ ${vehiculesData.length} véhicule(s) chargé(s)`)
        }
      } catch (err) {
        setError("Erreur lors du chargement des véhicules")
        console.error("Erreur:", err)
      } finally {
        setLoading(false)
        // Garder l'indicateur visible un moment avant de le masquer
        setTimeout(() => setLoadingProgress(null), 1500)
      }
    }

    loadVehicules()
  }, [])

  const handleGeneratePDF = async () => {
    if (!selectedVehicule) {
      appToasts.noDataSelected()
      return
    }

    const vehicule = vehicules.find(v => v.id === selectedVehicule)
    
    if (vehicule && vehicule.proprietaire) {
      const loadingToast = toast.loading("Génération du PDF en cours...")
      try {
        // Import dynamique du générateur PDF
        const { generateVehiclePDF } = await import("@/lib/pdf-generator-fixed")
        await generateVehiclePDF(vehicule, vehicule.proprietaire)
        toast.dismiss(loadingToast)
        toast.success(
          "PDF généré avec succès",
          `Document pour ${vehicule.numeroImmatriculation}`
        )
      } catch (error) {
        toast.dismiss(loadingToast)
        appToasts.serverError("Erreur lors de la génération du PDF")
        console.error('Erreur lors de la génération du PDF:', error)
      }
    } else {
      toast.error("Données manquantes", "Impossible de générer le PDF - propriétaire non disponible")
    }
  }

  const handleGenerateMultiPagePDF = async () => {
    if (!startDate || !endDate) {
      toast.warning("Dates manquantes", "Veuillez sélectionner une période (date de début et date de fin)")
      return
    }

    if (filteredVehicules.length === 0) {
      toast.warning("Aucune donnée", "Aucun véhicule trouvé pour la période sélectionnée")
      return
    }

    try {
      setGeneratingPDF(true)
      setPdfProgress({
        current: 0,
        total: filteredVehicules.length,
        percentage: 0,
        message: 'Initialisation...'
      })
      
      console.log(`🚗 Génération d'un PDF avec ${filteredVehicules.length} véhicule(s)...`)

      // Préparer les données (véhicule + propriétaire)
      const vehiculesData = filteredVehicules
        .filter(v => v.proprietaire) // Garder seulement ceux qui ont un propriétaire
        .map(v => ({
          vehicule: v,
          proprietaire: v.proprietaire!
        }))

      if (vehiculesData.length === 0) {
        toast.error("Données manquantes", "Aucun véhicule avec propriétaire trouvé pour la période")
        return
      }

      // Import dynamique du générateur PDF
      const { generateMultiPagePDF } = await import("@/lib/pdf-generator-fixed")
      
      // Générer le PDF multi-pages avec callback de progression
      await generateMultiPagePDF(vehiculesData, startDate, endDate, (progress) => {
        setPdfProgress({
          current: progress.current,
          total: progress.total,
          percentage: progress.percentage,
          message: progress.message
        })
      })
      
      // Succès final
      setPdfProgress({
        current: vehiculesData.length,
        total: vehiculesData.length,
        percentage: 100,
        message: `✅ PDF généré avec succès ! ${vehiculesData.length} page(s)`
      })
      
      // Toast de succès
      appToasts.pdfGenerated(vehiculesData.length)
      
      // Masquer la progression après 2 secondes
      setTimeout(() => setPdfProgress(null), 2000)
    } catch (error) {
      console.error('Erreur lors de la génération du PDF multi-pages:', error)
      setPdfProgress(null)
      appToasts.serverError("Erreur lors de la génération du PDF multi-pages")
    } finally {
      setGeneratingPDF(false)
    }
  }

  const exportAllToExcel = async () => {
    if (vehicules.length === 0) {
      appToasts.noDataSelected()
      return
    }
    
    const loadingToast = toast.loading("Préparation de l'export Excel...")
    
    try {
      // Import dynamique des fonctions Excel
      const { diagnosticVehiculeData, prepareVehiculeDataForExport, exportToExcelAdvanced } = await import("@/lib/excel-export")
      
      // Diagnostic des données avant export
      diagnosticVehiculeData(vehicules)
      
      const excelData = prepareVehiculeDataForExport(vehicules)
      exportToExcelAdvanced(excelData, `vehicules_export_${new Date().toISOString().split("T")[0]}`)
      
      toast.dismiss(loadingToast)
      appToasts.excelExported(vehicules.length)
    } catch (error) {
      toast.dismiss(loadingToast)
      appToasts.serverError("Erreur lors de l'export Excel")
    }
  }

  const exportSelectedToExcel = async () => {
    if (!selectedVehicule) {
      appToasts.noDataSelected()
      return
    }

    const vehicule = vehicules.find(v => v.id === selectedVehicule)
    if (vehicule) {
      const loadingToast = toast.loading("Préparation de l'export Excel...")
      
      try {
        // Import dynamique des fonctions Excel
        const { diagnosticVehiculeData, prepareVehiculeDataForExport, exportToExcelAdvanced } = await import("@/lib/excel-export")
        
        // Diagnostic des données avant export
        diagnosticVehiculeData([vehicule])
        
        const excelData = prepareVehiculeDataForExport([vehicule])
        exportToExcelAdvanced(
          excelData,
          `vehicule_${vehicule.numeroImmatriculation}_${new Date().toISOString().split("T")[0]}`,
        )
        
        toast.dismiss(loadingToast)
        appToasts.excelExported(1)
      } catch (error) {
        toast.dismiss(loadingToast)
        appToasts.serverError("Erreur lors de l'export Excel")
      }
    }
  }

  // Nouvelles fonctions d'export par date
  const handleExportToday = () => {
    if (vehicules.length === 0) {
      appToasts.noDataSelected()
      return
    }
    toast.info("Export en cours", "Export des véhicules du jour...")
  }

  const handleExportSpecificDate = (date: string) => {
    if (vehicules.length === 0) {
      appToasts.noDataSelected()
      return
    }
    toast.info("Export en cours", `Export des véhicules du ${date}...`)
  }

  const handleExportDateRange = (startDate: string, endDate: string) => {
    if (vehicules.length === 0) {
      appToasts.noDataSelected()
      return
    }
    toast.info("Export en cours", `Export de la période ${startDate} - ${endDate}...`)
  }

  const handleDailyReport = () => {
    if (vehicules.length === 0) {
      appToasts.noDataSelected()
      return
    }
    toast.info("Rapport en cours", "Génération du rapport quotidien...")
  }

  const handleMultiPeriodExport = () => {
    if (vehicules.length === 0) {
      appToasts.noDataSelected()
      return
    }
    toast.info("Export multi-période", "Génération de l'export multi-période...")
  }

  return (
    <AuthGuard>
      <PageWrapper className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link href="/">
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Génération de Documents</h1>
            <p className="text-gray-600">Générez les documents PDF et Excel pour les véhicules enregistrés</p>
          </div>

          {/* Barre de progression pendant le chargement des véhicules */}
          {loadingProgress && (
            <div className="mb-8">
              <LoadingProgress
                current={loadingProgress.current}
                total={loadingProgress.total}
                percentage={loadingProgress.percentage}
                loaded={loadingProgress.loaded}
                message={loadingProgress.message}
                status={loadingProgress.percentage === 100 ? 'success' : 'loading'}
              />
            </div>
          )}

          {/* Barre de progression pendant la génération PDF */}
          {pdfProgress && (
            <div className="mb-8">
              <LoadingProgress
                current={pdfProgress.current}
                total={pdfProgress.total}
                percentage={pdfProgress.percentage}
                message={pdfProgress.message}
                status={pdfProgress.percentage === 100 ? 'success' : 'loading'}
              />
            </div>
          )}

          {/* Filtres et statistiques */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
              <CardDescription>
                Filtrez les véhicules par type et période
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Filtre par type */}
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Type de véhicule</Label>
                  <Select value={selectedVehicleType} onValueChange={setSelectedVehicleType}>
                    <SelectTrigger id="vehicleType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tous les types ({vehicleStats.ALL})</SelectItem>
                      <SelectItem value="BUS">🚌 Bus ({vehicleStats.BUS})</SelectItem>
                      <SelectItem value="MINI_BUS">🚐 Mini Bus ({vehicleStats.MINI_BUS})</SelectItem>
                      <SelectItem value="TAXI">🚕 Taxi ({vehicleStats.TAXI})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date de début */}
                <div className="space-y-2">
                  <Label htmlFor="filterStartDate">Date de début</Label>
                  <input
                    id="filterStartDate"
                    type="date"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Date de fin */}
                <div className="space-y-2">
                  <Label htmlFor="filterEndDate">Date de fin</Label>
                  <input
                    id="filterEndDate"
                    type="date"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Résumé */}
                <div className="flex items-end">
                  <div className="w-full p-3 bg-primary/10 rounded-md">
                    <p className="text-xs text-muted-foreground mb-1">Résultat du filtre</p>
                    <p className="text-2xl font-bold text-primary">{filteredVehicules.length}</p>
                    <p className="text-xs text-muted-foreground">véhicule{filteredVehicules.length > 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nouvelle section : PDF Multi-Pages */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Génération PDF Multi-Pages
              </CardTitle>
              <CardDescription>
                Générez un seul fichier PDF contenant toutes les notes des véhicules filtrés
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              <Button 
                onClick={handleGenerateMultiPagePDF} 
                className="w-full" 
                disabled={loading || !startDate || !endDate || generatingPDF}
              >
                {generatingPDF ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Générer PDF Multi-Pages ({filteredVehicules.length} véhicule{filteredVehicules.length > 1 ? 's' : ''})
                  </>
                )}
              </Button>

              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <p className="font-semibold mb-2">ℹ️ À propos :</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Un seul fichier PDF sera généré avec une page par véhicule</li>
                  <li>Chaque page conserve le format original de la note</li>
                  <li>Les véhicules sont filtrés selon leur date d'enregistrement (createdAt)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Sélection et génération PDF */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Formulaire PDF Complet
                </CardTitle>
                <CardDescription>
                  Document PDF avec toutes les informations du propriétaire et du véhicule
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                      <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
                    </div>
                    <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
                  </div>
                ) : error ? (
                  <ErrorState 
                    error={error} 
                    onRetry={() => {
                      setError(null)
                      setLoading(true)
                    }} 
                  />
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Sélectionner un véhicule</Label>
                        <span className="text-xs text-muted-foreground">
                          {vehicules.length} véhicule{vehicules.length > 1 ? 's' : ''} disponible{vehicules.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <Combobox
                        options={vehicules.map((vehicule) => ({
                          value: vehicule.id,
                          label: `${vehicule.marque} ${vehicule.modele} - ${vehicule.numeroImmatriculation}${vehicule.proprietaire ? ` (${vehicule.proprietaire.prenom} ${vehicule.proprietaire.nom})` : ''}`,
                          searchText: `${vehicule.marque} ${vehicule.modele} ${vehicule.numeroImmatriculation} ${vehicule.codeUnique} ${vehicule.proprietaire ? `${vehicule.proprietaire.prenom} ${vehicule.proprietaire.nom} ${vehicule.proprietaire.telephone}` : ''}`,
                        }))}
                        value={selectedVehicule}
                        onValueChange={setSelectedVehicule}
                        placeholder={vehicules.length === 0 ? "Aucun véhicule disponible" : "Choisir un véhicule"}
                        searchPlaceholder="Rechercher par marque, modèle, immatriculation, code ou propriétaire..."
                        emptyText="Aucun véhicule trouvé"
                        disabled={vehicules.length === 0}
                      />
                    </div>

                    <Button onClick={handleGeneratePDF} className="w-full" disabled={!selectedVehicule}>
                      <Download className="h-4 w-4 mr-2" />
                      Générer PDF Complet
                    </Button>
                  </>
                )}

                <div className="text-sm text-gray-600">
                  <p className="font-semibold mb-2">Le document PDF contiendra :</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Informations complètes du propriétaire</li>
                    <li>Détails techniques du véhicule</li>
                    <li>Copies des documents annexes</li>
                    <li>Date et lieu d'enregistrement</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Export Excel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileSpreadsheet className="h-5 w-5 mr-2" />
                  Export Excel
                </CardTitle>
                <CardDescription>Exportez les données des véhicules au format Excel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={exportAllToExcel} 
                  className="w-full" 
                  variant="outline"
                  disabled={loading || vehicules.length === 0}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exporter Tous les Véhicules ({vehicules.length})
                </Button>

                <Button 
                  onClick={async () => {
                    if (vehicules.length === 0) {
                      appToasts.noDataSelected()
                      return
                    }
                    const loadingToast = toast.loading("Préparation de l'export détaillé...")
                    try {
                      // Import dynamique des fonctions Excel
                      const { diagnosticVehiculeData, exportToExcelDetailed } = await import("@/lib/excel-export")
                      
                      diagnosticVehiculeData(vehicules)
                      exportToExcelDetailed(vehicules, `vehicules_complet`)
                      
                      toast.dismiss(loadingToast)
                      appToasts.excelExported(vehicules.length)
                    } catch (error) {
                      toast.dismiss(loadingToast)
                      appToasts.serverError("Erreur lors de l'export détaillé")
                    }
                  }} 
                  className="w-full" 
                  variant="default"
                  disabled={loading || vehicules.length === 0}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Détaillé Multi-Feuilles
                </Button>
              </CardContent>
            </Card>

            {/* Options d'export par date */}
            <DateExportOptions 
              vehiculesWithProprietaires={vehicules}
              proprietaires={[]} // TODO: Charger les propriétaires si nécessaire
              disabled={loading || vehicules.length === 0}
            />
          </div>

          {/* Liste des véhicules */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des Véhicules Enregistrés</CardTitle>
              <CardDescription>
                Aperçu de tous les véhicules dans le système
                {!loading && ` (${vehicules.length} véhicule${vehicules.length > 1 ? 's' : ''})`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton rows={8} columns={8} />
              ) : error ? (
                <ErrorState 
                  error={error} 
                  onRetry={() => {
                    setError(null)
                    setLoading(true)
                  }} 
                />
              ) : vehicules.length === 0 ? (
                <NoVehiclesFound 
                  onReset={() => {
                    setStartDate("")
                    setEndDate("")
                    setSelectedVehicleType("ALL")
                  }} 
                />
              ) : filteredVehicules.length === 0 ? (
                <NoDataInRange 
                  onAdjust={() => {
                    setStartDate("")
                    setEndDate("")
                    setSelectedVehicleType("ALL")
                  }} 
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Propriétaire</TableHead>
                        <TableHead>Véhicule</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Immatriculation</TableHead>
                        <TableHead>Code Unique</TableHead>
                        <TableHead>Adresse</TableHead>
                        <TableHead>Itinéraire</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVehicules.map((vehicule) => (
                        <TableRow key={vehicule.id}>
                          <TableCell>
                            <div>
                              {vehicule.proprietaire ? (
                                <>
                                  <p className="font-medium">
                                    {vehicule.proprietaire.prenom} {vehicule.proprietaire.nom}
                                  </p>
                                  <p className="text-sm text-gray-500">{vehicule.proprietaire.telephone}</p>
                                  <p className="text-xs text-gray-400">
                                    {vehicule.proprietaire.typePiece}: {vehicule.proprietaire.numeroPiece}
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm text-gray-500">Propriétaire non disponible</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {vehicule.marque} {vehicule.modele}
                              </p>
                              <p className="text-sm text-gray-500">{vehicule.anneeFabrication}</p>
                            </div>
                          </TableCell>
                          <TableCell>{vehicule.typeVehicule}</TableCell>
                          <TableCell className="font-mono">{vehicule.numeroImmatriculation}</TableCell>
                          <TableCell className="font-mono text-sm">{vehicule.codeUnique}</TableCell>
                          <TableCell className="text-sm">
                            {vehicule.proprietaire?.adresse || 'Non spécifiée'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {vehicule.itineraire?.nom || 'Non spécifié'}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedVehicule(vehicule.id)
                                  setTimeout(() => handleGeneratePDF(), 100) // Petit délai pour que la sélection soit prise en compte
                                }}
                                disabled={!vehicule.proprietaire}
                              >
                                PDF
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  const loadingToast = toast.loading("Export Excel...")
                                  try {
                                    // Import dynamique des fonctions Excel
                                    const { prepareVehiculeDataForExport, exportToExcelAdvanced } = await import("@/lib/excel-export")
                                    
                                    const excelData = prepareVehiculeDataForExport([vehicule])
                                    exportToExcelAdvanced(excelData, `vehicule_${vehicule.numeroImmatriculation}`)
                                    
                                    toast.dismiss(loadingToast)
                                    appToasts.excelExported(1)
                                  } catch (error) {
                                    toast.dismiss(loadingToast)
                                    appToasts.serverError("Erreur lors de l'export")
                                  }
                                }}
                              >
                                Excel
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    </AuthGuard>
  )
}
