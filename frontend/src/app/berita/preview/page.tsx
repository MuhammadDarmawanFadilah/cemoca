'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Calendar, 
  Eye, 
  Share2, 
  Bookmark, 
  BookmarkCheck,
  User,
  Tag,
  Clock,
  MessageCircle,
  Facebook,
  Twitter,
  Linkedin,
  Link2,
  Heart
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { beritaAPI, imageAPI, Berita, getKategoriDisplay, formatBeritaDate } from '@/lib/api'

// Get category colors from environment or use defaults
const getCategoryColors = () => {
  return {
    "UMUM": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    "AKADEMIK": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    "KARIR": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    "ALUMNI": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    "TEKNOLOGI": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    "OLAHRAGA": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    "KEGIATAN": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300"
  }
}

// Helper functions
const calculateReadTime = (content: string) => {
  const wordsPerMinute = 200
  const words = content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length
  const minutes = Math.ceil(words / wordsPerMinute)
  return `${minutes} menit`
}

const getExcerpt = (content: string, maxLength: number = 200) => {
  const plainText = content.replace(/<[^>]*>/g, '').trim()
  return plainText.length > maxLength 
    ? plainText.substring(0, maxLength) + '...' 
    : plainText
}

export default function BeritaPreviewPage() {  const searchParams = useSearchParams()
  const router = useRouter()
  const [berita, setBerita] = useState<Berita | null>(null)
  const [relatedBerita, setRelatedBerita] = useState<Berita[]>([])
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [previewImage, setPreviewImage] = useState('')

  const categoryColors = getCategoryColors()

  useEffect(() => {
    loadPreviewData()
    loadRelatedBerita()
  }, [])

  const loadPreviewData = () => {
    try {
      setLoading(true)
      
      // Get preview data from sessionStorage
      const previewDataStr = sessionStorage.getItem('berita-preview')
      const previewImageStr = sessionStorage.getItem('berita-preview-image')
      
      if (previewDataStr) {
        const previewData = JSON.parse(previewDataStr) as Berita
        setBerita(previewData)
        setLikeCount(previewData.jumlahLike)
        setPreviewImage(previewImageStr || '')
      } else {
        toast.error('Data preview tidak ditemukan')
        router.back()
      }
    } catch (error) {
      console.error('Error loading preview data:', error)
      toast.error('Gagal memuat preview')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const loadRelatedBerita = async () => {
    try {
      const response = await beritaAPI.getPublishedBerita({ size: 6 })
      setRelatedBerita(response.content.slice(0, 3))
    } catch (error) {
      console.error('Error loading related berita:', error)
    }
  }

  const handleLike = () => {
    setLikeCount(prev => prev + 1)
    setIsLiked(true)
    toast.success("Suka (Preview Mode)")
  }

  const handleShare = (platform: string) => {
    toast.success(`Bagikan ke ${platform} (Preview Mode)`)
    setShowShareMenu(false)
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    toast.success(isBookmarked ? "Bookmark dihapus (Preview)" : "Disimpan (Preview)")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!berita) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Preview tidak ditemukan</h1>
          <Button onClick={() => router.back()}>
            Kembali ke Editor
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Preview Banner */}
      <div className="bg-orange-500 text-white py-2 px-4 text-center text-sm font-medium">
        🔍 MODE PREVIEW - Ini adalah tampilan preview berita Anda
      </div>      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => window.close()}
          className="mb-6 hover:bg-white/50 dark:hover:bg-slate-800/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tutup Preview
        </Button>

        <div className="max-w-4xl mx-auto">
          {/* Main Content */}
          <article className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
            {/* Article Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge className={categoryColors[berita.kategori as keyof typeof categoryColors] || "bg-gray-100 text-gray-800"}>
                  {getKategoriDisplay(berita.kategori)}
                </Badge>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-4 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                {berita.judul}
              </h1>

              <p className="text-lg text-muted-foreground mb-6">
                {berita.ringkasan}
              </p>

              {/* Article Meta */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{berita.penulis}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatBeritaDate(berita.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{calculateReadTime(berita.konten)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>{berita.jumlahView.toLocaleString()} views</span>
                </div>
              </div>
            </div>            {/* Featured Image */}
            {(previewImage || berita.gambarUrl) && (
              <div className="-mx-8 mb-8">
                <Image
                  src={previewImage || (berita.gambarUrl ? imageAPI.getImageUrl(berita.gambarUrl) : "/api/placeholder/800/400")}
                  alt={berita.judul}
                  width={1200}
                  height={600}
                  className="w-full h-64 lg:h-96 object-cover"
                />
              </div>
            )}            {/* Article Actions */}
            <div className="flex items-center justify-between mb-8 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBookmark}
                  className="flex items-center gap-2"
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="w-4 h-4" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                  {isBookmarked ? 'Tersimpan' : 'Simpan'}
                </Button>
                
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Bagikan
                  </Button>
                  
                  {showShareMenu && (
                    <div className="absolute top-full mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border p-2 z-10 min-w-[200px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare('facebook')}
                        className="w-full justify-start gap-2"
                      >
                        <Facebook className="w-4 h-4" />
                        Facebook
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare('twitter')}
                        className="w-full justify-start gap-2"
                      >
                        <Twitter className="w-4 h-4" />
                        Twitter
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare('linkedin')}
                        className="w-full justify-start gap-2"
                      >
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare('copy')}
                        className="w-full justify-start gap-2"
                      >
                        <Link2 className="w-4 h-4" />
                        Salin Link
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-2"
                  onClick={handleLike}
                  disabled={isLiked}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-red-500' : ''}`} />
                  Suka ({likeCount})
                </Button>
              </div>
            </div>

            {/* Article Content */}
            <div 
              className="prose prose-lg max-w-none dark:prose-invert prose-headings:bg-gradient-to-r prose-headings:from-slate-900 prose-headings:to-slate-600 dark:prose-headings:from-white dark:prose-headings:to-slate-300 prose-headings:bg-clip-text prose-headings:text-transparent"
            >
              {berita.konten.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-3">{paragraph}</p>
              ))}
            </div>

            <Separator className="my-8" />

            {/* Tags */}
            {berita.tags && berita.tags.length > 0 && (
              <div className="mb-8">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Tags:</h4>
                <div className="flex flex-wrap gap-2">
                  {berita.tags.split(',').filter(tag => tag.trim()).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Author Info */}
            <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 rounded-xl">
              <Avatar className="w-16 h-16">
                <AvatarImage src="/api/placeholder/64/64" />
                <AvatarFallback>{berita.penulis.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold text-lg">{berita.penulis}</h4>
                <p className="text-muted-foreground">
                  Tim redaksi yang berdedikasi untuk menyajikan berita terkini dan inspiratif seputar dunia alumni.
                </p>
              </div>
            </div>
          </article>          {/* Related News Section */}
          {relatedBerita.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Berita Lainnya
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedBerita.map((news) => (
                  <Card key={news.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 hover:shadow-lg transition-all duration-300 group">
                    <CardContent className="p-0">
                      <div className="aspect-video relative overflow-hidden rounded-t-lg">
                        {news.gambarUrl ? (
                          <Image
                            src={imageAPI.getImageUrl(news.gambarUrl)}
                            alt={news.judul}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center">
                            <Tag className="w-8 h-8 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={categoryColors[news.kategori as keyof typeof categoryColors] || "bg-gray-100 text-gray-800"}>
                            {getKategoriDisplay(news.kategori)}
                          </Badge>
                        </div>
                        <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {news.judul}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {getExcerpt(news.konten)}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatBeritaDate(news.createdAt)}</span>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {news.jumlahView}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {news.jumlahLike}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="mt-12">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 mb-3">
                <MessageCircle className="w-5 h-5" />
                <h3 className="font-semibold">Komentar</h3>
              </div>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                Sistem komentar akan aktif setelah berita dipublikasikan. Pembaca akan dapat memberikan komentar, balasan, dan like/dislike.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
