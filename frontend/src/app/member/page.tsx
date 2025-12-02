'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, Users, UserCheck, Award, Briefcase, User } from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '@/lib/config';
import { imageAPI } from '@/lib/api';

interface Member {
  id: number;
  nama: string;
  alamat?: string;
  telepon: string;
  email: string;
  foto?: string;
  poin?: number;
  pekerjaan?: string;
  tingkatPrioritas?: 'TINGGI' | 'MENENGAH' | 'RENDAH';
  deskripsi?: string;
  status?: 'AKTIF' | 'NONAKTIF';
  kodePos?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function MemberPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPrioritas, setSelectedPrioritas] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Load members dari API
  const loadMembers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(getApiUrl('/api/members'));
      
      if (!response.ok) {
        throw new Error(`Failed to load members: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      // Handle paginated response - extract content array
      const memberData = data.content || data;
      setMembers(memberData);
    } catch (error) {
      console.error('Error loading members:', error);
      toast.error('Gagal memuat data member');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // Filter members berdasarkan search term dan status
  useEffect(() => {
    let filtered = members;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.telepon.includes(searchTerm) ||
        (member.alamat && member.alamat.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.pekerjaan && member.pekerjaan.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(member => member.status === selectedStatus);
    }

    // Filter by prioritas
    if (selectedPrioritas !== 'all') {
      filtered = filtered.filter(member => member.tingkatPrioritas === selectedPrioritas);
    }

    setFilteredMembers(filtered);
  }, [searchTerm, selectedStatus, selectedPrioritas, members]);

  const handleAddMember = () => {
    router.push('/member/create');
  };

  const handleEdit = (member: Member) => {
    router.push(`/member/edit/${member.id}`);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus member ini?')) {
      try {
      const response = await fetch(getApiUrl(`/api/members/${id}`), {
        method: 'DELETE',
      });        if (!response.ok) {
          throw new Error('Failed to delete member');
        }

        toast.success('Member berhasil dihapus');
        loadMembers(); // Reload data
      } catch (error) {
        console.error('Error deleting member:', error);
        toast.error('Gagal menghapus member');
      }
    }
  };

  const handleFormSuccess = () => {
    loadMembers(); // Reload data after success
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'AKTIF':
        return { label: 'Aktif', variant: 'default' as const, color: 'text-green-600' };
      case 'NONAKTIF':
        return { label: 'Non Aktif', variant: 'secondary' as const, color: 'text-gray-600' };
      default:
        return { label: status || 'N/A', variant: 'outline' as const, color: 'text-gray-600' };
    }
  };

  const getPrioritasBadge = (prioritas?: string) => {
    switch (prioritas) {
      case 'TINGGI':
        return { label: 'Tinggi', variant: 'destructive' as const, color: 'text-red-600' };
      case 'MENENGAH':
        return { label: 'Menengah', variant: 'default' as const, color: 'text-blue-600' };
      case 'RENDAH':
        return { label: 'Rendah', variant: 'secondary' as const, color: 'text-gray-600' };
      default:
        return { label: prioritas || 'N/A', variant: 'outline' as const, color: 'text-gray-600' };
    }
  };

  const totalMembers = members.length;
  const totalMemberAktif = members.filter(m => m.status === 'AKTIF').length;
  const totalMemberNonAktif = members.filter(m => m.status === 'NONAKTIF').length;
  const totalPoin = members.reduce((sum, m) => sum + (m.poin || 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manajemen Member</h1>
        <p className="text-gray-600 dark:text-gray-400">Kelola data anggota koperasi desa</p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4 flex-1">
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari member..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="max-w-xs">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="AKTIF">Aktif</SelectItem>
                <SelectItem value="NONAKTIF">Non Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="max-w-xs">
            <Select value={selectedPrioritas} onValueChange={setSelectedPrioritas}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Prioritas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Prioritas</SelectItem>
                <SelectItem value="TINGGI">Prioritas Tinggi</SelectItem>
                <SelectItem value="MENENGAH">Prioritas Menengah</SelectItem>
                <SelectItem value="RENDAH">Prioritas Rendah</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleAddMember}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Member
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Member</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Aktif</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalMemberAktif}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Non Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalMemberNonAktif}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Poin</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalPoin}</div>
          </CardContent>
        </Card>
      </div>

      {/* Member Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Member</CardTitle>
          <CardDescription>
            Menampilkan {filteredMembers.length} dari {totalMembers} member
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-500">Memuat data member...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Foto</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Pekerjaan</TableHead>
                  <TableHead>Poin</TableHead>
                  <TableHead>Prioritas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => {
                  const statusBadge = getStatusBadge(member.status);
                  const prioritasBadge = getPrioritasBadge(member.tingkatPrioritas);
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex-shrink-0">
                          {member.foto ? (
                            <div className="relative h-12 w-12 rounded-lg overflow-hidden">
                              <Image
                                src={imageAPI.getImageUrl(member.foto)}
                                alt={member.nama}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                              <User className="h-6 w-6 text-blue-500" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{member.nama}</div>
                          {member.alamat && (
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {member.alamat}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{member.telepon}</div>
                          <div className="text-gray-500">{member.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{member.pekerjaan || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-blue-500" />
                          <span className="font-semibold text-blue-600">{member.poin || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={prioritasBadge.variant}>
                          {prioritasBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadge.variant}>
                          {statusBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(member)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(member.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredMembers.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-gray-500">
                        {searchTerm || selectedStatus !== 'all' || selectedPrioritas !== 'all'
                          ? 'Tidak ada member yang ditemukan' 
                          : 'Belum ada member'
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}