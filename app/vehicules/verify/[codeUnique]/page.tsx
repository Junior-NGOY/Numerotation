'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Car, User, Route, Loader2, Calendar, Hash, Phone } from 'lucide-react';
import { verifyVehicleByCode, type VerificationResponse } from '@/actions/verification';

export default function VehicleVerifyPage() {
  const { codeUnique } = useParams();
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (codeUnique) {
      verifyVehicle(codeUnique as string);
    }
  }, [codeUnique]);

  const verifyVehicle = async (code: string) => {
    try {
      setLoading(true);
      
      // Utiliser l'action de vérification
      const response = await verifyVehicleByCode(code);
      setResult(response);
      
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      setResult({
        success: false,
        message: 'Erreur de connexion au serveur',
        data: null
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-gray-600">Vérification en cours...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {result?.success ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
            Vérification du véhicule
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Code véhicule :</p>
            <Badge variant="outline" className="text-lg font-mono">
              {codeUnique}
            </Badge>
          </div>

          {result?.success && result.data ? (
            <div className="space-y-6">
              <div className="text-center">
                <Badge 
                  className={`text-lg px-4 py-2 ${
                    result.data.statut === 'Valide' 
                      ? 'bg-green-100 text-green-800 border-green-300' 
                      : 'bg-red-100 text-red-800 border-red-300'
                  }`}
                >
                  {result.data.statut}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Informations du véhicule */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Véhicule
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Marque :</span>
                      <span className="font-medium">{result.data.marque}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Modèle :</span>
                      <span className="font-medium">{result.data.modele}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Type :</span>
                      <span className="font-medium">{result.data.typeVehicule}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Immatriculation :</span>
                      <span className="font-medium">{result.data.numeroImmatriculation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Capacité :</span>
                      <span className="font-medium">{result.data.capaciteAssises} places</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Informations du propriétaire */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Propriétaire
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Nom :</span>
                      <span className="font-medium">{result.data.proprietaire.nom}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Téléphone :</span>
                      <span className="font-medium flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {result.data.proprietaire.telephone}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Informations de l'itinéraire */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Route className="h-4 w-4" />
                      Itinéraire
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ligne :</span>
                      <span className="font-medium">{result.data.itineraire.nom}</span>
                    </div>
                    {result.data.itineraire.description && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Description :</span>
                        <span className="font-medium text-right text-sm">
                          {result.data.itineraire.description}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Informations d'enregistrement */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Enregistrement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Année fabrication :</span>
                      <span className="font-medium">{result.data.anneeFabrication}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Année enregistrement :</span>
                      <span className="font-medium">{result.data.anneeEnregistrement}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Vérifié le :</span>
                      <span className="font-medium">
                        {new Date(result.data.dateVerification).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                {result?.message || 'Erreur de vérification'}
              </h3>
              <p className="text-gray-600">
                {result?.message === 'Véhicule non trouvé' 
                  ? 'Ce code véhicule n\'existe pas dans notre base de données.'
                  : 'Une erreur s\'est produite lors de la vérification. Veuillez réessayer.'
                }
              </p>
            </div>
          )}

          {/* Footer avec informations */}
          <div className="text-center text-xs text-gray-500 border-t pt-4">
            <p>Système de vérification - Mairie de Lubumbashi</p>
            <p>En cas de problème, contactez les services compétents</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
