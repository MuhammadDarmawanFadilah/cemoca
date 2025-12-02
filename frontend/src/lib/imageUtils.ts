// Utility functions for image handling
import { config } from './config';

/**
 * Get proper image URL for Koperasi Desa images
 */
export const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) return '';
  
  // Get base URL for images (without /api path)
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || config.baseUrl;
  
  // If imagePath already starts with http, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If imagePath starts with /images/, use it directly
  if (imagePath.startsWith('/images/')) {
    return `${baseUrl}${imagePath}`;
  }
  
  // If imagePath starts with /api/images/, replace with /images/
  if (imagePath.startsWith('/api/images/')) {
    const cleanPath = imagePath.replace('/api/images/', '/images/');
    return `${baseUrl}${cleanPath}`;
  }
  
  // If no leading slash, assume it's just the filename
  if (!imagePath.startsWith('/')) {
    return `${baseUrl}/images/${imagePath}`;
  }
  
  // Default: prepend base URL
  return `${baseUrl}${imagePath}`;
};

export const getApiUrl = (endpoint: string): string => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || config.apiUrl;
  return endpoint.startsWith('/') ? `${apiBaseUrl}${endpoint}` : `${apiBaseUrl}/${endpoint}`;
};

export const createPlaceholderDataURL = (width: number = 400, height: number = 300, text: string = 'No Image') => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af">
        ${text}
      </text>
    </svg>
  `
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

export const isValidImageUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export const getOptimizedImageUrl = (originalUrl: string, width?: number, quality?: number): string => {
  if (!isValidImageUrl(originalUrl)) {
    return createPlaceholderDataURL(width, width ? width * 0.75 : undefined)
  }

  // For Next.js Image component, let it handle the optimization
  return originalUrl
}

// Common placeholder images
export const PLACEHOLDER_IMAGES = {
  avatar: createPlaceholderDataURL(200, 200, 'Avatar'),
  news: createPlaceholderDataURL(400, 300, 'Berita'),
  document: createPlaceholderDataURL(300, 400, 'Dokumen'),
  general: createPlaceholderDataURL(400, 300, 'Gambar'),
  barang: createPlaceholderDataURL(400, 300, 'Gambar Barang'),
}
