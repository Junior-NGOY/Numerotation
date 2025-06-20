"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DocumentManager from '@/components/document-manager';
import { AuthGuard } from "@/components/auth-guard";

// Composant interne qui utilise useSearchParams
function DocumentsManagerContent() {
  const searchParams = useSearchParams();
  const proprietaireId = searchParams.get('proprietaireId') || undefined;
  const vehiculeId = searchParams.get('vehiculeId') || undefined;

  return (
    <DocumentManager 
      proprietaireId={proprietaireId}
      vehiculeId={vehiculeId}
    />
  );
}

// Composant principal avec Suspense
export default function DocumentsManagerPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto p-6">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement du gestionnaire de documents...</p>
            </div>
          </div>
        }>
          <DocumentsManagerContent />
        </Suspense>
      </div>
    </AuthGuard>
  );
}
