// Configuration constants for file uploads
// These should match the backend configuration

export const FILE_UPLOAD_CONFIG = {
  // Maximum file sizes (in bytes)
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB - matches app.upload.image-max-size
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB - matches app.upload.video-max-size  
  MAX_DOCUMENT_SIZE: 100 * 1024 * 1024, // 100MB - matches app.document.max-file-size
  
  // Allowed file types
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/avi', 'video/mov'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv'
  ],
  
  // File type extensions for display
  ALLOWED_IMAGE_EXTENSIONS: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  ALLOWED_VIDEO_EXTENSIONS: ['mp4', 'webm', 'avi', 'mov'],
  ALLOWED_DOCUMENT_EXTENSIONS: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv']
}

// Helper functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const isImageFile = (file: File): boolean => {
  return FILE_UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)
}

export const isVideoFile = (file: File): boolean => {
  return FILE_UPLOAD_CONFIG.ALLOWED_VIDEO_TYPES.includes(file.type)
}

export const isDocumentFile = (file: File): boolean => {
  return FILE_UPLOAD_CONFIG.ALLOWED_DOCUMENT_TYPES.includes(file.type)
}

export const validateFileSize = (file: File, maxSize: number): { valid: boolean; message: string } => {
  if (file.size > maxSize) {
    return {
      valid: false,
      message: `Ukuran file terlalu besar. Maksimal ${formatFileSize(maxSize)}.`
    }
  }
  return { valid: true, message: '' }
}

export const validateFileType = (file: File, allowedTypes: string[]): { valid: boolean; message: string } => {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message: 'Format file tidak didukung.'
    }
  }
  return { valid: true, message: '' }
}
