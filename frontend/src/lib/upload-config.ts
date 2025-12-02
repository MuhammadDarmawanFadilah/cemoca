import { configAPI } from './api'

// Dynamic configuration that can be loaded from backend
export interface UploadConfig {
  maxImageSize: number
  maxVideoSize: number
  maxDocumentSize: number
  maxImageSizeMB: number
  maxVideoSizeMB: number
  maxDocumentSizeMB: number
  allowedImageTypes: string
  allowedDocumentTypes: string
}

let cachedConfig: UploadConfig | null = null

// Load configuration from backend
export const loadUploadConfig = async (): Promise<UploadConfig> => {
  if (cachedConfig) {
    return cachedConfig
  }
  
  try {
    const config = await configAPI.getUploadLimits()
    cachedConfig = config
    return config
  } catch (error) {
    console.warn('Failed to load upload config from backend, using defaults:', error)
    // Fallback to defaults from properties
    return {
      maxImageSize: 10 * 1024 * 1024,
      maxVideoSize: 100 * 1024 * 1024,
      maxDocumentSize: 100 * 1024 * 1024,
      maxImageSizeMB: 10,
      maxVideoSizeMB: 100,
      maxDocumentSizeMB: 100,
      allowedImageTypes: 'jpg,jpeg,png,gif,webp',
      allowedDocumentTypes: 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv'
    }
  }
}

// Clear cached config (useful for testing or when config changes)
export const clearConfigCache = () => {
  cachedConfig = null
}

// Validate file with dynamic config
export const validateFileWithBackendConfig = async (file: File, fileType: 'image' | 'video' | 'document'): Promise<{ valid: boolean; message: string }> => {
  const config = await loadUploadConfig()
  
  let maxSize: number
  let allowedTypes: string[]
  
  switch (fileType) {
    case 'image':
      maxSize = config.maxImageSize
      allowedTypes = config.allowedImageTypes.split(',').map(type => 
        type.startsWith('image/') ? type : `image/${type}`
      )
      break
    case 'video':
      maxSize = config.maxVideoSize
      allowedTypes = ['video/mp4', 'video/webm', 'video/avi', 'video/mov'] // Could be made configurable
      break
    case 'document':
      maxSize = config.maxDocumentSize
      allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv'
      ]
      break
    default:
      return { valid: false, message: 'Unknown file type' }
  }
  
  // Validate file size
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    return { 
      valid: false, 
      message: `Ukuran file terlalu besar. Maksimal ${maxSizeMB}MB.` 
    }
  }
  
  // Validate file type
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      message: 'Format file tidak didukung.' 
    }
  }
  
  return { valid: true, message: '' }
}
