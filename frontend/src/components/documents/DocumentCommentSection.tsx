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
import { getApiUrl } from '@/lib/config'
import { 
  MessageCircle, 
  ThumbsUp,
  ThumbsDown, 
  Reply, 
  Send,
  Clock,
  LogIn,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { biografiAPI, Biografi, imageAPI } from '@/lib/api'

interface DocumentComment {
  id: number
  content: string
  author: string
  createdAt: string
  likeCount: number
  dislikeCount: number
  replies?: DocumentComment[]
  isLiked?: boolean
  isDisliked?: boolean
  foto?: string
}

interface DocumentCommentBackend {
  id: number
  dokumentId: number
  nama: string
  konten: string
  parentId: number | null
  likes: number
  dislikes: number
  createdAt: string
  updatedAt: string
  replies?: DocumentCommentBackend[]
}

interface DocumentCommentSectionProps {
  documentId: number
  className?: string
}

interface CommentItemProps {
  comment: DocumentComment
  onReply: (parentId: number, content: string, author: string) => void
  onLike: (commentId: number) => void
  onDislike: (commentId: number) => void
  level?: number
  isAuthenticated: boolean
  user?: {
    id: string;
    name: string;
    fullName?: string;
    email?: string;
    avatar?: string;
    biografi?: {
      namaLengkap?: string;
    };
  } | null
}

const formatCommentDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Baru saja'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`
  
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const CommentItem = ({ comment, onReply, onLike, onDislike, level = 0, isAuthenticated, user }: CommentItemProps) => {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [replyAuthor, setReplyAuthor] = useState('')
  const [loading, setLoading] = useState(false)
  const [authorBiografi, setAuthorBiografi] = useState<Biografi | null>(null)

  // Load author's biografi data - with better error handling
  useEffect(() => {
    const loadAuthorBiografi = async () => {
      // Reset state
      setAuthorBiografi(null)
      
      // Skip fetch for known system users that don't have biografi
      const systemUsers = ['Administrator Sistem', 'Test User', 'Admin', 'System']
      if (systemUsers.includes(comment.author)) {
        return
      }

      try {
        const biografi = await biografiAPI.getBiografiByName(comment.author)
        setAuthorBiografi(biografi)
      } catch {
        // Author doesn't have a biografi, that's okay
        setAuthorBiografi(null)
      }
    }

    if (comment.author) {
      loadAuthorBiografi()
    }
  }, [comment.author])

  // Auto-fill reply author from user data
  useEffect(() => {
    if (isAuthenticated && user && showReplyForm) {
      const name = user.biografi?.namaLengkap || user.fullName
      setReplyAuthor(name || '')
    }
  }, [isAuthenticated, user, showReplyForm])

  const handleReplySubmit = async () => {
    if (!replyContent.trim() || !replyAuthor.trim()) {
      toast.error('Nama dan komentar tidak boleh kosong')
      return
    }

    setLoading(true)
    try {
      await onReply(comment.id, replyContent, replyAuthor)
      setReplyContent('')
      setReplyAuthor('')
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
    <div className={`${level > 0 ? 'ml-8' : ''} mb-4`}>
      <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              {authorBiografi ? (
                <Link href={`/biografi/${authorBiografi.biografiId}`}>
                  <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
                    {/* Prioritas foto: 1. dari biografi (terbaru), 2. dari komentar (backup) */}
                    {authorBiografi.foto || comment.foto ? (
                      <AvatarImage 
                        src={
                          authorBiografi.foto 
                            ? imageAPI.getImageUrl(authorBiografi.foto)
                            : imageAPI.getImageUrl(comment.foto || '')
                        }
                        alt={comment.author}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      {comment.author.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <Avatar className="w-10 h-10">
                  {/* Jika tidak ada biografi, tampilkan foto dari komentar jika ada */}
                  {comment.foto ? (
                    <AvatarImage 
                      src={imageAPI.getImageUrl(comment.foto)} 
                      alt={comment.author}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    {comment.author.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {authorBiografi ? (
                  <Link 
                    href={`/biografi/${authorBiografi.biografiId}`}
                    className="font-semibold text-sm hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    {comment.author}
                  </Link>
                ) : (
                  <h4 className="font-semibold text-sm">{comment.author}</h4>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formatCommentDate(comment.createdAt)}</span>
                </div>
              </div>
              
              <p className="text-sm mb-3 leading-relaxed">{comment.content}</p>
              
              <div className="flex items-center gap-4">
                {!isAuthenticated ? (
                  <Alert className="py-2 px-3">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs ml-2">
                      <span className="mr-2">Login untuk like/dislike</span>
                      <Link href="/auth/login">
                        <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                          <LogIn className="h-3 w-3 mr-1" />
                          Login
                        </Button>
                      </Link>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onLike(comment.id)}
                      className="h-8 px-2 text-xs hover:bg-green-50 hover:text-green-600"
                    >
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      <span>{comment.likeCount}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDislike(comment.id)}
                      className="h-8 px-2 text-xs hover:bg-red-50 hover:text-red-600"
                    >
                      <ThumbsDown className="w-3 h-3 mr-1" />
                      <span>{comment.dislikeCount}</span>
                    </Button>
                  </>
                )}
                
                {level < 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="h-8 px-2 text-xs hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Reply className="w-3 h-3 mr-1" />
                    Balas
                  </Button>
                )}
              </div>
              
              {showReplyForm && (
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="space-y-3">
                    <Input
                      placeholder="Nama Anda"
                      value={replyAuthor}
                      onChange={(e) => setReplyAuthor(e.target.value)}
                      className="text-sm"
                      disabled={isAuthenticated && !!replyAuthor}
                    />
                    <Textarea
                      placeholder="Tulis balasan Anda..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="min-h-[80px] text-sm resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleReplySubmit}
                        disabled={loading}
                        className="h-8 px-3 text-xs"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        {loading ? 'Mengirim...' : 'Kirim'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowReplyForm(false)}
                        className="h-8 px-3 text-xs"
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
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function DocumentCommentSection({ documentId, className = '' }: DocumentCommentSectionProps) {
  const { user, isAuthenticated } = useAuth()
  const [comments, setComments] = useState<DocumentComment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [newCommentAuthor, setNewCommentAuthor] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [commentCount, setCommentCount] = useState(0)

  // Auto-fill name from user data
  useEffect(() => {
    if (isAuthenticated && user) {
      const name = user.biografi?.namaLengkap || user.fullName
      setNewCommentAuthor(name || '')
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    loadComments()
    loadCommentCount()
  }, [documentId])

  const loadComments = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`/api/documents/${documentId}/comments`))
      if (!response.ok) throw new Error('Failed to fetch comments')
      const data: DocumentCommentBackend[] = await response.json()
      
      const convertedComments: DocumentComment[] = data.map(convertBackendToFrontend)
      setComments(convertedComments)
    } catch (error) {
      console.error('Error loading comments:', error)
      toast.error('Gagal memuat komentar')
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  const loadCommentCount = async () => {
    try {
      const response = await fetch(getApiUrl(`/api/documents/${documentId}/comments/count`))
      if (response.ok) {
        const data = await response.json()
        setCommentCount(data.count || comments.length)
      }
    } catch (error) {
      console.error('Error loading comment count:', error)
      setCommentCount(comments.length)
    }
  }

  const convertBackendToFrontend = (backendComment: DocumentCommentBackend): DocumentComment => {
    return {
      id: backendComment.id,
      content: backendComment.konten,
      author: backendComment.nama,
      createdAt: backendComment.createdAt,
      likeCount: backendComment.likes,
      dislikeCount: backendComment.dislikes,
      isLiked: false,
      isDisliked: false,
      replies: backendComment.replies ? backendComment.replies.map(convertBackendToFrontend) : []
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !newCommentAuthor.trim()) {
      toast.error('Nama dan komentar tidak boleh kosong')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(getApiUrl(`/api/documents/${documentId}/comments`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nama: newCommentAuthor,
          konten: newComment,
          // Don't store photo in comment - always fetch latest from biografi
          foto: undefined
        })
      })

      if (!response.ok) throw new Error('Failed to create comment')

      setNewComment('')
      if (!isAuthenticated) {
        setNewCommentAuthor('')
      }
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

  const handleReply = async (parentId: number, content: string, author: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/documents/${documentId}/comments/${parentId}/reply`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nama: author,
          konten: content,
          // Don't store photo - always fetch latest from biografi
          foto: undefined
        })
      })

      if (!response.ok) throw new Error('Failed to create reply')

      await loadComments()
      await loadCommentCount()
    } catch (error) {
      console.error('Error creating reply:', error)
      throw error
    }
  }

  const handleLike = async (commentId: number) => {
    if (!isAuthenticated) {
      toast.error('Silakan login terlebih dahulu untuk menyukai komentar')
      return
    }

    if (!user?.email) {
      toast.error('Data user tidak lengkap')
      return
    }

    try {
      const userName = user.biografi?.namaLengkap || user.fullName || 'Anonymous'
      const response = await fetch(getApiUrl(`/api/documents/${documentId}/comments/${commentId}/like`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          userName: userName
        })
      })

      if (!response.ok) throw new Error('Failed to like comment')

      await loadComments()
      toast.success('Berhasil menyukai komentar')
    } catch (error) {
      console.error('Error liking comment:', error)
      toast.error('Gagal menyukai komentar')
    }
  }

  const handleDislike = async (commentId: number) => {
    if (!isAuthenticated) {
      toast.error('Silakan login terlebih dahulu untuk memberikan dislike')
      return
    }

    if (!user?.email) {
      toast.error('Data user tidak lengkap')
      return
    }

    try {
      const userName = user.biografi?.namaLengkap || user.fullName || 'Anonymous'
      const response = await fetch(getApiUrl(`/api/documents/${documentId}/comments/${commentId}/dislike`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          userName: userName
        })
      })

      if (!response.ok) throw new Error('Failed to dislike comment')

      await loadComments()
      toast.success('Berhasil memberikan dislike')
    } catch (error) {
      console.error('Error disliking comment:', error)
      toast.error('Gagal memberikan dislike')
    }
  }

  return (
    <div className={className}>
      <Separator className="my-8" />
      
      {/* Comment Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Komentar ({commentCount})
          </h3>
        </div>

        {/* Comment Form */}
        {!isAuthenticated ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>Silakan login untuk memberikan komentar</span>
                <Link href="/auth/login">
                  <Button size="sm" variant="outline" className="ml-2">
                    <LogIn className="h-4 w-4 mr-1" />
                    Login
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20">
            <CardContent className="p-6">
              <div className="space-y-4">
                <Input
                  placeholder="Nama Anda"
                  value={newCommentAuthor}
                  onChange={(e) => setNewCommentAuthor(e.target.value)}
                  className="bg-white/50 dark:bg-slate-700/50"
                  disabled={isAuthenticated && !!newCommentAuthor}
                />
                <Textarea
                  placeholder="Tulis komentar Anda..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[120px] bg-white/50 dark:bg-slate-700/50 resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitComment}
                    disabled={submitting}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {submitting ? 'Mengirim...' : 'Kirim Komentar'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-white/50 dark:bg-slate-800/50">
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20">
            <CardContent className="p-8 text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Belum ada komentar</h3>
              <p className="text-muted-foreground">
                Jadilah yang pertama memberikan komentar pada dokumen ini
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
              user={user as any}
            />
          ))
        )}
      </div>
    </div>
  )
}
