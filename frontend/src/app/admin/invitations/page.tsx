'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserPlus, Users, Clock, CheckCircle, XCircle, Phone, Eye } from 'lucide-react'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import { SortableHeader } from "@/components/ui/sortable-header"
import { ServerPagination } from "@/components/ServerPagination"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import AdminFilters from "@/components/AdminFilters"
import { useToast } from "@/hooks/use-toast"
import InvitationForm from '@/components/InvitationForm'

interface Invitation {
  id: number
  namaLengkap: string
  nomorHp: string
  status: 'PENDING' | 'SENT' | 'USED' | 'EXPIRED' | 'FAILED'
  sentAt: string
  expiresAt: string
  usedAt?: string
  invitationToken: string
}

interface InvitationStats {
  total: number
  pending: number
  sent: number
  used: number
  expired: number
  failed: number
}

export default function InvitationsAdminPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [stats, setStats] = useState<InvitationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [sortBy, setSortBy] = useState('sentAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  
  const { toast } = useToast()

  const handleSort = (newSortBy: string, newSortDir: 'asc' | 'desc') => {
    setSortBy(newSortBy)
    setSortDir(newSortDir)
    setCurrentPage(0) // Reset to first page when sorting
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(0) // Reset to first page when changing page size
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(0) // Reset to first page when searching
  }

  const handleViewDetail = (invitation: Invitation) => {
    // For now, we'll just show a toast with invitation details
    toast({
      title: `Invitation Details: ${invitation.namaLengkap}`,
      description: `Phone: ${invitation.nomorHp} | Status: ${invitation.status}`,
    })
  }
  const fetchInvitations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('size', pageSize.toString())
      params.append('sortBy', sortBy)
      params.append('sortDirection', sortDir)
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'ALL') params.append('status', statusFilter)
      
      const response = await fetch(`/api/invitations?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setInvitations(data.content || data)
        setTotalPages(data.totalPages || 0)
        setTotalElements(data.totalElements || 0)
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error)
      toast({
        title: "Error",
        description: "Gagal memuat data undangan",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/invitations/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch invitation stats:', error)
    }
  }
  useEffect(() => {
    fetchInvitations()
  }, [currentPage, pageSize, searchTerm, sortBy, sortDir, statusFilter])
  useEffect(() => {
    fetchStats()
  }, [])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { variant: 'secondary' as const, label: 'Menunggu' },
      SENT: { variant: 'default' as const, label: 'Terkirim' },
      USED: { variant: 'default' as const, label: 'Digunakan' },
      EXPIRED: { variant: 'destructive' as const, label: 'Kedaluwarsa' },
      FAILED: { variant: 'destructive' as const, label: 'Gagal' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  const resendInvitation = async (invitationId: number) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/resend`, {
        method: 'POST'
      })
      if (response.ok) {
        toast({
          title: "Sukses",
          description: "Undangan berhasil dikirim ulang",
        })
        fetchInvitations()
        fetchStats()
      } else {
        toast({
          title: "Error", 
          description: "Gagal mengirim ulang undangan",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to resend invitation:', error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengirim ulang undangan",
        variant: "destructive",
      })
    }
  }
  return (
    <div className="min-h-screen bg-background">
      <AdminPageHeader
        title="Manajemen Undangan"
        description="Kelola undangan member untuk mendaftar"
        icon={UserPlus}
        primaryAction={{
          label: "Undang Member",
          onClick: () => {}, // Will be handled by Dialog trigger
          icon: UserPlus
        }}        stats={stats ? [
          {
            label: "Total Undangan",
            value: stats.total,
            variant: "secondary"
          },
          {
            label: "Terkirim", 
            value: stats.sent,
            variant: "default"
          },
          {
            label: "Digunakan",
            value: stats.used,
            variant: "default"
          }
        ] : []}
      />

      <div className="container mx-auto p-6 space-y-6">
        {/* Filters */}
        <AdminFilters
          searchValue={searchTerm}
          onSearchChange={handleSearchChange}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          searchPlaceholder="Cari berdasarkan nama atau nomor HP..."
          totalItems={totalElements}
          currentItems={invitations.length}
          filters={[{
            label: "Status",
            value: statusFilter,
            options: [
              { value: "ALL", label: "Semua Status" },
              { value: "PENDING", label: "Menunggu" },
              { value: "SENT", label: "Terkirim" },
              { value: "USED", label: "Digunakan" },
              { value: "EXPIRED", label: "Kedaluwarsa" },
              { value: "FAILED", label: "Gagal" }
            ],
            onChange: (value) => {
              setStatusFilter(value)
              setCurrentPage(0)
            }
          }]}
        />

        {/* Statistics Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Undangan</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Menunggu</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Terkirim</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.sent}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Digunakan</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.used}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Kedaluwarsa</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.expired}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gagal</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.failed}</div>
              </CardContent>
            </Card>
          </div>        )}

        {/* Invitations Table */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all">
          <CardHeader>
            <CardTitle>Daftar Undangan</CardTitle>
            <CardDescription>
              Kelola dan pantau status undangan member
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortableHeader
                        sortKey="namaLengkap"
                        currentSort={{ sortBy, sortDir }}
                        onSort={handleSort}
                      >
                        Nama Member
                      </SortableHeader>
                    </TableHead>
                    <TableHead>Nomor HP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <SortableHeader
                        sortKey="sentAt"
                        currentSort={{ sortBy, sortDir }}
                        onSort={handleSort}
                      >
                        Dikirim
                      </SortableHeader>
                    </TableHead>
                    <TableHead>Kedaluwarsa</TableHead>
                    <TableHead>Digunakan</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <LoadingSpinner />
                      </TableCell>
                    </TableRow>
                  ) : invitations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <UserPlus className="h-8 w-8 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {searchTerm ? 'Tidak ada undangan yang ditemukan' : 'Belum ada data undangan'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    invitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell className="font-medium">
                          {invitation.namaLengkap}
                        </TableCell>
                        <TableCell>{invitation.nomorHp}</TableCell>
                        <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                        <TableCell>{formatDate(invitation.sentAt)}</TableCell>
                        <TableCell>{formatDate(invitation.expiresAt)}</TableCell>
                        <TableCell>
                          {invitation.usedAt ? formatDate(invitation.usedAt) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetail(invitation)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {invitation.status === 'FAILED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resendInvitation(invitation.id)}
                                title="Resend Invitation"
                              >
                                Kirim Ulang
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <ServerPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalElements={totalElements}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Invitation Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg">
            <UserPlus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Undang Member Baru</DialogTitle>
            <DialogDescription>
              Kirim undangan kepada member untuk mendaftar di sistem
            </DialogDescription>
          </DialogHeader>
          <InvitationForm 
            onSuccess={() => {
              fetchInvitations()
              fetchStats()
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
