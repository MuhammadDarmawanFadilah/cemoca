export interface Barang {
  id: number;
  nama: string;
  berat: number;
  kategori: Kategori;
  stock: number;
  harga: number;
  poin: number;
  gambar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBarangRequest {
  nama: string;
  berat: number;
  kategoriId: number;
  stock: number;
  harga: number;
  poin: number;
  gambar?: string;
}

export interface Kategori {
  id: number;
  nama: string;
  deskripsi?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKategoriRequest {
  nama: string;
  deskripsi?: string;
}