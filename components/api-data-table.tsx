"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PaginationControls } from "@/components/pagination-controls"

// Interface pour les colonnes compatible avec TanStack Table
interface Column<T> {
  accessorKey?: string;
  id?: string;
  header: string;
  cell?: ({ row }: { row: { original: T } }) => React.ReactNode;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export function ApiDataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  onPageChange,
  onLimitChange,
}: ApiDataTableProps<T>) {
  const { page, limit, total, totalPages } = pagination;
  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, total);
  const handleLimitChange = (newLimit: number) => {
    if (onLimitChange) {
      onLimitChange(newLimit);
    }
  };

  const getCellValue = (item: T, column: Column<T>) => {
    if (column.cell) {
      return column.cell({ row: { original: item } });
    }
    
    const key = column.accessorKey || column.id;
    return key ? item[key] : '';
  };

  const getColumnKey = (column: Column<T>, index: number) => {
    return column.accessorKey || column.id || `column-${index}`;
  };

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto">
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm text-muted-foreground">Chargement...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  Aucune donnée disponible
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow key={item.id || index}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={getColumnKey(column, colIndex)} className="whitespace-nowrap">
                      {getCellValue(item, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <PaginationControls
        pagination={pagination}
        onPageChange={onPageChange}
        onLimitChange={handleLimitChange}
        loading={loading}
      />
    </div>
  );
}
