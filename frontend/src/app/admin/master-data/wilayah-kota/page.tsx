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
import { Search, Building2, Plus, Edit, Trash2, ExternalLink, Database } from 'lucide-react'

interface WilayahKota {
  kode: string
  nama: string
  provinsiKode: string
  createdAt: string
  updatedAt: string
}

interface WilayahProvinsi {
  kode: string
  nama: string
}

interface WilayahAPIData {
  code: string
  name: string
}

export default function KotaWilayahPage() {
  const [kotaList, setKotaList] = useState<WilayahKota[]>([])
  const [provinsiList, setProvinsiList] = useState<WilayahProvinsi[]>([])
  const [apiKotaList, setApiKotaList] = useState<WilayahAPIData[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedKota, setSelectedKota] = useState<WilayahKota | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProvinsi, setSelectedProvinsi] = useState('')
  const [sortBy, setSortBy] = useState('nama')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  
  // Form state
  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    provinsiKode: ''
  })
  
  useEffect(() => {
    setMounted(true)
    loadKota()
    loadProvinsi()
  }, [currentPage, pageSize, searchTerm, selectedProvinsi, sortBy, sortDir])

  const loadProvinsi = async () => {
    try {
      const response = await fetch(`${getApiUrl('/admin/wilayah')}/provinsi?size=1000`)
      if (response.ok) {
        const result = await response.json()
        setProvinsiList(result.content || [])
      }
    } catch (error) {
      console.error('Error loading provinsi:', error)
    }
  }

  const loadAPIKota = async (provinsiKode: string) => {
    if (!provinsiKode) return
    
    try {
      const response = await fetch(`${getApiUrl('/wilayah')}/regencies/${provinsiKode}`)
      if (response.ok) {
        const result = await response.json()
        if (result.data) {
          setApiKotaList(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading API kota:', error)
    }
  }

  const loadKota = async () => {
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
      
      if (selectedProvinsi) {
        params.append('provinsiKode', selectedProvinsi)
      }

      const response = await fetch(`${getApiUrl('/admin/wilayah')}/kota?${params}`)
      
      if (response.ok) {
        const result = await response.json()
        setKotaList(result.content || [])
        setTotalPages(result.totalPages || 0)
        setTotalElements(result.totalElements || 0)
      } else {
        const error = await response.json()
        showErrorToast(error.error || 'Gagal memuat data kota')
      }
    } catch (error) {
      console.error('Error loading kota:', error)
      showErrorToast('Gagal memuat data kota')
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
  const handleProvinsiFilterChange = (value: string) => {
    const provinsiValue = value === 'all' ? '' : value
    setSelectedProvinsi(provinsiValue)
    setCurrentPage(0)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(0)
  }

  const handleCreate = () => {
    setFormData({ kode: '', nama: '', provinsiKode: '' })
    setApiKotaList([])
    setIsCreateOpen(true)
  }

  const handleEdit = (kota: WilayahKota) => {
    setSelectedKota(kota)
    setFormData({ kode: kota.kode, nama: kota.nama, provinsiKode: kota.provinsiKode })
    setIsEditOpen(true)
  }

  const handleDelete = (kota: WilayahKota) => {
    setSelectedKota(kota)
    setIsDeleteOpen(true)
  }

  const submitCreate = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${getApiUrl('/admin/wilayah')}/kota`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const result = await response.json()
        showSuccessToast(result.message || 'Kota berhasil ditambahkan')
        setIsCreateOpen(false)
        loadKota()
      } else {
        const error = await response.json()
        showErrorToast(error.error || 'Gagal menambahkan kota')
      }
    } catch (error) {
      console.error('Error creating kota:', error)
      showErrorToast('Gagal menambahkan kota')
    } finally {
      setLoading(false)
    }
  }

  const selectFromAPI = (apiData: WilayahAPIData) => {
    setFormData(prev => ({
      ...prev,
      kode: apiData.code,
      nama: apiData.name
    }))
  }

  const getProvinsiName = (kode: string) => {
    const provinsi = provinsiList.find(p => p.kode === kode)
    return provinsi?.nama || kode
  }

  if (!mounted) return <LoadingSpinner />

  return (
    <div className="container mx-auto p-6 space-y-6">
      <AdminPageHeader
        title="Master Data Kota/Kabupaten"
        description="Kelola data kota/kabupaten berdasarkan cache biografi member"
        icon={Building2}
      />

      <div className="flex justify-end mb-4">
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Tambah Kota/Kabupaten
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
                  placeholder="Cari kode atau nama kota/kabupaten..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400">Provinsi:</Label>
              <Select value={selectedProvinsi} onValueChange={handleProvinsiFilterChange}>
                <SelectTrigger className="w-48 bg-white dark:bg-gray-800">
                  <SelectValue placeholder="Semua Provinsi" />
                </SelectTrigger>                <SelectContent>
                  <SelectItem value="all">Semua Provinsi</SelectItem>
                  {provinsiList.map((provinsi) => (
                    <SelectItem key={provinsi.kode} value={provinsi.kode}>
                      {provinsi.nama}
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
              Showing {kotaList.length} of {totalElements} items
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kota Table */}
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
                      Nama Kota/Kabupaten
                    </SortableHeader>
                  </TableHead>
                  <TableHead>Provinsi</TableHead>
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
                    <TableCell colSpan={5} className="text-center py-8">
                      <LoadingSpinner />
                    </TableCell>
                  </TableRow>
                ) : kotaList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Tidak ada data kota/kabupaten
                    </TableCell>
                  </TableRow>
                ) : (
                  kotaList.map((kota) => (
                    <TableRow key={kota.kode}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {kota.kode}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          {kota.nama}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getProvinsiName(kota.provinsiKode)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(kota.createdAt).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(kota)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(kota)}
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
            <DialogTitle>Tambah Kota/Kabupaten Baru</DialogTitle>
            <DialogDescription>
              Pilih provinsi terlebih dahulu, lalu pilih dari data wilayah.id atau masukkan data manual
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Provinsi Selection */}
            <div className="space-y-2">
              <Label htmlFor="provinsi-select">Provinsi</Label>
              <Select 
                value={formData.provinsiKode} 
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, provinsiKode: value }))
                  loadAPIKota(value)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Provinsi" />
                </SelectTrigger>
                <SelectContent>
                  {provinsiList.map((provinsi) => (
                    <SelectItem key={provinsi.kode} value={provinsi.kode}>
                      {provinsi.nama}
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
                  <Label htmlFor="kode">Kode Kota/Kabupaten</Label>
                  <Input
                    id="kode"
                    value={formData.kode}
                    onChange={(e) => setFormData(prev => ({ ...prev, kode: e.target.value }))}
                    placeholder="Contoh: 1101"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Kota/Kabupaten</Label>
                  <Input
                    id="nama"
                    value={formData.nama}
                    onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                    placeholder="Contoh: KABUPATEN SIMEULUE"
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
                  {apiKotaList.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {formData.provinsiKode ? 'Memuat data...' : 'Pilih provinsi terlebih dahulu'}
                    </div>
                  ) : (
                    apiKotaList.map((api) => (
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
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={submitCreate} 
              disabled={!formData.kode || !formData.nama || !formData.provinsiKode || loading}
            >
              {loading ? <LoadingSpinner className="mr-2" /> : <Database className="mr-2 h-4 w-4" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <ConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={async () => {
          if (!selectedKota) return
          
          try {
            setLoading(true)
            const response = await fetch(`${getApiUrl('/admin/wilayah')}/kota/${selectedKota.kode}`, {
              method: 'DELETE'
            })

            if (response.ok) {
              const result = await response.json()
              showSuccessToast(result.message || 'Kota berhasil dihapus')
              setIsDeleteOpen(false)
              loadKota()
            } else {
              const error = await response.json()
              showErrorToast(error.error || 'Gagal menghapus kota')
            }
          } catch (error) {
            console.error('Error deleting kota:', error)
            showErrorToast('Gagal menghapus kota')
          } finally {
            setLoading(false)
          }
        }}
        title="Hapus Kota/Kabupaten"
        description={`Apakah Anda yakin ingin menghapus kota "${selectedKota?.nama}"? Aksi ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
      />
    </div>
  )
}
