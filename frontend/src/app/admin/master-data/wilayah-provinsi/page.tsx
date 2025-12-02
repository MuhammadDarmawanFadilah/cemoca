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

interface WilayahProvinsi {
  kode: string
  nama: string
  createdAt: string
  updatedAt: string
}

interface WilayahAPIData {
  code: string
  name: string
}

export default function ProvinsiWilayahPage() {
  const [provinsiList, setProvinsiList] = useState<WilayahProvinsi[]>([])
  const [apiProvinsiList, setApiProvinsiList] = useState<WilayahAPIData[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedProvinsi, setSelectedProvinsi] = useState<WilayahProvinsi | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
    // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('nama')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  
  // Form state
  const [formData, setFormData] = useState({
    kode: '',
    nama: ''
  })
  
  useEffect(() => {
    setMounted(true)
    loadProvinsi()
    loadAPIProvinsi()
  }, [currentPage, pageSize, searchTerm, sortBy, sortDir])

  const loadAPIProvinsi = async () => {
    try {
      const response = await fetch(`${getApiUrl('/wilayah')}/provinces`)
      if (response.ok) {
        const result = await response.json()
        if (result.data) {
          setApiProvinsiList(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading API provinsi:', error)
    }
  }

  const loadProvinsi = async () => {
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

      const response = await fetch(`${getApiUrl('/admin/wilayah')}/provinsi?${params}`)
      
      if (response.ok) {
        const result = await response.json()
        setProvinsiList(result.content || [])
        setTotalPages(result.totalPages || 0)
        setTotalElements(result.totalElements || 0)
      } else {
        const error = await response.json()
        showErrorToast(error.error || 'Gagal memuat data provinsi')
      }
    } catch (error) {
      console.error('Error loading provinsi:', error)
      showErrorToast('Gagal memuat data provinsi')
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

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(0)
  }

  const handleCreate = () => {
    setFormData({ kode: '', nama: '' })
    setIsCreateOpen(true)
  }

  const handleEdit = (provinsi: WilayahProvinsi) => {
    setSelectedProvinsi(provinsi)
    setFormData({ kode: provinsi.kode, nama: provinsi.nama })
    setIsEditOpen(true)
  }

  const handleDelete = (provinsi: WilayahProvinsi) => {
    setSelectedProvinsi(provinsi)
    setIsDeleteOpen(true)
  }

  const submitCreate = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${getApiUrl('/admin/wilayah')}/provinsi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const result = await response.json()
        showSuccessToast(result.message || 'Provinsi berhasil ditambahkan')
        setIsCreateOpen(false)
        loadProvinsi()
      } else {
        const error = await response.json()
        showErrorToast(error.error || 'Gagal menambahkan provinsi')
      }
    } catch (error) {
      console.error('Error creating provinsi:', error)
      showErrorToast('Gagal menambahkan provinsi')
    } finally {
      setLoading(false)
    }
  }

  const submitEdit = async () => {
    if (!selectedProvinsi) return
    
    try {
      setLoading(true)
      const response = await fetch(`${getApiUrl('/admin/wilayah')}/provinsi/${selectedProvinsi.kode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nama: formData.nama })
      })

      if (response.ok) {
        const result = await response.json()
        showSuccessToast(result.message || 'Provinsi berhasil diperbarui')
        setIsEditOpen(false)
        loadProvinsi()
      } else {
        const error = await response.json()
        showErrorToast(error.error || 'Gagal memperbarui provinsi')
      }
    } catch (error) {
      console.error('Error updating provinsi:', error)
      showErrorToast('Gagal memperbarui provinsi')
    } finally {
      setLoading(false)
    }
  }

  const submitDelete = async () => {
    if (!selectedProvinsi) return
    
    try {
      setLoading(true)
      const response = await fetch(`${getApiUrl('/admin/wilayah')}/provinsi/${selectedProvinsi.kode}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const result = await response.json()
        showSuccessToast(result.message || 'Provinsi berhasil dihapus')
        setIsDeleteOpen(false)
        loadProvinsi()
      } else {
        const error = await response.json()
        showErrorToast(error.error || 'Gagal menghapus provinsi')
      }
    } catch (error) {
      console.error('Error deleting provinsi:', error)
      showErrorToast('Gagal menghapus provinsi')
    } finally {
      setLoading(false)
    }
  }

  const selectFromAPI = (apiData: WilayahAPIData) => {
    setFormData({
      kode: apiData.code,
      nama: apiData.name
    })
  }

  if (!mounted) return <LoadingSpinner />

  return (
    <div className="container mx-auto p-6 space-y-6">      <AdminPageHeader
        title="Master Data Provinsi"
        description="Kelola data provinsi berdasarkan cache biografi member"
        icon={MapPin}
      />

      <div className="flex justify-end mb-4">
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Tambah Provinsi
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
                  placeholder="Cari kode atau nama provinsi..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                />
              </div>
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
              Showing {provinsiList.length} of {totalElements} items
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provinsi Table */}
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
                      Nama Provinsi
                    </SortableHeader>
                  </TableHead>
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
                    <TableCell colSpan={4} className="text-center py-8">
                      <LoadingSpinner />
                    </TableCell>
                  </TableRow>
                ) : provinsiList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      Tidak ada data provinsi
                    </TableCell>
                  </TableRow>
                ) : (
                  provinsiList.map((provinsi) => (
                    <TableRow key={provinsi.kode}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {provinsi.kode}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {provinsi.nama}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(provinsi.createdAt).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(provinsi)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(provinsi)}
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
      />

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Tambah Provinsi Baru</DialogTitle>
            <DialogDescription>
              Pilih dari data wilayah.id atau masukkan data manual
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Manual Input */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Input Manual</h4>
              <div className="space-y-2">
                <Label htmlFor="kode">Kode Provinsi</Label>
                <Input
                  id="kode"
                  value={formData.kode}
                  onChange={(e) => setFormData(prev => ({ ...prev, kode: e.target.value }))}
                  placeholder="Contoh: 11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Provinsi</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                  placeholder="Contoh: ACEH"
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
                {apiProvinsiList.map((api) => (
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
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={submitCreate} 
              disabled={!formData.kode || !formData.nama || loading}
            >
              {loading ? <LoadingSpinner className="mr-2" /> : <Database className="mr-2 h-4 w-4" />}
              Simpan
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
              Perbarui data provinsi (kode tidak dapat diubah)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-kode">Kode Provinsi</Label>
              <Input
                id="edit-kode"
                value={formData.kode}
                disabled
                className="bg-gray-100 dark:bg-gray-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nama">Nama Provinsi</Label>
              <Input
                id="edit-nama"
                value={formData.nama}
                onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                placeholder="Nama provinsi"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={submitEdit} 
              disabled={!formData.nama || loading}
            >
              {loading ? <LoadingSpinner className="mr-2" /> : null}
              Perbarui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>      {/* Delete Dialog */}
      <ConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={submitDelete}
        title="Hapus Provinsi"
        description={`Apakah Anda yakin ingin menghapus provinsi "${selectedProvinsi?.nama}"? Aksi ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
      />
    </div>
  )
}
