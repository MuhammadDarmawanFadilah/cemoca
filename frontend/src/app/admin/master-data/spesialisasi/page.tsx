'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { ServerPagination } from '@/components/ServerPagination'
import { masterDataAPI, MasterSpesialisasiResponse } from '@/lib/api'
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
  Loader2,
  FileText,
  Settings,
  Stethoscope,
  FilterX,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'
import { useToast } from '@/hooks/use-toast'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import AdminFilters from "@/components/AdminFilters"

export default function SpesialisasiMasterDataPage() {
  // Data state
  const [spesialisasiList, setSpesialisasiList] = useState<MasterSpesialisasiResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSpesialisasi, setEditingSpesialisasi] = useState<MasterSpesialisasiResponse | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    nama: '',
    deskripsi: '',
    isActive: true
  })

  const { toast: toastHook } = useToast()

  const handleViewDetail = (spesialisasi: MasterSpesialisasiResponse) => {
    // Show toast with spesialisasi details
    toastHook({
      title: `Detail Spesialisasi: ${spesialisasi.nama}`,
      description: `Deskripsi: ${spesialisasi.deskripsi || 'Tidak ada deskripsi'} | Status: ${spesialisasi.isActive ? 'Aktif' : 'Nonaktif'}`,
    })
  }

  // Load data on component mount and when filters change
  useEffect(() => {
    loadSpesialisasiData()
  }, [currentPage, pageSize, searchTerm, selectedStatus])

  const loadSpesialisasiData = useCallback(async () => {
    try {
      setLoading(true)
      const isActive = selectedStatus === "active" ? true : selectedStatus === "inactive" ? false : undefined
      
      const response = await masterDataAPI.spesialisasi.getAll(
        searchTerm || undefined,
        isActive,
        currentPage,
        pageSize
      )
      
      setSpesialisasiList(response.content || [])
      setTotalElements(response.totalElements || 0)
      setTotalPages(response.totalPages || 0)
    } catch (error) {
      console.error('Error loading spesialisasi data:', error)
      toast.error('Gagal memuat data spesialisasi')
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, searchTerm, selectedStatus])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nama.trim()) {
      toast.error('Nama spesialisasi harus diisi')
      return
    }

    try {
      setLoading(true)
      if (editingSpesialisasi) {
        await masterDataAPI.spesialisasi.update(editingSpesialisasi.id, formData)
        toast.success('Spesialisasi berhasil diperbarui')
      } else {
        await masterDataAPI.spesialisasi.create(formData)
        toast.success('Spesialisasi berhasil ditambahkan')
      }
      
      setIsDialogOpen(false)
      resetForm()
      loadSpesialisasiData()
    } catch (error) {
      console.error('Error saving spesialisasi:', error)
      toast.error(editingSpesialisasi ? 'Gagal memperbarui spesialisasi' : 'Gagal menambahkan spesialisasi')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (spesialisasi: MasterSpesialisasiResponse) => {
    setEditingSpesialisasi(spesialisasi)
    setFormData({
      nama: spesialisasi.nama,
      deskripsi: spesialisasi.deskripsi || '',
      isActive: spesialisasi.isActive
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus spesialisasi ini?')) return
    
    try {
      setLoading(true)
      await masterDataAPI.spesialisasi.delete(id)
      toast.success('Spesialisasi berhasil dihapus')
      loadSpesialisasiData()
    } catch (error) {
      console.error('Error deleting spesialisasi:', error)
      toast.error('Gagal menghapus spesialisasi')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (spesialisasi: MasterSpesialisasiResponse) => {
    try {
      setLoading(true)
      await masterDataAPI.spesialisasi.update(spesialisasi.id, {
        ...spesialisasi,
        isActive: !spesialisasi.isActive
      })
      toast.success(`Status spesialisasi berhasil ${spesialisasi.isActive ? 'dinonaktifkan' : 'diaktifkan'}`)
      loadSpesialisasiData()
    } catch (error) {
      console.error('Error toggling status:', error)
      toast.error('Gagal mengubah status spesialisasi')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nama: '',
      deskripsi: '',
      isActive: true
    })
    setEditingSpesialisasi(null)
  }
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedStatus('all')
    setCurrentPage(0)
  }

  const hasActiveFilters = searchTerm || selectedStatus !== 'all'

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">      <AdminPageHeader
        icon={Stethoscope}
        title="Master Data Spesialisasi"
        description="Kelola data spesialisasi keahlian member"
        primaryAction={{
          label: "Tambah Spesialisasi",
          onClick: () => {
            setEditingSpesialisasi(null)
            resetForm()
            setIsDialogOpen(true)
          },
          icon: Plus
        }}
      />      <AdminFilters
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari berdasarkan nama spesialisasi..."
        filters={[
          {
            label: "Status",
            value: selectedStatus,
            onChange: setSelectedStatus,
            options: [
              { label: "Semua status", value: "all" },
              { label: "Aktif", value: "active" },
              { label: "Tidak Aktif", value: "inactive" },
            ]
          }
        ]}
        onClearFilters={clearFilters}
        activeFiltersCount={hasActiveFilters ? 1 : 0}
      />

        {/* Data Table Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Data Spesialisasi
                </CardTitle>
                <CardDescription>
                  {totalElements > 0 
                    ? `Menampilkan ${spesialisasiList.length} dari ${totalElements} data`
                    : 'Tidak ada data ditemukan'
                  }
                </CardDescription>              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      {editingSpesialisasi ? 'Edit Spesialisasi' : 'Tambah Spesialisasi Baru'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingSpesialisasi 
                        ? 'Perbarui informasi spesialisasi yang sudah ada'
                        : 'Tambahkan spesialisasi baru ke dalam sistem'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="nama" className="text-sm font-medium">
                        Nama Spesialisasi <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="nama"
                        placeholder="Masukkan nama spesialisasi"
                        value={formData.nama}
                        onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="deskripsi" className="text-sm font-medium">Deskripsi</Label>
                      <Textarea
                        id="deskripsi"
                        placeholder="Masukkan deskripsi spesialisasi"
                        value={formData.deskripsi}
                        onChange={(e) => setFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Status Aktif</Label>
                        <p className="text-xs text-muted-foreground">
                          Aktifkan spesialisasi ini untuk dapat digunakan
                        </p>
                      </div>
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                      />
                    </div>

                    <DialogFooter className="gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                        disabled={loading}
                      >
                        Batal
                      </Button>
                      <Button type="submit" disabled={loading} className="gap-2">
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {editingSpesialisasi ? 'Perbarui' : 'Simpan'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Nama</TableHead>
                    <TableHead className="font-semibold">Deskripsi</TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                    <TableHead className="font-semibold text-center w-[100px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Memuat data...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : spesialisasiList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <FileText className="h-8 w-8" />
                          <span>Tidak ada data spesialisasi</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    spesialisasiList.map((spesialisasi) => (
                      <TableRow key={spesialisasi.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{spesialisasi.nama}</TableCell>
                        <TableCell className="max-w-[300px]">
                          {spesialisasi.deskripsi ? (
                            <span className="text-sm">{spesialisasi.deskripsi}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={spesialisasi.isActive ? "default" : "secondary"}
                            className={spesialisasi.isActive ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100" : ""}
                          >
                            {spesialisasi.isActive ? (
                              <><CheckCircle className="h-3 w-3 mr-1" />Aktif</>
                            ) : (
                              <><XCircle className="h-3 w-3 mr-1" />Tidak Aktif</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewDetail(spesialisasi)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Detail
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(spesialisasi)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(spesialisasi)}>
                                {spesialisasi.isActive ? (
                                  <><XCircle className="mr-2 h-4 w-4" />Nonaktifkan</>
                                ) : (
                                  <><CheckCircle className="mr-2 h-4 w-4" />Aktifkan</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDelete(spesialisasi.id)}
                                className="text-destructive focus:text-destructive"
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
                </TableBody>
              </Table>
            </div>
              {totalElements > 0 && (
              <div className="mt-4">
                <ServerPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalElements={totalElements}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
