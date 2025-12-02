'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from '@/contexts/AuthContext'
import { 
  MessageCircle, 
  ThumbsUp,
  ThumbsDown, 
  Reply, 
  Send,
  User,
  Clock,
  LogIn,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  commentAPI, 
  biografiAPI, 
  imageAPI,
  formatCommentDate 
} from '@/lib/api'
import { getApiUrl } from '@/lib/config'

// Universal comment interface to normalize different API responses
interface UniversalComment {
  id: number
  nama: string
  konten: string
  foto?: string
  createdAt: string
  likes: number
  dislikes: number
  replies?: UniversalComment[]
  parentId?: number
}

interface UniversalCommentSectionProps {
  resourceType: 'berita' | 'document' | 'pelaksanaan' | 'usulan'
  resourceId: number
  fetchCommentsUrl?: string
  createCommentUrl?: string
  replyCommentUrl?: string
  enableLikes?: boolean
  enableDislikes?: boolean
  enableReplies?: boolean
  className?: string
}

interface CommentItemProps {
  comment: UniversalComment
  onReply: (parentId: number, content: string, nama: string) => void
  onLike: (commentId: number) => void
  onDislike: (commentId: number) => void
  isAuthenticated: boolean
  user?: any
  level?: number
  likeLoading?: boolean
  dislikeLoading?: boolean
  enableLikes: boolean
  enableDislikes: boolean
  enableReplies: boolean
}

const CommentItem = ({ 
  comment, 
  onReply, 
  onLike, 
  onDislike, 
  isAuthenticated, 
  user, 
  level = 0, 
  likeLoading = false, 
  dislikeLoading = false,
  enableLikes,
  enableDislikes,
  enableReplies
}: CommentItemProps) => {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [replyNama, setReplyNama] = useState('')
  const [loading, setLoading] = useState(false)
  const [authorBiografi, setAuthorBiografi] = useState<any>(null)
  const [biografiChecked, setBiografiChecked] = useState(false)

  // Load author's biografi data
  useEffect(() => {
    const loadAuthorBiografi = async () => {
      setAuthorBiografi(null)
      setBiografiChecked(false)
        const systemUsers = ['Administrator Sistem', 'Test User', 'Admin', 'System']
      if (comment.nama && systemUsers.includes(comment.nama)) {
        setBiografiChecked(true)
        return
      }

      try {
        if (comment.nama) {
          const biografi = await biografiAPI.getBiografiByName(comment.nama)
          setAuthorBiografi(biografi)
        }
      } catch (error) {
        setAuthorBiografi(null)
      } finally {
        setBiografiChecked(true)
      }
    }

    if (comment.nama) {
      loadAuthorBiografi()
    }
  }, [comment.nama])

  // Auto-fill reply name from user data
  useEffect(() => {
    if (isAuthenticated && user && showReplyForm) {
      const name = user.biografi?.namaLengkap || user.fullName
      setReplyNama(name || '')
    }
  }, [isAuthenticated, user, showReplyForm])

  const handleReplySubmit = async () => {
    if (!replyContent.trim() || !replyNama.trim()) {
      toast.error('Nama dan komentar tidak boleh kosong')
      return
    }

    setLoading(true)
    try {
      await onReply(comment.id, replyContent, replyNama)
      setReplyContent('')
      setReplyNama('')
      setShowReplyForm(false)
      toast.success('Balasan berhasil ditambahkan')
    } catch (error) {
      console.error('Error replying to comment:', error)
      toast.error('Gagal menambahkan balasan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${level > 0 ? 'ml-4 md:ml-8' : ''} mb-3 md:mb-4`}>
      <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-200">
        <CardContent className="p-3 md:p-4">          
          <div className="flex gap-2 md:gap-3">
            {/* Avatar Section */}
            <div className="flex-shrink-0">
              {authorBiografi ? (                
                <Link href={`/biografi/${authorBiografi.biografiId}`}>
                  <Avatar className="w-8 h-8 md:w-10 md:h-10 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">                    
                    {(authorBiografi.foto || comment.foto) ? (
                      <AvatarImage 
                        src={
                          authorBiografi.foto 
                            ? imageAPI.getImageUrl(authorBiografi.foto)
                            : imageAPI.getImageUrl(comment.foto || '')                        }
                        alt={comment.nama || 'User'}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs md:text-sm font-semibold">
                      {comment.nama?.charAt(0)?.toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <Avatar className="w-8 h-8 md:w-10 md:h-10">                  
                  {comment.foto ? (
                    <AvatarImage 
                      src={imageAPI.getImageUrl(comment.foto)} 
                      alt={comment.nama || 'User'}
                      className="object-cover"                    />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs md:text-sm font-semibold">
                    {comment.nama?.charAt(0)?.toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>

            {/* Comment Content */}
            <div className="flex-1 min-w-0">              
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                {authorBiografi ? (
                  <Link 
                    href={`/biografi/${authorBiografi.biografiId}`}
                    className="font-semibold text-xs md:text-sm hover:text-blue-600 transition-colors cursor-pointer"
                  >                    {comment.nama || 'Anonymous'}
                  </Link>
                ) : (
                  <h4 className="font-semibold text-xs md:text-sm text-slate-900 dark:text-slate-100">{comment.nama || 'Anonymous'}</h4>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formatCommentDate(comment.createdAt)}</span>
                </div>
              </div>
              
              <p className="text-xs md:text-sm mb-3 leading-relaxed break-words text-slate-700 dark:text-slate-300">{comment.konten}</p>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 md:gap-4">
                {!isAuthenticated ? (
                  <Alert className="py-1 px-2 md:py-2 md:px-3 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                    <AlertCircle className="h-3 w-3 text-amber-600" />                    
                    <AlertDescription className="text-xs ml-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="text-amber-700 dark:text-amber-300">Login untuk berinteraksi</span>
                        <Link href="/auth/login">
                          <Button size="sm" variant="outline" className="h-6 px-2 text-xs border-amber-300 text-amber-700 hover:bg-amber-100">
                            <LogIn className="h-3 w-3 mr-1" />
                            Login
                          </Button>
                        </Link>
                      </div>
                    </AlertDescription>
                  </Alert>                
                ) : (
                  <div className="flex items-center gap-1 md:gap-2">
                    {enableLikes && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onLike(comment.id)}
                        disabled={likeLoading || dislikeLoading}
                        className="h-7 md:h-8 px-2 md:px-3 text-xs hover:bg-green-50 hover:text-green-600 disabled:opacity-50 transition-colors"
                      >
                        {likeLoading ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <ThumbsUp className="w-3 h-3 mr-1" />
                        )}
                        <span className="font-medium">{comment.likes}</span>
                      </Button>
                    )}
                    
                    {enableDislikes && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDislike(comment.id)}
                        disabled={likeLoading || dislikeLoading}
                        className="h-7 md:h-8 px-2 md:px-3 text-xs hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
                      >
                        {dislikeLoading ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <ThumbsDown className="w-3 h-3 mr-1" />
                        )}
                        <span className="font-medium">{comment.dislikes}</span>
                      </Button>
                    )}
                    
                    {enableReplies && level < 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowReplyForm(!showReplyForm)}
                        className="h-7 md:h-8 px-2 md:px-3 text-xs hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <Reply className="w-3 h-3 mr-1" />
                        Balas
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Reply Form */}
              {showReplyForm && enableReplies && (
                <div className="mt-3 p-3 md:p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="space-y-2 md:space-y-3">                    
                    <Input
                      placeholder="Nama Anda"
                      value={replyNama}
                      onChange={(e) => setReplyNama(e.target.value)}
                      className="text-xs md:text-sm h-8 md:h-10 bg-white dark:bg-slate-800"
                      disabled={isAuthenticated && !!replyNama}
                    />
                    <Textarea
                      placeholder="Tulis balasan Anda..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="min-h-[60px] md:min-h-[80px] text-xs md:text-sm resize-none bg-white dark:bg-slate-800"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleReplySubmit}
                        disabled={loading}
                        className="h-7 md:h-8 px-3 md:px-4 text-xs bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        {loading ? 'Mengirim...' : 'Kirim'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowReplyForm(false)}
                        className="h-7 md:h-8 px-3 md:px-4 text-xs"
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">          
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onLike={onLike}
              onDislike={onDislike}
              isAuthenticated={isAuthenticated}
              user={user}
              level={level + 1}
              likeLoading={likeLoading}
              dislikeLoading={dislikeLoading}
              enableLikes={enableLikes}
              enableDislikes={enableDislikes}
              enableReplies={enableReplies}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function UniversalCommentSection({
  resourceType,
  resourceId,
  fetchCommentsUrl,
  createCommentUrl,
  replyCommentUrl,
  enableLikes = true,
  enableDislikes = true,
  enableReplies = true,
  className = ''
}: UniversalCommentSectionProps) {
  const { user, isAuthenticated } = useAuth()
  const [comments, setComments] = useState<UniversalComment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [commentNama, setCommentNama] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [commentCount, setCommentCount] = useState(0)
  const [likeLoadingMap, setLikeLoadingMap] = useState<Record<number, boolean>>({})
  const [dislikeLoadingMap, setDislikeLoadingMap] = useState<Record<number, boolean>>({})

  // Auto-fill name from user data
  useEffect(() => {
    if (isAuthenticated && user) {
      const name = user.biografi?.namaLengkap || user.fullName
      setCommentNama(name || '')
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    loadComments()
    loadCommentCount()
  }, [resourceType, resourceId])
  // Normalize different API response formats to universal comment format
  const normalizeComment = (comment: any): UniversalComment => {
    return {
      id: comment.id,
      nama: comment.nama || comment.namaPengguna || 'Anonymous',
      konten: comment.konten || '',
      foto: comment.foto,
      createdAt: comment.createdAt || comment.tanggalKomentar,
      likes: comment.likes || 0,
      dislikes: comment.dislikes || 0,
      replies: comment.replies ? comment.replies.map(normalizeComment) : [],
      parentId: comment.parentId
    }
  }
  const loadComments = async () => {
    try {
      setLoading(true)
      let data: any[] = []
      
      switch (resourceType) {
        case 'berita':
          data = await commentAPI.getCommentsByBeritaId(resourceId)
          break
        case 'document':
          {
            const response = await fetch(getApiUrl(`/api/documents/${resourceId}/comments`))
            if (response.ok) {
              data = await response.json()
            }
          }
          break
        case 'pelaksanaan':
          {
            const response = await fetch(getApiUrl(`/api/pelaksanaan/${resourceId}/komentar?page=0&size=50`))
            if (response.ok) {
              const result = await response.json()
              data = result.content || result
            }
          }
          break
        case 'usulan':
          {
            const response = await fetch(getApiUrl(`/api/usulan/${resourceId}/komentar?page=0&size=50`))
            if (response.ok) {
              const result = await response.json()
              data = result.content || result
            }
          }
          break
        default:
          console.warn('Unknown resource type:', resourceType)
          data = []
      }
      
      const normalizedComments = data.map(normalizeComment)
      setComments(normalizedComments)
    } catch (error) {
      console.error('Error loading comments:', error)
      toast.error('Gagal memuat komentar')
    } finally {
      setLoading(false)
    }
  }

  const loadCommentCount = async () => {
    try {
      let count = 0
      
      switch (resourceType) {
        case 'berita':
          const beritaData = await commentAPI.getCommentCount(resourceId)
          count = beritaData.count
          break
        case 'document':
          // Assume similar API exists or calculate from comments
          count = comments.length
          break
        case 'pelaksanaan':
          count = comments.length
          break
        case 'usulan':
          count = comments.length
          break
      }
      
      setCommentCount(count)
    } catch (error) {
      console.error('Error loading comment count:', error)
      setCommentCount(comments.length)
    }
  }
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !commentNama.trim()) {
      toast.error('Nama dan komentar tidak boleh kosong')
      return
    }    setSubmitting(true)
    try {
      const commentRequest = {
        nama: commentNama,
        konten: newComment,
        foto: undefined, // Always fetch latest from biografi
        biografiId: user?.biografi?.biografiId || null
      }
      
      switch (resourceType) {
        case 'berita':
          await commentAPI.createComment({
            ...commentRequest,
            beritaId: resourceId
          })
          break
        case 'document':
          {
            const response = await fetch(getApiUrl(`/api/documents/${resourceId}/comments`), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...commentRequest,
                documentId: resourceId
              })
            })
            if (!response.ok) throw new Error('Failed to create comment')
          }
          break
        case 'pelaksanaan':
          {
            const response = await fetch(getApiUrl(`/api/pelaksanaan/${resourceId}/komentar`), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...commentRequest,
                pelaksanaanId: resourceId
              })
            })
            if (!response.ok) throw new Error('Failed to create comment')
          }
          break
        case 'usulan':
          {
            const response = await fetch(getApiUrl(`/api/usulan/${resourceId}/komentar`), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...commentRequest,
                usulanId: resourceId
              })
            })
            if (!response.ok) throw new Error('Failed to create comment')
          }
          break
      }
      
      setNewComment('')
      setCommentNama('')
      await loadComments()
      await loadCommentCount()
      toast.success('Komentar berhasil ditambahkan')
    } catch (error) {
      console.error('Error submitting comment:', error)
      toast.error('Gagal menambahkan komentar')
    } finally {
      setSubmitting(false)
    }
  }
  const handleReply = async (parentId: number, content: string, nama: string) => {
    try {
      const replyRequest = {
        nama,
        konten: content,
        foto: undefined,
        parentId,
        biografiId: user?.biografi?.biografiId || null
      }
      
      switch (resourceType) {
        case 'berita':
          await commentAPI.replyToComment(parentId, {
            ...replyRequest,
            beritaId: resourceId
          })
          break
        case 'document':
          {
            const response = await fetch(getApiUrl(`/api/documents/${resourceId}/comments`), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...replyRequest,
                documentId: resourceId
              })
            })
            if (!response.ok) throw new Error('Failed to reply to comment')
          }
          break
        case 'pelaksanaan':
          {
            const response = await fetch(getApiUrl(`/api/pelaksanaan/komentar/${parentId}/reply`), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...replyRequest,
                pelaksanaanId: resourceId
              })
            })
            if (!response.ok) throw new Error('Failed to reply to comment')
          }
          break
        case 'usulan':
          {
            const response = await fetch(getApiUrl(`/api/usulan/komentar/${parentId}/reply`), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...replyRequest,
                usulanId: resourceId
              })
            })
            if (!response.ok) throw new Error('Failed to reply to comment')
          }
          break
      }
        await loadComments()
      await loadCommentCount()
    } catch (error) {
      console.error('Error replying to comment:', error)
      throw error
    }
  }

  const handleLike = async (commentId: number) => {
    if (!isAuthenticated) {
      toast.error('Silakan login terlebih dahulu untuk menyukai komentar')
      return
    }
    
    if (!user?.biografi?.biografiId) {
      toast.error('Data biografi pengguna tidak lengkap')
      return
    }
    
    setLikeLoadingMap(prev => ({ ...prev, [commentId]: true }))
    try {
      const biografiId = user.biografi.biografiId
      const userName = user.biografi?.namaLengkap || user.fullName || 'Anonymous'
      
      switch (resourceType) {        case 'berita':
          await commentAPI.likeComment(commentId, biografiId, userName)
          break
        case 'document':
          {
            const response = await fetch(getApiUrl(`/api/documents/${resourceId}/comments/${commentId}/like`), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                biografiId: biografiId,
                userName: userName
              })
            })
            if (!response.ok) throw new Error('Failed to like comment')
          }
          break
        case 'pelaksanaan':
          {
            const response = await fetch(getApiUrl(`/api/pelaksanaan/komentar/${commentId}/like`), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                biografiId: biografiId,
                userName: userName
              })
            })
            if (!response.ok) throw new Error('Failed to like comment')
          }
          break
        case 'usulan':
          {
            const response = await fetch(getApiUrl(`/api/usulan/komentar/${commentId}/like`), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                biografiId: biografiId,
                userName: userName
              })
            })
            if (!response.ok) throw new Error('Failed to like comment')
          }
          break      }
      
      await loadComments()
      toast.success('Berhasil menyukai komentar')
    } catch (error) {
      console.error('Error liking comment:', error)
      toast.error('Gagal menyukai komentar')
    } finally {
      setLikeLoadingMap(prev => ({ ...prev, [commentId]: false }))
    }
  }

  const handleDislike = async (commentId: number) => {
    if (!isAuthenticated) {
      toast.error('Silakan login terlebih dahulu untuk memberikan dislike')
      return
    }
    
    if (!user?.biografi?.biografiId) {
      toast.error('Data biografi pengguna tidak lengkap')
      return
    }
    
    setDislikeLoadingMap(prev => ({ ...prev, [commentId]: true }))
    try {
      const biografiId = user.biografi.biografiId
      const userName = user.biografi?.namaLengkap || user.fullName || 'Anonymous'
      
      switch (resourceType) {        case 'berita':
          await commentAPI.dislikeComment(commentId, biografiId, userName)
          break
        case 'document':
          {
            const response = await fetch(getApiUrl(`/api/documents/${resourceId}/comments/${commentId}/dislike`), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                biografiId: biografiId,
                userName: userName
              })
            })
            if (!response.ok) throw new Error('Failed to dislike comment')
          }
          break
        case 'pelaksanaan':
          {
            const response = await fetch(getApiUrl(`/api/pelaksanaan/komentar/${commentId}/dislike`), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                biografiId: biografiId,
                userName: userName
              })
            })
            if (!response.ok) throw new Error('Failed to dislike comment')
          }
          break
        case 'usulan':
          {
            const response = await fetch(getApiUrl(`/api/usulan/komentar/${commentId}/dislike`), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                biografiId: biografiId,
                userName: userName
              })
            })
            if (!response.ok) throw new Error('Failed to dislike comment')
          }
          break
      }
      
      await loadComments()
      toast.success('Berhasil memberikan dislike')
    } catch (error) {
      console.error('Error disliking comment:', error)
      toast.error('Gagal memberikan dislike')
    } finally {
      setDislikeLoadingMap(prev => ({ ...prev, [commentId]: false }))
    }
  }

  // Get resource-specific title
  const getResourceTitle = () => {
    switch (resourceType) {
      case 'berita':
        return 'berita'
      case 'document':
        return 'dokumen'
      case 'pelaksanaan':
        return 'pelaksanaan'
      case 'usulan':
        return 'usulan'
      default:
        return 'konten'
    }
  }

  return (
    <div className={className}>
      <Separator className="my-6 md:my-8" />
      
      {/* Comment Header */}
      <div className="mb-4 md:mb-6">
        <div className="flex items-center gap-2 mb-3 md:mb-4">
          <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
          <h3 className="text-lg md:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Komentar ({loading ? '...' : commentCount})
          </h3>
        </div>
          
        {/* Comment Form */}
        {!isAuthenticated ? (
          <Alert className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription>              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-sm text-blue-700 dark:text-blue-300">Silakan login untuk memberikan komentar pada {getResourceTitle()} ini</span>
                <Link href="/auth/login">
                  <Button size="sm" variant="outline" className="w-full sm:w-auto border-blue-300 text-blue-700 hover:bg-blue-100">
                    <LogIn className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    Login
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>        
        ) : (
          <Card className="bg-gradient-to-r from-white/90 to-slate-50/90 dark:from-slate-800/90 dark:to-slate-700/90 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 shadow-lg">
            <CardContent className="p-4 md:p-6">
              <div className="space-y-3 md:space-y-4">                
                <Input
                  placeholder="Nama Anda"
                  value={commentNama}
                  onChange={(e) => setCommentNama(e.target.value)}
                  className="bg-white/70 dark:bg-slate-700/70 text-sm md:text-base border-slate-200 dark:border-slate-600 focus:border-blue-400 focus:ring-blue-400"
                  disabled={isAuthenticated && !!commentNama}
                />
                <Textarea
                  placeholder={`Tulis komentar Anda tentang ${getResourceTitle()} ini...`}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[100px] md:min-h-[120px] bg-white/70 dark:bg-slate-700/70 resize-none text-sm md:text-base border-slate-200 dark:border-slate-600 focus:border-blue-400 focus:ring-blue-400"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitComment}
                    disabled={submitting}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm md:text-base px-4 md:px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Send className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                    {submitting ? 'Mengirim...' : 'Kirim Komentar'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>      
      
      {/* Comments List */}
      <div className="space-y-3 md:space-y-4">
        {loading ? (
          <div className="space-y-3 md:space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-white/50 dark:bg-slate-800/50">
                <CardContent className="p-3 md:p-4">
                  <div className="animate-pulse">
                    <div className="flex gap-2 md:gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-3 md:h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                        <div className="h-3 md:h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 md:h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <Card className="bg-gradient-to-r from-white/60 to-slate-50/60 dark:from-slate-800/60 dark:to-slate-700/60 backdrop-blur-sm border border-white/30 dark:border-slate-600/30">
            <CardContent className="p-6 md:p-8 text-center">
              <MessageCircle className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 text-muted-foreground" />
              <h3 className="text-base md:text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">Belum ada komentar</h3>
              <p className="text-muted-foreground text-sm md:text-base">
                Jadilah yang pertama memberikan komentar pada {getResourceTitle()} ini
              </p>
            </CardContent>
          </Card>        
        ) : (          
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onLike={handleLike}
              onDislike={handleDislike}
              isAuthenticated={isAuthenticated}
              user={user}
              likeLoading={likeLoadingMap[comment.id] || false}
              dislikeLoading={dislikeLoadingMap[comment.id] || false}
              enableLikes={enableLikes}
              enableDislikes={enableDislikes}
              enableReplies={enableReplies}
            />
          ))
        )}
      </div>
    </div>
  )
}
