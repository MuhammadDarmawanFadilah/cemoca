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
import { 
  MessageCircle, 
  ThumbsUp, 
  ThumbsDown, 
  Reply, 
  Send,
  User,
  Clock,
  UserCheck,
  LogIn,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { biografiAPI, Biografi, imageAPI } from '@/lib/api'
import { config, getApiUrl } from '@/lib/config'

interface KomentarUsulan {
  id: number
  konten: string
  namaPengguna: string
  emailPengguna?: string
  tanggalKomentar: string
  updatedAt: string
  likes: number
  dislikes: number
  replies?: KomentarUsulan[]
  foto?: string // Add foto field
}

interface UsulanCommentSectionProps {
  usulanId: number
  className?: string
}

interface CommentItemProps {
  comment: KomentarUsulan
  onReply: (parentId: number, content: string, nama: string) => void
  onLike: (commentId: number) => void
  onDislike: (commentId: number) => void
  isAuthenticated: boolean
  user?: any
  level?: number
  likeLoading?: boolean
  dislikeLoading?: boolean
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
      if (systemUsers.includes(comment.namaPengguna)) {
        setBiografiChecked(true)
        return
      }

      try {
        const biografi = await biografiAPI.getBiografiByName(comment.namaPengguna)
        setAuthorBiografi(biografi)
      } catch (error) {
        // Author doesn't have a biografi, that's okay
        setAuthorBiografi(null)
      } finally {
        setBiografiChecked(true)
      }
    }

    if (comment.namaPengguna) {
      loadAuthorBiografi()
    }
  }, [comment.namaPengguna])

  // Auto-fill nama saat form reply dibuka
  useEffect(() => {
    if (showReplyForm && isAuthenticated && user?.biografi?.namaLengkap) {
      setReplyNama(user.biografi.namaLengkap)
    } else if (showReplyForm && !isAuthenticated) {
      setReplyNama('')
    }
  }, [showReplyForm, isAuthenticated, user])

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
    <div className={`${level > 0 ? 'ml-8' : ''} mb-4`}>      <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20">
        <CardContent className="p-4">
          <div className="flex gap-3">            <div className="flex-shrink-0">
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
                        alt={comment.namaPengguna}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      {comment.namaPengguna.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <Avatar className="w-10 h-10">
                  {/* Jika tidak ada biografi, tampilkan foto dari komentar jika ada */}
                  {comment.foto ? (
                    <AvatarImage 
                      src={imageAPI.getImageUrl(comment.foto)} 
                      alt={comment.namaPengguna}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    {comment.namaPengguna.charAt(0).toUpperCase()}
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
                    {comment.namaPengguna}
                  </Link>
                ) : (
                  <h4 className="font-semibold text-sm">{comment.namaPengguna}</h4>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formatCommentDate(comment.tanggalKomentar)}</span>
                </div>
              </div>
              
              <p className="text-sm mb-3 leading-relaxed">{comment.konten}</p>
              
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
                  </Alert>                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onLike(comment.id)}
                      disabled={likeLoading || dislikeLoading}
                      className="h-8 px-2 text-xs hover:bg-green-50 hover:text-green-600 disabled:opacity-50"
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
                      className="h-8 px-2 text-xs hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
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
                    className="h-8 px-2 text-xs hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Reply className="w-3 h-3 mr-1" />
                    Balas
                  </Button>
                )}
              </div>
              
              {showReplyForm && (
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">                  <div className="space-y-3">
                    <div className="relative">                      <Input
                        placeholder={isAuthenticated ? "Nama Anda" : "Nama Anda (anonim)"}
                        value={replyNama}
                        onChange={(e) => setReplyNama(e.target.value)}
                        className="text-sm pr-8"
                        disabled={isAuthenticated && !!user?.biografi?.namaLengkap}
                      />
                      {isAuthenticated && user?.biografi?.namaLengkap && (
                        <UserCheck className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-600" />
                      )}
                    </div>
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
        <div className="mt-2">          {comment.replies.map((reply) => (
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

export default function UsulanCommentSection({ usulanId, className = '' }: UsulanCommentSectionProps) {
  const { user, isAuthenticated } = useAuth()
  const [comments, setComments] = useState<KomentarUsulan[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [commentNama, setCommentNama] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [commentCount, setCommentCount] = useState(0)
  const [likeLoadingMap, setLikeLoadingMap] = useState<Record<number, boolean>>({})
  const [dislikeLoadingMap, setDislikeLoadingMap] = useState<Record<number, boolean>>({})

  useEffect(() => {
    loadComments()
    loadCommentCount()
  }, [usulanId])

  // Auto-fill nama komentar saat user login/logout
  useEffect(() => {
    if (isAuthenticated && user?.biografi?.namaLengkap) {
      setCommentNama(user.biografi.namaLengkap)
    } else {
      setCommentNama('')
    }
  }, [isAuthenticated, user])
  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl(`/api/usulan/${usulanId}/komentar`));
      if (!response.ok) throw new Error('Failed to load comments');
      const data = await response.json();
      setComments(data.content || []);
    } catch (error) {
      console.error('Error loading comments:', error)
      toast.error('Gagal memuat komentar')
    } finally {
      setLoading(false)
    }
  }

  const loadCommentCount = async () => {
    try {      const response = await fetch(getApiUrl(`/api/usulan/${usulanId}/komentar/count`))
      if (!response.ok) throw new Error('Failed to load comment count')
      const data = await response.json()
      setCommentCount(data.count)
    } catch (error) {
      console.error('Error loading comment count:', error)
    }
  }
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !commentNama.trim()) {
      toast.error('Nama dan komentar tidak boleh kosong')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(getApiUrl(`/api/usulan/${usulanId}/komentar`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          konten: newComment,
          namaPengguna: commentNama
          // Don't store photo in comment - always fetch latest from biografi
        })
      })
      
      if (!response.ok) throw new Error('Failed to submit comment')
      
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
    const response = await fetch(getApiUrl(`/api/usulan/komentar/${parentId}/reply`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        konten: content,
        namaPengguna: nama
        // Don't store photo - always fetch latest from biografi
      })
    })
    
    if (!response.ok) throw new Error('Failed to reply to comment')
    await loadComments()
    await loadCommentCount()
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
    
    setLikeLoadingMap(prev => ({ ...prev, [commentId]: true }))
    try {
      const userName = user.biografi?.namaLengkap || user.fullName || 'Anonymous'
      const response = await fetch(getApiUrl(`/api/usulan/komentar/${commentId}/like?userEmail=${encodeURIComponent(user.email)}&userName=${encodeURIComponent(userName)}`), {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to like comment')
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
    
    if (!user?.email) {
      toast.error('Data user tidak lengkap')
      return
    }
    
    setDislikeLoadingMap(prev => ({ ...prev, [commentId]: true }))
    try {
      const userName = user.biografi?.namaLengkap || user.fullName || 'Anonymous'
      const response = await fetch(getApiUrl(`/api/usulan/komentar/${commentId}/dislike?userEmail=${encodeURIComponent(user.email)}&userName=${encodeURIComponent(userName)}`), {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to dislike comment')
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
      <Separator className="my-8" />
      
      {/* Comment Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Komentar ({commentCount})
          </h3>
        </div>        {/* Comment Form */}
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
                  value={commentNama}
                  onChange={(e) => setCommentNama(e.target.value)}
                  className="bg-white/50 dark:bg-slate-700/50"
                  disabled={isAuthenticated && !!commentNama}
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
                Jadilah yang pertama memberikan komentar pada usulan ini
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
