"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  User, 
  Calendar, 
  MapPin, 
  GraduationCap, 
  Briefcase,
  Eye,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Building,
  Award,
  Phone,
  Mail,
  Users
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { biografiAPI, BiografiFilterRequest, PagedResponse, imageAPI, wilayahAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast-simple";
import BiografiFilters from "@/components/BiografiFilters";

interface BiografiDisplay {
  biografiId: number;
  namaLengkap: string;
  nim: string;
  email: string;
  nomorHp?: string;
  jurusan?: string;
  tanggalLulus?: string;
  latestWorkExperience?: {
    posisi: string;
    perusahaan: string;
    tanggalMulai?: string;
    tanggalSelesai?: string;
  };
  kota?: string;
  fotoProfil?: string;
  alumniTahun?: string;
  programStudi?: string;
  status: "aktif" | "tidak_aktif" | "draft";
}

// Custom Pagination Component
const SimplePagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void; 
}) => {
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {getVisiblePages().map((page, index) => (
        <Button
          key={index}
          variant={page === currentPage + 1 ? "default" : "outline"}
          size="sm"
          onClick={() => typeof page === 'number' ? onPageChange(page - 1) : undefined}
          disabled={typeof page !== 'number'}
          className="h-8 w-8 p-0"
        >
          {typeof page === 'number' ? page : <MoreHorizontal className="h-3 w-3" />}
        </Button>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default function BiografiPage() {  const [biografi, setBiografi] = useState<BiografiDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState<string>("grid");  const [filters, setFilters] = useState<BiografiFilterRequest>({
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    sortDirection: 'desc',
    status: 'AKTIF' // Only show active biografi for end users
  });
  
  const { toast } = useToast();
  const router = useRouter();  const fetchBiografi = useCallback(async (currentFilters: BiografiFilterRequest, isFilterChange = false) => {
    if (isFilterChange) {
      setFilterLoading(true);
    } else {
      setLoading(true);
    }
    
    // Add timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
      setFilterLoading(false);
      console.warn('Biografi loading timeout - resetting state');
      toast({
        title: "Loading Timeout",
        description: "Gagal memuat data biografi. Backend mungkin tidak tersedia.",
        variant: "destructive",
      });
    }, 10000); // 10 second timeout
    
    try {      
      console.log('=== PUBLIC BIOGRAFI FILTER DEBUG ===');
      console.log('Filters being sent to backend:', JSON.stringify(currentFilters, null, 2));
      
      const response = await biografiAPI.getBiografiWithFilters(currentFilters);
      
      console.log('Backend response summary:', {
        totalElements: response.totalElements,
        returnedRecords: response.content.length,
        currentPage: response.page,
        pageSize: response.size
      });
      console.log('=== END DEBUG ===');
        // Convert backend format to frontend format
      const convertedBiografi: BiografiDisplay[] = response.content.map((item: any) => {
        // Get the latest work experience (most recent by end date, or if no end date, the last entry)
        let latestWorkExperience = undefined;
        if (item.workExperiences && item.workExperiences.length > 0) {
          const sortedExperiences = [...item.workExperiences].sort((a, b) => {
            // If both have end dates, sort by end date descending
            if (a.tanggalSelesai && b.tanggalSelesai) {
              return new Date(b.tanggalSelesai).getTime() - new Date(a.tanggalSelesai).getTime();
            }
            // If only one has an end date, the one without end date (current job) comes first
            if (!a.tanggalSelesai && b.tanggalSelesai) return -1;
            if (a.tanggalSelesai && !b.tanggalSelesai) return 1;
            // If neither has end date, sort by start date descending
            if (a.tanggalMulai && b.tanggalMulai) {
              return new Date(b.tanggalMulai).getTime() - new Date(a.tanggalMulai).getTime();
            }
            return 0;
          });
          
          latestWorkExperience = {
            posisi: sortedExperiences[0].posisi,
            perusahaan: sortedExperiences[0].perusahaan,
            tanggalMulai: sortedExperiences[0].tanggalMulai,
            tanggalSelesai: sortedExperiences[0].tanggalSelesai
          };
        }        return {
          biografiId: item.biografiId || item.id,
          namaLengkap: item.namaLengkap,
          nim: item.nim,
          email: item.email,
          nomorHp: item.nomorHp || item.nomorTelepon,
          jurusan: item.jurusan || item.programStudi,
          tanggalLulus: item.tanggalLulus,
          latestWorkExperience,
          kota: item.kota, // Will be converted later
          fotoProfil: item.fotoProfil || item.foto,
          alumniTahun: item.alumniTahun,
          programStudi: item.programStudi,
          status: item.status?.toLowerCase() as "aktif" | "tidak_aktif" | "draft",
        };
      });

      // Convert location codes to readable names
      const biografiWithLocations = await Promise.all(
        convertedBiografi.map(async (bio) => {
          if (bio.kota) {
            try {
              const kotaNama = await wilayahAPI.convertCodeToName(bio.kota);
              return { ...bio, kota: kotaNama };
            } catch (error) {
              console.error(`Error converting kota code ${bio.kota}:`, error);
              return bio; // Keep original code if conversion fails
            }
          }
          return bio;
        })
      );

      setBiografi(biografiWithLocations || []); 
      setTotalPages(response.totalPages || 0);
      setTotalItems(response.totalElements || 0);
      
      // Clear timeout on successful load
      clearTimeout(loadingTimeout);
      
    } catch (error) {
      console.error("Error fetching biografi:", error);
      // Set empty state on error to prevent infinite loading
      setBiografi([]);
      setTotalPages(0);
      setTotalItems(0);
      
      toast({
        title: "Error",
        description: "Gagal memuat data biografi. Backend mungkin tidak tersedia.",
        variant: "destructive",
      });
      
      // Clear timeout on error
      clearTimeout(loadingTimeout);
    } finally {
      setLoading(false);
      setFilterLoading(false);
    }
  }, [toast]);
  useEffect(() => {
    fetchBiografi(filters);
  }, [filters, fetchBiografi]);
  const handleFilterChange = (newFilters: BiografiFilterRequest) => {
    setFilters(newFilters);
    // Indicate this is a filter change for loading state
    fetchBiografi(newFilters, true);
  };

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // Trigger search through filter component
      e.preventDefault();
    }
  };

  const handleView = (biografiId: number) => {
    router.push(`/biografi/${biografiId}`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
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
  if (loading && filters.page === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading alumni biografi...</p>
          <p className="mt-2 text-sm text-gray-500">Jika loading terlalu lama, backend mungkin belum aktif</p>
        </div>
      </div>
    );
  }  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-2 xs:px-4 py-6 max-w-7xl overflow-hidden">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 xs:gap-3">
              <Users className="h-6 w-6 xs:h-8 xs:w-8 text-blue-600 flex-shrink-0" />
              <h1 className="text-xl xs:text-3xl font-bold text-gray-900 dark:text-white truncate">
                <span className="hidden sm:inline">Biografi Alumni</span>
                <span className="sm:hidden">Alumni</span>
              </h1>
            </div>
          </div>
        {/* Filter Loading Overlay */}
        {filterLoading && (
          <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-30 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium">Memfilter data biografi...</span>
            </div>
          </div>
        )}        {/* Search and Filters */}
        <div className="mb-6">
          <BiografiFilters
            onFilterChange={handleFilterChange}
            currentFilters={filters}
            viewMode={viewMode}
            onViewModeChange={(mode) => setViewMode(mode)}
            pageSize={filters.size || 10}
            onPageSizeChange={(size) => {
              const newFilters = { ...filters, size, page: 0 };
              setFilters(newFilters);
            }}
            totalItems={totalItems}
            currentItems={biografi.length}
          />
        </div>{/* Alumni Display */}
        {biografi.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Tidak Ada Data Biografi
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {(filters.nama || filters.nim || filters.email || filters.jurusan || filters.programStudi || filters.spesialisasi || filters.kota)
              ? 'Coba sesuaikan kriteria pencarian atau filter Anda'
              : 'Backend server mungkin belum aktif atau tidak ada data biografi tersedia'}
          </p>
          {!(filters.nama || filters.nim || filters.email || filters.jurusan || filters.programStudi || filters.spesialisasi || filters.kota) && (
            <div className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg max-w-md mx-auto">
              <p>Pastikan backend server berjalan di http://localhost:8181</p>
              <p className="mt-1">Atau coba refresh halaman setelah beberapa saat</p>
            </div>
          )}
        </div>
      ) : viewMode === "list" ? (
        /* List View */
        <div className="space-y-3">
          {biografi.map((alumni) => (
            <Card 
              key={alumni.biografiId} 
              className="group hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500"
              onClick={() => handleView(alumni.biografiId)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Profile Photo */}
                  <div className="flex-shrink-0">
                    {alumni.fotoProfil ? (
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden">
                        <Image
                          src={imageAPI.getImageUrl(alumni.fotoProfil)}
                          alt={alumni.namaLengkap}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                        <User className="h-8 w-8 text-blue-500" />
                      </div>
                    )}
                  </div>

                  {/* Alumni Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg leading-tight text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {alumni.namaLengkap}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {alumni.nim} • {alumni.jurusan}
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                          {alumni.alumniTahun || new Date(alumni.tanggalLulus || '').getFullYear() || 'N/A'}
                        </Badge>
                      </div>
                    </div>                    {/* Alumni Details */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600 dark:text-gray-400">
                      {alumni.latestWorkExperience?.posisi && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span className="truncate text-xs xs:text-sm">{alumni.latestWorkExperience.posisi}</span>
                        </div>
                      )}
                      {alumni.latestWorkExperience?.perusahaan && (
                        <div className="flex items-center gap-2">
                          <Building className="h-3 w-3 text-purple-500 flex-shrink-0" />
                          <span className="truncate text-xs xs:text-sm">{alumni.latestWorkExperience.perusahaan}</span>
                        </div>
                      )}                      {alumni.kota && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-red-500 flex-shrink-0" />
                          <span className="truncate text-xs xs:text-sm">{alumni.kota}</span>
                        </div>
                      )}
                      {alumni.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-blue-500 flex-shrink-0" />
                          <span className="truncate text-xs xs:text-sm">{alumni.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between pt-2 gap-2">
                      <div className="flex flex-wrap items-center gap-2 xs:gap-4 text-xs text-gray-500">
                        {alumni.tanggalLulus && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span className="hidden xs:inline">
                              {new Date(alumni.tanggalLulus).toLocaleDateString("id-ID", {
                                year: "numeric",
                                month: "short"
                              })}
                            </span>
                            <span className="xs:hidden">
                              {new Date(alumni.tanggalLulus).getFullYear()}
                            </span>
                          </span>
                        )}
                        {alumni.nomorHp && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span className="hidden xs:inline">Available</span>
                            <span className="xs:hidden">📞</span>
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 w-full xs:w-auto" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(alumni.biografiId)}
                          className="h-8 px-2 xs:px-3 text-xs w-full xs:w-auto"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          <span className="hidden xs:inline">View Profile</span>
                          <span className="xs:hidden">View</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {biografi.map((alumni) => (
            <Card 
              key={alumni.biografiId} 
              className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
              onClick={() => handleView(alumni.biografiId)}
            >
              <CardContent className="p-0">
                {/* Profile Photo */}
                <div className="relative h-48 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900">
                  {alumni.fotoProfil ? (
                    <Image
                      src={imageAPI.getImageUrl(alumni.fotoProfil)}
                      alt={alumni.namaLengkap}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <User className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-white/90 text-gray-700">
                      {alumni.alumniTahun || new Date(alumni.tanggalLulus || '').getFullYear() || 'N/A'}
                    </Badge>
                  </div>
                </div>

                {/* Alumni Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg leading-tight text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {alumni.namaLengkap}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {alumni.nim}
                    </p>
                  </div>                  <div className="space-y-2">
                    {alumni.jurusan && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <GraduationCap className="h-4 w-4 text-blue-500" />
                        <span className="truncate">{alumni.jurusan}</span>
                      </div>
                    )}

                    {alumni.latestWorkExperience?.posisi && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Briefcase className="h-4 w-4 text-green-500" />
                        <span className="truncate">{alumni.latestWorkExperience.posisi}</span>
                      </div>
                    )}

                    {alumni.latestWorkExperience?.perusahaan && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Building className="h-4 w-4 text-purple-500" />
                        <span className="truncate">{alumni.latestWorkExperience.perusahaan}</span>
                      </div>
                    )}

                    {alumni.kota && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="h-4 w-4 text-red-500" />
                        <span className="truncate">{alumni.kota}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(alumni.biografiId)}
                      className="w-full h-8 text-xs group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-600 transition-colors"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}      {/* Pagination */}      
      <SimplePagination
        currentPage={filters.page || 0}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
        </div>
      </div>
    </ProtectedRoute>
  );
}
