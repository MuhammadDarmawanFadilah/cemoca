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

interface WilayahKelurahan {
  kode: string
  nama: string
  kecamatanKode: string
  kodePos?: string
  createdAt: string
  updatedAt: string
}

interface WilayahKecamatan {
  kode: string
  nama: string
  kotaKode: string
}

interface WilayahAPIData {
  code: string
  name: string
  postal_code?: string
}

export default function KelurahanWilayahPage() {
  const [kelurahanList, setKelurahanList] = useState<WilayahKelurahan[]>([])
  const [kecamatanList, setKecamatanList] = useState<WilayahKecamatan[]>([])
  const [apiKelurahanList, setApiKelurahanList] = useState<WilayahAPIData[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedKelurahan, setSelectedKelurahan] = useState<WilayahKelurahan | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedKecamatan, setSelectedKecamatan] = useState('')
  const [sortBy, setSortBy] = useState('nama')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  
  // Form state
  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    kecamatanKode: '',
    kodePos: ''
  })
  
  useEffect(() => {
    setMounted(true)
    loadKelurahan()
    loadKecamatan()
  }, [currentPage, pageSize, searchTerm, selectedKecamatan, sortBy, sortDir])

  const loadKecamatan = async () => {
    try {
      const response = await fetch(`${getApiUrl('/admin/wilayah')}/kecamatan?size=1000`)
      if (response.ok) {
        const result = await response.json()
        setKecamatanList(result.content || [])
      }
    } catch (error) {
      console.error('Error loading kecamatan:', error)
    }
  }

  const loadKelurahan = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: pageSize.toString(),
        sortBy,
        sortDir
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (selectedKecamatan && selectedKecamatan !== 'all') {
        params.append('kecamatanKode', selectedKecamatan)
      }
      
      const response = await fetch(`${getApiUrl('/admin/wilayah')}/kelurahan?${params}`)
      
      if (response.ok) {
        const result = await response.json()
        setKelurahanList(result.content || [])
        setTotalPages(result.totalPages || 0)
        setTotalElements(result.totalElements || 0)
      } else {
        showErrorToast('Gagal memuat data kelurahan')
      }
    } catch (error) {
      console.error('Error loading kelurahan:', error)
      showErrorToast('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const loadAPIKelurahan = async (kecamatanKode: string) => {
    if (!kecamatanKode) {
      setApiKelurahanList([])
      return
    }
    
    try {
      const response = await fetch(`https://wilayah.id/api/villages.json?district_code=${kecamatanKode}`)
      if (response.ok) {
        const data = await response.json()
        setApiKelurahanList(data.data || [])
      }
    } catch (error) {
      console.error('Error loading API kelurahan:', error)
      showErrorToast('Gagal memuat data dari wilayah.id')
    }
  }

  const handleKecamatanFilterChange = (value: string) => {
    setSelectedKecamatan(value)
    setCurrentPage(0)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(0)
  }
  const handleSort = (sortBy: string, sortDir: 'asc' | 'desc') => {
    setSortBy(sortBy)
    setSortDir(sortDir)
    setCurrentPage(0)
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(0)
  }

  const handleCreate = () => {
    setFormData({
      kode: '',
      nama: '',
      kecamatanKode: '',
      kodePos: ''
    })
    setApiKelurahanList([])
    setIsCreateOpen(true)
  }

  const handleEdit = (kelurahan: WilayahKelurahan) => {
    setSelectedKelurahan(kelurahan)
    setFormData({
      kode: kelurahan.kode,
      nama: kelurahan.nama,
      kecamatanKode: kelurahan.kecamatanKode,
      kodePos: kelurahan.kodePos || ''
    })
    if (kelurahan.kecamatanKode) {
      loadAPIKelurahan(kelurahan.kecamatanKode)
    }
    setIsEditOpen(true)
  }

  const handleDelete = (kelurahan: WilayahKelurahan) => {
    setSelectedKelurahan(kelurahan)
    setIsDeleteOpen(true)
  }

  const selectFromAPI = (api: WilayahAPIData) => {
    setFormData(prev => ({
      ...prev,
      kode: api.code,
      nama: api.name,
      kodePos: api.postal_code || ''
    }))
  }

  const handleSubmit = async () => {
    if (!formData.kode || !formData.nama || !formData.kecamatanKode) {
      showErrorToast('Semua field wajib diisi')
      return
    }

    setLoading(true)
    try {
      const method = isEditOpen ? 'PUT' : 'POST'
      const url = isEditOpen 
        ? `${getApiUrl('/admin/wilayah')}/kelurahan/${selectedKelurahan?.kode}`
        : `${getApiUrl('/admin/wilayah')}/kelurahan`
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        showSuccessToast(`Kelurahan berhasil ${isEditOpen ? 'diperbarui' : 'ditambahkan'}`)
        setIsCreateOpen(false)
        setIsEditOpen(false)
        loadKelurahan()
      } else {
        const errorData = await response.text()
        showErrorToast(errorData || `Gagal ${isEditOpen ? 'memperbarui' : 'menambahkan'} kelurahan`)
      }
    } catch (error) {
      console.error('Error saving kelurahan:', error)
      showErrorToast('Terjadi kesalahan saat menyimpan data')
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedKelurahan) return

    setLoading(true)
    try {
      const response = await fetch(`${getApiUrl('/admin/wilayah')}/kelurahan/${selectedKelurahan.kode}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showSuccessToast('Kelurahan berhasil dihapus')
        setIsDeleteOpen(false)
        loadKelurahan()
      } else {
        const errorData = await response.text()
        showErrorToast(errorData || 'Gagal menghapus kelurahan')
      }
    } catch (error) {
      console.error('Error deleting kelurahan:', error)
      showErrorToast('Terjadi kesalahan saat menghapus data')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return <LoadingSpinner />
  }

  const getKecamatanName = (kode: string) => {
    const kecamatan = kecamatanList.find(k => k.kode === kode)
    return kecamatan ? kecamatan.nama : kode
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Master Data Kelurahan"
        description="Kelola data kelurahan dengan validasi dari wilayah.id"
        icon={MapPin}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Kelurahan
              </CardTitle>
              <CardDescription>
                Daftar kelurahan dengan validasi dari API wilayah.id
              </CardDescription>
            </div>
            <Button onClick={handleCreate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Kelurahan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari kelurahan..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 bg-white dark:bg-gray-800"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400">Kecamatan:</Label>
              <Select value={selectedKecamatan} onValueChange={handleKecamatanFilterChange}>
                <SelectTrigger className="w-48 bg-white dark:bg-gray-800">
                  <SelectValue placeholder="Semua Kecamatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kecamatan</SelectItem>
                  {kecamatanList.map((kecamatan) => (
                    <SelectItem key={kecamatan.kode} value={kecamatan.kode}>
                      {kecamatan.nama}
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
              Showing {kelurahanList.length} of {totalElements} items
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>                      <TableHead>
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
                          Nama Kelurahan
                        </SortableHeader>
                      </TableHead>
                      <TableHead>Kecamatan</TableHead>
                      <TableHead>Kode Pos</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kelurahanList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          {searchTerm || selectedKecamatan !== 'all' ? 'Tidak ada data yang sesuai dengan filter' : 'Belum ada data kelurahan'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      kelurahanList.map((kelurahan) => (
                        <TableRow key={kelurahan.kode}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {kelurahan.kode}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{kelurahan.nama}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {getKecamatanName(kelurahan.kecamatanKode)}
                          </TableCell>
                          <TableCell>
                            {kelurahan.kodePos && (
                              <Badge variant="secondary" className="font-mono text-xs">
                                {kelurahan.kodePos}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(kelurahan)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(kelurahan)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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

              <ServerPagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalElements={totalElements}
                onPageChange={setCurrentPage}
                onPageSizeChange={handlePageSizeChange}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false)
          setIsEditOpen(false)
          setSelectedKelurahan(null)
        }
      }}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {isEditOpen ? 'Edit Kelurahan' : 'Tambah Kelurahan'}
            </DialogTitle>
            <DialogDescription>
              {isEditOpen ? 'Perbarui data kelurahan' : 'Tambah kelurahan baru dengan validasi dari wilayah.id'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="kecamatan">Kecamatan</Label>
              <Select 
                value={formData.kecamatanKode} 
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, kecamatanKode: value }))
                  loadAPIKelurahan(value)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kecamatan" />
                </SelectTrigger>
                <SelectContent>
                  {kecamatanList.map((kecamatan) => (
                    <SelectItem key={kecamatan.kode} value={kecamatan.kode}>
                      {kecamatan.nama}
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
                  <Label htmlFor="kode">Kode Kelurahan</Label>
                  <Input
                    id="kode"
                    value={formData.kode}
                    onChange={(e) => setFormData(prev => ({ ...prev, kode: e.target.value }))}
                    placeholder="Contoh: 1101012001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Kelurahan</Label>
                  <Input
                    id="nama"
                    value={formData.nama}
                    onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                    placeholder="Contoh: LABUHAN HAJI TIMUR"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kodePos">Kode Pos (Opsional)</Label>
                  <Input
                    id="kodePos"
                    value={formData.kodePos}
                    onChange={(e) => setFormData(prev => ({ ...prev, kodePos: e.target.value }))}
                    placeholder="Contoh: 23511"
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
                  {apiKelurahanList.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {formData.kecamatanKode ? 'Memuat data...' : 'Pilih kecamatan terlebih dahulu'}
                    </div>
                  ) : (
                    apiKelurahanList.map((api) => (
                      <div 
                        key={api.code} 
                        className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b last:border-b-0"
                        onClick={() => selectFromAPI(api)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{api.name}</span>
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-xs font-mono">
                              {api.code}
                            </Badge>
                            {api.postal_code && (
                              <Badge variant="secondary" className="text-xs font-mono">
                                {api.postal_code}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false)
                setIsEditOpen(false)
              }}
            >
              Batal
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={loading}>
              {loading ? <LoadingSpinner className="mr-2" /> : null}
              {isEditOpen ? 'Perbarui' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={confirmDelete}
        title="Hapus Kelurahan"
        description={`Apakah Anda yakin ingin menghapus kelurahan "${selectedKelurahan?.nama}" (${selectedKelurahan?.kode})?`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  )
}
