"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ArrowLeft, QrCode, Download, Printer, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { getVehicules, getVehiculeById } from "@/actions/vehicules"
import { generateQRLabel, generateVehicleQRPreview } from "@/lib/qr-generator"
import { Vehicule } from "@/types/api"

export default function QRCodesPage() {
  const [selectedVehicule, setSelectedVehicule] = useState("")
  const [qrGenerated, setQrGenerated] = useState(false)
  const [qrPreviewUrl, setQrPreviewUrl] = useState("")
  const [vehicules, setVehicules] = useState<Vehicule[]>([])
  const [selectedVehiculeData, setSelectedVehiculeData] = useState<Vehicule | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingQR, setLoadingQR] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  // Charger les véhicules au montage du composant
  useEffect(() => {
    const loadVehicules = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getVehicules({ limit: 1000 })
        if (response.data && response.data.items) {
          setVehicules(response.data.items)
        } else {
          setVehicules([])
        }
      } catch (err) {
        console.error('Erreur lors du chargement des véhicules:', err)
        setError('Erreur lors du chargement des véhicules')
      } finally {
        setLoading(false)
      }
    }

    loadVehicules()
  }, [])

  // Charger les détails du véhicule sélectionné
  useEffect(() => {
    const loadVehiculeDetails = async () => {
      if (!selectedVehicule) {
        setSelectedVehiculeData(null)
        return
      }

      try {
        const response = await getVehiculeById(selectedVehicule)
        setSelectedVehiculeData(response.data)
      } catch (err) {
        console.error('Erreur lors du chargement des détails du véhicule:', err)
        setError('Erreur lors du chargement des détails du véhicule')
      }
    }

    loadVehiculeDetails()
  }, [selectedVehicule])

  const generateQRCode = async () => {
    if (!selectedVehicule || !selectedVehiculeData) {
      alert("Veuillez sélectionner un véhicule")
      return
    }

    try {
      setLoadingQR(true)
      setError(null)
      
      // Générer l'aperçu du QR code
      const qrPreview = await generateVehicleQRPreview(selectedVehiculeData)
      setQrPreviewUrl(qrPreview)
      setQrGenerated(true)
    } catch (err) {
      console.error('Erreur lors de la génération du QR code:', err)
      setError('Erreur lors de la génération du QR code')
    } finally {
      setLoadingQR(false)
    }
  }

  const downloadQRLabel = async () => {
    if (!selectedVehiculeData) return

    try {
      setError(null)
      await generateQRLabel(selectedVehiculeData)
    } catch (err) {
      console.error('Erreur lors du téléchargement de l\'étiquette:', err)
      setError('Erreur lors du téléchargement de l\'étiquette')
    }
  }

  const printLabel = () => {
    if (qrRef.current) {
      const printContent = qrRef.current.innerHTML
      const printWindow = window.open("", "", "height=600,width=800")
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Étiquette Véhicule</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .label { width: 210mm; height: 297mm; border: 1px solid #000; padding: 20px; box-sizing: border-box; }
              </style>
            </head>
            <body>
              <div class="label">${printContent}</div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link href="/">
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Génération QR Codes</h1>
            <p className="text-gray-600">Créez les étiquettes QR pour les véhicules</p>
          </div>

          {/* Affichage des erreurs */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center text-red-800">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Génération QR */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="h-5 w-5 mr-2" />
                  Étiquette QR Code
                </CardTitle>
                <CardDescription>Générez l'étiquette A4 avec QR code pour le véhicule</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Sélectionner un véhicule</Label>
                  {loading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Chargement des véhicules...</span>
                    </div>
                  ) : (
                    <Select onValueChange={setSelectedVehicule} disabled={loading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un véhicule" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicules.map((vehicule) => (
                          <SelectItem key={vehicule.id} value={vehicule.id}>
                            {vehicule.marque} {vehicule.modele} - {vehicule.numeroImmatriculation} (
                            {vehicule.typeVehicule})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <Button 
                  onClick={generateQRCode} 
                  className="w-full" 
                  disabled={!selectedVehicule || loadingQR || loading}
                >
                  {loadingQR ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Générer QR Code
                    </>
                  )}
                </Button>

                {qrGenerated && (
                  <div className="space-y-2">
                    <Button onClick={printLabel} variant="outline" className="w-full">
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimer Étiquette
                    </Button>
                    <Button onClick={downloadQRLabel} variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger PDF
                    </Button>
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  <p className="font-semibold mb-2">L'étiquette contiendra :</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>QR Code unique du véhicule</li>
                    <li>Année d'enregistrement</li>
                    <li>Type de véhicule</li>
                    <li>Numéro d'immatriculation</li>
                    <li>Code d'identification unique</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Aperçu de l'étiquette */}
            <Card>
              <CardHeader>
                <CardTitle>Aperçu Étiquette A4</CardTitle>
                <CardDescription>Prévisualisation de l'étiquette à coller sur le véhicule</CardDescription>
              </CardHeader>
              <CardContent>
                <div ref={qrRef} className="bg-white border-2 border-gray-300 rounded-lg p-8 text-center space-y-6">
                  <div className="border-b pb-4">
                    <h3 className="font-bold text-xl text-gray-800">TRANSPORT PUBLIC</h3>
                    <p className="text-gray-600">Véhicule Enregistré</p>
                  </div>

                  {qrGenerated && selectedVehiculeData ? (
                    <div className="space-y-4">
                      {/* QR Code réel */}
                      {qrPreviewUrl ? (
                        <div className="flex justify-center">
                          <img 
                            src={qrPreviewUrl} 
                            alt="QR Code du véhicule"
                            className="w-32 h-32 border border-gray-300"
                          />
                        </div>
                      ) : (
                        <div className="w-32 h-32 bg-gray-200 mx-auto flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="font-bold text-lg">{selectedVehiculeData.numeroImmatriculation}</p>
                        <p className="text-gray-700">Type: {selectedVehiculeData.typeVehicule}</p>
                        <p className="text-gray-700">Année: {selectedVehiculeData.anneeEnregistrement}</p>
                        <p className="text-sm text-gray-500">ID: {selectedVehiculeData.codeUnique}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400 py-12">
                      <QrCode className="h-16 w-16 mx-auto mb-4" />
                      <p>Sélectionnez un véhicule et générez le QR code</p>
                    </div>
                  )}

                  <div className="border-t pt-4 text-xs text-gray-500">
                    <p>Enregistré le {new Date().toLocaleDateString("fr-FR")}</p>
                    <p>Système d'Enregistrement des Véhicules</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
