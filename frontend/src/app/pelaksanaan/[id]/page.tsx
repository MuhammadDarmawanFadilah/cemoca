'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { useMobileDetection } from '@/hooks/useMobileDetection'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ThemeToggle } from '@/components/theme-toggle'
import UniversalCommentSection from '@/components/UniversalCommentSection'
import { config, getApiUrl } from '@/lib/config'
import {
  ArrowLeft,
  Calendar, 
  Clock,
  User,
  CheckCircle,
  XCircle,
  Timer,
  Upload,
  Image as ImageIcon,
  Edit,
  Save,
  X,
  Plus,
  Grid,
  Play,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Download,
  Users,
  UserCheck,
  UserX
} from 'lucide-react'
import { toast } from 'sonner'

interface Usulan {
  id: number
  judul: string
  rencanaKegiatan: string
  tanggalMulai: string
  tanggalSelesai: string
  durasiUsulan: string
  gambarUrl?: string
  namaPengusul: string
  emailPengusul?: string
  jumlahUpvote: number
  jumlahDownvote: number
  status: string
  createdAt: string
  updatedAt: string
}

interface DokumentasiPelaksanaan {
  id: number
  judul?: string
  deskripsi?: string
  fotoUrl?: string
  namaUploader: string
  emailUploader?: string
  createdAt: string
}

interface PesertaPelaksanaan {
  id: number
  nama?: string // For backward compatibility
  hadir: boolean
  catatan?: string
  createdAt?: string
  updatedAt?: string
  biografi?: {
    biografiId: number
    namaLengkap: string
    nim?: string
    alumniTahun?: string
    email: string
    nomorTelepon?: string
    foto?: string
    jenisKelamin?: string
    alamat?: string
    pekerjaanSaatIni?: string
  }
}

interface Pelaksanaan {
  id: number
  usulan: Usulan
  status: 'PENDING' | 'SUKSES' | 'GAGAL'
  catatan?: string
  createdAt: string
  updatedAt: string
  dokumentasi?: DokumentasiPelaksanaan[]
  peserta?: PesertaPelaksanaan[]
}

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
          icon: Timer,
          text: 'Pending'
        }
      case 'SUKSES':
        return { 
          color: 'bg-green-100 text-green-800 border-green-200', 
          icon: CheckCircle,
          text: 'Sukses'
        }
      case 'GAGAL':
        return { 
          color: 'bg-red-100 text-red-800 border-red-200', 
          icon: XCircle,
          text: 'Gagal'
        }
      default:
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          icon: Timer,
          text: 'Unknown'
        }
    }
  }

  const config = getStatusConfig(status)
  const IconComponent = config.icon

  return (
    <Badge className={`${config.color} flex items-center gap-1`}>
      <IconComponent className="h-4 w-4" />
      {config.text}
    </Badge>
  )
}

export default function PelaksanaanDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { isMobile, isSmallMobile } = useMobileDetection()
  const pelaksanaanId = params?.id as string
  const [pelaksanaan, setPelaksanaan] = useState<Pelaksanaan | null>(null)
  const [dokumentasi, setDokumentasi] = useState<DokumentasiPelaksanaan[]>([])
  const [peserta, setPeserta] = useState<PesertaPelaksanaan[]>([])
  const [loading, setLoading] = useState(true)

  // Status update state
  const [isEditingStatus, setIsEditingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState<'PENDING' | 'SUKSES' | 'GAGAL'>('PENDING')
  const [statusNote, setStatusNote] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Documentation upload state
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    judul: '',
    deskripsi: '',
    namaUploader: '',
    emailUploader: '',
    foto: null as File | null
  })
  const [uploading, setUploading] = useState(false)

  // Documentation filter and view states
  const [documentationViewMode, setDocumentationViewMode] = useState<'slideshow' | 'grid'>('slideshow')
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [documentationSearchTerm, setDocumentationSearchTerm] = useState('')
  const [documentationTypeFilter, setDocumentationTypeFilter] = useState<'all' | 'image' | 'video'>('all')
  const [showFullScreenMedia, setShowFullScreenMedia] = useState(false)
  const [fullScreenMediaUrl, setFullScreenMediaUrl] = useState('')
  const [fullScreenMediaType, setFullScreenMediaType] = useState<'image' | 'video'>('image')
  const [currentFullScreenDoc, setCurrentFullScreenDoc] = useState<DokumentasiPelaksanaan | null>(null)
    const fetchPelaksanaan = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`/api/pelaksanaan/${pelaksanaanId}/full`))
      
      if (!response.ok) {
        throw new Error('Pelaksanaan not found')
      }

      const data = await response.json()
      setPelaksanaan(data)
      setNewStatus(data.status)
      setStatusNote(data.catatan || '')
      
      // Fetch dokumentasi
      const dokResponse = await fetch(getApiUrl(`/api/pelaksanaan/${pelaksanaanId}/dokumentasi`))
      if (dokResponse.ok) {
        const dokData = await dokResponse.json()
        setDokumentasi(dokData)
      }      // Fetch participants using full endpoint to get photos
      const participantsResponse = await fetch(getApiUrl(`/api/pelaksanaan/${pelaksanaanId}/participants/full`))
      if (participantsResponse.ok) {
        const participantsData = await participantsResponse.json()
        setPeserta(participantsData.value || participantsData) // Handle both array and object with value property
      }
    } catch (error) {
      console.error('Error fetching pelaksanaan:', error)
      toast.error('Gagal memuat data pelaksanaan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (pelaksanaanId) {
      fetchPelaksanaan()
    }
  }, [pelaksanaanId])

  // Reset slide index when filter changes
  useEffect(() => {
    setCurrentSlideIndex(0)
  }, [documentationSearchTerm, documentationTypeFilter])
  // Auto-fill nama uploader berdasarkan data user yang login
  useEffect(() => {
    if (user) {
      const namaUploader = user.biografi?.namaLengkap || user.fullName || user.email || 'Anonymous'
      const emailUploader = user.email || ''
      
      setUploadForm(prev => ({
        ...prev,
        namaUploader,
        emailUploader
      }))
    }
  }, [user])

  const handleStatusUpdate = async () => {
    try {
      setUpdatingStatus(true)
      const formData = new FormData()
      formData.append('status', newStatus)
      if (statusNote) {
        formData.append('catatan', statusNote)
      }

      const response = await fetch(
        getApiUrl(`/api/pelaksanaan/${pelaksanaanId}/status?status=${newStatus}${statusNote ? `&catatan=${encodeURIComponent(statusNote)}` : ''}`),
        {
          method: 'PUT'
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      const updatedPelaksanaan = await response.json()
      setPelaksanaan(updatedPelaksanaan)
      setIsEditingStatus(false)
      toast.success('Status pelaksanaan berhasil diperbarui')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Gagal memperbarui status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleDocumentationUpload = async () => {
    if (!uploadForm.namaUploader.trim()) {
      toast.error('Nama uploader harus diisi')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      
      if (uploadForm.judul) formData.append('judul', uploadForm.judul)
      if (uploadForm.deskripsi) formData.append('deskripsi', uploadForm.deskripsi)
      formData.append('namaUploader', uploadForm.namaUploader)
      if (uploadForm.emailUploader) formData.append('emailUploader', uploadForm.emailUploader)
      if (uploadForm.foto) formData.append('foto', uploadForm.foto)

      const response = await fetch(
        getApiUrl(`/api/pelaksanaan/${pelaksanaanId}/dokumentasi`),
        {
          method: 'POST',
          body: formData
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to upload documentation')
      }

      const newDokumentasi = await response.json()
      setDokumentasi(prev => [newDokumentasi, ...prev])
      setShowUploadDialog(false)
      setUploadForm({
        judul: '',
        deskripsi: '',
        namaUploader: '',
        emailUploader: '',
        foto: null
      })
      toast.success('Dokumentasi berhasil diupload')    } catch (error: Error | unknown) {
      console.error('Error uploading documentation:', error)
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengupload dokumentasi'
      toast.error(errorMessage)
    } finally {
      setUploading(false)
    }  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Helper functions for documentation
  const isVideoFile = (url: string) => {
    return url.toLowerCase().match(/\.(mp4|webm|ogg|avi|mov)$/i)
  }
  const filteredDokumentasi = dokumentasi.filter((doc) => {
    // Filter by title/description
    const titleMatch = !documentationSearchTerm || 
      (doc.judul && doc.judul.toLowerCase().includes(documentationSearchTerm.toLowerCase())) ||
      (doc.deskripsi && doc.deskripsi.toLowerCase().includes(documentationSearchTerm.toLowerCase()))
    
    // Filter by type
    const typeMatch = documentationTypeFilter === 'all' ||
      (documentationTypeFilter === 'video' && doc.fotoUrl && isVideoFile(doc.fotoUrl)) ||
      (documentationTypeFilter === 'image' && doc.fotoUrl && !isVideoFile(doc.fotoUrl))
    
    return titleMatch && typeMatch
  })
  const handleOpenFullScreen = (url: string, type: 'image' | 'video', doc?: DokumentasiPelaksanaan) => {
    setFullScreenMediaUrl(`${config.baseUrl}${url}`)
    setFullScreenMediaType(type)
    setCurrentFullScreenDoc(doc || null)
    setShowFullScreenMedia(true)
  }

  const handleSlideNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentSlideIndex((prev) => prev > 0 ? prev - 1 : filteredDokumentasi.length - 1)
    } else {
      setCurrentSlideIndex((prev) => prev < filteredDokumentasi.length - 1 ? prev + 1 : 0)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4" />
                  Kembali
                </Button>
                <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!pelaksanaan) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4" />
                  Kembali
                </Button>
                <h1 className="text-xl font-bold">Pelaksanaan Tidak Ditemukan</h1>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">Pelaksanaan tidak ditemukan</h3>
            <p className="text-muted-foreground">Pelaksanaan yang Anda cari tidak tersedia.</p>
            <Button 
              className="mt-4"
              onClick={() => router.push('/pelaksanaan')}
            >
              Kembali ke Daftar Pelaksanaan
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className={`${isMobile ? 'container mx-auto px-3 py-3' : 'container mx-auto px-4 py-4'}`}>
          <div className={`flex justify-between items-center ${isMobile ? 'gap-2' : ''}`}>
            <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-4'}`}>
              <Button 
                variant="ghost" 
                size={isMobile ? "sm" : "sm"}
                onClick={() => router.back()}
                className={`flex items-center gap-2 touch-manipulation ${isMobile ? 'px-2' : ''}`}
              >
                <ArrowLeft className="h-4 w-4" />
                {!isSmallMobile && <span>Kembali</span>}
              </Button>
              
              <div>
                <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                  {isMobile ? 'Pelaksanaan' : 'Detail Pelaksanaan'}
                </h1>
                {!isMobile && (
                  <p className="text-muted-foreground">
                    {pelaksanaan.usulan?.judul || 'Judul tidak tersedia'}
                  </p>
                )}
              </div>
            </div>
            {!isMobile && <ThemeToggle />}
          </div>
          {isMobile && (
            <div className="mt-2">
              <p className={`text-muted-foreground ${isSmallMobile ? 'text-sm' : 'text-sm'} line-clamp-2`}>
                {pelaksanaan.usulan?.judul || 'Judul tidak tersedia'}
              </p>
            </div>
          )}
        </div>
      </div>      <div className={`${isMobile ? 'container mx-auto px-3 py-4 max-w-full' : 'container mx-auto px-4 py-6 max-w-4xl'}`}>
        <article>
          {/* Main Content */}
          <div className={`space-y-${isMobile ? '4' : '6'}`}>
            {/* Usulan Info */}
            <Card className="overflow-hidden">
              {/* Mobile: Show large image prominently at the top */}
              {isMobile && pelaksanaan.usulan?.gambarUrl && (
                <div className="relative w-full h-56 bg-gray-100">
                  <Image
                    src={`${config.baseUrl}${pelaksanaan.usulan.gambarUrl}`}
                    alt={pelaksanaan.usulan.judul || 'Gambar usulan'}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-white text-xl font-bold drop-shadow-lg">
                      {pelaksanaan.usulan?.judul || 'Judul tidak tersedia'}
                    </h2>
                  </div>
                </div>
              )}
              
              <CardHeader className={isMobile ? 'p-4 pb-2' : ''}>
                <div className={`${isMobile ? 'space-y-3' : 'flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4'}`}>
                  <div className="space-y-2">
                    {/* Desktop: Show title normally, Mobile: Don't repeat title */}
                    {!isMobile && (
                      <CardTitle className="text-xl">
                        {pelaksanaan.usulan?.judul || 'Judul tidak tersedia'}
                      </CardTitle>
                    )}
                    <div className={`flex items-center gap-2 ${isMobile ? 'text-sm' : 'text-sm'} text-muted-foreground`}>
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{pelaksanaan.usulan?.namaPengusul || 'Nama tidak tersedia'}</span>
                    </div>
                    {pelaksanaan.usulan?.tanggalMulai && pelaksanaan.usulan?.tanggalSelesai && (
                      <div className={`flex items-center gap-2 ${isMobile ? 'text-sm' : 'text-sm'} text-muted-foreground`}>
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span className={isMobile ? 'text-sm' : ''}>
                          {isMobile ? (
                            `${formatDate(pelaksanaan.usulan.tanggalMulai)} - ${formatDate(pelaksanaan.usulan.tanggalSelesai)}`
                          ) : (
                            `${formatDate(pelaksanaan.usulan.tanggalMulai)} - ${formatDate(pelaksanaan.usulan.tanggalSelesai)}`
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Desktop: Show image on the side */}
                  {!isMobile && pelaksanaan.usulan?.gambarUrl && (
                    <div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={`${config.baseUrl}${pelaksanaan.usulan.gambarUrl}`}
                        alt={pelaksanaan.usulan.judul || 'Gambar usulan'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className={`space-y-4 ${isMobile ? 'p-4 pt-2' : ''}`}>
                <div>
                  <h4 className={`font-medium ${isMobile ? 'text-sm mb-1' : 'mb-2'}`}>Rencana Kegiatan</h4>
                  <p className={`${isMobile ? 'text-sm' : 'text-sm'} text-muted-foreground leading-relaxed ${isMobile ? 'line-clamp-3' : ''}`}>
                    {pelaksanaan.usulan?.rencanaKegiatan || 'Rencana kegiatan tidak tersedia'}
                  </p>
                </div>
                <div className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  <span>Dipindahkan ke pelaksanaan: {formatDateTime(pelaksanaan.createdAt)}</span>
                </div>
              </CardContent>
            </Card>

          {/* Status Management */}
          <Card>
            <CardHeader className={isMobile ? 'p-4 pb-2' : ''}>
              <div className={`${isMobile ? 'space-y-3' : 'flex justify-between items-center'}`}>
                <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                  Status Pelaksanaan
                  <StatusBadge status={pelaksanaan.status} />
                </CardTitle>
                {!isEditingStatus && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setIsEditingStatus(true)}
                    className={`${isMobile ? 'w-full justify-center' : ''} touch-manipulation`}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Status
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className={isMobile ? 'p-4 pt-2' : ''}>
              {isEditingStatus ? (
                <div className={`space-y-${isMobile ? '3' : '4'}`}>
                  <div>
                    <Label htmlFor="status" className={isMobile ? 'text-sm' : ''}>Status</Label>
                    <Select value={newStatus} onValueChange={(value: 'PENDING' | 'SUKSES' | 'GAGAL') => setNewStatus(value)}>
                      <SelectTrigger className={isMobile ? 'h-11' : ''}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="SUKSES">Sukses</SelectItem>
                        <SelectItem value="GAGAL">Gagal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="catatan" className={isMobile ? 'text-sm' : ''}>Catatan (Opsional)</Label>
                    <Textarea
                      id="catatan"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Tambahkan catatan untuk status ini..."
                      rows={isMobile ? 2 : 3}
                      className={isMobile ? 'text-sm' : ''}
                    />
                  </div>
                  <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'gap-2'}`}>
                    <Button 
                      onClick={handleStatusUpdate} 
                      disabled={updatingStatus}
                      size="sm"
                      className={`${isMobile ? 'w-full justify-center' : ''} touch-manipulation`}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {updatingStatus ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setIsEditingStatus(false)
                        setNewStatus(pelaksanaan.status)
                        setStatusNote(pelaksanaan.catatan || '')
                      }}
                      className={`${isMobile ? 'w-full justify-center' : ''} touch-manipulation`}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Batal
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  {pelaksanaan.catatan ? (
                    <div className={`bg-muted ${isMobile ? 'p-2' : 'p-3'} rounded`}>
                      <p className={`${isMobile ? 'text-sm' : 'text-sm'}`}>{pelaksanaan.catatan}</p>
                    </div>
                  ) : (
                    <p className={`${isMobile ? 'text-sm' : 'text-sm'} text-muted-foreground`}>
                      Tidak ada catatan untuk status ini.
                    </p>
                  )}
                  <div className={`${isMobile ? 'mt-1 text-xs' : 'mt-2 text-xs'} text-muted-foreground`}>
                    Terakhir diperbarui: {formatDateTime(pelaksanaan.updatedAt)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documentation */}
          <Card>
            <CardHeader className={isMobile ? 'p-4 pb-2' : ''}>
              <div className={`${isMobile ? 'space-y-3' : 'flex justify-between items-center'}`}>
                <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                  <ImageIcon className="h-5 w-5" />
                  Dokumentasi Pelaksanaan
                  {dokumentasi.length > 0 && (
                    <Badge variant="secondary">{dokumentasi.length}</Badge>
                  )}
                </CardTitle>
                <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm"
                      className={`${isMobile ? 'w-full justify-center' : ''} touch-manipulation`}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Upload Dokumentasi
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={`${isMobile ? 'max-w-[95vw] m-2' : 'max-w-md'}`}>
                    <DialogHeader>
                      <DialogTitle className={isMobile ? 'text-base' : ''}>Upload Dokumentasi</DialogTitle>
                    </DialogHeader>
                    <div className={`space-y-${isMobile ? '3' : '4'}`}>
                      <div>
                        <Label htmlFor="uploadJudul" className={isMobile ? 'text-sm' : ''}>Judul (Opsional)</Label>
                        <Input
                          id="uploadJudul"
                          value={uploadForm.judul}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, judul: e.target.value }))}
                          placeholder="Judul dokumentasi"
                          className={isMobile ? 'h-11' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="uploadDeskripsi" className={isMobile ? 'text-sm' : ''}>Deskripsi (Opsional)</Label>
                        <Textarea
                          id="uploadDeskripsi"
                          value={uploadForm.deskripsi}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, deskripsi: e.target.value }))}
                          placeholder="Deskripsi dokumentasi"
                          rows={isMobile ? 2 : 3}
                          className={isMobile ? 'text-sm' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="uploadNama" className={isMobile ? 'text-sm' : ''}>Nama Uploader *</Label>
                        <Input
                          id="uploadNama"
                          value={uploadForm.namaUploader}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, namaUploader: e.target.value }))}
                          placeholder="Nama Anda"
                          required
                          className={isMobile ? 'h-11' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="uploadEmail" className={isMobile ? 'text-sm' : ''}>Email (Opsional)</Label>
                        <Input
                          id="uploadEmail"
                          type="email"
                          value={uploadForm.emailUploader}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, emailUploader: e.target.value }))}
                          placeholder="email@example.com"
                          className={isMobile ? 'h-11' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="uploadFoto" className={isMobile ? 'text-sm' : ''}>Foto/Video</Label>
                        <Input
                          id="uploadFoto"
                          type="file"
                          accept="image/*,video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null
                            setUploadForm(prev => ({ ...prev, foto: file }))
                          }}
                          className={isMobile ? 'h-11' : ''}
                        />
                        <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground mt-1`}>
                          Mendukung format gambar (JPG, PNG, GIF) dan video (MP4, WebM, AVI, MOV)
                        </p>
                      </div>
                      <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'gap-2'}`}>
                        <Button 
                          onClick={handleDocumentationUpload} 
                          disabled={uploading || !uploadForm.namaUploader.trim()}
                          className={`${isMobile ? 'w-full justify-center' : 'flex-1'} touch-manipulation`}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          {uploading ? 'Mengupload...' : 'Upload'}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => setShowUploadDialog(false)}
                          className={`${isMobile ? 'w-full justify-center' : ''} touch-manipulation`}
                        >
                          Batal
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>            <CardContent className={isMobile ? 'p-4 pt-2' : ''}>
              {dokumentasi.length === 0 ? (
                <div className={`text-center ${isMobile ? 'py-6' : 'py-8'}`}>
                  <ImageIcon className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-muted-foreground mx-auto mb-2`} />
                  <p className={`${isMobile ? 'text-sm' : 'text-sm'} text-muted-foreground`}>Belum ada dokumentasi yang diupload.</p>
                </div>
              ) : (
                <div className={`space-y-${isMobile ? '3' : '4'}`}>
                  {/* Filter and View Controls */}
                  <div className={`${isMobile ? 'space-y-3' : 'flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'}`}>
                    <div className={`${isMobile ? 'space-y-2' : 'flex flex-col sm:flex-row gap-2 flex-1'}`}>
                      <div className={`relative ${isMobile ? 'w-full' : 'flex-1 max-w-sm'}`}>
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={isMobile ? "Cari dokumentasi..." : "Cari berdasarkan judul atau deskripsi..."}
                          value={documentationSearchTerm}
                          onChange={(e) => setDocumentationSearchTerm(e.target.value)}
                          className={`pl-10 ${isMobile ? 'h-11' : ''}`}
                        />
                      </div>
                      <Select value={documentationTypeFilter} onValueChange={(value: 'all' | 'image' | 'video') => setDocumentationTypeFilter(value)}>
                        <SelectTrigger className={`${isMobile ? 'w-full h-11' : 'w-[140px]'}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua</SelectItem>
                          <SelectItem value="image">Gambar</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className={`${isMobile ? 'w-full' : 'flex items-center gap-1 bg-muted rounded-lg p-1'}`}>
                      {isMobile ? (
                        <div className="grid grid-cols-2 gap-1 bg-muted rounded-lg p-1">
                          <Button
                            variant={documentationViewMode === 'slideshow' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setDocumentationViewMode('slideshow')}
                            className="justify-center"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Slideshow
                          </Button>
                          <Button
                            variant={documentationViewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setDocumentationViewMode('grid')}
                            className="justify-center"
                          >
                            <Grid className="h-4 w-4 mr-1" />
                            Grid
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button
                            variant={documentationViewMode === 'slideshow' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setDocumentationViewMode('slideshow')}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Slideshow
                          </Button>
                          <Button
                            variant={documentationViewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setDocumentationViewMode('grid')}
                          >
                            <Grid className="h-4 w-4 mr-1" />
                            Grid
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {filteredDokumentasi.length === 0 ? (
                    <div className={`text-center ${isMobile ? 'py-6' : 'py-8'}`}>
                      <Filter className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-muted-foreground mx-auto mb-2`} />
                      <p className={`${isMobile ? 'text-sm' : 'text-sm'} text-muted-foreground`}>Tidak ada dokumentasi yang sesuai dengan filter.</p>
                    </div>
                  ) : documentationViewMode === 'slideshow' ? (
                    /* Slideshow View */
                    <div className={`space-y-${isMobile ? '3' : '4'}`}>
                      <div className="relative">
                        {filteredDokumentasi[currentSlideIndex] && (
                          <Card className="overflow-hidden">
                            <div className={`relative ${isMobile ? 'h-96' : 'h-96'} bg-gray-100 group`}>
                              {filteredDokumentasi[currentSlideIndex].fotoUrl && isVideoFile(filteredDokumentasi[currentSlideIndex].fotoUrl!) ? (
                                <div className="relative w-full h-full group">
                                  <video
                                    src={`${config.baseUrl}${filteredDokumentasi[currentSlideIndex].fotoUrl}`}
                                    controls
                                    preload="metadata"
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      console.error('Video failed to load:', e);
                                    }}
                                  >
                                    <p>Browser Anda tidak mendukung video.</p>
                                  </video>
                                  <Button
                                    variant="secondary"
                                    size={isMobile ? "sm" : "sm"}
                                    className={`absolute ${isMobile ? 'top-1 right-1' : 'top-2 right-2'} opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation`}
                                    onClick={() => handleOpenFullScreen(filteredDokumentasi[currentSlideIndex].fotoUrl!, 'video', filteredDokumentasi[currentSlideIndex])}
                                  >
                                    <Maximize2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <Image
                                    src={`${config.baseUrl}${filteredDokumentasi[currentSlideIndex].fotoUrl}`}
                                    alt={filteredDokumentasi[currentSlideIndex].judul || 'Dokumentasi'}
                                    fill
                                    className="object-contain cursor-pointer transition-transform hover:scale-105"
                                    onClick={() => handleOpenFullScreen(filteredDokumentasi[currentSlideIndex].fotoUrl!, 'image', filteredDokumentasi[currentSlideIndex])}
                                    onError={(e) => {
                                      console.error('Image failed to load:', e);
                                    }}
                                  />
                                  <Button
                                    variant="secondary"
                                    size={isMobile ? "sm" : "sm"}
                                    className={`absolute ${isMobile ? 'top-1 right-1' : 'top-2 right-2'} opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation`}
                                    onClick={() => handleOpenFullScreen(filteredDokumentasi[currentSlideIndex].fotoUrl!, 'image', filteredDokumentasi[currentSlideIndex])}
                                  >
                                    <Maximize2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              
                              {filteredDokumentasi.length > 1 && (
                                <>
                                  <Button
                                    variant="secondary"
                                    size={isMobile ? "sm" : "sm"}
                                    className={`absolute ${isMobile ? 'left-1 top-1/2 transform -translate-y-1/2' : 'left-2 top-1/2 transform -translate-y-1/2'} touch-manipulation`}
                                    onClick={() => handleSlideNavigation('prev')}
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size={isMobile ? "sm" : "sm"}
                                    className={`absolute ${isMobile ? 'right-1 top-1/2 transform -translate-y-1/2' : 'right-2 top-1/2 transform -translate-y-1/2'} touch-manipulation`}
                                    onClick={() => handleSlideNavigation('next')}
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                            <CardContent className={isMobile ? 'p-4' : 'p-4'}>
                              {filteredDokumentasi[currentSlideIndex].judul && (
                                <h4 className={`font-medium ${isMobile ? 'text-base mb-2' : 'mb-2'}`}>{filteredDokumentasi[currentSlideIndex].judul}</h4>
                              )}
                              {filteredDokumentasi[currentSlideIndex].deskripsi && (
                                <p className={`${isMobile ? 'text-sm leading-relaxed' : 'text-sm'} text-muted-foreground ${isMobile ? 'mb-3' : 'mb-3'}`}>{filteredDokumentasi[currentSlideIndex].deskripsi}</p>
                              )}
                              <div className={`flex items-center justify-between ${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {filteredDokumentasi[currentSlideIndex].namaUploader}
                                </div>
                                <span className={isMobile ? 'text-xs' : ''}>{formatDateTime(filteredDokumentasi[currentSlideIndex].createdAt)}</span>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                      
                      {filteredDokumentasi.length > 1 && (
                        <div className={`flex ${isMobile ? 'flex-col items-center gap-2' : 'justify-center items-center gap-2'}`}>
                          <span className={`${isMobile ? 'text-sm' : 'text-sm'} text-muted-foreground`}>
                            {currentSlideIndex + 1} dari {filteredDokumentasi.length}
                          </span>
                          <div className={`flex gap-1 ${isMobile ? '' : 'ml-4'}`}>
                            {filteredDokumentasi.map((_, index) => (
                              <button
                                key={index}
                                className={`${isMobile ? 'w-3 h-3' : 'w-2 h-2'} rounded-full transition-colors touch-manipulation ${
                                  index === currentSlideIndex ? 'bg-primary' : 'bg-muted'
                                }`}
                                onClick={() => setCurrentSlideIndex(index)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Grid View */
                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
                      {filteredDokumentasi.map((doc) => (
                        <Card key={doc.id} className="overflow-hidden">
                          {doc.fotoUrl && (
                            <div className={`relative ${isMobile ? 'h-64' : 'h-48'} bg-gray-100 group`}>
                              {isVideoFile(doc.fotoUrl) ? (
                                <div className="relative w-full h-full group">
                                  <video
                                    src={`${config.baseUrl}${doc.fotoUrl}`}
                                    controls
                                    preload="metadata"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      console.error('Video failed to load:', e);
                                    }}
                                  >
                                    <p>Browser Anda tidak mendukung video.</p>
                                  </video>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className={`absolute ${isMobile ? 'top-1 right-1' : 'top-2 right-2'} opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation`}
                                    onClick={() => handleOpenFullScreen(doc.fotoUrl!, 'video', doc)}
                                  >
                                    <Maximize2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <Image
                                    src={`${config.baseUrl}${doc.fotoUrl}`}
                                    alt={doc.judul || 'Dokumentasi'}
                                    fill
                                    className="object-cover cursor-pointer transition-transform hover:scale-105"
                                    onClick={() => handleOpenFullScreen(doc.fotoUrl!, 'image', doc)}
                                    onError={(e) => {
                                      console.error('Image failed to load:', e);
                                    }}
                                  />
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className={`absolute ${isMobile ? 'top-1 right-1' : 'top-2 right-2'} opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation`}
                                    onClick={() => handleOpenFullScreen(doc.fotoUrl!, 'image', doc)}
                                  >
                                    <Maximize2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                          <CardContent className={isMobile ? 'p-4' : 'p-3'}>
                            {doc.judul && (
                              <h4 className={`font-medium ${isMobile ? 'text-sm mb-2' : 'text-sm mb-1'}`}>{doc.judul}</h4>
                            )}
                            {doc.deskripsi && (
                              <p className={`${isMobile ? 'text-sm leading-relaxed' : 'text-xs'} text-muted-foreground ${isMobile ? 'mb-3' : 'mb-2'}`}>{doc.deskripsi}</p>
                            )}
                            <div className={`flex items-center justify-between ${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span className={isMobile ? 'truncate max-w-[120px]' : ''}>{doc.namaUploader}</span>
                              </div>
                              <span className={isMobile ? 'text-xs' : ''}>{formatDateTime(doc.createdAt)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Attendee List Section */}
        <div className="mt-6">
          <Card>
            <CardHeader className={isMobile ? 'p-4 pb-2' : ''}>
              <div className={`${isMobile ? 'space-y-3' : 'flex items-center justify-between'}`}>
                <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                  <Users className="h-5 w-5" />
                  Daftar Peserta
                  <Badge variant="secondary" className="ml-2">
                    {peserta.length} peserta
                  </Badge>
                </CardTitle>
                <div className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                  <div className="flex items-center gap-1">
                    <UserCheck className="h-4 w-4 text-green-600" />
                    <span>{peserta.filter(p => p.hadir).length} hadir</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <UserX className="h-4 w-4 text-red-600" />
                    <span>{peserta.filter(p => !p.hadir).length} tidak hadir</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className={isMobile ? 'p-4 pt-2' : ''}>
              {peserta.length === 0 ? (
                <div className={`text-center ${isMobile ? 'py-6' : 'py-8'}`}>
                  <Users className={`${isMobile ? 'h-8 w-8' : 'h-12 w-12'} text-muted-foreground mx-auto mb-4`} />
                  <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>Belum ada peserta yang mendaftar</p>
                </div>
              ) : (
                <div className={`space-y-${isMobile ? '2' : '3'}`}>
                  {peserta.map((participant) => (
                    <div key={participant.id} className={`flex items-center gap-${isMobile ? '3' : '4'} ${isMobile ? 'p-3' : 'p-4'} border rounded-lg hover:bg-muted/50 transition-colors`}>
                      {/* Profile Picture */}
                      <div className="relative">
                        {participant.biografi?.foto ? (
                          <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full overflow-hidden`}>
                            <Image
                              src={`${config.baseUrl}/api/images/${participant.biografi.foto}`}
                              alt={participant.biografi.namaLengkap || participant.nama || 'Peserta'}
                              width={isMobile ? 40 : 48}
                              height={isMobile ? 40 : 48}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center`}>
                            <User className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-blue-600 dark:text-blue-400`} />
                          </div>
                        )}
                        
                        {/* Status Indicator */}
                        <div className={`absolute -bottom-1 -right-1 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'} rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center`}>
                          {participant.hadir ? (
                            <div className="w-full h-full rounded-full bg-green-500 flex items-center justify-center">
                              <UserCheck className="h-3 w-3 text-white" />
                            </div>
                          ) : (
                            <div className="w-full h-full rounded-full bg-red-500 flex items-center justify-center">
                              <UserX className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Participant Info */}
                      <div className="flex-1 min-w-0">
                        <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-start justify-between gap-4'}`}>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>{participant.biografi?.namaLengkap || participant.nama}</h4>
                            {participant.biografi?.email && (
                              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>{participant.biografi.email}</p>
                            )}
                            {participant.biografi?.alumniTahun && (
                              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>Alumni {participant.biografi.alumniTahun}</p>
                            )}
                            {participant.biografi?.pekerjaanSaatIni && (
                              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground ${isMobile ? 'truncate' : ''}`}>{participant.biografi.pekerjaanSaatIni}</p>
                            )}
                          </div>
                          
                          {/* Status Badge */}
                          <div className={`flex items-center gap-2 ${isMobile ? 'self-start' : ''}`}>
                            <Badge 
                              variant={participant.hadir ? 'default' : 'destructive'}
                              className={`${isMobile ? 'text-xs px-2 py-1' : ''} ${
                                participant.hadir ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 hover:bg-green-100 dark:hover:bg-green-900' :
                                'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 hover:bg-red-100 dark:hover:bg-red-900'
                              }`}
                            >
                              {participant.hadir ? (
                                <>
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Hadir
                                </>
                              ) : (
                                <>
                                  <UserX className="h-3 w-3 mr-1" />
                                  {isMobile ? 'Tidak' : 'Tidak Hadir'}
                                </>
                              )}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Comment Section */}
        <div className="mt-6">
          <UniversalCommentSection
            resourceType="pelaksanaan"
            resourceId={parseInt(params?.id as string)}
            fetchCommentsUrl={`/api/pelaksanaan/${params?.id}/komentar?page=0&size=50`}
            createCommentUrl={`/api/pelaksanaan/${params?.id}/komentar`}
            replyCommentUrl="/api/pelaksanaan/komentar/{parentId}/reply"
            enableReplies={true}
            className="border-0 shadow-lg"
          />
        </div>
        </article>
      </div>

      {/* Full Screen Media Modal - Enhanced */}
      {showFullScreenMedia && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/70 text-white border border-white/20 rounded-full p-2"
            onClick={() => setShowFullScreenMedia(false)}
          >
            <X className="h-5 w-5" />
          </Button>
          
          {/* Main content container */}
          <div className="relative w-full h-full flex flex-col items-center justify-center max-w-7xl">
            {/* Media container with proper sizing */}
            <div className="relative flex-1 flex items-center justify-center w-full" style={{ maxHeight: 'calc(100vh - 120px)' }}>
              {fullScreenMediaType === 'video' ? (
                <video
                  src={fullScreenMediaUrl}
                  controls
                  className="max-w-full max-h-full object-contain shadow-2xl"
                  autoPlay
                  style={{ 
                    maxHeight: '100%',
                    maxWidth: '100%',
                    width: 'auto',
                    height: 'auto'
                  }}
                >
                  <p className="text-white">Browser Anda tidak mendukung video.</p>
                </video>
              ) : (
                <div className="relative flex items-center justify-center max-w-full max-h-full">
                  <Image
                    src={fullScreenMediaUrl}
                    alt="Full screen view"
                    width={1920}
                    height={1080}
                    className="max-w-full max-h-full object-contain shadow-2xl"
                    style={{ 
                      maxHeight: '100%',
                      maxWidth: '100%',
                      width: 'auto',
                      height: 'auto'
                    }}
                    priority
                    unoptimized
                  />
                </div>
              )}
            </div>
            
            {/* Media info panel - shown only if currentFullScreenDoc exists */}
            {currentFullScreenDoc && (
              <div className="w-full max-w-4xl mt-4 bg-black/80 backdrop-blur-sm text-white p-4 rounded-lg border border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {currentFullScreenDoc.judul && (
                      <h3 className="text-lg font-semibold mb-2 text-white">{currentFullScreenDoc.judul}</h3>
                    )}
                    {currentFullScreenDoc.deskripsi && (
                      <p className="text-sm text-gray-300 mb-3 leading-relaxed">{currentFullScreenDoc.deskripsi}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{currentFullScreenDoc.namaUploader}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDateTime(currentFullScreenDoc.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Download button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = fullScreenMediaUrl;
                      link.download = currentFullScreenDoc.judul || 'dokumentasi';
                      link.target = '_blank';
                      link.click();
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Background click to close */}
          <div 
            className="absolute inset-0 -z-10"
            onClick={() => setShowFullScreenMedia(false)}
          />
        </div>
      )}
    </div>
  )
}
