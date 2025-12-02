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