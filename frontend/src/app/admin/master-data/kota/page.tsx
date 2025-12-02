'use client'

import { useState, useEffect, useMemo } from 'react'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils"
import { locationAPI, ProvinsiResponseDTO, KotaResponseDTO, KotaRequest } from '@/lib/api'
import { Search, ArrowLeft, MapPin, Building, Plus, MoreHorizontal, Edit, Trash2, AlertTriangle } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function KotaMasterDataPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [kotaList, setKotaList] = useState<KotaResponseDTO[]>([])
  const [provinsiList, setProvinsiList] = useState<ProvinsiResponseDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProvinsi, setSelectedProvinsi] = useState<string>('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedKota, setSelectedKota] = useState<KotaResponseDTO | null>(null)
    // Form state
  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    tipe: 'KOTA' as 'KOTA' | 'KABUPATEN',
    provinsiId: ''
  })
    // Pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPageCount, setTotalPageCount] = useState(0)

  useEffect(() => {
    loadProvinsiData()
    
    // Initialize from URL params
    const provinsiId = searchParams?.get('provinsi')
    const provinsiNama = searchParams?.get('provinsiNama')
    
    console.log('Reading URL params:', { provinsiId, provinsiNama })
    
    if (provinsiId && provinsiNama) {
      console.log('Setting selectedProvinsi to:', provinsiId)
      setSelectedProvinsi(provinsiId)
    }
    
    setMounted(true)
  }, [searchParams])

  useEffect(() => {
    if (mounted) {
      loadKotaData()
    }
  }, [mounted, currentPage, pageSize, searchTerm, selectedProvinsi])

  const loadProvinsiData = async () => {
    try {      const response = await locationAPI.getAllProvinsi()
      setProvinsiList(response || [])
    } catch (error) {
      console.error('Error loading provinsi data:', error)
    }
  }

  const loadKotaData = async () => {
    try {
      setLoading(true)
      const provinsiIdFilter = selectedProvinsi ? parseInt(selectedProvinsi) : undefined
      
      const response = await locationAPI.admin.kota.getAll(
        searchTerm || undefined, 
        provinsiIdFilter, 
        currentPage, 
        pageSize
      )
      setKotaList(response.content || [])
      setTotalElements(response.totalElements || 0)
      setTotalPageCount(response.totalPages || 0)
    } catch (error) {
      console.error('Error loading kota data:', error)
      showErrorToast(error)
      setKotaList([])
      setTotalElements(0)
      setTotalPageCount(0)
    } finally {
      setLoading(false)
    }
  }

  const handleProvinsiChange = (provinsiId: string) => {
    setSelectedProvinsi(provinsiId)
    if (currentPage !== 0) {
      setCurrentPage(0) // This will trigger data reload
    } else {
      loadKotaData() // If already on page 0, manually trigger reload
    }
  }

  // Reset to first page when search changes
  useEffect(() => {
    if (currentPage !== 0) {
      setCurrentPage(0)
    }
  }, [searchTerm, selectedProvinsi])
  // Add debounced search
  useEffect(() => {
    if (!mounted) return
    
    const timeoutId = setTimeout(() => {
      if (currentPage === 0) {
        loadKotaData()
      } else {
        setCurrentPage(0) // This will trigger loadKotaData via the dependency
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchTerm, mounted])
  const getSelectedProvinsiName = () => {
    if (!selectedProvinsi || selectedProvinsi === 'all') return null
    const provinsi = provinsiList.find(p => p.id.toString() === selectedProvinsi)
    return provinsi?.nama
  }

  const resetForm = () => {
    setFormData({
      kode: '',
      nama: '',
      tipe: 'KOTA',
      provinsiId: selectedProvinsi && selectedProvinsi !== 'all' ? selectedProvinsi : ''
    })
    setSelectedKota(null)
  }

  const handleCreate = () => {
    resetForm()
    setIsCreateOpen(true)
  }
  const handleEdit = (kota: KotaResponseDTO) => {
    setSelectedKota(kota)
    // Find provinsi by name to get the ID
    const provinsi = provinsiList.find(p => p.nama === kota.provinsiNama)
    setFormData({
      kode: kota.kode,
      nama: kota.nama,
      tipe: kota.tipe as 'KOTA' | 'KABUPATEN',
      provinsiId: provinsi?.id.toString() || ''
    })
    setIsEditOpen(true)
  }

  const handleDelete = (kota: KotaResponseDTO) => {
    setSelectedKota(kota)
    setIsDeleteOpen(true)
  }
  const submitCreate = async () => {
    if (!formData.kode.trim() || !formData.nama.trim() || !formData.provinsiId) {
      showErrorToast('Semua field harus diisi')
      return
    }

    try {
      const request: KotaRequest = {
        kode: formData.kode.trim(),
        nama: formData.nama.trim(),
        tipe: formData.tipe,
        provinsiId: parseInt(formData.provinsiId)
      }

      await locationAPI.admin.kota.create(request)
      showSuccessToast('Kota/Kabupaten berhasil ditambahkan')
      setIsCreateOpen(false)
      resetForm()
      await loadKotaData() // Reload data
    } catch (error) {
      console.error('Error creating kota:', error)
      showErrorToast(error)
    }
  }

  const submitEdit = async () => {
    if (!selectedKota || !formData.kode.trim() || !formData.nama.trim() || !formData.provinsiId) {
      showErrorToast('Data tidak valid')
      return
    }

    try {
      const request: KotaRequest = {
        kode: formData.kode.trim(),
        nama: formData.nama.trim(),
        tipe: formData.tipe,
        provinsiId: parseInt(formData.provinsiId)
      }

      await locationAPI.admin.kota.update(selectedKota.id, request)
      showSuccessToast('Kota/Kabupaten berhasil diperbarui')
      setIsEditOpen(false)
      resetForm()
      await loadKotaData() // Reload data
    } catch (error) {
      console.error('Error updating kota:', error)
      showErrorToast(error)
    }
  }

  const submitDelete = async () => {
    if (!selectedKota) return

    try {
      await locationAPI.admin.kota.delete(selectedKota.id)
      showSuccessToast('Kota/Kabupaten berhasil dihapus')
      setIsDeleteOpen(false)
      setSelectedKota(null)
      await loadKotaData() // Reload data
    } catch (error) {
      console.error('Error deleting kota:', error)
      showErrorToast(error)
    }  }
  
  if (!mounted) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-muted-foreground">Memuat halaman...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Building className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Master Data Kota/Kabupaten</h1>
        </div>
        <p className="text-muted-foreground">
          Kelola data kota dan kabupaten dalam sistem
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/master-data/provinsi')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Provinsi
            </Button>            <div>
              <CardTitle>Data Kota & Kabupaten Indonesia</CardTitle>
              <CardDescription>
                Kelola data kota dan kabupaten dalam sistem. Anda dapat menambah, mengedit, atau menghapus data kota/kabupaten.
                {getSelectedProvinsiName() && (
                  <span className="block mt-1">
                    Filter: <Badge variant="secondary">{getSelectedProvinsiName()}</Badge>
                  </span>
                )}
              </CardDescription>
            </div>
          </div>        </CardHeader>
        <CardContent>
          {/* Warning Notice */}          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="search">Cari Kota/Kabupaten</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Nama, kode, atau tipe..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="provinsi">Filter Provinsi</Label>
                <Select
                  value={selectedProvinsi || 'all'}
                  onValueChange={handleProvinsiChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Provinsi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Provinsi</SelectItem>
                    {provinsiList.map((provinsi) => (
                      <SelectItem key={provinsi.id} value={provinsi.id.toString()}>
                        {provinsi.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
              <div className="flex items-center gap-2">
              <Badge variant="outline">
                {totalElements} kota/kabupaten
              </Badge>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Kota/Kabupaten
              </Button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <span className="text-muted-foreground">Memuat data kota/kabupaten...</span>
              </div>
            </div>          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Provinsi</TableHead>
                      <TableHead className="w-32">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kotaList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <Building className="h-8 w-8 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {searchTerm ? 'Tidak ada kota/kabupaten yang ditemukan' : 'Belum ada data kota/kabupaten'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      kotaList.map((kota) => (
                        <TableRow key={kota.id}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {kota.kode}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{kota.nama}</TableCell>
                          <TableCell>
                            <Badge variant={kota.tipe === 'KOTA' ? 'default' : 'secondary'}>
                              {kota.tipe}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{kota.provinsiNama}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(kota)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(kota)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPageCount > 1 && (
                <div className="mt-6">
                  <DataTablePagination
                    pageIndex={currentPage}
                    pageSize={pageSize}                    pageCount={totalPageCount}
                    totalCount={totalElements}
                    canPreviousPage={currentPage > 0}
                    canNextPage={currentPage < totalPageCount - 1}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => {
                      setPageSize(size)
                      setCurrentPage(0)
                    }}
                  />
                </div>              )}
            </>
          )}</CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Kota/Kabupaten Baru</DialogTitle>
            <DialogDescription>
              Tambahkan kota/kabupaten baru ke dalam sistem
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid items-center gap-2">
              <Label htmlFor="create-kode">Kode Kota/Kabupaten</Label>
              <Input
                id="create-kode"
                value={formData.kode}
                onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                placeholder="Masukkan kode kota/kabupaten (contoh: 1101)"
              />
            </div>
            <div className="grid items-center gap-2">
              <Label htmlFor="create-nama">Nama Kota/Kabupaten</Label>
              <Input
                id="create-nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Masukkan nama kota/kabupaten"
              />
            </div>
            <div className="grid items-center gap-2">
              <Label htmlFor="create-tipe">Tipe</Label>
              <Select
                value={formData.tipe}
                onValueChange={(value: 'KOTA' | 'KABUPATEN') => setFormData({ ...formData, tipe: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KOTA">Kota</SelectItem>
                  <SelectItem value="KABUPATEN">Kabupaten</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid items-center gap-2">
              <Label htmlFor="create-provinsi">Provinsi</Label>
              <Select
                value={formData.provinsiId}
                onValueChange={(value) => setFormData({ ...formData, provinsiId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Provinsi" />
                </SelectTrigger>
                <SelectContent>
                  {provinsiList.map((provinsi) => (
                    <SelectItem key={provinsi.id} value={provinsi.id.toString()}>
                      {provinsi.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Batal
            </Button>
            <Button onClick={submitCreate}>
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Kota/Kabupaten</DialogTitle>
            <DialogDescription>
              Perbarui informasi kota/kabupaten
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid items-center gap-2">
              <Label htmlFor="edit-kode">Kode Kota/Kabupaten</Label>
              <Input
                id="edit-kode"
                value={formData.kode}
                onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                placeholder="Masukkan kode kota/kabupaten"
              />
            </div>
            <div className="grid items-center gap-2">
              <Label htmlFor="edit-nama">Nama Kota/Kabupaten</Label>
              <Input
                id="edit-nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Masukkan nama kota/kabupaten"
              />
            </div>
            <div className="grid items-center gap-2">
              <Label htmlFor="edit-tipe">Tipe</Label>
              <Select
                value={formData.tipe}
                onValueChange={(value: 'KOTA' | 'KABUPATEN') => setFormData({ ...formData, tipe: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KOTA">Kota</SelectItem>
                  <SelectItem value="KABUPATEN">Kabupaten</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid items-center gap-2">
              <Label htmlFor="edit-provinsi">Provinsi</Label>
              <Select
                value={formData.provinsiId}
                onValueChange={(value) => setFormData({ ...formData, provinsiId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Provinsi" />
                </SelectTrigger>
                <SelectContent>
                  {provinsiList.map((provinsi) => (
                    <SelectItem key={provinsi.id} value={provinsi.id.toString()}>
                      {provinsi.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Batal
            </Button>
            <Button onClick={submitEdit}>
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Hapus Kota/Kabupaten"
        description={`Apakah Anda yakin ingin menghapus ${selectedKota?.tipe.toLowerCase()} "${selectedKota?.nama}"? Tindakan ini akan mempengaruhi semua data alamat yang terkait dan tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
        onConfirm={submitDelete}
        loading={loading}
      />
    </div>
  )
}
