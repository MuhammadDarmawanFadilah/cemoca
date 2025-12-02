'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { ThemeToggle } from '@/components/theme-toggle'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Settings,
  Calendar,
  User,
  Tag,
  Globe,
  FileText,
  Clock,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'
import { beritaAPI, Berita, getKategoriDisplay, formatBeritaDate } from '@/lib/api'
import { AdminPageHeader } from '@/components/AdminPageHeader'
import { SortableHeader } from '@/components/ui/sortable-header'
import { ServerPagination } from '@/components/ServerPagination'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import AdminFilters from '@/components/AdminFilters'

export default function AdminBeritaPage() {
  const router = useRouter()
  const [beritaList, setBeritaList] = useState<Berita[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [kategoriFilter, setKategoriFilter] = useState<string>('ALL')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedBerita, setSelectedBerita] = useState<Berita | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [sortBy, setSortBy] = useState('tanggalDibuat')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const statusOptions = [
    { value: 'ALL', label: 'Semua Status', color: 'bg-gray-500' },
    { value: 'DRAFT', label: 'Draft', color: 'bg-gray-500' },
    { value: 'PUBLISHED', label: 'Dipublikasi', color: 'bg-green-500' },
    { value: 'ARCHIVED', label: 'Diarsipkan', color: 'bg-orange-500' }
  ]

  const kategoriOptions = [
    { value: 'ALL', label: 'Semua Kategori' },
    { value: 'UMUM', label: 'Umum' },
    { value: 'AKADEMIK', label: 'Akademik' },
    { value: 'KARIR', label: 'Karir' },
    { value: 'ALUMNI', label: 'Alumni' },
    { value: 'TEKNOLOGI', label: 'Teknologi' },
    { value: 'OLAHRAGA', label: 'Olahraga' },
    { value: 'KEGIATAN', label: 'Kegiatan' }
  ]
  useEffect(() => {
    fetchBerita()
  }, [currentPage, pageSize, statusFilter, kategoriFilter, sortBy, sortDir])

  const fetchBerita = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        size: pageSize,
        sortBy,
        sortDir,
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(kategoriFilter !== 'ALL' && { kategori: kategoriFilter }),
        ...(searchTerm && { search: searchTerm })
      }
      const response = await beritaAPI.getAllBerita(params)
      setBeritaList(response.content)
      setTotalPages(response.totalPages)
      setTotalElements(response.totalElements)
    } catch (error) {
      console.error('Error fetching berita:', error)
      toast.error('Gagal memuat data berita')
    } finally {
      setLoading(false)
    }
  }
  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(0) // Reset to first page on search
      fetchBerita()
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handleDelete = async (id: number) => {
    try {
      await beritaAPI.deleteBerita(id)
      toast.success('Berita berhasil dihapus')
      setDeleteDialogOpen(false)
      setSelectedBerita(null)
      // Refresh data
      fetchBerita()
    } catch (error) {
      console.error('Error deleting berita:', error)
      toast.error('Gagal menghapus berita')
    }
  }

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status)
    return (
      <Badge variant="secondary" className={`${option?.color || 'bg-gray-500'} text-white`}>
        {option?.label || status}
      </Badge>
    )  }
  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('ALL')
    setKategoriFilter('ALL')
    setCurrentPage(0)
    setSortBy('tanggalDibuat')
    setSortDir('desc')
  }

  const handleSort = (newSortBy: string, newSortDir: 'asc' | 'desc') => {
    setSortBy(newSortBy)
    setSortDir(newSortDir)
    setCurrentPage(0) // Reset to first page when sorting
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(0) // Reset to first page when changing page size
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  return (
    <div className="min-h-screen bg-background">
      <AdminPageHeader
        title="Management Berita"
        description="Kelola konten berita dan artikel"
        icon={FileText}
        primaryAction={{
          label: "Tambah Berita",
          onClick: () => router.push("/admin/berita/tambah"),
          icon: Plus
        }}
        stats={[
          {
            label: "Total Berita",
            value: totalElements,
            variant: "secondary"
          },
          {
            label: "Dipublikasi",
            value: beritaList.filter(b => b.status === 'PUBLISHED').length,
            variant: "default"
          },
          {
            label: "Draft",
            value: beritaList.filter(b => b.status === 'DRAFT').length,
            variant: "outline"
          }
        ]}
      />      <div className="container mx-auto p-6 space-y-6">
        {/* Pencarian dan Filter */}
        <AdminFilters
          searchPlaceholder="Cari berita..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={[
            {
              label: "Status",
              value: statusFilter,
              options: statusOptions.map(status => ({
                value: status.value,
                label: status.label,
                color: status.color,
              })),
              onChange: setStatusFilter,
            },
            {
              label: "Kategori",
              value: kategoriFilter,
              options: kategoriOptions,
              onChange: setKategoriFilter,
            },
          ]}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          totalItems={totalElements}
          currentItems={beritaList.length}
          onClearFilters={handleClearFilters}
          activeFiltersCount={
            (searchTerm ? 1 : 0) +
            (statusFilter !== 'ALL' ? 1 : 0) +
            (kategoriFilter !== 'ALL' ? 1 : 0)
          }
        />{/* Table */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-700">
                  <TableHead className="text-left">
                    <SortableHeader
                      sortKey="judul"
                      currentSort={{ sortBy, sortDir }}
                      onSort={handleSort}
                    >
                      Judul
                    </SortableHeader>
                  </TableHead>
                  <TableHead className="text-left">
                    <SortableHeader
                      sortKey="penulis"
                      currentSort={{ sortBy, sortDir }}
                      onSort={handleSort}
                    >
                      Penulis
                    </SortableHeader>
                  </TableHead>
                  <TableHead className="text-left">Kategori</TableHead>
                  <TableHead className="text-left">Status</TableHead>
                  <TableHead className="text-left">
                    <SortableHeader
                      sortKey="tanggalDibuat"
                      currentSort={{ sortBy, sortDir }}
                      onSort={handleSort}
                    >
                      Tanggal
                    </SortableHeader>
                  </TableHead>
                  <TableHead className="text-left">
                    <SortableHeader
                      sortKey="jumlahView"
                      currentSort={{ sortBy, sortDir }}
                      onSort={handleSort}
                    >
                      Views
                    </SortableHeader>
                  </TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <LoadingSpinner />
                    </TableCell>
                  </TableRow>
                ) : beritaList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Tidak ada berita ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  beritaList.map((berita: Berita) => (
                    <TableRow key={berita.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white line-clamp-2">
                            {berita.judul}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-400" />
                          {berita.penulis}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {kategoriOptions.find(k => k.value === berita.kategori)?.label || berita.kategori}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(berita.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4 mr-2" />
                          {formatDate(berita.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Eye className="w-4 h-4 mr-2" />
                          {berita.jumlahView?.toLocaleString() || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/berita/${berita.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/berita/${berita.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Lihat
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/berita/edit/${berita.id}`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedBerita(berita)
                                setDeleteDialogOpen(true)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>            </Table>
          </CardContent>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-200 dark:border-gray-700">
              <ServerPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus berita "{selectedBerita?.judul}"? 
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedBerita && handleDelete(selectedBerita.id)}
            >
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
