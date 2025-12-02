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
  poin?: number;
  pekerjaan?: string;
  tingkatPrioritas?: 'TINGGI' | 'MENENGAH' | 'RENDAH';
  deskripsi?: string;
  status?: 'AKTIF' | 'NONAKTIF';
  kodePos?: string;
  latitude?: number | string;
  longitude?: number | string;
  createdAt: string;
  updatedAt: string;
}

class MemberService {
  private baseUrl = config.baseUrl;

  async getAllMembers(): Promise<Member[]> {
    const response = await fetch(`${this.baseUrl}/api/members`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch members');
    }

    const data = await response.json();
    // Handle paginated response - extract content array
    return data.content || data;
  }

  async getMemberById(id: number): Promise<Member> {
    const response = await fetch(`${this.baseUrl}/api/members/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch member');
    }

    return response.json();
  }

  async searchMembers(query: string): Promise<Member[]> {
    const response = await fetch(`${this.baseUrl}/api/members/search?keyword=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If search endpoint doesn't exist, fallback to getting all members and filtering
      const allMembers = await this.getAllMembers();
      return allMembers.filter(member => 
        member.nama.toLowerCase().includes(query.toLowerCase()) ||
        (member.telepon && member.telepon.includes(query)) ||
        (member.email && member.email.toLowerCase().includes(query.toLowerCase()))
      );
    }

    const data = await response.json();
    return data.content || data;
  }

  async createMember(member: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Promise<Member> {
    const response = await fetch(`${this.baseUrl}/api/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(member),
    });

    if (!response.ok) {
      throw new Error('Failed to create member');
    }

    return response.json();
  }

  async updateMember(id: number, member: Partial<Member>): Promise<Member> {
    const response = await fetch(`${this.baseUrl}/api/members/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(member),
    });

    if (!response.ok) {
      throw new Error('Failed to update member');
    }

    return response.json();
  }

  async deleteMember(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/members/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete member');
    }
  }
}

export const memberService = new MemberService();
export type { Member };
