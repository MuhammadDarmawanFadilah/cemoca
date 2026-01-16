// API service untuk backend Java Spring Boot
import { config } from './config';

const API_BASE_URL = config.apiUrl;

export class ApiError extends Error {
  status: number;
  type?: string;
  details?: any;
  raw?: any;

  constructor(message: string, status: number, type?: string, details?: any, raw?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.type = type;
    this.details = details;
    this.raw = raw;
  }
}

// Clean API helper function
export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const method = options.method || 'GET';
  
  // Get auth token from localStorage
  const token = localStorage.getItem('auth_token');
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      },
      mode: 'cors',
      credentials: 'omit',
      ...options,
    });

    if (!response.ok) {
      // Handle different error types
      if (response.status === 401) {
        // Token expired or invalid
        const errorData = await response.json().catch(() => ({ error: 'Unauthorized' }));
        
        // Clear invalid token
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        
        // Trigger logout by dispatching custom event
        window.dispatchEvent(new CustomEvent('auth:token-expired'));
        
        throw new ApiError(
          errorData.error || errorData.message || 'Token tidak valid atau telah kedaluwarsa. Silakan login kembali.',
          401,
          errorData.type,
          errorData.details,
          errorData
        );
      } else {
        // Other errors
        const errorText = await response.text();
        let errorMessage = `Terjadi kesalahan. Silakan coba lagi.`;
        let parsed: any = null;
        
        // Try to parse JSON error response
        try {
          parsed = JSON.parse(errorText);
          errorMessage = parsed?.error || parsed?.message || errorMessage;
        } catch {
          // Keep original error text if not JSON
          if (errorText && errorText.trim()) {
            const plain = errorText.trim();
            const lower = plain.toLowerCase();
            const looksLikeHtml = lower.startsWith('<!doctype') || lower.startsWith('<html');
            const isGenericBadRequest = lower === 'bad request' || lower === 'internal server error';
            if (!looksLikeHtml && !isGenericBadRequest) {
              errorMessage = plain;
            }
          }
        }

        throw new ApiError(errorMessage, response.status, parsed?.type, parsed?.details, parsed);
      }
    }

    // Handle empty responses (like DELETE operations)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null as T;
    }

    // Check if there's content to parse
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return data;
    }

    // For non-JSON responses, return null
    return null as T;
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    throw error;
  }
}

function isMasterAgencyAgentImportResult(data: any): data is MasterAgencyAgentImportResult {
  return (
    !!data &&
    typeof data === 'object' &&
    typeof data.success === 'boolean' &&
    typeof data.createdCount === 'number' &&
    typeof data.updatedCount === 'number' &&
    Array.isArray(data.errors)
  )
}

function isMasterPolicySalesImportResult(data: any): data is MasterPolicySalesImportResult {
  return (
    !!data &&
    typeof data === 'object' &&
    typeof data.success === 'boolean' &&
    typeof data.createdCount === 'number' &&
    typeof data.updatedCount === 'number' &&
    Array.isArray(data.errors)
  )
}

// User API functions - Simple and Easy
export const userAPI = {
  // Get all users
  getAllUsers: (): Promise<User[]> => apiCall<User[]>('/users'),
  
  // Get user by ID
  getUserById: (id: number): Promise<User> => apiCall<User>(`/users/${id}`),
  
  // Get user by username
  getUserByUsername: (username: string): Promise<User> => apiCall<User>(`/users/username/${username}`),

  // Check if username exists
  checkUsernameExists: (username: string): Promise<boolean> => apiCall<boolean>(`/users/exists/username/${username}`),  
  // Check if email exists
  checkEmailExists: (email: string): Promise<boolean> => apiCall<boolean>(`/users/exists/email/${email}`),
  // Check if phone number exists
  checkPhoneExists: (phone: string): Promise<boolean> => apiCall<boolean>(`/users/exists/phone/${encodeURIComponent(phone)}`),
  
  // Reset password
  resetPassword: (id: number, currentPassword: string, newPassword: string): Promise<{ message: string; user: User }> =>
    apiCall<{ message: string; user: User }>(`/users/${id}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};



// Biografi interfaces
export interface WorkExperience {
  id?: number;
  posisi: string;
  perusahaan: string;
  tanggalMulai?: string;
  tanggalSelesai?: string;
  deskripsi?: string;
  masihBekerja?: boolean;
}

export interface Biografi {
  biografiId: number;
  namaLengkap: string;
  nim: string;
  alumniTahun: string;
  email: string;
  nomorHp?: string;
  nomorWa?: string;
  fotoProfil?: string;
  jurusan?: string;
  tanggalLulus?: string;
  ipk?: string;
  nomorTelepon?: string;
  tanggalLahir?: string;
  tempatLahir?: string;
  jenisKelamin?: string;
  agama?: string;
  foto?: string;
  programStudi?: string;
  pendidikanLanjutan?: string;
  posisiJabatan?: string;
  workExperiences?: WorkExperience[];
  academicRecords?: AcademicRecord[];
  tanggalMasukKerja?: string;
  tanggalKeluarKerja?: string;  pekerjaanSaatIni?: string;
  perusahaanSaatIni?: string;  alamat?: string;
  provinsi?: string;
  kota?: string;
  kecamatan?: string;
  kelurahan?: string;
  kodePos?: string;
  latitude?: number;
  longitude?: number;
  // Location names for display
  provinsiNama?: string;
  kotaNama?: string;
  kecamatanNama?: string;
  kelurahanNama?: string;
  achievements?: Achievement[];
  spesialisasiKedokteran?: SpesialisasiKedokteran[];
  prestasi?: string;
  hobi?: string;  instagram?: string;
  youtube?: string;
  linkedin?: string;
  facebook?: string;
  tiktok?: string;
  telegram?: string;
  catatan?: string;
  status: BiografiStatus;
  createdAt: string;
  updatedAt: string;
}

export type BiografiStatus = 'AKTIF' | 'TIDAK_AKTIF' | 'DRAFT';

export interface AcademicRecord {
  jenjangPendidikan: string;
  universitas: string;
  programStudi: string;
  ipk: string;
  tanggalLulus: string;
}

export interface Achievement {
  judul: string;
  penyelenggara: string;
  tahun: string;
  deskripsi: string;
}

export interface SpesialisasiKedokteran {
  spesialisasi: string;
  lokasiPenempatan: string;
  tanggalMulai: string;
  tanggalAkhir?: string;
  masihBekerja: boolean;
}

export interface BiografiRequest {
  // Mandatory fields
  namaLengkap: string;
  alumniTahun: string;
  email: string;
  nomorTelepon: string;
    // Optional fields
  nim?: string;
  tanggalLahir?: string;
  tempatLahir?: string;
  jenisKelamin?: string;
  agama?: string;  posisiJabatan?: string;
  role?: string;  workExperiences?: WorkExperience[];
  academicRecords?: AcademicRecord[];
  achievements?: Achievement[];
  spesialisasiKedokteran?: SpesialisasiKedokteran[];  tanggalMasukKerja?: string;
  tanggalKeluarKerja?: string;
  alamat?: string;
  provinsi?: string;
  kota?: string;  kecamatan?: string;
  kelurahan?: string;
  kodePos?: string;
  latitude?: number | null;
  longitude?: number | null;
  prestasi?: string;hobi?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  facebook?: string;
  tiktok?: string;
  telegram?: string;
  catatan?: string;
  foto?: string;
  status?: BiografiStatus;
}

export interface BiografiFilterRequest {
  nama?: string;
  nim?: string;
  email?: string;
  jurusan?: string;
  pekerjaan?: string;
  programStudi?: string;
  alumniTahun?: string;
  spesialisasi?: string; // Renamed from posisiJabatan
  nomorTelepon?: string;
  kota?: string;
  kecamatan?: string;
  kelurahan?: string;
  provinsi?: string;
  status?: BiografiStatus;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface BiografiStats {
  total: number;
  aktif: number;
  tidakAktif: number;
  draft: number;
}

// Biografi API functions
export const biografiAPI = {
  // Get all biografi with pagination
  getAllBiografi: (page = 0, size = 10, sortBy = 'createdAt', sortDirection = 'desc'): Promise<PagedResponse<Biografi>> =>
    apiCall<PagedResponse<Biografi>>(`/biografi?page=${page}&size=${size}&sortBy=${sortBy}&sortDirection=${sortDirection}`),

  // Get biografi with filters
  getBiografiWithFilters: (filters: BiografiFilterRequest): Promise<PagedResponse<Biografi>> =>
    apiCall<PagedResponse<Biografi>>('/biografi/search', {
      method: 'POST',
      body: JSON.stringify(filters),
    }),

  // Get biografi by ID
  getBiografiById: (id: number): Promise<Biografi> =>
    apiCall<Biografi>(`/biografi/${id}`),

  // Get biografi for editing with location details
  getBiografiForEdit: (id: number): Promise<Biografi> =>
    apiCall<Biografi>(`/biografi/${id}/edit`),

  // Get biografi by NIM
  getBiografiByNim: (nim: string): Promise<Biografi> =>
    apiCall<Biografi>(`/biografi/nim/${nim}`),

  // Get current user's biografi
  getMyBiografi: (): Promise<Biografi> =>
    apiCall<Biografi>('/biografi/my-biografi'),  // Create new biografi
  createBiografi: (biografi: BiografiRequest): Promise<Biografi> =>
    apiCall<Biografi>('/biografi', {
      method: 'POST',
      body: JSON.stringify(biografi),
    }),

  // Update biografi
  updateBiografi: (id: number, biografi: BiografiRequest): Promise<Biografi> =>
    apiCall<Biografi>(`/biografi/${id}`, {
      method: 'PUT',
      body: JSON.stringify(biografi),
    }),  // Update biografi status
  updateBiografiStatus: async (id: number, status: BiografiStatus): Promise<Biografi> => {
    console.log(`Updating biografi ${id} status to ${status}`);
    
    // First, get the current biografi data
    const currentBiografi = await apiCall<Biografi>(`/biografi/${id}`, {
      method: 'GET',
    });
    
    // Create minimal update request with only status change
    const updateRequest = {
      // Required fields from the current biografi
      namaLengkap: currentBiografi.namaLengkap,
      nim: currentBiografi.nim,
      alumniTahun: currentBiografi.alumniTahun,
      email: currentBiografi.email,
      nomorTelepon: currentBiografi.nomorTelepon,
      tanggalLahir: currentBiografi.tanggalLahir,
      tempatLahir: currentBiografi.tempatLahir,
      jenisKelamin: currentBiografi.jenisKelamin,
      agama: currentBiografi.agama,
      programStudi: currentBiografi.programStudi,
      // Update only the status
      status: status,
      // Optional fields
      jurusan: currentBiografi.jurusan,
      tanggalLulus: currentBiografi.tanggalLulus,
      ipk: currentBiografi.ipk,
      fotoProfil: currentBiografi.fotoProfil,
    };
    
    console.log(`Sending status update request for biografi ${id}:`, updateRequest);
    
    try {
      const result = await apiCall<Biografi>(`/biografi/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateRequest),
      });
      
      console.log(`Successfully updated biografi ${id} status to ${status}`);
      return result;
    } catch (error) {
      console.error(`Failed to update biografi ${id} status:`, error);
      throw error;
    }
  },

  // Delete biografi (soft delete)
  deleteBiografi: (id: number): Promise<{ message: string }> =>
    apiCall<{ message: string }>(`/biografi/${id}`, {
      method: 'DELETE',
    }),

  // Hard delete biografi
  hardDeleteBiografi: (id: number): Promise<{ message: string }> =>
    apiCall<{ message: string }>(`/biografi/${id}/permanent`, {
      method: 'DELETE',
    }),

  // Search biografi by name
  searchBiografiByName: (nama: string, page = 0, size = 10): Promise<PagedResponse<Biografi>> =>
    apiCall<PagedResponse<Biografi>>(`/biografi/search/name?nama=${encodeURIComponent(nama)}&page=${page}&size=${size}`),

  // Get biografi by exact name match (for comment author lookup)
  getBiografiByName: (nama: string): Promise<Biografi> =>
    apiCall<Biografi>(`/biografi/author/${encodeURIComponent(nama)}`),
  // Get biografi by status
  getBiografiByStatus: (status: BiografiStatus, page = 0, size = 10): Promise<PagedResponse<Biografi>> =>
    apiCall<PagedResponse<Biografi>>(`/biografi/status/${status}?page=${page}&size=${size}`),

  // Get distinct location values for dropdown filters
  getDistinctProvinsi: (): Promise<string[]> =>
    apiCall<string[]>('/biografi/filters/provinsi'),

  getDistinctKota: (): Promise<string[]> =>
    apiCall<string[]>('/biografi/filters/kota'),

  getDistinctKecamatan: (): Promise<string[]> =>
    apiCall<string[]>('/biografi/filters/kecamatan'),
  getDistinctKelurahan: (): Promise<string[]> =>
    apiCall<string[]>('/biografi/filters/kelurahan'),

  // Get distinct values for dropdown filters
  getDistinctJurusan: (): Promise<string[]> =>
    apiCall<string[]>('/biografi/filters/jurusan'),

  getDistinctPekerjaan: (): Promise<string[]> =>
    apiCall<string[]>('/biografi/filters/pekerjaan'),

  getDistinctSpesialisasi: (): Promise<string[]> =>
    apiCall<string[]>('/biografi/filters/spesialisasi'),

  getDistinctAlumniTahun: (): Promise<string[]> =>
    apiCall<string[]>('/biografi/filters/alumni-tahun'),

  // Get location mappings (name to code) for filter handling
  getProvinsiMappings: (): Promise<Record<string, string>> =>
    apiCall<Record<string, string>>('/biografi/filters/location-mappings/provinsi'),

  getKotaMappings: (): Promise<Record<string, string>> =>
    apiCall<Record<string, string>>('/biografi/filters/location-mappings/kota'),

  getKecamatanMappings: (): Promise<Record<string, string>> =>
    apiCall<Record<string, string>>('/biografi/filters/location-mappings/kecamatan'),

  getKelurahanMappings: (): Promise<Record<string, string>> =>
    apiCall<Record<string, string>>('/biografi/filters/location-mappings/kelurahan'),
};

// Image API functions
export const imageAPI = {
  // Upload image
  uploadImage: async (file: File): Promise<{success: string, filename: string, url: string}> => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('auth_token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/images/upload`, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        credentials: 'omit',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        // Don't set Content-Type header - let browser set it with boundary
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  },
  // Get image URL
  getImageUrl: (filename: string): string => {
    if (!filename) return '';
    
    // If filename already contains the full URL, return as is
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return filename;
    }
    
    // Otherwise, construct the URL
    return `${API_BASE_URL}/images/${filename}`;
  },

  // Delete image
  deleteImage: (filename: string): Promise<{success: string, message: string}> =>
    apiCall<{success: string, message: string}>(`/images/${filename}`, {
      method: 'DELETE',
    }),
};

export interface AvatarAudio {
  id: number;
  avatarName: string;
  normalizedKey: string;
  originalFilename: string;
  storedFilename: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConsentAudio {
  id: number;
  avatarName: string;
  normalizedKey: string;
  originalFilename: string;
  storedFilename: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}

export interface AvatarConsentStatus {
  presenterId: string;
  presenterName: string;
  avatarType?: string | null;
  hasConsent: boolean;
  consentId?: string;
  consentText?: string;
  hasConsentAudio: boolean;
}

export interface VideoBackground {
  id: number;
  backgroundName: string;
  normalizedKey: string;
  originalFilename: string;
  storedFilename: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}

export const audioManagementAPI = {
  list: (params: { search?: string; page?: number; size?: number } = {}): Promise<PagedResponse<AvatarAudio>> => {
    const search = params.search ? `&search=${encodeURIComponent(params.search)}` : '';
    const page = typeof params.page === 'number' ? params.page : 0;
    const size = typeof params.size === 'number' ? params.size : 25;
    return apiCall<PagedResponse<AvatarAudio>>(`/admin/audio-management?page=${page}&size=${size}${search}`);
  },

  create: async (avatarName: string, file: File): Promise<AvatarAudio> => {
    const formData = new FormData();
    formData.append('avatarName', avatarName);
    formData.append('file', file);
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${API_BASE_URL}/admin/audio-management`, {
      method: 'POST',
      body: formData,
      mode: 'cors',
      credentials: 'omit',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }
    return await response.json();
  },

  update: async (id: number, avatarName?: string, file?: File): Promise<AvatarAudio> => {
    const formData = new FormData();
    if (typeof avatarName === 'string') {
      formData.append('avatarName', avatarName);
    }
    if (file) {
      formData.append('file', file);
    }
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${API_BASE_URL}/admin/audio-management/${id}`, {
      method: 'PUT',
      body: formData,
      mode: 'cors',
      credentials: 'omit',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }
    return await response.json();
  },

  delete: (id: number): Promise<void> =>
    apiCall<void>(`/admin/audio-management/${id}`, { method: 'DELETE' }),
};

export const consentManagementAPI = {
  list: (params: { search?: string; page?: number; size?: number } = {}): Promise<PagedResponse<ConsentAudio>> => {
    const search = params.search ? `&search=${encodeURIComponent(params.search)}` : '';
    const page = typeof params.page === 'number' ? params.page : 0;
    const size = typeof params.size === 'number' ? params.size : 25;
    return apiCall<PagedResponse<ConsentAudio>>(`/admin/consent-management?page=${page}&size=${size}${search}`);
  },

  create: async (avatarName: string, file: File): Promise<ConsentAudio> => {
    const formData = new FormData();
    formData.append('avatarName', avatarName);
    formData.append('file', file);
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${API_BASE_URL}/admin/consent-management`, {
      method: 'POST',
      body: formData,
      mode: 'cors',
      credentials: 'omit',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }
    return await response.json();
  },

  update: async (id: number, avatarName?: string, file?: File): Promise<ConsentAudio> => {
    const formData = new FormData();
    if (typeof avatarName === 'string') {
      formData.append('avatarName', avatarName);
    }
    if (file) {
      formData.append('file', file);
    }
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${API_BASE_URL}/admin/consent-management/${id}`, {
      method: 'PUT',
      body: formData,
      mode: 'cors',
      credentials: 'omit',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }
    return await response.json();
  },

  delete: (id: number): Promise<void> => apiCall<void>(`/admin/consent-management/${id}`, { method: 'DELETE' }),

  listAvatars: (params: { search?: string } = {}): Promise<AvatarConsentStatus[]> => {
    const search = params.search ? `?search=${encodeURIComponent(params.search)}` : '';
    return apiCall<AvatarConsentStatus[]>(`/admin/consent-management/avatars${search}`);
  },

  ensureAvatarConsent: (avatarKey: string): Promise<any> =>
    apiCall<any>(`/admin/consent-management/avatars/${encodeURIComponent(avatarKey)}/ensure-consent`, {
      method: 'POST',
    }),
};

export const backgroundManagementAPI = {
  list: (params: { search?: string; page?: number; size?: number } = {}): Promise<PagedResponse<VideoBackground>> => {
    const search = params.search ? `&search=${encodeURIComponent(params.search)}` : '';
    const page = typeof params.page === 'number' ? params.page : 0;
    const size = typeof params.size === 'number' ? params.size : 25;
    return apiCall<PagedResponse<VideoBackground>>(`/admin/background-management?page=${page}&size=${size}${search}`);
  },

  create: async (backgroundName: string, file: File): Promise<VideoBackground> => {
    const formData = new FormData();
    formData.append('backgroundName', backgroundName);
    formData.append('file', file);
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${API_BASE_URL}/admin/background-management`, {
      method: 'POST',
      body: formData,
      mode: 'cors',
      credentials: 'omit',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }
    return await response.json();
  },

  update: async (id: number, backgroundName?: string, file?: File): Promise<VideoBackground> => {
    const formData = new FormData();
    if (typeof backgroundName === 'string') {
      formData.append('backgroundName', backgroundName);
    }
    if (file) {
      formData.append('file', file);
    }
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${API_BASE_URL}/admin/background-management/${id}`, {
      method: 'PUT',
      body: formData,
      mode: 'cors',
      credentials: 'omit',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }
    return await response.json();
  },

  delete: (id: number): Promise<void> =>
    apiCall<void>(`/admin/background-management/${id}`, { method: 'DELETE' }),
};

// TypeScript interfaces sesuai dengan backend models
export interface Role {
  roleId: number;
  roleName: string;
  description?: string;
  permissions: string[];
  createdAt: string;  updatedAt: string;
}

// Master Data Types
export interface MasterSpesialisasiRequest {
  nama: string;
  deskripsi?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface MasterSpesialisasiResponse {
  id: number;
  nama: string;
  deskripsi?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MasterPosisiRequest {
  nama: string;
  kategori?: string;
  deskripsi?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface MasterPosisiResponse {
  id: number;
  nama: string;
  kategori?: string;
  deskripsi?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MasterHobiRequest {
  nama: string;
  kategori?: string;
  deskripsi?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface MasterHobiResponse {
  id: number;
  nama: string;
  kategori?: string;
  deskripsi?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  companyName?: string;
  companyCode?: string;
  ownerName?: string;
  agencyRange?: string;
  reasonToUse?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'WAITING_APPROVAL' | 'REJECTED';
  role?: Role;
  biografi?: Biografi;
  lastAccessAt?: string;
  createdAt: string;
  updatedAt: string;
}



export interface PagedResponse<T> {
  content: T[];
  page?: number; // Frontend mapping
  number?: number; // Backend property for current page
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  numberOfElements?: number; // Backend property
}

// Utility functions
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  }).format(amount);
};

export const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};

// React hooks untuk data fetching - MOVED to separate client component file
// See /src/hooks/useApiData.ts for client-side hooks

// Notification interfaces
export interface NotificationRequest {
  title: string;
  message: string;
  recipients: string[];
  type: 'text' | 'image';
  image?: File | null;
}

export interface WhatsAppResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Notification API functions
export const notifikasiAPI = {  // Send WhatsApp notification
  sendWhatsAppNotification: async (notification: NotificationRequest): Promise<WhatsAppResponse> => {
    const formData = new FormData();
    formData.append('title', notification.title);
    formData.append('message', notification.message);
    // Send recipients as comma-separated string instead of JSON
    formData.append('recipients', notification.recipients.join(','));
    formData.append('type', notification.type);
    
    if (notification.image && notification.type === 'image') {
      formData.append('image', notification.image);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/whatsapp`, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('WhatsApp notification error:', error);
      throw error;
    }
  },

  // Get notification history
  getNotificationHistory: (page = 0, size = 10): Promise<PagedResponse<any>> =>
    apiCall<PagedResponse<any>>(`/notifications/history?page=${page}&size=${size}`),
};

// Optimized endpoint for recipient selection
export const getRecipientsForSelection = async (filterRequest: BiografiFilterRequest): Promise<PagedResponse<RecipientSummary>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/biografi/recipients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filterRequest),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      let msg = text ? `HTTP ${response.status}: ${text}` : `HTTP error! status: ${response.status}`
      try {
        const parsed = text ? JSON.parse(text) : null
        if (parsed && typeof parsed === 'object') {
          msg = (parsed.message || parsed.error || msg) as string
        }
      } catch {
        // keep msg
      }
      throw new Error(msg)
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching recipients:', error);
    throw error;
  }
};

// Minimal recipient data interface for performance
export interface RecipientSummary {
  biografiId: number;
  namaLengkap: string;
  email: string;
  nomorTelepon: string;
  jurusan: string;
  alumniTahun: string;
  spesialisasi: string;
}

// API functions for dropdown data
export const getFilterOptions = {
  jurusan: (): Promise<string[]> =>
    apiCall<string[]>('/biografi/filters/jurusan'),
  
  pekerjaan: (): Promise<string[]> =>
    apiCall<string[]>('/biografi/filters/pekerjaan'),
  
  kota: (): Promise<string[]> =>
    apiCall<string[]>('/biografi/filters/kota'),
  
  provinsi: (): Promise<string[]> =>
    apiCall<string[]>('/biografi/filters/provinsi'),
  
  alumniTahun: (): Promise<string[]> =>
    apiCall<string[]>('/biografi/filters/alumni-tahun'),
  
  spesialisasi: (): Promise<string[]> =>
    apiCall<string[]>('/biografi/filters/spesialisasi'),
};

// Berita types and interfaces
export interface Berita {
  id: number;
  judul: string;
  ringkasan: string;
  ringkasanWordCount?: number;
  konten: string;
  penulis: string;
  penulisBiografiId?: number;
  gambarUrl: string;
  mediaLampiran?: string; // JSON string untuk array media
  tags?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  kategori: 'UMUM' | 'AKADEMIK' | 'KARIR' | 'ALUMNI' | 'TEKNOLOGI' | 'OLAHRAGA' | 'KEGIATAN';
  jumlahView: number;
  jumlahLike: number;
  createdAt: string;
  updatedAt: string;
}

export interface BeritaRequest {
  judul: string;
  ringkasan: string;
  ringkasanWordCount?: number;
  konten: string;
  penulis?: string;
  penulisBiografiId?: number;
  gambarUrl?: string;
  mediaLampiran?: string; // JSON string
  tags?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  kategori: 'UMUM' | 'AKADEMIK' | 'KARIR' | 'ALUMNI' | 'TEKNOLOGI' | 'OLAHRAGA' | 'KEGIATAN';
}

export interface BeritaPage {
  content: Berita[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// Berita API functions - Complete news management integration
export const beritaAPI = {
  // Get all berita with pagination and filters
  getAllBerita: (params?: {
    page?: number;
    size?: number;
    kategori?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortDir?: string;
  }): Promise<BeritaPage> => {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    if (params?.kategori) queryParams.append('kategori', params.kategori);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortDir) queryParams.append('sortDir', params.sortDir);
    
    const endpoint = `/berita${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiCall<BeritaPage>(endpoint);
  },
  // Get published berita only
  getPublishedBerita: (params?: {
    page?: number;
    size?: number;
    kategori?: string;
    search?: string;
    sortBy?: string;
    sortDir?: string;
  }): Promise<BeritaPage> => {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    if (params?.kategori) {
      console.log(`API: Adding kategori filter: ${params.kategori}`);
      queryParams.append('kategori', params.kategori);
    }
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortDir) queryParams.append('sortDir', params.sortDir);
    
    const endpoint = `/berita/published${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log(`Fetching berita with endpoint: ${endpoint}`);
    return apiCall<BeritaPage>(endpoint);
  },
  // Get berita by ID
  getBeritaById: (id: number): Promise<Berita> =>    apiCall<Berita>(`/berita/${id}`),

  // Get berita detail by ID (optimized, no N+1 queries)
  getBeritaDetailById: (id: number): Promise<Berita> => 
    apiCall<Berita>(`/berita/${id}/detail`),

  // Get berita by kategori
  getBeritaByKategori: (kategori: string, params?: {
    page?: number;
    size?: number;
  }): Promise<BeritaPage> => {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    
    const endpoint = `/berita/kategori/${kategori}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiCall<BeritaPage>(endpoint);
  },

  // Get popular berita
  getPopularBerita: (limit = 5): Promise<Berita[]> =>
    apiCall<Berita[]>(`/berita/popular?limit=${limit}`),

  // Search berita
  searchBerita: (query: string, params?: {
    page?: number;
    size?: number;
  }): Promise<BeritaPage> => {
    const queryParams = new URLSearchParams();
    queryParams.append('query', query);
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    
    return apiCall<BeritaPage>(`/berita/search?${queryParams.toString()}`);
  },

  // Create new berita
  createBerita: (berita: BeritaRequest): Promise<Berita> =>
    apiCall<Berita>('/berita', {
      method: 'POST',
      body: JSON.stringify(berita),
    }),

  // Update berita
  updateBerita: (id: number, berita: BeritaRequest): Promise<Berita> =>
    apiCall<Berita>(`/berita/${id}`, {
      method: 'PUT',
      body: JSON.stringify(berita),
    }),

  // Delete berita
  deleteBerita: (id: number): Promise<void> =>
    apiCall<void>(`/berita/${id}`, {
      method: 'DELETE',
    }),

  // Like berita
  likeBerita: (id: number): Promise<void> =>
    apiCall<void>(`/berita/${id}/like`, {
      method: 'POST',
    }),

  // Update berita status
  updateStatus: (id: number, status: string): Promise<Berita> =>
    apiCall<Berita>(`/berita/${id}/status?status=${status}`, {
      method: 'PUT',
    }),
};

// Helper function to map backend kategori to frontend display
export const getKategoriDisplay = (kategori: string): string => {
  const kategoriMap: Record<string, string> = {
    'UMUM': 'Umum',
    'AKADEMIK': 'Akademik',
    'KARIR': 'Karir',
    'ALUMNI': 'Alumni',
    'TEKNOLOGI': 'Teknologi',
    'OLAHRAGA': 'Olahraga',
    'KEGIATAN': 'Kegiatan'
  };
  return kategoriMap[kategori] || kategori;
};

// Helper function to get all available categories
export const getBeritaKategories = (): string[] => {
  return ['UMUM', 'AKADEMIK', 'KARIR', 'ALUMNI', 'TEKNOLOGI', 'OLAHRAGA', 'KEGIATAN'];
};

// Helper function to format berita date
export const formatBeritaDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Comment types and interfaces
export interface Comment {
  id: number;
  beritaId: number;
  nama: string;
  email?: string;
  konten: string;
  foto?: string; // Field foto pengguna
  parentId?: number;
  likes: number;
  dislikes: number;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentRequest {
  beritaId: number;
  nama: string;
  email?: string;
  konten: string;
  foto?: string; // Field foto pengguna
  parentId?: number;
}

export interface CommentReaction {
  commentId: number;
  type: 'LIKE' | 'DISLIKE';
}

// Comment API functions - Complete implementation
export const commentAPI = {
  // Get comments for a berita
  getCommentsByBeritaId: (beritaId: number): Promise<Comment[]> =>
    apiCall<Comment[]>(`/comments/berita/${beritaId}`),

  // Get paginated comments for a berita
  getPaginatedComments: (beritaId: number, page: number = 0, size: number = 10): Promise<{
    content: Comment[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
  }> =>
    apiCall(`/comments/berita/${beritaId}/paginated?page=${page}&size=${size}`),

  // Create new comment
  createComment: (comment: CommentRequest): Promise<Comment> =>
    apiCall<Comment>('/comments', {
      method: 'POST',
      body: JSON.stringify(comment),
    }),

  // Reply to comment
  replyToComment: (parentId: number, comment: CommentRequest): Promise<Comment> =>
    apiCall<Comment>(`/comments/${parentId}/reply`, {
      method: 'POST',
      body: JSON.stringify(comment),
    }),

  // Get replies for a comment
  getReplies: (commentId: number): Promise<Comment[]> =>
    apiCall<Comment[]>(`/comments/${commentId}/replies`),

  // Get specific comment by ID
  getComment: (commentId: number): Promise<Comment> =>
    apiCall<Comment>(`/comments/${commentId}`),

  // Update comment
  updateComment: (commentId: number, comment: CommentRequest): Promise<Comment> =>
    apiCall<Comment>(`/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(comment),
    }),  // Like comment
  likeComment: (commentId: number, biografiId: number, userName: string): Promise<void> =>
    apiCall<void>(`/comments/${commentId}/like`, {
      method: 'POST',
      body: JSON.stringify({
        biografiId: biografiId,
        userName: userName
      }),
    }),

  // Dislike comment
  dislikeComment: (commentId: number, biografiId: number, userName: string): Promise<void> =>
    apiCall<void>(`/comments/${commentId}/dislike`, {
      method: 'POST',
      body: JSON.stringify({
        biografiId: biografiId,
        userName: userName
      }),
    }),

  // Delete comment
  deleteComment: (commentId: number): Promise<void> =>
    apiCall<void>(`/comments/${commentId}`, {
      method: 'DELETE',
    }),

  // Get comment count for berita
  getCommentCount: (beritaId: number): Promise<{ count: number }> =>
    apiCall<{ count: number }>(`/comments/berita/${beritaId}/count`),
};

// Helper function to format comment date
export const formatCommentDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays} hari yang lalu`;
  } else if (diffHours > 0) {
    return `${diffHours} jam yang lalu`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} menit yang lalu`;
  } else {
    return 'Baru saja';
  }
};

// Invitation interfaces
// Pagination and filtering interfaces
export interface PagedInvitationResponse {
  content: Invitation[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface InvitationFilters {
  status?: string;
  nama?: string;
  phone?: string;
}

export interface Invitation {
  id: number;
  namaLengkap: string;
  nomorHp: string;
  invitationToken: string;
  status: 'PENDING' | 'SENT' | 'USED' | 'EXPIRED' | 'FAILED' | 'CANCELLED';
  sentAt: string;
  usedAt?: string;
  expiresAt: string;
  cancelledAt?: string;
  whatsappMessageId?: string;
  createdAt: string;
  updatedAt: string;
  createdUser?: User;
  hasBiografi?: boolean;
  userId?: number;
  userFullName?: string;
}

export interface InvitationRequest {
  namaLengkap: string;
  nomorHp: string;
  durationDays?: number;
  invitationType?: 'MEMBER' | 'COMPANY';
  companyName?: string;
}

export interface RegistrationRequest {
  username: string;
  email: string;
  password: string;
  phoneNumber: string;
  ownerName: string;
  companyName: string;
  agencyRange: string;
  reasonToUse: string;
}

// Invitation API functions
export const invitationAPI = {
  // Send invitation
  sendInvitation: (request: InvitationRequest): Promise<Invitation> =>
    apiCall<Invitation>('/invitations/send', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  // Get invitation history
  getInvitationHistory: (): Promise<Invitation[]> =>
    apiCall<Invitation[]>('/invitations/history'),

  // Get invitation by token
  getInvitationByToken: (token: string): Promise<Invitation> =>
    apiCall<Invitation>(`/invitations/token/${token}`),

  // Resend invitation
  resendInvitation: (id: number): Promise<{ message: string; invitation: Invitation }> =>
    apiCall<{ message: string; invitation: Invitation }>(`/invitations/${id}/resend`, {
      method: 'POST',
    }),

  // Cancel invitation
  cancelInvitation: (id: number): Promise<{ message: string; invitation: Invitation }> =>
    apiCall<{ message: string; invitation: Invitation }>(`/invitations/${id}/cancel`, {
      method: 'POST',
    }),
  // Get invitation statistics
  getInvitationStatistics: (): Promise<any> =>
    apiCall<any>('/invitations/statistics'),
  // Get paginated invitation history with filtering
  getInvitationHistoryPaginated: (
    page: number = 0,
    size: number = 10,
    filters?: InvitationFilters,
    sortBy: string = 'createdAt',
    sortDirection: string = 'desc'
  ): Promise<PagedInvitationResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    params.append('sortBy', sortBy);
    params.append('sortDirection', sortDirection);
    
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.nama) {
      params.append('nama', filters.nama);
    }
    if (filters?.phone) {
      params.append('phone', filters.phone);
    }    
    return apiCall<PagedInvitationResponse>(`/invitations/history/paginated?${params.toString()}`);
  },
};

export interface CompanySummary {
  companyCode: string;
  companyName: string;
  totalUsers: number;
  activeUsers: number;
  active: boolean;
}

export interface CompanyDetail {
  companyCode: string;
  companyName: string;
  ownerName?: string;
  email?: string;
  phoneNumber?: string;
  agencyRange?: string;
  reasonToUse?: string;
  avatarUrl?: string;
}

export const companyAdminAPI = {
  listCompanies: (): Promise<CompanySummary[]> => apiCall<CompanySummary[]>('/admin/companies'),

  getCompanyDetail: (companyCode: string): Promise<CompanyDetail> =>
    apiCall<CompanyDetail>(`/admin/companies/${encodeURIComponent(companyCode)}`),

  updateCompanyName: (companyCode: string, companyName: string): Promise<{ updated: number }> =>
    apiCall<{ updated: number }>(`/admin/companies/${encodeURIComponent(companyCode)}`, {
      method: 'PUT',
      body: JSON.stringify({ companyName }),
    }),

  updateCompanyStatus: (companyCode: string, status: string): Promise<{ updated: number }> =>
    apiCall<{ updated: number }>(`/admin/companies/${encodeURIComponent(companyCode)}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  deleteCompany: (companyCode: string): Promise<{ deleted: number }> =>
    apiCall<{ deleted: number }>(`/admin/companies/${encodeURIComponent(companyCode)}`, {
      method: 'DELETE',
    }),

  updateCompanyFull: (companyCode: string, data: Partial<CompanyDetail>): Promise<{ updated: number }> =>
    apiCall<{ updated: number }>(`/admin/companies/${encodeURIComponent(companyCode)}/full`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  sendCompanyInvitation: (request: InvitationRequest): Promise<Invitation> =>
    apiCall<Invitation>('/admin/companies/invitations', {
      method: 'POST',
      body: JSON.stringify({ ...request, invitationType: 'COMPANY' }),
    }),
};

// User Approval API functions
export const userApprovalAPI = {  // Get users waiting for approval
  getUsersWaitingApproval: (): Promise<User[]> =>
    apiCall<User[]>('/user-approvals/pending'),
  // Get users waiting for approval with pagination
  getUsersWaitingApprovalPaginated: (params: string): Promise<any> =>
    apiCall<any>(`/user-approvals/pending/paginated?${params}`),

  // Get approved users with pagination
  getApprovedUsersPaginated: (params: string): Promise<any> =>
    apiCall<any>(`/user-approvals/approved/paginated?${params}`),

  // Get rejected users with pagination
  getRejectedUsersPaginated: (params: string): Promise<any> =>
    apiCall<any>(`/user-approvals/rejected/paginated?${params}`),

  // Get all users with pagination
  getAllUsersPaginated: (params: string): Promise<any> =>
    apiCall<any>(`/user-approvals/all/paginated?${params}`),

  // Approve user
  approveUser: (userId: number): Promise<{ message: string; user: User }> =>
    apiCall<{ message: string; user: User }>(`/user-approvals/${userId}/approve`, {
      method: 'POST',
    }),

  // Reject user
  rejectUser: (userId: number, reason?: string): Promise<{ message: string; user: User }> =>
    apiCall<{ message: string; user: User }>(`/user-approvals/${userId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // Get approval statistics
  getApprovalStatistics: (): Promise<any> =>
    apiCall<any>('/user-approvals/statistics'),

  // Get count of users waiting approval
  getUsersWaitingApprovalCount: (): Promise<{ count: number }> =>
    apiCall<{ count: number }>('/user-approvals/pending/count'),
};

// Auth API - Add public registration
export const authAPI = {
  // ... existing auth functions ...

  register: (request: RegistrationRequest): Promise<{
    message: string;
    user: {
      id: number;
      username: string;
      fullName: string;
      email: string;
      status: string;
      ownerName?: string;
      companyName?: string;
      companyCode?: string;
      agencyRange?: string;
      reasonToUse?: string;
    };
  }> =>
    apiCall<{
      message: string;
      user: {
        id: number;
        username: string;
        fullName: string;
        email: string;
        status: string;
        ownerName?: string;
        companyName?: string;
        companyCode?: string;
        agencyRange?: string;
        reasonToUse?: string;
      };
    }>(`/auth/register`, {
      method: 'POST',
      body: JSON.stringify(request),
    }),
};

// Birthday notification interfaces
interface BirthdayNotification {
  id: number;
  biografiId: number;
  namaLengkap: string;
  nomorTelepon: string;
  email: string;
  tanggalLahir: string;
  notificationDate: string;
  year: number;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'EXCLUDED' | 'RESENT';
  statusDisplayName: string;
  message: string;
  sentAt?: string;
  errorMessage?: string;
  isExcluded: boolean;
  createdAt: string;
  updatedAt: string;
  age: number;
}

interface BirthdayStatistics {
  totalBirthdays: number;
  sent: number;
  pending: number;
  failed: number;
  excluded: number;
  year: number;
}

interface OldBirthdaySettings {
  enabled: boolean;
  time: string;
  timezone: string;
  message: string;
  daysAhead: number;
}

interface BirthdayNotificationFilter {
  year?: number;
  status?: string;
  isExcluded?: string;
  nama?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
}

interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// Birthday API functions
export const birthdayAPI = {
  // Get birthday notifications with pagination and filters
  getBirthdayNotifications: (filter: BirthdayNotificationFilter): Promise<PageResponse<BirthdayNotification>> => {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    return apiCall<PageResponse<BirthdayNotification>>(`/admin/birthday/notifications?${params}`);
  },

  // Get upcoming birthdays
  getUpcomingBirthdays: (days: number = 30): Promise<BirthdayNotification[]> =>
    apiCall<BirthdayNotification[]>(`/admin/birthday/upcoming?days=${days}`),

  // Get past birthdays
  getPastBirthdays: (days: number = 30): Promise<BirthdayNotification[]> =>
    apiCall<BirthdayNotification[]>(`/admin/birthday/past?days=${days}`),

  // Get birthday statistics
  getBirthdayStatistics: (year?: number): Promise<BirthdayStatistics> => {
    const params = year ? `?year=${year}` : '';
    return apiCall<BirthdayStatistics>(`/admin/birthday/statistics${params}`);
  },
  // Get birthday settings (old format)
  getBirthdaySettings: (): Promise<OldBirthdaySettings> =>
    apiCall<OldBirthdaySettings>('/admin/birthday/settings'),

  // Generate birthday notifications for a year
  generateBirthdayNotifications: (year: number): Promise<void> =>
    apiCall<void>(`/admin/birthday/generate/${year}`, {
      method: 'POST',
    }),

  // Resend birthday notification
  resendBirthdayNotification: (id: number): Promise<void> =>
    apiCall<void>(`/admin/birthday/resend/${id}`, {
      method: 'POST',
    }),
  // Exclude/include birthday notification
  toggleBirthdayExclusion: (id: number, exclude: boolean): Promise<void> =>
    apiCall<void>(`/admin/birthday/exclude/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ exclude }),
    }),

  // Exclude/include biografi birthday notification
  toggleBiografiBirthdayExclusion: (biografiId: number, exclude: boolean): Promise<void> =>
    apiCall<void>(`/admin/birthday/exclude-biografi/${biografiId}`, {
      method: 'PUT',
      body: JSON.stringify({ exclude }),
    }),// Reset biografi notification status to pending
  resetBiografiNotificationToPending: (biografiId: number): Promise<void> =>
    apiCall<void>(`/admin/birthday/reset-biografi-to-pending/${biografiId}`, {
      method: 'PUT',
    }),

  // Test birthday notification
  testBirthdayNotification: (biografiId: number): Promise<void> =>
    apiCall<void>(`/admin/birthday/test/${biografiId}`, {
      method: 'POST',
    }),

  // Send birthday notification for biografi (create notification and send)
  sendBirthdayNotificationForBiografi: (biografiId: number): Promise<void> =>
    apiCall<void>(`/admin/birthday/send-biografi/${biografiId}`, {
      method: 'POST',
    }),

  // Send today's birthday notifications
  sendTodayBirthdays: (): Promise<void> =>
    apiCall<void>('/admin/birthday/send-today', {
      method: 'POST',
    }),
};

// Birthday Settings API functions
export const birthdaySettingsAPI = {
  // Get current birthday settings
  getCurrentSettings: (): Promise<BirthdaySettings> => 
    apiCall<BirthdaySettings>('/birthday-settings'),
  
  // Update birthday settings
  updateSettings: (settings: Partial<BirthdaySettings>): Promise<BirthdaySettingsResponse> =>
    apiCall<BirthdaySettingsResponse>('/birthday-settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    }),
  
  // Upload attachment image
  uploadImage: async (file: File): Promise<ImageUploadResponse> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`${API_BASE_URL}/birthday-settings/upload-image`, {
      method: 'POST',
      body: formData,
      mode: 'cors',
      credentials: 'omit',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return response.json();
  },
  
  // Reset to default settings
  resetToDefaults: (): Promise<BirthdaySettingsResponse> =>
    apiCall<BirthdaySettingsResponse>('/birthday-settings/reset-defaults', {
      method: 'POST'
    }),
    // Test notification
  testNotification: (phoneNumber: string): Promise<{ success: boolean; message: string }> =>
    apiCall<{ success: boolean; message: string }>('/birthday-settings/test-notification', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber })
    })
};

// Birthday Settings interfaces
export interface BirthdaySettings {
  id?: number;
  enabled: boolean;
  notificationTime: string; // Cron expression
  timezone: string;
  message: string;
  daysAhead: number;
  includeAge?: boolean;
  attachmentImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface BirthdaySettingsResponse {
  success: boolean;
  message: string;
  data: BirthdaySettings;
}

export interface ImageUploadResponse {
  success: boolean;
  message: string;
  imageUrl: string;
}

// Invitation interfaces
export interface Invitation {
  id: number;
  namaLengkap: string;
  nomorHp: string;
  invitationToken: string;
  status: 'PENDING' | 'SENT' | 'USED' | 'EXPIRED' | 'FAILED' | 'CANCELLED';
  sentAt: string;
  usedAt?: string;
  expiresAt: string;
  cancelledAt?: string;
  whatsappMessageId?: string;
  createdAt: string;
  updatedAt: string;
  createdUser?: User;
  hasBiografi?: boolean;
  userId?: number;
  userFullName?: string;
}

export interface InvitationRequest {
  namaLengkap: string;
  nomorHp: string;
  durationDays?: number;
  invitationType?: 'MEMBER' | 'COMPANY';
  companyName?: string;
}

// Location interfaces
export interface ProvinsiResponseDTO {
  id: number;
  kode: string;
  nama: string;
  kotaList: KotaResponseDTO[];
  kotaCount?: number;
}

export interface KotaResponseDTO {
  id: number;
  kode: string;
  nama: string;
  tipe: string;
  provinsiNama: string;
}

// Request DTOs for location CRUD
export interface ProvinsiRequest {
  kode: string;
  nama: string;
}

export interface KotaRequest {
  kode: string;
  nama: string;
  tipe: string; // KOTA, KABUPATEN
  provinsiId: number;
}

// Location API functions
export const locationAPI = {
  // ============ READ ENDPOINTS (PUBLIC) ============
  
  // Get all provinces (without kota list for performance)
  getAllProvinsi: (): Promise<ProvinsiResponseDTO[]> => 
    apiCall<ProvinsiResponseDTO[]>('/location/provinsi'),
  
  // Get all provinces with their kota list
  getAllProvinsiWithKota: (): Promise<ProvinsiResponseDTO[]> => 
    apiCall<ProvinsiResponseDTO[]>('/location/provinsi/with-kota'),
  
  // Get provinsi by ID
  getProvinsiById: (id: number): Promise<ProvinsiResponseDTO> => 
    apiCall<ProvinsiResponseDTO>(`/location/provinsi/${id}`),
  
  // Get kota by provinsi ID
  getKotaByProvinsiId: (provinsiId: number): Promise<KotaResponseDTO[]> => 
    apiCall<KotaResponseDTO[]>(`/location/provinsi/${provinsiId}/kota`),
  
  // Get kota by provinsi name
  getKotaByProvinsiNama: (provinsiNama: string): Promise<KotaResponseDTO[]> => 
    apiCall<KotaResponseDTO[]>(`/location/kota/by-provinsi?provinsiNama=${encodeURIComponent(provinsiNama)}`),
  
  // Get provinsi by name
  getProvinsiByNama: (nama: string): Promise<ProvinsiResponseDTO> => 
    apiCall<ProvinsiResponseDTO>(`/location/provinsi/by-name?nama=${encodeURIComponent(nama)}`),

  // ============ ADMIN CRUD ENDPOINTS ============
  
  // Provinsi CRUD (Admin)
  admin: {
    provinsi: {
      // Get provinsi with pagination
      getAll: (search?: string, page = 0, size = 10) => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        params.append('page', page.toString());
        params.append('size', size.toString());
        
        return apiCall<{
          content: ProvinsiResponseDTO[];
          totalElements: number;
          totalPages: number;
          number: number;
          size: number;
        }>(`/location/admin/provinsi?${params.toString()}`);
      },
      
      // Get provinsi by ID
      getById: (id: number): Promise<ProvinsiResponseDTO> => 
        apiCall<ProvinsiResponseDTO>(`/location/admin/provinsi/${id}`),
      
      // Create provinsi
      create: (data: ProvinsiRequest): Promise<ProvinsiResponseDTO> => 
        apiCall<ProvinsiResponseDTO>('/location/admin/provinsi', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      
      // Update provinsi
      update: (id: number, data: ProvinsiRequest): Promise<ProvinsiResponseDTO> => 
        apiCall<ProvinsiResponseDTO>(`/location/admin/provinsi/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      
      // Delete provinsi
      delete: (id: number): Promise<void> => 
        apiCall<void>(`/location/admin/provinsi/${id}`, {
          method: 'DELETE',
        }),
    },
    
    kota: {
      // Get kota with pagination
      getAll: (search?: string, provinsiId?: number, page = 0, size = 10) => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (provinsiId) params.append('provinsiId', provinsiId.toString());
        params.append('page', page.toString());
        params.append('size', size.toString());
        
        return apiCall<{
          content: KotaResponseDTO[];
          totalElements: number;
          totalPages: number;
          number: number;
          size: number;
        }>(`/location/admin/kota?${params.toString()}`);
      },
      
      // Get kota by ID
      getById: (id: number): Promise<KotaResponseDTO> => 
        apiCall<KotaResponseDTO>(`/location/admin/kota/${id}`),
      
      // Create kota
      create: (data: KotaRequest): Promise<KotaResponseDTO> => 
        apiCall<KotaResponseDTO>('/location/admin/kota', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      
      // Update kota
      update: (id: number, data: KotaRequest): Promise<KotaResponseDTO> => 
        apiCall<KotaResponseDTO>(`/location/admin/kota/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      
      // Delete kota
      delete: (id: number): Promise<void> => 
        apiCall<void>(`/location/admin/kota/${id}`, {
          method: 'DELETE',
        }),    },  },
};

// Master Data Request/Response DTOs
export interface MasterAgamaRequest {
  nama: string;
  deskripsi?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface MasterAgamaResponse {
  id: number;
  nama: string;
  deskripsi?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MasterPosisiJabatanRequest {
  nama: string;
  deskripsi?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface MasterPosisiJabatanResponse {
  id: number;
  nama: string;
  deskripsi?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MasterSpesialisasiKedokteranRequest {
  nama: string;
  deskripsi?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface MasterSpesialisasiKedokteranResponse {
  id: number;
  nama: string;
  deskripsi?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type MasterAgencyAgentGender = 'MALE' | 'FEMALE';

export interface MasterAgencyAgentRequest {
  agentCode: string;
  fullName: string;
  shortName?: string;
  birthday?: string;
  gender?: MasterAgencyAgentGender;
  genderTitle?: string;
  phoneNo: string;
  rankCode: string;
  rankTitle: string;
  appointmentDate?: string;
  isActive?: boolean;
}

export interface MasterAgencyAgentResponse {
  id: number;
  companyCode?: string;
  agentCode: string;
  fullName: string;
  shortName?: string;
  birthday?: string;
  gender?: MasterAgencyAgentGender;
  genderTitle?: string;
  phoneNo: string;
  rankCode: string;
  rankTitle?: string;
  appointmentDate?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MasterAgencyAgentImportError {
  rowNumber: number;
  column: string;
  message: string;
  rawValue?: string;
}

export interface MasterAgencyAgentImportResult {
  success: boolean;
  createdCount: number;
  updatedCount: number;
  errors: MasterAgencyAgentImportError[];
}

export interface MasterAgencyAgentApiImportRequest {
  companyCode: string;
  companyName?: string;
  removeExisting?: boolean;
  items: MasterAgencyAgentRequest[];
}

export interface MasterAgencyAgentListFilters {
  search?: string;
  fullName?: string;
  phoneNo?: string;
  rankCode?: string;
  createdBy?: string;
  isActive?: boolean;
}

export interface MasterPolicySalesRequest {
  agentCode: string;
  policyDate: string;
  policyFyp: number;
  policyApe: number;
}

export interface MasterPolicySalesResponse {
  id: number;
  companyCode?: string;
  agentCode: string;
  policyDate: string;
  policyFyp: number;
  policyApe: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MasterPolicySalesImportError {
  rowNumber: number;
  column: string;
  message: string;
  rawValue?: string;
}

export interface MasterPolicySalesImportResult {
  success: boolean;
  createdCount: number;
  updatedCount: number;
  errors: MasterPolicySalesImportError[];
}

export interface MasterPolicySalesApiImportRequest {
  companyCode: string;
  companyName?: string;
  removeExisting?: boolean;
  items: MasterPolicySalesRequest[];
}

export interface MasterPolicySalesListFilters {
  search?: string;
  agentCode?: string;
  createdBy?: string;
}

// Master Data API functions
export const masterDataAPI = {
  agencyList: {
    getAll: (
      companyCode: string | undefined,
      filters?: MasterAgencyAgentListFilters | string,
      isActiveLegacy?: boolean,
      page = 0,
      size = 10,
      sortBy = 'createdAt',
      sortDir: 'asc' | 'desc' = 'desc'
    ) => {
      const params = new URLSearchParams();
      if (companyCode) params.append('companyCode', companyCode);

      if (typeof filters === 'string') {
        if (filters) params.append('search', filters);
        if (isActiveLegacy !== undefined) params.append('isActive', isActiveLegacy.toString());
      } else {
        const f = filters;
        if (f?.search) params.append('search', f.search);
        if (f?.fullName) params.append('fullName', f.fullName);
        if (f?.phoneNo) params.append('phoneNo', f.phoneNo);
        if (f?.rankCode) params.append('rankCode', f.rankCode);
        if (f?.createdBy) params.append('createdBy', f.createdBy);
        if (f?.isActive !== undefined) params.append('isActive', f.isActive.toString());
      }

      params.append('page', page.toString());
      params.append('size', size.toString());
      params.append('sortBy', sortBy);
      params.append('sortDir', sortDir);

      return apiCall<{
        content: MasterAgencyAgentResponse[];
        totalElements: number;
        totalPages: number;
        number: number;
        size: number;
      }>(`/admin/master-data/agency-list?${params.toString()}`);
    },

    getById: (companyCode: string, id: number): Promise<MasterAgencyAgentResponse> =>
      apiCall<MasterAgencyAgentResponse>(`/admin/master-data/agency-list/${id}?companyCode=${encodeURIComponent(companyCode)}`),

    create: (companyCode: string, data: MasterAgencyAgentRequest): Promise<MasterAgencyAgentResponse> =>
      apiCall<MasterAgencyAgentResponse>(`/admin/master-data/agency-list?companyCode=${encodeURIComponent(companyCode)}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (companyCode: string, id: number, data: MasterAgencyAgentRequest): Promise<MasterAgencyAgentResponse> =>
      apiCall<MasterAgencyAgentResponse>(`/admin/master-data/agency-list/${id}?companyCode=${encodeURIComponent(companyCode)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (companyCode: string, id: number): Promise<void> =>
      apiCall<void>(`/admin/master-data/agency-list/${id}?companyCode=${encodeURIComponent(companyCode)}`, {
        method: 'DELETE',
      }),

    toggleActive: (companyCode: string, id: number): Promise<MasterAgencyAgentResponse> =>
      apiCall<MasterAgencyAgentResponse>(`/admin/master-data/agency-list/${id}/toggle-active?companyCode=${encodeURIComponent(companyCode)}`, {
        method: 'PATCH',
      }),

    importExcel: async (companyCode: string, file: File, removeExisting = false): Promise<MasterAgencyAgentImportResult> => {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}/admin/master-data/agency-list/import-excel?companyCode=${encodeURIComponent(companyCode)}&removeExisting=${removeExisting ? 'true' : 'false'}`, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        credentials: 'omit',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      const text = await response.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        if (isMasterAgencyAgentImportResult(data)) {
          return data;
        }
        const errorMessage = data?.error || data?.message || text || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      if (isMasterAgencyAgentImportResult(data)) {
        return data;
      }
      return (data ?? ({} as any)) as MasterAgencyAgentImportResult;
    },

    importCsv: async (companyCode: string, file: File, removeExisting = false): Promise<MasterAgencyAgentImportResult> => {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}/admin/master-data/agency-list/import-csv?companyCode=${encodeURIComponent(companyCode)}&removeExisting=${removeExisting ? 'true' : 'false'}`, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        credentials: 'omit',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      const text = await response.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        if (isMasterAgencyAgentImportResult(data)) {
          return data;
        }
        const errorMessage = data?.error || data?.message || text || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      if (isMasterAgencyAgentImportResult(data)) {
        return data;
      }
      return (data ?? ({} as any)) as MasterAgencyAgentImportResult;
    },

    importApi: async (companyCode: string, items: MasterAgencyAgentRequest[], companyName?: string, removeExisting = false): Promise<MasterAgencyAgentImportResult> => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/admin/master-data/agency-list/import-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({ companyCode, companyName: companyName || undefined, removeExisting, items } satisfies MasterAgencyAgentApiImportRequest),
      });

      const text = await response.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        if (isMasterAgencyAgentImportResult(data)) {
          return data;
        }
        const errorMessage = data?.error || data?.message || text || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      if (isMasterAgencyAgentImportResult(data)) {
        return data;
      }
      return (data ?? ({} as any)) as MasterAgencyAgentImportResult;
    },

    getTemplateExcelUrl: () => `${API_BASE_URL}/admin/master-data/agency-list/template-excel`,
    getTemplateCsvUrl: () => `${API_BASE_URL}/admin/master-data/agency-list/template-csv`,
  },

  policySales: {
    getAll: (
      companyCode: string | undefined,
      filters?: MasterPolicySalesListFilters | string,
      _legacyUnused?: any,
      page = 0,
      size = 10,
      sortBy = 'createdAt',
      sortDir: 'asc' | 'desc' = 'desc'
    ) => {
      const params = new URLSearchParams();
      if (companyCode) params.append('companyCode', companyCode);

      if (typeof filters === 'string') {
        if (filters) params.append('search', filters);
      } else {
        const f = filters;
        if (f?.search) params.append('search', f.search);
        if (f?.agentCode) params.append('agentCode', f.agentCode);
        if (f?.createdBy) params.append('createdBy', f.createdBy);
      }

      params.append('page', page.toString());
      params.append('size', size.toString());
      params.append('sortBy', sortBy);
      params.append('sortDir', sortDir);

      return apiCall<{
        content: MasterPolicySalesResponse[];
        totalElements: number;
        totalPages: number;
        number: number;
        size: number;
      }>(`/admin/master-data/policy-sales?${params.toString()}`);
    },

    getById: (companyCode: string, id: number): Promise<MasterPolicySalesResponse> =>
      apiCall<MasterPolicySalesResponse>(`/admin/master-data/policy-sales/${id}?companyCode=${encodeURIComponent(companyCode)}`),

    create: (companyCode: string, data: MasterPolicySalesRequest): Promise<MasterPolicySalesResponse> =>
      apiCall<MasterPolicySalesResponse>(`/admin/master-data/policy-sales?companyCode=${encodeURIComponent(companyCode)}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (companyCode: string, id: number, data: MasterPolicySalesRequest): Promise<MasterPolicySalesResponse> =>
      apiCall<MasterPolicySalesResponse>(`/admin/master-data/policy-sales/${id}?companyCode=${encodeURIComponent(companyCode)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (companyCode: string, id: number): Promise<void> =>
      apiCall<void>(`/admin/master-data/policy-sales/${id}?companyCode=${encodeURIComponent(companyCode)}`, {
        method: 'DELETE',
      }),

    importExcel: async (companyCode: string, file: File, removeExisting = false): Promise<MasterPolicySalesImportResult> => {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}/admin/master-data/policy-sales/import-excel?companyCode=${encodeURIComponent(companyCode)}&removeExisting=${removeExisting ? 'true' : 'false'}`, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        credentials: 'omit',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      const text = await response.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        if (isMasterPolicySalesImportResult(data)) {
          return data;
        }
        const errorMessage = data?.error || data?.message || text || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      if (isMasterPolicySalesImportResult(data)) {
        return data;
      }
      return (data ?? ({} as any)) as MasterPolicySalesImportResult;
    },

    importCsv: async (companyCode: string, file: File, removeExisting = false): Promise<MasterPolicySalesImportResult> => {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}/admin/master-data/policy-sales/import-csv?companyCode=${encodeURIComponent(companyCode)}&removeExisting=${removeExisting ? 'true' : 'false'}`, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        credentials: 'omit',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      const text = await response.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        if (isMasterPolicySalesImportResult(data)) {
          return data;
        }
        const errorMessage = data?.error || data?.message || text || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      if (isMasterPolicySalesImportResult(data)) {
        return data;
      }
      return (data ?? ({} as any)) as MasterPolicySalesImportResult;
    },

    importApi: async (companyCode: string, items: MasterPolicySalesRequest[], companyName?: string, removeExisting = false): Promise<MasterPolicySalesImportResult> => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/admin/master-data/policy-sales/import-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({ companyCode, companyName: companyName || undefined, removeExisting, items } satisfies MasterPolicySalesApiImportRequest),
      });

      const text = await response.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        if (isMasterPolicySalesImportResult(data)) {
          return data;
        }
        const errorMessage = data?.error || data?.message || text || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      if (isMasterPolicySalesImportResult(data)) {
        return data;
      }
      return (data ?? ({} as any)) as MasterPolicySalesImportResult;
    },

    getTemplateExcelUrl: () => `${API_BASE_URL}/admin/master-data/policy-sales/template-excel`,
    getTemplateCsvUrl: () => `${API_BASE_URL}/admin/master-data/policy-sales/template-csv`,
  },

  // Spesialisasi API
  spesialisasi: {
    getAll: (search?: string, isActive?: boolean, page = 0, size = 10) => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (isActive !== undefined) params.append('isActive', isActive.toString());
      params.append('page', page.toString());
      params.append('size', size.toString());
      
      return apiCall<{
        content: MasterSpesialisasiResponse[];
        totalElements: number;
        totalPages: number;
        number: number;
        size: number;
      }>(`/admin/master-data/spesialisasi?${params.toString()}`);
    },
    
    getAllActive: (): Promise<MasterSpesialisasiResponse[]> => 
      apiCall<MasterSpesialisasiResponse[]>('/admin/master-data/spesialisasi/active'),
    
    getById: (id: number): Promise<MasterSpesialisasiResponse> => 
      apiCall<MasterSpesialisasiResponse>(`/admin/master-data/spesialisasi/${id}`),
    
    create: (data: MasterSpesialisasiRequest): Promise<MasterSpesialisasiResponse> => 
      apiCall<MasterSpesialisasiResponse>('/admin/master-data/spesialisasi', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: number, data: MasterSpesialisasiRequest): Promise<MasterSpesialisasiResponse> => 
      apiCall<MasterSpesialisasiResponse>(`/admin/master-data/spesialisasi/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    delete: (id: number): Promise<void> => 
      apiCall<void>(`/admin/master-data/spesialisasi/${id}`, {
        method: 'DELETE',
      }),
    
    toggleActive: (id: number): Promise<MasterSpesialisasiResponse> => 
      apiCall<MasterSpesialisasiResponse>(`/admin/master-data/spesialisasi/${id}/toggle-active`, {
        method: 'PATCH',
      }),
  },

  // Posisi API
  posisi: {
    getAll: (search?: string, kategori?: string, isActive?: boolean, page = 0, size = 10) => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (kategori) params.append('kategori', kategori);
      if (isActive !== undefined) params.append('isActive', isActive.toString());
      params.append('page', page.toString());
      params.append('size', size.toString());
      
      return apiCall<{
        content: MasterPosisiResponse[];
        totalElements: number;
        totalPages: number;
        number: number;
        size: number;
      }>(`/admin/master-data/posisi?${params.toString()}`);
    },
    
    getAllActive: (): Promise<MasterPosisiResponse[]> => 
      apiCall<MasterPosisiResponse[]>('/admin/master-data/posisi/active'),
    
    getByCategory: (kategori: string): Promise<MasterPosisiResponse[]> => 
      apiCall<MasterPosisiResponse[]>(`/admin/master-data/posisi/category/${kategori}`),
    
    getCategories: (): Promise<string[]> => 
      apiCall<string[]>('/admin/master-data/posisi/categories'),
    
    getById: (id: number): Promise<MasterPosisiResponse> => 
      apiCall<MasterPosisiResponse>(`/admin/master-data/posisi/${id}`),
    
    create: (data: MasterPosisiRequest): Promise<MasterPosisiResponse> => 
      apiCall<MasterPosisiResponse>('/admin/master-data/posisi', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: number, data: MasterPosisiRequest): Promise<MasterPosisiResponse> => 
      apiCall<MasterPosisiResponse>(`/admin/master-data/posisi/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    delete: (id: number): Promise<void> => 
      apiCall<void>(`/admin/master-data/posisi/${id}`, {
        method: 'DELETE',
      }),
    
    toggleActive: (id: number): Promise<MasterPosisiResponse> => 
      apiCall<MasterPosisiResponse>(`/admin/master-data/posisi/${id}/toggle-active`, {
        method: 'PATCH',
      }),
  },

  // Hobi API
  hobi: {
    getAll: (search?: string, kategori?: string, isActive?: boolean, page = 0, size = 10) => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (kategori) params.append('kategori', kategori);
      if (isActive !== undefined) params.append('isActive', isActive.toString());
      params.append('page', page.toString());
      params.append('size', size.toString());
      
      return apiCall<{
        content: MasterHobiResponse[];
        totalElements: number;
        totalPages: number;
        number: number;
        size: number;
      }>(`/admin/master-data/hobi?${params.toString()}`);
    },
    
    getAllActive: (): Promise<MasterHobiResponse[]> => 
      apiCall<MasterHobiResponse[]>('/admin/master-data/hobi/active'),
    
    getByCategory: (kategori: string): Promise<MasterHobiResponse[]> => 
      apiCall<MasterHobiResponse[]>(`/admin/master-data/hobi/category/${kategori}`),
    
    getCategories: (): Promise<string[]> => 
      apiCall<string[]>('/admin/master-data/hobi/categories'),
    
    getById: (id: number): Promise<MasterHobiResponse> => 
      apiCall<MasterHobiResponse>(`/admin/master-data/hobi/${id}`),
    
    create: (data: MasterHobiRequest): Promise<MasterHobiResponse> => 
      apiCall<MasterHobiResponse>('/admin/master-data/hobi', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: number, data: MasterHobiRequest): Promise<MasterHobiResponse> => 
      apiCall<MasterHobiResponse>(`/admin/master-data/hobi/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    delete: (id: number): Promise<void> => 
      apiCall<void>(`/admin/master-data/hobi/${id}`, {
        method: 'DELETE',
      }),
    
    toggleActive: (id: number): Promise<MasterHobiResponse> => 
      apiCall<MasterHobiResponse>(`/admin/master-data/hobi/${id}/toggle-active`, {
        method: 'PATCH',
      }),
  },
  // Agama API
  agama: {
    getAll: (search?: string, isActive?: boolean, page = 0, size = 10, sortBy = 'sortOrder', sortDir = 'asc') => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (isActive !== undefined) params.append('isActive', isActive.toString());
      params.append('page', page.toString());
      params.append('size', size.toString());
      params.append('sortBy', sortBy);
      params.append('sortDir', sortDir);
      
      return apiCall<{
        content: MasterAgamaResponse[];
        totalElements: number;
        totalPages: number;
        number: number;
        size: number;
      }>(`/admin/master-data/agama?${params.toString()}`);
    },
    
    getAllActive: (): Promise<MasterAgamaResponse[]> => 
      apiCall<MasterAgamaResponse[]>('/admin/master-data/agama/active'),
    
    getById: (id: number): Promise<MasterAgamaResponse> => 
      apiCall<MasterAgamaResponse>(`/admin/master-data/agama/${id}`),
    
    create: (data: MasterAgamaRequest): Promise<MasterAgamaResponse> => 
      apiCall<MasterAgamaResponse>('/admin/master-data/agama', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: number, data: MasterAgamaRequest): Promise<MasterAgamaResponse> => 
      apiCall<MasterAgamaResponse>(`/admin/master-data/agama/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    delete: (id: number): Promise<void> => 
      apiCall<void>(`/admin/master-data/agama/${id}`, {
        method: 'DELETE',
      }),
    
    toggleActive: (id: number): Promise<MasterAgamaResponse> => 
      apiCall<MasterAgamaResponse>(`/admin/master-data/agama/${id}/toggle-active`, {
        method: 'PATCH',
      }),
  },

  // Posisi Jabatan API
  posisiJabatan: {
    getAll: (search?: string, isActive?: boolean, page = 0, size = 10) => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (isActive !== undefined) params.append('isActive', isActive.toString());
      params.append('page', page.toString());
      params.append('size', size.toString());
      
      return apiCall<{
        content: MasterPosisiJabatanResponse[];
        totalElements: number;
        totalPages: number;
        number: number;
        size: number;
      }>(`/admin/master-data/posisi-jabatan?${params.toString()}`);
    },
    
    getAllActive: (): Promise<MasterPosisiJabatanResponse[]> => 
      apiCall<MasterPosisiJabatanResponse[]>('/admin/master-data/posisi-jabatan/active'),
    
    getById: (id: number): Promise<MasterPosisiJabatanResponse> => 
      apiCall<MasterPosisiJabatanResponse>(`/admin/master-data/posisi-jabatan/${id}`),
    
    create: (data: MasterPosisiJabatanRequest): Promise<MasterPosisiJabatanResponse> => 
      apiCall<MasterPosisiJabatanResponse>('/admin/master-data/posisi-jabatan', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: number, data: MasterPosisiJabatanRequest): Promise<MasterPosisiJabatanResponse> => 
      apiCall<MasterPosisiJabatanResponse>(`/admin/master-data/posisi-jabatan/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    delete: (id: number): Promise<void> => 
      apiCall<void>(`/admin/master-data/posisi-jabatan/${id}`, {
        method: 'DELETE',
      }),
    
    toggleActive: (id: number): Promise<MasterPosisiJabatanResponse> => 
      apiCall<MasterPosisiJabatanResponse>(`/admin/master-data/posisi-jabatan/${id}/toggle-active`, {
        method: 'PATCH',
      }),
  },

  // Spesialisasi Kedokteran API
  spesialisasiKedokteran: {
    getAll: (search?: string, isActive?: boolean, page = 0, size = 10) => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (isActive !== undefined) params.append('isActive', isActive.toString());
      params.append('page', page.toString());
      params.append('size', size.toString());
      
      return apiCall<{
        content: MasterSpesialisasiKedokteranResponse[];
        totalElements: number;
        totalPages: number;
        number: number;
        size: number;
      }>(`/admin/master-data/spesialisasi-kedokteran?${params.toString()}`);
    },
    
    getAllActive: (): Promise<MasterSpesialisasiKedokteranResponse[]> => 
      apiCall<MasterSpesialisasiKedokteranResponse[]>('/admin/master-data/spesialisasi-kedokteran/active'),
    
    getById: (id: number): Promise<MasterSpesialisasiKedokteranResponse> => 
      apiCall<MasterSpesialisasiKedokteranResponse>(`/admin/master-data/spesialisasi-kedokteran/${id}`),
    
    create: (data: MasterSpesialisasiKedokteranRequest): Promise<MasterSpesialisasiKedokteranResponse> => 
      apiCall<MasterSpesialisasiKedokteranResponse>('/admin/master-data/spesialisasi-kedokteran', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: number, data: MasterSpesialisasiKedokteranRequest): Promise<MasterSpesialisasiKedokteranResponse> => 
      apiCall<MasterSpesialisasiKedokteranResponse>(`/admin/master-data/spesialisasi-kedokteran/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    delete: (id: number): Promise<void> => 
      apiCall<void>(`/admin/master-data/spesialisasi-kedokteran/${id}`, {
        method: 'DELETE',
      }),
    
    toggleActive: (id: number): Promise<MasterSpesialisasiKedokteranResponse> => 
      apiCall<MasterSpesialisasiKedokteranResponse>(`/admin/master-data/spesialisasi-kedokteran/${id}/toggle-active`, {
        method: 'PATCH',
      }),
  },
}

// Wilayah API for location codes conversion
export const wilayahAPI = {
  // Convert batch of location codes to readable names
  convertCodesToNames: async (codeMap: Record<string, string>): Promise<Record<string, string>> => {
    return apiCall<Record<string, string>>('/wilayah/names', {
      method: 'POST',
      body: JSON.stringify(codeMap),
    });
  },

  // Convert single location code to readable name
  convertCodeToName: async (code: string): Promise<string> => {
    const response = await apiCall<{ kode: string; nama: string }>(`/wilayah/name/${code}`);
    return response.nama;
  },

  // Helper function to convert biografi location data
  convertBiografiLocation: async (biografi: any): Promise<{
    provinsiNama?: string;
       kotaNama?: string;
    kecamatanNama?: string;
    kelurahanNama?: string;
  }> => {
    const codeMap: Record<string, string> = {};
    
    if (biografi.provinsi) codeMap[biografi.provinsi] = 'provinsi';
   
    if (biografi.kota) codeMap[biografi.kota] = 'kota';
    if (biografi.kecamatan) codeMap[biografi.kecamatan] = 'kecamatan';
    if (biografi.kelurahan) codeMap[biografi.kelurahan] = 'kelurahan';

    if (Object.keys(codeMap).length === 0) {
      return {};
    }

    try {
      const nameMap = await wilayahAPI.convertCodesToNames(codeMap);
      
      return {
        provinsiNama: biografi.provinsi ? nameMap[biografi.provinsi] : undefined,
        kotaNama: biografi.kota ? nameMap[biografi.kota] : undefined,
        kecamatanNama: biografi.kecamatan ? nameMap[biografi.kecamatan] : undefined,
        kelurahanNama: biografi.kelurahan ? nameMap[biografi.kelurahan] : undefined,
      };
    } catch (error) {
      console.error('Error converting location codes:', error);
      return {};
    }
  },
};

// Configuration API
export const configAPI = {
  getUploadLimits: async () => {
    const response = await fetch(`${API_BASE_URL}/api/config/upload-limits`)
    if (!response.ok) {
      throw new Error('Failed to fetch upload limits')
    }
    return response.json()
  }
}

// Video Report Types
export interface VideoAvatarOption {
  avatar_id: string;
  display_name?: string;
  avatar_name?: string;
  gender?: string;
  thumbnail_url?: string;
  preview_url?: string;
  is_premium?: boolean;
  type?: string;
}

export interface ExcelRow {
  rowNumber: number;
  name: string;
  phone: string;
  avatar: string;
  validPhone: boolean;
  validAvatar: boolean;
  phoneError?: string;
  avatarError?: string;
}

export interface ExcelValidationResult {
  valid: boolean;
  errors: string[];
  rows: ExcelRow[];
}

export interface VideoReportItemRequest {
  rowNumber: number;
  name: string;
  phone: string;
  avatar: string;
}

export interface VideoReportRequest {
  reportName: string;
  messageTemplate: string;
  waMessageTemplate?: string;
  useBackground?: boolean;
  backgroundName?: string;
  preview?: boolean;
  items: VideoReportItemRequest[];
}

export interface VideoReportItemResponse {
  id: number;
  rowNumber: number;
  name: string;
  phone: string;
  avatar: string;
  personalizedMessage: string;
  providerVideoId: string;
  status: string;
  videoUrl: string;
  videoGeneratedAt?: string;
  errorMessage?: string;
  // WhatsApp fields
  waStatus?: string;
  waMessageId?: string;
  waErrorMessage?: string;
  waSentAt?: string;
  excluded?: boolean;
}

export interface VideoReportResponse {
  id: number;
  reportName: string;
  messageTemplate: string;
  waMessageTemplate?: string;
  useBackground?: boolean;
  backgroundName?: string;
  status: string;
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  failedCount: number;
  // Detailed status counts from DB
  pendingCount?: number;
  processingCount?: number;
  // WhatsApp stats
  waSentCount?: number;
  waFailedCount?: number;
  waPendingCount?: number;
  createdAt: string;
  completedAt?: string;
  items: VideoReportItemResponse[];
  // Pagination info for items
  itemsPage?: number;
  itemsTotalPages?: number;
  itemsTotalElements?: number;
}

export interface VideoPreviewRequest {
  messageTemplate: string;
  useBackground?: boolean;
  backgroundName?: string;
  rowNumber?: number;
  name: string;
  phone?: string;
  avatar: string;
}

export interface VideoPreviewResponse {
  success: boolean;
  videoId?: string;
  status?: string;
  type?: string;
  resultUrl?: string;
  error?: string;
}

// Message Template Types
export interface MessageTemplate {
  id: number;
  type: 'VIDEO' | 'WHATSAPP';
  languageCode: string;
  languageName: string;
  template: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  isDefault: boolean;
}

// Message Template API
export const messageTemplateAPI = {
  // Get all templates
  getAllTemplates: (): Promise<MessageTemplate[]> =>
    apiCall<MessageTemplate[]>('/message-templates'),

  // Get templates by type
  getTemplatesByType: (type: 'VIDEO' | 'WHATSAPP' | 'PDF' | 'WHATSAPP_PDF'): Promise<MessageTemplate[]> =>
    apiCall<MessageTemplate[]>(`/message-templates/type/${type}`),

  // Get template by type and language
  getTemplate: (type: 'VIDEO' | 'WHATSAPP' | 'PDF' | 'WHATSAPP_PDF', languageCode: string): Promise<MessageTemplate> =>
    apiCall<MessageTemplate>(`/message-templates/type/${type}/language/${languageCode}`),

  // Get default template by type
  getDefaultTemplate: (type: 'VIDEO' | 'WHATSAPP' | 'PDF' | 'WHATSAPP_PDF'): Promise<MessageTemplate> =>
    apiCall<MessageTemplate>(`/message-templates/type/${type}/default`),

  // Get both default templates
  getDefaults: (): Promise<{ template: string; waTemplate: string }> =>
    apiCall<{ template: string; waTemplate: string }>('/message-templates/defaults'),

  // Get available languages
  getLanguages: (): Promise<{ video: LanguageOption[]; whatsapp: LanguageOption[]; pdf: LanguageOption[]; whatsapp_pdf: LanguageOption[] }> =>
    apiCall<{ video: LanguageOption[]; whatsapp: LanguageOption[]; pdf: LanguageOption[]; whatsapp_pdf: LanguageOption[] }>('/message-templates/languages'),

  // Update template
  updateTemplate: (id: number, template: string, isDefault?: boolean): Promise<MessageTemplate> =>
    apiCall<MessageTemplate>(`/message-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ template, isDefault }),
    }),
};

// Video Report API
export const videoReportAPI = {
  // Get default message template
  getDefaultTemplate: (): Promise<{ template: string; waTemplate: string }> =>
    apiCall<{ template: string; waTemplate: string }>('/message-templates/defaults'),

  // Get available avatars
  getPresenters: (options?: { avatarId?: string }): Promise<VideoAvatarOption[]> => {
    const avatarId = options?.avatarId ? String(options.avatarId).trim() : ''
    const qs = avatarId ? `?avatarId=${encodeURIComponent(avatarId)}` : ''
    return apiCall<VideoAvatarOption[]>(`/video-reports/avatars${qs}`)
  },

  // Get available video backgrounds
  getBackgrounds: (): Promise<string[]> =>
    apiCall<string[]>('/video-backgrounds'),

  // Validate Excel file
  validateExcel: async (file: File): Promise<ExcelValidationResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/video-reports/validate-excel`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to validate Excel file');
    }
    
    return response.json();
  },

  // Create video report
  createVideoReport: (request: VideoReportRequest): Promise<VideoReportResponse> =>
    apiCall<VideoReportResponse>('/video-reports', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  // Start ephemeral preview (no DB)
  startPreview: (request: VideoPreviewRequest): Promise<VideoPreviewResponse> =>
    apiCall<VideoPreviewResponse>('/video-reports/preview', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  // Poll ephemeral preview status (no DB)
  getPreviewStatus: (videoId: string): Promise<VideoPreviewResponse> =>
    apiCall<VideoPreviewResponse>(`/video-reports/preview/${encodeURIComponent(videoId)}`),

  // Get video report by ID (without items)
  getVideoReport: (id: number): Promise<VideoReportResponse> =>
    apiCall<VideoReportResponse>(`/video-reports/${id}`),

  // Get video report items with server-side pagination
  getVideoReportItems: (
    id: number, 
    page: number = 0, 
    size: number = 50, 
    status?: string, 
    search?: string,
    waStatus?: string
  ): Promise<VideoReportResponse> => {
    let url = `/video-reports/${id}/items?page=${page}&size=${size}`;
    if (status && status !== 'all') {
      url += `&status=${status}`;
    }
    if (waStatus) {
      url += `&waStatus=${waStatus}`;
    }
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return apiCall<VideoReportResponse>(url);
  },

  // Get all video reports
  getAllVideoReports: (page: number = 0, size: number = 10): Promise<{ content: VideoReportResponse[]; totalPages: number; totalElements: number }> =>
    apiCall<{ content: VideoReportResponse[]; totalPages: number; totalElements: number }>(`/video-reports?page=${page}&size=${size}`),

  // Refresh status
  refreshStatus: (id: number): Promise<VideoReportResponse> =>
    apiCall<VideoReportResponse>(`/video-reports/${id}/refresh-status`, {
      method: 'POST',
    }),

  // Sync WA status from Wablas
  syncWaStatus: (id: number): Promise<{ success: boolean; error?: string; updated?: number; delivered?: number; read?: number; failed?: number }> =>
    apiCall<{ success: boolean; error?: string; updated?: number; delivered?: number; read?: number; failed?: number }>(`/video-reports/${id}/wa-sync`, {
      method: 'POST',
    }),

  // Delete video report
  deleteVideoReport: (id: number): Promise<void> =>
    apiCall<void>(`/video-reports/${id}`, {
      method: 'DELETE',
    }),

  // Generate shareable link for a video item
  generateShareLink: (reportId: number, itemId: number): Promise<{ token: string; shareUrl: string }> =>
    apiCall<{ token: string; shareUrl: string }>(`/video-reports/${reportId}/items/${itemId}/share-link`),

  // Get video by encrypted token (public - no auth)
  getVideoByToken: async (token: string): Promise<{
    id: number;
    name: string;
    status: string;
    videoUrl?: string;
    personalizedMessage?: string;
    message?: string;
    error?: string;
  }> => {
    const response = await fetch(`${API_BASE_URL}/video-reports/view/${token}`);
    return response.json();
  },
  
  // Generate video for single item
  generateSingleVideo: (reportId: number, itemId: number): Promise<{ success: boolean; item?: VideoReportItemResponse; error?: string }> =>
    apiCall<{ success: boolean; item?: VideoReportItemResponse; error?: string }>(`/video-reports/${reportId}/items/${itemId}/generate`, {
      method: 'POST',
    }),
  
  // Toggle exclude item
  toggleExcludeItem: (reportId: number, itemId: number): Promise<{ success: boolean; excluded?: boolean; error?: string }> =>
    apiCall<{ success: boolean; excluded?: boolean; error?: string }>(`/video-reports/${reportId}/items/${itemId}/toggle-exclude`, {
      method: 'POST',
    }),
  
  // Delete video for single item
  deleteItemVideo: (reportId: number, itemId: number): Promise<{ success: boolean; item?: VideoReportItemResponse; error?: string }> =>
    apiCall<{ success: boolean; item?: VideoReportItemResponse; error?: string }>(`/video-reports/${reportId}/items/${itemId}/video`, {
      method: 'DELETE',
    }),
  
  // Delete all videos in report
  deleteAllVideos: (reportId: number): Promise<{ success: boolean; error?: string }> =>
    apiCall<{ success: boolean; error?: string }>(`/video-reports/${reportId}/videos`, {
      method: 'DELETE',
    }),
  
  // Start WA blast
  startWaBlast: (reportId: number): Promise<{ success: boolean; message?: string; error?: string }> =>
    apiCall<{ success: boolean; message?: string; error?: string }>(`/video-reports/${reportId}/wa-blast`, {
      method: 'POST',
    }),
  
  // Resend WA to single item
  resendWa: (reportId: number, itemId: number): Promise<{ success: boolean; item?: VideoReportItemResponse; error?: string }> =>
    apiCall<{ success: boolean; item?: VideoReportItemResponse; error?: string }>(`/video-reports/${reportId}/items/${itemId}/resend-wa`, {
      method: 'POST',
    }),

  // Regenerate single video
  regenerateVideo: (reportId: number, itemId: number): Promise<{ success: boolean; item?: VideoReportItemResponse; error?: string }> =>
    apiCall<{ success: boolean; item?: VideoReportItemResponse; error?: string }>(`/video-reports/${reportId}/items/${itemId}/regenerate-video`, {
      method: 'POST',
    }),

  // Regenerate all failed videos
  regenerateAllFailedVideos: (reportId: number): Promise<{ success: boolean; message?: string; count?: number; error?: string }> =>
    apiCall<{ success: boolean; message?: string; count?: number; error?: string }>(`/video-reports/${reportId}/regenerate-failed-videos`, {
      method: 'POST',
    }),
  
  // Update WA template
  updateWaTemplate: (reportId: number, waTemplate: string): Promise<{ success: boolean; waMessageTemplate?: string; error?: string }> =>
    apiCall<{ success: boolean; waMessageTemplate?: string; error?: string }>(`/video-reports/${reportId}/wa-template`, {
      method: 'PUT',
      body: JSON.stringify({ waTemplate }),
    }),

  // Export report to Excel
  exportToExcel: async (reportId: number, reportName: string): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/video-reports/${reportId}/export-excel`, {
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to export Excel file');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${reportName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

// PDF Report Types
export interface PdfExcelRow {
  rowNumber: number;
  name: string;
  phone: string;
  validPhone: boolean;
  phoneError?: string;
}

export interface PdfExcelValidationResult {
  valid: boolean;
  errors: string[];
  rows: PdfExcelRow[];
}

export interface PdfReportRequest {
  reportName: string;
  messageTemplate: string;
  waMessageTemplate: string;
  items: {
    rowNumber: number;
    name: string;
    phone: string;
  }[];
  userId?: number;
}

export interface PdfReportItemResponse {
  id: number;
  rowNumber: number;
  name: string;
  phone: string;
  personalizedMessage: string;
  status: string;
  pdfUrl?: string;
  pdfFilename?: string;
  pdfGeneratedAt?: string;
  errorMessage?: string;
  waStatus: string;
  waMessageId?: string;
  waErrorMessage?: string;
  waSentAt?: string;
  excluded?: boolean;
}

export interface PdfReportResponse {
  id: number;
  reportName: string;
  messageTemplate: string;
  waMessageTemplate: string;
  status: string;
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  failedCount: number;
  // Detailed status counts from DB
  pendingCount?: number;
  processingCount?: number;
  // WhatsApp stats
  waSentCount: number;
  waFailedCount: number;
  waPendingCount: number;
  createdAt: string;
  completedAt?: string;
  items: PdfReportItemResponse[];
  itemsPage?: number;
  itemsTotalPages?: number;
  itemsTotalElements?: number;
}

// PDF Report API
export const pdfReportAPI = {
  // Get default templates for PDF report
  getDefaultTemplates: (): Promise<{ messageTemplate: string; waMessageTemplate: string }> =>
    apiCall<{ messageTemplate: string; waMessageTemplate: string }>('/pdf-reports/template'),

  // Download Excel template
  downloadExcelTemplate: async (): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/pdf-reports/template-excel`, {
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to download Excel template');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-pdf-report.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Validate Excel file
  validateExcel: async (file: File): Promise<PdfExcelValidationResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/pdf-reports/validate-excel`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to validate Excel file');
    }
    
    return response.json();
  },

  // Create PDF report
  createPdfReport: (request: PdfReportRequest): Promise<{ id: number; message: string }> =>
    apiCall<{ id: number; message: string }>('/pdf-reports', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  // Get all PDF reports
  getAllPdfReports: (page: number = 0, size: number = 10): Promise<{ content: PdfReportResponse[]; totalPages: number; totalElements: number }> =>
    apiCall<{ content: PdfReportResponse[]; totalPages: number; totalElements: number }>(`/pdf-reports?page=${page}&size=${size}`),

  // Get PDF report by ID with paginated items
  getPdfReport: (
    id: number, 
    page: number = 0, 
    size: number = 20, 
    status?: string, 
    search?: string,
    waStatus?: string
  ): Promise<PdfReportResponse> => {
    let url = `/pdf-reports/${id}?page=${page}&size=${size}`;
    if (status && status !== 'all') {
      url += `&status=${status}`;
    }
    if (waStatus) {
      url += `&waStatus=${waStatus}`;
    }
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return apiCall<PdfReportResponse>(url);
  },

  // Delete PDF report
  deletePdfReport: (id: number): Promise<void> =>
    apiCall<void>(`/pdf-reports/${id}`, {
      method: 'DELETE',
    }),

  // Generate single PDF
  generateSinglePdf: (reportId: number, itemId: number): Promise<{ message: string; pdfUrl: string }> =>
    apiCall<{ message: string; pdfUrl: string }>(`/pdf-reports/${reportId}/items/${itemId}/generate`, {
      method: 'POST',
    }),

  // Toggle exclude item
  toggleExcludeItem: (reportId: number, itemId: number): Promise<{ message: string; excluded: boolean }> =>
    apiCall<{ message: string; excluded: boolean }>(`/pdf-reports/${reportId}/items/${itemId}/toggle-exclude`, {
      method: 'POST',
    }),

  // Delete PDF for single item
  deleteItemPdf: (reportId: number, itemId: number): Promise<{ message: string }> =>
    apiCall<{ message: string }>(`/pdf-reports/${reportId}/items/${itemId}/pdf`, {
      method: 'DELETE',
    }),

  // Delete all PDFs in report
  deleteAllPdfs: (reportId: number): Promise<{ message: string }> =>
    apiCall<{ message: string }>(`/pdf-reports/${reportId}/pdfs`, {
      method: 'DELETE',
    }),

  // Start WA blast
  startWaBlast: (reportId: number): Promise<{ message: string }> =>
    apiCall<{ message: string }>(`/pdf-reports/${reportId}/wa-blast`, {
      method: 'POST',
    }),

  // Resend WA to single item
  resendWa: (reportId: number, itemId: number): Promise<{ message: string; waStatus: string }> =>
    apiCall<{ message: string; waStatus: string }>(`/pdf-reports/${reportId}/items/${itemId}/resend-wa`, {
      method: 'POST',
    }),

  // Update WA template
  updateWaTemplate: (reportId: number, waMessageTemplate: string): Promise<{ message: string }> =>
    apiCall<{ message: string }>(`/pdf-reports/${reportId}/wa-template`, {
      method: 'PUT',
      body: JSON.stringify({ waMessageTemplate }),
    }),

  // Retry failed PDFs
  retryFailedPdfs: (reportId: number): Promise<{ message: string }> =>
    apiCall<{ message: string }>(`/pdf-reports/${reportId}/retry-failed`, {
      method: 'POST',
    }),

  // Retry failed WA messages
  retryFailedWaMessages: (reportId: number): Promise<{ message: string }> =>
    apiCall<{ message: string }>(`/pdf-reports/${reportId}/retry-failed-wa`, {
      method: 'POST',
    }),

  // Export report to Excel
  exportToExcel: async (reportId: number, reportName: string): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/pdf-reports/${reportId}/export`, {
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to export Excel file');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pdf_report_${reportName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Get PDF by token (public - no auth)
  getPdfByToken: async (token: string): Promise<{
    name: string;
    pdfUrl: string;
    pdfFilename: string;
    error?: string;
  }> => {
    const response = await fetch(`${API_BASE_URL}/pdf-reports/view/${token}`);
    return response.json();
  },
};

// File Manager API
export const fileManager = {
  getAllFolders: async (): Promise<any[]> => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`${API_BASE_URL}/admin/file-manager/folders`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch folders");
    return response.json();
  },

  processNow: async (): Promise<{ message: string }> => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`${API_BASE_URL}/admin/file-manager/process-now`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Failed to trigger processing");
    return response.json();
  },

  getLogs: async (page: number = 0, size: number = 25): Promise<any> => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(
      `${API_BASE_URL}/admin/file-manager/logs?page=${page}&size=${size}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) throw new Error("Failed to fetch logs");
    return response.json();
  },

  getConfig: async (): Promise<{ basePath: string; enabled: boolean; intervalHours: number; nextRun: string }> => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`${API_BASE_URL}/admin/file-manager/config`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch config");
    return response.json();
  },

  uploadFile: async (file: File, companyCode: string, importType: string): Promise<{ message: string; fileName: string }> => {
    const token = localStorage.getItem("auth_token");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("companyCode", companyCode);
    formData.append("importType", importType);

    const response = await fetch(`${API_BASE_URL}/admin/file-manager/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to upload file");
    }
    return response.json();
  },
};
