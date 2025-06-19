import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { codeUnique: string } }
) {
  const { codeUnique } = params;

  try {
    // URL du backend (depuis les variables d'environnement ou Railway)
    const backendUrl = process.env.BACKEND_URL || 'https://web-production-a371d.up.railway.app';
    
    // Appel à l'API de vérification du backend
    const response = await fetch(`${backendUrl}/api/v1/verify/${codeUnique}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Véhicule non trouvé' 
        },
        { status: 404 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erreur de connexion au serveur' 
      },
      { status: 500 }
    );
  }
}
