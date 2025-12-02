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
import { masterDataAPI, MasterHobiResponse } from '@/lib/api'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  MoreHorizontal, 
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'

export default function HobiMasterDataPage() {
  const [hobiList, setHobiList] = useState<MasterHobiResponse[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingHobi, setEditingHobi] = useState<MasterHobiResponse | null>(null)
    // Filter and search states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  // Form data
  const [formData, setFormData] = useState({
    nama: '',
    kategori: '',
    deskripsi: '',
    isActive: true,
    sortOrder: 0
  })

  useEffect(() => {
    loadHobiData()
    loadCategories()
  }, [currentPage, pageSize, searchTerm, selectedCategory, statusFilter])
  const loadHobiData = async () => {
    try {
      setLoading(true)
      const isActiveFilter = statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined
      
      const response = await masterDataAPI.hobi.getAll(
        searchTerm || undefined,
        selectedCategory === 'ALL' ? undefined : selectedCategory || undefined,
        isActiveFilter,
        currentPage,
        pageSize
      )
      
      setHobiList(response.content || [])
      setTotalElements(response.totalElements || 0)
      setTotalPages(response.totalPages || 0)
    } catch (error) {
      console.error('Error loading hobi data:', error)
      toast.error('Gagal memuat data hobi')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await masterDataAPI.hobi.getCategories()
      setCategories(response || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      nama: '',
      kategori: '',
      deskripsi: '',
      isActive: true,
      sortOrder: 0
    })
    setEditingHobi(null)
  }

  const handleAddNew = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEdit = (hobi: MasterHobiResponse) => {
    setFormData({
      nama: hobi.nama,
      kategori: hobi.kategori || '',
      deskripsi: hobi.deskripsi || '',
      isActive: hobi.isActive,
      sortOrder: hobi.sortOrder
    })
    setEditingHobi(hobi)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nama.trim()) {
      toast.error('Nama hobi wajib diisi')
      return
    }

    try {
      setLoading(true)
      
      if (editingHobi) {
        await masterDataAPI.hobi.update(editingHobi.id, formData)
        toast.success('Data hobi berhasil diperbarui')
      } else {
        await masterDataAPI.hobi.create(formData)
        toast.success('Data hobi berhasil ditambahkan')
      }
      
      setIsDialogOpen(false)
      resetForm()
      loadHobiData()
      if (!editingHobi) {
        loadCategories() // Refresh categories if new one was added
      }
    } catch (error) {
      console.error('Error saving hobi:', error)
      toast.error('Gagal menyimpan data hobi')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data hobi ini?')) {
      return
    }

    try {
      setLoading(true)
      await masterDataAPI.hobi.delete(id)
      toast.success('Data hobi berhasil dihapus')
      loadHobiData()
      loadCategories() // Refresh categories
    } catch (error) {
      console.error('Error deleting hobi:', error)
      toast.error('Gagal menghapus data hobi')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: number) => {
    try {
      setLoading(true)
      await masterDataAPI.hobi.toggleActive(id)
      toast.success('Status hobi berhasil diubah')
      loadHobiData()
    } catch (error) {
      console.error('Error toggling hobi status:', error)
      toast.error('Gagal mengubah status hobi')
    } finally {
      setLoading(false)
    }
  }
  const handleClearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('ALL')
    setStatusFilter('ALL')
    setCurrentPage(0)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(0)
  }

  const canPreviousPage = currentPage > 0
  const canNextPage = currentPage < totalPages - 1

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Master Data Hobi</h1>          <p className="text-muted-foreground">
            Kelola data hobi untuk Sistem Cemoca
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Hobi
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingHobi ? 'Edit Hobi' : 'Tambah Hobi Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Hobi *</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                  placeholder="Masukkan nama hobi"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="kategori">Kategori</Label>
                <Input
                  id="kategori"
                  value={formData.kategori}
                  onChange={(e) => setFormData(prev => ({ ...prev, kategori: e.target.value }))}
                  placeholder="Masukkan kategori hobi"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deskripsi">Deskripsi</Label>
                <Input
                  id="deskripsi"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
                  placeholder="Masukkan deskripsi hobi"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Urutan</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                  placeholder="Masukkan urutan tampil"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Status Aktif</Label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Menyimpan...' : editingHobi ? 'Perbarui' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="search">Cari Hobi</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Cari berdasarkan nama hobi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Kategori</Label>              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Kategori</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">              <Button
                variant="outline"
                onClick={handleClearFilters}
                disabled={!searchTerm && selectedCategory === 'ALL' && statusFilter === 'ALL'}
              >
                <Filter className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                variant="outline"
                onClick={loadHobiData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Hobi</CardTitle>
          <CardDescription>
            Total: {totalElements} hobi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">No</TableHead>
                  <TableHead>Nama Hobi</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Urutan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Memuat data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : hobiList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="text-muted-foreground">Tidak ada data hobi</div>
                        <Button variant="outline" onClick={handleAddNew} size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Tambah Hobi Pertama
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  hobiList.map((hobi, index) => (
                    <TableRow key={hobi.id}>
                      <TableCell>{currentPage * pageSize + index + 1}</TableCell>
                      <TableCell className="font-medium">{hobi.nama}</TableCell>
                      <TableCell>
                        {hobi.kategori ? (
                          <Badge variant="outline">{hobi.kategori}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {hobi.deskripsi ? (
                          <div className="max-w-[200px] truncate" title={hobi.deskripsi}>
                            {hobi.deskripsi}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{hobi.sortOrder}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={hobi.isActive ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => handleToggleActive(hobi.id)}
                        >
                          {hobi.isActive ? (
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
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Buka menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(hobi)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(hobi.id)}>
                              {hobi.isActive ? (
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
                              onClick={() => handleDelete(hobi.id)}
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
          {totalElements > 0 && (
            <div className="mt-4">
              <DataTablePagination
                pageIndex={currentPage}
                pageSize={pageSize}
                pageCount={totalPages}
                totalCount={totalElements}
                canPreviousPage={canPreviousPage}
                canNextPage={canNextPage}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
