'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  MapPin, 
  Users, 
  Search, 
  Filter,
  Loader2,
  AlertCircle,
  Eye,
  RefreshCw
} from 'lucide-react';
import { getApiUrl } from '@/lib/config';
import { toast } from 'sonner';

// Dynamic import for the map component to avoid SSR issues
const MemberMap = dynamic(() => import('@/components/MemberMapClient'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] lg:h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="flex flex-col items-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-gray-600">Memuat peta...</p>
      </div>
    </div>
  ),
});

interface Member {
  id: number;
  nama: string;
  telepon: string;
  email: string;
  latitude?: number;
  longitude?: number;
  foto?: string;
  kota?: string;
  provinsi?: string;
  kecamatan?: string;
  kelurahan?: string;
  kodePos?: string;
  alamat?: string;
  pekerjaan?: string;
  status?: 'AKTIF' | 'NONAKTIF';
  tingkatPrioritas?: 'TINGGI' | 'MENENGAH' | 'RENDAH';
  poin?: number;
  createdAt?: string;
}

export default function LokasiMemberPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [mapCenter, setMapCenter] = useState<[number, number]>([-2.5489, 118.0149]); // Indonesia center
  const [mapZoom, setMapZoom] = useState(5);

  // Load members with location data
  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/members'));
      
      if (!response.ok) {
        throw new Error(`Failed to load members: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const memberData = data.content || data;
      
      // Filter members that have location data (latitude and longitude)
      const membersWithLocation = memberData.filter((member: Member) => 
        member.latitude !== null && 
        member.longitude !== null && 
        member.latitude !== undefined && 
        member.longitude !== undefined &&
        !isNaN(member.latitude) &&
        !isNaN(member.longitude)
      );
      
      console.log('Total members:', memberData.length);
      console.log('Members with location:', membersWithLocation.length);
      
      setMembers(membersWithLocation);
      setFilteredMembers(membersWithLocation);

      // Calculate map center based on members locations if available
      if (membersWithLocation.length > 0) {
        const avgLat = membersWithLocation.reduce((sum: number, member: Member) => sum + (member.latitude || 0), 0) / membersWithLocation.length;
        const avgLng = membersWithLocation.reduce((sum: number, member: Member) => sum + (member.longitude || 0), 0) / membersWithLocation.length;
        
        setMapCenter([avgLat, avgLng]);
        
        // Adjust zoom based on number of members
        if (membersWithLocation.length === 1) {
          setMapZoom(13);
        } else if (membersWithLocation.length <= 5) {
          setMapZoom(10);
        } else {
          setMapZoom(8);
        }
      }
      
    } catch (error) {
      console.error('Error loading members:', error);
      toast.error('Gagal memuat data member');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // Filter members based on search and filters
  useEffect(() => {
    let filtered = members;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.telepon.includes(searchTerm) ||
        (member.alamat && member.alamat.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.kota && member.kota.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.provinsi && member.provinsi.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(member => member.tingkatPrioritas === priorityFilter);
    }

    setFilteredMembers(filtered);
  }, [members, searchTerm, statusFilter, priorityFilter]);

  const handleMemberClick = (memberId: number) => {
    router.push(`/member/edit/${memberId}`);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'AKTIF':
        return { label: 'Aktif', variant: 'default' as const, count: members.filter(m => m.status === 'AKTIF').length };
      case 'NONAKTIF':
        return { label: 'Non Aktif', variant: 'secondary' as const, count: members.filter(m => m.status === 'NONAKTIF').length };
      default:
        return { label: 'N/A', variant: 'outline' as const, count: 0 };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Memuat lokasi member...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
            Lokasi Member
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Peta sebaran lokasi member Koperasi Desa
          </p>
        </div>
        
        <Button
          onClick={loadMembers}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Member</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">
              dengan data lokasi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Aktif</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {members.filter(m => m.status === 'AKTIF').length}
            </div>
            <p className="text-xs text-muted-foreground">
              aktif berpartisipasi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Non Aktif</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {members.filter(m => m.status === 'NONAKTIF').length}
            </div>
            <p className="text-xs text-muted-foreground">
              perlu diaktifkan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hasil Filter</CardTitle>
            <Filter className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {filteredMembers.length}
            </div>
            <p className="text-xs text-muted-foreground">
              sesuai kriteria
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter & Pencarian</CardTitle>
          <CardDescription>
            Filter member berdasarkan nama, lokasi, status, dan prioritas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pencarian</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari nama, email, telepon, atau lokasi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="AKTIF">Aktif ({members.filter(m => m.status === 'AKTIF').length})</SelectItem>
                  <SelectItem value="NONAKTIF">Non Aktif ({members.filter(m => m.status === 'NONAKTIF').length})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Prioritas</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Prioritas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Prioritas</SelectItem>
                  <SelectItem value="TINGGI">Prioritas Tinggi ({members.filter(m => m.tingkatPrioritas === 'TINGGI').length})</SelectItem>
                  <SelectItem value="MENENGAH">Prioritas Menengah ({members.filter(m => m.tingkatPrioritas === 'MENENGAH').length})</SelectItem>
                  <SelectItem value="RENDAH">Prioritas Rendah ({members.filter(m => m.tingkatPrioritas === 'RENDAH').length})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (
            <div className="flex items-center justify-between mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Menampilkan {filteredMembers.length} dari {members.length} member
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                }}
                className="text-blue-600 border-blue-300 hover:bg-blue-100"
              >
                Reset Filter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Peta Lokasi Member ({filteredMembers.length})
          </CardTitle>
          <CardDescription>
            {filteredMembers.length === 0 
              ? 'Tidak ada member yang sesuai dengan filter' 
              : `Klik pada marker untuk melihat detail member. Hijau = Aktif, Kuning = Non Aktif`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredMembers.length === 0 ? (
            <div className="h-[400px] lg:h-[600px] bg-gray-100 dark:bg-gray-800 rounded-b-lg flex flex-col items-center justify-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-2">
                Tidak ada data lokasi member
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm text-center max-w-md">
                {members.length === 0 
                  ? 'Belum ada member yang memiliki data lokasi. Tambahkan koordinat lokasi pada data member untuk menampilkan di peta.'
                  : 'Tidak ada member yang sesuai dengan filter yang dipilih. Coba ubah kriteria pencarian atau filter.'
                }
              </p>
              {members.length === 0 && (
                <Button
                  onClick={() => router.push('/member')}
                  className="mt-4"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Kelola Member
                </Button>
              )}
            </div>
          ) : (
            <MemberMap
              locations={filteredMembers.map(member => ({
                ...member,
                latitude: member.latitude!,
                longitude: member.longitude!
              }))}
              center={mapCenter}
              zoom={mapZoom}
              onMemberClick={handleMemberClick}
            />
          )}
        </CardContent>
      </Card>

      {/* Legend and Instructions */}
      <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                Panduan Penggunaan Peta
              </h3>
              <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <p>• Marker <span className="inline-block w-3 h-3 rounded-full bg-green-500 border border-green-600"></span> hijau = Member aktif</p>
                <p>• Marker <span className="inline-block w-3 h-3 rounded-full bg-orange-500 border border-orange-600"></span> kuning = Member non aktif</p>
                <p>• Klik marker untuk melihat detail member</p>
                <p>• Gunakan filter untuk menyaring data yang ditampilkan</p>
                <p>• Klik "Lihat Detail" pada popup untuk mengedit data member</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
