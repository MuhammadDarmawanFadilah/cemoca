// Configuration constants from environment variables
// All hardcoded values should be moved here

export const config = {
  // API URLs
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080',
  
  // Auth Configuration
  authLoginEndpoint: process.env.NEXT_PUBLIC_AUTH_LOGIN_ENDPOINT || '/api/auth/login',
  // Network Filter Configuration
  networkFilterEnabled: process.env.NEXT_PUBLIC_NETWORK_FILTER_ENABLED === 'true',
  showOnlyBackendCalls: process.env.NEXT_PUBLIC_SHOW_ONLY_BACKEND_CALLS === 'true',
  allowedDomains: process.env.NEXT_PUBLIC_ALLOWED_DOMAINS ? process.env.NEXT_PUBLIC_ALLOWED_DOMAINS.split(',') : ['localhost:8080'],
  
  // Development Settings
  logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL || 'debug',
  enableNetworkDebug: process.env.NEXT_PUBLIC_ENABLE_NETWORK_DEBUG === 'true',
  useProxy: process.env.NEXT_PUBLIC_USE_PROXY === 'true',
  
  // Image Upload Configuration
  imageUploadEndpoint: process.env.NEXT_PUBLIC_IMAGE_UPLOAD_ENDPOINT || '/api/images/upload',
  imageServeEndpoint: process.env.NEXT_PUBLIC_IMAGE_SERVE_ENDPOINT || '/api/images',
  maxImageSize: parseInt(process.env.NEXT_PUBLIC_MAX_IMAGE_SIZE || '5242880'),
  placeholderImageEndpoint: process.env.NEXT_PUBLIC_PLACEHOLDER_IMAGE_ENDPOINT || '/api/placeholder',
  
  // Pagination Configuration
  defaultPageSize: parseInt(process.env.NEXT_PUBLIC_DEFAULT_PAGE_SIZE || '10'),
  defaultPage: parseInt(process.env.NEXT_PUBLIC_DEFAULT_PAGE || '0'),
  
  // Birthday Notification Configuration
  birthdayUpcomingDays: parseInt(process.env.NEXT_PUBLIC_BIRTHDAY_UPCOMING_DAYS || '30'),
  
  // Notification Messages
  notifications: {
    allCreated: process.env.NEXT_PUBLIC_NOTIFICATION_ALL_CREATED_MSG || 'Semua notifikasi telah berhasil dibuat untuk alumni',
    todaySent: process.env.NEXT_PUBLIC_NOTIFICATION_TODAY_SENT_MSG || 'Semua notifikasi hari ini telah berhasil dikirim',
    resent: process.env.NEXT_PUBLIC_NOTIFICATION_RESENT_MSG || 'Notifikasi ulang tahun telah dikirim ulang',
    excluded: process.env.NEXT_PUBLIC_NOTIFICATION_EXCLUDED_MSG || 'Alumni dikecualikan dari notifikasi otomatis',
    included: process.env.NEXT_PUBLIC_NOTIFICATION_INCLUDED_MSG || 'Alumni disertakan dalam notifikasi otomatis'
  },
  
  // Status Labels
  statusLabels: {
    pending: process.env.NEXT_PUBLIC_STATUS_PENDING_TEXT || 'Menunggu',
    sent: process.env.NEXT_PUBLIC_STATUS_SENT_TEXT || 'Terkirim',
    failed: process.env.NEXT_PUBLIC_STATUS_FAILED_TEXT || 'Gagal',
    excluded: process.env.NEXT_PUBLIC_STATUS_EXCLUDED_TEXT || 'Dikecualikan',
    resent: process.env.NEXT_PUBLIC_STATUS_RESENT_TEXT || 'Dikirim Ulang'
  },
  
  // Form Labels
  formLabels: {
    nama: process.env.NEXT_PUBLIC_FORM_NAMA_LABEL || 'Nama',
    tanggalLahir: process.env.NEXT_PUBLIC_FORM_TANGGAL_LAHIR_LABEL || 'Tanggal Lahir'
  },
  
  // File Upload Settings
  upload: {
    maxSizeMB: process.env.NEXT_PUBLIC_UPLOAD_MAX_SIZE_MB || '5',
    errorMsg: process.env.NEXT_PUBLIC_UPLOAD_ERROR_MSG || 'Gagal mengupload foto. Silakan coba lagi.',
    sizeErrorMsg: process.env.NEXT_PUBLIC_UPLOAD_SIZE_ERROR_MSG || 'Ukuran file maksimal 5MB'
  },
    // Content Type Headers
  contentType: {
    json: process.env.NEXT_PUBLIC_CONTENT_TYPE_JSON || 'application/json'
  }
};

// Helper functions for common URL patterns
export const getApiUrl = (endpoint: string) => {
  // Make sure endpoint always starts with /api
  if (endpoint.startsWith('/api/')) {
    return `${config.baseUrl}${endpoint}`;
  } else if (endpoint.startsWith('/')) {
    return `${config.apiUrl}${endpoint}`;
  } else {
    return `${config.apiUrl}/${endpoint}`;
  }
};
export const getImageUrl = (filename: string) => `${config.baseUrl}${config.imageServeEndpoint}/${filename}`;
export const getPlaceholderUrl = (size: string) => `${config.placeholderImageEndpoint}/${size}`;
