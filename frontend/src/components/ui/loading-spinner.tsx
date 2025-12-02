import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  }

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      <div 
        className={cn(
          "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
          sizeClasses[size]
        )}
      />
      {text && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
      )}
    </div>
  )
}

interface PageLoadingProps {
  text?: string
}

export function PageLoading({ text = "Memuat data..." }: PageLoadingProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}

interface TableLoadingProps {
  columns: number
  rows?: number
}

export function TableLoading({ columns, rows = 10 }: TableLoadingProps) {
  return (
    <div className="w-full">
      <div className="animate-pulse">
        {/* Header */}
        <div className="flex space-x-4 mb-4">
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="h-4 bg-gray-200 rounded flex-1"></div>
          ))}
        </div>
        
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex space-x-4 mb-3">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div 
                key={colIndex} 
                className="h-8 bg-gray-100 rounded flex-1"
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
