import { Barang, CreateBarangRequest } from '@/types/barang';
import { Kategori, CreateKategoriRequest } from '@/types/kategori';
import { ApiClient } from './apiClient';

// Re-export types for convenience
export type { Kategori, CreateKategoriRequest };

export class BarangService {
  static async getAllBarang(): Promise<Barang[]> {
    return ApiClient.get<Barang[]>('/api/barang');
  }

  static async getBarangById(id: number): Promise<Barang> {
    return ApiClient.get<Barang>(`/api/barang/${id}`);
  }

  static async createBarang(barang: CreateBarangRequest): Promise<Barang> {
    return ApiClient.post<Barang>('/api/barang', barang);
  }

  static async updateBarang(id: number, barang: CreateBarangRequest): Promise<Barang> {
    return ApiClient.put<Barang>(`/api/barang/${id}`, barang);
  }

  static async deleteBarang(id: number): Promise<void> {
    return ApiClient.delete<void>(`/api/barang/${id}`);
  }

  static async toggleStatus(id: number): Promise<Barang> {
    return ApiClient.put<Barang>(`/api/barang/${id}/status`, {});
  }

  static async getBarangByKategori(kategoriId: number): Promise<Barang[]> {
    return ApiClient.get<Barang[]>(`/api/barang/kategori/${kategoriId}`);
  }

  static async searchBarang(nama: string): Promise<Barang[]> {
    return ApiClient.get<Barang[]>(`/api/barang/search?nama=${encodeURIComponent(nama)}`);
  }

  static async searchBarangPaginated(params: {
    page?: number;
    size?: number;
    nama?: string;
    kategoriId?: number;
    sortBy?: string;
    sortDir?: string;
    minHarga?: number;
    maxHarga?: number;
  }): Promise<{content: Barang[], totalElements: number, totalPages: number, size: number, number: number}> {
    const queryParams = new URLSearchParams();
    
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    if (params.nama) queryParams.append('nama', params.nama);
    if (params.kategoriId) queryParams.append('kategoriId', params.kategoriId.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortDir) queryParams.append('sortDir', params.sortDir);
    if (params.minHarga !== undefined) queryParams.append('minHarga', params.minHarga.toString());
    if (params.maxHarga !== undefined) queryParams.append('maxHarga', params.maxHarga.toString());
    
    return ApiClient.get(`/api/barang/search?${queryParams.toString()}`);
  }

  static async getAllKategori(): Promise<Kategori[]> {
    return ApiClient.get<Kategori[]>('/api/kategori');
  }
}

export class KategoriService {
  static async getAllKategori(): Promise<Kategori[]> {
    return ApiClient.get<Kategori[]>('/api/kategori');
  }

  static async getKategoriById(id: number): Promise<Kategori> {
    return ApiClient.get<Kategori>(`/api/kategori/${id}`);
  }

  static async createKategori(kategori: CreateKategoriRequest): Promise<Kategori> {
    return ApiClient.post<Kategori>('/api/kategori', kategori);
  }

  static async updateKategori(id: number, kategori: CreateKategoriRequest): Promise<Kategori> {
    return ApiClient.put<Kategori>(`/api/kategori/${id}`, kategori);
  }

  static async deleteKategori(id: number): Promise<void> {
    return ApiClient.delete<void>(`/api/kategori/${id}`);
  }

  static async searchKategori(nama: string): Promise<Kategori[]> {
    return ApiClient.get<Kategori[]>(`/api/kategori/search?nama=${encodeURIComponent(nama)}`);
  }
}