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
import { Search, Plus, MoreHorizontal, Edit, Trash2, Stethoscope, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

// Temporary data structure for spesialisasi kedokteran
interface SpesialisasiKedokteranData {
  id: number
  nama: string
  deskripsi?: string
  isActive: boolean
}

// Static spesialisasi kedokteran data (should be replaced with backend API)
const SPESIALISASI_KEDOKTERAN_DATA: SpesialisasiKedokteranData[] = [
  { id: 1, nama: 'Kardiologi', deskripsi: 'Spesialis Jantung dan Pembuluh Darah', isActive: true },
  { id: 2, nama: 'Neurologi', deskripsi: 'Spesialis Saraf', isActive: true },
  { id: 3, nama: 'Ortopedi', deskripsi: 'Spesialis Tulang dan Sendi', isActive: true },
  { id: 4, nama: 'Dermatologi', deskripsi: 'Spesialis Kulit dan Kelamin', isActive: true },
  { id: 5, nama: 'Obstetri dan Ginekologi', deskripsi: 'Spesialis Kandungan', isActive: true },
  { id: 6, nama: 'Pediatri', deskripsi: 'Spesialis Anak', isActive: true },
  { id: 7, nama: 'Oftalmologi', deskripsi: 'Spesialis Mata', isActive: true },
  { id: 8, nama: 'THT-KL', deskripsi: 'Spesialis Telinga Hidung Tenggorokan-Kepala Leher', isActive: true },
  { id: 9, nama: 'Anestesiologi', deskripsi: 'Spesialis Anestesi dan Terapi Intensif', isActive: true },
  { id: 10, nama: 'Radiologi', deskripsi: 'Spesialis Radiologi', isActive: true },
]

export default function SpesialisasiKedokteranMasterDataPage() {
  const [spesialisasiList, setSpesialisasiList] = useState<SpesialisasiKedokteranData[]>(SPESIALISASI_KEDOKTERAN_DATA)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedSpesialisasi, setSelectedSpesialisasi] = useState<SpesialisasiKedokteranData | null>(null)
  
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
    const filtered = spesialisasiList.filter(spesialisasi =>
      spesialisasi.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (spesialisasi.deskripsi && spesialisasi.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    
    const total = Math.ceil(filtered.length / pageSize)
    const startIndex = currentPage * pageSize
    const paginated = filtered.slice(startIndex, startIndex + pageSize)
    
    return {
      filteredData: filtered,
      totalPages: total,
      paginatedData: paginated
    }
  }, [spesialisasiList, searchTerm, currentPage, pageSize])

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
    setSelectedSpesialisasi(null)
  }

  const handleCreate = () => {
    resetForm()
    setIsCreateOpen(true)
  }

  const handleEdit = (spesialisasi: SpesialisasiKedokteranData) => {
    setSelectedSpesialisasi(spesialisasi)
    setFormData({
      nama: spesialisasi.nama,
      deskripsi: spesialisasi.deskripsi || '',
      isActive: spesialisasi.isActive
    })
    setIsEditOpen(true)
  }

  const handleDelete = (spesialisasi: SpesialisasiKedokteranData) => {
    setSelectedSpesialisasi(spesialisasi)
    setIsDeleteOpen(true)
  }

  const submitCreate = () => {
    if (!formData.nama.trim()) {
      toast.error('Nama spesialisasi kedokteran harus diisi')
      return
    }

    const newSpesialisasi: SpesialisasiKedokteranData = {
      id: Math.max(...spesialisasiList.map(s => s.id)) + 1,
      nama: formData.nama.trim(),
      deskripsi: formData.deskripsi.trim() || undefined,
      isActive: formData.isActive
    }

    setSpesialisasiList([...spesialisasiList, newSpesialisasi])
    toast.success('Spesialisasi kedokteran berhasil ditambahkan (data lokal)')
    setIsCreateOpen(false)
    resetForm()
  }

  const submitEdit = () => {
    if (!selectedSpesialisasi || !formData.nama.trim()) {
      toast.error('Data tidak valid')
      return
    }

    const updatedList = spesialisasiList.map(spesialisasi =>
      spesialisasi.id === selectedSpesialisasi.id
        ? { ...spesialisasi, nama: formData.nama.trim(), deskripsi: formData.deskripsi.trim() || undefined, isActive: formData.isActive }
        : spesialisasi
    )

    setSpesialisasiList(updatedList)
    toast.success('Spesialisasi kedokteran berhasil diperbarui (data lokal)')
    setIsEditOpen(false)
    resetForm()
  }

  const submitDelete = () => {
    if (!selectedSpesialisasi) return

    const updatedList = spesialisasiList.filter(spesialisasi => spesialisasi.id !== selectedSpesialisasi.id)
    setSpesialisasiList(updatedList)
    toast.success('Spesialisasi kedokteran berhasil dihapus (data lokal)')
    setIsDeleteOpen(false)
    setSelectedSpesialisasi(null)
  }

  const toggleStatus = (spesialisasi: SpesialisasiKedokteranData) => {
    const updatedList = spesialisasiList.map(item =>
      item.id === spesialisasi.id ? { ...item, isActive: !item.isActive } : item
    )
    setSpesialisasiList(updatedList)
    toast.success(`Spesialisasi kedokteran berhasil ${!spesialisasi.isActive ? 'diaktifkan' : 'dinonaktifkan'} (data lokal)`)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Stethoscope className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Master Data Spesialisasi Kedokteran</h1>
        </div>
        <p className="text-muted-foreground">
          Kelola data spesialisasi kedokteran dalam sistem
        </p>
      </div>

      {/* Warning Notice */}
      <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <AlertTriangle className="h-5 w-5" />
            <div className="text-sm">
              <strong>Perhatian:</strong> Halaman ini menggunakan data lokal sementara. 
              API backend untuk master data spesialisasi kedokteran belum tersedia dan perlu diimplementasikan.
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Spesialisasi Kedokteran</CardTitle>
          <CardDescription>
            Daftar spesialisasi kedokteran yang tersedia dalam sistem (data lokal)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Add Button */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="search">Cari Spesialisasi Kedokteran</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Nama spesialisasi atau deskripsi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {filteredData.length} dari {spesialisasiList.length} spesialisasi
              </Badge>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Spesialisasi
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Spesialisasi</TableHead>
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
                        <Stethoscope className="h-8 w-8 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {searchTerm ? 'Tidak ada spesialisasi kedokteran yang ditemukan' : 'Belum ada data spesialisasi kedokteran'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((spesialisasi) => (
                    <TableRow key={spesialisasi.id}>
                      <TableCell className="font-medium">{spesialisasi.nama}</TableCell>
                      <TableCell className="text-muted-foreground">{spesialisasi.deskripsi || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={spesialisasi.isActive}
                            onCheckedChange={() => toggleStatus(spesialisasi)}
                          />
                          <Badge variant={spesialisasi.isActive ? "default" : "secondary"}>
                            {spesialisasi.isActive ? "Aktif" : "Nonaktif"}
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
                            <DropdownMenuItem onClick={() => handleEdit(spesialisasi)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(spesialisasi)}
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
            <DialogTitle>Tambah Spesialisasi Kedokteran Baru</DialogTitle>
            <DialogDescription>
              Tambahkan spesialisasi kedokteran baru ke dalam sistem (data lokal)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid items-center gap-2">
              <Label htmlFor="create-nama">Nama Spesialisasi</Label>
              <Input
                id="create-nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Masukkan nama spesialisasi kedokteran"
              />
            </div>
            <div className="grid items-center gap-2">
              <Label htmlFor="create-deskripsi">Deskripsi (Opsional)</Label>
              <Input
                id="create-deskripsi"
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                placeholder="Masukkan deskripsi spesialisasi"
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
            <DialogTitle>Edit Spesialisasi Kedokteran</DialogTitle>
            <DialogDescription>
              Perbarui informasi spesialisasi kedokteran (data lokal)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid items-center gap-2">
              <Label htmlFor="edit-nama">Nama Spesialisasi</Label>
              <Input
                id="edit-nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Masukkan nama spesialisasi kedokteran"
              />
            </div>
            <div className="grid items-center gap-2">
              <Label htmlFor="edit-deskripsi">Deskripsi (Opsional)</Label>
              <Input
                id="edit-deskripsi"
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                placeholder="Masukkan deskripsi spesialisasi"
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
            <DialogTitle>Hapus Spesialisasi Kedokteran</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus spesialisasi kedokteran &quot;{selectedSpesialisasi?.nama}&quot;? 
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
