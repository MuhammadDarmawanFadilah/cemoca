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
import { Search, Plus, MoreHorizontal, Edit, Trash2, Briefcase, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

// Temporary data structure for posisi jabatan
interface PosisiJabatanData {
  id: number
  nama: string
  deskripsi?: string
  isActive: boolean
}

// Static posisi jabatan data (should be replaced with backend API)
const POSISI_JABATAN_DATA: PosisiJabatanData[] = [
  { id: 1, nama: 'CEO', deskripsi: 'Chief Executive Officer', isActive: true },
  { id: 2, nama: 'CTO', deskripsi: 'Chief Technology Officer', isActive: true },
  { id: 3, nama: 'CFO', deskripsi: 'Chief Financial Officer', isActive: true },
  { id: 4, nama: 'HR Manager', deskripsi: 'Human Resources Manager', isActive: true },
  { id: 5, nama: 'Software Engineer', deskripsi: 'Software Developer', isActive: true },
  { id: 6, nama: 'Product Manager', deskripsi: 'Product Management', isActive: true },
  { id: 7, nama: 'Marketing Manager', deskripsi: 'Marketing Department Head', isActive: true },
  { id: 8, nama: 'Sales Manager', deskripsi: 'Sales Department Head', isActive: true },
]

export default function PosisiJabatanMasterDataPage() {
  const [posisiJabatanList, setPosisiJabatanList] = useState<PosisiJabatanData[]>(POSISI_JABATAN_DATA)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedPosisiJabatan, setSelectedPosisiJabatan] = useState<PosisiJabatanData | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    nama: '',
    deskripsi: '',
    isActive: true
  })
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Filtered and paginated data
  const { filteredData, totalPages, paginatedData } = useMemo(() => {
    const filtered = posisiJabatanList.filter(posisi =>
      posisi.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (posisi.deskripsi && posisi.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    
    const total = Math.ceil(filtered.length / pageSize)
    const startIndex = currentPage * pageSize
    const paginated = filtered.slice(startIndex, startIndex + pageSize)
    
    return {
      filteredData: filtered,
      totalPages: total,
      paginatedData: paginated
    }
  }, [posisiJabatanList, searchTerm, currentPage, pageSize])

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(0)
  }, [searchTerm])

  const resetForm = () => {
    setFormData({
      nama: '',
      deskripsi: '',
      isActive: true
    })
    setSelectedPosisiJabatan(null)
  }

  const handleCreate = () => {
    resetForm()
    setIsCreateOpen(true)
  }

  const handleEdit = (posisi: PosisiJabatanData) => {
    setSelectedPosisiJabatan(posisi)
    setFormData({
      nama: posisi.nama,
      deskripsi: posisi.deskripsi || '',
      isActive: posisi.isActive
    })
    setIsEditOpen(true)
  }

  const handleDelete = (posisi: PosisiJabatanData) => {
    setSelectedPosisiJabatan(posisi)
    setIsDeleteOpen(true)
  }

  const submitCreate = () => {
    if (!formData.nama.trim()) {
      toast.error('Nama posisi jabatan harus diisi')
      return
    }

    const newPosisiJabatan: PosisiJabatanData = {
      id: Math.max(...posisiJabatanList.map(p => p.id)) + 1,
      nama: formData.nama.trim(),
      deskripsi: formData.deskripsi.trim() || undefined,
      isActive: formData.isActive
    }

    setPosisiJabatanList([...posisiJabatanList, newPosisiJabatan])
    toast.success('Posisi jabatan berhasil ditambahkan (data lokal)')
    setIsCreateOpen(false)
    resetForm()
  }

  const submitEdit = () => {
    if (!selectedPosisiJabatan || !formData.nama.trim()) {
      toast.error('Data tidak valid')
      return
    }

    const updatedList = posisiJabatanList.map(posisi =>
      posisi.id === selectedPosisiJabatan.id
        ? { ...posisi, nama: formData.nama.trim(), deskripsi: formData.deskripsi.trim() || undefined, isActive: formData.isActive }
        : posisi
    )

    setPosisiJabatanList(updatedList)
    toast.success('Posisi jabatan berhasil diperbarui (data lokal)')
    setIsEditOpen(false)
    resetForm()
  }

  const submitDelete = () => {
    if (!selectedPosisiJabatan) return

    const updatedList = posisiJabatanList.filter(posisi => posisi.id !== selectedPosisiJabatan.id)
    setPosisiJabatanList(updatedList)
    toast.success('Posisi jabatan berhasil dihapus (data lokal)')
    setIsDeleteOpen(false)
    setSelectedPosisiJabatan(null)
  }

  const toggleStatus = (posisi: PosisiJabatanData) => {
    const updatedList = posisiJabatanList.map(item =>
      item.id === posisi.id ? { ...item, isActive: !item.isActive } : item
    )
    setPosisiJabatanList(updatedList)
    toast.success(`Posisi jabatan berhasil ${!posisi.isActive ? 'diaktifkan' : 'dinonaktifkan'} (data lokal)`)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Master Data Posisi Jabatan</h1>
        </div>
        <p className="text-muted-foreground">
          Kelola data posisi jabatan dalam sistem
        </p>
      </div>

      {/* Warning Notice */}
      <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <AlertTriangle className="h-5 w-5" />
            <div className="text-sm">
              <strong>Perhatian:</strong> Halaman ini menggunakan data lokal sementara. 
              API backend untuk master data posisi jabatan belum tersedia dan perlu diimplementasikan.
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Posisi Jabatan</CardTitle>
          <CardDescription>
            Daftar posisi jabatan yang tersedia dalam sistem (data lokal)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Add Button */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="search">Cari Posisi Jabatan</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Nama posisi atau deskripsi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {filteredData.length} dari {posisiJabatanList.length} posisi jabatan
              </Badge>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Posisi Jabatan
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Posisi Jabatan</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Briefcase className="h-8 w-8 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {searchTerm ? 'Tidak ada posisi jabatan yang ditemukan' : 'Belum ada data posisi jabatan'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((posisi) => (
                    <TableRow key={posisi.id}>
                      <TableCell className="font-medium">{posisi.nama}</TableCell>
                      <TableCell className="text-muted-foreground">{posisi.deskripsi || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={posisi.isActive}
                            onCheckedChange={() => toggleStatus(posisi)}
                          />
                          <Badge variant={posisi.isActive ? "default" : "secondary"}>
                            {posisi.isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(posisi)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(posisi)}
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
          {totalPages > 1 && (
            <div className="mt-6">
              <DataTablePagination
                pageIndex={currentPage}
                pageSize={pageSize}
                pageCount={totalPages}
                totalCount={filteredData.length}
                canPreviousPage={currentPage > 0}
                canNextPage={currentPage < totalPages - 1}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size)
                  setCurrentPage(0)
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Posisi Jabatan Baru</DialogTitle>
            <DialogDescription>
              Tambahkan posisi jabatan baru ke dalam sistem (data lokal)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid items-center gap-2">
              <Label htmlFor="create-nama">Nama Posisi Jabatan</Label>
              <Input
                id="create-nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Masukkan nama posisi jabatan"
              />
            </div>
            <div className="grid items-center gap-2">
              <Label htmlFor="create-deskripsi">Deskripsi (Opsional)</Label>
              <Input
                id="create-deskripsi"
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                placeholder="Masukkan deskripsi posisi jabatan"
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
            <DialogTitle>Edit Posisi Jabatan</DialogTitle>
            <DialogDescription>
              Perbarui informasi posisi jabatan (data lokal)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid items-center gap-2">
              <Label htmlFor="edit-nama">Nama Posisi Jabatan</Label>
              <Input
                id="edit-nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Masukkan nama posisi jabatan"
              />
            </div>
            <div className="grid items-center gap-2">
              <Label htmlFor="edit-deskripsi">Deskripsi (Opsional)</Label>
              <Input
                id="edit-deskripsi"
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                placeholder="Masukkan deskripsi posisi jabatan"
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
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Posisi Jabatan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus posisi jabatan &quot;{selectedPosisiJabatan?.nama}&quot;? 
              Tindakan ini tidak dapat dibatalkan (data lokal).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={submitDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
