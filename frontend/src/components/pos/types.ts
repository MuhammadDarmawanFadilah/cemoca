export interface Kategori {
  id: number;
  nama: string;
  deskripsi?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Barang {
  id: number;
  nama: string;
  harga: number;
  poin: number;
  stock: number;
  berat: number;
  kategori: Kategori;
  gambar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: number;
  nama: string;
  email?: string;
  telepon?: string;
  alamat?: string;
}

export interface CartItem {
  barang: Barang;
  jumlah: number;
}

export interface DetailPesanan {
  id: number;
  barang: Barang;
  jumlah: number;
  hargaSatuan: number;
  subtotal: number;
}

export interface Pesanan {
  id: number;
  member: Member;
  karyawan: string | { id: number; username: string; fullName?: string };
  totalHarga: number;
  totalPoin: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  tanggalPesanan: string;
  details: DetailPesanan[];
}

export interface CatalogFilters {
  searchTerm: string;
  kategoriId: number | null;
  sortBy: string;
  sortDir: string;
  pageSize: number;
  gridColumns: number;
  minHarga: number | null;
  maxHarga: number | null;
}

export interface Pagination {
  page: number;
  totalPages: number;
  totalElements: number;
  loading: boolean;
}