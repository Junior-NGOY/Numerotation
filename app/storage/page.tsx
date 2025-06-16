"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Upload, Database, Cloud } from "lucide-react"
import { apiRequest } from "@/lib/api"

interface StorageStats {
  total: number
  external: number
  local: number
  totalSize: number
  pinataConfigured: boolean
}

interface PinataStatus {
  configured: boolean
  connected?: boolean
  message: string
  status: 'success' | 'error' | 'warning'
}

export default function StorageDiagnosticPage() {
  const [pinataStatus, setPinataStatus] = useState<PinataStatus | null>(null)
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testPinataConnection = async () => {
    setIsLoading(true)
    try {
      const response = await apiRequest<PinataStatus>('/api/v1/storage/pinata/test')
      if (response.data) {
        setPinataStatus(response.data)
      }
    } catch (error) {
      console.error('Error testing PINATA connection:', error)
      setPinataStatus({
        configured: false,
        connected: false,
        message: 'Erreur lors du test de connexion',
        status: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStorageStats = async () => {
    try {
      const response = await apiRequest<StorageStats>('/api/v1/storage/stats')
      if (response.data) {
        setStorageStats(response.data)
      }
    } catch (error) {
      console.error('Error getting storage stats:', error)
    }
  }

  useEffect(() => {
    testPinataConnection()
    getStorageStats()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Diagnostic de Stockage</h1>
          <p className="text-muted-foreground">
            Vérifiez le statut de PINATA et les statistiques de stockage
          </p>
        </div>
        <Button onClick={testPinataConnection} disabled={isLoading}>
          {isLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Tester la connexion
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Statut PINATA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Statut PINATA
            </CardTitle>
            <CardDescription>
              Configuration et connexion au service PINATA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pinataStatus ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Configuration</span>
                  <Badge variant={pinataStatus.configured ? "default" : "secondary"}>
                    {pinataStatus.configured ? 'Configuré' : 'Non configuré'}
                  </Badge>
                </div>
                
                {pinataStatus.configured && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Connexion</span>
                    <Badge variant={pinataStatus.connected ? "default" : "destructive"}>
                      {pinataStatus.connected ? 'Connecté' : 'Déconnecté'}
                    </Badge>
                  </div>
                )}
                
                <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                  {getStatusIcon(pinataStatus.status)}
                  <p className="text-sm">{pinataStatus.message}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-6">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistiques de stockage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Statistiques de Stockage
            </CardTitle>
            <CardDescription>
              Répartition des documents stockés
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {storageStats ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total documents</span>
                  <Badge variant="outline">{storageStats.total}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Sur PINATA</span>
                  <Badge variant="default">{storageStats.external}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">En local</span>
                  <Badge variant="secondary">{storageStats.local}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Taille totale</span>
                  <Badge variant="outline">{formatFileSize(storageStats.totalSize)}</Badge>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2">
                    {storageStats.pinataConfigured ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      PINATA {storageStats.pinataConfigured ? 'configuré' : 'non configuré'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-6">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informations d'utilisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Informations d'utilisation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Upload de fichiers</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Les propriétaires peuvent uploader leur pièce d'identité</li>
                <li>• Les véhicules peuvent avoir plusieurs documents</li>
                <li>• Taille maximale par fichier : 10MB</li>
                <li>• Formats acceptés : JPG, PNG, PDF, DOC, DOCX</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Stockage</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• PINATA configuré : stockage sur IPFS</li>
                <li>• PINATA non configuré : stockage local</li>
                <li>• Fallback automatique en cas d'erreur</li>
                <li>• Liens conservés en base de données</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
