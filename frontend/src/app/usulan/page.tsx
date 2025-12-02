'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'
import { config, getApiUrl, getImageUrl } from '@/lib/config'
import { ThemeToggle } from '@/components/theme-toggle'
import { 
  Plus, 
  Calendar, 
  User,
  ArrowUp,
  ArrowDown,
  Eye,
  TrendingUp,
  Timer,
  AlertCircle,
  Edit,
  Play,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  List,
  Grid,
  LogIn,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'
import UsulanFilters, { UsulanFilterRequest } from '@/components/UsulanFilters'

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

// Simple Pagination Component
const SimplePagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  loading = false
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}) => {
  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 0; i < 5; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(totalPages - 1);
      } else if (currentPage >= totalPages - 4) {
        pages.push(0);
        pages.push(-1); // ellipsis
        for (let i = totalPages - 5; i < totalPages; i++) pages.push(i);
      } else {
        pages.push(0);
        pages.push(-1); // ellipsis
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(totalPages - 1);
      }
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(0)}
        disabled={currentPage === 0 || loading}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
        <ChevronLeft className="h-4 w-4 -ml-2" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0 || loading}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1">
        {getVisiblePages().map((page, index) => {
          if (page === -1) {
            return (
              <Button
                key={`ellipsis-${index}`}
                variant="ghost"
                size="sm"
                disabled
                className="h-8 w-8 p-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            );
          }
          
          return (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              {page + 1}
            </Button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1 || loading}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(totalPages - 1)}
        disabled={currentPage === totalPages - 1 || loading}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
        <ChevronRight className="h-4 w-4 -ml-2" />
      </Button>
    </div>
  );
};

export default function UsulanPage() {
  const { user, isAuthenticated } = useAuth()
  const [usulanList, setUsulanList] = useState<Usulan[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [userVotes, setUserVotes] = useState<Record<number, UserVote>>({})
  const [userInfo, setUserInfo] = useState({ name: '', email: '' })
  const [votingStates, setVotingStates] = useState<Record<number, boolean>>({})
  const [viewMode, setViewMode] = useState<string>("grid")
  const [filters, setFilters] = useState<UsulanFilterRequest>({
    page: 0,
    size: 12,
    sortBy: 'createdAt',
    sortDirection: 'desc'
  })

  // Fetch usulan with filters
  const fetchUsulan = useCallback(async (currentFilters: UsulanFilterRequest) => {
    try {
      setLoading(true)
      let url = `${getApiUrl('/api/usulan')}?page=${currentFilters.page}&size=${currentFilters.size}`
      
      // Add search parameters
      if (currentFilters.search && currentFilters.search.trim()) {
        url += `&search=${encodeURIComponent(currentFilters.search.trim())}`
      }
      if (currentFilters.judul && currentFilters.judul.trim()) {
        url += `&judul=${encodeURIComponent(currentFilters.judul.trim())}`
      }
      if (currentFilters.namaPengusul && currentFilters.namaPengusul.trim()) {
        url += `&namaPengusul=${encodeURIComponent(currentFilters.namaPengusul.trim())}`
      }
      if (currentFilters.status && currentFilters.status !== "all") {
        url += `&status=${currentFilters.status}`
      }      if (currentFilters.tanggalMulaiFrom) {
        url += `&tanggalMulaiFrom=${currentFilters.tanggalMulaiFrom}`
      }
      if (currentFilters.tanggalMulaiTo) {
        url += `&tanggalMulaiTo=${currentFilters.tanggalMulaiTo}`
      }
      if (currentFilters.tanggalSelesaiFrom) {
        url += `&tanggalSelesaiFrom=${currentFilters.tanggalSelesaiFrom}`
      }
      if (currentFilters.tanggalSelesaiTo) {
        url += `&tanggalSelesaiTo=${currentFilters.tanggalSelesaiTo}`
      }
      if (currentFilters.sortBy && currentFilters.sortBy !== 'createdAt') {
        url += `&sortBy=${currentFilters.sortBy}`
      }
      if (currentFilters.sortDirection && currentFilters.sortDirection !== 'desc') {
        url += `&sortDirection=${currentFilters.sortDirection}`
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch usulan')
      }
      
      const data = await response.json()
      
      // Calculate remaining days for each usulan
      const usulanWithDays = data.content.map((usulan: Usulan) => {
        const durasiDate = new Date(usulan.durasiUsulan)
        const today = new Date()
        const diffTime = durasiDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        return {
          ...usulan,
          sisaHari: Math.max(0, diffDays),
          score: usulan.jumlahUpvote - usulan.jumlahDownvote
        }
      })
      
      setUsulanList(usulanWithDays)
      setTotalPages(data.totalPages || 0)
      setTotalItems(data.totalElements || 0)
      setCurrentPage(data.number || 0)
    } catch (error) {
      console.error('Error loading usulan:', error)
      toast.error('Gagal memuat usulan')
      setUsulanList([])
      setTotalPages(0)
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsulan(filters)
  }, [filters, fetchUsulan])

  const handleFilterChange = (newFilters: UsulanFilterRequest) => {
    setFilters(newFilters)
  }

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page }
    setFilters(newFilters)
  }  // Load user votes for all usulan
  const loadUserVotes = async (email?: string) => {
    const emailToUse = email || userInfo.email
    if (!emailToUse || usulanList.length === 0) return
    
    try {
      const votes: Record<number, UserVote> = {}
      
      for (const usulan of usulanList) {
        const response = await fetch(
          getApiUrl(`/api/usulan/${usulan.id}/user-vote?emailVoter=${encodeURIComponent(emailToUse)}`)
        )
        
        if (response.ok) {
          const vote = await response.json()
          votes[usulan.id] = vote
        }
      }
      
      setUserVotes(votes)
    } catch (error) {
      console.error('Error loading user votes:', error)
    }
  }

  // Handle voting with authentication
  const handleVote = async (usulanId: number, tipeVote: 'UPVOTE' | 'DOWNVOTE') => {
    if (!isAuthenticated) {
      toast.error('Silakan login terlebih dahulu untuk memberikan vote')
      return
    }

    // Check for existing vote and provide user feedback
    const currentVote = userVotes[usulanId]
    let actionMessage = ''
    
    if (currentVote && currentVote.tipeVote === tipeVote) {
      actionMessage = tipeVote === 'UPVOTE' ? 'Upvote dihapus' : 'Downvote dihapus'
    } else if (currentVote && currentVote.tipeVote !== tipeVote) {
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

    // Set loading state for this specific usulan
    setVotingStates(prev => ({ ...prev, [usulanId]: true }))

    try {
      const response = await fetch(
        getApiUrl(`/api/usulan/${usulanId}/vote`),
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
      await fetchUsulan(filters)
      await loadUserVotes(email)
    } catch (error) {
      console.error('Error voting:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal melakukan vote')
    } finally {
      // Remove loading state
      setVotingStates(prev => ({ ...prev, [usulanId]: false }))
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }
  
  // Get vote button style
  const getVoteButtonStyle = (usulanId: number, voteType: 'UPVOTE' | 'DOWNVOTE') => {
    const hasVoted = userVotes[usulanId] && userVotes[usulanId].tipeVote === voteType
    const isLoading = votingStates[usulanId]
    
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
  const getVoteTooltip = (usulanId: number, voteType: 'UPVOTE' | 'DOWNVOTE') => {
    if (!isAuthenticated) {
      return 'Login diperlukan untuk voting'
    }
    
    const hasVoted = userVotes[usulanId] && userVotes[usulanId].tipeVote === voteType
    
    if (hasVoted) {
      return voteType === 'UPVOTE' ? 'Klik untuk menghapus upvote' : 'Klik untuk menghapus downvote'
    } else if (userVotes[usulanId]) {
      return voteType === 'UPVOTE' ? 'Ubah ke upvote' : 'Ubah ke downvote'
    }
    
    return voteType === 'UPVOTE' ? 'Berikan upvote' : 'Berikan downvote'
  }
  
  // Check if user has permission to edit a usulan
  const hasEditPermission = (usulan: Usulan) => {
    if (!isAuthenticated || !user) {
      return false
    }
    
    // Admin can edit
    const isAdmin = user.role?.roleName === 'ADMIN'
    
    // Proposer can edit
    const isProposer = usulan.emailPengusul && user.email === usulan.emailPengusul
    
    return isAdmin || isProposer
  }

  // Handle moving usulan to pelaksanaan
  const handleMoveToPelaksanaan = async (usulanId: number) => {
    if (!user || user.role?.roleName !== 'ADMIN') {
      toast.error('Hanya admin yang dapat memindahkan usulan ke pelaksanaan')
      return
    }

    if (!confirm('Apakah Anda yakin ingin memindahkan usulan ini ke tahap pelaksanaan?')) {
      return
    }

    try {
      // Set loading state for this specific usulan
      setVotingStates(prev => ({ ...prev, [usulanId]: true }))

      const response = await fetch(getApiUrl(`/api/usulan/${usulanId}/move-to-pelaksanaan`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to move usulan to pelaksanaan')
      }      toast.success('Usulan berhasil dipindahkan ke tahap pelaksanaan!', {
        dismissible: true,
        duration: 5000
      })

      // Reload the usulan list to reflect the changes
      await fetchUsulan(filters)
    } catch (error) {
      console.error('Error moving usulan to pelaksanaan:', error)
      const errorMessage = error instanceof Error ? error.message : 'Gagal memindahkan usulan ke pelaksanaan'
      toast.error(errorMessage, {
        dismissible: true,
        duration: 5000
      })
    } finally {
      // Remove loading state
      setVotingStates(prev => ({ ...prev, [usulanId]: false }))
    }
  }

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
    if (usulanList.length > 0 && userInfo.email) {
      loadUserVotes()
    }
  }, [usulanList, userInfo.email])

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-2 xs:px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center py-4 gap-2">
              <div className="flex items-center space-x-2 xs:space-x-4">
                <Link href="/" className="text-xl xs:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  <span className="hidden xs:inline">Alumni Network</span>
                  <span className="xs:hidden">Alumni</span>
                </Link>
                <Badge variant="outline" className="text-xs xs:text-sm">
                  <span className="hidden xs:inline">Usulan Kegiatan</span>
                  <span className="xs:hidden">Usulan</span>
                </Badge>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <ThemeToggle />
                <Link href="/usulan/create">
                  <Button className="flex items-center space-x-1 xs:space-x-2 px-2 xs:px-4">
                    <Plus className="h-4 w-4" />
                    <span className="hidden xs:inline">Buat Usulan</span>
                    <span className="xs:hidden text-xs">Buat</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>        <div className="max-w-7xl mx-auto px-2 xs:px-4 sm:px-6 lg:px-8 py-8">

          {/* Filters */}
          <UsulanFilters
            onFilterChange={handleFilterChange}
            currentFilters={filters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            pageSize={filters.size}
            onPageSizeChange={(size) => handleFilterChange({ ...filters, size, page: 0 })}
            totalItems={totalItems}
            currentItems={usulanList.length}
          />        {/* Usulan Grid/List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-gray-300 rounded mb-4"></div>
                  <div className="h-3 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : usulanList.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">Belum ada usulan</div>
            <Link href="/usulan/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Buat Usulan Pertama
              </Button>
            </Link>
          </div>        ) : viewMode === "list" ? (
          /* List View */
          <div className="space-y-3">
            {usulanList.map((usulan) => (
              <Card 
                key={usulan.id} 
                className="group hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500"
                onClick={() => window.location.href = `/usulan/${usulan.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Image */}
                    <div className="flex-shrink-0">
                      {usulan.gambarUrl ? (
                        <div className="relative h-16 w-16 rounded-lg overflow-hidden">
                          <Image
                            src={`${config.baseUrl}${usulan.gambarUrl}`}
                            alt={usulan.judul}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                          <FileText className="h-8 w-8 text-blue-500" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg leading-tight text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                            {usulan.judul}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <User className="h-4 w-4 inline mr-1" />
                            {usulan.namaPengusul}
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full">
                            <Timer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{usulan.sisaHari} hari</span>
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-blue-500 flex-shrink-0" />
                          <span className="truncate text-xs xs:text-sm">
                            {formatDate(usulan.tanggalMulai)} - {formatDate(usulan.tanggalSelesai)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ArrowUp className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span className="truncate text-xs xs:text-sm">{usulan.jumlahUpvote} upvotes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ArrowDown className="h-3 w-3 text-red-500 flex-shrink-0" />
                          <span className="truncate text-xs xs:text-sm">{usulan.jumlahDownvote} downvotes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-purple-500 flex-shrink-0" />
                          <span className="truncate text-xs xs:text-sm">Score: {usulan.score}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                        {usulan.rencanaKegiatan}
                      </p>

                      {/* Voting and Action Buttons */}
                      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between pt-2 gap-2">
                        {!isAuthenticated ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <AlertCircle className="h-4 w-4" />
                            <span>Silakan login untuk memberikan vote</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 xs:space-x-4" onClick={(e) => e.stopPropagation()}>
                            {/* Upvote */}
                            <button
                              onClick={() => handleVote(usulan.id, 'UPVOTE')}
                              disabled={votingStates[usulan.id]}
                              title={getVoteTooltip(usulan.id, 'UPVOTE')}
                              className={`flex items-center space-x-1 px-2 py-1 rounded-lg border transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${getVoteButtonStyle(usulan.id, 'UPVOTE')}`}
                            >
                              <ArrowUp className="h-3 w-3" />
                              <span className="font-medium text-xs">{usulan.jumlahUpvote}</span>
                            </button>
                            
                            {/* Downvote */}
                            <button
                              onClick={() => handleVote(usulan.id, 'DOWNVOTE')}
                              disabled={votingStates[usulan.id]}
                              title={getVoteTooltip(usulan.id, 'DOWNVOTE')}
                              className={`flex items-center space-x-1 px-2 py-1 rounded-lg border transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${getVoteButtonStyle(usulan.id, 'DOWNVOTE')}`}
                            >
                              <ArrowDown className="h-3 w-3" />
                              <span className="font-medium text-xs">{usulan.jumlahDownvote}</span>
                            </button>
                            
                            {/* Score */}
                            <div className="flex items-center space-x-1 bg-blue-50 dark:bg-blue-900 px-2 py-1 rounded-lg text-blue-600 dark:text-blue-400">
                              <TrendingUp className="h-3 w-3" />
                              <span className="font-bold text-xs">{usulan.score}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 w-full xs:w-auto" onClick={(e) => e.stopPropagation()}>
                          {/* Edit button - only visible to admin or proposer */}
                          {hasEditPermission(usulan) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.location.href = `/usulan/edit/${usulan.id}`}
                              className="h-8 px-2 xs:px-3 text-xs w-full xs:w-auto"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              <span className="hidden xs:inline">Edit</span>
                              <span className="xs:hidden">Edit</span>
                            </Button>
                          )}
                          
                          {/* Move to Pelaksanaan button - only visible to admin */}
                          {isAuthenticated && user?.role?.roleName === 'ADMIN' && (
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => handleMoveToPelaksanaan(usulan.id)} 
                              disabled={votingStates[usulan.id]}
                              className="h-8 px-2 xs:px-3 text-xs w-full xs:w-auto"
                            >
                              {votingStates[usulan.id] ? (
                                <div className="h-3 w-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-1"></div>
                              ) : (
                                <Play className="h-3 w-3 mr-1 text-green-600" />
                              )}
                              <span className="hidden xs:inline">Laksanakan</span>
                              <span className="xs:hidden">Exec</span>
                            </Button>
                          )}                            <Button
                            variant="default"
                            size="sm"
                            onClick={() => window.location.href = `/usulan/${usulan.id}`}
                            className="h-8 px-2 xs:px-3 text-xs w-full xs:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            <span className="hidden xs:inline">View Detail</span>
                            <span className="xs:hidden">Detail</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {usulanList.map((usulan) => (
              <Card key={usulan.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 overflow-hidden h-full flex flex-col">
                <Link href={`/usulan/${usulan.id}`} className="flex-1 flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-3">
                      <CardTitle className="text-xl line-clamp-2 text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {usulan.judul}
                      </CardTitle>
                      <div className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full">
                        <Timer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{usulan.sisaHari} hari</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{usulan.namaPengusul}</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 flex-1 flex flex-col">
                    {usulan.gambarUrl && (
                      <div className="mb-4 relative h-40 rounded-xl overflow-hidden shadow-md">
                        <Image
                          src={`${config.baseUrl}${usulan.gambarUrl}`}
                          alt={usulan.judul}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                    )}
                    
                    <div className="mb-4 flex-1">
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
                        {usulan.rencanaKegiatan}
                      </p>
                    </div>
                    
                    <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between text-sm text-gray-500 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg gap-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="text-xs">
                          <span className="hidden xs:inline">{formatDate(usulan.tanggalMulai)} - {formatDate(usulan.tanggalSelesai)}</span>
                          <span className="xs:hidden">{new Date(usulan.tanggalMulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Link>
                
                {/* Voting Section */}
                {isAuthenticated && (
                  <CardContent className="pt-0 pb-2">
                    <div className="flex items-center justify-center space-x-2" onClick={(e) => e.stopPropagation()}>
                      {/* Upvote */}
                      <button
                        onClick={() => handleVote(usulan.id, 'UPVOTE')}
                        disabled={votingStates[usulan.id]}
                        title={getVoteTooltip(usulan.id, 'UPVOTE')}
                        className={`flex items-center space-x-1 px-3 py-2 rounded-lg border transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${getVoteButtonStyle(usulan.id, 'UPVOTE')}`}
                      >
                        <ArrowUp className="h-4 w-4" />
                        <span className="font-medium text-sm">{usulan.jumlahUpvote}</span>
                      </button>
                      
                      {/* Score */}
                      <div className="flex items-center space-x-1 bg-blue-50 dark:bg-blue-900 px-3 py-2 rounded-lg text-blue-600 dark:text-blue-400">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-bold text-sm">{usulan.score}</span>
                      </div>
                      
                      {/* Downvote */}
                      <button
                        onClick={() => handleVote(usulan.id, 'DOWNVOTE')}
                        disabled={votingStates[usulan.id]}
                        title={getVoteTooltip(usulan.id, 'DOWNVOTE')}
                        className={`flex items-center space-x-1 px-3 py-2 rounded-lg border transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${getVoteButtonStyle(usulan.id, 'DOWNVOTE')}`}
                      >
                        <ArrowDown className="h-4 w-4" />
                        <span className="font-medium text-sm">{usulan.jumlahDownvote}</span>
                      </button>
                    </div>
                  </CardContent>
                )}
                
                {/* Action buttons */}
                <CardContent className="pt-2 pb-4">
                  <div className="flex items-center gap-2 w-full">
                    {/* Edit button - only visible to admin or proposer */}
                    {hasEditPermission(usulan) && (
                      <Link href={`/usulan/edit/${usulan.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                    )}
                    
                    {/* Move to Pelaksanaan button - only visible to admin */}
                    {isAuthenticated && user?.role?.roleName === 'ADMIN' && (
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleMoveToPelaksanaan(usulan.id)} 
                        disabled={votingStates[usulan.id]}
                        className="flex-1"
                      >
                        {votingStates[usulan.id] ? (
                          <div className="h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : (
                          <Play className="h-4 w-4 mr-2 text-green-600" />
                        )}
                        Laksanakan
                      </Button>
                    )}
                      <Link href={`/usulan/${usulan.id}`} className="flex-1">
                      <Button variant="default" size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Eye className="h-4 w-4 mr-2" />
                        Detail
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}{/* Pagination */}
        <SimplePagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={handlePageChange}
          loading={loading}
        />
        </div>
      </div>
    </ProtectedRoute>
  )
}
