'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { getApiUrl, config } from '@/lib/config'
import { 
  Calendar, 
  Clock,
  User,
  MessageCircle,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Timer,
  ArrowLeft,
  Image as ImageIcon,
  FileText,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react'
import { toast } from 'sonner'
import PelaksanaanFilters, { PelaksanaanFilterRequest } from '@/components/PelaksanaanFilters'

interface Usulan {
  id: number
  judul: string
  rencanaKegiatan: string
  tanggalMulai: string
  tanggalSelesai: string
  durasiUsulan: string
  gambarUrl?: string
  namaPengusul: string
  emailPengusul?: string
  biografiId?: number
  jumlahUpvote: number
  jumlahDownvote: number
  status: string
  createdAt: string
  updatedAt: string
}

interface DokumentasiPelaksanaan {
  id: number
  judul?: string
  deskripsi?: string
  fotoUrl?: string
  namaUploader: string
  emailUploader?: string
  createdAt: string
}

interface KomentarPelaksanaan {
  id: number
  isi: string
  createdAt: string
  user: {
    id: number
    name: string
    email: string
  }
}

interface Pelaksanaan {
  id: number
  usulan?: Usulan // Keep backward compatibility
  status: 'PENDING' | 'SUKSES' | 'GAGAL'
  catatan?: string
  createdAt: string
  updatedAt: string
  dokumentasi?: DokumentasiPelaksanaan[]
  komentar?: KomentarPelaksanaan[]
  // Summary counts from DTO
  dokumentasiCount?: number
  komentarCount?: number
  alumniPesertaCount?: number
  // Flat fields from DTO
  usulanId?: number
  judul?: string
  rencanaKegiatan?: string
  tanggalMulai?: string
  tanggalSelesai?: string
  durasiUsulan?: string
  gambarUrl?: string
  namaPengusul?: string
  emailPengusul?: string
  jumlahUpvote?: number
  jumlahDownvote?: number
  usulanStatus?: string
  usulanCreatedAt?: string
  usulanUpdatedAt?: string
}

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
          icon: Timer,
          text: 'Pending'
        }
      case 'SUKSES':
        return { 
          color: 'bg-green-100 text-green-800 border-green-200', 
          icon: CheckCircle,
          text: 'Sukses'
        }
      case 'GAGAL':
        return { 
          color: 'bg-red-100 text-red-800 border-red-200', 
          icon: XCircle,
          text: 'Gagal'
        }
      default:
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          icon: Timer,
          text: 'Unknown'
        }
    }
  }

  const config = getStatusConfig(status)
  const IconComponent = config.icon

  return (
    <Badge className={`${config.color} flex items-center gap-1`}>
      <IconComponent className="h-3 w-3" />
      {config.text}
    </Badge>
  )
}

// Simple Pagination Component
const SimplePagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  loading = false
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}) => {
  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 0; i < 5; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(totalPages - 1);
      } else if (currentPage >= totalPages - 4) {
        pages.push(0);
        pages.push(-1); // ellipsis
        for (let i = totalPages - 5; i < totalPages; i++) pages.push(i);
      } else {
        pages.push(0);
        pages.push(-1); // ellipsis
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(totalPages - 1);
      }
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(0)}
        disabled={currentPage === 0 || loading}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
        <ChevronLeft className="h-4 w-4 -ml-2" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0 || loading}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1">
        {getVisiblePages().map((page, index) => {
          if (page === -1) {
            return (
              <Button
                key={`ellipsis-${index}`}
                variant="ghost"
                size="sm"
                disabled
                className="h-8 w-8 p-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            );
          }
          
          return (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              {page + 1}
            </Button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1 || loading}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(totalPages - 1)}
        disabled={currentPage === totalPages - 1 || loading}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
        <ChevronRight className="h-4 w-4 -ml-2" />
      </Button>
    </div>
  );
};

export default function PelaksanaanPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [pelaksanaan, setPelaksanaan] = useState<Pelaksanaan[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [viewMode, setViewMode] = useState<string>("grid")
  const [filters, setFilters] = useState<PelaksanaanFilterRequest>({
    page: 0,
    size: 12,
    sortBy: 'createdAt',
    sortDirection: 'desc'
  })
  const fetchPelaksanaan = useCallback(async (currentFilters: PelaksanaanFilterRequest) => {
    try {
      setLoading(true)
      let url = `${getApiUrl('/api/pelaksanaan')}?page=${currentFilters.page}&size=${currentFilters.size}`
      
      // Add search parameters
      if (currentFilters.judul && currentFilters.judul.trim()) {
        url += `&judul=${encodeURIComponent(currentFilters.judul.trim())}`
      }
      if (currentFilters.namaPengusul && currentFilters.namaPengusul.trim()) {
        url += `&namaPengusul=${encodeURIComponent(currentFilters.namaPengusul.trim())}`
      }
      if (currentFilters.status && currentFilters.status !== "all") {
        url += `&status=${currentFilters.status}`
      }
      if (currentFilters.tanggalSelesaiFrom) {
        url += `&tanggalSelesaiFrom=${currentFilters.tanggalSelesaiFrom}`
      }
      if (currentFilters.tanggalSelesaiTo) {
        url += `&tanggalSelesaiTo=${currentFilters.tanggalSelesaiTo}`
      }
      if (currentFilters.sortBy && currentFilters.sortBy !== 'createdAt') {
        url += `&sortBy=${currentFilters.sortBy}`
      }
      if (currentFilters.sortDirection && currentFilters.sortDirection !== 'desc') {
        url += `&sortDirection=${currentFilters.sortDirection}`
      }

      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch pelaksanaan')
      }

      const data = await response.json()
      setPelaksanaan(data.content || [])
      setTotalPages(data.totalPages || 0)
      setTotalElements(data.totalElements || 0)
      setCurrentPage(data.number || 0)
    } catch (error) {
      console.error('Error fetching pelaksanaan:', error)
      toast.error('Gagal memuat data pelaksanaan')
      setPelaksanaan([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPelaksanaan(filters)
  }, [filters, fetchPelaksanaan])

  const handleFilterChange = (newFilters: PelaksanaanFilterRequest) => {
    setFilters(newFilters)
  }

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page }
    setFilters(newFilters)
  }
  // Check if user can edit pelaksanaan (usulan creator or admin)
  const canEditPelaksanaan = (pelaksanaanItem: Pelaksanaan) => {
    if (!user) return false    // Admin can edit all
    if (user.role?.roleName === 'ADMIN') return true
    
    // Usulan creator can edit their own
    // Handle both old format (usulan object) and new format (flat fields)
    const emailPengusul = pelaksanaanItem.usulan?.emailPengusul || pelaksanaanItem.emailPengusul
    
    // Check by email
    if (user.email && emailPengusul) {
      return user.email === emailPengusul
    }
    
    return false
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => router.back()}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Pelaksanaan Kegiatan</h1>
                  <p className="text-muted-foreground">
                    Kelola dan pantau pelaksanaan usulan kegiatan alumni
                  </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>      <div className="container mx-auto px-4 py-6">
        {/* Filters */}
        <PelaksanaanFilters
          onFilterChange={handleFilterChange}
          currentFilters={filters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          pageSize={filters.size}
          onPageSizeChange={(size) => handleFilterChange({ ...filters, size, page: 0 })}
          totalItems={totalElements}
          currentItems={pelaksanaan.length}
        />

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}        {/* Pelaksanaan Grid/List */}
        {!loading && (
          <>
            {pelaksanaan.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Tidak ada pelaksanaan</h3>
                <p className="text-muted-foreground">
                  {(filters.search || filters.status !== "all") 
                    ? 'Tidak ada pelaksanaan yang sesuai dengan filter.'
                    : 'Belum ada usulan yang dipindahkan ke pelaksanaan.'
                  }
                </p>
              </div>            ) : viewMode === "list" ? (
              /* List View */
              <div className="space-y-3">
                {pelaksanaan.map((item) => (
                  <Card 
                    key={item.id} 
                    className="group hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500"
                    onClick={() => router.push(`/pelaksanaan/${item.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Image */}
                        <div className="flex-shrink-0">                          {item.gambarUrl ? (
                            <div className="relative h-16 w-16 rounded-lg overflow-hidden">
                              <Image
                                src={`${config.baseUrl}${item.gambarUrl}`}
                                alt={item.judul || 'Gambar usulan'}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            </div>
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                              <FileText className="h-8 w-8 text-blue-500" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">                              <h3 className="font-semibold text-lg leading-tight text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                                {item.judul || 'Judul tidak tersedia'}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                <User className="h-4 w-4 inline mr-1" />
                                {item.namaPengusul || 'Nama tidak tersedia'}
                              </p>
                            </div>
                            <div className="flex items-start gap-2">
                              <StatusBadge status={item.status} />
                            </div>
                          </div>

                          {/* Details */}
                          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600 dark:text-gray-400">                            {item.tanggalMulai && item.tanggalSelesai && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-blue-500 flex-shrink-0" />
                                <span className="truncate text-xs xs:text-sm">
                                  {formatDate(item.tanggalMulai)} - {formatDate(item.tanggalSelesai)}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-green-500 flex-shrink-0" />
                              <span className="truncate text-xs xs:text-sm">
                                Dipindahkan: {formatDateTime(item.createdAt)}
                              </span>
                            </div>                            {item.dokumentasiCount !== undefined && item.dokumentasiCount > 0 && (
                              <div className="flex items-center gap-2">
                                <ImageIcon className="h-3 w-3 text-purple-500 flex-shrink-0" />
                                <span className="truncate text-xs xs:text-sm">{item.dokumentasiCount} dokumentasi</span>
                              </div>
                            )}
                            {item.komentarCount !== undefined && item.komentarCount > 0 && (
                              <div className="flex items-center gap-2">
                                <MessageCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                                <span className="truncate text-xs xs:text-sm">{item.komentarCount} komentar</span>
                              </div>
                            )}
                          </div>

                          {/* Description */}                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                            {item.rencanaKegiatan || 'Rencana kegiatan tidak tersedia'}
                          </p>

                          {item.catatan && (
                            <div className="text-xs bg-muted p-2 rounded">
                              <strong>Catatan:</strong> {item.catatan}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between pt-2 gap-2">
                            <div className="flex flex-wrap items-center gap-2 xs:gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span className="hidden xs:inline">
                                  {formatDateTime(item.createdAt)}
                                </span>
                                <span className="xs:hidden">
                                  {new Date(item.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                </span>
                              </span>
                            </div>

                            <div className="flex gap-2 w-full xs:w-auto" onClick={(e) => e.stopPropagation()}>
                              {canEditPelaksanaan(item) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/pelaksanaan/${item.id}/edit`)}
                                  className="h-8 px-2 xs:px-3 text-xs w-full xs:w-auto"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  <span className="hidden xs:inline">Edit</span>
                                  <span className="xs:hidden">Edit</span>
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/pelaksanaan/${item.id}`)}
                                className="h-8 px-2 xs:px-3 text-xs w-full xs:w-auto"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                <span className="hidden xs:inline">View Detail</span>
                                <span className="xs:hidden">Detail</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pelaksanaan.map((item) => (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow h-full group">
                    <Link href={`/pelaksanaan/${item.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-2">                          <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {item.judul || 'Judul tidak tersedia'}
                          </CardTitle>
                          <StatusBadge status={item.status} />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          {item.namaPengusul || 'Nama tidak tersedia'}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">                      
                        {/* Usulan Image */}
                        {item.gambarUrl && (
                          <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                            <Image
                              src={`${config.baseUrl}${item.gambarUrl}`}
                              alt={item.judul || 'Gambar usulan'}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          </div>
                        )}                        <div className="space-y-2 flex-1">
                          <p className="text-sm line-clamp-2">
                            {item.rencanaKegiatan || 'Rencana kegiatan tidak tersedia'}
                          </p>

                          {item.tanggalMulai && item.tanggalSelesai && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(item.tanggalMulai)} - {formatDate(item.tanggalSelesai)}
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Dipindahkan: {formatDateTime(item.createdAt)}
                          </div>

                          {item.catatan && (
                            <div className="text-xs bg-muted p-2 rounded">
                              <strong>Catatan:</strong> {item.catatan}
                            </div>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            {item.dokumentasi && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <ImageIcon className="h-4 w-4" />
                                {item.dokumentasi.length}
                              </div>
                            )}
                            {item.komentar && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <MessageCircle className="h-4 w-4" />
                                {item.komentar.length}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Link>
                    
                    {/* Action Buttons - Outside Link */}
                    <CardContent className="pt-0 pb-4">
                      <div className="flex items-center gap-2 w-full">
                        {canEditPelaksanaan(item) && (
                          <Link href={`/pelaksanaan/${item.id}/edit`} className="flex-1">
                            <Button size="sm" variant="outline" className="w-full">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </Link>
                        )}
                        <Link href={`/pelaksanaan/${item.id}`} className="flex-1">
                          <Button size="sm" variant="default" className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            Detail
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <SimplePagination 
                  currentPage={currentPage} 
                  totalPages={totalPages} 
                  onPageChange={handlePageChange} 
                  loading={loading} 
                />
              </div>
            )}
          </>
        )}</div>
      </div>
    </ProtectedRoute>
  )
}
