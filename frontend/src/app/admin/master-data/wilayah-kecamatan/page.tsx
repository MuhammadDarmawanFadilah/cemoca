'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils"
import { AdminPageHeader } from "@/components/AdminPageHeader"
import { ServerPagination } from "@/components/ServerPagination"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { SortableHeader } from "@/components/ui/sortable-header"
import { config, getApiUrl } from "@/lib/config"
import { Search, MapPin, Plus, Edit, Trash2, ExternalLink, Database } from 'lucide-react'

interface WilayahKecamatan {
  kode: string
  nama: string
  kotaKode: string
  createdAt: string
  updatedAt: string
}

interface WilayahKota {
  kode: string
  nama: string
  provinsiKode: string
}

interface WilayahAPIData {
  code: string
  name: string
}

export default function KecamatanWilayahPage() {
  const [kecamatanList, setKecamatanList] = useState<WilayahKecamatan[]>([])
  const [kotaList, setKotaList] = useState<WilayahKota[]>([])
  const [apiKecamatanList, setApiKecamatanList] = useState<WilayahAPIData[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedKecamatan, setSelectedKecamatan] = useState<WilayahKecamatan | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedKota, setSelectedKota] = useState('')
  const [sortBy, setSortBy] = useState('nama')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  
  // Form state
  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    kotaKode: ''
  })
  
  useEffect(() => {
    setMounted(true)
    loadKecamatan()
    loadKota()
  }, [currentPage, pageSize, searchTerm, selectedKota, sortBy, sortDir])

  const loadKota = async () => {
    try {
      const response = await fetch(`${getApiUrl('/admin/wilayah')}/kota?size=1000`)
      if (response.ok) {
        const result = await response.json()
        setKotaList(result.content || [])
      }
    } catch (error) {
      console.error('Error loading kota:', error)
    }
  }

  const loadAPIKecamatan = async (kotaKode: string) => {
    if (!kotaKode) return
    
    try {
      const response = await fetch(`${getApiUrl('/wilayah')}/districts/${kotaKode}`)
      if (response.ok) {
        const result = await response.json()
        if (result.data) {
          setApiKecamatanList(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading API kecamatan:', error)
    }
  }

  const loadKecamatan = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: pageSize.toString(),
        sortBy,
        sortDir
      })
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm)
      }
      
      if (selectedKota) {
        params.append('kotaKode', selectedKota)
      }

      const response = await fetch(`${getApiUrl('/admin/wilayah')}/kecamatan?${params}`)
      
      if (response.ok) {
        const result = await response.json()
        setKecamatanList(result.content || [])
        setTotalPages(result.totalPages || 0)
        setTotalElements(result.totalElements || 0)
      } else {
        const error = await response.json()
        showErrorToast(error.error || 'Gagal memuat data kecamatan')
      }
    } catch (error) {
      console.error('Error loading kecamatan:', error)
      showErrorToast('Gagal memuat data kecamatan')
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortDir('asc')
    }
    setCurrentPage(0)
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(0)
  }

  const handleKotaFilterChange = (value: string) => {
    const kotaValue = value === 'all' ? '' : value
    setSelectedKota(kotaValue)
    setCurrentPage(0)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(0)
  }
  const handleCreate = () => {
    setFormData({ kode: '', nama: '', kotaKode: '' })
    setApiKecamatanList([])
    setIsCreateOpen(true)
  }

  const handleEdit = (kecamatan: WilayahKecamatan) => {
    setSelectedKecamatan(kecamatan)
    setFormData({
      kode: kecamatan.kode,
      nama: kecamatan.nama,
      kotaKode: kecamatan.kotaKode
    })
    if (kecamatan.kotaKode) {
      loadAPIKecamatan(kecamatan.kotaKode)
    }
    setIsEditOpen(true)
  }

  const handleDelete = (kecamatan: WilayahKecamatan) => {
    setSelectedKecamatan(kecamatan)
    setIsDeleteOpen(true)
  }
  const handleSubmit = async () => {
    if (!formData.kode || !formData.nama || !formData.kotaKode) {
      showErrorToast('Semua field wajib diisi')
      return
    }

    try {
      setLoading(true)
      const method = isEditOpen ? 'PUT' : 'POST'
      const url = isEditOpen 
        ? `${getApiUrl('/admin/wilayah')}/kecamatan/${selectedKecamatan?.kode}`
        : `${getApiUrl('/admin/wilayah')}/kecamatan`
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const result = await response.json()
        showSuccessToast(result.message || `Kecamatan berhasil ${isEditOpen ? 'diperbarui' : 'ditambahkan'}`)
        setIsCreateOpen(false)
        setIsEditOpen(false)
        loadKecamatan()
      } else {
        const error = await response.json()
        showErrorToast(error.error || `Gagal ${isEditOpen ? 'memperbarui' : 'menambahkan'} kecamatan`)
      }
    } catch (error) {
      console.error('Error saving kecamatan:', error)
      showErrorToast(`Gagal ${isEditOpen ? 'memperbarui' : 'menambahkan'} kecamatan`)
    } finally {
      setLoading(false)
    }
  }

  const selectFromAPI = (apiData: WilayahAPIData) => {
    setFormData(prev => ({
      ...prev,
      kode: apiData.code,
      nama: apiData.name
    }))
  }

  const getKotaName = (kode: string) => {
    const kota = kotaList.find(k => k.kode === kode)
    return kota?.nama || kode
  }

  if (!mounted) return <LoadingSpinner />

  return (
    <div className="container mx-auto p-6 space-y-6">
      <AdminPageHeader
        title="Master Data Kecamatan"
        description="Kelola data kecamatan berdasarkan cache biografi member"
        icon={MapPin}
      />

      <div className="flex justify-end mb-4">
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Tambah Kecamatan
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari kode atau nama kecamatan..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400">Kota:</Label>
              <Select value={selectedKota || 'all'} onValueChange={handleKotaFilterChange}>
                <SelectTrigger className="w-48 bg-white dark:bg-gray-800">
                  <SelectValue placeholder="Semua Kota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kota</SelectItem>
                  {kotaList.map((kota) => (
                    <SelectItem key={kota.kode} value={kota.kode}>
                      {kota.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400">Show:</Label>
              <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                <SelectTrigger className="w-20 bg-white dark:bg-gray-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {kecamatanList.length} of {totalElements} items
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kecamatan Table */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all">
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortableHeader
                      sortKey="kode"
                      currentSort={{ sortBy, sortDir }}
                      onSort={handleSort}
                    >
                      Kode
                    </SortableHeader>
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      sortKey="nama"
                      currentSort={{ sortBy, sortDir }}
                      onSort={handleSort}
                    >
                      Nama Kecamatan
                    </SortableHeader>
                  </TableHead>
                  <TableHead>Kota/Kabupaten</TableHead>
                  <TableHead>
                    <SortableHeader
                      sortKey="createdAt"
                      currentSort={{ sortBy, sortDir }}
                      onSort={handleSort}
                    >
                      Ditambahkan
                    </SortableHeader>
                  </TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <LoadingSpinner />
                    </TableCell>
                  </TableRow>
                ) : kecamatanList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Tidak ada data kecamatan
                    </TableCell>
                  </TableRow>
                ) : (
                  kecamatanList.map((kecamatan) => (
                    <TableRow key={kecamatan.kode}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {kecamatan.kode}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {kecamatan.nama}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getKotaName(kecamatan.kotaKode)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(kecamatan.createdAt).toLocaleDateString('id-ID')}
                      </TableCell>                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(kecamatan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(kecamatan)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <ServerPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalElements={totalElements}
        onPageChange={setCurrentPage}
        onPageSizeChange={handlePageSizeChange}
      />      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false)
          setIsEditOpen(false)
          setSelectedKecamatan(null)
        }
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{isEditOpen ? 'Edit Kecamatan' : 'Tambah Kecamatan Baru'}</DialogTitle>
            <DialogDescription>
              {isEditOpen ? 'Perbarui data kecamatan' : 'Pilih kota terlebih dahulu, lalu pilih dari data wilayah.id atau masukkan data manual'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Kota Selection */}
            <div className="space-y-2">
              <Label htmlFor="kota-select">Kota/Kabupaten</Label>
              <Select 
                value={formData.kotaKode} 
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, kotaKode: value }))
                  loadAPIKecamatan(value)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kota/Kabupaten" />
                </SelectTrigger>
                <SelectContent>
                  {kotaList.map((kota) => (
                    <SelectItem key={kota.kode} value={kota.kode}>
                      {kota.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Manual Input */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Input Manual</h4>
                <div className="space-y-2">
                  <Label htmlFor="kode">Kode Kecamatan</Label>
                  <Input
                    id="kode"
                    value={formData.kode}
                    onChange={(e) => setFormData(prev => ({ ...prev, kode: e.target.value }))}
                    placeholder="Contoh: 110101"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Kecamatan</Label>
                  <Input
                    id="nama"
                    value={formData.nama}
                    onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                    placeholder="Contoh: TEUPAH SELATAN"
                  />
                </div>
              </div>
              
              {/* API Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">Pilih dari wilayah.id</h4>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </div>
                <div className="max-h-64 overflow-y-auto border rounded-md">
                  {apiKecamatanList.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {formData.kotaKode ? 'Memuat data...' : 'Pilih kota terlebih dahulu'}
                    </div>
                  ) : (
                    apiKecamatanList.map((api) => (
                      <div 
                        key={api.code} 
                        className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b last:border-b-0"
                        onClick={() => selectFromAPI(api)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{api.name}</span>
                          <Badge variant="outline" className="text-xs font-mono">
                            {api.code}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
            <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateOpen(false)
              setIsEditOpen(false)
            }}>
              Batal
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.kode || !formData.nama || !formData.kotaKode || loading}
            >
              {loading ? <LoadingSpinner className="mr-2" /> : <Database className="mr-2 h-4 w-4" />}
              {isEditOpen ? 'Perbarui' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <ConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={async () => {
          if (!selectedKecamatan) return
          
          try {
            setLoading(true)
            const response = await fetch(`${getApiUrl('/admin/wilayah')}/kecamatan/${selectedKecamatan.kode}`, {
              method: 'DELETE'
            })

            if (response.ok) {
              const result = await response.json()
              showSuccessToast(result.message || 'Kecamatan berhasil dihapus')
              setIsDeleteOpen(false)
              loadKecamatan()
            } else {
              const error = await response.json()
              showErrorToast(error.error || 'Gagal menghapus kecamatan')
            }
          } catch (error) {
            console.error('Error deleting kecamatan:', error)
            showErrorToast('Gagal menghapus kecamatan')
          } finally {
            setLoading(false)
          }
        }}
        title="Hapus Kecamatan"
        description={`Apakah Anda yakin ingin menghapus kecamatan "${selectedKecamatan?.nama}"? Aksi ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
      />
    </div>
  )
}
