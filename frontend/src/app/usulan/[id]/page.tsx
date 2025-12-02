'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ProtectedRoute from "@/components/ProtectedRoute";
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth } from '@/contexts/AuthContext'
import UniversalCommentSection from '@/components/UniversalCommentSection'
import { config, getApiUrl } from '@/lib/config'
import { 
  ArrowLeft, 
  Calendar,
  User,
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Clock,
  TrendingUp,
  Timer,
  CheckCircle,
  AlertCircle,
  FileText,
  LogIn,
  Edit,
  Play
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
  jumlahUpvote: number
  jumlahDownvote: number
  status: string
  createdAt: string
  updatedAt: string
  sisaHari?: number
  score?: number
}

interface UserVote {
  id: number
  tipeVote: 'UPVOTE' | 'DOWNVOTE'
}

export default function UsulanDetailPage() {  
  const { isMobile, isSmallMobile } = useMobileDetection();
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [usulan, setUsulan] = useState<Usulan | null>(null)
  const [userVote, setUserVote] = useState<UserVote | null>(null)
  const [loading, setLoading] = useState(true)  
  const [votingStates, setVotingStates] = useState<{ [key: string]: boolean }>({})
  const [pelaksanaanId, setPelaksanaanId] = useState<number | null>(null)
  const [userInfo, setUserInfo] = useState({ name: '', email: '' })
  const [isMovingToPelaksanaan, setIsMovingToPelaksanaan] = useState(false)
  
  // Load usulan detail
  const loadUsulan = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`/api/usulan/${id}`))
      
      if (!response.ok) {
        throw new Error('Usulan not found')
      }
      
      const data = await response.json()
      
      // Calculate remaining days
      const durasiDate = new Date(data.durasiUsulan)
      const today = new Date()
      const diffTime = durasiDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      setUsulan({
        ...data,
        sisaHari: Math.max(0, diffDays),
        score: data.jumlahUpvote - data.jumlahDownvote
      })
    } catch (error) {
      console.error('Error loading usulan:', error)
      toast.error('Usulan tidak ditemukan', {
        dismissible: true,
        duration: 5000
      })
      router.push('/usulan')
    } finally {
      setLoading(false)
    }
  }
  // Load user vote
  const loadUserVote = async (email?: string) => {
    const emailToUse = email || userInfo.email
    if (!emailToUse) return
    
    try {
      const response = await fetch(
        getApiUrl(`/api/usulan/${id}/user-vote?emailVoter=${encodeURIComponent(emailToUse)}`)
      )
      
      if (response.ok) {
        const vote = await response.json()
        setUserVote(vote)
      }
    } catch (error) {
      console.error('Error loading user vote:', error)
    }
  }

  // Check if this usulan has been moved to pelaksanaan
  const checkPelaksanaan = async () => {
    try {
      const response = await fetch(
        getApiUrl(`/api/pelaksanaan/usulan/${id}`)
      )
      
      if (response.ok) {
        const pelaksanaan = await response.json()
        setPelaksanaanId(pelaksanaan.id)
      }
    } catch (error) {
      // Pelaksanaan not found, which is normal for active usulan
      console.debug('Pelaksanaan not found for this usulan')
    }
  }  
  
  // Check if user has permission to edit this usulan
  const hasEditPermission = () => {
    if (!isAuthenticated || !user || !usulan) {
      return false
    }
    
    // Admin can edit
    const isAdmin = user.role?.roleName === 'ADMIN'
    
    // Proposer can edit
    const isProposer = usulan.emailPengusul && user.email === usulan.emailPengusul
    
    return isAdmin || isProposer
  }

  // Handle voting with authentication
  const handleVote = async (tipeVote: 'UPVOTE' | 'DOWNVOTE') => {
    if (!isAuthenticated) {
      toast.error('Silakan login terlebih dahulu untuk memberikan vote')
      return
    }

    // Check for existing vote and provide user feedback
    let actionMessage = ''
    
    if (userVote && userVote.tipeVote === tipeVote) {
      actionMessage = tipeVote === 'UPVOTE' ? 'Upvote dihapus' : 'Downvote dihapus'
    } else if (userVote && userVote.tipeVote !== tipeVote) {
      actionMessage = tipeVote === 'UPVOTE' ? 'Diubah ke upvote' : 'Diubah ke downvote'
    } else {
      actionMessage = tipeVote === 'UPVOTE' ? 'Upvote berhasil' : 'Downvote berhasil'
    }

    // Auto-fill name from biografi if available, otherwise use fullName
    const name = user?.biografi?.namaLengkap || user?.fullName || ''
    const email = user?.email || ''

    if (!name || !email) {
      toast.error('Profil pengguna tidak lengkap. Silakan lengkapi data biografi Anda.')
      return
    }

    // Set loading state for voting
    setVotingStates(prev => ({ ...prev, [tipeVote]: true }))

    try {
      const response = await fetch(
        getApiUrl(`/api/usulan/${id}/vote`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            emailVoter: email,
            namaVoter: name,
            tipeVote: tipeVote
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || 'Failed to vote')
      }

      // Update user info if not already set
      if (!userInfo.email) {
        setUserInfo({ name, email })
      }

      toast.success(actionMessage)
      await loadUsulan()
      await loadUserVote(email)
    } catch (error) {
      console.error('Error voting:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal melakukan vote')
    } finally {
      // Remove loading state
      setVotingStates(prev => ({ ...prev, [tipeVote]: false }))
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Format datetime
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  // Get vote button style
  const getVoteButtonStyle = (voteType: 'UPVOTE' | 'DOWNVOTE') => {
    const hasVoted = userVote && userVote.tipeVote === voteType
    const isLoading = votingStates[voteType]
    
    if (hasVoted) {
      return voteType === 'UPVOTE' 
        ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-800 dark:text-green-200 dark:border-green-600' 
        : 'bg-red-100 text-red-700 border-red-300 dark:bg-red-800 dark:text-red-200 dark:border-red-600'
    }
    
    if (isLoading) {
      return 'bg-blue-100 text-blue-600 border-blue-300 dark:bg-blue-800 dark:text-blue-200 dark:border-blue-600 opacity-75'
    }
    
    return 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700'
  }

  // Get vote tooltip
  const getVoteTooltip = (voteType: 'UPVOTE' | 'DOWNVOTE') => {
    if (!isAuthenticated) {
      return 'Login diperlukan untuk voting'
    }
    
    const hasVoted = userVote && userVote.tipeVote === voteType
    
    if (hasVoted) {
      return voteType === 'UPVOTE' ? 'Klik untuk menghapus upvote' : 'Klik untuk menghapus downvote'
    } else if (userVote) {
      return voteType === 'UPVOTE' ? 'Ubah ke upvote' : 'Ubah ke downvote'
    }
    
    return voteType === 'UPVOTE' ? 'Berikan upvote' : 'Berikan downvote'
  }
  
  // Handle moving to pelaksanaan
  const handleMoveToPelaksanaan = async () => {    if (!isAuthenticated) {
      toast.error('Silakan login terlebih dahulu')
      return
    }
    
    if (user?.role?.roleName !== 'ADMIN') {
      toast.error('Hanya admin yang dapat memindahkan usulan ke pelaksanaan')
      return
    }
    
    try {
      setIsMovingToPelaksanaan(true)
      
      const response = await fetch(
        getApiUrl(`/api/usulan/${id}/move-to-pelaksanaan`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || 'Gagal memindahkan ke pelaksanaan')
      }
      
      const data = await response.json()
      setPelaksanaanId(data.pelaksanaanId)
      
      toast.success('Usulan berhasil dipindahkan ke pelaksanaan')
      await loadUsulan() // Reload usulan data to get updated status
    } catch (error) {
      console.error('Error moving to pelaksanaan:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal memindahkan ke pelaksanaan')
    } finally {
      setIsMovingToPelaksanaan(false)
    }
  }
  
  useEffect(() => {
    if (id) {
      loadUsulan()
      checkPelaksanaan()
    }
  }, [id])

  useEffect(() => {
    // Set user info when component mounts if user is authenticated
    if (isAuthenticated && user) {
      const name = user?.biografi?.namaLengkap || user?.fullName || ''
      const email = user?.email || ''
      if (name && email) {
        setUserInfo({ name, email })
      }
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    if (userInfo.email) {
      loadUserVote()
    }
  }, [userInfo.email])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-300 rounded mb-6"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                <div className="h-4 bg-gray-300 rounded w-4/6"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!usulan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-500 text-lg mb-4">Usulan tidak ditemukan</p>
            <Link href="/usulan">
              <Button>Kembali ke Daftar Usulan</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }
  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 shadow-sm border-b">
          <div className={`${isMobile ? 'max-w-full mx-auto px-3' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
            <div className={`flex justify-between items-center ${isMobile ? 'py-3' : 'py-4'}`}>
              <div className="flex items-center space-x-4">
                <Link href="/usulan" className={`flex items-center ${isMobile ? 'space-x-1' : 'space-x-2'} text-gray-600 hover:text-gray-800 touch-manipulation`}>
                  <ArrowLeft className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'}`} />
                  <span className={`${isMobile ? 'text-sm' : ''}`}>Kembali</span>
                </Link>
                {!isMobile && (
                  <Badge variant="outline" className="text-sm">
                    Detail Usulan
                  </Badge>
                )}
              </div>
              {!isMobile && <ThemeToggle />}
            </div>
            {isMobile && (
              <div className="pb-3 flex justify-center">
                <Badge variant="outline" className="text-xs">
                  Detail Usulan
                </Badge>
              </div>
            )}
          </div>
        </div>

      <div className={`${isMobile ? 'max-w-full mx-auto px-3 py-4' : 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>        {/* Main Content */}
        <Card className={`${isMobile ? 'mb-4' : 'mb-8'} overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900`}>
          <CardHeader className={`bg-gradient-to-r from-blue-600 to-indigo-600 text-white ${isMobile ? 'p-4' : ''}`}>
            <div className={`${isMobile ? 'space-y-4' : 'flex justify-between items-start mb-4'}`}>
              <div>
                <CardTitle className={`${isMobile ? 'text-xl mb-2' : 'text-3xl mb-3'} font-bold leading-tight`}>
                  {usulan.judul}
                </CardTitle>
                <div className={`${isMobile ? 'space-y-2' : 'flex items-center space-x-6'} text-blue-100`}>
                  <div className="flex items-center space-x-2">
                    <User className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                    <span className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{usulan.namaPengusul}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                    <span className={`${isMobile ? 'text-sm' : ''}`}>{formatDateTime(usulan.createdAt)}</span>
                  </div>
                </div>
              </div>
              
              {/* Time remaining - mobile optimized */}
              {!isMobile && (
                <div className="flex items-center space-x-3">
                  {usulan.sisaHari !== undefined && usulan.sisaHari > 0 && (
                    <div className="flex items-center space-x-2 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-semibold shadow-md">
                      <Timer className="h-5 w-5" />
                      <span className="text-sm font-bold">{usulan.sisaHari} hari tersisa</span>
                    </div>
                  )}
                  
                  {usulan.sisaHari !== undefined && usulan.sisaHari <= 0 && !pelaksanaanId && (
                    <div className="flex items-center space-x-2 bg-red-400 text-red-900 px-4 py-2 rounded-full font-semibold shadow-md">
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-sm font-bold">Usulan telah berakhir</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Mobile time remaining */}
            {isMobile && (
              <div className="flex justify-center">
                {usulan.sisaHari !== undefined && usulan.sisaHari > 0 && (
                  <div className="flex items-center space-x-2 bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-full font-semibold shadow-md text-sm">
                    <Timer className="h-4 w-4" />
                    <span className="font-bold">{usulan.sisaHari} hari tersisa</span>
                  </div>
                )}
                
                {usulan.sisaHari !== undefined && usulan.sisaHari <= 0 && !pelaksanaanId && (
                  <div className="flex items-center space-x-2 bg-red-400 text-red-900 px-3 py-1.5 rounded-full font-semibold shadow-md text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-bold">Usulan telah berakhir</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Action buttons row */}
            {!pelaksanaanId && (
              <div className={`flex ${isMobile ? 'flex-col space-y-2 mt-3' : 'justify-end items-center space-x-3 mt-2 mb-3'}`}>
                {/* Edit button - only visible to admin or proposer */}
                {hasEditPermission() && (
                  <Link href={`/usulan/edit/${id}`} className={`${isMobile ? 'w-full' : ''}`}>
                    <Button 
                      variant="outline" 
                      className={`${isMobile ? 'w-full justify-center' : ''} flex items-center space-x-2 bg-white text-blue-700 border-blue-300 hover:bg-blue-50 dark:bg-gray-800 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-gray-700 touch-manipulation`}
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </Button>
                  </Link>
                )}
                
                {/* Move to Pelaksanaan button - only visible to admin */}
                {isAuthenticated && user?.role?.roleName === 'ADMIN' && (
                  <Button 
                    onClick={handleMoveToPelaksanaan} 
                    disabled={isMovingToPelaksanaan}
                    className={`${isMobile ? 'w-full justify-center' : ''} flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all touch-manipulation`}
                  >
                    {isMovingToPelaksanaan ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span>Laksanakan</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
            
            {/* Show pelaksanaan link if usulan has been moved */}
            {pelaksanaanId && (
              <div className={`${isMobile ? 'mb-3 p-4' : 'mb-4 p-6'} bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-r-xl shadow-lg`}>
                <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
                  <div className={`flex items-${isMobile ? 'start' : 'center'} ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
                    <CheckCircle className={`${isMobile ? 'h-5 w-5 mt-0.5' : 'h-6 w-6'} text-blue-600 flex-shrink-0`} />
                    <div>
                      <p className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-blue-900`}>
                        Usulan telah dipindahkan ke pelaksanaan
                      </p>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-700 mt-1`}>
                        {isMobile ? 'Usulan sudah masuk fase pelaksanaan.' : 'Usulan ini sudah masuk fase pelaksanaan. Anda dapat melihat progress dan dokumentasinya.'}
                      </p>
                    </div>
                  </div>
                  <Link href={`/pelaksanaan/${pelaksanaanId}`} className={`${isMobile ? 'w-full' : ''}`}>
                    <Button size={isMobile ? "default" : "lg"} className={`${isMobile ? 'w-full justify-center' : ''} bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all touch-manipulation`}>
                      <CheckCircle className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} mr-2`} />
                      Lihat Pelaksanaan
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardHeader>          <CardContent className={`${isMobile ? 'p-4' : 'p-8'}`}>
            {usulan.gambarUrl && (
              <div className={`${isMobile ? 'mb-4' : 'mb-8'} relative w-full ${isMobile ? 'max-w-full' : 'max-w-lg mx-auto'} rounded-xl overflow-hidden shadow-md`}>
                <Image
                  src={`${config.baseUrl}${usulan.gambarUrl}`}
                  alt={usulan.judul}
                  width={400}
                  height={200}
                  className={`w-full h-auto ${isMobile ? 'max-h-48' : 'max-h-60'} object-contain bg-gradient-to-br from-gray-50 to-gray-100`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
              </div>
            )}
            
            <div className={`${isMobile ? 'grid grid-cols-1 gap-3 mb-6 p-4' : 'grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6'} bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl`}>
              <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'} text-gray-700 dark:text-gray-300`}>
                <div className={`${isMobile ? 'p-1.5' : 'p-2'} bg-blue-100 dark:bg-blue-900 rounded-lg`}>
                  <Calendar className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-blue-600 dark:text-blue-400`} />
                </div>
                <div>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-500 dark:text-gray-400`}>
                    Periode Kegiatan
                  </p>
                  <p className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>
                    {isMobile ? (
                      <>
                        {formatDate(usulan.tanggalMulai)}<br />
                        <span className="text-xs text-gray-500">s/d</span><br />
                        {formatDate(usulan.tanggalSelesai)}
                      </>
                    ) : (
                      `${formatDate(usulan.tanggalMulai)} - ${formatDate(usulan.tanggalSelesai)}`
                    )}
                  </p>
                </div>
              </div>
              <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'} text-gray-700 dark:text-gray-300`}>
                <div className={`${isMobile ? 'p-1.5' : 'p-2'} bg-orange-100 dark:bg-orange-900 rounded-lg`}>
                  <Clock className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-orange-600 dark:text-orange-400`} />
                </div>
                <div>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-500 dark:text-gray-400`}>
                    Batas Usulan
                  </p>
                  <p className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>
                    {formatDate(usulan.durasiUsulan)}
                  </p>
                </div>
              </div>
            </div>            <div className={`${isMobile ? 'mb-6' : 'mb-10'}`}>
              <div className={`flex items-center ${isMobile ? 'mb-4' : 'mb-8'}`}>
                <div className={`${isMobile ? 'p-2' : 'p-3'} bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg ${isMobile ? 'mr-2' : 'mr-4'}`}>
                  <FileText className={`${isMobile ? 'h-5 w-5' : 'h-8 w-8'} text-white`} />
                </div>
                <h3 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 dark:text-white`}>
                  Rencana Kegiatan
                </h3>
              </div>
              <div className={`bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 rounded-2xl ${isMobile ? 'p-4' : 'p-8'} border-2 border-blue-100 dark:border-gray-600 shadow-xl`}>
                <div className={`prose ${isMobile ? 'prose-sm' : 'prose-lg'} max-w-none text-gray-800 dark:text-gray-200 leading-relaxed`}>
                  <p className={`whitespace-pre-wrap ${isMobile ? 'text-sm' : 'text-lg'} font-medium`}>
                    {usulan.rencanaKegiatan}
                  </p>
                </div>
              </div>
            </div>            {/* Voting Section */}
            <div className={`bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 rounded-2xl ${isMobile ? 'p-4' : 'p-8'} border-2 border-blue-100 dark:border-gray-600 shadow-xl`}>
              {!isAuthenticated ? (
                <Alert className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className={`${isMobile ? 'text-sm' : 'text-sm'}`}>
                    <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center justify-between'}`}>
                      <span>Silakan login untuk memberikan vote pada usulan ini</span>
                      <Link href="/login" className={`${isMobile ? 'w-full' : ''}`}>
                        <Button size="sm" variant="outline" className={`${isMobile ? 'w-full justify-center' : 'ml-4'} touch-manipulation`}>
                          <LogIn className="h-4 w-4 mr-1" />
                          Login
                        </Button>
                      </Link>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : null}
              
              {isMobile ? (
                /* Mobile Voting Layout */
                <div className="space-y-4">
                  {/* Vote Buttons Row */}
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => handleVote('UPVOTE')}
                      disabled={!isAuthenticated || votingStates['UPVOTE']}
                      title={getVoteTooltip('UPVOTE')}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-xl border transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation ${getVoteButtonStyle('UPVOTE')}`}
                    >
                      <ArrowUp className="h-6 w-6" />
                      <span className="font-bold text-lg">{usulan.jumlahUpvote}</span>
                      {votingStates['UPVOTE'] && (
                        <div className="ml-1 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleVote('DOWNVOTE')}
                      disabled={!isAuthenticated || votingStates['DOWNVOTE']}
                      title={getVoteTooltip('DOWNVOTE')}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-xl border transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation ${getVoteButtonStyle('DOWNVOTE')}`}
                    >
                      <ArrowDown className="h-6 w-6" />
                      <span className="font-bold text-lg">{usulan.jumlahDownvote}</span>
                      {votingStates['DOWNVOTE'] && (
                        <div className="ml-1 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </button>
                  </div>
                  
                  {/* Score Display */}
                  <div className="flex justify-center">
                    <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl shadow-lg">
                      <TrendingUp className="h-6 w-6" />
                      <div className="text-center">
                        <div className="font-bold text-2xl">{usulan.score}</div>
                        <div className="text-sm opacity-90">total score</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Comments Link */}
                  <div className="flex justify-center">
                    <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow-md">
                      <MessageCircle className="h-6 w-6 text-blue-500" />
                      <span className="font-semibold text-lg">Komentar</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Desktop Voting Layout */
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-8">
                    <button
                      onClick={() => handleVote('UPVOTE')}
                      disabled={!isAuthenticated || votingStates['UPVOTE']}
                      title={getVoteTooltip('UPVOTE')}
                      className={`flex items-center space-x-3 px-6 py-3 rounded-xl border transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${getVoteButtonStyle('UPVOTE')}`}
                    >
                      <ArrowUp className="h-6 w-6" />
                      <span className="font-bold text-lg">{usulan.jumlahUpvote}</span>
                      {votingStates['UPVOTE'] && (
                        <div className="ml-1 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleVote('DOWNVOTE')}
                      disabled={!isAuthenticated || votingStates['DOWNVOTE']}
                      title={getVoteTooltip('DOWNVOTE')}
                      className={`flex items-center space-x-3 px-6 py-3 rounded-xl border transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${getVoteButtonStyle('DOWNVOTE')}`}
                    >
                      <ArrowDown className="h-6 w-6" />
                      <span className="font-bold text-lg">{usulan.jumlahDownvote}</span>
                      {votingStates['DOWNVOTE'] && (
                        <div className="ml-1 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </button>
                    
                    <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl shadow-lg">
                      <TrendingUp className="h-6 w-6" />
                      <div className="text-center">
                        <div className="font-bold text-2xl">{usulan.score}</div>
                        <div className="text-sm opacity-90">total score</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow-md">
                    <MessageCircle className="h-6 w-6 text-blue-500" />
                    <span className="font-semibold text-lg">Komentar</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>        {/* Comment Section */}
        <UniversalCommentSection
          resourceType="usulan"
          resourceId={parseInt(id)}
          fetchCommentsUrl={`/api/usulan/${id}/komentar?page=0&size=50`}
          createCommentUrl={`/api/usulan/${id}/komentar`}
          replyCommentUrl="/api/usulan/komentar/{parentId}/reply"
          enableLikes={true}
          enableDislikes={true}
          enableReplies={true}
          className={isMobile ? "mt-4" : "mt-6"}
        />
      </div>
    </div>
    </ProtectedRoute>
  )
}
