import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { QueryProvider } from "@/contexts/query-provider"
import { Navbar } from "@/components/navbar"
import { Toaster } from "@/components/ui/sonner"
import { GlobalKeyboardShortcuts } from "@/components/global-keyboard-shortcuts"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Système d'Enregistrement des Véhicules",
  description: "Plateforme moderne pour l'enregistrement et la gestion des véhicules de transport",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <Navbar />
            {children}
            <Toaster />
            <GlobalKeyboardShortcuts />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
