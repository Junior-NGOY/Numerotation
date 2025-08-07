"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalendarDays, FileSpreadsheet, Calendar, BarChart3 } from "lucide-react"
import { toast } from "sonner"
import { 
  exportVehiculesToday, 
  exportVehiculesForSpecificDate, 
  exportVehiculesForDateRange, 
  generateDailyReport, 
  exportVehiculesMultiSheetByDate 
} from "@/lib/excel-export"

interface DateExportOptionsProps {
  vehiculesWithProprietaires: any[]
  proprietaires: any[]
  disabled?: boolean
}

export function DateExportOptions({ vehiculesWithProprietaires, proprietaires, disabled = false }: DateExportOptionsProps) {
  const [specificDate, setSpecificDate] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const handleExportToday = () => {
    if (vehiculesWithProprietaires.length === 0) {
      toast.error("Aucune donnée à exporter")
      return
    }
    exportVehiculesToday(vehiculesWithProprietaires)
    toast.success("Export des véhicules d'aujourd'hui en cours...")
  }

  const handleExportSpecificDate = () => {
    if (!specificDate) {
      toast.error("Veuillez sélectionner une date")
      return
    }
    if (vehiculesWithProprietaires.length === 0) {
      toast.error("Aucune donnée à exporter")
      return
    }
    exportVehiculesForSpecificDate(vehiculesWithProprietaires, specificDate)
    toast.success(`Export des véhicules du ${new Date(specificDate).toLocaleDateString('fr-FR')} en cours...`)
  }

  const handleExportDateRange = () => {
    if (!startDate || !endDate) {
      toast.error("Veuillez sélectionner une période complète")
      return
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("La date de début doit être antérieure à la date de fin")
      return
    }
    if (vehiculesWithProprietaires.length === 0) {
      toast.error("Aucune donnée à exporter")
      return
    }
    exportVehiculesForDateRange(vehiculesWithProprietaires, startDate, endDate)
    const startDateStr = new Date(startDate).toLocaleDateString('fr-FR')
    const endDateStr = new Date(endDate).toLocaleDateString('fr-FR')
    toast.success(`Export des véhicules du ${startDateStr} au ${endDateStr} en cours...`)
  }

  const handleDailyReport = () => {
    if (vehiculesWithProprietaires.length === 0) {
      toast.error("Aucune donnée à exporter")
      return
    }
    generateDailyReport(vehiculesWithProprietaires, proprietaires)
    toast.success("Génération du rapport quotidien en cours...")
  }

  const handleMultiPeriodExport = () => {
    if (vehiculesWithProprietaires.length === 0) {
      toast.error("Aucune donnée à exporter")
      return
    }
    exportVehiculesMultiSheetByDate(vehiculesWithProprietaires, proprietaires, {
      includeToday: true,
      includeWeek: true,
      includeMonth: true
    })
    toast.success("Export multi-périodes en cours...")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Exports par Date
        </CardTitle>
        <CardDescription>
          Exportez les données filtrées par période (aujourd'hui, date spécifique, ou plage de dates)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export du jour */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Export du jour</Label>
          <Button 
            onClick={handleExportToday} 
            disabled={disabled}
            className="w-full"
            variant="outline"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Véhicules d'aujourd'hui
          </Button>
        </div>

        {/* Export date spécifique */}
        <div className="space-y-2">
          <Label htmlFor="specific-date" className="text-sm font-medium">
            Export pour une date spécifique
          </Label>
          <div className="flex gap-2">
            <Input
              id="specific-date"
              type="date"
              value={specificDate}
              onChange={(e) => setSpecificDate(e.target.value)}
              disabled={disabled}
              max={new Date().toISOString().split('T')[0]}
            />
            <Button 
              onClick={handleExportSpecificDate} 
              disabled={disabled || !specificDate}
              variant="outline"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Export période */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Export pour une période</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="start-date" className="text-xs text-muted-foreground">
                Date de début
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={disabled}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-xs text-muted-foreground">
                Date de fin
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={disabled}
                min={startDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <Button 
            onClick={handleExportDateRange} 
            disabled={disabled || !startDate || !endDate}
            className="w-full"
            variant="outline"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exporter la période
          </Button>
        </div>

        {/* Rapport quotidien */}
        <div className="space-y-2 border-t pt-4">
          <Label className="text-sm font-medium">Rapports spécialisés</Label>
          <div className="grid grid-cols-1 gap-2">
            <Button 
              onClick={handleDailyReport} 
              disabled={disabled}
              variant="default"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Rapport Quotidien
            </Button>
            <Button 
              onClick={handleMultiPeriodExport} 
              disabled={disabled}
              variant="outline"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Multi-Périodes
            </Button>
          </div>
        </div>

        {/* Informations */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
          <p className="font-medium mb-1">💡 Types d'exports disponibles :</p>
          <ul className="space-y-1">
            <li>• <strong>Aujourd'hui</strong> : Véhicules créés aujourd'hui uniquement</li>
            <li>• <strong>Date spécifique</strong> : Véhicules créés à une date précise</li>
            <li>• <strong>Période</strong> : Véhicules créés entre deux dates</li>
            <li>• <strong>Rapport quotidien</strong> : Résumé complet avec comparaisons</li>
            <li>• <strong>Multi-périodes</strong> : Plusieurs feuilles (jour, semaine, mois)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
