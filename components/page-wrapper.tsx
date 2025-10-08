"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface PageWrapperProps {
  children: ReactNode
  className?: string
}

/**
 * Wrapper pour toutes les pages avec animation d'entrée
 * Utilise ce composant pour envelopper le contenu des pages
 */
export function PageWrapper({ children, className = "" }: PageWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1] // Easing custom pour effet smooth
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Container avec animation pour les sections de page
 */
export function SectionWrapper({
  children,
  delay = 0,
  className = ""
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: "easeOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
