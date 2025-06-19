'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Car, User, Route, Loader2 } from 'lucide-react';

interface VehicleVerificationData {
  vehicule: {
    marque: string;
    modele: string;
    immatriculation: string;
    proprietaire: string;
    itineraire: string;
    statut: string;
  };
}

interface VerificationResult {
  success: boolean;
  data?: VehicleVerificationData;
  message?: string;
}

export default function VehicleVerifyPage() {
  const { codeUnique } = useParams();
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (codeUnique) {
      verifyVehicle(codeUnique as string);
    }
  }, [codeUnique]);

  const verifyVehicle = async (code: string) => {
    try {
      setLoading(true);
      
      // Appel à l'API de vérification (sans authentification)
      const response = await fetch(`/api/verify/${code}`);
      const data = await response.json();
      
      setResult(data);
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      setResult({
        success: false,
        message: 'Erreur de connexion au serveur'
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
      <Card className="w-full max-w-md">
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
        
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Code véhicule :</p>
            <Badge variant="outline" className="text-lg font-mono">
              {codeUnique}
            </Badge>
          </div>

          {result?.success && result.data ? (
            <div className="space-y-4">
              <Badge 
                className={`w-full justify-center ${
                  result.data.vehicule.statut === 'Valide' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {result.data.vehicule.statut}
              </Badge>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Car className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">{result.data.vehicule.marque} {result.data.vehicule.modele}</p>
                    <p className="text-sm text-gray-600">{result.data.vehicule.immatriculation}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Propriétaire</p>
                    <p className="text-sm text-gray-600">{result.data.vehicule.proprietaire}</p>
                  </div>
                </div>

                {result.data.vehicule.itineraire && (
                  <div className="flex items-center gap-3">
                    <Route className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium">Itinéraire autorisé</p>
                      <p className="text-sm text-gray-600">{result.data.vehicule.itineraire}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Badge variant="destructive" className="mb-3">
                Véhicule non trouvé
              </Badge>
              <p className="text-sm text-gray-600">
                {result?.message || 'Ce code véhicule n\'existe pas dans notre base de données.'}
              </p>
            </div>
          )}

          <div className="pt-4 border-t text-center">
            <p className="text-xs text-gray-500">
              Système de vérification des véhicules<br />
              Mairie de Sine-Saloum
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
