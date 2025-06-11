"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldX } from "lucide-react"

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: ("ADMIN" | "USER")[]
  fallback?: React.ReactNode
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { user } = useAuth()

  if (!user || !allowedRoles.includes(user.role)) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
        <div className="max-w-md mx-auto">
          <Alert variant="destructive">
            <ShieldX className="h-4 w-4" />
            <AlertDescription className="text-center">
              <div className="space-y-2">
                <p className="font-semibold">Accès non autorisé</p>
                <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
