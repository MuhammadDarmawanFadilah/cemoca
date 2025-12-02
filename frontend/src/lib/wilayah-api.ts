// API service untuk wilayah.id melalui backend proxy
import { config } from './config';

const WILAYAH_API_BASE = `${config.apiUrl}/wilayah`;

// Types untuk response dari wilayah.id API
export interface WilayahProvince {
  code: string;
  name: string;
}

export interface WilayahRegency {
  code: string;
  name: string;
}

export interface WilayahDistrict {
  code: string;
  name: string;
}

export interface WilayahVillage {
  code: string;
  name: string;
  postal_code: string;
}

export interface WilayahResponse<T> {
  data: T[];
  meta: {
    administrative_area_level: number;
    updated_at: string;
  };
}

// Helper function untuk API calls ke wilayah backend proxy
async function wilayahApiCall<T>(endpoint: string): Promise<WilayahResponse<T>> {
  try {
    const response = await fetch(`${WILAYAH_API_BASE}${endpoint}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from wilayah API proxy: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Wilayah API Error for ${endpoint}:`, error);
    throw error;
  }
}

// Wilayah API functions (using backend proxy)
export const wilayahAPI = {
  // Get all provinces
  getProvinces: async (): Promise<WilayahProvince[]> => {
    const response = await wilayahApiCall<WilayahProvince>('/provinces');
    return response.data;
  },

  // Get regencies/cities by province code
  getRegencies: async (provinceCode: string): Promise<WilayahRegency[]> => {
    const response = await wilayahApiCall<WilayahRegency>(`/regencies/${provinceCode}`);
    return response.data;
  },

  // Get districts by regency code
  getDistricts: async (regencyCode: string): Promise<WilayahDistrict[]> => {
    const response = await wilayahApiCall<WilayahDistrict>(`/districts/${regencyCode}`);
    return response.data;
  },

  // Get villages by district code (includes postal codes)
  getVillages: async (districtCode: string): Promise<WilayahVillage[]> => {
    const response = await wilayahApiCall<WilayahVillage>(`/villages/${districtCode}`);
    return response.data;
  },
};

// Helper functions to convert wilayah.id data to combobox options
export const convertWilayahToComboboxOptions = (items: { code: string; name: string }[]) => {
  return items.map(item => ({
    value: item.code,
    label: item.name,
  }));
};

// Cache untuk mengurangi API calls
class WilayahCache {
  private static cache = new Map<string, any>();
  private static expirationTime = 24 * 60 * 60 * 1000; // 24 hours

  static set(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  static get(key: string) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.expirationTime;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  static clear() {
    this.cache.clear();
  }
}

// Cached versions of API functions
export const cachedWilayahAPI = {
  getProvinces: async (): Promise<WilayahProvince[]> => {
    const cacheKey = 'provinces';
    const cached = WilayahCache.get(cacheKey);
    if (cached) return cached;

    const data = await wilayahAPI.getProvinces();
    WilayahCache.set(cacheKey, data);
    return data;
  },

  getRegencies: async (provinceCode: string): Promise<WilayahRegency[]> => {
    const cacheKey = `regencies-${provinceCode}`;
    const cached = WilayahCache.get(cacheKey);
    if (cached) return cached;

    const data = await wilayahAPI.getRegencies(provinceCode);
    WilayahCache.set(cacheKey, data);
    return data;
  },

  getDistricts: async (regencyCode: string): Promise<WilayahDistrict[]> => {
    const cacheKey = `districts-${regencyCode}`;
    const cached = WilayahCache.get(cacheKey);
    if (cached) return cached;

    const data = await wilayahAPI.getDistricts(regencyCode);
    WilayahCache.set(cacheKey, data);
    return data;
  },

  getVillages: async (districtCode: string): Promise<WilayahVillage[]> => {
    const cacheKey = `villages-${districtCode}`;
    const cached = WilayahCache.get(cacheKey);
    if (cached) return cached;

    const data = await wilayahAPI.getVillages(districtCode);
    WilayahCache.set(cacheKey, data);
    return data;
  },
};

// Helper function untuk mendapatkan nama berdasarkan kode
export async function getWilayahName(kode: string): Promise<string> {
  if (!kode) return '';
  
  try {
    const response = await fetch(`${WILAYAH_API_BASE}/name/${kode}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });

    if (!response.ok) {
      console.warn(`Failed to get name for kode ${kode}: ${response.status}`);
      return kode; // Fallback to code
    }

    const data = await response.json();
    return data.nama || kode;
  } catch (error) {
    console.warn(`Error getting name for kode ${kode}:`, error);
    return kode; // Fallback to code
  }
}

// Helper function untuk batch mendapatkan nama wilayah
export async function getWilayahNames(kodeMap: Record<string, string>): Promise<Record<string, string>> {
  try {
    const response = await fetch(`${WILAYAH_API_BASE}/names`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify(kodeMap),
    });

    if (!response.ok) {
      console.warn(`Failed to get names: ${response.status}`);
      return kodeMap; // Fallback to original codes
    }

    return await response.json();
  } catch (error) {
    console.warn('Error getting wilayah names:', error);
    return kodeMap; // Fallback to original codes
  }
}
