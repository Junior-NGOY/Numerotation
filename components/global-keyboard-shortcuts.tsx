"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog"

/**
 * Composant qui gère les raccourcis clavier globaux de l'application
 */
export function GlobalKeyboardShortcuts() {
  const router = useRouter()
  const pathname = usePathname()

  useKeyboardShortcuts([
    // Navigation
    {
      key: 'd',
      ctrlKey: true,
      action: () => router.push('/dashboard'),
      description: 'Aller au tableau de bord'
    },
    {
      key: 'v',
      ctrlKey: true,
      action: () => router.push('/vehicules'),
      description: 'Aller aux véhicules'
    },
    {
      key: 'o',
      ctrlKey: true,
      action: () => router.push('/proprietaires'),
      description: 'Aller aux propriétaires'
    },
    {
      key: 'i',
      ctrlKey: true,
      action: () => router.push('/itineraires'),
      description: 'Aller aux itinéraires'
    },
    {
      key: 'l',
      ctrlKey: true,
      action: () => router.push('/documents'),
      description: 'Aller aux documents'
    },
    // Rafraîchir
    {
      key: 'r',
      ctrlKey: true,
      action: () => window.location.reload(),
      description: 'Rafraîchir la page'
    },
  ])

  return <KeyboardShortcutsDialog />
}
