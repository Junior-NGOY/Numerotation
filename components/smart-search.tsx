import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Settings } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SmartSearchProps {
  value: string
  onChange: (value: string) => void
  onSearch: (term: string) => void
  placeholder?: string
  loading?: boolean
  className?: string
}

export function SmartSearch({
  value,
  onChange,
  onSearch,
  placeholder = "Rechercher...",
  loading = false,
  className = ""
}: SmartSearchProps) {
  const [searchMode, setSearchMode] = useState<'auto' | 'manual'>('auto')
  
  // Recherche automatique avec debounce
  const debouncedValue = useDebounce(value, 500)
  
  useEffect(() => {
    if (searchMode === 'auto' && debouncedValue !== undefined) {
      onSearch(debouncedValue)
    }
  }, [debouncedValue, searchMode, onSearch])

  const handleManualSearch = () => {
    if (searchMode === 'manual') {
      onSearch(value)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchMode === 'manual') {
      handleManualSearch()
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10"
        />
      </div>

      {/* Bouton de recherche manuelle */}
      {searchMode === 'manual' && (
        <Button onClick={handleManualSearch} disabled={loading} variant="outline">
          <Search className="h-4 w-4 mr-2" />
          Rechercher
        </Button>
      )}

      {/* Indicateur de recherche automatique */}
      {searchMode === 'auto' && loading && (
        <div className="flex items-center text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
          Recherche...
        </div>
      )}

      {/* Menu de configuration */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={() => setSearchMode('auto')}
            className={searchMode === 'auto' ? 'bg-accent' : ''}
          >
            🚀 Recherche automatique
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setSearchMode('manual')}
            className={searchMode === 'manual' ? 'bg-accent' : ''}
          >
            🎯 Recherche manuelle
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
