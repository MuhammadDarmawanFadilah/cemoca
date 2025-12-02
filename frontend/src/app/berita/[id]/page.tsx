'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from '@/contexts/AuthContext'
import { 
  ArrowLeft, 
  Calendar, 
  Eye, 
  Share2, 
  Bookmark, 
  BookmarkCheck,
  User,  Clock,  
  Facebook,
  Twitter,
  Linkedin,
  Link2,
  Heart,
  LogIn,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize2,
  X
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { beritaAPI, imageAPI, biografiAPI, Berita, getKategoriDisplay, formatBeritaDate } from '@/lib/api'
import UniversalCommentSection from '@/components/UniversalCommentSection'

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

export default function BeritaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [berita, setBerita] = useState<Berita | null>(null)
  const [penuliBiografi, setPenulisBiografi] = useState<any>(null) // Biografi penulis
  const [relatedBerita, setRelatedBerita] = useState<Berita[]>([])
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [mediaList, setMediaList] = useState<any[]>([])
  const [isAutoPlay, setIsAutoPlay] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [relatedSlide, setRelatedSlide] = useState(0)
  
  // Fullscreen modal state
  const [showFullScreenMedia, setShowFullScreenMedia] = useState(false)
  const [fullScreenMediaUrl, setFullScreenMediaUrl] = useState('')
  const [fullScreenMediaType, setFullScreenMediaType] = useState<'image' | 'video'>('image')
  const [fullScreenVideoRef, setFullScreenVideoRef] = useState<HTMLVideoElement | null>(null)

  const beritaId = parseInt(params?.id as string)
  const categoryColors = getCategoryColors()

  // Check for mobile viewport
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])
  useEffect(() => {
    if (beritaId) {
      loadBeritaDetail()
      loadRelatedBerita()
    }
  }, [beritaId])

  useEffect(() => {
    if (berita?.mediaLampiran) {
      try {
        const parsedMedia = JSON.parse(berita.mediaLampiran)
        setMediaList(parsedMedia || [])
      } catch (error) {
        console.error('Error parsing media lampiran:', error)
        setMediaList([])
      }
    }  }, [berita])

  // Keyboard navigation for slideshow
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (mediaList.length > 1) {
        if (event.key === 'ArrowLeft') {
          prevSlide()
        } else if (event.key === 'ArrowRight') {
          nextSlide()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [mediaList.length])

  // Keyboard handler for fullscreen modal
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showFullScreenMedia) {
        handleCloseFullScreen()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showFullScreenMedia])

  // Auto-advance slideshow
  useEffect(() => {
    if (isAutoPlay && mediaList.length > 1) {
      const interval = setInterval(nextSlide, 4000) // Change slide every 4 seconds
      return () => clearInterval(interval)
    }
  }, [isAutoPlay, mediaList.length, currentSlide])
  const nextSlide = () => {
    const itemsPerSlide = isMobile ? 1 : 3
    const maxSlides = Math.ceil(mediaList.length / itemsPerSlide)
    setCurrentSlide((prev) => (prev + 1) % maxSlides)
  }

  const prevSlide = () => {
    const itemsPerSlide = isMobile ? 1 : 3
    const maxSlides = Math.ceil(mediaList.length / itemsPerSlide)
    setCurrentSlide((prev) => (prev - 1 + maxSlides) % maxSlides)
  }
  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  // Touch handlers for mobile swipe
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX)
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && mediaList.length > 1) nextSlide()
    if (isRightSwipe && mediaList.length > 1) prevSlide()
  }

  // Touch handlers for related news slideshow
  const [relatedTouchStart, setRelatedTouchStart] = useState<number | null>(null)
  const [relatedTouchEnd, setRelatedTouchEnd] = useState<number | null>(null)

  const onTouchStartRelated = (e: React.TouchEvent) => {
    setRelatedTouchEnd(null)
    setRelatedTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMoveRelated = (e: React.TouchEvent) => setRelatedTouchEnd(e.targetTouches[0].clientX)

  const onTouchEndRelated = () => {
    if (!relatedTouchStart || !relatedTouchEnd) return
    const distance = relatedTouchStart - relatedTouchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && relatedBerita.length > 1) {
      nextRelatedSlide()
    }
    if (isRightSwipe && relatedBerita.length > 1) {
      prevRelatedSlide()
    }
  }

  // Navigation functions for related news slideshow
  const nextRelatedSlide = () => {
    if (relatedSlide < relatedBerita.length - 1) {
      setRelatedSlide(prev => prev + 1)
    }
  }

  const prevRelatedSlide = () => {
    if (relatedSlide > 0) {
      setRelatedSlide(prev => prev - 1)
    }
  }
  const loadBeritaDetail = async () => {
    try {
      setLoading(true)
      const data = await beritaAPI.getBeritaDetailById(beritaId)
      setBerita(data)
      setLikeCount(data.jumlahLike)
      
      // Load biografi penulis jika ada penulisBiografiId
      if (data.penulisBiografiId) {
        try {
          const biografiData = await biografiAPI.getBiografiById(data.penulisBiografiId)
          setPenulisBiografi(biografiData)
        } catch (error) {
          console.error('Error loading penulis biografi:', error)
        }
      } else if (data.penulis) {
        // Fallback: cari berdasarkan nama penulis
        try {
          const biografiData = await biografiAPI.getBiografiByName(data.penulis)
          setPenulisBiografi(biografiData)
        } catch (error) {
          console.error('Error loading penulis biografi by name:', error)
        }
      }
    } catch (error) {
      console.error('Error loading berita:', error)
      toast.error('Gagal memuat berita')
      router.push('/berita')
    } finally {
      setLoading(false)
    }
  }
  const loadRelatedBerita = async () => {
    try {
      const response = await beritaAPI.getPublishedBerita({ size: 6 })
      // Filter out current berita
      const filtered = response.content.filter(item => item.id !== beritaId)
      setRelatedBerita(filtered.slice(0, 3))
    } catch (error) {
      console.error('Error loading related berita:', error)
    }
  }

  const handleAuthorClick = async () => {
    if (!berita?.penulis) return
    
    try {
      const biografi = await biografiAPI.getBiografiByName(berita.penulis)
      if (biografi?.biografiId) {
        router.push(`/biografi/${biografi.biografiId}`)
      } else {
        toast.error('Biografi penulis tidak ditemukan')
      }
    } catch (error) {
      console.error('Error fetching author biography:', error)
      toast.error('Gagal memuat biografi penulis')
    }
  }
  const handleLike = async () => {
    if (!berita) return
    
    if (!isAuthenticated) {
      toast.error(
        <div className="flex items-center gap-2">
          <LogIn className="w-4 h-4" />
          <span>Silakan login terlebih dahulu untuk menyukai berita</span>
        </div>
      )
      return
    }
    
    try {
      await beritaAPI.likeBerita(berita.id)
      setLikeCount(prev => prev + 1)
      setIsLiked(true)
      toast.success("Berita disukai!")
    } catch (error) {
      console.error('Error liking berita:', error)
      toast.error("Gagal menyukai berita")
    }
  }

  const handleShare = (platform: string) => {
    const url = window.location.href
    const title = berita?.judul || ''
    
    let shareUrl = ''
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        break
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
        break
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
        break
      case 'copy':
        navigator.clipboard.writeText(url)
        toast.success('Link berhasil disalin!')
        return
    }    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
    }
    setShowShareMenu(false)
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    toast.success(isBookmarked ? 'Bookmark dihapus!' : 'Berita di-bookmark!')
  }
  // Fullscreen media handlers
  const handleOpenFullScreen = (url: string, type: 'image' | 'video') => {
    setFullScreenMediaUrl(url)
    setFullScreenMediaType(type)
    setShowFullScreenMedia(true)
    
    // If it's a video, pause all videos in the slideshow when opening fullscreen
    if (type === 'video') {
      const videos = document.querySelectorAll('video')
      videos.forEach(video => {
        if (!video.paused) {
          video.pause()
        }
      })
    }
  }

  const handleCloseFullScreen = () => {
    setShowFullScreenMedia(false)
    setFullScreenMediaUrl('')
    if (fullScreenVideoRef) {
      fullScreenVideoRef.pause()
    }
  }

  // Helper function to check if URL is a video
  const isVideoFile = (url: string) => {
    return url.toLowerCase().match(/\.(mp4|webm|ogg|avi|mov)$/i)
  }

  // Helper function to extract excerpt from content
  const getExcerpt = (content: string, maxLength: number = 200) => {
    const plainText = content.replace(/<[^>]*>/g, '').trim()
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...' 
      : plainText
  }

  // Helper function to estimate read time
  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200
    const words = content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length
    const minutes = Math.ceil(words / wordsPerMinute)
    return `${minutes} menit`
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
          <h1 className="text-2xl font-bold mb-4">Berita tidak ditemukan</h1>
          <Button onClick={() => router.push('/berita')}>
            Kembali ke Berita
          </Button>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4 md:mb-6 hover:bg-white/50 dark:hover:bg-slate-800/50 ml-2 md:ml-0"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>        <div className="max-w-5xl mx-auto">
          {/* Main Content - Enhanced newspaper-style layout */}          <article className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg md:rounded-2xl shadow-2xl border border-white/30 overflow-hidden mx-2 md:mx-0">
            
            {/* Article Header with Full Width Background */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 p-4 md:p-8 pb-4 md:pb-6">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <Badge className={categoryColors[berita.kategori as keyof typeof categoryColors] || "bg-gray-100 text-gray-800"}>
                  {getKategoriDisplay(berita.kategori)}
                </Badge>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-3 sm:mb-4 md:mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent break-words hyphens-auto">
                {berita.judul}
              </h1>

              {/* Article Meta */}
              <div className="grid grid-cols-2 md:flex md:flex-wrap md:items-center gap-2 md:gap-6 text-xs md:text-sm text-muted-foreground mb-4 md:mb-6 pb-4 md:pb-6 border-b border-gray-200/60 dark:border-gray-600/60">
                <div className="flex items-center gap-1 md:gap-2">
                  <User className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                  <span className="font-medium truncate">{berita.penulis}</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <Calendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                  <span className="truncate">{formatBeritaDate(berita.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <Clock className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                  <span className="truncate">{calculateReadTime(berita.konten)}</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <Eye className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                  <span className="truncate">{berita.jumlahView.toLocaleString()} views</span>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-4 md:p-8 pt-0">              {/* Action Buttons */}
              <div className="flex items-center justify-between mb-4 md:mb-6 p-3 md:p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 md:gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className="flex items-center gap-1 md:gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs md:text-sm px-2 md:px-3"
                  >
                    {isBookmarked ? (
                      <BookmarkCheck className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                    ) : (
                      <Bookmark className="w-3 h-3 md:w-4 md:h-4" />
                    )}
                    <span className="hidden sm:inline">Simpan</span>
                  </Button>
                  
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="flex items-center gap-1 md:gap-2 hover:bg-green-50 dark:hover:bg-green-900/20 text-xs md:text-sm px-2 md:px-3"
                    >
                      <Share2 className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="hidden sm:inline">Bagikan</span>
                    </Button>
                    {showShareMenu && (
                      <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-10 min-w-[140px] md:min-w-[150px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare('facebook')}
                          className="w-full justify-start gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs md:text-sm"
                        >
                          <Facebook className="w-3 h-3 md:w-4 md:h-4" />
                          Facebook
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare('twitter')}
                          className="w-full justify-start gap-2 hover:bg-sky-50 dark:hover:bg-sky-900/20 text-xs md:text-sm"
                        >
                          <Twitter className="w-3 h-3 md:w-4 md:h-4" />
                          Twitter
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare('linkedin')}
                          className="w-full justify-start gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs md:text-sm"
                        >
                          <Linkedin className="w-3 h-3 md:w-4 md:h-4" />
                          LinkedIn
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare('copy')}
                          className="w-full justify-start gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs md:text-sm"
                        >
                          <Link2 className="w-3 h-3 md:w-4 md:h-4" />
                          Salin Link
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 md:gap-4">
                  {!isAuthenticated ? (
                    <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-muted-foreground">
                      <AlertCircle className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="hidden sm:inline">Login untuk menyukai</span>
                      <span className="sm:hidden">Login</span>
                    </div>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-1 md:gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs md:text-sm px-2 md:px-3"
                      onClick={handleLike}
                      disabled={isLiked}
                    >
                      <Heart className={`w-3 h-3 md:w-4 md:h-4 ${isLiked ? 'fill-current text-red-500' : ''}`} />
                      <span className="hidden sm:inline">Suka ({likeCount})</span>
                      <span className="sm:hidden">({likeCount})</span>
                    </Button>
                  )}
                </div>
              </div></div>                        {/* Main content area with proper padding */}            
            <div className="px-4 md:px-8 pb-6 md:pb-8">
              {/* Featured Image - Smaller and properly contained */}
              {berita.gambarUrl && (
                <div className="mb-4 md:mb-6">
                  <div className="relative w-full max-w-2xl mx-auto group">
                    <Image
                      src={imageAPI.getImageUrl(berita.gambarUrl)}
                      alt={berita.judul}
                      width={800}
                      height={400}
                      className="w-full h-auto object-contain rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-all duration-300"
                      style={{ maxHeight: '300px' }}
                      onClick={() => handleOpenFullScreen(imageAPI.getImageUrl(berita.gambarUrl), 'image')}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenFullScreen(imageAPI.getImageUrl(berita.gambarUrl), 'image')
                      }}
                    >
                      <Maximize2 className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </div>
                </div>
              )}              {/* Media Lampiran Slideshow - Responsive: 1 on mobile, 3 on desktop */}
              {mediaList.length > 0 && (
                <div className="mb-4 md:mb-6">
                  <div className="relative w-full max-w-5xl mx-auto">
                    <div 
                      className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden"
                      onTouchStart={onTouchStart}
                      onTouchMove={onTouchMove}
                      onTouchEnd={onTouchEnd}
                    >
                      {/* Responsive grid: 1 column on mobile, 3 on desktop */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 p-2 md:p-4">
                        {Array.from({ length: isMobile ? 1 : 3 }, (_, index) => {
                          const itemsPerSlide = isMobile ? 1 : 3
                          const mediaIndex = currentSlide * itemsPerSlide + index
                          const media = mediaList[mediaIndex]
                          
                          if (!media) {
                            return !isMobile ? (
                              <div key={index} className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg opacity-30" />
                            ) : null
                          }
                          
                          return (                            <div key={mediaIndex} className="aspect-video rounded-lg overflow-hidden bg-white dark:bg-slate-700 shadow-sm relative group">
                              {media.type === 'IMAGE' ? (
                                <>
                                  <Image
                                    src={imageAPI.getImageUrl(media.url)}
                                    alt={media.caption || `Media ${mediaIndex + 1}`}
                                    width={400}
                                    height={300}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                                    onClick={() => handleOpenFullScreen(imageAPI.getImageUrl(media.url), 'image')}
                                  />                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleOpenFullScreen(imageAPI.getImageUrl(media.url), 'image')
                                    }}
                                  >
                                    <Maximize2 className="h-3 w-3 md:h-4 md:w-4" />
                                  </Button>
                                </>
                              ) : media.type === 'VIDEO' ? (
                                <>
                                  <div 
                                    className="relative w-full h-full cursor-pointer group/video"
                                    onClick={() => handleOpenFullScreen(imageAPI.getImageUrl(media.url), 'video')}
                                  >
                                    <video 
                                      src={imageAPI.getImageUrl(media.url)}
                                      controls
                                      className="w-full h-full object-cover"
                                      poster=""
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Browser Anda tidak mendukung tag video.
                                    </video>                                    {/* Overlay untuk area clickable */}
                                    <div className="absolute inset-0 bg-transparent hover:bg-black/10 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover/video:opacity-100">
                                      <div className="bg-white/90 rounded-full p-1 md:p-2 shadow-lg">
                                        <Maximize2 className="h-4 w-4 md:h-6 md:w-6 text-gray-800" />
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleOpenFullScreen(imageAPI.getImageUrl(media.url), 'video')
                                    }}
                                  >
                                    <Maximize2 className="h-3 w-3 md:h-4 md:w-4" />
                                  </Button>
                                </>
                              ) : (
                                <div className="flex items-center justify-center h-full p-4">
                                  <div className="text-center">
                                    <p className="text-sm font-medium mb-1">{media.caption || 'Media'}</p>
                                    <p className="text-xs text-muted-foreground break-all">{media.url}</p>
                                  </div>
                                </div>
                              )}
                              
                              {/* Media caption overlay */}
                              {media.caption && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                  <p className="text-white text-xs truncate">{media.caption}</p>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Navigation Arrows - Show when there are multiple slides */}
                      {((isMobile && mediaList.length > 1) || (!isMobile && mediaList.length > 3)) && (
                        <>
                          <button
                            onClick={prevSlide}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all shadow-lg z-10"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={nextSlide}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all shadow-lg z-10"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}

                      {/* Auto-play toggle - Only show when there are multiple slides and not on mobile */}
                      {!isMobile && mediaList.length > 3 && (
                        <button
                          onClick={() => setIsAutoPlay(!isAutoPlay)}
                          className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all shadow-lg z-10"
                          title={isAutoPlay ? 'Pause auto-advance' : 'Enable auto-advance'}
                        >
                          {isAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                      )}

                      {/* Slide Indicators - Responsive calculation */}
                      {((isMobile && mediaList.length > 1) || (!isMobile && mediaList.length > 3)) && (
                        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
                          {Array.from({ length: Math.ceil(mediaList.length / (isMobile ? 1 : 3)) }, (_, index) => (
                            <button
                              key={index}
                              onClick={() => goToSlide(index)}
                              className={`w-3 h-3 rounded-full transition-all shadow-sm ${
                                index === currentSlide 
                                  ? 'bg-white shadow-md' 
                                  : 'bg-white/60 hover:bg-white/80'
                              }`}
                            />                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}              {/* Article Content - Enhanced and more prominent */}
              <div className="mb-6 md:mb-8">
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-4 md:p-8 shadow-sm border border-gray-100 dark:border-slate-700">
                  <div 
                    className="prose prose-sm md:prose-lg lg:prose-xl max-w-none dark:prose-invert
                      prose-headings:bg-gradient-to-r prose-headings:from-slate-900 prose-headings:to-slate-600 
                      dark:prose-headings:from-white dark:prose-headings:to-slate-300 
                      prose-headings:bg-clip-text prose-headings:text-transparent
                      prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed 
                      prose-p:text-sm md:prose-p:text-base lg:prose-p:text-lg
                      prose-strong:text-gray-900 dark:prose-strong:text-white
                      prose-em:text-gray-600 dark:prose-em:text-gray-400
                      prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20
                      prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-lg
                      prose-ul:text-gray-700 dark:prose-ul:text-gray-300
                      prose-ol:text-gray-700 dark:prose-ol:text-gray-300
                      prose-li:text-sm md:prose-li:text-base lg:prose-li:text-lg prose-li:leading-relaxed prose-li:mb-2
                      prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                      prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded
                      prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:rounded-lg prose-pre:p-4"
                    dangerouslySetInnerHTML={{ __html: berita.konten }}
                  />
                </div>
              </div>
            </div>

            <div className="px-4 md:px-8">
              <Separator className="my-6 md:my-8" />            {/* Author Info - Updated dengan biografi */}
            <div className="flex items-start gap-3 md:gap-4 p-4 md:p-6 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 rounded-xl mb-6 md:mb-8">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden flex-shrink-0">
                {penuliBiografi?.fotoProfil ? (
                  <Image
                    src={imageAPI.getImageUrl(penuliBiografi.fotoProfil)}
                    alt={berita.penulis}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <User className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 
                  className="font-semibold text-base md:text-lg text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer transition-colors mb-1 md:mb-2"
                  onClick={() => {
                    if (penuliBiografi?.biografiId) {
                      router.push(`/biografi/${penuliBiografi.biografiId}`)
                    }
                  }}
                >
                  {berita.penulis}
                </h4>
                {penuliBiografi ? (
                  <div className="space-y-1 md:space-y-2">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                      <span>{penuliBiografi.jurusan}</span>
                      {penuliBiografi.pekerjaan && (
                        <>
                          <span>•</span>
                          <span>{penuliBiografi.pekerjaan}</span>
                        </>
                      )}
                      {penuliBiografi.perusahaan && (
                        <>
                          <span>•</span>
                          <span>{penuliBiografi.perusahaan}</span>
                        </>
                      )}
                    </div>
                    {penuliBiografi.catatan && (
                      <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">
                        {penuliBiografi.catatan}
                      </p>
                    )}
                    {penuliBiografi.linkedinUrl && (
                      <a 
                        href={penuliBiografi.linkedinUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs md:text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Linkedin className="w-3 h-3 md:w-4 md:h-4" />
                        LinkedIn Profile
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs md:text-sm">
                    Penulis yang berdedikasi untuk menyajikan berita terkini dan inspiratif seputar dunia alumni.
                  </p>
                )}
              </div>
            </div>            {/* Related News - Moved after author */}
            <div className="mb-6 md:mb-8">
              <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Berita Lainnya
              </h3>
              
              {/* Mobile Slideshow */}
              <div className="md:hidden">
                {relatedBerita.length > 0 && (
                  <div className="relative">
                    <div 
                      className="overflow-hidden"
                      onTouchStart={onTouchStartRelated}
                      onTouchMove={onTouchMoveRelated}
                      onTouchEnd={onTouchEndRelated}
                    >
                      <div 
                        className="flex transition-transform duration-300 ease-in-out"
                        style={{ transform: `translateX(-${relatedSlide * 100}%)` }}
                      >
                        {relatedBerita.map((news) => (
                          <div key={news.id} className="w-full flex-shrink-0 px-2">
                            <Card className="group cursor-pointer hover:shadow-lg transition-all bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20" onClick={() => router.push(`/berita/${news.id}`)}>
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <Image
                                    src={news.gambarUrl ? imageAPI.getImageUrl(news.gambarUrl) : "/api/placeholder/300/200"}
                                    alt={news.judul}
                                    width={300}
                                    height={200}
                                    className="w-full h-32 object-cover rounded-lg"
                                  />
                                  <div>
                                    <h4 className="font-medium text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                                      {news.judul}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {getKategoriDisplay(news.kategori)}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {formatBeritaDate(news.createdAt)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Navigation Buttons */}
                    {relatedBerita.length > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
                          onClick={prevRelatedSlide}
                          disabled={relatedSlide === 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
                          onClick={nextRelatedSlide}
                          disabled={relatedSlide === relatedBerita.length - 1}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    {/* Dots Indicator */}
                    {relatedBerita.length > 1 && (
                      <div className="flex justify-center space-x-2 mt-4">
                        {relatedBerita.map((_, index) => (
                          <button
                            key={index}
                            className={`h-2 w-2 rounded-full transition-colors ${
                              index === relatedSlide 
                                ? 'bg-blue-600' 
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                            onClick={() => setRelatedSlide(index)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Desktop Grid */}
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedBerita.map((news) => (
                  <Card key={news.id} className="group cursor-pointer hover:shadow-lg transition-all bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20" onClick={() => router.push(`/berita/${news.id}`)}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <Image
                          src={news.gambarUrl ? imageAPI.getImageUrl(news.gambarUrl) : "/api/placeholder/300/200"}
                          alt={news.judul}
                          width={300}
                          height={200}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div>
                          <h4 className="font-medium text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                            {news.judul}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {getKategoriDisplay(news.kategori)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatBeritaDate(news.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            </div>            {/* Comment Section */}
            <div className="px-4 md:px-8 pb-6 md:pb-8">
              <UniversalCommentSection 
                resourceType="berita"
                resourceId={berita.id}
                fetchCommentsUrl={`/comments/berita/${berita.id}`}
                createCommentUrl={`/comments`}
                replyCommentUrl={`/comments`}
                enableLikes={true}
                enableDislikes={true}
                enableReplies={true}
              />
            </div>
          </article>
        </div>
      </div>      {/* Fullscreen Modal */}
      {showFullScreenMedia && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-2 md:p-4 animate-in fade-in duration-300"
          onClick={(e) => {
            // Close modal when clicking on backdrop
            if (e.target === e.currentTarget) {
              handleCloseFullScreen()
            }
          }}
        >
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 md:top-4 right-2 md:right-4 z-10 bg-white/10 hover:bg-white/20 text-white border-white/20 transition-all hover:scale-110"
              onClick={handleCloseFullScreen}
            >
              <X className="h-5 w-5 md:h-6 md:w-6" />
            </Button>

            {/* Media Content */}
            <div className="w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-300">
              {fullScreenMediaType === 'image' ? (
                <Image
                  src={fullScreenMediaUrl}
                  alt="Fullscreen view"
                  width={1920}
                  height={1080}
                  className="max-w-full max-h-full object-contain cursor-pointer"
                  style={{ maxHeight: 'calc(100vh - 1rem)' }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <video
                  ref={(el) => setFullScreenVideoRef(el)}
                  src={fullScreenMediaUrl}
                  controls
                  className="max-w-full max-h-full object-contain cursor-pointer"
                  style={{ maxHeight: 'calc(100vh - 1rem)' }}
                  autoPlay={false}
                  onClick={(e) => e.stopPropagation()}
                >
                  Browser Anda tidak mendukung tag video.
                </video>
              )}
            </div>
          </div>

          {/* Keyboard Instructions */}
          <div className="absolute bottom-2 md:bottom-4 left-1/2 transform -translate-x-1/2 text-white/70 text-xs md:text-sm text-center bg-black/30 px-3 md:px-4 py-1 md:py-2 rounded-lg backdrop-blur-sm">
            <p className="hidden sm:block">Tekan ESC atau klik di luar area untuk menutup</p>
            <p className="sm:hidden">Tap tombol X untuk menutup</p>
          </div>
        </div>
      )}
    </div>
  )
}