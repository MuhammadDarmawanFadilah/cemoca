'use client'

import Image from 'next/image'
import { useState } from 'react'
import { createPlaceholderDataURL, isValidImageUrl } from '@/lib/imageUtils'

interface SafeImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fill?: boolean
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onError?: () => void
}

export default function SafeImage({
  src,
  alt,
  width,
  height,
  className,
  fill,
  priority,
  quality = 75,
  placeholder,
  blurDataURL,
  onError,
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
    onError?.()
  }

  const handleLoad = () => {
    setIsLoading(false)
  }
  // Fallback placeholder image URL
  const fallbackSrc = createPlaceholderDataURL(
    width || 400, 
    height || 300, 
    'Gambar tidak tersedia'
  )

  // Validate source URL
  if (!isValidImageUrl(src)) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">URL gambar tidak valid</span>
      </div>
    )
  }

  // If there's an error, show fallback
  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">Gambar tidak dapat dimuat</span>
      </div>
    )
  }

  try {
    return (
      <div className={`relative ${isLoading ? 'animate-pulse bg-gray-200' : ''}`}>
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={className}
          fill={fill}
          priority={priority}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          onError={handleError}
          onLoad={handleLoad}
          unoptimized={false}
          {...props}
        />
      </div>
    )
  } catch (error) {
    console.error('Image loading error:', error)
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">Gambar tidak dapat dimuat</span>
      </div>
    )
  }
}
