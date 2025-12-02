'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
import { masterDataAPI, MasterAgamaResponse } from '@/lib/api'
import { SortableHeader } from '@/components/ui/sortable-header'
import { ServerPagination } from '@/components/ServerPagination'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Search, Plus, MoreHorizontal, Edit, Trash2, Heart, AlertTriangle, Eye } from 'lucide-react'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import AdminFilters from "@/components/AdminFilters"
import { useToast } from "@/hooks/use-toast"

export default function AgamaMasterDataPage() {
  const [agamaList, setAgamaList] = useState<MasterAgamaResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isToggleOpen, setIsToggleOpen] = useState(false)
  const [selectedAgama, setSelectedAgama] = useState<MasterAgamaResponse | null>(null)
    // Form state
  const [formData, setFormData] = useState({
    nama: '',
    deskripsi: '',
    isActive: true,
    sortOrder: 0
  })
  
  const { toast } = useToast()

  const handleViewDetail = (agama: MasterAgamaResponse) => {
    // For now, we'll just show a toast with agama details
    toast({
      title: `Detail Agama: ${agama.nama}`,
      description: `Deskripsi: ${agama.deskripsi || 'Tidak ada deskripsi'} | Status: ${agama.isActive ? 'Aktif' : 'Nonaktif'}`,
    })
  }
    // Pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [sortBy, setSortBy] = useState('sortOrder')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
    // Load data from backend
  useEffect(() => {
    setMounted(true)
  }, [])
    useEffect(() => {
    if (mounted) {
      loadAgamaData()
    }
  }, [mounted, currentPage, pageSize, searchTerm, sortBy, sortDir])

  const loadAgamaData = async () => {
    try {
      setLoading(true)
      const response = await masterDataAPI.agama.getAll(
        searchTerm || undefined,
        undefined, // isActive filter
        currentPage,
        pageSize,
        sortBy,
        sortDir
      )
      
      setAgamaList(response.content || [])
      setTotalElements(response.totalElements || 0)
      setTotalPages(response.totalPages || 0)    } catch (error) {
      console.error('Error loading agama data:', error)
      showErrorToast(error)
    } finally {
      setLoading(false)
    }
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

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(0) // Reset to first page when searching
  }

  const resetForm = () => {
    setFormData({
      nama: '',
      deskripsi: '',
      isActive: true,
      sortOrder: 0
    })
    setSelectedAgama(null)
  }

  const handleCreate = () => {
    resetForm()
    setIsCreateOpen(true)
  }
  const handleEdit = (agama: MasterAgamaResponse) => {
    setSelectedAgama(agama)
    setFormData({
      nama: agama.nama,
      deskripsi: agama.deskripsi || '',
      isActive: agama.isActive,
      sortOrder: agama.sortOrder
    })
    setIsEditOpen(true)
  }
  const handleDelete = (agama: MasterAgamaResponse) => {
    setSelectedAgama(agama)
    setIsDeleteOpen(true)
  }

  const handleToggle = (agama: MasterAgamaResponse) => {
    setSelectedAgama(agama)
    setIsToggleOpen(true)
  }
  const submitCreate = async () => {
    if (!formData.nama.trim()) {
      showErrorToast('Nama agama harus diisi')
      return
    }

    try {
      setLoading(true)
      await masterDataAPI.agama.create({
        nama: formData.nama.trim(),
        deskripsi: formData.deskripsi?.trim(),
        isActive: formData.isActive,
        sortOrder: formData.sortOrder
      })
      
      showSuccessToast('Agama berhasil ditambahkan')
      setIsCreateOpen(false)
      resetForm()
      loadAgamaData()
    } catch (error) {
      console.error('Error creating agama:', error)
      showErrorToast(error)
    } finally {
      setLoading(false)
    }
  }

  const submitEdit = async () => {
    if (!selectedAgama || !formData.nama.trim()) {
      showErrorToast('Data tidak valid')
      return
    }

    try {
      setLoading(true)
      await masterDataAPI.agama.update(selectedAgama.id, {
        nama: formData.nama.trim(),
        deskripsi: formData.deskripsi?.trim(),
        isActive: formData.isActive,
        sortOrder: formData.sortOrder
      })
      
      showSuccessToast('Agama berhasil diperbarui')
      setIsEditOpen(false)
      resetForm()
      loadAgamaData()
    } catch (error) {
      console.error('Error updating agama:', error)
      showErrorToast(error)
    } finally {
      setLoading(false)
    }
  }

  const submitDelete = async () => {
    if (!selectedAgama) return

    try {
      setLoading(true)
      await masterDataAPI.agama.delete(selectedAgama.id)
      
      showSuccessToast('Agama berhasil dihapus')
      setIsDeleteOpen(false)
      setSelectedAgama(null)
      loadAgamaData()
    } catch (error) {
      console.error('Error deleting agama:', error)
      showErrorToast(error)
    } finally {
      setLoading(false)
    }
  }
  const submitToggle = async () => {
    if (!selectedAgama) return
    
    try {
      setLoading(true)
      await masterDataAPI.agama.toggleActive(selectedAgama.id)
      
      showSuccessToast(`Status agama berhasil ${selectedAgama.isActive ? 'dinonaktifkan' : 'diaktifkan'}`)
      setIsToggleOpen(false)
      loadAgamaData()
    } catch (error) {
      console.error('Error toggling agama status:', error)
      showErrorToast(error)
    } finally {
      setLoading(false)
    }
  }

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
    <div className="min-h-screen bg-background">
      <AdminPageHeader
        title="Master Data Agama"
        description="Kelola data agama dalam sistem"
        icon={Heart}
        primaryAction={{
          label: "Tambah Agama",
          onClick: handleCreate,
          icon: Plus
        }}
        stats={[
          {
            label: "Total Agama",
            value: totalElements,
            variant: "secondary"
          }
        ]}
      />

      <div className="container mx-auto p-6 space-y-6">
        {/* Filters */}
        <AdminFilters
          searchValue={searchTerm}
          onSearchChange={handleSearchChange}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          searchPlaceholder="Cari nama agama..."
          totalItems={totalElements}
          currentItems={agamaList.length}
        />

      <Card>
        <CardHeader>
          <CardTitle>Data Agama</CardTitle>
          <CardDescription>
            Daftar agama yang tersedia dalam sistem
          </CardDescription>
        </CardHeader>        <CardContent>
          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortableHeader
                      sortKey="nama"
                      currentSort={{ sortBy, sortDir }}
                      onSort={handleSort}
                    >
                      Nama Agama
                    </SortableHeader>
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      sortKey="sortOrder"
                      currentSort={{ sortBy, sortDir }}
                      onSort={handleSort}
                    >
                      Urutan
                    </SortableHeader>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Aksi</TableHead>
                </TableRow>
              </TableHeader>              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <LoadingSpinner />
                    </TableCell>
                  </TableRow>
                ) : agamaList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Heart className="h-8 w-8 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {searchTerm ? 'Tidak ada agama yang ditemukan' : 'Belum ada data agama'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  agamaList.map((agama: MasterAgamaResponse) => (
                    <TableRow key={agama.id}>
                      <TableCell className="font-medium">{agama.nama}</TableCell>
                      <TableCell>{agama.sortOrder}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={agama.isActive}
                            onCheckedChange={() => handleToggle(agama)}
                          />
                          <Badge variant={agama.isActive ? "default" : "secondary"}>
                            {agama.isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetail(agama)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(agama)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(agama)}
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
            {/* Pagination */}          {totalPages > 1 && (
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
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Agama Baru</DialogTitle>
            <DialogDescription>              Tambahkan agama baru ke dalam sistem
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid items-center gap-2">
              <Label htmlFor="create-nama">Nama Agama</Label>
              <Input
                id="create-nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Masukkan nama agama"
              />
            </div>
            <div className="grid items-center gap-2">
              <Label htmlFor="create-deskripsi">Deskripsi (Opsional)</Label>
              <Input
                id="create-deskripsi"
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                placeholder="Masukkan deskripsi agama"
              />
            </div>
            <div className="grid items-center gap-2">
              <Label htmlFor="create-sortOrder">Urutan</Label>
              <Input
                id="create-sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                placeholder="Urutan tampilan"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="create-status">Status Aktif</Label>
              <Switch
                id="create-status"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
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
            <DialogTitle>Edit Agama</DialogTitle>            <DialogDescription>
              Perbarui informasi agama
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid items-center gap-2">
              <Label htmlFor="edit-nama">Nama Agama</Label>
              <Input
                id="edit-nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Masukkan nama agama"
              />
            </div>
            <div className="grid items-center gap-2">
              <Label htmlFor="edit-deskripsi">Deskripsi (Opsional)</Label>
              <Input
                id="edit-deskripsi"
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                placeholder="Masukkan deskripsi agama"
              />
            </div>
            <div className="grid items-center gap-2">
              <Label htmlFor="edit-sortOrder">Urutan</Label>
              <Input
                id="edit-sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                placeholder="Urutan tampilan"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-status">Status Aktif</Label>
              <Switch
                id="edit-status"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
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
        title="Hapus Agama"
        description={`Apakah Anda yakin ingin menghapus agama "${selectedAgama?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
        onConfirm={submitDelete}
        loading={loading}
      />

      {/* Toggle Status Confirmation Dialog */}
      <ConfirmationDialog
        open={isToggleOpen}
        onOpenChange={setIsToggleOpen}
        title={`${selectedAgama?.isActive ? 'Nonaktifkan' : 'Aktifkan'} Agama`}
        description={`Apakah Anda yakin ingin ${selectedAgama?.isActive ? 'menonaktifkan' : 'mengaktifkan'} agama "${selectedAgama?.nama}"?`}
        confirmText={selectedAgama?.isActive ? 'Nonaktifkan' : 'Aktifkan'}
        cancelText="Batal"
        variant={selectedAgama?.isActive ? "destructive" : "default"}
        onConfirm={submitToggle}
        loading={loading}      />
      </div>
    </div>
  )
}
