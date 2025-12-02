'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { masterDataAPI, MasterPosisiResponse } from '@/lib/api'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  MoreHorizontal, 
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

export default function PosisiMasterDataPage() {
  // Data state
  const [posisiList, setPosisiList] = useState<MasterPosisiResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedKategori, setSelectedKategori] = useState<string>("ALL")
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL")
  const [categories, setCategories] = useState<string[]>([])
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPosisi, setEditingPosisi] = useState<MasterPosisiResponse | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    nama: '',
    deskripsi: '',
    kategori: '',
    isActive: true
  })

  // Load data on component mount and when filters change
  useEffect(() => {
    loadPosisiData()
  }, [currentPage, pageSize, searchTerm, selectedKategori, selectedStatus])

  // Load categories on component mount
  useEffect(() => {
    loadCategories()
  }, [])

  const loadPosisiData = useCallback(async () => {
    try {
      setLoading(true)
      const isActive = selectedStatus === "active" ? true : selectedStatus === "inactive" ? false : undefined
        const response = await masterDataAPI.posisi.getAll(
        searchTerm || undefined,
        selectedKategori === "ALL" ? undefined : selectedKategori || undefined,
        isActive,
        currentPage,
        pageSize
      )
      
      setPosisiList(response.content || [])
      setTotalElements(response.totalElements || 0)
      setTotalPages(response.totalPages || 0)
    } catch (error) {
      console.error('Error loading posisi data:', error)
      toast.error('Gagal memuat data posisi')
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, searchTerm, selectedKategori, selectedStatus])

  const loadCategories = async () => {
    try {
      const response = await masterDataAPI.posisi.getCategories()
      // Filter out empty strings, null values, and undefined values
      const validCategories = (response || [])
        .filter(cat => cat != null && cat !== undefined && typeof cat === 'string' && cat.trim() !== '')
        .map(cat => cat.trim()) // Also trim whitespace
      
      // Add default categories if no categories exist
      if (validCategories.length === 0) {
        const defaultCategories = [
          "Kesehatan",
          "Teknologi",
          "Pendidikan", 
          "Bisnis",
          "Pemerintahan",
          "Non-Profit",
          "Penelitian",
          "Konsultan",
          "Industri",
          "Jasa"
        ]
        setCategories(defaultCategories)
      } else {
        setCategories(validCategories)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      // Set default categories on error
      const defaultCategories = [
        "Kesehatan",
        "Teknologi", 
        "Pendidikan",
        "Bisnis",
        "Pemerintahan",
        "Non-Profit",
        "Penelitian",
        "Konsultan",
        "Industri",
        "Jasa"
      ]
      setCategories(defaultCategories)
    }
  }

  const resetForm = () => {
    setFormData({
      nama: '',
      deskripsi: '',
      kategori: '',
      isActive: true
    })
    setEditingPosisi(null)
  }

  const handleEdit = (posisi: MasterPosisiResponse) => {
    setEditingPosisi(posisi)
    setFormData({
      nama: posisi.nama,
      deskripsi: posisi.deskripsi || '',
      kategori: posisi.kategori || '',
      isActive: posisi.isActive
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nama.trim()) {
      toast.error('Nama posisi wajib diisi')
      return
    }

    if (!formData.kategori.trim()) {
      toast.error('Kategori wajib diisi')
      return
    }

    try {
      setLoading(true)
      
      if (editingPosisi) {
        await masterDataAPI.posisi.update(editingPosisi.id, formData)
        toast.success('Data posisi berhasil diperbarui')
      } else {
        await masterDataAPI.posisi.create(formData)
        toast.success('Data posisi berhasil ditambahkan')
      }
      
      setIsDialogOpen(false)
      resetForm()
      loadPosisiData()
      if (!editingPosisi) {
        loadCategories() // Refresh categories if new one was added
      }
    } catch (error) {
      console.error('Error saving posisi:', error)
      toast.error('Gagal menyimpan data posisi')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data posisi ini?')) {
      return
    }

    try {
      setLoading(true)
      await masterDataAPI.posisi.delete(id)
      toast.success('Data posisi berhasil dihapus')
      loadPosisiData()
      loadCategories() // Refresh categories
    } catch (error) {
      console.error('Error deleting posisi:', error)
      toast.error('Gagal menghapus data posisi')
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async (posisi: MasterPosisiResponse) => {
    try {
      setLoading(true)
      await masterDataAPI.posisi.toggleActive(posisi.id)
      toast.success(`Status posisi berhasil ${posisi.isActive ? 'dinonaktifkan' : 'diaktifkan'}`)
      loadPosisiData()
    } catch (error) {
      console.error('Error toggling status:', error)
      toast.error('Gagal mengubah status posisi')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(0) // Reset to first page when changing page size
  }
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedKategori('ALL')
    setSelectedStatus('ALL')
    setCurrentPage(0)
  }

  // Handle kategori change with validation
  const handleKategoriChange = (value: string) => {
    setSelectedKategori(value || 'ALL')
  }

  // Handle status change with validation  
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value || 'ALL')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master Data Posisi</h1>
          <p className="text-muted-foreground">
            Kelola data posisi dan pekerjaan member
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Master Data Posisi & Pekerjaan</CardTitle>
          <CardDescription>
            Daftar semua posisi dan pekerjaan yang tersedia dalam sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="search">Cari Posisi</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Cari berdasarkan nama..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="kategori">Kategori</Label>
                <Select value={selectedKategori || "ALL"} onValueChange={handleKategoriChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua kategori" />
                  </SelectTrigger>                  <SelectContent>
                    <SelectItem value="ALL">Semua kategori</SelectItem>
                    {categories
                      .filter(kategori => kategori && typeof kategori === 'string' && kategori.trim() !== '')
                      .map((kategori) => (
                        <SelectItem key={kategori} value={kategori || 'default'}>
                          {kategori}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="status">Status</Label>
                <Select value={selectedStatus || "ALL"} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua status" />
                  </SelectTrigger>                  <SelectContent>
                    <SelectItem value="ALL">Semua status</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearFilters}
                size="sm"
              >
                <Filter className="h-4 w-4 mr-2" />
                Reset Filter
              </Button>
              
              <Button
                variant="outline"
                onClick={loadPosisiData}
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetForm(); setIsDialogOpen(true) }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Posisi
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPosisi ? 'Edit Posisi' : 'Tambah Posisi Baru'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nama">Nama Posisi *</Label>
                      <Input
                        id="nama"
                        value={formData.nama}
                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                        placeholder="Masukkan nama posisi"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="kategori">Kategori *</Label>
                      <Select 
                        value={formData.kategori || ""} 
                        onValueChange={(value) => setFormData({ ...formData, kategori: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih atau buat kategori baru" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.length > 0 && categories.map((kategori) => (
                            <SelectItem key={kategori} value={kategori}>
                              {kategori}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="text-sm text-muted-foreground">
                        Atau ketik kategori baru (wajib diisi):
                      </div>
                      <Input
                        placeholder="Masukkan kategori baru"
                        value={formData.kategori}
                        onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                        required
                        className={!formData.kategori.trim() ? "border-red-300" : ""}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deskripsi">Deskripsi</Label>
                      <Input
                        id="deskripsi"
                        value={formData.deskripsi}
                        onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                        placeholder="Masukkan deskripsi posisi"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      />
                      <Label htmlFor="isActive">Status Aktif</Label>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Batal
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingPosisi ? 'Update' : 'Simpan'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">No</TableHead>
                  <TableHead>Nama Posisi</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        Memuat data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : posisiList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Tidak ada data posisi ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  posisiList.map((posisi, index) => (
                    <TableRow key={posisi.id}>
                      <TableCell className="font-medium">
                        {currentPage * pageSize + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{posisi.nama}</TableCell>
                      <TableCell>
                        {posisi.kategori && (
                          <Badge variant="secondary">{posisi.kategori}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {posisi.deskripsi || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={posisi.isActive ? "default" : "secondary"}
                          className={posisi.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {posisi.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Aktif
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Tidak Aktif
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(posisi)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleStatus(posisi)}>
                              {posisi.isActive ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Nonaktifkan
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Aktifkan
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(posisi.id)}
                              className="text-red-600"
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
          <div className="mt-4">
            <DataTablePagination
              pageIndex={currentPage}
              pageSize={pageSize}
              pageCount={totalPages}
              totalCount={totalElements}
              canPreviousPage={currentPage > 0}
              canNextPage={currentPage < totalPages - 1}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
