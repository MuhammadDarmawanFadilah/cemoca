"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { config, getApiUrl } from "@/lib/config";
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
  Edit,
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
  X
} from "lucide-react";
import Image from "next/image";
import { biografiAPI, Biografi, imageAPI, wilayahAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast-simple";

export default function BiografiDetailPage() {
  const [biografi, setBiografi] = useState<Biografi | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [viewStats, setViewStats] = useState<any>(null);
  const [viewHistory, setViewHistory] = useState<any[]>([]);
  const [showViewHistory, setShowViewHistory] = useState(false);
  const [locationNames, setLocationNames] = useState<{
    provinsiNama?: string;
    kotaNama?: string;
    kecamatanNama?: string;
    kelurahanNama?: string;
  }>({});
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const biografiId = params?.id as string;  useEffect(() => {
    if (biografiId) {
      fetchBiografiDetail();
      trackBiografiView();
      fetchViewStats();
    }
  }, [biografiId]);
  const fetchBiografiDetail = async () => {
    setLoading(true);
    try {
      const response = await biografiAPI.getBiografiById(parseInt(biografiId));
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
      toast({
        title: "Error",
        description: "Failed to fetch alumni profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };const trackBiografiView = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token || !isAuthenticated) {
        console.log("No authentication token available for tracking");
        return;
      }
      
      const headers: any = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };      // Send user information for tracking
      const userData = {
        userId: user?.id,
        userName: user?.fullName || user?.username,
        userEmail: user?.email
      };
      
      console.log("Tracking view with user data:", userData);
      console.log("User object:", user);
      
      const body = JSON.stringify(userData);
      
      const response = await fetch(getApiUrl(`/api/biografi-views/track/${biografiId}`), {
        method: 'POST',
        headers,
        body
      });
      
      if (!response.ok) {
        console.error("Tracking response not ok:", response.status, response.statusText);
      } else {
        console.log("View tracking successful");
      }
    } catch (error) {
      console.error("Error tracking view:", error);
      // Don't show error to user for tracking
    }
  };

  const fetchViewStats = async () => {
    try {
      const response = await fetch(getApiUrl(`/api/biografi-views/${biografiId}/stats`));
      if (response.ok) {
        const stats = await response.json();
        setViewStats(stats);
      }
    } catch (error) {
      console.error("Error fetching view stats:", error);
    }
  };
  const fetchViewHistory = async () => {
    try {
      const response = await fetch(getApiUrl(`/api/biografi-views/${biografiId}/history?size=20`));
      if (response.ok) {
        const data = await response.json();
        console.log("View history data from backend:", data);
        setViewHistory(data.content || []);
        setShowViewHistory(true);
      }
    } catch (error) {
      console.error("Error fetching view history:", error);
      toast({
        title: "Error",
        description: "Failed to fetch view history",
        variant: "destructive",
      });
    }
  };  const formatDate = (dateString?: string) => {
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
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/[^0-9]/g, '');
    
    // If number starts with '08', replace with '628'
    if (cleaned.startsWith('08')) {
      return '62' + cleaned.substring(1);
    }
    
    // If number starts with '8' (without leading 0), add '62'
    if (cleaned.startsWith('8') && !cleaned.startsWith('62')) {
      return '62' + cleaned;
    }
    
    // If number already starts with '62', return as is
    if (cleaned.startsWith('62')) {
      return cleaned;
    }
    
    // For other cases (like local numbers), assume Indonesian and add 62
    if (cleaned.length > 0) {
      return '62' + cleaned;
    }
    
    // Return original if empty
    return cleaned;
  };const getSocialIcon = (platform: string) => {
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
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Success",
        description: "Profile link copied to clipboard!",
      });
    }
  };  // Add enhanced print styles and custom scrollbar
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
  `;if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
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
  if (!biografi) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Profile Not Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              The requested alumni profile could not be found or may have been removed.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button variant="outline" onClick={() => router.push('/biografi')}>
                <Users className="h-4 w-4 mr-2" />
                View All Alumni
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }  // Navigation items for tabs
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
    { platform: 'Telegram', url: biografi.telegram, icon: 'telegram' },  ].filter(link => link.url);  return (
    <ProtectedRoute requireAuth={true}>
      <>
        <style dangerouslySetInnerHTML={{ __html: printStyles }} />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">      {/* Header with Back Button - Enhanced Modern Design */}
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200/80 dark:border-gray-700/80 sticky top-0 z-40 shadow-lg">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Kembali</span>
            </Button>
            
            <div className="flex items-center gap-3">
              <Badge
                variant={biografi.status === 'AKTIF' ? 'default' : 'secondary'}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-md px-3 py-1 text-xs font-semibold"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                {biografi.status}
              </Badge>
              
              <div className="flex gap-2">                {/* Edit button - shown only for biography owner or admins/moderators */}
                {user && biografi && (
                  // Check if user is admin/moderator OR if the biography belongs to the current user
                  (user.role && (user.role.roleName === 'ADMIN' || user.role.roleName === 'MODERATOR')) ||
                  (user.biografi && user.biografi.biografiId === biografi.biografiId) // Check if biografi belongs to current user
                ) && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => {
                      router.push(`/biografi/${biografiId}/edit`);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md px-3 py-2 rounded-xl transition-all duration-200 hover:scale-105"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline font-medium">Edit</span>
                  </Button>
                )}
                
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
      </div><div className="container mx-auto px-4 py-8 max-w-full overflow-x-hidden">
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
              <CardContent className="p-4">
                <div className="text-center mb-4">
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

                  {/* Current Position - Mobile */}
                  {(biografi.posisiJabatan || biografi.pekerjaanSaatIni) && (
                    <div className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl mb-4">
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Briefcase className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300 break-words">
                        {biografi.posisiJabatan || biografi.pekerjaanSaatIni}
                      </span>
                    </div>
                  )}

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
                      )}                      {locationNames.kotaNama && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <MapPinIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 flex-1">{locationNames.kotaNama}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons - Enhanced Design */}
                  <div className="grid grid-cols-2 gap-3">
                    {biografi.email && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200 text-blue-700 hover:text-blue-800 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-700 dark:text-blue-300 transition-all duration-200"
                        onClick={() => window.open(`mailto:${biografi.email}`, '_blank')}
                      >
                        <Mail className="h-4 w-4" />
                        Email
                      </Button>
                    )}
                    {(biografi.nomorWa || biografi.nomorHp || biografi.nomorTelepon) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-200 text-green-700 hover:text-green-800 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-700 dark:text-green-300 transition-all duration-200"
                        onClick={() => {
                          const phoneNumber = biografi.nomorWa || biografi.nomorHp || biografi.nomorTelepon;
                          const formattedPhone = formatPhoneNumberForWhatsApp(phoneNumber!);
                          window.open(`https://wa.me/${formattedPhone}`, '_blank');
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                        WhatsApp
                      </Button>
                    )}                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 w-full">
          {/* Left Sidebar - Profile Card */}
          <div className="xl:col-span-1 hidden xl:block">
            <div className="sticky top-[88px] space-y-6">{/* Main Profile Card */}
              <Card className="overflow-hidden border-0 shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                <div className="relative">{/* Profile Photo - Full Card Width */}
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
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {biografi.namaLengkap}
                      </h1>
                      <p className="text-gray-600 dark:text-gray-400 font-medium">
                        {biografi.nim}
                      </p>                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        Alumni Tahun {biografi.alumniTahun || new Date(biografi.tanggalLulus || '').getFullYear() || 'N/A'}
                      </p>
                    </div>

                    {/* Quick Info */}
                    <div className="space-y-3 text-left">
                      {biografi.email && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400 break-all">
                            {biografi.email}
                          </span>
                        </div>
                      )}

                      {(biografi.nomorHp || biografi.nomorTelepon) && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                            <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {biografi.nomorHp || biografi.nomorTelepon}
                          </span>
                        </div>
                      )}                      {/* Location Info - Show only city in overview */}
                      {(locationNames.kotaNama || biografi.kota) && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                            <MapPinIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {locationNames.kotaNama || biografi.kota}
                          </span>
                        </div>
                      )}{(biografi.pekerjaanSaatIni || biografi.posisiJabatan) && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                            <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block">
                              {biografi.posisiJabatan || biografi.pekerjaanSaatIni}
                            </span>                            {biografi.perusahaanSaatIni && (
                              <span className="text-xs text-gray-500 dark:text-gray-500">
                                di {biografi.perusahaanSaatIni}
                              </span>
                            )}
                          </div>                        </div>
                      )}
                    </div>

                    {/* Social Links */}
                    {socialLinks.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white text-left">
                            Media Sosial
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {socialLinks.map((link, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="h-8 px-3"
                                onClick={() => window.open(link.url, '_blank')}
                              >
                                {getSocialIcon(link.icon)}
                                <span className="ml-2 text-xs">{link.platform}</span>
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </Button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>              {/* Quick Actions */}              <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">
                    Aksi Cepat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {biografi.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-9"
                      onClick={() => window.open(`mailto:${biografi.email}`, '_blank')}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Kirim Email
                    </Button>
                  )}                  {(biografi.nomorWa || biografi.nomorHp || biografi.nomorTelepon) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-9"
                      onClick={() => {
                        const phoneNumber = biografi.nomorWa || biografi.nomorHp || biografi.nomorTelepon;
                        const formattedPhone = formatPhoneNumberForWhatsApp(phoneNumber!);
                        window.open(`https://wa.me/${formattedPhone}`, '_blank');
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Kirim WhatsApp
                    </Button>
                  )}
                  
                  {/* View Statistics */}
                  <div className="pt-2">                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Tampilan Profil</span>
                      {viewStats && (
                        <Badge variant="secondary" className="text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          {viewStats.totalViews || 0} tampilan
                        </Badge>
                      )}
                    </div>
                    
                    {viewStats && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2 text-center">
                          <div className="font-semibold text-blue-600 dark:text-blue-400">
                            {viewStats.authenticatedViews || 0}
                          </div>                          <div className="text-gray-600 dark:text-gray-400">Anggota</div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 rounded p-2 text-center">
                          <div className="font-semibold text-green-600 dark:text-green-400">
                            {viewStats.anonymousViews || 0}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">Pengunjung</div>
                        </div>
                      </div>
                    )}
                      <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-8 mt-2"
                      onClick={fetchViewHistory}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Riwayat Tampilan
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* View History Modal/Card */}
              {showViewHistory && (
                <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">
                        Pengunjung Terbaru
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowViewHistory(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                    {viewHistory.length > 0 ? (
                      viewHistory.map((view, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <div className="flex items-center gap-2">                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                              {(view.viewerName || view.viewerEmail) ? (
                                <UserCheck className="h-3 w-3 text-white" />
                              ) : (
                                <Eye className="h-3 w-3 text-white" />
                              )}
                            </div><div>                              <div className="text-xs font-medium text-gray-900 dark:text-white">
                                {view.viewerName || 'Pengunjung Anonim'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(view.viewedAt).toLocaleDateString('id-ID', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>                          {view.viewerName && (
                            <Badge variant="outline" className="text-xs">
                              Anggota
                            </Badge>
                          )}
                        </div>
                      ))
                    ) : (                      <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-xs">
                        Tidak ada riwayat tampilan
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>          {/* Main Content Area */}
          <div className="xl:col-span-3 min-w-0 overflow-x-hidden">            {/* Top Navigation Tabs - Optimized for Mobile */}
            <div className="sticky top-[72px] sm:top-[88px] z-30 mb-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 pt-2 pb-4 -mx-4 px-2">
              <div className="overflow-hidden">
                <div className="flex overflow-x-auto scrollbar-hide gap-1 min-w-0 pb-2 px-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 relative overflow-hidden whitespace-nowrap flex-shrink-0 min-w-max touch-manipulation ${
                          activeSection === item.id
                            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md transform scale-105'
                            : 'bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:shadow-sm border border-gray-200 dark:border-gray-700'
                        }`}
                      >                        <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${activeSection === item.id ? '' : ''} flex-shrink-0`} />
                        <span className="text-xs sm:text-sm">
                          <span className="sm:hidden">{item.mobileLabel}</span>
                          <span className="hidden sm:inline">{item.label}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {/* Scroll indicator for mobile */}
                <div className="flex justify-center mt-1 sm:hidden">
                  <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50"></div>
                </div>
              </div>
            </div>

            <div className="space-y-8 min-w-0 overflow-x-hidden">              {/* Overview Section */}
              {activeSection === "overview" && (
              <div className="space-y-6 min-w-0 overflow-x-hidden">                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-words">Overview</h2>
                </div>{/* Quick Stats - Mobile Optimized */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 w-full min-w-0">
                  <Card 
                    className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer touch-manipulation min-w-0"
                    onClick={() => setActiveSection("personal")}
                  >
                    <CardContent className="p-4 sm:p-6 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-blue-100 text-xs sm:text-sm font-medium">Tahun Alumni</p>
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
                          <p className="text-emerald-100 text-xs sm:text-sm font-medium">Pengalaman</p>
                          <p className="text-sm sm:text-2xl font-bold leading-tight break-words">
                            {(() => {
                              const experience = calculateWorkExperience();
                              // Show shortened version on mobile
                              if (experience === "Tidak ada pengalaman") return "Belum ada";
                              if (experience.includes("tahun")) {
                                const years = experience.split(" ")[0];
                                return `${years}th`;
                              }
                              return experience;
                            })()}
                          </p>
                        </div>
                        <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-200 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className="border-0 shadow-lg bg-gradient-to-br from-teal-500 to-cyan-600 text-white hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer touch-manipulation min-w-0"
                    onClick={() => setActiveSection("medical")}
                  >
                    <CardContent className="p-4 sm:p-6 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-teal-100 text-xs sm:text-sm font-medium">Spesialisasi</p>
                          <p className="text-sm sm:text-2xl font-bold leading-tight break-words">
                            {(() => {
                              const specialization = calculateMedicalSpecializationYears();
                              if (specialization === "Tidak ada spesialisasi") return "Belum ada";
                              if (specialization.includes("tahun")) {
                                const years = specialization.split(" ")[0];
                                return `${years}th`;
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
                    </CardContent>
                  </Card>
                </div>{/* Current Position Highlight */}
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
              </div>
            )}            {/* Academic Section */}
            {activeSection === "academic" && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Informasi Akademik</h2>
                </div>

                {/* Main Academic Info */}
                <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <School className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                      Pendidikan Universitas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      {(() => {
                        // Get the most relevant academic record (highest level or most recent)
                        const getAcademicInfo = () => {
                          if (biografi.academicRecords && biografi.academicRecords.length > 0) {
                            // Priority order for education levels
                            const levelPriority: { [key: string]: number } = {
                              'S3': 3, 'Doktor': 3, 'Doctoral': 3,
                              'S2': 2, 'Master': 2, 'Magister': 2,
                              'S1': 1, 'Sarjana': 1, 'Bachelor': 1
                            };
                            
                            // Sort by level priority first, then by graduation date
                            const sortedRecords = biografi.academicRecords.sort((a, b) => {
                              const levelA = levelPriority[a.jenjangPendidikan] || 0;
                              const levelB = levelPriority[b.jenjangPendidikan] || 0;
                              
                              if (levelA !== levelB) return levelB - levelA;
                              
                              // If same level, sort by graduation date
                              const dateA = a.tanggalLulus ? new Date(a.tanggalLulus).getTime() : 0;
                              const dateB = b.tanggalLulus ? new Date(b.tanggalLulus).getTime() : 0;
                              return dateB - dateA;
                            });
                            
                            const primaryRecord = sortedRecords[0];
                            return {
                              jurusan: primaryRecord.programStudi || biografi.jurusan,
                              programStudi: primaryRecord.programStudi || biografi.programStudi,
                              tanggalLulus: primaryRecord.tanggalLulus || biografi.tanggalLulus,
                              ipk: primaryRecord.ipk || biografi.ipk,
                              universitas: primaryRecord.universitas,
                              jenjangPendidikan: primaryRecord.jenjangPendidikan,
                              hasAcademicRecords: true
                            };
                          }
                          
                          // Fallback to biografi fields
                          return {
                            jurusan: biografi.jurusan,
                            programStudi: biografi.programStudi,
                            tanggalLulus: biografi.tanggalLulus,
                            ipk: biografi.ipk,
                            universitas: null,
                            jenjangPendidikan: null,
                            hasAcademicRecords: false
                          };
                        };
                        
                        const academicInfo = getAcademicInfo();
                        
                        return (
                          <>
                            {academicInfo.hasAcademicRecords && academicInfo.universitas && (
                              <div className="space-y-2">                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Universitas
                                </label>
                                <p className="text-gray-900 dark:text-white font-semibold">{academicInfo.universitas}</p>
                              </div>
                            )}
                            
                            {academicInfo.hasAcademicRecords && academicInfo.jenjangPendidikan && (
                              <div className="space-y-2">                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Jenjang Pendidikan
                                </label>
                                <p className="text-gray-900 dark:text-white font-semibold">{academicInfo.jenjangPendidikan}</p>
                              </div>
                            )}

                            {academicInfo.jurusan && (
                              <div className="space-y-2">                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {academicInfo.hasAcademicRecords ? 'Program Studi' : 'Jurusan'}
                                </label>
                                <p className="text-gray-900 dark:text-white font-semibold">{academicInfo.jurusan}</p>
                              </div>
                            )}

                            {academicInfo.programStudi && academicInfo.programStudi !== academicInfo.jurusan && (
                              <div className="space-y-2">                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Program Studi
                                </label>
                                <p className="text-gray-900 dark:text-white font-semibold">{academicInfo.programStudi}</p>
                              </div>
                            )}

                            {academicInfo.tanggalLulus && (
                              <div className="space-y-2">                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Tanggal Lulus
                                </label>
                                <p className="text-gray-900 dark:text-white font-semibold">{formatDate(academicInfo.tanggalLulus)}</p>
                              </div>
                            )}

                            {academicInfo.ipk && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  GPA
                                </label>
                                <div className="flex items-center gap-2">
                                  <p className="text-gray-900 dark:text-white font-semibold">{academicInfo.ipk}</p>                                  <Badge variant="outline" className="text-xs">
                                    {parseFloat(academicInfo.ipk) >= 3.5 ? 'Cumlaude' : 'Baik'}
                                  </Badge>
                                </div>
                              </div>
                            )}

                            {biografi.pendidikanLanjutan && (
                              <div className="md:col-span-2 space-y-2">                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Pendidikan Lanjutan
                                </label>
                                <p className="text-gray-900 dark:text-white">{biografi.pendidikanLanjutan}</p>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>                {/* Academic Records */}
                {biografi.academicRecords && biografi.academicRecords.length > 0 ? (
                  <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-indigo-500" />
                        Riwayat Akademik
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">                        {biografi.academicRecords?.map((record, index) => (
                          <div key={index} className="border-l-4 border-indigo-500 pl-4 py-2">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {record.jenjangPendidikan}
                              </h4>
                              {record.tanggalLulus && (
                                <Badge variant="outline" className="text-xs">
                                  {formatDate(record.tanggalLulus)}
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 font-medium">
                              {record.universitas}
                            </p>
                            {record.programStudi && (
                              <p className="text-gray-600 dark:text-gray-400">
                                {record.programStudi}
                              </p>
                            )}
                            {record.ipk && (
                              <p className="text-sm text-gray-500 mt-1">
                                GPA: {record.ipk}
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
                      <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Tidak Ada Riwayat Akademik Tambahan
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Hanya pendidikan universitas utama yang tercantum di atas.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Professional Section */}
            {activeSection === "professional" && (
              <div className="space-y-6">                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                    <Briefcase className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pengalaman Profesional</h2>
                </div>{/* Current Position */}
                {(biografi.pekerjaanSaatIni || biografi.posisiJabatan || biografi.perusahaanSaatIni) && (
                  <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-green-500" />
                        Posisi Saat Ini
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">                        {(biografi.pekerjaanSaatIni || biografi.posisiJabatan) && (
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Posisi
                            </label>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                              {biografi.posisiJabatan || biografi.pekerjaanSaatIni}
                            </p>
                          </div>
                        )}

                        {biografi.perusahaanSaatIni && (
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Perusahaan
                            </label>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {biografi.perusahaanSaatIni}
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {biografi.tanggalMasukKerja && (
                            <div>
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Tanggal Mulai
                              </label>
                              <p className="text-gray-900 dark:text-white font-medium">
                                {formatDate(biografi.tanggalMasukKerja)}
                              </p>
                            </div>
                          )}

                          {biografi.tanggalKeluarKerja && (
                            <div>
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Tanggal Selesai
                              </label>
                              <p className="text-gray-900 dark:text-white font-medium">
                                {formatDate(biografi.tanggalKeluarKerja)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}                {/* Work Experiences */}
                {biografi.workExperiences && biografi.workExperiences.length > 0 ? (
                  <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-emerald-500" />
                        Riwayat Pengalaman Kerja
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-6">                        {biografi.workExperiences?.map((experience, index) => (
                          <div key={index} className="relative">
                            {index < biografi.workExperiences!.length - 1 && (
                              <div className="absolute left-6 top-12 w-0.5 h-16 bg-gradient-to-b from-emerald-500 to-teal-500"></div>
                            )}
                            <div className="flex gap-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                                <Briefcase className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {experience.posisi}
                                  </h4>
                                  {(experience.tanggalMulai || experience.tanggalSelesai) && (
                                    <Badge variant="outline" className="text-xs">
                                      {experience.tanggalMulai && formatDate(experience.tanggalMulai)}                                      {experience.tanggalSelesai && ` - ${formatDate(experience.tanggalSelesai)}`}
                                      {!experience.tanggalSelesai && experience.tanggalMulai && ' - Sekarang'}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                                  {experience.perusahaan}
                                </p>
                                {experience.deskripsi && (
                                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                    {experience.deskripsi}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                    <CardContent className="p-12 text-center">
                      <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Tidak Ada Pengalaman Kerja
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Alumni ini belum menambahkan pengalaman kerja mereka.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Medical Specialization Section */}
            {activeSection === "medical" && (
              <div className="space-y-6">                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
                    <BrainCircuit className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Spesialisasi Kedokteran</h2>
                </div>

                {/* Medical Specializations */}
                {biografi.spesialisasiKedokteran && biografi.spesialisasiKedokteran.length > 0 ? (
                  <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20">
                      <CardTitle className="flex items-center gap-2">
                        <BrainCircuit className="h-5 w-5 text-teal-500" />
                        Daftar Spesialisasi
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        {biografi.spesialisasiKedokteran?.map((spesialisasi, index) => (
                          <div key={index} className="relative">
                            {index < biografi.spesialisasiKedokteran!.length - 1 && (
                              <div className="absolute left-6 top-12 w-0.5 h-16 bg-gradient-to-b from-teal-500 to-cyan-500"></div>
                            )}
                            <div className="flex gap-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                                <BrainCircuit className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {spesialisasi.spesialisasi}
                                  </h4>
                                  <div className="flex gap-2">
                                    {spesialisasi.masihBekerja && (
                                      <Badge variant="default" className="text-xs bg-green-500">
                                        Aktif
                                      </Badge>
                                    )}
                                    {(spesialisasi.tanggalMulai || spesialisasi.tanggalAkhir) && (
                                      <Badge variant="outline" className="text-xs">
                                        {spesialisasi.tanggalMulai && formatDate(spesialisasi.tanggalMulai)}
                                        {spesialisasi.tanggalAkhir && ` - ${formatDate(spesialisasi.tanggalAkhir)}`}
                                        {!spesialisasi.tanggalAkhir && spesialisasi.masihBekerja && ' - Sekarang'}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {spesialisasi.lokasiPenempatan && (
                                  <p className="text-gray-700 dark:text-gray-300 font-medium mb-2 flex items-center gap-2">
                                    <MapPinIcon className="h-4 w-4 text-gray-500" />
                                    {spesialisasi.lokasiPenempatan}
                                  </p>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                  {spesialisasi.tanggalMulai && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Tanggal Mulai
                                      </label>
                                      <p className="text-gray-900 dark:text-white font-medium">
                                        {formatDate(spesialisasi.tanggalMulai)}
                                      </p>
                                    </div>
                                  )}
                                  {spesialisasi.tanggalAkhir && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Tanggal Selesai
                                      </label>
                                      <p className="text-gray-900 dark:text-white font-medium">
                                        {formatDate(spesialisasi.tanggalAkhir)}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
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
                        Alumni ini belum menambahkan informasi spesialisasi kedokteran.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Achievements Section */}
            {activeSection === "achievements" && (
              <div className="space-y-6">                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Prestasi & Penghargaan</h2>
                </div>

                {/* General Achievements */}
                {biografi.prestasi && (
                  <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        Prestasi Umum
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <p className="text-gray-900 dark:text-white leading-relaxed">
                        {biografi.prestasi}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Structured Achievements */}
                {biografi.achievements && biografi.achievements.length > 0 && (
                  <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-orange-500" />
                        Penghargaan & Pengakuan
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid gap-4">
                        {biografi.achievements.map((achievement, index) => (
                          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                                <Trophy className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                  {achievement.judul}
                                </h4>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                  {achievement.penyelenggara} • {achievement.tahun}
                                </p>
                                {achievement.deskripsi && (
                                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                                    {achievement.deskripsi}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!biografi.prestasi && (!biografi.achievements || biografi.achievements.length === 0) && (
                  <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                    <CardContent className="p-12 text-center">
                      <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Belum Ada Prestasi
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Alumni ini belum menambahkan prestasi mereka.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Personal Section */}
            {activeSection === "personal" && (
              <div className="space-y-6">                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg">
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Informasi Pribadi</h2>
                </div>{/* Personal Details */}
                <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">                    <CardTitle className="flex items-center gap-2">
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
                          <div>                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
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
                          <div>                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
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
                          <div>                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
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
                          <div>                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                              Agama
                            </label>
                            <p className="text-gray-900 dark:text-white font-medium">{biografi.agama}</p>
                          </div>
                        </div>
                      )}                      {biografi.alamat && (
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
                </Card>{/* Hobbies & Interests */}
                {biografi.hobi && (
                  <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">                      <CardTitle className="flex items-center gap-2">
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
                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-indigo-500" />
                        Catatan Tambahan
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <p className="text-gray-900 dark:text-white leading-relaxed">
                        {biografi.catatan}
                      </p>
                    </CardContent>                  </Card>
                )}
              </div>
            )}            </div>          </div>
        </div>
      </div>
      </div>
      </>
    </ProtectedRoute>
  );
}
