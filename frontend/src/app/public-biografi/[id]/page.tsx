"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { config } from "@/lib/config";
import {
  ArrowLeft,
  User,
  Calendar,
  MapPin,
  GraduationCap,
  Briefcase,
  Phone,
  Mail,
  Building,
  Award,
  Heart,
  Instagram,
  Youtube,
  Linkedin,
  Facebook,
  Globe,
  BookOpen,
  Target,
  Users,
  Loader2,
  School,
  Trophy,
  Clock,
  ExternalLink,
  Share2,
  Download,
  Star,
  BrainCircuit,
  CheckCircle,
  FileText,
  MapPinIcon,
  Home,
  Cake,
  Contact,
  UserCheck,
  MessageSquare,
  Zap,
  Smartphone,
  Eye,
  BarChart3,
  Shield,
  X,
  AlertCircle
} from "lucide-react";
import Image from "next/image";
import { biografiAPI, Biografi, imageAPI, wilayahAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast-simple";
import { parseId } from "@/lib/crypto-utils";

// Public API function that doesn't require authentication
const fetchPublicBiografi = async (id: number): Promise<Biografi> => {
  const response = await fetch(`${config.apiUrl}/biografi/public/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    mode: 'cors',
    credentials: 'omit',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Profil member tidak ditemukan');
    }
    throw new Error('Gagal memuat profil member');
  }

  return response.json();
};

export default function PublicBiografiDetailPage() {
  const [biografi, setBiografi] = useState<Biografi | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [error, setError] = useState<string | null>(null);
  const [locationNames, setLocationNames] = useState<{
    provinsiNama?: string;
    kotaNama?: string;
    kecamatanNama?: string;
    kelurahanNama?: string;
  }>({});
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const biografiId = params?.id as string;
  const actualBiografiId = parseId(biografiId);const fetchBiografiDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!actualBiografiId) {
        throw new Error('ID alumni tidak valid');
      }
      const response = await fetchPublicBiografi(actualBiografiId);
      setBiografi(response);
      
      // Convert location codes to readable names
      if (response) {
        try {
          const locationData = await wilayahAPI.convertBiografiLocation(response);
          setLocationNames(locationData);
        } catch (error) {
          console.error("Error converting location codes:", error);
          // If conversion fails, keep empty location names
          setLocationNames({});
        }
      }
    } catch (error) {
      console.error("Error fetching biografi detail:", error);
      setError(error instanceof Error ? error.message : "Profil member tidak ditemukan atau tidak tersedia untuk publik");
    } finally {
      setLoading(false);
    }
  }, [actualBiografiId]);

  useEffect(() => {
    if (biografiId && actualBiografiId) {
      fetchBiografiDetail();
    }
  }, [biografiId, actualBiografiId, fetchBiografiDetail]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Tidak ditentukan";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatPhoneNumberForWhatsApp = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('08')) {
      return '62' + cleaned.substring(1);
    }
    if (cleaned.startsWith('8') && !cleaned.startsWith('62')) {
      return '62' + cleaned;
    }
    if (cleaned.startsWith('62')) {
      return cleaned;
    }
    if (cleaned.length > 0) {
      return '62' + cleaned;
    }
    return cleaned;
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'tiktok': return <Smartphone className="h-4 w-4" />;
      case 'youtube': return <Youtube className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'telegram': return <MessageSquare className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const calculateWorkExperience = () => {
    if (!biografi?.workExperiences || biografi.workExperiences.length === 0) {
      return "Tidak ada pengalaman";
    }

    let totalMonths = 0;

    biografi.workExperiences.forEach(exp => {
      if (exp.tanggalMulai) {
        const startDate = new Date(exp.tanggalMulai);
        const endDate = exp.tanggalSelesai ? new Date(exp.tanggalSelesai) : new Date();

        const diffYears = endDate.getFullYear() - startDate.getFullYear();
        const diffMonths = endDate.getMonth() - startDate.getMonth();

        totalMonths += (diffYears * 12) + diffMonths;
      }
    });

    if (totalMonths === 0) return "Kurang dari 1 bulan";

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    if (years === 0) {
      return `${months} bulan`;
    } else if (months === 0) {
      return `${years} tahun`;
    } else {
      return `${years} tahun ${months} bulan`;
    }
  };

  const calculateMedicalSpecializationYears = () => {
    if (!biografi?.spesialisasiKedokteran || biografi.spesialisasiKedokteran.length === 0) {
      return "Tidak ada spesialisasi";
    }

    let totalMonths = 0;

    biografi.spesialisasiKedokteran.forEach(spec => {
      if (spec.tanggalMulai) {
        const startDate = new Date(spec.tanggalMulai);
        const endDate = spec.tanggalAkhir ? new Date(spec.tanggalAkhir) : new Date();

        const diffYears = endDate.getFullYear() - startDate.getFullYear();
        const diffMonths = endDate.getMonth() - startDate.getMonth();

        totalMonths += (diffYears * 12) + diffMonths;
      }
    });

    if (totalMonths === 0) return "Kurang dari 1 bulan";

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    if (years === 0) {
      return `${months} bulan`;
    } else if (months === 0) {
      return `${years} tahun`;
    } else {
      return `${years} tahun ${months} bulan`;
    }
  };
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${biografi?.namaLengkap} - Alumni Profile`,
          text: `Check out ${biografi?.namaLengkap}'s alumni profile`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Success",
        description: "Profile link copied to clipboard!",
      });
    }
  };
  // Add enhanced print styles and custom scrollbar
  const printStyles = `
    @media print {
      .no-print { display: none !important; }
      .print-break { page-break-before: always; }
      body { -webkit-print-color-adjust: exact; }
      .container { max-width: none !important; margin: 0 !important; padding: 0 !important; }
      .card { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
    }
    
    /* Custom scrollbar styles */
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    
    /* Smooth transitions */
    * {
      transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
    }
    
    /* Touch feedback */
    .touch-manipulation:active {
      transform: scale(0.98);
    }
    
    /* Backdrop blur fallback */
    @supports not (backdrop-filter: blur(12px)) {
      .backdrop-blur-md {
        background-color: rgba(248, 250, 252, 0.95);
      }
      .dark .backdrop-blur-md {
        background-color: rgba(15, 23, 42, 0.95);
      }
    }
  `;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Loading Profile</h3>
              <p className="text-gray-600 dark:text-gray-400">Please wait while we fetch the alumni information...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (error || !biografi) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Profile Not Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              {error || "Profil member tidak ditemukan atau tidak tersedia untuk publik"}
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button variant="outline" onClick={() => router.push('/')}>
                <Users className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Navigation items for tabs
  const navigationItems = [
    { id: 'overview', label: 'Overview', mobileLabel: 'Home', icon: User },
    { id: 'personal', label: 'Pribadi', mobileLabel: 'Pribadi', icon: Heart },
    { id: 'academic', label: 'Akademik', mobileLabel: 'Akademik', icon: GraduationCap },
    { id: 'professional', label: 'Profesional', mobileLabel: 'Kerja', icon: Briefcase },
    { id: 'medical', label: 'Spesialisasi', mobileLabel: 'Medis', icon: BrainCircuit },
    { id: 'achievements', label: 'Prestasi', mobileLabel: 'Prestasi', icon: Trophy },
  ];

  const socialLinks = [
    { platform: 'Instagram', url: biografi.instagram, icon: 'instagram' },
    { platform: 'TikTok', url: biografi.tiktok, icon: 'tiktok' },
    { platform: 'YouTube', url: biografi.youtube, icon: 'youtube' },
    { platform: 'LinkedIn', url: biografi.linkedin, icon: 'linkedin' },
    { platform: 'Facebook', url: biografi.facebook, icon: 'facebook' },
    { platform: 'Telegram', url: biografi.telegram, icon: 'telegram' },
  ].filter(link => link.url);  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
        {/* Header - Enhanced Modern Design (Public Version without Back Button) */}
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200/80 dark:border-gray-700/80 sticky top-0 z-40 shadow-lg">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo or Title Area */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="hidden sm:inline font-semibold text-gray-800 dark:text-gray-200">Profil Member</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge
                variant={biografi.status === 'AKTIF' ? 'default' : 'secondary'}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-md px-3 py-1 text-xs font-semibold"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                {biografi.status}
              </Badge>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="hidden sm:flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-blue-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700 px-3 py-2 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="font-medium">Bagikan</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="hidden sm:flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-blue-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700 px-3 py-2 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  <Download className="h-4 w-4" />
                  <span className="font-medium">Cetak Profil</span>
                </Button>
                
                {biografi.email && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`mailto:${biografi.email}`, '_blank')}
                    className="hidden sm:flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-blue-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700 px-3 py-2 rounded-xl transition-all duration-200 hover:scale-105"
                  >
                    <Mail className="h-4 w-4" />
                    <span className="font-medium">Kontak</span>
                  </Button>
                )}
                
                {(biografi.nomorWa || biografi.nomorHp || biografi.nomorTelepon) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const phoneNumber = biografi.nomorWa || biografi.nomorHp || biografi.nomorTelepon;
                      const formattedPhone = formatPhoneNumberForWhatsApp(phoneNumber!);
                      window.open(`https://wa.me/${formattedPhone}`, '_blank');
                    }}
                    className="hidden sm:flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-green-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700 px-3 py-2 rounded-xl transition-all duration-200 hover:scale-105"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span className="font-medium">WhatsApp</span>
                  </Button>
                )}
                
                {/* Mobile menu button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="sm:hidden p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-blue-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Alumni Notification */}
      <div className="bg-green-600 text-white py-3 no-print">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="text-sm font-medium">
              ✓ Profil ini telah terverifikasi sebagai Member terdaftar di Sistem Cemoca
            </span>
          </div>
        </div>
      </div>      <div className="container mx-auto px-4 py-8 max-w-full overflow-x-hidden">
        {/* Mobile Hero Section - Only visible on mobile */}
        <div className="block xl:hidden mb-6">
          <Card className="overflow-hidden border-0 shadow-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <div className="relative">
              {/* Mobile Profile Header */}
              <div className="relative h-48 bg-gray-100 dark:bg-gray-800">
                {(biografi.fotoProfil || biografi.foto) ? (
                  <Image
                    src={imageAPI.getImageUrl(biografi.fotoProfil || biografi.foto || '')}
                    alt={biografi.namaLengkap}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <User className="h-16 w-16 text-white" />
                  </div>
                )}
                {/* Mobile Status Badge */}
                <div className="absolute bottom-3 right-3">
                  <Badge
                    variant={biografi.status === 'AKTIF' ? 'default' : 'secondary'}
                    className="bg-green-500 hover:bg-green-600 text-white border-2 border-white shadow-lg text-xs"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {biografi.status}
                  </Badge>
                </div>
              </div>
              
              {/* Mobile Profile Info */}
              <CardContent className="p-4">                  <div className="text-center mb-4">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1 break-words">
                    {biografi.namaLengkap}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    {biografi.nim}
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full mt-2 mb-4">
                    <GraduationCap className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      Alumni Tahun {biografi.alumniTahun || new Date(biografi.tanggalLulus || '').getFullYear() || 'N/A'}
                    </span>
                  </div>
                    {/* Contact Info - Modern Card Style */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-600">
                    <div className="space-y-3">
                      {biografi.email && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 break-all flex-1">{biografi.email}</span>
                        </div>
                      )}
                      {(biografi.nomorHp || biografi.nomorTelepon || biografi.nomorWa) && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 flex-1">{biografi.nomorWa || biografi.nomorHp || biografi.nomorTelepon}</span>
                        </div>
                      )}                      {(locationNames.kotaNama || biografi.kota) && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <MapPinIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 flex-1">{locationNames.kotaNama || biografi.kota}</span>
                        </div>
                      )}
                    </div>
                  </div>                  {/* Action Buttons - Enhanced Design with Better Responsiveness */}
                  <div className="grid grid-cols-2 gap-3">
                    {biografi.email && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-11 text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200 text-blue-700 hover:text-blue-800 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-700 dark:text-blue-300 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
                        onClick={() => window.open(`mailto:${biografi.email}`, '_blank')}
                      >
                        <Mail className="h-4 w-4" />
                        <span className="font-medium">Email</span>
                      </Button>
                    )}
                    {(biografi.nomorWa || biografi.nomorHp || biografi.nomorTelepon) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-11 text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-200 text-green-700 hover:text-green-800 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-700 dark:text-green-300 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
                        onClick={() => {
                          const phoneNumber = biografi.nomorWa || biografi.nomorHp || biografi.nomorTelepon;
                          const formattedPhone = formatPhoneNumberForWhatsApp(phoneNumber!);
                          window.open(`https://wa.me/${formattedPhone}`, '_blank');
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span className="font-medium">WhatsApp</span>
                      </Button>
                    )}
                  </div>
                </div></CardContent>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 w-full">
          {/* Left Sidebar - Profile Card */}
          <div className="xl:col-span-1 hidden xl:block">
            <div className="sticky top-8 space-y-6">
              {/* Main Profile Card */}
              <Card className="overflow-hidden border-0 shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                <div className="relative">
                  {/* Profile Photo - Full Card Width */}
                  <div className="relative h-80 bg-gray-100 dark:bg-gray-800">
                    {(biografi.fotoProfil || biografi.foto) ? (
                      <Image
                        src={imageAPI.getImageUrl(biografi.fotoProfil || biografi.foto || '')}
                        alt={biografi.namaLengkap}
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                        <User className="h-24 w-24 text-white" />
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute bottom-4 right-4">
                      <Badge
                        variant={biografi.status === 'AKTIF' ? 'default' : 'secondary'}
                        className="bg-green-500 hover:bg-green-600 text-white border-2 border-white shadow-lg"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {biografi.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6 text-center">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 break-words">
                        {biografi.namaLengkap}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                        {biografi.nim}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Alumni Tahun {biografi.alumniTahun || new Date(biografi.tanggalLulus || '').getFullYear() || 'N/A'}
                      </p>
                    </div>

                    <Separator />

                    {/* Quick Contact Actions */}
                    <div className="space-y-2">
                      {biografi.email && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => window.open(`mailto:${biografi.email}`, '_blank')}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          {biografi.email}
                        </Button>
                      )}
                      
                      {(biografi.nomorWa || biografi.nomorHp || biografi.nomorTelepon) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            const phoneNumber = biografi.nomorWa || biografi.nomorHp || biografi.nomorTelepon;
                            const formattedPhone = formatPhoneNumberForWhatsApp(phoneNumber!);
                            window.open(`https://wa.me/${formattedPhone}`, '_blank');
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          WhatsApp
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={handleShare}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Bagikan Profil
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>              {/* Quick Info Cards */}
              {(biografi.posisiJabatan || biografi.pekerjaanSaatIni) && (
                <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          Pekerjaan Saat Ini
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {biografi.posisiJabatan || biografi.pekerjaanSaatIni}
                        </p>
                        {biografi.perusahaanSaatIni && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                            {biografi.perusahaanSaatIni}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}              {(locationNames.kotaNama || locationNames.provinsiNama || biografi.alamat) && (
                <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                        <MapPinIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          Lokasi
                        </h3>
                        {biografi.alamat && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 break-words">
                            {biografi.alamat}
                          </p>
                        )}
                        {(locationNames.kotaNama || locationNames.provinsiNama) && (
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {[
                              locationNames.kelurahanNama,
                              locationNames.kecamatanNama,
                              locationNames.kotaNama,
                              locationNames.provinsiNama
                            ].filter(Boolean).join(', ')}
                            {biografi.kodePos && ` ${biografi.kodePos}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>          {/* Main Content */}
          <div className="xl:col-span-3">            {/* Top Navigation Tabs - Enhanced for Better UX */}
            <div className="sticky top-[72px] sm:top-[88px] z-30 mb-6 bg-gradient-to-br from-slate-50/95 via-blue-50/95 to-indigo-100/95 dark:from-gray-900/95 dark:via-slate-900/95 dark:to-gray-800/95 backdrop-blur-md pt-2 pb-4 -mx-4 px-2 no-print border-b border-white/20 dark:border-gray-700/20 shadow-sm">
              <div className="overflow-hidden">
                <div className="flex overflow-x-auto scrollbar-hide gap-1 min-w-0 pb-2 px-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`flex items-center gap-1.5 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 relative overflow-hidden whitespace-nowrap flex-shrink-0 min-w-max touch-manipulation active:scale-95 ${
                          activeSection === item.id
                            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg transform scale-105 ring-2 ring-blue-400/30'
                            : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:shadow-md border border-gray-200/60 dark:border-gray-700/60 hover:border-blue-300 dark:hover:border-blue-600'
                        }`}
                      >
                        <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${activeSection === item.id ? 'animate-pulse' : ''} flex-shrink-0`} />
                        <span className="text-xs sm:text-sm font-medium">
                          <span className="sm:hidden">{item.mobileLabel}</span>
                          <span className="hidden sm:inline">{item.label}</span>
                        </span>
                        {activeSection === item.id && (
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 rounded-xl animate-pulse"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {/* Enhanced scroll indicator for mobile */}
                <div className="flex justify-center mt-2 sm:hidden">
                  <div className="flex gap-1">
                    <div className="w-2 h-1 bg-blue-400 dark:bg-blue-500 rounded-full opacity-60"></div>
                    <div className="w-4 h-1 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                    <div className="w-2 h-1 bg-blue-400 dark:bg-blue-500 rounded-full opacity-60"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8 min-w-0 overflow-x-hidden">
            {/* Overview Section */}
            {activeSection === "overview" && (
              <div className="space-y-6 min-w-0 overflow-x-hidden">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-words">Overview</h2>
                </div>                {/* Stats Cards - Responsive Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">                  <Card 
                    className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer touch-manipulation min-w-0"
                    onClick={() => setActiveSection("academic")}
                  >
                    <CardContent className="p-4 sm:p-6 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-blue-100 text-xs sm:text-sm font-medium">Alumni Tahun</p>
                          <p className="text-lg sm:text-2xl font-bold break-words">
                            {biografi.alumniTahun || new Date(biografi.tanggalLulus || '').getFullYear() || 'N/A'}
                          </p>
                        </div>
                        <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-blue-200 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer touch-manipulation min-w-0"
                    onClick={() => setActiveSection("professional")}
                  >
                    <CardContent className="p-4 sm:p-6 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-emerald-100 text-xs sm:text-sm font-medium">Pengalaman</p>                          <p className="text-sm sm:text-lg font-bold leading-tight break-words">
                            {(() => {
                              const experience = calculateWorkExperience();
                              if (experience === "Tidak ada pengalaman") return "Baru";
                              if (experience.includes("tahun")) {
                                const years = experience.split(" ")[0];
                                return `${years} tahun`;
                              }
                              return experience;
                            })()}
                          </p>
                        </div>
                        <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-200 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>                  <Card 
                    className="border-0 shadow-lg bg-gradient-to-br from-teal-500 to-cyan-600 text-white hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer touch-manipulation min-w-0"
                    onClick={() => setActiveSection("medical")}
                  >
                    <CardContent className="p-4 sm:p-6 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-teal-100 text-xs sm:text-sm font-medium">Spesialisasi</p>
                          <p className="text-sm sm:text-lg font-bold leading-tight break-words">
                            {(() => {
                              const specialization = calculateMedicalSpecializationYears();
                              if (specialization === "Tidak ada spesialisasi") return "Belum ada";
                              if (specialization.includes("tahun")) {
                                const years = specialization.split(" ")[0];
                                return `${years} tahun`;
                              }
                              return specialization;
                            })()}
                          </p>
                        </div>
                        <BrainCircuit className="h-6 w-6 sm:h-8 sm:w-8 text-teal-200 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer touch-manipulation min-w-0"
                    onClick={() => setActiveSection("achievements")}
                  >
                    <CardContent className="p-4 sm:p-6 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-amber-100 text-xs sm:text-sm font-medium">Prestasi</p>
                          <p className="text-lg sm:text-2xl font-bold break-words">
                            {biografi.achievements?.length || 0}
                          </p>
                        </div>
                        <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-amber-200 flex-shrink-0" />
                      </div>
                    </CardContent>                  </Card>
                </div>

                {/* Current Position Highlight */}
              {(() => {
                // Get the latest work experience
                const getLatestWorkExperience = () => {
                  if (biografi.workExperiences && biografi.workExperiences.length > 0) {
                    return biografi.workExperiences
                      .sort((a, b) => {
                        const dateA = a.tanggalMulai ? new Date(a.tanggalMulai).getTime() : 0;
                        const dateB = b.tanggalMulai ? new Date(b.tanggalMulai).getTime() : 0;
                        return dateB - dateA;
                      })[0];
                  }
                  return null;
                };
                
                const latestWork = getLatestWorkExperience();
                const hasCurrentPosition = latestWork || biografi.posisiJabatan || biografi.pekerjaanSaatIni;
                
                return hasCurrentPosition ? (
                  <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                          <Building className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Posisi Saat Ini
                          </h3>
                          <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 mb-1 leading-tight">
                            {latestWork?.posisi || biografi.posisiJabatan || biografi.pekerjaanSaatIni}
                          </p>
                          {(latestWork?.perusahaan || biografi.perusahaanSaatIni) && (
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
                              di {latestWork?.perusahaan || biografi.perusahaanSaatIni}
                            </p>
                          )}
                          {(latestWork?.tanggalMulai || biografi.tanggalMasukKerja || biografi.tanggalKeluarKerja) && (
                            <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm text-gray-500">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="truncate">
                                {(latestWork?.tanggalMulai || biografi.tanggalMasukKerja) && 
                                  formatDate(latestWork?.tanggalMulai || biografi.tanggalMasukKerja)}
                                {(latestWork?.tanggalSelesai || biografi.tanggalKeluarKerja) && 
                                  ` - ${formatDate(latestWork?.tanggalSelesai || biografi.tanggalKeluarKerja)}`}
                                {!(latestWork?.tanggalSelesai || biografi.tanggalKeluarKerja) && 
                                  (latestWork?.tanggalMulai || biografi.tanggalMasukKerja) && ' - Sekarang'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : null;
              })()}

              {/* General Information */}
              <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-500" />
                    Informasi Umum
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      {biografi.nim && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">NIM</h4>
                            <p className="text-gray-600 dark:text-gray-400">{biografi.nim}</p>
                          </div>
                        </div>
                      )}

                      {biografi.tanggalLahir && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Cake className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Tanggal Lahir</h4>
                            <p className="text-gray-600 dark:text-gray-400">{formatDate(biografi.tanggalLahir)}</p>
                          </div>
                        </div>
                      )}

                      {biografi.tempatLahir && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Home className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Tempat Lahir</h4>
                            <p className="text-gray-600 dark:text-gray-400">{biografi.tempatLahir}</p>
                          </div>
                        </div>
                      )}

                      {biografi.jenisKelamin && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Contact className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Jenis Kelamin</h4>
                            <p className="text-gray-600 dark:text-gray-400">{biografi.jenisKelamin}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Academic Info */}
                    <div className="space-y-4">
                      {biografi.tanggalLulus && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <GraduationCap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Tanggal Lulus</h4>
                            <p className="text-gray-600 dark:text-gray-400">{formatDate(biografi.tanggalLulus)}</p>
                          </div>
                        </div>
                      )}

                      {biografi.alumniTahun && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <School className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Tahun Alumni</h4>
                            <p className="text-gray-600 dark:text-gray-400">{biografi.alumniTahun}</p>
                          </div>
                        </div>
                      )}

                      {biografi.alamat && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <MapPin className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Alamat</h4>
                            <p className="text-gray-600 dark:text-gray-400">{biografi.alamat}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>                {/* Bio / About */}
                {biografi.catatan && (
                  <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-500" />
                        Catatan
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <p className="text-gray-900 dark:text-white leading-relaxed">
                        {biografi.catatan}
                      </p>
                    </CardContent>
                  </Card>                )}

                {/* Social Media */}
                {socialLinks.length > 0 && (
                <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-orange-500" />
                      Media Sosial
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {socialLinks.map((link, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="justify-start h-auto p-4"
                          onClick={() => window.open(link.url, '_blank')}
                        >
                          <div className="flex items-center gap-3 w-full">
                            {getSocialIcon(link.icon)}
                            <div className="text-left flex-1">
                              <p className="font-medium text-sm">{link.platform}</p>
                              <p className="text-xs text-gray-500 truncate">{link.url}</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                          </div>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Additional Notes */}
              {biografi.catatan && (
                <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-indigo-500" />
                      Catatan Tambahan                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-gray-900 dark:text-white leading-relaxed">
                      {biografi.catatan}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
            )}

            {/* Personal Section */}
            {activeSection === "personal" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-red-600 flex items-center justify-center shadow-lg">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Informasi Pribadi</h2>
              <p className="text-gray-600 dark:text-gray-400">Detail pribadi dan informasi keluarga</p>
            </div>
          </div>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-pink-500" />
                Data Pribadi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {biografi.tanggalLahir && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tanggal Lahir
                    </label>
                    <p className="text-gray-900 dark:text-white font-semibold">{formatDate(biografi.tanggalLahir)}</p>
                  </div>
                )}

                {biografi.tempatLahir && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tempat Lahir
                    </label>
                    <p className="text-gray-900 dark:text-white font-semibold">{biografi.tempatLahir}</p>
                  </div>
                )}

                {biografi.jenisKelamin && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Jenis Kelamin
                    </label>
                    <p className="text-gray-900 dark:text-white font-semibold">{biografi.jenisKelamin}</p>
                  </div>
                )}

                {biografi.alamat && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Alamat
                    </label>
                    <p className="text-gray-900 dark:text-white font-semibold">{biografi.alamat}</p>
                  </div>
                )}

                {(biografi.kota || biografi.provinsi) && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Kota/Provinsi
                    </label>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      {[biografi.kota, biografi.provinsi].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-500" />
                Kontak
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {biografi.email && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <p className="text-gray-900 dark:text-white font-semibold break-all">{biografi.email}</p>
                  </div>
                )}

                {(biografi.nomorHp || biografi.nomorTelepon) && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nomor Telepon
                    </label>
                    <p className="text-gray-900 dark:text-white font-semibold">{biografi.nomorHp || biografi.nomorTelepon}</p>
                  </div>
                )}

                {biografi.nomorWa && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      WhatsApp
                    </label>
                    <p className="text-gray-900 dark:text-white font-semibold">{biografi.nomorWa}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          {socialLinks.length > 0 && (
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-purple-500" />
                  Media Sosial
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {socialLinks.map((link, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getSocialIcon(link.icon)}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{link.platform}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{link.url}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(link.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>          )}
        </div>
      )}

      {/* Personal Section */}
      {activeSection === "personal" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Informasi Pribadi</h2>
              <p className="text-gray-600 dark:text-gray-400">Detail informasi personal alumni</p>
            </div>
          </div>

          {/* Personal Details */}
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-pink-500" />
                Detail Pribadi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {biografi.tanggalLahir && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0">
                      <Cake className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                        Tanggal Lahir
                      </label>
                      <p className="text-gray-900 dark:text-white font-medium">{formatDate(biografi.tanggalLahir)}</p>
                    </div>
                  </div>
                )}

                {biografi.tempatLahir && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <MapPinIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                        Tempat Lahir
                      </label>
                      <p className="text-gray-900 dark:text-white font-medium">{biografi.tempatLahir}</p>
                    </div>
                  </div>
                )}

                {biografi.jenisKelamin && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <UserCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                        Jenis Kelamin
                      </label>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {biografi.jenisKelamin === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'}
                      </p>
                    </div>
                  </div>
                )}

                {biografi.agama && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <Star className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                        Agama
                      </label>
                      <p className="text-gray-900 dark:text-white font-medium">{biografi.agama}</p>
                    </div>
                  </div>
                )}

                {biografi.alamat && (
                  <div className="md:col-span-2 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                      <Home className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                        Alamat Lengkap
                      </label>
                      <p className="text-gray-900 dark:text-white leading-relaxed">{biografi.alamat}</p>
                    </div>
                  </div>
                )}

                {/* Detailed Location Information */}
                {(locationNames.kelurahanNama || locationNames.kecamatanNama || locationNames.kotaNama || locationNames.provinsiNama || biografi.kodePos) && (
                  <div className="md:col-span-2 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <MapPinIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                        Detail Lokasi
                      </label>
                      <div className="space-y-1">
                        {locationNames.kelurahanNama && (
                          <p className="text-sm text-gray-900 dark:text-white">
                            Kelurahan: {locationNames.kelurahanNama}
                          </p>
                        )}
                        {locationNames.kecamatanNama && (
                          <p className="text-sm text-gray-900 dark:text-white">
                            Kecamatan: {locationNames.kecamatanNama}
                          </p>
                        )}
                        {locationNames.kotaNama && (
                          <p className="text-sm text-gray-900 dark:text-white">
                            Kota: {locationNames.kotaNama}
                          </p>
                        )}
                        {locationNames.provinsiNama && (
                          <p className="text-sm text-gray-900 dark:text-white">
                            Provinsi: {locationNames.provinsiNama}
                          </p>
                        )}
                        {biografi.kodePos && (
                          <p className="text-sm text-gray-900 dark:text-white">
                            Kode Pos: {biografi.kodePos}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Hobbies & Interests */}
          {biografi.hobi && (
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-purple-500" />
                  Hobi & Minat
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-2">
                  {biografi.hobi.split(',').map((hobby, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-900/50"
                    >
                      <Heart className="h-3 w-3 mr-1" />
                      {hobby.trim()}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Notes */}
          {biografi.catatan && (
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-500" />
                  Catatan Tambahan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-900 dark:text-white leading-relaxed">
                  {biografi.catatan}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Academic Section */}
      {activeSection === "academic" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Riwayat Akademik</h2>
              <p className="text-gray-600 dark:text-gray-400">Informasi pendidikan dan prestasi akademik</p>
            </div>
          </div>

          {/* Main Academic Info */}
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5 text-blue-500" />
                Pendidikan Utama
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {biografi.nim && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      NIM
                    </label>
                    <p className="text-gray-900 dark:text-white font-semibold">{biografi.nim}</p>
                  </div>
                )}

                {biografi.jurusan && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Jurusan
                    </label>
                    <p className="text-gray-900 dark:text-white font-semibold">{biografi.jurusan}</p>
                  </div>
                )}

                {biografi.tanggalLulus && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tanggal Lulus
                    </label>
                    <p className="text-gray-900 dark:text-white font-semibold">{formatDate(biografi.tanggalLulus)}</p>
                  </div>
                )}

                {biografi.alumniTahun && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tahun Alumni
                    </label>
                    <p className="text-gray-900 dark:text-white font-semibold">{biografi.alumniTahun}</p>
                  </div>
                )}

                {biografi.ipk && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      IPK/GPA
                    </label>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-900 dark:text-white font-semibold">{biografi.ipk}</p>
                      <Badge variant="outline" className="text-xs">
                        {parseFloat(biografi.ipk) >= 3.5 ? 'Cumlaude' : 'Baik'}
                      </Badge>
                    </div>
                  </div>
                )}

                {biografi.pendidikanLanjutan && (
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Pendidikan Lanjutan
                    </label>
                    <p className="text-gray-900 dark:text-white">{biografi.pendidikanLanjutan}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Professional Section */}
      {activeSection === "professional" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Karir Profesional</h2>
              <p className="text-gray-600 dark:text-gray-400">Pengalaman kerja dan posisi saat ini</p>
            </div>
          </div>

          {/* Current Work */}
          {(biografi.posisiJabatan || biografi.pekerjaanSaatIni || biografi.perusahaanSaatIni) && (
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20">
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-emerald-500" />
                  Pekerjaan Saat Ini
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {(biografi.posisiJabatan || biografi.pekerjaanSaatIni) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {biografi.posisiJabatan || biografi.pekerjaanSaatIni}
                      </h3>
                      {biografi.perusahaanSaatIni && (
                        <p className="text-gray-600 dark:text-gray-400 font-medium">
                          di {biografi.perusahaanSaatIni}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Work Experience Summary */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Trophy className="h-4 w-4" />
                    <span>Total Pengalaman: {calculateWorkExperience()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Work Experience */}
          {biografi.workExperiences && biografi.workExperiences.length > 0 ? (
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-blue-500" />
                  Riwayat Pekerjaan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {biografi.workExperiences
                    .sort((a, b) => {
                      const dateA = a.tanggalMulai ? new Date(a.tanggalMulai).getTime() : 0;
                      const dateB = b.tanggalMulai ? new Date(b.tanggalMulai).getTime() : 0;
                      return dateB - dateA;
                    })
                    .map((exp, index) => (
                      <div key={index} className="border-l-4 border-emerald-500 pl-4 py-2">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {exp.posisi}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {exp.tanggalMulai && formatDate(exp.tanggalMulai)}
                            {exp.tanggalSelesai ? ` - ${formatDate(exp.tanggalSelesai)}` : ' - Sekarang'}
                          </Badge>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">
                          {exp.perusahaan}
                        </p>
                        {exp.deskripsi && (
                          <p className="text-gray-600 dark:text-gray-400 mt-2">
                            {exp.deskripsi}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Belum Ada Riwayat Pekerjaan
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Informasi pengalaman kerja belum tersedia.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Medical Section */}
      {activeSection === "medical" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Spesialisasi Kedokteran</h2>
              <p className="text-gray-600 dark:text-gray-400">Pendidikan dan sertifikasi spesialis</p>
            </div>
          </div>

          {biografi.spesialisasiKedokteran && biografi.spesialisasiKedokteran.length > 0 ? (
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20">
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-teal-500" />
                  Program Spesialisasi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {biografi.spesialisasiKedokteran
                    .sort((a, b) => {
                      const dateA = a.tanggalMulai ? new Date(a.tanggalMulai).getTime() : 0;
                      const dateB = b.tanggalMulai ? new Date(b.tanggalMulai).getTime() : 0;
                      return dateB - dateA;
                    })
                    .map((spec, index) => (
                      <div key={index} className="border-l-4 border-teal-500 pl-4 py-2">
                        <div className="flex justify-between items-start mb-2">                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {spec.spesialisasi}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {spec.tanggalMulai && formatDate(spec.tanggalMulai)}
                                  {spec.tanggalAkhir ? ` - ${formatDate(spec.tanggalAkhir)}` : ' - Berlangsung'}
                                </Badge>
                              </div>                              <p className="text-gray-700 dark:text-gray-300 font-medium">
                                Spesialisasi Kedokteran
                              </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <BrainCircuit className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Belum Ada Spesialisasi
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Informasi spesialisasi kedokteran belum tersedia.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Achievements Section */}
      {activeSection === "achievements" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Prestasi & Penghargaan</h2>
              <p className="text-gray-600 dark:text-gray-400">Pencapaian dan pengakuan yang diterima</p>
            </div>
          </div>

          {biografi.achievements && biografi.achievements.length > 0 ? (
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  Daftar Prestasi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">                        {biografi.achievements
                          .sort((a, b) => {
                            const dateA = a.tahun ? new Date(a.tahun.toString()).getTime() : 0;
                            const dateB = b.tahun ? new Date(b.tahun.toString()).getTime() : 0;
                            return dateB - dateA;
                          })
                          .map((achievement, index) => (
                            <div key={index} className="border-l-4 border-amber-500 pl-4 py-2">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {achievement.judul}
                                </h4>
                                {achievement.tahun && (
                                  <Badge variant="outline" className="text-xs">
                                    {achievement.tahun}
                                  </Badge>
                                )}
                              </div>
                              {achievement.penyelenggara && (
                                <p className="text-gray-700 dark:text-gray-300 font-medium">
                                  {achievement.penyelenggara}
                                </p>
                              )}
                              {achievement.deskripsi && (
                                <p className="text-gray-600 dark:text-gray-400 mt-2">
                                  {achievement.deskripsi}
                                </p>
                              )}
                            </div>
                          ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Belum Ada Prestasi
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Informasi prestasi dan penghargaan belum tersedia.
                </p>              </CardContent>
            </Card>
          )}
        </div>      )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
