"use client"

import type React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PaginationControls } from "@/components/pagination-controls"
import { ListAnimation, ListItemAnimation } from "@/components/animations"

interface Column<T> {
  accessorKey?: string
  id?: string
  header: string
  cell?: ({ row }: { row: { original: T } }) => React.ReactNode
  mobileLabel?: string // Label personnalisé pour l'affichage mobile
  hideOnMobile?: boolean // Cacher cette colonne sur mobile
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface ResponsiveDataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  pagination: Pagination
  onPageChange: (page: number) => void
  onLimitChange?: (limit: number) => void
  mobileCardRenderer?: (item: T) => React.ReactNode // Renderer personnalisé pour les cartes mobiles
}

/**
 * Composant de tableau responsive qui s'adapte automatiquement :
 * - Desktop : Affiche un tableau classique
 * - Mobile : Affiche des cartes empilées
 */
export function ResponsiveDataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  onPageChange,
  onLimitChange,
  mobileCardRenderer,
}: ResponsiveDataTableProps<T>) {
  const { page, limit, total, totalPages } = pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }
  const startIndex = (page - 1) * limit
  const endIndex = Math.min(startIndex + limit, total)

  const handleLimitChange = (newLimit: number) => {
    if (onLimitChange) {
      onLimitChange(newLimit)
    }
  }

  const getCellValue = (item: T, column: Column<T>) => {
    if (column.cell) {
      return column.cell({ row: { original: item } })
    }
    const key = column.accessorKey || column.id
    return key ? item[key] : ''
  }

  const getColumnKey = (column: Column<T>, index: number) => {
    return column.accessorKey || column.id || `column-${index}`
  }

  // Renderer par défaut pour les cartes mobiles
  const defaultMobileCardRenderer = (item: T) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {columns
            .filter(col => !col.hideOnMobile)
            .map((column, index) => {
              const value = getCellValue(item, column)
              const label = column.mobileLabel || column.header
              
              return (
                <div key={getColumnKey(column, index)} className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {label}
                  </span>
                  <div className="text-sm">
                    {value || '-'}
                  </div>
                </div>
              )
            })}
        </div>
      </CardContent>
    </Card>
  )

  const renderMobileCard = mobileCardRenderer || defaultMobileCardRenderer

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Loading skeleton */}
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Chargement...</span>
          </div>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <p className="text-lg font-medium text-muted-foreground mb-2">Aucune donnée disponible</p>
              <p className="text-sm text-muted-foreground">Essayez de modifier vos filtres ou d'ajouter des données</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Vue Desktop - Tableau classique */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={getColumnKey(column, index)} className="whitespace-nowrap">
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={item.id || index} className="hover:bg-muted/50 transition-colors">
                {columns.map((column, colIndex) => (
                  <TableCell key={getColumnKey(column, colIndex)} className="whitespace-nowrap">
                    {getCellValue(item, column)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Vue Mobile - Cartes empilées */}
      <div className="md:hidden">
        <ListAnimation>
          <div className="space-y-3">
            {data.map((item, index) => (
              <ListItemAnimation key={item.id || index}>
                {renderMobileCard(item)}
              </ListItemAnimation>
            ))}
          </div>
        </ListAnimation>
      </div>

      {/* Pagination */}
      <PaginationControls
        pagination={{ page, limit, total, totalPages }}
        onPageChange={onPageChange}
        onLimitChange={handleLimitChange}
      />
    </div>
  )
}
