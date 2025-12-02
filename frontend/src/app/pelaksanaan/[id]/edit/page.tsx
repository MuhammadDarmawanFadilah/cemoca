'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth } from '@/contexts/AuthContext'
import { config, getApiUrl } from '@/lib/config'
import { biografiAPI, Biografi } from '@/lib/api'
import { Checkbox } from '@/components/ui/checkbox'
import { Combobox } from '@/components/ui/combobox-enhanced'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { FILE_UPLOAD_CONFIG, validateFileSize, validateFileType, isImageFile, isVideoFile } from '@/lib/config-constants'
import {
  ArrowLeft,
  Calendar, 
  Clock,
  User,
  Upload,
  Save,
  X,
  Plus,
  CheckCircle,
  XCircle,
  Timer,
  Trash2,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Check,
  FileText,
  Users,
  Camera,
  Eye,
  AlertCircle,
  Info,
  Mail,
  GraduationCap,
  MapPin
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
  biografiId?: number
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

interface AlumniPeserta {
  id: number
  biografiId: number
  namaAlumni: string
  emailAlumni?: string
  hadir: boolean
  catatan?: string
}

interface Pelaksanaan {
  id: number
  usulan: Usulan
  status: 'PENDING' | 'SUKSES' | 'GAGAL'
  catatan?: string
  createdAt: string
  updatedAt: string
  dokumentasi?: DokumentasiPelaksanaan[]
  alumniPeserta?: AlumniPeserta[]
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
      <IconComponent className="h-3 w-3" />
      {config.text}
    </Badge>
  )
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit'
  })
}

export default function EditPelaksanaanPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [pelaksanaan, setPelaksanaan] = useState<Pelaksanaan | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
    // Stepper state
  const [currentStep, setCurrentStep] = useState(0)
  const steps = [
    { 
      id: 'status', 
      label: 'Status', 
      icon: CheckCircle,
      description: 'Update status pelaksanaan'
    },
    { 
      id: 'dokumentasi', 
      label: 'Dokumentasi', 
      icon: Camera,
      description: 'Upload foto kegiatan'
    },
    { 
      id: 'peserta', 
      label: 'Peserta', 
      icon: Users,
      description: 'Daftar kehadiran peserta'
    },
    { 
      id: 'review', 
      label: 'Selesai', 
      icon: Eye,
      description: 'Review dan simpan'
    }
  ]
  
  // Form states
  const [status, setStatus] = useState<'PENDING' | 'SUKSES' | 'GAGAL'>('PENDING')
  const [catatan, setCatatan] = useState('')
  
  // Dokumentasi form states
  const [showDokumentasiForm, setShowDokumentasiForm] = useState(false)
  const [dokumentasiJudul, setDokumentasiJudul] = useState('')
  const [dokumentasiDeskripsi, setDokumentasiDeskripsi] = useState('')
  const [dokumentasiFile, setDokumentasiFile] = useState<File | null>(null)
  const [uploadingDokumentasi, setUploadingDokumentasi] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  // Alumni peserta states
  const [availableAlumni, setAvailableAlumni] = useState<Biografi[]>([])
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniPeserta[]>([])
  const [loadingAlumni, setLoadingAlumni] = useState(false)
  const [alumniSearchTerm, setAlumniSearchTerm] = useState('')
  
  // Advanced alumni filtering states
  const [alumniFilters, setAlumniFilters] = useState({
    nama: '',
    nomorTelepon: '',
    alumniTahun: '',
    spesialisasi: '',
    pekerjaan: ''
  })
  // Alumni pagination states
  const [alumniPage, setAlumniPage] = useState(0)
  const [alumniSize, setAlumniSize] = useState(10)
  const [alumniTotalPages, setAlumniTotalPages] = useState(0)
  const [alumniTotalElements, setAlumniTotalElements] = useState(0)
  
  // Selected participants pagination states
  const [selectedPage, setSelectedPage] = useState(0)
  const [selectedSize, setSelectedSize] = useState(10)
    // Alumni location filter states
  const [alumniLocationFilter, setAlumniLocationFilter] = useState({
    provinsi: 'all',
    kota: 'all',
    kecamatan: 'all',
    kelurahan: 'all'
  })
  
  const [locationData, setLocationData] = useState({
    provinsiOptions: [] as string[],
    kotaOptions: [] as string[],
    kecamatanOptions: [] as string[],
    kelurahanOptions: [] as string[]
  })
  
  // Location mappings state (name -> code) - sama seperti BiografiFilters
  const [locationMappings, setLocationMappings] = useState({
    provinsi: {} as Record<string, string>,
    kota: {} as Record<string, string>,
    kecamatan: {} as Record<string, string>,
    kelurahan: {} as Record<string, string>
  })
  
  const [loadingLocationData, setLoadingLocationData] = useState(false)

  // Dynamic filter options state
  const [filterOptions, setFilterOptions] = useState({
    spesialisasi: [] as string[],
    pekerjaan: [] as string[]
  })
  const [loadingFilterOptions, setLoadingFilterOptions] = useState(false)
  // File validation helpers using config
  const validateFile = (file: File) => {
    // Determine max size based on file type
    const maxSize = isImageFile(file) ? FILE_UPLOAD_CONFIG.MAX_IMAGE_SIZE : FILE_UPLOAD_CONFIG.MAX_VIDEO_SIZE
    
    // Validate file size
    const sizeValidation = validateFileSize(file, maxSize)
    if (!sizeValidation.valid) {
      return sizeValidation
    }
    
    // Validate file type
    const allowedTypes = [...FILE_UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES, ...FILE_UPLOAD_CONFIG.ALLOWED_VIDEO_TYPES]
    const typeValidation = validateFileType(file, allowedTypes)
    if (!typeValidation.valid) {
      return { 
        valid: false, 
        message: 'Format file tidak didukung. Gunakan format gambar (JPG, PNG, WebP) atau video (MP4, WebM).' 
      }
    }
    
    return { valid: true, message: '' }
  }
  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setDokumentasiFile(null)
      return
    }
      const validation = validateFile(file)
    if (!validation.valid) {
      toast.error(validation.message)
      return
    }
    
    setDokumentasiFile(file)
  }
    // Simple debounce implementation to prevent excessive API calls
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (params?.id) {
      fetchPelaksanaan()
      loadLocationData()
      loadFilterOptions()
    }
  }, [params?.id])
  // Single effect for loading alumni data - avoid cascade triggers
  useEffect(() => {
    // Only load when we have location mappings and conditions are met
    if (Object.keys(locationMappings.provinsi).length > 0) {
      // Direct debounce with timeout
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
      
      debounceTimeout.current = setTimeout(() => {
        loadAlumniData(true)
      }, 300)
      
      return () => {
        if (debounceTimeout.current) {
          clearTimeout(debounceTimeout.current)
        }
      }
    }
  }, [locationMappings, alumniFilters, alumniLocationFilter, alumniSize])
  
  // Separate effect for page changes only (no reset to avoid infinite loops)
  useEffect(() => {
    if (Object.keys(locationMappings.provinsi).length > 0 && alumniPage > 0) {
      loadAlumniData(false) // Don't reset page here
    }
  }, [alumniPage])
  
  // Load dynamic filter options
  const loadFilterOptions = async () => {
    if (loadingFilterOptions) return
    
    try {
      setLoadingFilterOptions(true)
      const [spesialisasiData, pekerjaanData] = await Promise.all([
        biografiAPI.getDistinctSpesialisasi(),
        biografiAPI.getDistinctPekerjaan()
      ])
      
      setFilterOptions({
        spesialisasi: spesialisasiData,
        pekerjaan: pekerjaanData
      })
    } catch (error) {
      console.error('Error loading filter options:', error)
      toast.error('Gagal memuat opsi filter')
    } finally {
      setLoadingFilterOptions(false)
    }
  }

  // Load location data for filters
  const loadLocationData = async () => {
    if (loadingLocationData) return
    
    try {
      setLoadingLocationData(true)
      const [provinsiData, kotaData, kecamatanData, kelurahanData,
             provinsiMappings, kotaMappings, kecamatanMappings, kelurahanMappings] = await Promise.all([
        biografiAPI.getDistinctProvinsi(),
        biografiAPI.getDistinctKota(),
        biografiAPI.getDistinctKecamatan(),
        biografiAPI.getDistinctKelurahan(),
        biografiAPI.getProvinsiMappings(),
        biografiAPI.getKotaMappings(),
        biografiAPI.getKecamatanMappings(),
        biografiAPI.getKelurahanMappings()
      ])
      
      setLocationData({
        provinsiOptions: provinsiData,
        kotaOptions: kotaData,
        kecamatanOptions: kecamatanData,
        kelurahanOptions: kelurahanData
      })
      
      setLocationMappings({
        provinsi: provinsiMappings,
        kota: kotaMappings,
        kecamatan: kecamatanMappings,
        kelurahan: kelurahanMappings
      })
    } catch (error) {
      console.error('Error loading location data:', error)
      toast.error('Gagal memuat data lokasi')
    } finally {
      setLoadingLocationData(false)
    }
  }

  // Handle file preview
  useEffect(() => {
    if (dokumentasiFile) {
      const url = URL.createObjectURL(dokumentasiFile)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setPreviewUrl(null)
    }
  }, [dokumentasiFile])
  
  const loadAlumniData = async (resetPage = false) => {
    // Prevent multiple simultaneous calls
    if (loadingAlumni) return
    
    try {
      setLoadingAlumni(true)
      
      const currentPage = resetPage ? 0 : alumniPage
      
      // Convert location names to codes for filtering
      const getLocationCode = (selectedName: string, mappings: Record<string, string>) => {
        return selectedName && selectedName !== 'all' && mappings[selectedName] ? mappings[selectedName] : null;
      }
      
      const provinsiCode = getLocationCode(alumniLocationFilter.provinsi, locationMappings.provinsi)
      const kotaCode = getLocationCode(alumniLocationFilter.kota, locationMappings.kota)
      const kecamatanCode = getLocationCode(alumniLocationFilter.kecamatan, locationMappings.kecamatan)
      const kelurahanCode = getLocationCode(alumniLocationFilter.kelurahan, locationMappings.kelurahan)
      
      const filterRequest = {
        nama: alumniFilters.nama || undefined,
        nomorTelepon: alumniFilters.nomorTelepon || undefined,
        alumniTahun: alumniFilters.alumniTahun || undefined,
        spesialisasi: alumniFilters.spesialisasi || undefined,
        pekerjaan: alumniFilters.pekerjaan || undefined,
        provinsi: provinsiCode || undefined,
        kota: kotaCode || undefined,
        kecamatan: kecamatanCode || undefined,
        kelurahan: kelurahanCode || undefined,
        status: 'AKTIF' as const,
        page: currentPage,
        size: alumniSize,
        sortBy: 'namaLengkap',
        sortDirection: 'asc' as const
      }
      
      const response = await biografiAPI.getBiografiWithFilters(filterRequest)
      setAvailableAlumni(response.content || [])
      setAlumniTotalPages(response.totalPages || 0)
      setAlumniTotalElements(response.totalElements || 0)
      
      if (resetPage && currentPage !== alumniPage) {
        setAlumniPage(0)
      }
    } catch (error) {      
      console.error('Error loading member data:', error)
      toast.error('Gagal memuat data member')
    } finally {
      setLoadingAlumni(false)
    }
  }
  const fetchPelaksanaan = async () => {
    if (!params?.id) return
    
    try {
      setLoading(true)
      
      // Use AbortController to cancel previous requests
      const abortController = new AbortController()
      
      const response = await fetch(getApiUrl(`/api/pelaksanaan/${params.id}`), {
        signal: abortController.signal
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch pelaksanaan')
      }

      const data = await response.json()
      setPelaksanaan(data)
      setStatus(data.status)
      setCatatan(data.catatan || '')
        // Try to fetch participants data from the participants endpoint
      try {
        const participantsResponse = await fetch(getApiUrl(`/api/pelaksanaan/${params.id}/participants`), {
          signal: abortController.signal
        })
        if (participantsResponse.ok) {
          const participantsData = await participantsResponse.json()
          // Convert ParticipantSummaryDto format to AlumniPeserta format for the frontend
          const convertedPeserta: AlumniPeserta[] = participantsData.map((p: any) => ({
            id: p.id, // This is actually biografiId from the backend
            biografiId: p.id, // Backend's id field is actually biografiId
            namaAlumni: p.nama,
            emailAlumni: '', // Not provided in summary DTO
            hadir: p.hadir || false,
            catatan: ''
          }))
          setSelectedAlumni(convertedPeserta)
        } else {
          // Fallback: try to get from main data
          if (data.alumniPeserta && data.alumniPeserta.length > 0) {
            setSelectedAlumni(data.alumniPeserta)
          } else if (data.peserta && data.peserta.length > 0) {
            // Convert PesertaPelaksanaan format to AlumniPeserta format
            const convertedPeserta: AlumniPeserta[] = data.peserta.map((p: any) => ({
              id: p.id,
              biografiId: p.biografi?.biografiId || p.id,
              namaAlumni: p.nama || p.biografi?.namaLengkap,
              emailAlumni: p.email,
              hadir: p.status === 'HADIR',
              catatan: ''
            }))
            setSelectedAlumni(convertedPeserta)
          }
        }        } catch (participantsError) {
        console.log('No participants data available:', participantsError)
        // Initialize with empty array - user can add participants manually
        setSelectedAlumni([])
      }

      // Fetch dokumentasi data
      try {
        const dokumentasiResponse = await fetch(getApiUrl(`/api/pelaksanaan/${params.id}/dokumentasi`), {
          signal: abortController.signal
        })
        if (dokumentasiResponse.ok) {
          const dokumentasiData = await dokumentasiResponse.json()
          // Update pelaksanaan state with dokumentasi
          setPelaksanaan(prev => prev ? { ...prev, dokumentasi: dokumentasiData } : null)
        }
      } catch (dokumentasiError) {
        console.log('No dokumentasi data available:', dokumentasiError)
      }
    } catch (error) {
      console.error('Error fetching pelaksanaan:', error)
      toast.error('Gagal memuat data pelaksanaan')
    } finally {
      setLoading(false)
    }
  }

  // Check if user can edit
  const canEdit = () => {
    if (!user || !pelaksanaan) return false
    
    // Admin can edit all
    if (user.role?.roleName === 'ADMIN') return true
    
    // Usulan creator can edit their own
    if (user.biografi?.biografiId && pelaksanaan.usulan?.biografiId) {
      return user.biografi.biografiId === pelaksanaan.usulan.biografiId
    }
    
    // Fallback: check by email
    if (user.email && pelaksanaan.usulan?.emailPengusul) {
      return user.email === pelaksanaan.usulan.emailPengusul
    }
    
    return false
  }

  // Stepper navigation functions
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex)
  }
  const isStepCompleted = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Status step
        return status !== 'PENDING' || catatan.trim() !== ''
      case 1: // Dokumentasi step
        return pelaksanaan?.dokumentasi && pelaksanaan.dokumentasi.length > 0
      case 2: // Peserta step
        return selectedAlumni.length > 0
      default:
        return false
    }
  }

  const isStepValid = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Status step - always valid as status has default value
        return true
      case 1: // Dokumentasi step - optional, always valid
        return true
      case 2: // Peserta step - optional, always valid
        return true
      case 3: // Review step - always valid
        return true
      default:
        return false
    }
  }

  const canProceedToNext = () => {
    return currentStep === steps.length - 1 || isStepValid(currentStep)
  }

  const getStepProgress = () => {
    const completedSteps = steps.filter((_, index) => isStepCompleted(index)).length
    return (completedSteps / steps.length) * 100
  }
  const handleFinalSave = async () => {
    try {
      setSaving(true)
      
      // Batch save operations to reduce round trips
      const savePromises = []
      
      // 1. Save status
      const formData = new FormData()
      formData.append('status', status)
      if (catatan) formData.append('catatan', catatan)

      const statusPromise = fetch(getApiUrl(`/api/pelaksanaan/${pelaksanaan?.id}/status`), {
        method: 'PUT',
        body: formData
      })
      savePromises.push(statusPromise)

      // 2. Save participants (only if there are changes)
      if (selectedAlumni.length > 0) {
        const participantData = selectedAlumni.map(alumni => ({
          biografi: { biografiId: alumni.biografiId },
          hadir: alumni.hadir,
          catatan: alumni.catatan || ''
        }))

        const participantPromise = fetch(getApiUrl(`/api/pelaksanaan/${pelaksanaan?.id}/participants`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(participantData)
        })
        savePromises.push(participantPromise)
      }
      
      // Execute all save operations concurrently
      const results = await Promise.allSettled(savePromises)
      
      // Check results
      const statusResult = results[0]
      const participantResult = results[1]
      
      if (statusResult.status === 'rejected' || 
          (statusResult.status === 'fulfilled' && !statusResult.value.ok)) {
        throw new Error('Failed to update pelaksanaan status')
      }
      
      if (participantResult && 
          (participantResult.status === 'rejected' || 
           (participantResult.status === 'fulfilled' && !participantResult.value.ok))) {
        console.error('Failed to save participants, but status was saved')
        toast.error('Status tersimpan, tapi gagal menyimpan peserta')
        return
      }
      
      toast.success('Semua perubahan berhasil disimpan!')
      
      // Navigate back without re-fetching
      router.push(`/pelaksanaan/${params?.id || ''}`)
    } catch (error) {
      console.error('Error saving final data:', error)
      toast.error('Gagal menyimpan perubahan')
    } finally {
      setSaving(false)
    }
  }
  const handleSaveStatus = async () => {
    if (!pelaksanaan) return

    try {
      setSaving(true)
      
      const formData = new FormData()
      formData.append('status', status)
      if (catatan) formData.append('catatan', catatan)

      const response = await fetch(getApiUrl(`/api/pelaksanaan/${pelaksanaan.id}/status`), {
        method: 'PUT',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to update pelaksanaan')
      }

      toast.success('Status pelaksanaan berhasil diperbarui')
      fetchPelaksanaan()
    } catch (error) {
      console.error('Error updating pelaksanaan:', error)
      toast.error('Gagal memperbarui status pelaksanaan')
    } finally {
      setSaving(false)
    }
  }

  const handleAddDokumentasi = async () => {
    if (!pelaksanaan || !dokumentasiFile) return

    try {
      setUploadingDokumentasi(true)
      
      const formData = new FormData()
      if (dokumentasiJudul) formData.append('judul', dokumentasiJudul)
      if (dokumentasiDeskripsi) formData.append('deskripsi', dokumentasiDeskripsi)
      formData.append('namaUploader', user?.biografi?.namaLengkap || user?.email || 'Anonymous')
      if (user?.email) formData.append('emailUploader', user.email)
      formData.append('foto', dokumentasiFile)

      const response = await fetch(getApiUrl(`/api/pelaksanaan/${pelaksanaan.id}/dokumentasi`), {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to add dokumentasi')
      }

      setDokumentasiJudul('')
      setDokumentasiDeskripsi('')
      setDokumentasiFile(null)
      setShowDokumentasiForm(false)
      
      // Refresh data
      fetchPelaksanaan()
      
      toast.success('Dokumentasi berhasil ditambahkan')
    } catch (error) {
      console.error('Error adding dokumentasi:', error)
      toast.error('Gagal menambahkan dokumentasi')
    } finally {
      setUploadingDokumentasi(false)
    }
  }

  const handleAddAlumni = (biografi: Biografi) => {
    const newPeserta: AlumniPeserta = {
      id: Date.now(), // temporary ID
      biografiId: biografi.biografiId,
      namaAlumni: biografi.namaLengkap,
      emailAlumni: biografi.email,
      hadir: true,
      catatan: ''
    }
    setSelectedAlumni(prev => [...prev, newPeserta])
  }

  const handleRemoveAlumni = (biografiId: number) => {
    setSelectedAlumni(prev => prev.filter(p => p.biografiId !== biografiId))  }
  
  const handleToggleKehadiran = (biografiId: number) => {
    setSelectedAlumni(prev => 
      prev.map(p => 
        p.biografiId === biografiId 
          ? { ...p, hadir: !p.hadir }
          : p      )
    )
  }
  
  const handleHadirSemua = () => {
    setSelectedAlumni(prev => 
      prev.map(p => ({ ...p, hadir: true }))
    )
  }
  
  const handleTidakHadirSemua = () => {
    setSelectedAlumni(prev => 
      prev.map(p => ({ ...p, hadir: false }))
    )
  }
  
  const handleSelectAllVisible = () => {
    const visibleAlumni = availableAlumni.filter(alumni => 
      !selectedAlumni.some(selected => selected.biografiId === alumni.biografiId)
    )
    
    const newParticipants = visibleAlumni.map(alumni => ({
      id: Date.now() + alumni.biografiId, // temporary ID
      biografiId: alumni.biografiId,
      namaAlumni: alumni.namaLengkap,
      emailAlumni: alumni.email,
      hadir: true,
      catatan: ''
    }))
    
    setSelectedAlumni(prev => [...prev, ...newParticipants])
  }
  
  const handleToggleAlumniSelection = (biografi: Biografi) => {
    const isSelected = selectedAlumni.some(selected => selected.biografiId === biografi.biografiId)
    
    if (isSelected) {
      handleRemoveAlumni(biografi.biografiId)
    } else {
      handleAddAlumni(biografi)
    }
  }
  
  // Helper function to get location name from code
  const getLocationName = (code: string | undefined, mappings: Record<string, string>) => {
    if (!code) return null
    // Find the name by looking for the value that matches the code
    const entry = Object.entries(mappings).find(([name, mappingCode]) => mappingCode === code)
    return entry ? entry[0] : code // Return name if found, otherwise return code
  }
  
  const filteredAlumni = availableAlumni.filter(alumni => {
    // Name and email search
    const matchesSearch = alumni.namaLengkap.toLowerCase().includes(alumniSearchTerm.toLowerCase()) ||
                         alumni.email.toLowerCase().includes(alumniSearchTerm.toLowerCase());
      // Location filters - convert selected names to codes and compare with alumni's codes
    const getLocationCode = (selectedName: string, mappings: Record<string, string>) => {
      return selectedName && selectedName !== 'all' && mappings[selectedName] ? mappings[selectedName] : selectedName;
    };
    
    const provinsiCode = getLocationCode(alumniLocationFilter.provinsi, locationMappings.provinsi);
    const kotaCode = getLocationCode(alumniLocationFilter.kota, locationMappings.kota);
    const kecamatanCode = getLocationCode(alumniLocationFilter.kecamatan, locationMappings.kecamatan);
    const kelurahanCode = getLocationCode(alumniLocationFilter.kelurahan, locationMappings.kelurahan);
    
    const matchesProvinsi = !alumniLocationFilter.provinsi || alumniLocationFilter.provinsi === 'all' ||
                           (alumni.provinsi && alumni.provinsi === provinsiCode);
    const matchesKota = !alumniLocationFilter.kota || alumniLocationFilter.kota === 'all' ||
                       (alumni.kota && alumni.kota === kotaCode);
    const matchesKecamatan = !alumniLocationFilter.kecamatan || alumniLocationFilter.kecamatan === 'all' ||
                            (alumni.kecamatan && alumni.kecamatan === kecamatanCode);
    const matchesKelurahan = !alumniLocationFilter.kelurahan || alumniLocationFilter.kelurahan === 'all' ||
                            (alumni.kelurahan && alumni.kelurahan === kelurahanCode);
    
    return matchesSearch && matchesProvinsi && matchesKota && matchesKecamatan && matchesKelurahan;
  }).filter(alumni => 
    !selectedAlumni.some(selected => selected.biografiId === alumni.biografiId)
  )

  const isFileVideo = (file: File) => {
    return file.type.startsWith('video/')
  }

  const isFileImage = (file: File) => {
    return file.type.startsWith('image/')
  }

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

  // Add validation feedback
  const getStepValidationMessage = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        if (status === 'PENDING' && catatan.trim() === '') {
          return { type: 'info', message: 'Opsional: Tambahkan catatan untuk memberikan detail lebih lanjut' }
        }
        return { type: 'success', message: 'Status pelaksanaan sudah diatur' }
      case 1:
        if (!pelaksanaan?.dokumentasi || pelaksanaan.dokumentasi.length === 0) {
          return { type: 'info', message: 'Opsional: Upload foto atau video kegiatan untuk dokumentasi' }
        }
        return { type: 'success', message: `${pelaksanaan.dokumentasi.length} dokumentasi tersedia` }
      case 2:
        if (selectedAlumni.length === 0) {
          return { type: 'info', message: 'Opsional: Tambahkan daftar peserta yang hadir' }
        }
        return { type: 'success', message: `${selectedAlumni.length} peserta terpilih` }
      case 3:
        return { type: 'info', message: 'Tinjau semua perubahan sebelum menyimpan' }
      default:
        return { type: 'info', message: '' }
    }
  }

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' && currentStep > 0) {
        event.preventDefault()
        prevStep()
      } else if (event.key === 'ArrowRight' && canProceedToNext()) {
        event.preventDefault()
        nextStep()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, canProceedToNext])  // Auto-save functionality - removed since we only save at the end
  
  // Reset selected participants page when size changes
  useEffect(() => {
    setSelectedPage(0)
  }, [selectedSize])
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data pelaksanaan...</p>
        </div>
      </div>
    )
  }

  if (!pelaksanaan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Pelaksanaan tidak ditemukan</h1>
          <p className="text-muted-foreground mb-4">Pelaksanaan yang Anda cari tidak ada atau telah dihapus.</p>
          <Button onClick={() => router.push('/pelaksanaan')}>
            Kembali ke Daftar Pelaksanaan
          </Button>
        </div>
      </div>
    )
  }

  if (!canEdit()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Akses Ditolak</h1>
          <p className="text-muted-foreground mb-4">Anda tidak memiliki izin untuk mengedit pelaksanaan ini.</p>          <Button onClick={() => router.push(`/pelaksanaan/${params?.id || ''}`)}>
            Lihat Detail Pelaksanaan
          </Button>
        </div>
      </div>
    )
  }  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <div className="bg-background border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/pelaksanaan')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  Edit Pelaksanaan
                </h1>
                <p className="text-sm text-muted-foreground">
                  Langkah {currentStep + 1} dari {steps.length}: {steps[currentStep].description}
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Simple Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const IconComponent = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep || isStepCompleted(index)
              const isAccessible = index <= currentStep
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => isAccessible && goToStep(index)}
                    disabled={!isAccessible}                    className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-all ${
                      isActive 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : isCompleted 
                        ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20' 
                        : isAccessible
                        ? 'text-muted-foreground hover:bg-muted'
                        : 'text-muted-foreground/50 cursor-not-allowed'
                    }`}
                  >                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isActive 
                        ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-600' 
                        : isCompleted 
                        ? 'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-600' 
                        : 'bg-muted border-border'
                    }`}>
                      {isCompleted && !isActive ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <IconComponent className="h-5 w-5" />
                      )}
                    </div>
                    <span className="text-xs font-medium">{step.label}</span>
                  </button>                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-300' : 'bg-muted'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
            {/* Progress Bar */}
          <div className="flex items-center gap-2 mb-2">
            <Progress value={(currentStep / (steps.length - 1)) * 100} className="h-2" />
            <span className="text-xs text-muted-foreground min-w-fit">
              {Math.round((currentStep / (steps.length - 1)) * 100)}%
            </span>
          </div>
        </div>

        {/* Usulan Info Card - Simplified */}
        <Card className="mb-6 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">              {pelaksanaan.usulan?.gambarUrl && (
                <div className="relative w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={`${config.baseUrl}${pelaksanaan.usulan.gambarUrl}`}
                    alt={pelaksanaan.usulan.judul || 'Gambar usulan'}
                    fill
                    className="object-cover"
                  />
                </div>
              )}<div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  {pelaksanaan.usulan?.judul || 'Judul tidak tersedia'}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  oleh {pelaksanaan.usulan?.namaPengusul || 'Nama tidak tersedia'}
                </p>
                {pelaksanaan.usulan?.tanggalMulai && pelaksanaan.usulan?.tanggalSelesai && (
                  <p className="text-xs text-muted-foreground">
                    {formatDate(pelaksanaan.usulan.tanggalMulai)} - {formatDate(pelaksanaan.usulan.tanggalSelesai)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>        {/* Step Content - Simplified */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">Update Status Pelaksanaan</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status Pelaksanaan</Label>
                    <Select value={status} onValueChange={(value: 'PENDING' | 'SUKSES' | 'GAGAL') => setStatus(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="SUKSES">Sukses</SelectItem>
                        <SelectItem value="GAGAL">Gagal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <StatusBadge status={status} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="catatan">Catatan</Label>
                  <Textarea
                    id="catatan"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Tambahkan catatan hasil pelaksanaan..."
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-blue-500" />
                    <h2 className="text-lg font-semibold">Dokumentasi Kegiatan</h2>
                  </div>
                  <Button 
                    onClick={() => setShowDokumentasiForm(!showDokumentasiForm)}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Foto
                  </Button>
                </div>                {/* Upload Form */}
                {showDokumentasiForm && (
                  <Card className="border-2 border-dashed border-muted-foreground/25 bg-muted/50 dark:bg-muted/30">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">Upload Dokumentasi Baru</h3>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowDokumentasiForm(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="dokumentasi-judul">Judul (Opsional)</Label>
                          <Input
                            id="dokumentasi-judul"
                            value={dokumentasiJudul}
                            onChange={(e) => setDokumentasiJudul(e.target.value)}
                            placeholder="Judul dokumentasi..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dokumentasi-file">File</Label>
                          <Input
                            id="dokumentasi-file"
                            type="file"
                            accept="image/*,video/*"
                            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dokumentasi-deskripsi">Deskripsi (Opsional)</Label>
                        <Textarea
                          id="dokumentasi-deskripsi"
                          value={dokumentasiDeskripsi}
                          onChange={(e) => setDokumentasiDeskripsi(e.target.value)}
                          placeholder="Deskripsi dokumentasi..."
                          rows={2}
                        />
                      </div>                      {dokumentasiFile && previewUrl && (                        <div className="space-y-2">
                          <Label>Preview</Label>
                          <div className="border rounded-lg p-2 bg-card">
                            {isImageFile(dokumentasiFile) ? (
                              <div className="relative w-full h-32 bg-muted rounded">
                                <Image
                                  src={previewUrl}
                                  alt="Preview"
                                  fill
                                  className="object-contain rounded"
                                />
                              </div>
                            ) : isVideoFile(dokumentasiFile) ? (
                              <video
                                src={previewUrl}
                                controls
                                className="w-full h-32 bg-black rounded"
                              >
                                Your browser does not support the video tag.
                              </video>
                            ) : null}
                          </div>
                        </div>
                      )}<Button 
                        onClick={handleAddDokumentasi} 
                        disabled={!dokumentasiFile || uploadingDokumentasi}
                        className="w-full"
                      >
                        {uploadingDokumentasi ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Mengupload...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Dokumentasi
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Existing Documentation */}
                {pelaksanaan.dokumentasi && pelaksanaan.dokumentasi.length > 0 ? (
                  <div className="space-y-4">                    <h3 className="font-medium">Dokumentasi yang ada ({pelaksanaan.dokumentasi.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pelaksanaan.dokumentasi.map((dok) => (
                        <Card key={dok.id} className="overflow-hidden">
                          {dok.fotoUrl && (
                            <div className="relative h-32 bg-muted">
                              {dok.fotoUrl.toLowerCase().match(/\.(mp4|webm|ogg|avi|mov)$/i) ? (
                                <video
                                  src={`${config.baseUrl}${dok.fotoUrl}`}
                                  controls
                                  className="w-full h-32 object-cover"
                                >
                                  Your browser does not support the video tag.
                                </video>
                              ) : (
                                <Image
                                  src={`${config.baseUrl}${dok.fotoUrl}`}
                                  alt={dok.judul || 'Dokumentasi'}
                                  fill
                                  className="object-cover"
                                />
                              )}
                            </div>
                          )}
                          <CardContent className="p-3">
                            {dok.judul && (
                              <h4 className="font-medium text-sm mb-1">{dok.judul}</h4>                            )}
                            {dok.deskripsi && (
                              <p className="text-xs text-muted-foreground mb-2">{dok.deskripsi}</p>
                            )}
                            <div className="text-xs text-muted-foreground">
                              <p>Oleh: {dok.namaUploader}</p>
                              <p>{formatDateTime(dok.createdAt)}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Belum ada dokumentasi. Klik "Tambah Foto" untuk memulai.</p>
                  </div>
                )}
              </div>
            )}            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">Daftar Peserta</h2>
                </div>
                
                {/* Advanced Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Filter Alumni
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Text Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Nama Lengkap</Label>
                        <Input
                          value={alumniFilters.nama}
                          onChange={(e) => setAlumniFilters(prev => ({ ...prev, nama: e.target.value }))}
                          placeholder="Cari nama..."
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Nomor Telepon</Label>
                        <Input
                          value={alumniFilters.nomorTelepon}
                          onChange={(e) => setAlumniFilters(prev => ({ ...prev, nomorTelepon: e.target.value }))}
                          placeholder="Cari nomor..."
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Tahun Alumni</Label>
                        <Input
                          value={alumniFilters.alumniTahun}
                          onChange={(e) => setAlumniFilters(prev => ({ ...prev, alumniTahun: e.target.value }))}
                          placeholder="Cari tahun..."
                          className="h-8 text-sm"
                        />
                      </div>                      <div className="space-y-1">
                        <Label className="text-xs">Spesialisasi</Label>
                        <Combobox
                          options={filterOptions.spesialisasi.map(item => ({ value: item, label: item }))}
                          value={alumniFilters.spesialisasi}
                          onValueChange={(value) => setAlumniFilters(prev => ({ ...prev, spesialisasi: value }))}
                          placeholder={loadingFilterOptions ? "Memuat..." : "Pilih spesialisasi..."}
                          searchPlaceholder="Cari spesialisasi..."
                          emptyMessage="Spesialisasi tidak ditemukan"
                          disabled={loadingFilterOptions}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Pekerjaan</Label>
                        <Combobox
                          options={filterOptions.pekerjaan.map(item => ({ value: item, label: item }))}
                          value={alumniFilters.pekerjaan}
                          onValueChange={(value) => setAlumniFilters(prev => ({ ...prev, pekerjaan: value }))}
                          placeholder={loadingFilterOptions ? "Memuat..." : "Pilih pekerjaan..."}
                          searchPlaceholder="Cari pekerjaan..."
                          emptyMessage="Pekerjaan tidak ditemukan"
                          disabled={loadingFilterOptions}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                      {/* Location Filters */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Provinsi</Label>
                        <Combobox
                          options={[
                            { value: 'all', label: 'Semua Provinsi' },
                            ...locationData.provinsiOptions.map(provinsi => ({ value: provinsi, label: provinsi }))
                          ]}
                          value={alumniLocationFilter.provinsi}
                          onValueChange={(value) => setAlumniLocationFilter(prev => ({ ...prev, provinsi: value }))}
                          placeholder={loadingLocationData ? "Memuat..." : "Pilih provinsi"}
                          searchPlaceholder="Cari provinsi..."
                          emptyMessage="Provinsi tidak ditemukan"
                          disabled={loadingLocationData}
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Kota</Label>
                        <Combobox
                          options={[
                            { value: 'all', label: 'Semua Kota' },
                            ...locationData.kotaOptions.map(kota => ({ value: kota, label: kota }))
                          ]}
                          value={alumniLocationFilter.kota}
                          onValueChange={(value) => setAlumniLocationFilter(prev => ({ ...prev, kota: value }))}
                          placeholder={loadingLocationData ? "Memuat..." : "Pilih kota"}
                          searchPlaceholder="Cari kota..."
                          emptyMessage="Kota tidak ditemukan"
                          disabled={loadingLocationData}
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Kecamatan</Label>
                        <Combobox
                          options={[
                            { value: 'all', label: 'Semua Kecamatan' },
                            ...locationData.kecamatanOptions.map(kecamatan => ({ value: kecamatan, label: kecamatan }))
                          ]}
                          value={alumniLocationFilter.kecamatan}
                          onValueChange={(value) => setAlumniLocationFilter(prev => ({ ...prev, kecamatan: value }))}
                          placeholder={loadingLocationData ? "Memuat..." : "Pilih kecamatan"}
                          searchPlaceholder="Cari kecamatan..."
                          emptyMessage="Kecamatan tidak ditemukan"
                          disabled={loadingLocationData}
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Kelurahan</Label>
                        <Combobox
                          options={[
                            { value: 'all', label: 'Semua Kelurahan' },
                            ...locationData.kelurahanOptions.map(kelurahan => ({ value: kelurahan, label: kelurahan }))
                          ]}
                          value={alumniLocationFilter.kelurahan}
                          onValueChange={(value) => setAlumniLocationFilter(prev => ({ ...prev, kelurahan: value }))}
                          placeholder={loadingLocationData ? "Memuat..." : "Pilih kelurahan"}
                          searchPlaceholder="Cari kelurahan..."
                          emptyMessage="Kelurahan tidak ditemukan"
                          disabled={loadingLocationData}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                      {/* Clear Filters Button */}
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAlumniFilters({
                            nama: '',
                            nomorTelepon: '',
                            alumniTahun: '',
                            spesialisasi: '',
                            pekerjaan: ''
                          })
                          setAlumniLocationFilter({
                            provinsi: 'all',
                            kota: 'all',
                            kecamatan: 'all',
                            kelurahan: 'all'
                          })
                        }}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Reset Filter
                      </Button>
                    </div>
                  </CardContent>
                </Card>                {/* Alumni List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Alumni Tersedia ({alumniTotalElements} total)
                      </span>
                      <div className="flex items-center gap-2">
                        {!loadingAlumni && availableAlumni.filter(alumni => 
                          !selectedAlumni.some(selected => selected.biografiId === alumni.biografiId)
                        ).length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAllVisible}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Pilih Semua ({availableAlumni.filter(alumni => 
                              !selectedAlumni.some(selected => selected.biografiId === alumni.biografiId)
                            ).length})
                          </Button>
                        )}
                        {loadingAlumni && (                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-3 h-3 border border-border border-t-primary rounded-full animate-spin" />
                            Memuat...
                          </div>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Page Size Selector */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Label className="text-xs">Tampilkan:</Label>
                        <Select
                          value={alumniSize.toString()}
                          onValueChange={(value) => {
                            setAlumniSize(parseInt(value))
                            setAlumniPage(0) // Reset to first page
                          }}
                        >
                          <SelectTrigger className="h-8 w-20 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                            <SelectItem value="1000">1000</SelectItem>
                            <SelectItem value="10000">10000</SelectItem>
                          </SelectContent>
                        </Select>                        <span className="text-xs text-muted-foreground">per halaman</span>
                      </div>
                      
                      {/* Page Info */}
                      {!loadingAlumni && alumniTotalPages > 1 && (
                        <div className="text-xs text-muted-foreground">
                          Halaman {alumniPage + 1} dari {alumniTotalPages}
                        </div>
                      )}
                    </div>
                    
                    {loadingAlumni ? (
                      <div className="flex items-center justify-center py-8 text-muted-foreground">
                        <div className="w-6 h-6 border border-border border-t-primary rounded-full animate-spin mr-2" />
                        Memuat data member...
                      </div>
                    ) : availableAlumni.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Tidak ada member yang sesuai dengan filter</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {availableAlumni
                          .filter(alumni => !selectedAlumni.some(selected => selected.biografiId === alumni.biografiId))
                          .map((alumni) => {
                            const isSelected = selectedAlumni.some(selected => selected.biografiId === alumni.biografiId)
                            const provinsiName = getLocationName(alumni.provinsi, locationMappings.provinsi)
                            const kotaName = getLocationName(alumni.kota, locationMappings.kota)
                            const kecamatanName = getLocationName(alumni.kecamatan, locationMappings.kecamatan)
                            const kelurahanName = getLocationName(alumni.kelurahan, locationMappings.kelurahan)
                            
                            return (                              <div 
                                key={alumni.biografiId} 
                                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                                  isSelected 
                                    ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900' 
                                    : 'bg-background hover:bg-accent border-border'
                                }`}
                                onClick={() => handleToggleAlumniSelection(alumni)}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <Checkbox
                                    checked={isSelected}
                                    onChange={() => {}} // Controlled by parent onClick
                                    className="pointer-events-none"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium">{alumni.namaLengkap}</span>
                                      {alumni.alumniTahun && (
                                        <Badge variant="outline" className="text-xs">
                                          {alumni.alumniTahun}
                                        </Badge>
                                      )}
                                      {isSelected && (
                                        <Badge variant="secondary" className="text-xs">
                                          Terpilih
                                        </Badge>
                                      )}
                                    </div>                                    <div className="text-xs text-muted-foreground space-x-2">
                                      <span>{alumni.email}</span>
                                      {alumni.nomorTelepon && <span>• {alumni.nomorTelepon}</span>}
                                      {alumni.pekerjaanSaatIni && <span>• {alumni.pekerjaanSaatIni}</span>}
                                      {alumni.posisiJabatan && <span>• {alumni.posisiJabatan}</span>}
                                    </div>
                                    {(provinsiName || kotaName || kecamatanName || kelurahanName) && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        📍 {[provinsiName, kotaName, kecamatanName, kelurahanName].filter(Boolean).join(', ')}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    )}
                      {/* Pagination */}
                    {!loadingAlumni && alumniTotalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-xs text-muted-foreground">
                          Menampilkan {((alumniPage * alumniSize) + 1)} - {Math.min((alumniPage + 1) * alumniSize, alumniTotalElements)} dari {alumniTotalElements} alumni
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAlumniPage(prev => Math.max(0, prev - 1))}
                            disabled={alumniPage === 0}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          
                          {/* Page numbers */}
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, alumniTotalPages) }, (_, i) => {
                              let pageNum
                              if (alumniTotalPages <= 5) {
                                pageNum = i
                              } else if (alumniPage < 3) {
                                pageNum = i
                              } else if (alumniPage > alumniTotalPages - 4) {
                                pageNum = alumniTotalPages - 5 + i
                              } else {
                                pageNum = alumniPage - 2 + i
                              }
                              
                              return (
                                <Button
                                  key={pageNum}
                                  variant={pageNum === alumniPage ? "default" : "outline"}
                                  size="sm"
                                  className="w-8 h-8 p-0 text-xs"
                                  onClick={() => setAlumniPage(pageNum)}
                                >
                                  {pageNum + 1}
                                </Button>
                              )
                            })}
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAlumniPage(prev => Math.min(alumniTotalPages - 1, prev + 1))}
                            disabled={alumniPage >= alumniTotalPages - 1}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>                {/* Selected Participants */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Peserta Terpilih ({selectedAlumni.length})
                      </CardTitle>
                      {selectedAlumni.length > 0 && (
                        <div className="flex items-center gap-2">                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleHadirSemua}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950"
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            Hadir Semua
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleTidakHadirSemua}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                          >
                            <UserX className="h-3 w-3 mr-1" />
                            Tidak Hadir Semua
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedAlumni.length === 0 ? (                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Belum ada peserta. Pilih alumni dari daftar di atas.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Pagination Controls */}
                        <div className="flex items-center justify-between border-b pb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Label className="text-xs">Tampilkan:</Label>
                            <Select
                              value={selectedSize.toString()}
                              onValueChange={(value) => {
                                setSelectedSize(parseInt(value))
                                setSelectedPage(0) // Reset to first page
                              }}
                            >
                              <SelectTrigger className="h-8 w-20 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                                <SelectItem value="1000">1000</SelectItem>
                              </SelectContent>
                            </Select>                            <span className="text-xs text-muted-foreground">per halaman</span>
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            {selectedAlumni.filter(p => p.hadir).length} hadir • {selectedAlumni.filter(p => !p.hadir).length} tidak hadir
                          </div>
                        </div>

                        {/* Participant List with Pagination */}
                        <div className="space-y-2">
                          {selectedAlumni
                            .slice(selectedPage * selectedSize, (selectedPage + 1) * selectedSize)
                            .map((peserta) => (                              <div key={peserta.biografiId} className="flex items-center justify-between p-4 border rounded-lg bg-background">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium">{peserta.namaAlumni}</span>
                                      <Badge 
                                        variant={peserta.hadir ? "default" : "secondary"} 
                                        className={`text-xs ${
                                          peserta.hadir 
                                            ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 border-green-200 dark:border-green-800" 
                                            : "bg-muted text-muted-foreground border-muted"
                                        }`}
                                      >
                                        {peserta.hadir ? "Hadir" : "Tidak Hadir"}
                                      </Badge>
                                    </div>                                    <div className="text-xs text-muted-foreground mb-2">
                                      {peserta.emailAlumni}
                                    </div>
                                    
                                    {/* Status Kehadiran Buttons */}
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant={peserta.hadir ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                          if (!peserta.hadir) {
                                            handleToggleKehadiran(peserta.biografiId)
                                          }
                                        }}                                        className={`text-xs h-7 ${
                                          peserta.hadir 
                                            ? "bg-green-600 hover:bg-green-700 text-white" 
                                            : "hover:bg-green-50 dark:hover:bg-green-950 hover:text-green-600 dark:hover:text-green-400 hover:border-green-300 dark:hover:border-green-700"
                                        }`}
                                      >
                                        <UserCheck className="h-3 w-3 mr-1" />
                                        Hadir
                                      </Button>
                                      <Button
                                        variant={!peserta.hadir ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                          if (peserta.hadir) {
                                            handleToggleKehadiran(peserta.biografiId)
                                          }
                                        }}                                        className={`text-xs h-7 ${
                                          !peserta.hadir 
                                            ? "bg-red-600 hover:bg-red-700 text-white" 
                                            : "hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700"
                                        }`}
                                      >
                                        <UserX className="h-3 w-3 mr-1" />
                                        Tidak Hadir
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"                                  size="sm"
                                  onClick={() => handleRemoveAlumni(peserta.biografiId)}
                                  className="ml-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                        </div>

                        {/* Pagination Navigation */}
                        {selectedAlumni.length > selectedSize && (                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="text-xs text-muted-foreground">
                              Menampilkan {(selectedPage * selectedSize) + 1} - {Math.min((selectedPage + 1) * selectedSize, selectedAlumni.length)} dari {selectedAlumni.length} peserta
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedPage(prev => Math.max(0, prev - 1))}
                                disabled={selectedPage === 0}
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              
                              {/* Page numbers for selected participants */}
                              <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, Math.ceil(selectedAlumni.length / selectedSize)) }, (_, i) => {
                                  const totalPages = Math.ceil(selectedAlumni.length / selectedSize)
                                  let pageNum
                                  if (totalPages <= 5) {
                                    pageNum = i
                                  } else if (selectedPage < 3) {
                                    pageNum = i
                                  } else if (selectedPage > totalPages - 4) {
                                    pageNum = totalPages - 5 + i
                                  } else {
                                    pageNum = selectedPage - 2 + i
                                  }
                                  
                                  return (
                                    <Button
                                      key={pageNum}
                                      variant={pageNum === selectedPage ? "default" : "outline"}
                                      size="sm"
                                      className="w-8 h-8 p-0 text-xs"
                                      onClick={() => setSelectedPage(pageNum)}
                                    >
                                      {pageNum + 1}
                                    </Button>
                                  )
                                })}
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedPage(prev => Math.min(Math.ceil(selectedAlumni.length / selectedSize) - 1, prev + 1))}
                                disabled={selectedPage >= Math.ceil(selectedAlumni.length / selectedSize) - 1}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="h-5 w-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">Review & Selesai</h2>
                </div>

                <div className="space-y-6">
                  {/* Status Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <CheckCircle className="h-5 w-5" />
                        Status Pelaksanaan
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-2">
                        <StatusBadge status={status} />
                      </div>
                      {catatan ? (
                        <div className="bg-muted p-3 rounded">
                          <p className="text-sm">{catatan}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Tidak ada catatan untuk status ini.</p>
                      )}
                    </CardContent>
                  </Card>                  {/* Documentation Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Camera className="h-5 w-5" />
                        Dokumentasi Pelaksanaan
                        {pelaksanaan.dokumentasi && pelaksanaan.dokumentasi.length > 0 && (
                          <Badge variant="secondary">{pelaksanaan.dokumentasi.length}</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {pelaksanaan.dokumentasi && pelaksanaan.dokumentasi.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {pelaksanaan.dokumentasi.map((dok) => (
                            <Card key={dok.id} className="overflow-hidden">
                              {dok.fotoUrl && (
                                <div className="relative h-32 bg-muted">
                                                                   {dok.fotoUrl.toLowerCase().match(/\.(mp4|webm|ogg|avi|mov)$/i) ? (
                                    <video
                                      src={`${config.baseUrl}${dok.fotoUrl}`}
                                      controls
                                      className="w-full h-32 object-cover"
                                    >
                                      Your browser does not support the video tag.
                                    </video>
                                  ) : (
                                    <Image
                                      src={`${config.baseUrl}${dok.fotoUrl}`}
                                      alt={dok.judul || 'Dokumentasi'}
                                      fill
                                      className="object-cover"
                                    />
                                  )}
                                </div>
                              )}
                              <CardContent className="p-3">
                                {dok.judul && (
                                  <h4 className="font-medium text-sm mb-1">{dok.judul}</h4>
                                )}
                                {dok.deskripsi && (
                                  <p className="text-xs text-muted-foreground mb-2">{dok.deskripsi}</p>
                                )}
                                <div className="text-xs text-muted-foreground">
                                  <p>Oleh: {dok.namaUploader}</p>
                                  <p>{formatDateTime(dok.createdAt)}</p>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Belum ada dokumentasi yang diupload.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Participants Summary - Match Detail View Format */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Users className="h-5 w-5" />
                          Daftar Peserta
                          <Badge variant="secondary" className="ml-2">
                            {selectedAlumni.length} peserta
                          </Badge>
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <UserCheck className="h-4 w-4 text-green-600" />
                            <span>{selectedAlumni.filter(p => p.hadir).length} hadir</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <UserX className="h-4 w-4 text-red-600" />
                            <span>{selectedAlumni.filter(p => !p.hadir).length} tidak hadir</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {selectedAlumni.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">Belum ada peserta yang dipilih</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedAlumni.map((peserta) => {
                            // Find the corresponding biografi for this participant
                            const biografi = availableAlumni.find(a => a.biografiId === peserta.biografiId);
                            
                            return (
                              <div key={peserta.biografiId} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                {/* Profile Picture */}
                                <div className="relative">
                                  {biografi?.fotoProfil ? (
                                    <div className="relative w-12 h-12 rounded-full overflow-hidden">
                                      <Image
                                        src={`${config.baseUrl}${biografi.fotoProfil}`}
                                        alt={peserta.namaAlumni}
                                        fill
                                        className="object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none'
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                                      <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                  )}
                                  
                                  {/* Status Indicator */}
                                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                    {peserta.hadir ? (
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
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-sm">{peserta.namaAlumni}</h4>
                                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                          <Mail className="h-3 w-3" />
                                          <span className="truncate">{peserta.emailAlumni}</span>
                                        </div>
                                        {biografi?.jurusan && (
                                          <div className="flex items-center gap-1">
                                            <GraduationCap className="h-3 w-3" />
                                            <span>{biografi.jurusan}</span>
                                          </div>
                                        )}
                                        {biografi?.alumniTahun && (
                                          <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>Alumni {biografi.alumniTahun}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Status Badge */}
                                    <div className="flex items-center gap-2">
                                      <Badge 
                                        variant={peserta.hadir ? 'default' : 'destructive'}
                                        className={
                                          peserta.hadir ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                          'bg-red-100 text-red-800 hover:bg-red-100'
                                        }
                                      >
                                        {peserta.hadir ? <UserCheck className="h-3 w-3 mr-1" /> : <UserX className="h-3 w-3 mr-1" />}
                                        {peserta.hadir ? 'Hadir' : 'Tidak Hadir'}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Button 
                    onClick={handleFinalSave}
                    disabled={saving}
                    className="w-full"
                    size="lg"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Selesai & Simpan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Sebelumnya
          </Button>
          
          <div className="text-sm text-gray-500">
            {currentStep + 1} dari {steps.length}
          </div>
          
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={nextStep}
              disabled={!canProceedToNext()}
              className="flex items-center gap-2"
            >
              Selanjutnya
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleFinalSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Selesai
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
