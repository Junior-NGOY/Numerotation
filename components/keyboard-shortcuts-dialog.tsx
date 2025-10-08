"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Keyboard, X } from "lucide-react"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"

interface ShortcutItem {
  keys: string[]
  description: string
  category: string
}

const shortcuts: ShortcutItem[] = [
  // Navigation
  { keys: ['Ctrl', 'D'], description: 'Tableau de bord', category: 'Navigation' },
  { keys: ['Ctrl', 'V'], description: 'Véhicules', category: 'Navigation' },
  { keys: ['Ctrl', 'O'], description: 'Propriétaires', category: 'Navigation' },
  { keys: ['Ctrl', 'I'], description: 'Itinéraires', category: 'Navigation' },
  { keys: ['Ctrl', 'L'], description: 'Documents', category: 'Navigation' },
  
  // Actions
  { keys: ['Ctrl', 'N'], description: 'Nouveau véhicule', category: 'Actions' },
  { keys: ['Ctrl', 'P'], description: 'Générer PDF', category: 'Actions' },
  { keys: ['Ctrl', 'R'], description: 'Rafraîchir', category: 'Actions' },
  
  // Interface
  { keys: ['Ctrl', 'K'], description: 'Recherche globale', category: 'Interface' },
  { keys: ['Ctrl', '?'], description: 'Afficher les raccourcis', category: 'Interface' },
  { keys: ['Escape'], description: 'Fermer les modales', category: 'Interface' },
]

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false)

  // Raccourci Ctrl + ? pour ouvrir la liste des raccourcis
  useKeyboardShortcuts([
    {
      key: '?',
      ctrlKey: true,
      action: () => setOpen(true),
      description: 'Afficher les raccourcis clavier'
    }
  ])

  const categories = Array.from(new Set(shortcuts.map(s => s.category)))

  return (
    <>
      {/* Bouton flottant pour ouvrir les raccourcis */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all z-40"
        onClick={() => setOpen(true)}
        title="Raccourcis clavier (Ctrl + ?)"
      >
        <Keyboard className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Raccourcis Clavier
            </DialogTitle>
            <DialogDescription>
              Gagnez du temps avec ces raccourcis clavier
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts
                    .filter((s) => s.category === category)
                    .map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <span className="text-sm">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, i) => (
                            <span key={i} className="flex items-center gap-1">
                              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                                {key}
                              </kbd>
                              {i < shortcut.keys.length - 1 && (
                                <span className="text-xs text-muted-foreground">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Astuce :</strong> Les raccourcis ne fonctionnent pas lorsque vous tapez dans un champ de texte (sauf Escape).
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
