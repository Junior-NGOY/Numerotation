import React from 'react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationControlsProps {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange: (page: number) => void
  onLimitChange?: (limit: number) => void
  loading?: boolean
  className?: string
}

export function PaginationControls({
  pagination,
  onPageChange,
  onLimitChange,
  loading = false,
  className = ""
}: PaginationControlsProps) {
  const { page, limit, total, totalPages } = pagination
  const startIndex = (page - 1) * limit
  const endIndex = Math.min(startIndex + limit, total)
  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && !loading) {
      onPageChange(newPage)
    }
  }

  const handleLimitChange = (newLimit: number) => {
    if (onLimitChange) {
      onLimitChange(newLimit)
    }
  }

  const generatePageNumbers = () => {
    const pages = []
    const showPages = 5 // Nombre de pages à afficher
    
    if (totalPages <= showPages) {
      // Si on a moins de pages que le maximum, on les affiche toutes
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Logique pour afficher les pages autour de la page actuelle
      let startPage = Math.max(1, page - Math.floor(showPages / 2))
      let endPage = Math.min(totalPages, startPage + showPages - 1)
      
      // Ajuster si on est près du début ou de la fin
      if (endPage - startPage < showPages - 1) {
        startPage = Math.max(1, endPage - showPages + 1)
      }
      
      // Ajouter la première page et "..." si nécessaire
      if (startPage > 1) {
        pages.push(1)
        if (startPage > 2) {
          pages.push('...')
        }
      }
      
      // Ajouter les pages du milieu
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
      
      // Ajouter "..." et la dernière page si nécessaire
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...')
        }
        pages.push(totalPages)
      }
    }
    
    return pages
  }
  const pageNumbers = generatePageNumbers()

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Informations sur les résultats */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Affichage de <span className="font-medium">{startIndex + 1}</span> à{' '}
          <span className="font-medium">{endIndex}</span> sur{' '}
          <span className="font-medium">{total}</span> résultats
        </div>
          {/* Sélecteur du nombre d'éléments par page */}
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Lignes par page</p>
          <Select
            value={limit.toString()}
            onValueChange={(value) => handleLimitChange(parseInt(value))}
            disabled={loading || !onLimitChange}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={limit} />
            </SelectTrigger>
            <SelectContent side="top">
              {[5, 10, 20, 30, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Contrôles de pagination - seulement si plus d'une page */}
      {totalPages > 1 && (
        <div className="flex items-center space-x-2">
        {/* Première page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(1)}
          disabled={page === 1 || loading}
          className="h-8 w-8 p-0"
        >
          <ChevronsLeft className="h-4 w-4" />
          <span className="sr-only">Première page</span>
        </Button>

        {/* Page précédente */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(page - 1)}
          disabled={page === 1 || loading}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Page précédente</span>
        </Button>

        {/* Numéros de pages */}
        <div className="flex items-center space-x-1">
          {pageNumbers.map((pageNumber, index) => (
            <React.Fragment key={index}>
              {pageNumber === '...' ? (
                <span className="px-2 text-sm text-muted-foreground">...</span>
              ) : (
                <Button
                  variant={page === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(pageNumber as number)}
                  disabled={loading}
                  className="h-8 w-8 p-0"
                >
                  {pageNumber}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Page suivante */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(page + 1)}
          disabled={page === totalPages || loading}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Page suivante</span>
        </Button>

        {/* Dernière page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(totalPages)}
          disabled={page === totalPages || loading}
          className="h-8 w-8 p-0"
        >          <ChevronsRight className="h-4 w-4" />
          <span className="sr-only">Dernière page</span>
        </Button>
      </div>
      )}
    </div>
  )
}
