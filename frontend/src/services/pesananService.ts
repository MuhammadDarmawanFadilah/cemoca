import { config } from '@/lib/config';

interface Member {
  id: number;
  nama: string;
  alamat?: string;
  provinsi?: {
    id: string;
    nama: string;
  };
  kota?: {
    id: string;
    nama: string;
  };
  kecamatan?: {
    id: string;
    nama: string;
  };
  kelurahan?: {
    id: string;
    nama: string;
  };
  telepon?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

interface DetailPesanan {
  id: number;
  barang: {
    id: number;
    nama: string;
    harga: number;
    poin: number;
    stock: number;
    kategori: {
      id: number;
      nama: string;
    };
    gambar?: string;
  };
  jumlah: number;
  hargaSatuan: number;
  subtotal: number;
}

interface Pesanan {
  id: number;
  member: Member;
  karyawan: {
    id: number;
    username: string;
    fullName?: string;
  };
  totalHarga: number;
  totalPoin: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  tanggalPesanan: string;
  updatedAt: string;
  details: DetailPesanan[];
}

interface CreatePesananRequest {
  pesanan: {
    memberId?: number;
    karyawanId: number;
  };
  details: {
    barangId: number;
    jumlah: number;
  }[];
}

class PesananService {
  private baseUrl = config.baseUrl;

  async getAllPesanan(): Promise<Pesanan[]> {
    const response = await fetch(`${this.baseUrl}/api/pesanan`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch pesanan');
    }

    return response.json();
  }

  async getPesananById(id: number): Promise<Pesanan> {
    const response = await fetch(`${this.baseUrl}/api/pesanan/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch pesanan');
    }

    return response.json();
  }

  async createPesanan(request: CreatePesananRequest): Promise<Pesanan> {
    const response = await fetch(`${this.baseUrl}/api/pesanan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to create pesanan');
    }

    return response.json();
  }

  async updatePesananStatus(id: number, status: string): Promise<Pesanan> {
    const response = await fetch(`${this.baseUrl}/api/pesanan/${id}/status?status=${status}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to update pesanan status');
    }

    return response.json();
  }

  async deletePesanan(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/pesanan/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete pesanan');
    }
  }

  async getPesananByMember(memberId: number): Promise<Pesanan[]> {
    const response = await fetch(`${this.baseUrl}/api/pesanan/member/${memberId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch pesanan by member');
    }

    return response.json();
  }

  async searchPesananPaginated(params: {
    page?: number;
    size?: number;
    memberName?: string;
    status?: string;
    barangName?: string;
    kategori?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortDir?: string;
  }): Promise<{content: Pesanan[], totalElements: number, totalPages: number, size: number, number: number}> {
    const queryParams = new URLSearchParams();
    
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    if (params.memberName) queryParams.append('memberName', params.memberName);
    if (params.status) queryParams.append('status', params.status);
    if (params.barangName) queryParams.append('barangName', params.barangName);
    if (params.kategori) queryParams.append('kategori', params.kategori);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortDir) queryParams.append('sortDir', params.sortDir);
    
    const response = await fetch(`${this.baseUrl}/api/pesanan/search?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to search pesanan');
    }

    return response.json();
  }

  async getTodayRevenue(): Promise<number> {
    const response = await fetch(`${this.baseUrl}/api/pesanan/revenue/today`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch today revenue');
    }

    return response.json();
  }

  async countTodayOrders(): Promise<number> {
    const response = await fetch(`${this.baseUrl}/api/pesanan/count/today`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to count today orders');
    }

    return response.json();
  }

  async countOrdersByStatus(status: string): Promise<number> {
    const response = await fetch(`${this.baseUrl}/api/pesanan/count/status/${status}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to count orders by status');
    }

    return response.json();
  }
}

export const pesananService = new PesananService();
export type { Pesanan, DetailPesanan, Member, CreatePesananRequest };
