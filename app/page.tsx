import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, Users, FileText, QrCode, BarChart3 } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"

export default function HomePage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Système d'Enregistrement des Véhicules</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Plateforme moderne pour l'enregistrement et la gestion des véhicules de transport
            </p>
          </header>

          {/* Navigation Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <BarChart3 className="h-12 w-12 text-indigo-600 mx-auto mb-2" />
                <CardTitle>Tableau de Bord</CardTitle>
                <CardDescription>Statistiques et analyses</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard">
                  <Button className="w-full">Accéder</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                <CardTitle>Propriétaires</CardTitle>
                <CardDescription>Gérer les propriétaires</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/proprietaires">
                  <Button className="w-full">Accéder</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <Car className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <CardTitle>Véhicules</CardTitle>
                <CardDescription>Enregistrer les véhicules</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/vehicules">
                  <Button className="w-full">Accéder</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <FileText className="h-12 w-12 text-purple-600 mx-auto mb-2" />
                <CardTitle>Documents</CardTitle>
                <CardDescription>Générer les PDF</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/documents">
                  <Button className="w-full">Accéder</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <QrCode className="h-12 w-12 text-orange-600 mx-auto mb-2" />
                <CardTitle>QR Codes</CardTitle>
                <CardDescription>Étiquettes véhicules</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/qr-codes">
                  <Button className="w-full">Accéder</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Features Section */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-center mb-8">Fonctionnalités</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Gestion des Propriétaires</h3>
                <p className="text-gray-600 text-sm">
                  Enregistrement complet des informations personnelles et documents d'identité
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <Car className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Enregistrement Véhicules</h3>
                <p className="text-gray-600 text-sm">
                  Informations détaillées sur les véhicules et leurs caractéristiques
                </p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Génération PDF</h3>
                <p className="text-gray-600 text-sm">Documents officiels et étiquettes QR automatiquement générés</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
