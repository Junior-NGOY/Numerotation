"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LucideIcon, FileX, Filter, Search, PackageOpen, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({
  icon: Icon = FileX,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="mb-4 rounded-full bg-muted p-4"
          >
            <Icon className="h-12 w-12 text-muted-foreground" />
          </motion.div>
          
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {action && (
              <Button onClick={action.onClick} size="lg">
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button onClick={secondaryAction.onClick} variant="outline" size="lg">
                {secondaryAction.label}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/**
 * Empty state prédéfinis pour différentes situations
 */

export function NoVehiclesFound({ onReset }: { onReset?: () => void }) {
  return (
    <EmptyState
      icon={Filter}
      title="Aucun véhicule trouvé"
      description="Aucun véhicule ne correspond aux filtres sélectionnés. Essayez d'ajuster vos critères de recherche."
      action={onReset ? { label: "Réinitialiser les filtres", onClick: onReset } : undefined}
    />
  )
}

export function NoSearchResults({ searchTerm, onClear }: { searchTerm: string; onClear?: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="Aucun résultat"
      description={`Aucun résultat trouvé pour "${searchTerm}". Vérifiez l'orthographe ou essayez d'autres termes.`}
      action={onClear ? { label: "Effacer la recherche", onClick: onClear } : undefined}
    />
  )
}

export function NoDocuments({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={PackageOpen}
      title="Aucun document"
      description="Vous n'avez pas encore créé de documents. Commencez par générer votre premier PDF."
      action={onCreate ? { label: "Créer un document", onClick: onCreate } : undefined}
    />
  )
}

export function ErrorState({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Une erreur s'est produite"
      description={error || "Une erreur inattendue s'est produite. Veuillez réessayer."}
      action={onRetry ? { label: "Réessayer", onClick: onRetry } : undefined}
    />
  )
}

export function NoDataInRange({ onAdjust }: { onAdjust?: () => void }) {
  return (
    <EmptyState
      icon={FileX}
      title="Aucune donnée dans cette période"
      description="Aucun véhicule n'a été créé dans la période sélectionnée. Essayez d'élargir la plage de dates."
      action={onAdjust ? { label: "Ajuster les dates", onClick: onAdjust } : undefined}
    />
  )
}
