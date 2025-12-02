'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast-simple';
import { getApiUrl } from '@/lib/config';
import { imageAPI } from '@/lib/api';
import { getWilayahName } from '@/lib/wilayah-api';
import {
  ArrowLeft,
  Download,
  RotateCcw,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  Loader2,
  Search,
  CreditCard,
  Eye,
  Info,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  nomorKartu?: string; // Generated from ID
  foto?: string; // Photo filename
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

export default function KartuMemberPage() {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [wilayahNames, setWilayahNames] = useState<Record<string, string>>({});
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load members from API
  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/members'));
      
      if (!response.ok) {
        throw new Error(`Failed to load members: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      // Handle paginated response - extract content array
      const memberData = data.content || data;
      
      // Add generated nomorKartu for each member
      const membersWithCards = memberData.map((member: Member) => {
        console.log('Member data:', member); // Debug log
        return {
          ...member,
          nomorKartu: generateKartuNumber(member.id)
        };
      });
      
      setMembers(membersWithCards);
      
      // Resolve wilayah names for all unique codes
      const uniqueCodes = new Set<string>();
      membersWithCards.forEach((member: Member) => {
        if (member.provinsi) uniqueCodes.add(member.provinsi);
        if (member.kota) uniqueCodes.add(member.kota);
        if (member.kecamatan) uniqueCodes.add(member.kecamatan);
        if (member.kelurahan) uniqueCodes.add(member.kelurahan);
      });
      
      // Resolve wilayah names
      const wilayahNameMap: Record<string, string> = {};
      for (const code of uniqueCodes) {
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
      console.error('Error loading members:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data member',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // Generate nomor kartu from member ID
  const generateKartuNumber = (memberId: number) => {
    const paddedId = memberId.toString().padStart(3, '0');
    return `KOP${paddedId}`;
  };

  // Helper function to get address display text
  const getAddressDisplayText = (member: Member): string => {
    return member.alamat || 'Alamat tidak tersedia';
  };


  // Filter members based on search and status
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.telepon.includes(searchTerm) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.nomorKartu && member.nomorKartu.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'ACTIVE' && member.status === 'AKTIF') ||
                         (statusFilter === 'INACTIVE' && member.status === 'NONAKTIF');
    
    return matchesSearch && matchesStatus;
  });

  const generateQRCode = useCallback(async (member: Member) => {
    try {
      // Create URL for member verification
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const verificationUrl = `${baseUrl}/verify-member/${member.id}`;
      
      console.log('Generated QR Code URL:', verificationUrl);
      
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 150,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M', // Medium error correction for better scanning
      });
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }, []);

  // Helper function to get logo as base64
  const getLogoAsBase64 = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch('/logo.jpg');
      if (!response.ok) {
        throw new Error('Failed to fetch logo');
      }
      
      // Convert to blob then to base64
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting logo to base64:', error);
      return '';
    }
  }, []);

  useEffect(() => {
    if (selectedMember) {
      generateQRCode(selectedMember);
    }
  }, [selectedMember, generateQRCode]);

  const downloadAsPDF = async () => {
    if (!selectedMember) return;
    
    setIsGeneratingPDF(true);
    
    try {
      // Get logo as base64 with retry mechanism
      let logoBase64 = '';
      try {
        logoBase64 = await getLogoAsBase64();
        console.log('Logo loaded successfully for PDF');
      } catch (error) {
        console.warn('Failed to load logo, using fallback:', error);
      }
      
      // Create a temporary container for rendering cards without 3D transforms
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        width: 400px;
        height: 250px;
        background: white;
        visibility: visible;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;
      
      document.body.appendChild(tempContainer);

      // Get member photo URL if available
      const memberPhotoUrl = selectedMember.foto ? imageAPI.getImageUrl(selectedMember.foto) : '';

      // Helper function to create card HTML
      const createCardHTML = (isBack: boolean) => {
        if (isBack) {
          return `
            <div style="width: 400px; height: 250px; background: linear-gradient(to bottom right, #f9fafb, #f3f4f6); border-radius: 12px; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
              <div style="display: flex; height: 100%;">
                <div style="flex: 1; padding-right: 16px;">
                  <div style="margin-bottom: 12px;">
                    <h3 style="font-weight: bold; font-size: 14px; color: #1f2937; margin-bottom: 8px;">Informasi Kontak</h3>
                    <div style="font-size: 12px; line-height: 1.5;">
                      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                        <span style="color: #2563eb;">✉</span>
                        <span style="color: #374151;">${selectedMember.email}</span>
                      </div>
                      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                        <span style="color: #16a34a;">📞</span>
                        <span style="color: #374151;">${selectedMember.telepon}</span>
                      </div>
                      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                        <span style="color: #dc2626;">📍</span>
                        <span style="color: #374151;">${getAddressDisplayText(selectedMember)}</span>
                      </div>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: #7c3aed;">📅</span>
                        <span style="color: #374151;">Bergabung: ${formatDate(selectedMember.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div style="margin-top: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                    <div style="font-size: 12px; color: #6b7280;">
                      <p style="font-weight: 600; color: #1e40af; margin: 0;">Koperasi Desa</p>
                      <p style="margin: 0;">Kartu Keanggotaan Resmi</p>
                      <p style="color: #2563eb; margin: 0;">www.koperasidesa.com</p>
                    </div>
                  </div>
                </div>
                <div style="width: 96px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-left: 1px solid #e5e7eb; padding-left: 12px;">
                  <div style="text-align: center; margin-bottom: 8px;">
                    <p style="font-size: 12px; color: #6b7280; font-weight: 500; margin: 0;">Member ID</p>
                  </div>
                  ${qrCodeUrl ? `
                    <div style="width: 64px; height: 64px; border: 1px solid #d1d5db; border-radius: 4px; overflow: hidden; background: white;">
                      <img src="${qrCodeUrl}" alt="QR Code" style="width: 100%; height: 100%; object-fit: contain;" />
                    </div>
                  ` : ''}
                  <p style="font-size: 10px; color: #9ca3af; margin-top: 4px; text-align: center; line-height: 1.2;">Scan untuk verifikasi</p>
                </div>
              </div>
            </div>
          `;
        } else {
          return `
            <div style="width: 400px; height: 250px; background: linear-gradient(135deg, #059669 0%, #10b981 50%, #059669 100%); color: white; border-radius: 12px; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; position: relative; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
              <!-- Background decorative elements -->
              <div style="position: absolute; top: 0; right: 0; width: 96px; height: 96px; background: rgba(255, 255, 255, 0.1); border-radius: 50%; transform: translate(48px, -48px);"></div>
              <div style="position: absolute; bottom: 0; left: 0; width: 80px; height: 80px; background: rgba(255, 255, 255, 0.1); border-radius: 50%; transform: translate(-40px, 40px);"></div>
              
              <!-- Header -->
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; position: relative; z-index: 2;">
                <div style="width: 40px; height: 40px; background: white; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; padding: 4px;">
                  ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" style="width: 32px; height: 32px; object-fit: contain; display: block;" />` : `<div style="width: 32px; height: 32px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 4px;"></div>`}
                </div>
                <div style="min-width: 0;">
                  <h3 style="font-weight: bold; font-size: 12px; line-height: 1.25; margin: 0; letter-spacing: 0.025em;">KOPERASI DESA</h3>
                  <p style="font-size: 12px; opacity: 0.9; margin: 0;">KARTU KEANGGOTAAN</p>
                </div>
              </div>

              <!-- Member Info -->
              <div style="display: flex; gap: 12px; align-items: flex-start; margin-bottom: 12px; position: relative; z-index: 2;">
                <div style="width: 56px; height: 64px; background: white; border-radius: 8px; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                  ${memberPhotoUrl ? `<img src="${memberPhotoUrl}" alt="${selectedMember.nama}" style="width: 100%; height: 100%; object-fit: cover;" />` : `<div style="color: #059669; font-size: 24px;">👤</div>`}
                </div>
                <div style="flex: 1; min-width: 0;">
                  <h2 style="font-weight: bold; font-size: 14px; line-height: 1.2; margin: 0 0 3px 0; word-wrap: break-word; overflow-wrap: break-word;">${selectedMember.nama}</h2>
                  <p style="font-size: 12px; opacity: 0.9; margin: 0 0 2px 0;">No. ${selectedMember.nomorKartu}</p>
                  <p style="font-size: 12px; opacity: 0.8; margin: 0; word-wrap: break-word; overflow-wrap: break-word; line-height: 1.3;">Member Koperasi Desa</p>
                </div>
              </div>

              <!-- Bottom Info -->
              <div style="position: absolute; bottom: 20px; left: 20px; right: 20px; display: flex; justify-content: space-between; align-items: end; z-index: 2;">
                <div>
                  <p style="font-size: 12px; opacity: 0.8; margin: 0;">
                    Berlaku: ${selectedMember.createdAt ? formatDate(new Date(new Date(selectedMember.createdAt).setFullYear(new Date(selectedMember.createdAt).getFullYear() + 5)).toISOString()) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p style="font-size: 12px; opacity: 0.6; margin: 0;">
                    KOP-${selectedMember.id.toString().padStart(6, '0')}
                  </p>
                </div>
              </div>
            </div>
          `;
        }
      };
      
      // Generate front side
      tempContainer.innerHTML = createCardHTML(false);
      await new Promise(resolve => setTimeout(resolve, 300)); // Reduced wait time for JPG
      
      const frontCanvas = await html2canvas(tempContainer, {
        scale: 3, // High scale for better quality
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: 400,
        height: 250,
      });
      
      // Generate back side
      tempContainer.innerHTML = createCardHTML(true);
      await new Promise(resolve => setTimeout(resolve, 300)); // Reduced wait time for JPG
      
      const backCanvas = await html2canvas(tempContainer, {
        scale: 3, // High scale for better quality
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: 400,
        height: 250,
      });
      
      // Clean up
      document.body.removeChild(tempContainer);
      
      // Create PDF
      const cardWidth = 85.6; // mm
      const cardHeight = 53.98; // mm
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [cardWidth, cardHeight],
      });

      // Add front side
      const frontImgData = frontCanvas.toDataURL('image/png', 1.0);
      pdf.addImage(frontImgData, 'PNG', 0, 0, cardWidth, cardHeight);

      // Add new page for back side
      pdf.addPage();
      const backImgData = backCanvas.toDataURL('image/png', 1.0);
      pdf.addImage(backImgData, 'PNG', 0, 0, cardWidth, cardHeight);

      // Generate filename
      const safeFileName = selectedMember.nama.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`kartu_member_${safeFileName}.pdf`);
      
      toast({
        title: 'Berhasil',
        description: 'Kartu member berhasil diunduh sebagai PDF',
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengunduh kartu member. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'AKTIF':
        return { label: 'Aktif', variant: 'default' as const };
      case 'NONAKTIF':
        return { label: 'Non Aktif', variant: 'secondary' as const };
      default:
        return { label: status || 'N/A', variant: 'outline' as const };
    }
  };

  // If loading, show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Memuat data member...</span>
        </div>
      </div>
    );
  }

  // If no member is selected, show member selection
  if (!selectedMember) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Kartu Member</h1>
          <p className="text-gray-600 dark:text-gray-400">Pilih member untuk menampilkan kartu keanggotaan</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Member</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Member Aktif</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{members.filter(m => m.status === 'AKTIF').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Member Non Aktif</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{members.filter(m => m.status === 'NONAKTIF').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Kartu</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{members.filter(m => m.nomorKartu).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="ACTIVE">Aktif</SelectItem>
                <SelectItem value="INACTIVE">Non Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Members Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Member</CardTitle>
            <CardDescription>
              Menampilkan {filteredMembers.length} dari {members.length} member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Nomor Kartu</TableHead>
                  <TableHead className="hidden sm:table-cell">Telepon</TableHead>
                  <TableHead className="hidden lg:table-cell">Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => {
                  const statusBadge = getStatusBadge(member.status);
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.nama}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{member.nomorKartu}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{member.telepon}</TableCell>
                      <TableCell className="hidden lg:table-cell">{member.email}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadge.variant}>
                          {statusBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setSelectedMember(member)}
                          disabled={member.status !== 'AKTIF'}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Lihat Kartu</span>
                          <span className="sm:hidden">Kartu</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredMembers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-gray-500">
                        {searchTerm || statusFilter !== 'all'
                          ? 'Tidak ada member yang ditemukan' 
                          : 'Belum ada member'
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show card view for selected member

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Memuat kartu member...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-slate-800 py-4 sm:py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setSelectedMember(null)} className="shadow-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                Kartu Member Koperasi Desa
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
                {selectedMember.nama}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setIsFlipped(!isFlipped)}
              className="flex items-center gap-2 flex-1 sm:flex-none shadow-sm"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Flip</span>
              <span className="sm:hidden">Balik</span>
            </Button>
            <Button
              onClick={downloadAsPDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 flex-1 sm:flex-none shadow-sm"
            >
              {isGeneratingPDF ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </div>
        </div>

        {/* Card Container */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="relative w-full max-w-[90vw] sm:max-w-[500px] lg:max-w-[600px] aspect-[8/5] perspective-1000">
            <div
              ref={cardRef}
              className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* Front Side */}
              <Card className="card-front absolute inset-0 backface-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-900 text-white shadow-2xl overflow-hidden">
                <CardContent className="p-4 sm:p-6 lg:p-8 h-full relative">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-16 sm:w-24 lg:w-32 h-16 sm:h-24 lg:h-32 bg-white rounded-full -translate-y-8 sm:-translate-y-12 lg:-translate-y-16 translate-x-8 sm:translate-x-12 lg:translate-x-16"></div>
                    <div className="absolute bottom-0 left-0 w-12 sm:w-20 lg:w-24 h-12 sm:h-20 lg:h-24 bg-white rounded-full translate-y-6 sm:translate-y-10 lg:translate-y-12 -translate-x-6 sm:-translate-x-10 lg:-translate-x-12"></div>
                  </div>

                  {/* Header */}
                  <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 lg:mb-6 relative z-10">
                    <div className="w-8 sm:w-9 lg:w-10 h-8 sm:h-9 lg:h-10 bg-white rounded-lg flex items-center justify-center p-1">
                      <Image
                        src="/logo.jpg"
                        alt="Logo Koperasi Desa"
                        width={32}
                        height={32}
                        className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8 object-contain"
                        priority
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-xs sm:text-sm lg:text-base leading-tight">KOPERASI DESA</h3>
                      <p className="text-xs sm:text-sm lg:text-base opacity-90">KARTU KEANGGOTAAN</p>
                    </div>
                  </div>

                  {/* Member Info */}
                  <div className="flex gap-2 sm:gap-3 lg:gap-4 items-start mb-3 sm:mb-4 lg:mb-6 relative z-10">
                    <div className="w-12 sm:w-14 lg:w-16 h-14 sm:h-16 lg:h-20 bg-white rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {selectedMember.foto ? (
                        <Image
                          src={imageAPI.getImageUrl(selectedMember.foto)}
                          alt={selectedMember.nama}
                          width={64}
                          height={80}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Failed to load member photo:', selectedMember.foto);
                            // Hide image and show fallback
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-green-900 text-lg sm:text-xl lg:text-2xl">👤</div>
                      )}
                      {/* Fallback when image fails to load */}
                      {selectedMember.foto && (
                        <div className="text-green-900 text-lg sm:text-xl lg:text-2xl hidden" id={`fallback-${selectedMember.id}`}>👤</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h2 className="font-bold text-sm sm:text-base lg:text-lg leading-tight mb-1 break-words">
                        {selectedMember.nama}
                      </h2>
                      <p className="text-xs sm:text-sm lg:text-base opacity-90 mb-0.5">
                        No. {selectedMember.nomorKartu}
                      </p>
                      <p className="text-xs sm:text-sm lg:text-base opacity-80 mb-0.5 break-words leading-tight">
                        Member Koperasi Desa
                      </p>
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="absolute bottom-3 sm:bottom-4 lg:bottom-6 left-4 sm:left-6 lg:left-8 right-4 sm:right-6 lg:right-8 flex justify-between items-end z-10">
                    <div>
                      <p className="text-xs sm:text-sm lg:text-base opacity-80">
                        Berlaku: {selectedMember.createdAt ? formatDate(new Date(new Date(selectedMember.createdAt).setFullYear(new Date(selectedMember.createdAt).getFullYear() + 5)).toISOString()) : 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs sm:text-sm lg:text-base opacity-60">
                         KOP-{selectedMember.id.toString().padStart(6, '0')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Back Side */}
              <Card className="card-back absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-gray-50 to-gray-100 shadow-2xl">
                <CardContent className="p-4 sm:p-6 lg:p-8 h-full">
                  <div className="flex h-full flex-col sm:flex-row">
                    {/* Contact Info */}
                    <div className="flex-1 sm:pr-4 mb-4 sm:mb-0">
                      <div className="mb-3 sm:mb-4">
                        <h3 className="font-bold text-sm sm:text-base lg:text-lg text-gray-800 mb-2 sm:mb-3">
                          Informasi Kontak
                        </h3>
                        
                        <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm lg:text-base">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Mail className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-blue-600 flex-shrink-0" />
                            <span className="break-all">{selectedMember.email}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Phone className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-green-600 flex-shrink-0" />
                            <span>{selectedMember.telepon}</span>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-red-600 flex-shrink-0" />
                            <span className="break-words">
                              {getAddressDisplayText(selectedMember)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-purple-600 flex-shrink-0" />
                            <span>Bergabung: {formatDate(selectedMember.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Koperasi Info */}
                      <div className="mt-auto">
                        <div className="text-xs sm:text-sm lg:text-base text-gray-600 border-t border-gray-200 pt-2 sm:pt-3">
                          <p className="font-semibold text-green-800">Koperasi Desa</p>
                          <p>Kartu Keanggotaan Resmi</p>
                          <p className="text-green-600">www.koperasidesa.com</p>
                        </div>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="w-full sm:w-24 lg:w-32 flex flex-row sm:flex-col items-center justify-center sm:border-l border-t sm:border-t-0 border-gray-200 pt-4 sm:pt-0 sm:pl-3 lg:pl-4">
                      <div className="text-center mb-2 sm:mb-3 mr-4 sm:mr-0">
                        <p className="text-xs sm:text-sm lg:text-base text-gray-600 font-medium">
                          Member ID
                        </p>
                      </div>
                      {qrCodeUrl && (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 border border-gray-300 rounded overflow-hidden bg-white">
                          <img
                            src={qrCodeUrl}
                            alt="QR Code"
                            width={96}
                            height={96}
                            className="w-full h-full object-contain"
                            crossOrigin="anonymous"
                          />
                        </div>
                      )}
                      <p className="text-xs sm:text-sm lg:text-base text-gray-500 mt-1 sm:mt-2 text-center leading-tight ml-4 sm:ml-0">
                        Scan untuk verifikasi
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center">
          <div className="bg-green-50 dark:bg-slate-800 border border-green-200 dark:border-slate-600 rounded-lg p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto shadow-sm">
            <h3 className="font-semibold text-green-900 dark:text-green-200 mb-3 sm:mb-4 text-base sm:text-lg">
              Petunjuk Penggunaan
            </h3>
            <div className="text-sm sm:text-base text-green-800 dark:text-green-300 space-y-2 sm:space-y-3 mb-4">
              <p>• Klik "Flip" untuk melihat kedua sisi kartu</p>
              <p>• Klik "Download PDF" untuk unduh kartu siap cetak</p>
              <p>• QR Code dapat dipindai untuk verifikasi member</p>
              <p>• Kartu berlaku sebagai identitas resmi member koperasi</p>
            </div>
            <div className="text-center">
              <Link href="/verification-info">
                <Button variant="outline" size="sm" className="text-green-700 border-green-300 hover:bg-green-100">
                  <Info className="h-4 w-4 mr-2" />
                  Pelajari Sistem Verifikasi
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        
        @media (max-width: 640px) {
          .perspective-1000 {
            perspective: 800px;
          }
        }
      `}</style>
    </div>
  );
}