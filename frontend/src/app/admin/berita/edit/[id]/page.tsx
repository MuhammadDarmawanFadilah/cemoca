'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Upload, 
  Plus,
  X,
  CheckCircle,
  Image as ImageIcon,
  FileText,
  User,
  Tag,
  Settings,
  Sparkles,
  Edit3,
  Clock,
  Globe,
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  Send,
  Search,
  Calendar,
  Bookmark,
  Share2
} from 'lucide-react'
import { toast } from 'sonner'
import { beritaAPI, imageAPI, biografiAPI, type Berita, type BeritaRequest, type Biografi } from '@/lib/api'

// Helper functions to match the news detail page
const getKategoriDisplay = (kategori: string) => {
  const kategoriMap: Record<string, string> = {
    'UMUM': 'Umum',
    'AKADEMIK': 'Akademik', 
    'KARIR': 'Karir',
    'ALUMNI': 'Alumni',
    'TEKNOLOGI': 'Teknologi',
    'OLAHRAGA': 'Olahraga',
    'KEGIATAN': 'Kegiatan'
  }
  return kategoriMap[kategori] || kategori
}

const calculateReadTime = (content: string) => {
  const wordsPerMinute = 200
  const wordCount = content.split(' ').length
  const readTime = Math.ceil(wordCount / wordsPerMinute)
  return `${readTime} menit baca`
}

const getExcerpt = (content: string, maxLength: number = 150) => {
  const textContent = content.replace(/<[^>]*>/g, '')
  return textContent.length > maxLength 
    ? textContent.substring(0, maxLength) + '...'
    : textContent
}

const categoryColors = {
  "UMUM": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "AKADEMIK": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  "KARIR": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "ALUMNI": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  "TEKNOLOGI": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  "OLAHRAGA": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  "KEGIATAN": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300"
}

const STEPS = [  {
    id: 1,
    title: 'Informasi Dasar',
    description: 'Judul dan penulis berita',
    icon: FileText,
    color: 'from-blue-500 to-cyan-500'
  },  {
    id: 2,
    title: 'Konten',
    description: 'Konten utama berita',
    icon: Edit3,
    color: 'from-purple-500 to-pink-500'
  },  {
    id: 3,
    title: 'Ringkasan',
    description: 'Ringkasan dan preview berita',
    icon: Sparkles,
    color: 'from-yellow-500 to-orange-500'
  },
  {
    id: 4,
    title: 'Media & Tags',
    description: 'Gambar, lampiran dan tag',
    icon: ImageIcon,
    color: 'from-green-500 to-teal-500'
  },
  {
    id: 5,
    title: 'Pengaturan',
    description: 'Kategori dan status',
    icon: Settings,
    color: 'from-orange-500 to-red-500'
  }
]

interface MediaLampiran {
  id: string
  type: 'IMAGE' | 'VIDEO'
  url: string
  caption?: string
}

interface FormData {
  judul: string
  ringkasan: string
  ringkasanWordCount: number
  konten: string
  penulis: string
  penulisBiografiId?: number
  kategori: 'UMUM' | 'AKADEMIK' | 'KARIR' | 'ALUMNI' | 'TEKNOLOGI' | 'OLAHRAGA' | 'KEGIATAN' | ''
  tags: string[]
  gambarUrl: string
  mediaLampiran: MediaLampiran[]
  featured: boolean
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
}

export default function EditBeritaPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [originalData, setOriginalData] = useState<Berita | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  
  // Biografi autocomplete states
  const [biografiList, setBiografiList] = useState<Biografi[]>([])
  const [biografiSearch, setBiografiSearch] = useState('')
  const [showBiografiDropdown, setShowBiografiDropdown] = useState(false)
  const [selectedBiografi, setSelectedBiografi] = useState<Biografi | null>(null)
    const [formData, setFormData] = useState<FormData>({
    judul: '',
    ringkasan: '',
    ringkasanWordCount: 30,
    konten: '',
    penulis: '',
    penulisBiografiId: undefined,
    kategori: '',
    tags: [],
    gambarUrl: '',
    mediaLampiran: [],
    featured: false,
    status: 'DRAFT'  })

  // Auto generate ringkasan dari konten (berdasarkan jumlah karakter)
  const generateSummary = (content: string, charCount: number): string => {
    if (!content) return ''
    
    // Remove HTML tags and get plain text
    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    
    if (plainText.length <= charCount) {
      return plainText
    }
    
    return plainText.substring(0, charCount) + '...'
  }

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Load existing berita data
  useEffect(() => {
    if (id) {
      loadBeritaData()
    }
  }, [id])
  
  const loadBeritaData = async () => {
    try {
      setLoadingData(true)
      const berita = await beritaAPI.getBeritaDetailById(parseInt(id))
      setOriginalData(berita)
        // Parse tags from comma-separated string to array
      const tagsArray = berita.tags ? berita.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
      
      // Parse media lampiran from JSON string to array
      let mediaLampiranArray: MediaLampiran[] = []
      try {
        if (berita.mediaLampiran && typeof berita.mediaLampiran === 'string') {
          mediaLampiranArray = JSON.parse(berita.mediaLampiran)
        } else if (Array.isArray(berita.mediaLampiran)) {
          mediaLampiranArray = berita.mediaLampiran
        }
      } catch (error) {
        console.error('Error parsing mediaLampiran:', error)
        mediaLampiranArray = []
      }
        // Populate form with existing data
      setFormData({
        judul: berita.judul,
        ringkasan: berita.ringkasan,
        ringkasanWordCount: berita.ringkasanWordCount || 150,
        konten: berita.konten,
        penulis: berita.penulis || '',
        penulisBiografiId: berita.penulisBiografiId,
        kategori: berita.kategori,
        tags: tagsArray,
        gambarUrl: berita.gambarUrl || '',
        mediaLampiran: mediaLampiranArray,
        featured: false, // Would need to be implemented in backend
        status: berita.status
      })
      
      // Load selected biografi if exists
      if (berita.penulisBiografiId) {
        try {
          const biografi = await biografiAPI.getBiografiById(berita.penulisBiografiId)
          setSelectedBiografi(biografi)
          setBiografiSearch(biografi.namaLengkap)
        } catch (error) {
          console.error('Error loading biografi:', error)
        }
      }
        // Set image preview if image exists - don't pre-process the URL
      if (berita.gambarUrl) {
        setImagePreview('') // Clear any previous preview
        // The gambarUrl is already set in formData, no need for imagePreview
      }
      
      toast.success('Data berita berhasil dimuat')
    } catch (error) {
      console.error('Error loading berita:', error)
      toast.error('Gagal memuat data berita')
      router.push('/admin/berita')
    } finally {      setLoadingData(false)
    }
  }

  // Load biografi data for autocomplete
  useEffect(() => {
    const loadBiografiData = async () => {
      try {
        const response = await biografiAPI.getAllBiografi(0, 100)
        setBiografiList(response.content || [])
      } catch (error) {
        console.error('Error loading biografi:', error)
      }
    }
    loadBiografiData()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-biografi-dropdown]')) {
        setShowBiografiDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Biografi search and selection functions
  const handleBiografiSearch = (searchTerm: string) => {
    setBiografiSearch(searchTerm)
    setShowBiografiDropdown(true)
    
    if (!searchTerm.trim()) {
      setSelectedBiografi(null)
      setFormData(prev => ({ ...prev, penulis: '', penulisBiografiId: undefined }))
    }
  }
  const selectBiografi = (biografi: Biografi) => {
    setSelectedBiografi(biografi)
    setBiografiSearch(biografi.namaLengkap)
    setShowBiografiDropdown(false)
    setFormData(prev => ({ 
      ...prev, 
      penulis: biografi.namaLengkap,
      penulisBiografiId: biografi.biografiId 
    }))
  }

  const getFilteredBiografi = () => {
    if (!biografiSearch.trim()) return biografiList.slice(0, 5)
    return biografiList
      .filter(biografi => 
        biografi.namaLengkap.toLowerCase().includes(biografiSearch.toLowerCase()) ||
        biografi.email?.toLowerCase().includes(biografiSearch.toLowerCase())
      )
      .slice(0, 5)
  }

  // Auto-generate summary when content or word count changes
  useEffect(() => {
    if (formData.konten) {
      const autoSummary = generateSummary(formData.konten, formData.ringkasanWordCount)
      if (autoSummary && autoSummary !== formData.ringkasan) {
        setFormData(prev => ({ ...prev, ringkasan: autoSummary }))
      }
    }
  }, [formData.konten, formData.ringkasanWordCount])

  // Media lampiran functions
  const addMediaLampiran = (type: 'IMAGE' | 'VIDEO') => {
    const newMedia: MediaLampiran = {
      id: Date.now().toString(),
      type,
      url: '',
      caption: ''
    }
    setFormData(prev => ({
      ...prev,
      mediaLampiran: [...prev.mediaLampiran, newMedia]
    }))
  }

  const updateMediaLampiran = (id: string, field: keyof MediaLampiran, value: string) => {
    setFormData(prev => ({
      ...prev,
      mediaLampiran: prev.mediaLampiran.map(media =>
        media.id === id ? { ...media, [field]: value } : media
      )
    }))
  }

  const removeMediaLampiran = (id: string) => {
    setFormData(prev => ({
      ...prev,
      mediaLampiran: prev.mediaLampiran.filter(media => media.id !== id)
    }))
  }
  const handleMediaUpload = async (id: string, file: File) => {
    try {
      setUploadingMedia(true)
      const uploadResult = await imageAPI.uploadImage(file)
      updateMediaLampiran(id, 'url', uploadResult.filename)
      toast.success('Media berhasil diunggah')
    } catch (error) {
      toast.error('Gagal mengunggah media')
      console.error('Media upload error:', error)
    } finally {
      setUploadingMedia(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }

    try {
      setUploadingImage(true)
      const blobUrl = URL.createObjectURL(file)
      setImagePreview(blobUrl)
      setImageFile(file)
      
      const uploadResult = await imageAPI.uploadImage(file)
      URL.revokeObjectURL(blobUrl)
      
      const fullImageUrl = imageAPI.getImageUrl(uploadResult.filename)
      setImagePreview(fullImageUrl)
      handleInputChange('gambarUrl', uploadResult.filename)
      
      toast.success('Gambar berhasil diunggah')
    } catch (error) {
      toast.error(`Gagal mengunggah gambar: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error("Upload error:", error)
      setImagePreview('')
      setImageFile(null)
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview('')
    setFormData(prev => ({ ...prev, gambarUrl: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleInputChange('tags', [...formData.tags, tagInput.trim()])
      setTagInput('')
    }
  }
  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove))
  }

  const openPreviewInNewTab = () => {
    // Create preview data
    const previewData = {
      id: parseInt(id),
      judul: formData.judul || 'Judul Berita',
      ringkasan: formData.ringkasan || 'Ringkasan berita...',
      konten: formData.konten || 'Konten berita...',
      penulis: formData.penulis || 'Penulis',
      kategori: formData.kategori || 'UMUM',
      tags: formData.tags.join(','),
      gambarUrl: formData.gambarUrl || '',
      featured: formData.featured,
      status: formData.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      jumlahView: 0,
      jumlahLike: 0
    }

    // Store preview data in sessionStorage
    sessionStorage.setItem('berita-preview', JSON.stringify(previewData))
    sessionStorage.setItem('berita-preview-image', imagePreview || '')
    
    // Open preview in new tab
    const previewUrl = `/berita/preview?id=${id}`
    window.open(previewUrl, '_blank')
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.judul.trim()) {
          toast.error('Judul berita harus diisi')
          return false
        }
        if (formData.judul.length > 200) {
          toast.error('Judul maksimal 200 karakter')
          return false
        }
        if (!formData.ringkasan.trim()) {
          toast.error('Ringkasan berita harus diisi')
          return false
        }
        if (formData.ringkasan.length > 500) {
          toast.error('Ringkasan maksimal 500 karakter')
          return false
        }
        return true
      case 2:
        if (!formData.konten.trim()) {
          toast.error('Konten berita harus diisi')
          return false
        }
        if (formData.konten.length < 50) {
          toast.error('Konten minimal 50 karakter')
          return false
        }
        return true
      case 3:
        return true // Optional step
      case 4:
        if (!formData.kategori) {
          toast.error('Kategori harus dipilih')
          return false
        }
        return true
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const goToStep = (step: number) => {
    // Allow going to completed steps without validation
    if (step < currentStep) {
      setCurrentStep(step)
    } else {
      // Validate current step before moving forward
      if (validateStep(currentStep)) {
        setCurrentStep(step)
      }
    }
  }

  const getFormCompleteness = (): number => {
    let completed = 0
    if (formData.judul && formData.ringkasan) completed += 25
    if (formData.konten) completed += 25
    if (imagePreview || formData.gambarUrl) completed += 25
    if (formData.kategori) completed += 25
    return completed
  }

  const getStepProgress = (stepId: number): number => {
    switch (stepId) {
      case 1:
        return (formData.judul ? 50 : 0) + (formData.ringkasan ? 50 : 0)
      case 2:
        return formData.konten ? 100 : 0
      case 3:
        return (imagePreview || formData.gambarUrl ? 60 : 0) + (formData.tags.length > 0 ? 40 : 0)
      case 4:
        return formData.kategori ? 100 : 0
      default:        return 0
    }
  }

  const handleSubmit = async (isDraft = false) => {
    // Validate all steps for final submission
    for (let i = 1; i <= 4; i++) {
      if (!validateStep(i) && !isDraft) {
        setCurrentStep(i)
        return
      }
    }    try {
      setLoading(true);
      
      const submitData: BeritaRequest = {
        judul: formData.judul,
        ringkasan: formData.ringkasan,
        ringkasanWordCount: formData.ringkasanWordCount,
        konten: formData.konten,
        penulis: formData.penulis,
        penulisBiografiId: formData.penulisBiografiId,
        kategori: formData.kategori as 'UMUM' | 'AKADEMIK' | 'KARIR' | 'ALUMNI' | 'TEKNOLOGI' | 'OLAHRAGA' | 'KEGIATAN',
        tags: formData.tags.join(','), // Convert array to comma-separated string
        gambarUrl: formData.gambarUrl, // Use the filename stored in form data
        mediaLampiran: JSON.stringify(formData.mediaLampiran), // Convert array to JSON string
        status: isDraft ? 'DRAFT' as const : formData.status
      }

      await beritaAPI.updateBerita(parseInt(id), submitData)
      
      toast.success(`Berita berhasil ${isDraft ? 'disimpan sebagai draft' : 'diperbarui'}`)
      router.push('/admin/berita')
    } catch (error) {
      console.error('Error updating berita:', error)
      toast.error('Gagal memperbarui berita')
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="judul" className="text-sm font-medium">
                Judul Berita <span className="text-red-500">*</span>
              </Label>
              <Input
                id="judul"
                value={formData.judul}
                onChange={(e) => handleInputChange('judul', e.target.value)}
                placeholder="Masukkan judul berita yang menarik..."
                className="text-base"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {formData.judul.length}/200 karakter
              </p>            </div>

            <div className="space-y-2">
              <Label htmlFor="penulis" className="text-sm font-medium">
                Penulis <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="penulis"
                  value={biografiSearch}
                  onChange={(e) => handleBiografiSearch(e.target.value)}
                  onFocus={() => setShowBiografiDropdown(true)}
                  placeholder="Cari penulis dari daftar biografi..."
                  className="text-base"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                
                {showBiografiDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto" data-biografi-dropdown>
                    {getFilteredBiografi().map((biografi) => (
                      <div
                        key={biografi.biografiId}
                        onClick={() => selectBiografi(biografi)}
                        className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {biografi.namaLengkap.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{biografi.namaLengkap}</p>
                            <p className="text-xs text-muted-foreground">{biografi.email}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {getFilteredBiografi().length === 0 && (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        Tidak ada hasil ditemukan
                      </div>
                    )}
                  </div>
                )}
                
                {selectedBiografi && (
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          {selectedBiografi.namaLengkap}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Terpilih sebagai penulis
                        </p>
                      </div>
                    </div>
                  </div>                )}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="konten" className="text-sm font-medium">
                Konten Berita <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="konten"
                value={formData.konten}
                onChange={(e) => handleInputChange('konten', e.target.value)}
                placeholder="Tulis konten lengkap berita di sini... Gunakan paragraf yang jelas dan mudah dibaca."
                className="min-h-[300px] text-base leading-relaxed"
              />
              <p className="text-xs text-muted-foreground">
                Minimal 50 karakter. Saat ini: {formData.konten.length} karakter
              </p>
            </div>

            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                Tips: Gunakan paragraf pendek, subjudul, dan bahasa yang mudah dipahami untuk meningkatkan keterbacaan.
              </AlertDescription>
            </Alert>
          </div>        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ringkasan-count" className="text-sm font-medium">
                Jumlah Karakter Ringkasan
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  id="ringkasan-count"
                  type="number"
                  min="20"
                  max="200"
                  value={formData.ringkasanWordCount}
                  onChange={(e) => {
                    const count = parseInt(e.target.value) || 30
                    handleInputChange('ringkasanWordCount', count)
                  }}
                  className="w-24 text-base"
                />
                <span className="text-sm text-muted-foreground">karakter</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ringkasan" className="text-sm font-medium">
                Ringkasan Berita <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="ringkasan"
                value={formData.ringkasan}
                onChange={(e) => handleInputChange('ringkasan', e.target.value)}
                placeholder="Ringkasan akan dibuat otomatis dari konten, atau Anda bisa mengeditnya manual..."
                className="min-h-[100px] text-base"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {formData.ringkasan.length}/500 karakter
              </p>
            </div>

            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                Ringkasan yang baik memberikan gambaran singkat isi berita dalam 1-2 kalimat.
              </AlertDescription>
            </Alert>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">            <div className="space-y-4">
              <Label className="text-sm font-medium">Gambar Berita</Label>              {(imagePreview && imageFile) || formData.gambarUrl ? (
                <div className="relative w-full max-h-96 aspect-video rounded-lg border bg-gray-50 dark:bg-gray-800 overflow-hidden">
                  <Image
                    src={(imagePreview && imageFile) ? imagePreview : (formData.gambarUrl ? imageAPI.getImageUrl(formData.gambarUrl) : "/api/placeholder/400/300")}
                    alt="Preview"
                    fill
                    className="object-contain"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 z-10"
                    onClick={removeImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">Klik untuk mengunggah gambar</p>
                  <p className="text-xs text-gray-500">PNG, JPG hingga 5MB</p>
                </div>
              )}
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              
              {!(imagePreview && imageFile) && !formData.gambarUrl && (
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Pilih Gambar
                </Button>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <Label className="text-sm font-medium">Tags</Label>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="px-3 py-1"
                    >
                      {tag}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-auto p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Tambah tag..."
                  className="flex-1"
                />
                <Button onClick={addTag} disabled={!tagInput.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Tekan Enter atau klik + untuk menambah tag
              </p>
            </div>            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Media Lampiran</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addMediaLampiran('IMAGE')}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Foto
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addMediaLampiran('VIDEO')}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Video
                  </Button>
                </div>
              </div>
              
              {formData.mediaLampiran.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Belum ada media lampiran
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Klik tombol Foto atau Video untuk menambah lampiran
                  </p>
                </div>
              )}
              
              {formData.mediaLampiran.map((media, index) => (
                <div key={media.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${
                        media.type === 'IMAGE' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-purple-100 text-purple-600'
                      }`}>
                        {index + 1}
                      </div>
                      <Select 
                        value={media.type} 
                        onValueChange={(value: 'IMAGE' | 'VIDEO') => updateMediaLampiran(media.id, 'type', value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IMAGE">
                            <div className="flex items-center gap-2">
                              <ImageIcon className="w-4 h-4" />
                              Foto
                            </div>
                          </SelectItem>
                          <SelectItem value="VIDEO">
                            <div className="flex items-center gap-2">
                              <Upload className="w-4 h-4" />
                              Video
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMediaLampiran(media.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">URL Media</Label>
                    <div className="flex gap-2">
                      <Input
                        value={media.url}
                        onChange={(e) => updateMediaLampiran(media.id, 'url', e.target.value)}
                        placeholder={`URL ${media.type === 'IMAGE' ? 'foto' : 'video'}...`}
                        className="flex-1"
                      />
                      <input
                        type="file"
                        accept={media.type === 'IMAGE' ? 'image/*' : 'video/*'}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleMediaUpload(media.id, file)
                        }}
                        className="hidden"
                        id={`media-${media.id}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`media-${media.id}`)?.click()}
                        disabled={uploadingMedia}
                      >
                        {uploadingMedia ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Caption (Opsional)</Label>
                    <Input
                      value={media.caption || ''}
                      onChange={(e) => updateMediaLampiran(media.id, 'caption', e.target.value)}
                      placeholder="Tambahkan deskripsi untuk media..."
                    />
                  </div>
                  
                  {media.url && (
                    <div className="mt-3">
                      {media.type === 'IMAGE' ? (                        <div className="relative w-full h-32 bg-gray-100 rounded border overflow-hidden">
                          <Image
                            src={media.url.startsWith('http') ? media.url : imageAPI.getImageUrl(media.url)}
                            alt={media.caption || 'Media'}
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="relative w-full h-32 bg-gray-100 rounded border overflow-hidden">
                          <video
                            src={media.url.startsWith('http') ? media.url : imageAPI.getImageUrl(media.url)}
                            controls
                            className="w-full h-full object-cover"
                          >
                            Browser Anda tidak mendukung tag video.
                          </video>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Kategori <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.kategori} onValueChange={(value) => handleInputChange('kategori', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori berita" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UMUM">Umum</SelectItem>
                  <SelectItem value="AKADEMIK">Akademik</SelectItem>
                  <SelectItem value="KARIR">Karir</SelectItem>
                  <SelectItem value="ALUMNI">Alumni</SelectItem>
                  <SelectItem value="TEKNOLOGI">Teknologi</SelectItem>
                  <SelectItem value="OLAHRAGA">Olahraga</SelectItem>
                  <SelectItem value="KEGIATAN">Kegiatan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Status Publikasi</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Dipublikasikan</SelectItem>
                  <SelectItem value="ARCHIVED">Diarsipkan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => handleInputChange('featured', checked)}
              />
              <Label htmlFor="featured" className="text-sm">
                Jadikan berita unggulan
              </Label>
            </div>

            {originalData && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Berita terakhir diperbarui: {new Date(originalData.updatedAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Memuat data berita...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/berita">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Edit Berita
                </h1>
                <p className="text-sm text-muted-foreground">
                  Step {currentStep} dari {STEPS.length} • {getFormCompleteness()}% selesai
                </p>
              </div>            </div>            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={openPreviewInNewTab}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
              <Progress value={getFormCompleteness()} className="w-32" />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {STEPS.map((step, index) => {
                    const Icon = step.icon
                    const isActive = currentStep === step.id
                    const isCompleted = currentStep > step.id
                    const progress = getStepProgress(step.id)
                    
                    return (
                      <div
                        key={step.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isActive
                            ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
                            : isCompleted
                            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                        }`}
                        onClick={() => goToStep(step.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${step.color}`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-sm">{step.title}</h3>
                            <p className="text-xs text-muted-foreground">{step.description}</p>
                            <Progress value={progress} className="mt-2 h-1" />
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Autosave aktif</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-blue-500" />
                      <span>{formData.status === 'PUBLISHED' ? 'Akan dipublikasi' : 'Disimpan sebagai draft'}</span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={openPreviewInNewTab}
                    disabled={!formData.judul || !formData.konten}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{STEPS[currentStep - 1].title}</CardTitle>
                      <p className="text-muted-foreground">{STEPS[currentStep - 1].description}</p>
                    </div>
                    <Badge variant="outline">
                      Step {currentStep}/{STEPS.length}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  {renderStepContent()}
                </CardContent>

                <div className="border-t p-6">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={prevStep}
                      disabled={currentStep === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Sebelumnya
                    </Button>

                    <div className="flex gap-2">
                      {currentStep === STEPS.length ? (
                        <>                          <Button
                            variant="outline"
                            onClick={() => handleSubmit(true)}
                            disabled={loading || uploadingImage}
                          >
                            {(loading || uploadingImage) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Simpan Draft
                          </Button>
                          <Button
                            onClick={() => handleSubmit(false)}
                            disabled={loading || uploadingImage}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          >
                            {(loading || uploadingImage) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            Update Berita
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={nextStep}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          Selanjutnya
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Preview Berita</DialogTitle>
          </DialogHeader>
          
          {/* Preview Content - Matching the exact layout of /berita/[id] */}
          <div className="p-6">
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 -m-6 p-6">
              <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Content */}
                  <div className="lg:col-span-2">
                    <article className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
                      {/* Article Header */}
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Badge className={categoryColors[formData.kategori as keyof typeof categoryColors] || "bg-gray-100 text-gray-800"}>
                            {getKategoriDisplay(formData.kategori)}
                          </Badge>
                        </div>

                        <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-4 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                          {formData.judul || 'Judul Berita'}
                        </h1>

                        <p className="text-lg text-muted-foreground mb-6">
                          {formData.ringkasan || 'Ringkasan berita...'}
                        </p>

                        {/* Article Meta */}
                        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{formData.penulis || 'Penulis'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date().toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{calculateReadTime(formData.konten)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            <span>0 views</span>
                          </div>
                        </div>
                      </div>

                      {/* Featured Image */}
                      {(imagePreview || formData.gambarUrl) && (
                        <div className="mb-8">
                          <img
                            src={imagePreview || (formData.gambarUrl ? imageAPI.getImageUrl(formData.gambarUrl) : '')}
                            alt={formData.judul}
                            className="w-full h-64 lg:h-96 object-cover rounded-xl"
                          />
                        </div>
                      )}

                      {/* Article Actions */}
                      <div className="flex items-center justify-between mb-8 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-2"
                            disabled
                          >
                            <Bookmark className="w-4 h-4" />
                            Simpan
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-2"
                            disabled
                          >
                            <Share2 className="w-4 h-4" />
                            Bagikan
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="flex items-center gap-2"
                            disabled
                          >
                            <Heart className="w-4 h-4" />
                            Suka (0)
                          </Button>
                        </div>
                      </div>

                      {/* Article Content */}
                      <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:bg-gradient-to-r prose-headings:from-slate-900 prose-headings:to-slate-600 dark:prose-headings:from-white dark:prose-headings:to-slate-300 prose-headings:bg-clip-text prose-headings:text-transparent">
                        {formData.konten.split('\n').map((paragraph, index) => (
                          <p key={index} className="mb-3">{paragraph}</p>
                        ))}
                      </div>

                      <Separator className="my-8" />

                      {/* Tags */}
                      {formData.tags.length > 0 && (
                        <div className="mb-8">
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">Tags:</h4>
                          <div className="flex flex-wrap gap-2">
                            {formData.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Author Info */}
                      <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 rounded-xl">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {(formData.penulis || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{formData.penulis || 'Penulis'}</h4>
                          <p className="text-muted-foreground">
                            Tim redaksi yang berdedikasi untuk menyajikan berita terkini dan inspiratif seputar dunia alumni.
                          </p>
                        </div>
                      </div>
                    </article>
                  </div>

                  {/* Sidebar Preview */}
                  <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Berita Lainnya</h3>
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                              <div className="w-16 h-16 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-lg flex-shrink-0"></div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm line-clamp-2 mb-1">
                                  Berita Sample {i}
                                </h4>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    Umum
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date().toLocaleDateString('id-ID')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
