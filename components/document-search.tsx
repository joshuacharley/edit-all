"use client"

import { useState, useEffect } from "react"
import { Search, Filter, X } from "lucide-react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { ALLOWED_FILE_TYPES } from "@/lib/file-validation"

interface DocumentSearchProps {
  onSearch: (query: string) => void
  onFilterChange: (filters: string[]) => void
}

export function DocumentSearch({ onSearch, onFilterChange }: DocumentSearchProps) {
  const [query, setQuery] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [debouncedQuery, setDebouncedQuery] = useState("")

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Trigger search when debounced query changes
  useEffect(() => {
    onSearch(debouncedQuery)
  }, [debouncedQuery, onSearch])

  // Update filters when selection changes
  useEffect(() => {
    onFilterChange(selectedTypes)
  }, [selectedTypes, onFilterChange])

  const handleTypeToggle = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    )
  }

  const clearFilters = () => {
    setSelectedTypes([])
    setQuery("")
  }

  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents..."
          className="pl-10"
        />
        {(query || selectedTypes.length > 0) && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
            onClick={clearFilters}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>File Types</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.keys(ALLOWED_FILE_TYPES).map((type) => (
            <DropdownMenuCheckboxItem
              key={type}
              checked={selectedTypes.includes(type)}
              onCheckedChange={() => handleTypeToggle(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
