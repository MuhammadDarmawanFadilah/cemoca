import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SortableHeaderProps {
  children: React.ReactNode
  className?: string
  sortKey: string
  currentSort?: {
    sortBy: string
    sortDir: 'asc' | 'desc'
  }
  onSort: (sortBy: string, sortDir: 'asc' | 'desc') => void
}

export function SortableHeader({
  children,
  className,
  sortKey,
  currentSort,
  onSort,
}: SortableHeaderProps) {
  const handleSort = () => {
    if (currentSort?.sortBy === sortKey) {
      // Toggle direction if already sorting by this field
      const newDir = currentSort.sortDir === 'asc' ? 'desc' : 'asc'
      onSort(sortKey, newDir)
    } else {
      // Default to desc for new sorts
      onSort(sortKey, 'desc')
    }
  }

  const getSortIcon = () => {
    if (currentSort?.sortBy !== sortKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return currentSort.sortDir === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />
  }

  return (
    <Button
      variant="ghost"
      onClick={handleSort}
      className={cn(
        "h-auto p-0 font-medium text-left justify-start hover:bg-transparent",
        currentSort?.sortBy === sortKey && "text-primary",
        className
      )}
    >
      {children}
      {getSortIcon()}
    </Button>
  )
}
