'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
  Settings,
  Sparkles,
  Edit3,
  Globe,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
  Search,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner'
import { beritaAPI, imageAPI, biografiAPI, type BeritaRequest, type Biografi } from '@/lib/api'

const STEPS = [
  {
    id: 1,
    title: 'Informasi Dasar',
    description: 'Judul dan penulis berita',
    icon: FileText,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 2,
    title: 'Konten',
    description: 'Konten utama berita',
    icon: Edit3,
    color: 'from-purple-500 to-pink-500'
  },
  {
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
  id?: string
  type: 'IMAGE' | 'VIDEO'
  url: string
  caption?: string
}

interface FormData {
  judul: string
  ringkasan: string
  ringkasanCharCount: number
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

export default function TambahBeritaPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [tagInput, setTagInput] = useState('')
  
  // Penulis search states
  const [penulisSearch, setPenulisSearch] = useState('')
  const [biografiResults, setBiografiResults] = useState<Biografi[]>([])
  const [showPenulisDropdown, setShowPenulisDropdown] = useState(false)
  const [selectedBiografi, setSelectedBiografi] = useState<Biografi | null>(null)
  
  // Media lampiran states
  const [uploadingMedia, setUploadingMedia] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    judul: '',
    ringkasan: '',
    ringkasanCharCount: 30,
    konten: '',
    penulis: '',
    penulisBiografiId: undefined,
    kategori: '',
    tags: [],
    gambarUrl: '',
    mediaLampiran: [],
    featured: false,
    status: 'DRAFT'
  })

  // Search penulis biografi
  const searchPenulis = async (query: string) => {
    if (query.length < 2) {
      setBiografiResults([])
      return
    }

    try {
      const response = await biografiAPI.searchBiografiByName(query, 0, 10)
      setBiografiResults(response.content)
      setShowPenulisDropdown(true)
    } catch (error) {
      console.error('Error searching biografi:', error)
      setBiografiResults([])
    }
  }
  // Auto generate ringkasan dari konten (berdasarkan jumlah karakter)
  const generateRingkasan = (content: string, charCount: number): string => {
    if (!content) return ''
    
    // Remove HTML tags and get plain text
    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    
    if (plainText.length <= charCount) {
      return plainText
    }
    
    return plainText.substring(0, charCount) + '...'
  }

  // Update ringkasan otomatis when konten changes
  const updateRingkasanFromKonten = () => {
    if (formData.konten) {
      const autoRingkasan = generateRingkasan(formData.konten, formData.ringkasanCharCount)
      setFormData(prev => ({ ...prev, ringkasan: autoRingkasan }))
    }
  }

  // Add media lampiran
  const addMediaLampiran = () => {
    const newMedia: MediaLampiran = {
      id: Date.now().toString(),
      type: 'IMAGE',
      url: '',
      caption: ''
    }
    setFormData(prev => ({
      ...prev,
      mediaLampiran: [...prev.mediaLampiran, newMedia]
    }))
  }

  // Remove media lampiran
  const removeMediaLampiran = (id: string) => {
    setFormData(prev => ({
      ...prev,
      mediaLampiran: prev.mediaLampiran.filter(media => media.id !== id)
    }))
  }

  // Update media lampiran
  const updateMediaLampiran = (id: string, field: keyof MediaLampiran, value: any) => {
    setFormData(prev => ({
      ...prev,
      mediaLampiran: prev.mediaLampiran.map(media =>
        media.id === id ? { ...media, [field]: value } : media
      )
    }))
  }

  // Upload media lampiran
  const uploadMediaLampiran = async (id: string, file: File) => {
    try {
      setUploadingMedia(true)
      const uploadResult = await imageAPI.uploadImage(file)
      updateMediaLampiran(id, 'url', uploadResult.filename)
      toast.success('Media berhasil diunggah')
    } catch (error) {
      toast.error('Gagal mengunggah media')
      console.error('Upload media error:', error)
    } finally {
      setUploadingMedia(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
      setImagePreview('')
      setImageFile(null)
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = () => {
    setImagePreview('')
    setImageFile(null)
    handleInputChange('gambarUrl', '')
  }
  // Validation functions
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.judul.trim()) {
          toast.error('Judul berita harus diisi')
          return false
        }
        if (!formData.penulis.trim()) {
          toast.error('Penulis berita harus diisi')
          return false
        }
        return true
      case 2:
        if (!formData.konten.trim() || formData.konten.length < 50) {
          toast.error('Konten berita minimal 50 karakter')
          return false
        }
        return true
      case 3:
        if (!formData.ringkasan.trim()) {
          toast.error('Ringkasan berita harus diisi')
          return false
        }
        return true
      case 4:
        return true // Media & tags are optional
      case 5:
        if (!formData.kategori) {
          toast.error('Kategori berita harus dipilih')
          return false
        }
        return true
      default:
        return true
    }
  }

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step)
    } else {
      if (validateStep(currentStep)) {
        setCurrentStep(step)
      }
    }
  }

  const getFormCompleteness = (): number => {
    let completed = 0
    if (formData.judul && formData.penulis) completed += 25
    if (formData.konten) completed += 25
    if (imagePreview || formData.gambarUrl) completed += 25
    if (formData.kategori) completed += 25
    return completed
  }
  const getStepProgress = (stepId: number): number => {
    switch (stepId) {
      case 1:
        return (formData.judul ? 50 : 0) + (formData.penulis ? 50 : 0)
      case 2:
        return formData.konten ? 100 : 0
      case 3:
        return formData.ringkasan ? 100 : 0
      case 4:
        return (imagePreview || formData.gambarUrl ? 50 : 0) + (formData.tags.length > 0 ? 25 : 0) + (formData.mediaLampiran.length > 0 ? 25 : 0)
      case 5:
        return formData.kategori ? 100 : 0
      default:
        return 0
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {      case 1:
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
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                {formData.judul.length}/100 karakter
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="penulis-search" className="text-sm font-medium">
                Penulis <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <div className="flex items-center">
                  <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
                  <Input
                    id="penulis-search"
                    value={penulisSearch}
                    onChange={(e) => {
                      setPenulisSearch(e.target.value)
                      searchPenulis(e.target.value)
                      if (!e.target.value) {
                        setSelectedBiografi(null)
                        handleInputChange('penulis', '')
                        handleInputChange('penulisBiografiId', undefined)
                      }
                    }}
                    placeholder="Cari nama penulis dari biografi..."
                    className="pl-10 text-base"
                  />
                </div>
                
                {showPenulisDropdown && biografiResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {biografiResults.map((biografi) => (
                      <div
                        key={biografi.biografiId}
                        className="p-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer border-b last:border-b-0"
                        onClick={() => {
                          setSelectedBiografi(biografi)
                          setPenulisSearch(biografi.namaLengkap)
                          handleInputChange('penulis', biografi.namaLengkap)
                          handleInputChange('penulisBiografiId', biografi.biografiId)
                          setShowPenulisDropdown(false)
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center overflow-hidden">
                            {biografi.fotoProfil ? (
                              <Image
                                src={imageAPI.getImageUrl(biografi.fotoProfil)}
                                alt={biografi.namaLengkap}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{biografi.namaLengkap}</p>
                            <p className="text-sm text-muted-foreground">
                              Alumni {biografi.alumniTahun} • {biografi.jurusan}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedBiografi && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center overflow-hidden">
                        {selectedBiografi.fotoProfil ? (
                          <Image
                            src={imageAPI.getImageUrl(selectedBiografi.fotoProfil)}
                            alt={selectedBiografi.namaLengkap}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{selectedBiografi.namaLengkap}</p>
                        <p className="text-sm text-muted-foreground">
                          Alumni {selectedBiografi.alumniTahun} • {selectedBiografi.jurusan}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedBiografi(null)
                          setPenulisSearch('')
                          handleInputChange('penulis', '')
                          handleInputChange('penulisBiografiId', undefined)
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
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
                id="konten"                value={formData.konten}
                onChange={(e) => {
                  handleInputChange('konten', e.target.value)
                  if (e.target.value && formData.ringkasanCharCount) {
                    const autoRingkasan = generateRingkasan(e.target.value, formData.ringkasanCharCount)
                    handleInputChange('ringkasan', autoRingkasan)
                  }
                }}
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
                  max="100"
                  value={formData.ringkasanCharCount}
                  onChange={(e) => {
                    const count = parseInt(e.target.value) || 30
                    handleInputChange('ringkasanCharCount', count)
                    if (formData.konten) {
                      const autoRingkasan = generateRingkasan(formData.konten, count)
                      handleInputChange('ringkasan', autoRingkasan)
                    }
                  }}
                  className="w-24 text-base"
                />
                <span className="text-sm text-muted-foreground">karakter</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={updateRingkasanFromKonten}
                  disabled={!formData.konten}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Auto Generate
                </Button>
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
                placeholder="Ringkasan akan di-generate otomatis dari konten, atau Anda bisa menulisnya manual..."
                className="min-h-[100px] text-base"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {formData.ringkasan.length}/200 karakter
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
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Gambar Utama</Label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                {imagePreview ? (
                  <div className="relative">                    <Image
                      src={imagePreview}
                      alt="Preview"
                      width={400}
                      height={250}
                      className="mx-auto rounded-lg max-w-full h-auto"
                      style={{ objectFit: 'contain' }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        {uploadingImage ? 'Mengunggah...' : 'Pilih Gambar'}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG hingga 5MB
                      </p>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Lampiran Media</Label>                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={addMediaLampiran}
                  className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Media
                </Button>
              </div>
              
              {formData.mediaLampiran.map((media, index) => (
                <div key={media.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Media {index + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMediaLampiran(media.id!)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Tipe Media</Label>
                      <Select
                        value={media.type}
                        onValueChange={(value) => updateMediaLampiran(media.id!, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IMAGE">Gambar</SelectItem>
                          <SelectItem value="VIDEO">Video</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">File</Label>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept={media.type === 'IMAGE' ? 'image/*' : 'video/*'}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              uploadMediaLampiran(media.id!, file)
                            }
                          }}
                          className="flex-1 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Caption (opsional)</Label>
                    <Input
                      value={media.caption || ''}
                      onChange={(e) => updateMediaLampiran(media.id!, 'caption', e.target.value)}
                      placeholder="Deskripsi media..."
                      className="text-sm"
                    />
                  </div>
                    {media.url && (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-green-600">✓ Media berhasil diunggah</p>                      {media.type === 'IMAGE' ? (
                        <div className="relative">
                          <Image 
                            src={imageAPI.getImageUrl(media.url)}
                            alt={media.caption || 'Preview gambar'}
                            width={400}
                            height={128}
                            className="w-full h-auto rounded border"
                            style={{ objectFit: 'contain' }}
                          />
                        </div>
                      ) : (
                        <div className="relative">
                          <video 
                            src={imageAPI.getImageUrl(media.url)}
                            controls
                            className="w-full h-32 rounded border"
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

            <div className="space-y-2">
              <Label className="text-sm font-medium">Tags</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-[60px]">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 w-4 h-4"
                      onClick={() => {
                        const newTags = formData.tags.filter((_, i) => i !== index)
                        handleInputChange('tags', newTags)
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Masukkan tag..."
                  className="text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      e.preventDefault()
                      if (!formData.tags.includes(tagInput.trim())) {
                        handleInputChange('tags', [...formData.tags, tagInput.trim()])
                      }
                      setTagInput('')
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
                      handleInputChange('tags', [...formData.tags, tagInput.trim()])
                      setTagInput('')
                    }
                  }}
                >
                  Tambah
                </Button>
              </div>
            </div>            <Alert>
              <ImageIcon className="h-4 w-4" />
              <AlertDescription>
                Gambar dan media lampiran akan membantu menarik perhatian pembaca. Pastikan kualitas gambar baik dan relevan.
              </AlertDescription>
            </Alert>
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

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Pastikan semua informasi sudah benar sebelum menyimpan berita.
              </AlertDescription>
            </Alert>
          </div>
        )

      default:
        return null
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
      setLoading(true);      const submitData: BeritaRequest = {
        judul: formData.judul,
        ringkasan: formData.ringkasan,
        ringkasanWordCount: formData.ringkasanCharCount,
        konten: formData.konten,
        penulis: formData.penulis,
        penulisBiografiId: formData.penulisBiografiId,
        kategori: formData.kategori as 'UMUM' | 'AKADEMIK' | 'KARIR' | 'ALUMNI' | 'TEKNOLOGI' | 'OLAHRAGA' | 'KEGIATAN',
        tags: formData.tags.join(','),
        gambarUrl: formData.gambarUrl,
        mediaLampiran: JSON.stringify(formData.mediaLampiran),
        status: isDraft ? 'DRAFT' : formData.status
      }

      await beritaAPI.createBerita(submitData)
      toast.success(`Berita berhasil ${isDraft ? 'disimpan sebagai draft' : 'ditambahkan'}`)
      router.push('/admin/berita')
    } catch (error) {
      toast.error('Gagal menyimpan berita')
      console.error('Submit error:', error)
    } finally {
      setLoading(false)
    }
  }

  const openPreviewInNewTab = () => {
    if (!formData.judul || !formData.konten) {
      toast.error('Harap isi judul dan konten terlebih dahulu')
      return
    }
    
    // Create preview data
    const previewData = {
      ...formData,
      id: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      jumlahLike: 0,
      gambarUrl: formData.gambarUrl || imagePreview
    }
    
    // Store in sessionStorage for preview
    sessionStorage.setItem('berita-preview', JSON.stringify(previewData))
    
    // Open preview in new tab
    window.open('/admin/berita/preview', '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/berita">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Kembali
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Tambah Berita Baru
                </h1>
                <p className="text-sm text-muted-foreground">
                  Step {currentStep} dari {STEPS.length} • {getFormCompleteness()}% selesai
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
                <CardContent className="p-6">
                  {renderStepContent()}
                </CardContent>
                <div className="flex items-center justify-between p-6 border-t bg-gray-50 dark:bg-slate-800/50">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                    disabled={currentStep === 1}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Sebelumnya
                  </Button>
                    <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={openPreviewInNewTab}
                      disabled={!formData.judul || !formData.konten}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => handleSubmit(true)}
                      disabled={loading}
                      className="gap-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Simpan Draft
                    </Button>
                    
                    {currentStep === STEPS.length ? (
                      <Button
                        onClick={() => handleSubmit()}
                        disabled={loading}
                        className="gap-2"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Publikasikan
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          if (validateStep(currentStep)) {
                            setCurrentStep(Math.min(STEPS.length, currentStep + 1))
                          }
                        }}
                        className="gap-2"
                      >
                        Selanjutnya
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
