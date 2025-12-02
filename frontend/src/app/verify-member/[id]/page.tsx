'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CreditCard,
  Loader2,
  ArrowLeft,
  Shield,
  Award
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getApiUrl } from '@/lib/config';
import { imageAPI } from '@/lib/api';
import { getWilayahName } from '@/lib/wilayah-api';

interface Member {
  id: number;
  nama: string;
  alamat?: string;
  telepon: string;
  email: string;
  poin?: number;
  pekerjaan?: string;
  tingkatPrioritas?: 'TINGGI' | 'MENENGAH' | 'RENDAH';
  deskripsi?: string;
  status?: 'AKTIF' | 'NONAKTIF';
  provinsi?: string;
  kota?: string;
  kecamatan?: string;
  kelurahan?: string;
  kodePos?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
  foto?: string;
  nomorKartu?: string;
}

// Date formatting utility
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
};

export default function VerifyMemberPage() {
  const params = useParams();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wilayahNames, setWilayahNames] = useState<Record<string, string>>({});

  const memberId = params.id as string;

  useEffect(() => {
    const loadMember = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(getApiUrl(`/api/members/${memberId}`));
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Member tidak ditemukan');
          }
          throw new Error(`Gagal memuat data member: ${response.status}`);
        }
        
        const memberData = await response.json();
        
        // Generate nomor kartu
        const memberWithCard = {
          ...memberData,
          nomorKartu: generateKartuNumber(memberData.id)
        };
        
        setMember(memberWithCard);

        // Resolve wilayah names
        const wilayahNameMap: Record<string, string> = {};
        const codes = [memberData.provinsi, memberData.kota, memberData.kecamatan, memberData.kelurahan].filter(Boolean);
        
        for (const code of codes) {
          try {
            const name = await getWilayahName(code);
            wilayahNameMap[code] = name;
          } catch (error) {
            console.warn(`Failed to resolve wilayah name for ${code}:`, error);
            wilayahNameMap[code] = code; // Fallback to code
          }
        }
        
        setWilayahNames(wilayahNameMap);
      } catch (error) {
        console.error('Error loading member:', error);
        setError(error instanceof Error ? error.message : 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    };

    if (memberId) {
      loadMember();
    }
  }, [memberId]);

  // Generate nomor kartu from member ID
  const generateKartuNumber = (memberId: number) => {
    const paddedId = memberId.toString().padStart(3, '0');
    return `KOP${paddedId}`;
  };

  // Helper function to get address display text
  const getAddressDisplayText = (member: Member): string => {
    const parts: string[] = [];
    
    if (member.alamat) {
      parts.push(member.alamat);
    }
    
    const wilayahParts: string[] = [];
    if (member.kelurahan && wilayahNames[member.kelurahan]) {
      wilayahParts.push(wilayahNames[member.kelurahan]);
    }
    if (member.kecamatan && wilayahNames[member.kecamatan]) {
      wilayahParts.push(wilayahNames[member.kecamatan]);
    }
    if (member.kota && wilayahNames[member.kota]) {
      wilayahParts.push(wilayahNames[member.kota]);
    }
    if (member.provinsi && wilayahNames[member.provinsi]) {
      wilayahParts.push(wilayahNames[member.provinsi]);
    }
    
    if (wilayahParts.length > 0) {
      parts.push(wilayahParts.join(', '));
    }
    
    if (member.kodePos) {
      parts.push(member.kodePos);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'Alamat tidak tersedia';
  };

  const getStatusInfo = (status?: string) => {
    switch (status) {
      case 'AKTIF':
        return {
          label: 'Member Aktif',
          variant: 'default' as const,
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'NONAKTIF':
        return {
          label: 'Member Non Aktif',
          variant: 'secondary' as const,
          icon: XCircle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
      default:
        return {
          label: 'Status Tidak Diketahui',
          variant: 'outline' as const,
          icon: XCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'TINGGI':
        return { label: 'Prioritas Tinggi', variant: 'destructive' as const };
      case 'MENENGAH':
        return { label: 'Prioritas Menengah', variant: 'default' as const };
      case 'RENDAH':
        return { label: 'Prioritas Rendah', variant: 'secondary' as const };
      default:
        return { label: 'Prioritas Tidak Diketahui', variant: 'outline' as const };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-slate-800 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-lg text-gray-600 dark:text-gray-300">Memverifikasi member...</p>
        </div>
      </div>
    );
  }

  if (error || !member) {
    const statusInfo = {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className={`w-full max-w-2xl ${statusInfo.bgColor} ${statusInfo.borderColor} border-2`}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className={`p-4 rounded-full ${statusInfo.bgColor}`}>
                <statusInfo.icon className={`h-12 w-12 ${statusInfo.color}`} />
              </div>
            </div>
            <CardTitle className={`text-2xl font-bold ${statusInfo.color}`}>
              Verifikasi Gagal
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {error || 'Member tidak ditemukan'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Member ID: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{memberId}</code>
            </p>
            
            <div className="pt-4">
              <Link href="/kartu-member">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali ke Kartu Member
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(member.status);
  const priorityBadge = getPriorityBadge(member.tingkatPrioritas);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-slate-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-full ${statusInfo.bgColor}`}>
              <statusInfo.icon className={`h-12 w-12 ${statusInfo.color}`} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Verifikasi Member Koperasi Desa
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Detail member yang terdaftar resmi dalam sistem
          </p>
        </div>

        {/* Verification Status */}
        <Card className={`mb-8 ${statusInfo.bgColor} ${statusInfo.borderColor} border-2`}>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className={`h-6 w-6 ${statusInfo.color}`} />
              <h2 className={`text-xl font-bold ${statusInfo.color}`}>
                {statusInfo.label}
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              Member ini {member.status === 'AKTIF' ? 'terdaftar resmi dan aktif' : 'terdaftar tetapi tidak aktif'} dalam sistem Koperasi Desa
            </p>
          </CardContent>
        </Card>

        {/* Member Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Profile Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Member
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="flex items-start gap-4">
                <div className="w-20 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                  {member.foto ? (
                    <Image
                      src={imageAPI.getImageUrl(member.foto)}
                      alt={member.nama}
                      width={80}
                      height={96}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Failed to load member photo:', member.foto);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <User className="h-8 w-8 text-green-600" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {member.nama}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    {member.pekerjaan || 'Pekerjaan tidak tersedia'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={statusInfo.variant}>
                      {statusInfo.label}
                    </Badge>
                    <Badge variant={priorityBadge.variant}>
                      {priorityBadge.label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Telepon</p>
                    <p className="font-medium">{member.telepon}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p className="font-medium break-all">{member.email}</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Alamat</p>
                  <p className="font-medium break-words">
                    {getAddressDisplayText(member)}
                  </p>
                </div>
              </div>

              {/* Member Since */}
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-purple-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Bergabung</p>
                  <p className="font-medium">{formatDate(member.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Membership Card Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Kartu Keanggotaan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-lg mb-4">
                  <p className="text-sm opacity-90">Nomor Kartu</p>
                  <p className="text-xl font-bold">{member.nomorKartu}</p>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Member ID:</span>
                    <span className="font-medium">KOP-{member.id.toString().padStart(6, '0')}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Poin:</span>
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium text-yellow-600">{member.poin || 0}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Berlaku Hingga:</span>
                    <span className="font-medium">
                      {member.createdAt ? formatDate(new Date(new Date(member.createdAt).setFullYear(new Date(member.createdAt).getFullYear() + 5)).toISOString()) : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Terakhir Update:</span>
                    <span className="font-medium">{formatDate(member.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        {member.deskripsi && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Deskripsi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {member.deskripsi}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="text-center">
          <Link href="/kartu-member">
            <Button variant="outline" size="lg">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Kartu Member
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Image
                src="/logo.jpg"
                alt="Logo Koperasi Desa"
                width={32}
                height={32}
                className="object-contain"
              />
              <h3 className="font-bold text-green-800 dark:text-green-200">
                KOPERASI DESA
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Sistem Verifikasi Keanggotaan Resmi
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              www.koperasidesa.com | Melayani dengan Amanah
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}