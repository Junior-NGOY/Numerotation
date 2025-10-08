"use client"

import { motion } from "framer-motion"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface LoadingProgressProps {
  current: number
  total: number
  percentage: number
  loaded?: number
  message: string
  status?: 'loading' | 'success' | 'error'
  error?: string
}

/**
 * Composant de barre de progression moderne pour les chargements longs
 */
export function LoadingProgress({
  current,
  total,
  percentage,
  loaded,
  message,
  status = 'loading',
  error
}: LoadingProgressProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto p-6 bg-card border rounded-lg shadow-lg"
    >
      {/* Icône de statut */}
      <div className="flex items-center justify-center mb-4">
        {status === 'loading' && (
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        )}
        {status === 'success' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </motion.div>
        )}
        {status === 'error' && (
          <AlertCircle className="h-12 w-12 text-destructive" />
        )}
      </div>

      {/* Message */}
      <p className="text-center text-sm font-medium mb-4 text-foreground">
        {message}
      </p>

      {/* Barre de progression */}
      <div className="space-y-2">
        <Progress value={percentage} className="h-2" />
        
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>
            {current} / {total} pages
          </span>
          <span className="font-semibold">{percentage}%</span>
          {loaded !== undefined && (
            <span>
              {loaded} véhicules
            </span>
          )}
        </div>
      </div>

      {/* Message d'erreur si présent */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md"
        >
          <p className="text-sm text-destructive">{error}</p>
        </motion.div>
      )}

      {/* Animation de particules pour rendre ça plus vivant */}
      {status === 'loading' && (
        <div className="mt-4 flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}
