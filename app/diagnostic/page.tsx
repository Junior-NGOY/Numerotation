"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"

// Configuration de l'URL de base de l'API
function getApiBaseUrl(): string {
  let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  // Si la variable d'environnement ne contient que le domaine (sans protocole), ajouter https://
  if (baseUrl && !baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }
  
  // Supprimer le slash final s'il existe
  baseUrl = baseUrl.replace(/\/$/, '');
  
  // Vérifier que l'URL est valide
  try {
    new URL(baseUrl);
    return baseUrl;
  } catch (error) {
    console.error('URL de base API invalide:', baseUrl, error);
    return 'http://localhost:8000';
  }
}

const API_BASE_URL = getApiBaseUrl();

interface DiagnosticResult {
  name: string
  status: 'success' | 'error' | 'warning' | 'loading'
  message: string
  details?: string
}

export default function DiagnosticPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runDiagnostics = async () => {
    setIsRunning(true)
    const results: DiagnosticResult[] = []

    // Test 1: Vérifier le localStorage
    try {
      const user = localStorage.getItem('user')
      const token = localStorage.getItem('auth_token')
      
      results.push({
        name: 'Authentification LocalStorage',
        status: user && token ? 'success' : 'warning',
        message: user && token ? 'Utilisateur et token présents' : 'Utilisateur ou token manquant',
        details: `User: ${user ? 'présent' : 'absent'}, Token: ${token ? 'présent' : 'absent'}`
      })
    } catch (error) {
      results.push({
        name: 'Authentification LocalStorage',
        status: 'error',
        message: 'Erreur d\'accès au localStorage',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    }    // Test 2: Ping du serveur backend
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        results.push({
          name: 'Connectivité Backend',
          status: 'success',
          message: 'Backend accessible',
          details: `Status: ${data.status}, Uptime: ${Math.round(data.uptime)}s`
        })
      } else {
        results.push({
          name: 'Connectivité Backend',
          status: 'error',
          message: `Backend répond avec erreur: ${response.status}`,
          details: `Status: ${response.status} ${response.statusText}`
        })
      }
    } catch (error) {
      results.push({
        name: 'Connectivité Backend',
        status: 'error',
        message: 'Backend inaccessible',
        details: error instanceof Error ? error.message : 'Erreur de connexion'
      })
    }    // Test 3: Test de l'endpoint dashboard/summary
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        results.push({
          name: 'Endpoint Dashboard Summary',
          status: 'success',
          message: 'Endpoint répond correctement',
          details: `Données reçues: ${JSON.stringify(data).substring(0, 100)}...`
        })
      } else {
        const errorText = await response.text()
        results.push({
          name: 'Endpoint Dashboard Summary',
          status: 'error',
          message: `Erreur ${response.status}: ${response.statusText}`,
          details: errorText.substring(0, 200)
        })
      }
    } catch (error) {
      results.push({
        name: 'Endpoint Dashboard Summary',
        status: 'error',
        message: 'Erreur lors de l\'appel',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    }    // Test 4: Variables d'environnement
    try {
      results.push({
        name: 'Configuration Frontend',
        status: 'success',
        message: 'Variables d\'environnement chargées',
        details: `API_URL: ${API_BASE_URL}`
      })
    } catch (error) {
      results.push({
        name: 'Configuration Frontend',
        status: 'error',
        message: 'Problème de configuration',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    }

    setDiagnostics(results)
    setIsRunning(false)
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'loading':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
    }
  }

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Succès</Badge>
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500">Attention</Badge>
      case 'loading':
        return <Badge variant="outline">Chargement</Badge>
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Diagnostic Système</h1>
          <p className="text-gray-600">Vérification de l'état du système</p>
        </div>
        <Button onClick={runDiagnostics} disabled={isRunning}>
          {isRunning ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Relancer les tests
        </Button>
      </div>

      <div className="grid gap-6">
        {diagnostics.map((diagnostic, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  {getStatusIcon(diagnostic.status)}
                  {diagnostic.name}
                </CardTitle>
                {getStatusBadge(diagnostic.status)}
              </div>
              <CardDescription>{diagnostic.message}</CardDescription>
            </CardHeader>
            {diagnostic.details && (
              <CardContent>
                <div className="bg-gray-50 p-3 rounded-md">
                  <code className="text-sm">{diagnostic.details}</code>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {diagnostics.length === 0 && !isRunning && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Aucun diagnostic exécuté</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
