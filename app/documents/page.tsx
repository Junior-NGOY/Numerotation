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
import { getVehiculesForDocuments } from "@/actions/documents"
import { exportToExcelAdvanced, prepareVehiculeDataForExport, diagnosticVehiculeData, exportToExcelDetailed, exportVehiculesToday, exportVehiculesForSpecificDate, exportVehiculesForDateRange, generateDailyReport, exportVehiculesMultiSheetByDate } from "@/lib/excel-export"
import { generateVehiclePDF, generateMultiPagePDF } from "@/lib/pdf-generator-fixed"
import type { Vehicule } from "@/types/api"

export default function DocumentsPage() {
  const [selectedVehicule, setSelectedVehicule] = useState("")
  const [vehicules, setVehicules] = useState<Vehicule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [generatingPDF, setGeneratingPDF] = useState(false)

  // Filtrer les véhicules par période
  const filteredVehicules = vehicules.filter((v) => {
    if (!startDate || !endDate) return false
    const createdAt = new Date(v.createdAt)
    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999) // Inclure toute la journée de fin
    return createdAt >= start && createdAt <= end
  })

  // Charger les véhicules depuis le backend
  useEffect(() => {
    async function loadVehicules() {
      try {
        setLoading(true)
        setError(null)
        console.log('🚗 Chargement de tous les véhicules...')
        const response = await getVehiculesForDocuments()
        
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
      }
    }

    loadVehicules()
  }, [])

  const handleGeneratePDF = async () => {
    if (!selectedVehicule) {
      alert("Veuillez sélectionner un véhicule")
      return
    }

    const vehicule = vehicules.find(v => v.id === selectedVehicule)
    
    if (vehicule && vehicule.proprietaire) {
      try {
        await generateVehiclePDF(vehicule, vehicule.proprietaire)
      } catch (error) {
        console.error('Erreur lors de la génération du PDF:', error)
        alert("Erreur lors de la génération du PDF")
      }
    } else {
      alert("Impossible de générer le PDF - données manquantes")
    }
  }

  const handleGenerateMultiPagePDF = async () => {
    if (!startDate || !endDate) {
      alert("Veuillez sélectionner une période (date de début et date de fin)")
      return
    }

    if (filteredVehicules.length === 0) {
      alert("Aucun véhicule trouvé pour la période sélectionnée")
      return
    }

    try {
      setGeneratingPDF(true)
      console.log(`🚗 Génération d'un PDF avec ${filteredVehicules.length} véhicule(s)...`)

      // Préparer les données (véhicule + propriétaire)
      const vehiculesData = filteredVehicules
        .filter(v => v.proprietaire) // Garder seulement ceux qui ont un propriétaire
        .map(v => ({
          vehicule: v,
          proprietaire: v.proprietaire!
        }))

      if (vehiculesData.length === 0) {
        alert("Aucun véhicule avec propriétaire trouvé pour la période")
        return
      }

      // Générer le PDF multi-pages
      await generateMultiPagePDF(vehiculesData, startDate, endDate)
      
      alert(`✅ PDF généré avec succès ! ${vehiculesData.length} page(s)`)
    } catch (error) {
      console.error('Erreur lors de la génération du PDF multi-pages:', error)
      alert("Erreur lors de la génération du PDF multi-pages")
    } finally {
      setGeneratingPDF(false)
    }
  }

  const exportAllToExcel = () => {
    if (vehicules.length === 0) {
      alert("Aucun véhicule à exporter")
      return
    }
    
    // Diagnostic des données avant export
    diagnosticVehiculeData(vehicules)
    
    const excelData = prepareVehiculeDataForExport(vehicules)
    exportToExcelAdvanced(excelData, `vehicules_export_${new Date().toISOString().split("T")[0]}`)
  }

  const exportSelectedToExcel = () => {
    if (!selectedVehicule) {
      alert("Veuillez sélectionner un véhicule")
      return
    }

    const vehicule = vehicules.find(v => v.id === selectedVehicule)
    if (vehicule) {
      // Diagnostic des données avant export
      diagnosticVehiculeData([vehicule])
      
      const excelData = prepareVehiculeDataForExport([vehicule])
      exportToExcelAdvanced(
        excelData,
        `vehicule_${vehicule.numeroImmatriculation}_${new Date().toISOString().split("T")[0]}`,
      )
    }
  }

  // Nouvelles fonctions d'export par date
  const handleExportToday = () => {
    if (vehicules.length === 0) {
      alert("Aucune donnée à exporter")
      return
    }
    // Logique d'export pour aujourd'hui
  }

  const handleExportSpecificDate = (date: string) => {
    if (vehicules.length === 0) {
      alert("Aucune donnée à exporter")
      return
    }
    // Logique d'export pour une date spécifique
  }

  const handleExportDateRange = (startDate: string, endDate: string) => {
    if (vehicules.length === 0) {
      alert("Aucune donnée à exporter")
      return
    }
    // Logique d'export pour une plage de dates
  }

  const handleDailyReport = () => {
    if (vehicules.length === 0) {
      alert("Aucune donnée à exporter")
      return
    }
    // Logique pour générer le rapport quotidien
  }

  const handleMultiPeriodExport = () => {
    if (vehicules.length === 0) {
      alert("Aucune donnée à exporter")
      return
    }
    // Logique d'export multi-période
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
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

          {/* Nouvelle section : PDF Multi-Pages par Période */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                PDF Multi-Pages par Période
              </CardTitle>
              <CardDescription>
                Générez un seul fichier PDF contenant toutes les cartes roses des véhicules enregistrés dans une période donnée
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateDebut">Date de début</Label>
                  <input
                    id="dateDebut"
                    type="date"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFin">Date de fin</Label>
                  <input
                    id="dateFin"
                    type="date"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

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
                  <div className="flex flex-col items-center justify-center py-8 space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm font-medium">Chargement de tous les véhicules...</span>
                    <span className="text-xs text-muted-foreground">Cela peut prendre quelques secondes</span>
                  </div>
                ) : error ? (
                  <div className="text-red-600 p-4 bg-red-50 rounded-lg">
                    <p className="font-semibold">Erreur</p>
                    <p>{error}</p>
                  </div>
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
                  onClick={() => {
                    if (vehicules.length === 0) {
                      alert("Aucun véhicule à exporter")
                      return
                    }
                    diagnosticVehiculeData(vehicules)
                    exportToExcelDetailed(vehicules, `vehicules_complet`)
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
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mr-3" />
                  <span>Chargement des véhicules...</span>
                </div>
              ) : error ? (
                <div className="text-red-600 p-4 bg-red-50 rounded-lg">
                  <p className="font-semibold">Erreur lors du chargement</p>
                  <p>{error}</p>
                </div>
              ) : vehicules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucun véhicule enregistré dans le système</p>
                </div>
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
                      {vehicules.map((vehicule) => (
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
                                onClick={() => {
                                  const excelData = prepareVehiculeDataForExport([vehicule])
                                  exportToExcelAdvanced(excelData, `vehicule_${vehicule.numeroImmatriculation}`)
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
      </div>
    </AuthGuard>
  )
}
