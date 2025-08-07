"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, FileText, Download, FileSpreadsheet, Loader2 } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { DateExportOptions } from "@/components/date-export-options"
import { getVehiculesForDocuments } from "@/actions/documents"
import { exportToExcelAdvanced, prepareVehiculeDataForExport, diagnosticVehiculeData, exportToExcelDetailed, exportVehiculesToday, exportVehiculesForSpecificDate, exportVehiculesForDateRange, generateDailyReport, exportVehiculesMultiSheetByDate } from "@/lib/excel-export"
import { generateVehiclePDF } from "@/lib/pdf-generator-fixed"
import type { Vehicule } from "@/types/api"

export default function DocumentsPage() {
  const [selectedVehicule, setSelectedVehicule] = useState("")
  const [vehicules, setVehicules] = useState<Vehicule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les véhicules depuis le backend
  useEffect(() => {
    async function loadVehicules() {
      try {
        setLoading(true)
        setError(null)
        const response = await getVehiculesForDocuments()
        
        if (response.error) {
          setError(response.error)
        } else {
          // L'endpoint retourne une structure paginée avec data.items
          const vehiculesData = response.data?.items || []
          setVehicules(vehiculesData)
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
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Chargement des véhicules...</span>
                  </div>
                ) : error ? (
                  <div className="text-red-600 p-4 bg-red-50 rounded-lg">
                    <p className="font-semibold">Erreur</p>
                    <p>{error}</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Sélectionner un véhicule</Label>
                      <Select onValueChange={setSelectedVehicule} disabled={vehicules.length === 0}>
                        <SelectTrigger>
                          <SelectValue placeholder={vehicules.length === 0 ? "Aucun véhicule disponible" : "Choisir un véhicule"} />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicules.map((vehicule) => (
                            <SelectItem key={vehicule.id} value={vehicule.id}>
                              {vehicule.marque} {vehicule.modele} - {vehicule.numeroImmatriculation}
                              {vehicule.proprietaire && ` (${vehicule.proprietaire.prenom} ${vehicule.proprietaire.nom})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
