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
import { Comment, CommentRequest, commentAPI, formatCommentDate, biografiAPI, Biografi, imageAPI } from '@/lib/api'

interface CommentSectionProps {
  beritaId: number
  className?: string
}

interface CommentItemProps {
  comment: Comment
  onReply: (parentId: number, content: string, nama: string) => void
  onLike: (commentId: number) => void
  onDislike: (commentId: number) => void
  isAuthenticated: boolean
  user?: any
  level?: number
  likeLoading?: boolean
  dislikeLoading?: boolean
}

const CommentItem = ({ comment, onReply, onLike, onDislike, isAuthenticated, user, level = 0, likeLoading = false, dislikeLoading = false }: CommentItemProps) => {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [replyNama, setReplyNama] = useState('')
  const [loading, setLoading] = useState(false)
  const [authorBiografi, setAuthorBiografi] = useState<Biografi | null>(null)
  const [biografiChecked, setBiografiChecked] = useState(false)

  // Load author's biografi data - with better error handling
  useEffect(() => {
    const loadAuthorBiografi = async () => {
      // Reset state
      setAuthorBiografi(null)
      setBiografiChecked(false)
      
      // Skip fetch for known system users that don't have biografi
      const systemUsers = ['Administrator Sistem', 'Test User', 'Admin', 'System']
      if (systemUsers.includes(comment.nama)) {
        setBiografiChecked(true)
        return
      }

      try {
        const biografi = await biografiAPI.getBiografiByName(comment.nama)
        setAuthorBiografi(biografi)
      } catch (error) {
        // Author doesn't have a biografi, that's okay
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

  const marginLeft = level * 20
  return (
    <div className={`${level > 0 ? 'ml-4 md:ml-8' : ''} mb-3 md:mb-4`}>
      <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20">
        <CardContent className="p-3 md:p-4">          
          <div className="flex gap-2 md:gap-3">
            <div className="flex-shrink-0">
              {authorBiografi ? (                
                <Link href={`/biografi/${authorBiografi.biografiId}`}>
                  <Avatar className="w-8 h-8 md:w-10 md:h-10 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">                    
                    {/* Prioritas foto: 1. dari biografi (terbaru), 2. dari komentar (backup) */}
                    {authorBiografi.foto || comment.foto ? (
                      <AvatarImage 
                        src={
                          authorBiografi.foto 
                            ? imageAPI.getImageUrl(authorBiografi.foto)
                            : imageAPI.getImageUrl(comment.foto || '')
                        }
                        alt={comment.nama}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs md:text-sm">
                      {comment.nama.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>              
              ) : (
                <Avatar className="w-8 h-8 md:w-10 md:h-10">                  
                  {/* Jika tidak ada biografi, tampilkan foto dari komentar jika ada */}
                  {comment.foto ? (
                    <AvatarImage 
                      src={imageAPI.getImageUrl(comment.foto)} 
                      alt={comment.nama}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs md:text-sm">
                    {comment.nama.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
              <div className="flex-1 min-w-0">              
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                {authorBiografi ? (
                  <Link 
                    href={`/biografi/${authorBiografi.biografiId}`}
                    className="font-semibold text-xs md:text-sm hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    {comment.nama}
                  </Link>
                ) : (
                  <h4 className="font-semibold text-xs md:text-sm">{comment.nama}</h4>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formatCommentDate(comment.createdAt)}</span>
                </div>
              </div>
              
              <p className="text-xs md:text-sm mb-3 leading-relaxed break-words">{comment.konten}</p>                <div className="flex items-center gap-2 md:gap-4">
                {!isAuthenticated ? (
                  <Alert className="py-1 px-2 md:py-2 md:px-3">
                    <AlertCircle className="h-3 w-3" />                    
                    <AlertDescription className="text-xs ml-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span>Login untuk like/dislike</span>
                        <Link href="/auth/login">
                          <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                            <LogIn className="h-3 w-3 mr-1" />
                            Login
                          </Button>
                        </Link>
                      </div>
                    </AlertDescription>
                  </Alert>                
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onLike(comment.id)}
                      disabled={likeLoading || dislikeLoading}
                      className="h-7 md:h-8 px-1 md:px-2 text-xs hover:bg-green-50 hover:text-green-600 disabled:opacity-50"
                    >
                      {likeLoading ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <ThumbsUp className="w-3 h-3 mr-1" />
                      )}
                      <span>{comment.likes}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDislike(comment.id)}
                      disabled={likeLoading || dislikeLoading}
                      className="h-7 md:h-8 px-1 md:px-2 text-xs hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      {dislikeLoading ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <ThumbsDown className="w-3 h-3 mr-1" />
                      )}
                      <span>{comment.dislikes}</span>
                    </Button>
                  </>
                )}
                
                {level < 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="h-7 md:h-8 px-1 md:px-2 text-xs hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Reply className="w-3 h-3 mr-1" />
                    Balas
                  </Button>
                )}
              </div>
                {showReplyForm && (
                <div className="mt-3 p-2 md:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="space-y-2 md:space-y-3">                    
                    <Input
                      placeholder="Nama Anda"
                      value={replyNama}
                      onChange={(e) => setReplyNama(e.target.value)}
                      className="text-xs md:text-sm h-8 md:h-10"
                      disabled={isAuthenticated && !!replyNama}
                    />
                    <Textarea
                      placeholder="Tulis balasan Anda..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="min-h-[60px] md:min-h-[80px] text-xs md:text-sm resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleReplySubmit}
                        disabled={loading}
                        className="h-7 md:h-8 px-2 md:px-3 text-xs"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        {loading ? 'Mengirim...' : 'Kirim'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowReplyForm(false)}
                        className="h-7 md:h-8 px-2 md:px-3 text-xs"
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
              likeLoading={likeLoading}
              dislikeLoading={dislikeLoading}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CommentSection({ beritaId, className = '' }: CommentSectionProps) {
  const { user, isAuthenticated } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
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
      setCommentNama(name)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    loadComments()
    loadCommentCount()
  }, [beritaId])

  const loadComments = async () => {
    try {
      setLoading(true)
      const data = await commentAPI.getCommentsByBeritaId(beritaId)
      setComments(data)
    } catch (error) {
      console.error('Error loading comments:', error)
      toast.error('Gagal memuat komentar')
    } finally {
      setLoading(false)
    }
  }

  const loadCommentCount = async () => {
    try {
      const data = await commentAPI.getCommentCount(beritaId)
      setCommentCount(data.count)
    } catch (error) {
      console.error('Error loading comment count:', error)
    }
  }
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !commentNama.trim()) {
      toast.error('Nama dan komentar tidak boleh kosong')
      return
    }    setSubmitting(true)
    try {      
      const commentRequest: CommentRequest = {
        beritaId,
        nama: commentNama,
        konten: newComment,
        // Don't store photo in comment - always fetch latest from biografi
        foto: undefined
      }
      
      await commentAPI.createComment(commentRequest)
      setNewComment('')
      setCommentNama('')
      await loadComments()
      await loadCommentCount()
      toast.success('Komentar berhasil ditambahkan')
    } catch (error) {
      console.error('Error submitting comment:', error)
      toast.error('Gagal menambahkan komentar')
    } finally {      setSubmitting(false)
    }
  }
    const handleReply = async (parentId: number, content: string, nama: string) => {
    const commentRequest: CommentRequest = {
      beritaId,
      nama,
      konten: content,
      foto: undefined, // Don't store photo - always fetch latest from biografi
      parentId
    }
    
    try {
      await commentAPI.replyToComment(parentId, commentRequest)
      await loadComments()
      await loadCommentCount()
    } catch (error) {
      console.error('Error replying to comment:', error)
      toast.error('Gagal menambahkan balasan')
    }
  }
  
  const handleLike = async (commentId: number) => {
    if (!isAuthenticated) {
      toast.error('Silakan login terlebih dahulu untuk menyukai komentar')
      return
    }
    
    if (!user?.biografi?.biografiId) {
      toast.error('Data biografi tidak ditemukan')
      return
    }
    
    setLikeLoadingMap(prev => ({ ...prev, [commentId]: true }))
    try {
      const userName = user.biografi?.namaLengkap || user.fullName || 'Anonymous'
      await commentAPI.likeComment(commentId, user.biografi.biografiId, userName)
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
      toast.error('Data biografi tidak ditemukan')
      return
    }
    
    setDislikeLoadingMap(prev => ({ ...prev, [commentId]: true }))
    try {
      const userName = user.biografi?.namaLengkap || user.fullName || 'Anonymous'
      await commentAPI.dislikeComment(commentId, user.biografi.biografiId, userName)
      await loadComments()
      toast.success('Berhasil memberikan dislike')
    } catch (error) {
      console.error('Error disliking comment:', error)
      toast.error('Gagal memberikan dislike')
    } finally {
      setDislikeLoadingMap(prev => ({ ...prev, [commentId]: false }))
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
            Komentar ({commentCount})
          </h3>
        </div>
          {/* Comment Form */}
        {!isAuthenticated ? (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-sm">Silakan login untuk memberikan komentar</span>
                <Link href="/auth/login">
                  <Button size="sm" variant="outline" className="w-full sm:w-auto">
                    <LogIn className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    Login
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>        ) : (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20">
            <CardContent className="p-4 md:p-6">
              <div className="space-y-3 md:space-y-4">                
                <Input
                  placeholder="Nama Anda"
                  value={commentNama}
                  onChange={(e) => setCommentNama(e.target.value)}
                  className="bg-white/50 dark:bg-slate-700/50 text-sm md:text-base"
                  disabled={isAuthenticated && !!commentNama}
                />
                <Textarea
                  placeholder="Tulis komentar Anda..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[100px] md:min-h-[120px] bg-white/50 dark:bg-slate-700/50 resize-none text-sm md:text-base"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitComment}
                    disabled={submitting}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm md:text-base px-4 md:px-6 py-2"
                  >
                    <Send className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                    {submitting ? 'Mengirim...' : 'Kirim Komentar'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>      {/* Comments List */}
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
          <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20">
            <CardContent className="p-6 md:p-8 text-center">
              <MessageCircle className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 text-muted-foreground" />
              <h3 className="text-base md:text-lg font-semibold mb-2">Belum ada komentar</h3>
              <p className="text-muted-foreground text-sm md:text-base">
                Jadilah yang pertama memberikan komentar pada berita ini
              </p>
            </CardContent>
          </Card>        ) : (          comments.map((comment) => (
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
            />
          ))
        )}
      </div>
    </div>
  )
}
