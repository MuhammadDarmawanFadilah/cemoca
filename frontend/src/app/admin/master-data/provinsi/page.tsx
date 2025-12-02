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
import { locationAPI, ProvinsiResponseDTO, ProvinsiRequest } from '@/lib/api'
import { Search, Eye, MapPin, Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import AdminFilters from '@/components/AdminFilters'
import AdminPageHeader from '@/components/AdminPageHeader'

export default function ProvinsiMasterDataPage() {
  const [provinsiList, setProvinsiList] = useState<ProvinsiResponseDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedProvinsi, setSelectedProvinsi] = useState<ProvinsiResponseDTO | null>(null)
  
  // Filter state for AdminFilters
  const [filters, setFilters] = useState({
    search: '',
    page: 0,
    size: 10,
    sortBy: 'nama',
    sortDirection: 'asc'
  })
  
  // Form state
  const [formData, setFormData] = useState({
    kode: '',
    nama: ''
  })
  
  // Pagination state
  const [totalElements, setTotalElements] = useState(0)
  const [totalPageCount, setTotalPageCount] = useState(0)
  useEffect(() => {
    setMounted(true)
  }, [])
  useEffect(() => {
    if (mounted) {
      loadProvinsiData()
    }
  }, [mounted, filters.page, filters.size, filters.search])

  const loadProvinsiData = async () => {
    try {
      setLoading(true)
      const response = await locationAPI.admin.provinsi.getAll(filters.search || undefined, filters.page, filters.size)
      console.log('Provinsi pagination response:', response) // Debug log
      setProvinsiList(response.content || [])
      setTotalElements(response.totalElements || 0)
      setTotalPageCount(response.totalPages || 0)
    } catch (error) {
      console.error('Error loading provinsi data:', error)
      showErrorToast(error)
      setProvinsiList([])
      setTotalElements(0)
      setTotalPageCount(0)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      kode: '',
      nama: ''
    })
    setSelectedProvinsi(null)
  }

  const handleCreate = () => {
    resetForm()
    setIsCreateOpen(true)
  }

  const handleEdit = (provinsi: ProvinsiResponseDTO) => {
    setSelectedProvinsi(provinsi)
    setFormData({
      kode: provinsi.kode,
      nama: provinsi.nama
    })
    setIsEditOpen(true)
  }

  const handleDelete = (provinsi: ProvinsiResponseDTO) => {
    setSelectedProvinsi(provinsi)
    setIsDeleteOpen(true)
  }
  const submitCreate = async () => {    if (!formData.kode.trim() || !formData.nama.trim()) {
      showErrorToast('Kode dan nama provinsi harus diisi')
      return
    }

    try {      const request: ProvinsiRequest = {
        kode: formData.kode.trim(),
        nama: formData.nama.trim()
      }
      
      await locationAPI.admin.provinsi.create(request)
      showSuccessToast('Provinsi berhasil ditambahkan')
      setIsCreateOpen(false)
      resetForm()
      await loadProvinsiData() // Reload data
    } catch (error) {      console.error('Error creating provinsi:', error)
      showErrorToast(error)
    }
  }

  const submitEdit = async () => {    if (!selectedProvinsi || !formData.kode.trim() || !formData.nama.trim()) {
      showErrorToast('Data tidak valid')
      return
    }

    try {      const request: ProvinsiRequest = {
        kode: formData.kode.trim(),
        nama: formData.nama.trim()
      }
      
      await locationAPI.admin.provinsi.update(selectedProvinsi.id, request)
      showSuccessToast('Provinsi berhasil diperbarui')
      setIsEditOpen(false)
      resetForm()
      await loadProvinsiData() // Reload data
    } catch (error) {      console.error('Error updating provinsi:', error)
      showErrorToast(error)
    }
  }
  const submitDelete = async () => {
    if (!selectedProvinsi) return
    
    try {
      await locationAPI.admin.provinsi.delete(selectedProvinsi.id)
      showSuccessToast('Provinsi berhasil dihapus')
      setIsDeleteOpen(false)
      setSelectedProvinsi(null)
      await loadProvinsiData() // Reload data
    } catch (error) {
      console.error('Error deleting provinsi:', error)
      showErrorToast(error)
    }  }
  
  // Reset to first page when search changes
  useEffect(() => {
    if (filters.page !== 0) {
      setFilters(prev => ({ ...prev, page: 0 }))
    }
  }, [filters.search])

  // Add debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.page === 0) {
        loadProvinsiData()
      } else {
        setFilters(prev => ({ ...prev, page: 0 })) // This will trigger loadProvinsiData via the dependency
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [filters.search])

  const handleViewKota = (provinsi: ProvinsiResponseDTO) => {
    // Navigate to kota page with provinsi filter
    window.location.href = `/admin/master-data/kota?provinsi=${provinsi.id}&provinsiNama=${encodeURIComponent(provinsi.nama)}`  }

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
      <AdminPageHeader 
        title="Master Data Provinsi" 
        description="Kelola data provinsi dalam sistem"
        icon={MapPin}
      />      <AdminFilters
        searchPlaceholder="Cari provinsi..."
        searchValue={filters.search}
        onSearchChange={(value) => setFilters(prev => ({ ...prev, search: value, page: 0 }))}
        pageSize={filters.size}
        onPageSizeChange={(size) => setFilters(prev => ({ ...prev, size, page: 0 }))}
        totalItems={totalElements}
        currentItems={provinsiList.length}
      />

      <Card>
        <CardHeader>
          <CardTitle>Data Provinsi Indonesia</CardTitle>
          <CardDescription>
            Kelola data provinsi dalam sistem. Anda dapat menambah, mengedit, atau menghapus data provinsi.
          </CardDescription>        </CardHeader>        <CardContent>
          {/* Add Button */}
          <div className="flex justify-end mb-6">
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Provinsi
            </Button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <span className="text-muted-foreground">Memuat data provinsi...</span>
              </div>
            </div>          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Nama Provinsi</TableHead>
                      <TableHead>Jumlah Kota/Kabupaten</TableHead>
                      <TableHead className="w-32">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                            <span className="text-muted-foreground">Memuat data...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : provinsiList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <MapPin className="h-8 w-8 text-muted-foreground" />                            <span className="text-muted-foreground">
                              {filters.search ? 'Tidak ada provinsi yang ditemukan' : 'Belum ada data provinsi'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      provinsiList.map((provinsi) => (
                        <TableRow key={provinsi.id}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {provinsi.kode}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{provinsi.nama}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {provinsi.kotaCount ?? (provinsi.kotaList ? provinsi.kotaList.length : 0)} kota/kabupaten
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewKota(provinsi)}
                                className="h-8"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Lihat Kota
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(provinsi)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(provinsi)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalPageCount > 1 && (
                <div className="mt-6">                  <DataTablePagination
                    pageIndex={filters.page}
                    pageSize={filters.size}
                    pageCount={totalPageCount}
                    totalCount={totalElements}
                    canPreviousPage={filters.page > 0}
                    canNextPage={filters.page < totalPageCount - 1}
                    onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
                    onPageSizeChange={(size) => setFilters(prev => ({ ...prev, size, page: 0 }))}
                  />
                </div>
              )}
            </>
          )}        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Provinsi Baru</DialogTitle>
            <DialogDescription>
              Tambahkan provinsi baru ke dalam sistem
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid items-center gap-2">
              <Label htmlFor="create-kode">Kode Provinsi</Label>
              <Input
                id="create-kode"
                value={formData.kode}
                onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                placeholder="Masukkan kode provinsi (contoh: 11)"
              />
            </div>
            <div className="grid items-center gap-2">
              <Label htmlFor="create-nama">Nama Provinsi</Label>
              <Input
                id="create-nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Masukkan nama provinsi"
              />
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
            <DialogTitle>Edit Provinsi</DialogTitle>
            <DialogDescription>
              Perbarui informasi provinsi
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid items-center gap-2">
              <Label htmlFor="edit-kode">Kode Provinsi</Label>
              <Input
                id="edit-kode"
                value={formData.kode}
                onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                placeholder="Masukkan kode provinsi"
              />
            </div>
            <div className="grid items-center gap-2">
              <Label htmlFor="edit-nama">Nama Provinsi</Label>
              <Input
                id="edit-nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Masukkan nama provinsi"
              />
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
        title="Hapus Provinsi"
        description={`Apakah Anda yakin ingin menghapus provinsi "${selectedProvinsi?.nama}"? Tindakan ini akan mempengaruhi semua data kota/kabupaten yang terkait dan tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
        onConfirm={submitDelete}
        loading={loading}
      />
    </div>
  )
}
