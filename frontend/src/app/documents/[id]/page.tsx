'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { config, getApiUrl } from "@/lib/config"
import { 
  ArrowLeft,
  Calendar, 
  Eye, 
  Download, 
  User,
  Clock,
  FileText,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  BookmarkCheck,
  ThumbsUp
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { imageAPI, biografiAPI } from '@/lib/api'
import UniversalCommentSection from '@/components/UniversalCommentSection'

interface Document {
  id: number;
  title: string;
  author: string;
  summary: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  illustrationImage?: string;
  downloadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function DocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [document, setDocument] = useState<Document | null>(null)
  const [relatedDocuments, setRelatedDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isRecommended, setIsRecommended] = useState(false)
  const [recommendCount, setRecommendCount] = useState(0)
  const [authorPhoto, setAuthorPhoto] = useState<string | null>(null)

  // Function to fetch author photo from biography
  const fetchAuthorPhoto = async (authorName: string) => {
    try {
      console.log('Fetching author photo for:', authorName)
      const biografi = await biografiAPI.getBiografiByName(authorName)
      console.log('Biografi data received:', biografi)
      if (biografi && (biografi.fotoProfil || biografi.foto)) {
        const photoPath = biografi.fotoProfil || biografi.foto
        console.log('Author photo found:', photoPath)
        setAuthorPhoto(photoPath || null)
      } else {
        console.log('No photo found for author:', authorName)
      }
    } catch (error: any) {
      console.log('Could not fetch author photo for', authorName, ':', error)
      if (error.message && !error.message.includes('404')) {
        console.error('Unexpected error:', error)
      }
      // Don't show error toast as this is optional
    }
  }

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(getApiUrl(`/documents/${params?.id}`))
        if (response.ok) {
          const data = await response.json()
          console.log('Document API Response:', data) // Debug log
          setDocument(data.document)
          // Initialize recommendation count to 0 - will increment when users recommend
          setRecommendCount(0)
          
          // Fetch author photo if document has author
          if (data.document && data.document.author) {
            console.log('Document author:', data.document.author)
            fetchAuthorPhoto(data.document.author)
          }
        } else {
          toast.error('Dokumen tidak ditemukan')
          router.push('/documents')
        }
      } catch (error) {
        console.error('Error fetching document:', error)
        toast.error('Error mengambil data dokumen')
      } finally {
        setLoading(false)
      }
    }
    
    if (params?.id) {
      fetchDocument()
    }
  }, [params?.id, router])

  useEffect(() => {
    // Fetch related documents (mock for now)
    const fetchRelatedDocuments = async () => {
      try {
        const response = await fetch(`${getApiUrl('/documents')}?page=0&size=3`)
        if (response.ok) {
          const data = await response.json()
          setRelatedDocuments(data.documents.filter((doc: Document) => doc.id !== document?.id).slice(0, 3))
        }
      } catch (error) {
        console.error('Error fetching related documents:', error)
      }
    }

    if (document) {
      fetchRelatedDocuments()
    }
  }, [document])
  const handleDownload = async () => {
    if (!document) return

    try {
      const response = await fetch(`${getApiUrl('/documents')}/${document.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = window.document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = document.fileName
        window.document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('Download berhasil dimulai')
      } else {
        toast.error('Gagal mendownload dokumen')
      }
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Error saat mendownload dokumen')
    }
  }

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    toast.success(isBookmarked ? 'Bookmark dihapus' : 'Dokumen di-bookmark')
  }

  const toggleRecommend = () => {
    const newRecommendedState = !isRecommended
    setIsRecommended(newRecommendedState)
    
    // Increment when recommending, decrement when un-recommending
    setRecommendCount(prev => newRecommendedState ? prev + 1 : Math.max(0, prev - 1))
    
    toast.success(newRecommendedState ? 'Dokumen direkomendasikan' : 'Rekomendasi dibatalkan')
  }

  const handleShare = () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({
        title: document?.title,
        text: document?.summary,
        url: url,
      })
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Link berhasil disalin ke clipboard')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileTypeColor = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case "pdf": return "bg-red-100 text-red-800 border-red-200";
      case "doc":
      case "docx": return "bg-blue-100 text-blue-800 border-blue-200";
      case "xls":
      case "xlsx": return "bg-green-100 text-green-800 border-green-200";
      case "ppt":
      case "pptx": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  if (loading) {
    return (
      <div className="container mx-auto px-2 md:px-6 py-4 md:py-6">
        <div className="flex justify-center items-center h-48 md:h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground text-sm">Memuat dokumen...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="container mx-auto px-2 md:px-6 py-4 md:py-6">
        <div className="text-center">
          <FileText className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl md:text-2xl font-bold mb-2">Dokumen tidak ditemukan</h2>
          <p className="text-muted-foreground mb-4 text-sm md:text-base px-4">
            Dokumen yang Anda cari tidak tersedia atau telah dihapus.
          </p>
          <Button onClick={() => router.push('/documents')} size="default">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Dokumen
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-2 md:px-6 py-4 md:py-6 max-w-6xl">      {/* Header */}
      <div className="mb-4 md:mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/documents')}
          className="mb-2 md:mb-4 -ml-2 md:ml-0"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Dokumen
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-8">        {/* Main Article */}
        <div className="lg:col-span-2 space-y-4 md:space-y-8">
          {/* Hero Section: Gambar, Judul, Penulis, dan Ringkasan */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Illustration Image - Full Width */}
              {document.illustrationImage && (
                <div className="relative w-full h-[400px] lg:h-[500px]">
                  <Image
                    src={imageAPI.getImageUrl(document.illustrationImage)}
                    alt={document.title}
                    fill
                    className="object-cover"
                    priority
                  />
                  {/* Gradient Overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6 lg:p-8 text-white">
                    <div className="max-w-4xl">
                      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 md:mb-4 leading-tight drop-shadow-lg">
                        {document.title}
                      </h1>
                      
                      {/* Author and Date */}
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-2 md:mb-4 text-gray-200">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 md:h-10 md:w-10 border-2 border-white/20">
                            {authorPhoto ? (
                              <AvatarImage 
                                src={imageAPI.getImageUrl(authorPhoto)} 
                                alt={document.author}
                                className="object-cover"
                              />
                            ) : null}
                            <AvatarFallback className="bg-white/10 text-white text-xs md:text-sm">
                              {document.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm md:text-lg">{document.author}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs md:text-sm">
                          <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                          <span>{formatDate(document.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs md:text-sm">
                          <Download className="h-3 w-3 md:h-4 md:w-4" />
                          <span>{document.downloadCount} download</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}              {/* Content Section */}
              <div className="p-3 md:p-6 lg:p-8">                {/* If no image, show title here */}
                {!document.illustrationImage && (
                  <>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-4 md:mb-6">
                      {document.title}
                    </h1>
                    
                    {/* Author and Date */}
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-gray-600 dark:text-gray-400 mb-4 md:mb-6">                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 md:h-8 md:w-8">
                          {authorPhoto ? (
                            <AvatarImage 
                              src={imageAPI.getImageUrl(authorPhoto)} 
                              alt={document.author}
                              className="object-cover"
                            />
                          ) : null}
                          <AvatarFallback className="text-xs">
                            {document.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm md:text-base">{document.author}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs md:text-sm">
                        <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                        <span>{formatDate(document.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs md:text-sm">
                        <Download className="h-3 w-3 md:h-4 md:w-4" />
                        <span>{document.downloadCount} download</span>
                      </div>
                    </div>
                  </>
                )}                {/* Summary */}
                {document.summary && (
                  <div className="mb-6 md:mb-8">
                    <h2 className="text-lg md:text-xl lg:text-2xl font-semibold mb-3 md:mb-4 text-gray-900 dark:text-gray-100">
                      Ringkasan
                    </h2>
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-sm md:text-base lg:text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                        {document.summary}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 md:gap-3 pt-4 md:pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button onClick={handleDownload} className="gap-2 text-xs md:text-sm" size="default">
                    <Download className="h-3 w-3 md:h-4 md:w-4" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={toggleRecommend}
                    className={`gap-2 text-xs md:text-sm ${isRecommended ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}`}
                    size="default"
                  >
                    <ThumbsUp className={`h-3 w-3 md:h-4 md:w-4 ${isRecommended ? 'fill-current' : ''}`} />
                    <span className="hidden sm:inline">{isRecommended ? 'Direkomendasikan' : 'Rekomendasikan'}</span>
                    <span className="sm:hidden">({recommendCount})</span>
                    <span className="hidden sm:inline">({recommendCount})</span>
                  </Button>
                  <Button variant="outline" onClick={toggleBookmark} className="gap-2 text-xs md:text-sm" size="default">
                    {isBookmarked ? (
                      <BookmarkCheck className="h-3 w-3 md:h-4 md:w-4 fill-current" />
                    ) : (
                      <Bookmark className="h-3 w-3 md:h-4 md:w-4" />
                    )}
                    <span className="hidden sm:inline">{isBookmarked ? 'Tersimpan' : 'Simpan'}</span>
                  </Button>
                  <Button variant="outline" onClick={handleShare} className="gap-2 text-xs md:text-sm" size="default">
                    <Share2 className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Bagikan</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>          {/* Information and Statistics - Compact */}
          <Card className="bg-gray-50/50 dark:bg-gray-900/50">
            <CardContent className="p-3 md:p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-sm">
                {/* File Info */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Badge className={`${getFileTypeColor(document.fileType)} text-xs`}>
                      {document.fileType.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Jenis File</p>
                </div>
                
                <div className="text-center">
                  <p className="font-semibold">{formatFileSize(document.fileSize)}</p>
                  <p className="text-xs text-muted-foreground">Ukuran</p>
                </div>
                
                {/* Statistics */}
                <div className="text-center">
                  <p className="font-semibold flex items-center justify-center gap-1">
                    <Download className="h-3 w-3" />
                    {document.downloadCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Download</p>
                </div>
                
                <div className="text-center">
                  <p className="font-semibold flex items-center justify-center gap-1">
                    <ThumbsUp className="h-3 w-3" />
                    {recommendCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Rekomendasi</p>
                </div>
              </div>
              
              {/* File Name - Collapsible */}
              <details className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  Detail File
                </summary>
                <div className="mt-2 space-y-1 text-xs">
                  <p><span className="text-muted-foreground">Nama:</span> <span className="font-mono break-all">{document.fileName}</span></p>
                  <p><span className="text-muted-foreground">MIME:</span> <span className="font-mono">{document.mimeType}</span></p>
                  <p><span className="text-muted-foreground">Dibuat:</span> {formatDate(document.createdAt)}</p>
                </div>
              </details>
            </CardContent>          </Card>
        </div>          {/* Sidebar */}
        <div className="space-y-4 md:space-y-6">
          {/* Author Info - Enhanced */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Tentang Penulis
              </CardTitle>
            </CardHeader>            <CardContent>
              <div className="text-center space-y-3 md:space-y-4">
                <Avatar className="h-16 w-16 md:h-20 md:w-20 mx-auto">
                  {authorPhoto ? (
                    <AvatarImage 
                      src={imageAPI.getImageUrl(authorPhoto)} 
                      alt={document.author}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="text-lg md:text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {document.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg md:text-xl">{document.author}</h3>
                  <p className="text-muted-foreground text-sm">Penulis Dokumen</p>
                </div>
                <Button variant="outline" className="w-full text-sm">
                  Lihat Profil Penulis
                </Button>
              </div>
            </CardContent>
          </Card>          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 md:space-y-3">
              <Button 
                onClick={handleDownload} 
                className="w-full gap-2 text-sm" 
                size="default"
              >
                <Download className="h-3 w-3 md:h-4 md:w-4" />
                Download Dokumen
              </Button>
              <Button 
                variant="outline" 
                onClick={toggleBookmark} 
                className="w-full gap-2 text-sm"
                size="default"
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-3 w-3 md:h-4 md:w-4 fill-current" />
                ) : (
                  <Bookmark className="h-3 w-3 md:h-4 md:w-4" />
                )}
                {isBookmarked ? 'Hapus dari Simpanan' : 'Simpan Dokumen'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleShare} 
                className="w-full gap-2 text-sm"
                size="default"
              >
                <Share2 className="h-3 w-3 md:h-4 md:w-4" />
                Bagikan Dokumen
              </Button>
            </CardContent>
          </Card>          {/* Related Documents */}
          {relatedDocuments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Dokumen Terkait</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                {relatedDocuments.map((relatedDoc) => (
                  <div
                    key={relatedDoc.id}
                    className="p-2 md:p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/documents/${relatedDoc.id}`)}
                  >
                    <h4 className="font-medium text-xs md:text-sm line-clamp-2 mb-1">
                      {relatedDoc.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      oleh {relatedDoc.author}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${getFileTypeColor(relatedDoc.fileType)}`}>
                        {relatedDoc.fileType.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(relatedDoc.fileSize)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>            </Card>          )}
        </div>
      </div>      {/* Comments Section - Full Width */}
      <div className="mt-8">        <UniversalCommentSection 
          resourceType="document"
          resourceId={document.id}
          fetchCommentsUrl={getApiUrl(`/api/documents/${document.id}/comments`)}
          createCommentUrl={getApiUrl(`/api/documents/${document.id}/comments`)}
          replyCommentUrl={getApiUrl(`/api/documents/${document.id}/comments`)}
          enableLikes={true}
          enableDislikes={true}
          enableReplies={true}
        />
      </div>
    </div>
  )
}
