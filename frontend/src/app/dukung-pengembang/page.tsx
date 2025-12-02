'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Heart, Users, TrendingUp, Gift, Star, Award, Phone, RefreshCw, CheckCircle, Calendar, CreditCard, Code, Coffee } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/config';

interface DonationStats {
  totalAmount: number;
  totalDonors: number;
}

interface TopDonor {
  donorName: string;
  amount: number;
}

interface Donation {
  id: string;
  donorName: string;
  amount: number;
  status: string;
  date: string;
}

export default function DukungPengembangPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DonationStats>({ totalAmount: 0, totalDonors: 0 });
  const [topDonors, setTopDonors] = useState<TopDonor[]>([]);
  const [allDonations, setAllDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDonationData();
  }, []);

  const fetchDonationData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch donation stats
      const statsResponse = await fetch(getApiUrl('/donations/stats'));
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats({
          totalAmount: statsData.totalAmount || 0,
          totalDonors: statsData.totalDonors || 0
        });
      } else {
        throw new Error('Failed to fetch donation stats');
      }

      // Fetch top individual donations (limit to 5)
      const donorsResponse = await fetch(getApiUrl('/donations/top-individual-donations?limit=5'));
      if (donorsResponse.ok) {
        const donorsData = await donorsResponse.json();
        setTopDonors(Array.isArray(donorsData) ? donorsData : []);
      } else {
        throw new Error('Failed to fetch top individual donations');
      }

      // Fetch successful donations (limit to 9 latest)
      const allDonationsResponse = await fetch('/api/donations/successful?sort=date&order=desc&limit=9');
      if (allDonationsResponse.ok) {
        const allDonationsData = await allDonationsResponse.json();
        const donations = Array.isArray(allDonationsData) ? allDonationsData.slice(0, 9) : [];
        setAllDonations(donations);
      } else {
        throw new Error('Failed to fetch successful donations');
      }
    } catch (error) {
      console.error('Error fetching donation data:', error);
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDonationData(true);
  };

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return 'Rp 0';
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDonateClick = () => {
    router.push('/donasi');
  };

  const handleSupportClick = async (amount: number) => {
    router.push('/donasi');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-background">
        {/* Hero Section Skeleton */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-800">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <Skeleton className="h-20 w-20 rounded-full bg-white/20 dark:bg-gray-700/50" />
              </div>
              <Skeleton className="h-16 w-96 mx-auto mb-6 bg-white/20 dark:bg-gray-700/50" />
              <Skeleton className="h-8 w-[600px] mx-auto mb-8 bg-white/20 dark:bg-gray-700/50" />
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Skeleton className="h-14 w-48 bg-white/20 dark:bg-gray-700/50" />
                <Skeleton className="h-14 w-40 bg-white/20 dark:bg-gray-700/50" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {[1, 2].map((i) => (
              <Card key={i} className="border-0 shadow-lg dark:bg-gray-800">
                <CardHeader className="text-center">
                  <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4 dark:bg-gray-700" />
                  <Skeleton className="h-8 w-32 mx-auto dark:bg-gray-700" />
                </CardHeader>
                <CardContent className="text-center">
                  <Skeleton className="h-10 w-40 mx-auto mb-2 dark:bg-gray-700" />
                  <Skeleton className="h-4 w-48 mx-auto dark:bg-gray-700" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-800 dark:from-purple-700 dark:via-blue-700 dark:to-indigo-900">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="text-center">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="p-3 sm:p-4 bg-white/10 rounded-full backdrop-blur-sm border border-white/30 shadow-xl">
                <Coffee className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-white animate-pulse" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
              Dukung <span className="text-yellow-300">Pengembang</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
              Support pengembangan aplikasi alumni profesional dan berkelanjutan
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <Button 
                onClick={handleDonateClick}
                size="lg" 
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <Coffee className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Dukung Sekarang
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-white/80 text-white hover:bg-white/10 hover:border-white hover:text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg backdrop-blur-md bg-white/5 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 font-semibold"
                onClick={() => router.push('/biografi')}
              >
                <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Lihat Alumni
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
            <AlertDescription className="text-red-800 dark:text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
            Dampak Dukungan Anda
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
            Setiap kontribusi Anda membantu pengembangan aplikasi yang lebih baik dan berkelanjutan
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16">
          <Card className="border shadow-lg bg-card dark:bg-card hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardHeader className="text-center pb-3 sm:pb-4">
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-3 sm:p-4 rounded-full shadow-lg">
                  <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
              </div>
              <CardTitle className="text-xl sm:text-2xl text-emerald-700 dark:text-emerald-400 font-bold">Total Dukungan</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-800 dark:text-emerald-300 mb-2">
                {loading ? 'Loading...' : formatCurrency(stats.totalAmount)}
              </p>
              <p className="text-sm sm:text-base text-emerald-600 dark:text-emerald-400 font-medium">Terkumpul dari para alumni</p>
              <div className="mt-3 sm:mt-4 flex items-center justify-center text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Terverifikasi
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-lg bg-card dark:bg-card hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardHeader className="text-center pb-3 sm:pb-4">
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 sm:p-4 rounded-full shadow-lg">
                  <Users className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
              </div>
              <CardTitle className="text-xl sm:text-2xl text-blue-700 dark:text-blue-400 font-bold">Total Pendukung</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-800 dark:text-blue-300 mb-2">
                {loading ? 'Loading...' : stats.totalDonors.toLocaleString()}
              </p>
              <p className="text-sm sm:text-base text-blue-600 dark:text-blue-400 font-medium">Alumni yang telah mendukung</p>
              <div className="mt-3 sm:mt-4 flex items-center justify-center text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Kontributor aktif
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Development Support Section */}
        <Card className="border shadow-lg bg-card dark:bg-card mb-12 sm:mb-16">
          <CardHeader className="text-center pb-4 sm:pb-6">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <Code className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-800 dark:text-purple-300 mb-3 sm:mb-4 px-4">
              Dukung Pengembangan Aplikasi Alumni
            </CardTitle>
            <CardDescription className="text-sm sm:text-base lg:text-lg text-purple-700 dark:text-purple-400 max-w-4xl mx-auto px-4">
              Aplikasi ini dikembangkan secara profesional dengan teknologi modern untuk memfasilitasi 
              komunikasi dan kolaborasi antar alumni. Aplikasi ini sepenuhnya gratis dan 
              dikembangkan dengan standar industri untuk memberikan pengalaman terbaik.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <Star className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 mx-auto mb-2 sm:mb-3" />
                <h3 className="font-semibold text-sm sm:text-base text-gray-800 dark:text-gray-200 mb-2">Teknologi Modern</h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                  Dibangun dengan React, Next.js, Spring Boot, dan teknologi terkini
                </p>
              </div>
              <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <Award className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mx-auto mb-2 sm:mb-3" />
                <h3 className="font-semibold text-sm sm:text-base text-gray-800 dark:text-gray-200 mb-2">Kualitas Professional</h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                  Dikembangkan dengan standar industri dan best practices
                </p>
              </div>
              <div className="p-4 sm:p-6 bg-muted dark:bg-muted rounded-lg shadow-sm">
                <Gift className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mx-auto mb-2 sm:mb-3" />
                <h3 className="font-semibold text-sm sm:text-base text-gray-800 dark:text-gray-200 mb-2">Sepenuhnya Gratis</h3>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Tidak ada biaya berlangganan atau biaya tersembunyi
                </p>
              </div>
            </div>
            
            <div className="bg-muted dark:bg-muted p-4 sm:p-6 rounded-lg shadow-sm mb-6 sm:mb-8">
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
                Dukungan Anda akan membantu kami untuk:
              </p>
              <ul className="text-left text-xs sm:text-sm text-gray-600 dark:text-gray-300 space-y-2 max-w-2xl mx-auto">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Maintenance server dan infrastruktur
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Pengembangan fitur-fitur baru
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Peningkatan keamanan dan performa
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Support teknis berkelanjutan
                </li>
              </ul>
            </div>
            
            {/* Developer Communication Section */}
            <Card className="mb-6 sm:mb-8 shadow-lg border bg-card dark:bg-card">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl flex items-center font-bold">
                  <Heart className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                  💬 Komunikasi Langsung dengan Developer
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Dukungan Anda akan langsung dibaca oleh pengembang aplikasi dan saran, request, 
                    serta masukan Anda akan langsung ditanggapi untuk pengembangan yang lebih baik.
                  </p>
                  <div className="bg-muted dark:bg-muted p-3 sm:p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-white text-xs font-bold">✨</span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">
                        Setiap dukungan disertai dengan pesan langsung kepada developer untuk feedback dan saran pengembangan aplikasi
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Application Development Section */}
            <Card className="mb-6 sm:mb-8 shadow-2xl border bg-card dark:bg-card overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white rounded-t-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl xl:text-3xl flex items-center font-bold">
                    <div className="p-1.5 sm:p-2 bg-white/20 rounded-full mr-3 sm:mr-4 backdrop-blur-sm">
                      <svg className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    Tertarik Membuat Aplikasi?
                  </CardTitle>
                  <CardDescription className="text-emerald-100 dark:text-emerald-200 text-sm sm:text-base lg:text-lg mt-2">
                    Hubungi developer untuk konsultasi dan pembuatan aplikasi custom
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="space-y-6 sm:space-y-8">
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
                      <svg className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto px-4">
                      Apabila Anda berminat untuk membuat aplikasi serupa atau custom, 
                      silakan hubungi developer profesional dengan pengalaman bertahun-tahun
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                            <Phone className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                              <span className="text-lg sm:text-2xl">💬</span>
                              <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm sm:text-base lg:text-lg">WhatsApp</p>
                            </div>
                            <p className="text-emerald-700 dark:text-emerald-400 font-mono text-sm sm:text-base font-semibold tracking-wide break-all">085600121760</p>
                            <p className="text-emerald-600 dark:text-emerald-500 text-xs sm:text-sm mt-1">Respon cepat & profesional</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                            <svg className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                              <span className="text-lg sm:text-2xl">🌐</span>
                              <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm sm:text-base lg:text-lg">Portfolio</p>
                            </div>
                            <a 
                              href="https://mdarmawanf.my.id/" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 font-semibold text-sm sm:text-base underline decoration-2 underline-offset-2 transition-colors break-all"
                            >
                              mdarmawanf.my.id
                            </a>
                            <p className="text-emerald-600 dark:text-emerald-500 text-xs sm:text-sm mt-1">Lihat project & testimoni</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-950/50 dark:to-green-950/50 rounded-xl p-4 sm:p-6 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                        <svg className="h-3 w-3 sm:h-5 sm:w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm sm:text-base text-emerald-800 dark:text-emerald-300 mb-2">Layanan Profesional</h4>
                        <p className="text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm leading-relaxed">
                          ✨ Konsultasi gratis • 🚀 Development modern • 📱 Responsive design • 🔒 Security terjamin • 🎯 Custom sesuai kebutuhan
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={handleDonateClick}
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg shadow-lg"
            >
              <Coffee className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Mulai Mendukung
            </Button>
          </CardContent>
        </Card>

        {/* Top Supporters Section */}
        <Card className="mb-12 sm:mb-16 shadow-2xl border bg-card dark:bg-card">
            <CardHeader className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 text-white rounded-t-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl xl:text-3xl flex items-center font-bold">
                  <Award className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
                  🏆 Top Pendukung Pengembangan
                </CardTitle>
                <CardDescription className="text-purple-100 dark:text-purple-200 text-sm sm:text-base lg:text-lg mt-2">
                  Dukungan dari alumni yang sangat membantu pengembangan aplikasi ini
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-8">
              {topDonors.length > 0 ? (
                <div className="space-y-4 md:space-y-6">
                  {topDonors.map((donor, index) => {
                  const isTop3 = index < 3;
                  const rankColors = [
                    'from-yellow-400 to-yellow-600', // Gold
                    'from-gray-300 to-gray-500',     // Silver
                    'from-orange-400 to-orange-600'  // Bronze
                  ];
                  const bgColors = [
                    'bg-yellow-50 dark:bg-yellow-950/30',
                    'bg-gray-50 dark:bg-gray-950/30',
                    'bg-orange-50 dark:bg-orange-950/30'
                  ];
                  const borderColors = [
                    'border-yellow-200 dark:border-yellow-800',
                    'border-gray-200 dark:border-gray-800',
                    'border-orange-200 dark:border-orange-800'
                  ];
                  
                  return (
                    <Card 
                      key={index} 
                      className={`transition-all duration-300 hover:shadow-xl transform hover:scale-[1.02] ${
                        isTop3 
                          ? `${bgColors[index]} ${borderColors[index]} shadow-lg` 
                          : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700'
                      }`}
                    >
                      <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center space-x-3 md:space-x-4">
                            <div className="flex-shrink-0 relative">
                              {isTop3 ? (
                                <div className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-r ${rankColors[index]} rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800`}>
                                  <Star className="h-5 w-5 md:h-7 md:w-7 text-white" />
                                </div>
                              ) : (
                                <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800">
                                  <span className="text-white font-bold text-base md:text-lg">{index + 1}</span>
                                </div>
                              )}
                              {index === 0 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-bold text-yellow-900">👑</span>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-lg md:text-xl text-foreground truncate">{donor.donorName}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <Badge 
                                  variant={isTop3 ? "default" : "secondary"} 
                                  className={`text-xs ${isTop3 ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : ""}`}
                                >
                                  Pendukung #{index + 1}
                                </Badge>
                                {isTop3 && (
                                  <Badge variant="outline" className="border-yellow-400 text-yellow-700 dark:text-yellow-300 text-xs hidden sm:inline-flex">
                                    ⭐ Top Supporter
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className={`font-bold text-xl md:text-2xl ${
                              isTop3 
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent' 
                                : 'text-blue-600 dark:text-blue-400'
                            }`}>
                              {formatCurrency(donor.amount)}
                            </p>
                            <div className="flex items-center justify-start sm:justify-end mt-2 text-xs md:text-sm text-muted-foreground">
                              <Heart className="h-3 w-3 md:h-4 md:w-4 mr-1 text-red-500" />
                              <span className="hidden sm:inline">Dukungan Luar Biasa</span>
                              <span className="sm:hidden">Dukungan</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 md:py-16">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Award className="h-10 w-10 md:h-12 md:w-12 text-purple-500 dark:text-purple-400" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">Belum ada data pendukung</h3>
                <p className="text-muted-foreground mb-6">Jadilah yang pertama untuk berkontribusi!</p>
                <Button 
                  onClick={handleDonateClick}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                >
                  <Coffee className="mr-2 h-4 w-4" />
                  Mulai Mendukung
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Support Transactions Section */}
        <Card className="mb-12 sm:mb-16 shadow-2xl border bg-card dark:bg-card">
          <CardHeader className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 text-white rounded-t-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <CardTitle className="text-lg sm:text-xl lg:text-2xl xl:text-3xl flex items-center font-bold">
                <Coffee className="mr-2 sm:mr-3 h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
                💝 Semua Pendukung Pengembangan Aplikasi
              </CardTitle>
              <CardDescription className="text-blue-100 dark:text-blue-200 text-sm sm:text-base lg:text-lg mt-2">
                Daftar lengkap dukungan yang telah berhasil diproses dan terverifikasi
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 lg:p-8">
            {allDonations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allDonations.map((donation, index) => (
                  <div 
                    key={donation.id} 
                    className="group p-6 bg-card dark:bg-card rounded-xl border-2 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline" className="border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50">
                        <CreditCard className="h-3 w-3 mr-1" />
                        #{donation.id}
                      </Badge>
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {donation.status}
                      </Badge>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-2 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">
                        {donation.donorName}
                      </h4>
                      <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent mb-3">
                        {formatCurrency(donation.amount)}
                      </p>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 bg-muted dark:bg-muted rounded-lg p-3">
                       <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                       <span className="font-medium">
                         {new Date(donation.date).toLocaleDateString('id-ID', {
                           year: 'numeric',
                           month: 'long',
                           day: 'numeric',
                           hour: '2-digit',
                           minute: '2-digit'
                         })}
                       </span>
                     </div>
                     
                     <div className="mt-4 flex items-center justify-center text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 rounded-lg py-2">
                       <Heart className="h-3 w-3 mr-1" />
                       Terima kasih atas dukungannya
                     </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Coffee className="h-12 w-12 text-blue-500 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Belum ada dukungan yang berhasil</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Jadilah yang pertama untuk berkontribusi!</p>
                <Button 
                  onClick={handleDonateClick}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
                >
                  <Coffee className="mr-2 h-4 w-4" />
                  Mulai Mendukung
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Refund Information Section */}
        <Card className="shadow-2xl border bg-card dark:bg-card">
          <CardHeader className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 text-white rounded-t-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <CardTitle className="text-3xl flex items-center font-bold">
                <Phone className="mr-3 h-8 w-8" />
                📞 Informasi Bantuan & Refund
              </CardTitle>
              <CardDescription className="text-orange-100 dark:text-orange-200 text-lg mt-2">
                Tim support kami siap membantu Anda 24/7 untuk segala kebutuhan dukungan
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="group p-6 bg-muted dark:bg-muted rounded-xl border-2 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-full shadow-lg">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">Email Support</h3>
                    <p className="text-blue-600 dark:text-blue-400 font-medium">Respon dalam 2-4 jam</p>
                  </div>
                </div>
                <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4">
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">muhammaddarmawanfadillah@gmail.com</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Untuk pertanyaan umum dan bantuan teknis</p>
                </div>
              </div>
              
              <div className="group p-6 bg-muted dark:bg-muted rounded-xl border-2 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-full shadow-lg">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">WhatsApp Support</h3>
                    <p className="text-green-600 dark:text-green-400 font-medium">Respon instan</p>
                  </div>
                </div>
                <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4">
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">085600121760</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Chat langsung dengan tim support</p>
                </div>
              </div>
            </div>
            
            <Separator className="my-8" />
            
            <div className="bg-muted dark:bg-muted p-6 rounded-xl border-2 border-orange-200 dark:border-orange-800">
              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-full shadow-lg flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-3">🔄 Kebijakan Refund</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <p className="text-gray-700 dark:text-gray-300"><strong>Batas waktu:</strong> Maksimal 30 hari setelah dukungan</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <p className="text-gray-700 dark:text-gray-300"><strong>Syarat refund:</strong> Menyertakan alasan yang valid</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <p className="text-gray-700 dark:text-gray-300"><strong>Proses refund:</strong> Akan dikembalikan dalam 7 hari</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <p className="text-gray-700 dark:text-gray-300"><strong>Kondisi:</strong> Dukungan belum digunakan untuk pengembangan platform</p>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-background dark:bg-background rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-sm text-orange-800 dark:text-orange-300 font-medium">
                      💡 <strong>Tips:</strong> Hubungi tim support kami di 085600121760 untuk bantuan pengembalian dukungan
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Footer Section */}
        <div className="mt-16 text-center py-12 bg-muted dark:bg-muted rounded-xl">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full shadow-lg">
                <Heart className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Terima Kasih atas Dukungan Anda! 🙏
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              Setiap kontribusi yang Anda berikan membantu pengembangan aplikasi yang lebih baik dan berkelanjutan. 
              Bersama-sama, kita dapat menciptakan platform yang bermanfaat untuk semua alumni.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                onClick={handleDonateClick}
              >
                <Coffee className="mr-2 h-5 w-5" />
                Mulai Mendukung Sekarang
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => router.push('/biografi')}
              >
                <Users className="mr-2 h-5 w-5" />
                Lihat Komunitas Member
              </Button>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                © 2025 Platform Cemoca. Dibangun dengan teknologi terkini dan kualitas terbaik demi kenyamanan pengguna.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}