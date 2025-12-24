"use client";

import { useState, useEffect } from "react";
import { invitationAPI, Invitation, InvitationFilters, PagedInvitationResponse } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Mail, 
  RotateCcw, 
  X, 
  Calendar,
  Phone,
  Clock,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  History,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users
} from "lucide-react";
import { AdminPageHeader } from "@/components/AdminPageHeader";

const InvitationHistoryPage = () => {
  const [invitationData, setInvitationData] = useState<PagedInvitationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>({});
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  // Pagination and filtering states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<InvitationFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  
  // Tab and sorting states
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadInvitations();
    loadStatistics();
  }, [currentPage, pageSize, filters, activeTab, sortBy, sortDirection, searchTerm]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      
      // Prepare filters based on active tab
      const tabFilters: InvitationFilters = { ...filters };
      
      if (activeTab === "sent") {
        tabFilters.status = "SENT";
      } else if (activeTab === "cancelled") {
        tabFilters.status = "CANCELLED";
      }
      
      // Add search term
      if (searchTerm) {
        tabFilters.nama = searchTerm;
      }
      
      const data = await invitationAPI.getInvitationHistoryPaginated(currentPage, pageSize, tabFilters, sortBy, sortDirection);
      setInvitationData(data);
    } catch (error) {
      console.error("Error loading invitations:", error);
      toast.error("Gagal memuat data undangan");
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await invitationAPI.getInvitationStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const handleResendInvitation = async (id: number) => {
    try {
      setActionLoading(id);
      await invitationAPI.resendInvitation(id);
      toast.success("Undangan berhasil dikirim ulang");
      loadInvitations();
    } catch (error: any) {
      console.error("Error resending invitation:", error);
      toast.error(error.message || "Gagal mengirim ulang undangan");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelInvitation = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan undangan ini?")) {
      return;
    }

    try {
      setActionLoading(id);
      await invitationAPI.cancelInvitation(id);
      toast.success("Undangan berhasil dibatalkan");
      loadInvitations();
    } catch (error: any) {
      console.error("Error cancelling invitation:", error);
      toast.error(error.message || "Gagal membatalkan undangan");
    } finally {
      setActionLoading(null);
    }
  };

  // Filter and pagination handlers
  const handleFilterChange = (key: keyof InvitationFilters, value: string) => {
    const newFilters = { ...filters };
    if (value) {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    setFilters(newFilters);
    setCurrentPage(0); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentPage(0);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0); // Reset to first page when changing page size
  };

  // New handler functions
  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue);
    setCurrentPage(0); // Reset to first page when changing tab
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
    setCurrentPage(0); // Reset to first page when sorting
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0); // Reset to first page when searching
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { 
        variant: "outline" as const, 
        className: "border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-600", 
        label: "Menunggu" 
      },
      SENT: { 
        variant: "outline" as const, 
        className: "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-600", 
        label: "Terkirim" 
      },
      USED: { 
        variant: "outline" as const, 
        className: "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-600", 
        label: "Digunakan" 
      },
      EXPIRED: { 
        variant: "outline" as const, 
        className: "border-gray-500 bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-600", 
        label: "Kadaluarsa" 
      },
      FAILED: { 
        variant: "outline" as const, 
        className: "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-600", 
        label: "Gagal" 
      },
      CANCELLED: { 
        variant: "outline" as const, 
        className: "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-600", 
        label: "Dibatalkan" 
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canResend = (invitation: Invitation) => {
    return !['USED', 'CANCELLED'].includes(invitation.status);
  };

  const canCancel = (invitation: Invitation) => {
    return !['USED', 'CANCELLED'].includes(invitation.status);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Memuat data undangan...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminPageHeader
        title="Histori Undangan"
        description="Kelola undangan member yang telah dikirim"
        icon={History}
        stats={[
          {
            label: "Total Undangan",
            value: invitationData?.totalElements || 0,
            variant: "secondary"
          },
          {
            label: "Pending",
            value: statistics.pending || 0,
            variant: "destructive"
          },
          {
            label: "Digunakan",
            value: statistics.used || 0,
            variant: "default"
          },
          {
            label: "Expired",
            value: statistics.expired || 0,
            variant: "outline"
          }
        ]}
      />

      <div className="container mx-auto p-6 space-y-6">
        {/* Search and Filter */}
        <Card className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 border-slate-200 dark:border-slate-600 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-slate-900 dark:text-slate-100">
              <span className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Pencarian & Filter
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="border-slate-300 dark:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? "Sembunyikan" : "Tampilkan"} Filter
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Cari nama, nomor HP..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="max-w-sm bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500"
                />
              </div>
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="phone-filter" className="text-slate-700 dark:text-slate-300">No. HP</Label>
                    <Input
                      id="phone-filter"
                      placeholder="Cari nomor HP..."
                      value={filters.phone || ""}
                      onChange={(e) => handleFilterChange("phone", e.target.value)}
                      className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      onClick={clearFilters}
                      className="border-slate-300 dark:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600"
                    >
                      Hapus Filter
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Invitation Status */}
        <Card className="bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 border-slate-200 dark:border-slate-600 shadow-lg">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Semua
                </TabsTrigger>
                <TabsTrigger value="sent" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Terkirim
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Dibatalkan
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Daftar Undangan
                  </h3>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="page-size" className="text-slate-700 dark:text-slate-300">Item per halaman:</Label>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => handlePageSizeChange(parseInt(value))}
                    >
                      <SelectTrigger className="w-20 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-100 dark:bg-slate-700">
                        <TableHead 
                          className="text-slate-900 dark:text-slate-100 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600" 
                          onClick={() => handleSort("namaLengkap")}
                        >
                          <div className="flex items-center gap-2">
                            Nama {getSortIcon("namaLengkap")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-slate-900 dark:text-slate-100 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600" 
                          onClick={() => handleSort("nomorHp")}
                        >
                          <div className="flex items-center gap-2">
                            No. HP {getSortIcon("nomorHp")}
                          </div>
                        </TableHead>
                        <TableHead className="text-slate-900 dark:text-slate-100">Status</TableHead>
                        <TableHead className="text-slate-900 dark:text-slate-100">Biografi</TableHead>
                        <TableHead 
                          className="text-slate-900 dark:text-slate-100 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600" 
                          onClick={() => handleSort("sentAt")}
                        >
                          <div className="flex items-center gap-2">
                            Dikirim {getSortIcon("sentAt")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-slate-900 dark:text-slate-100 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600" 
                          onClick={() => handleSort("expiresAt")}
                        >
                          <div className="flex items-center gap-2">
                            Expired {getSortIcon("expiresAt")}
                          </div>
                        </TableHead>
                        <TableHead className="text-slate-900 dark:text-slate-100">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitationData?.content.map((invitation: Invitation) => (
                        <TableRow key={invitation.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                            {invitation.namaLengkap}
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {invitation.nomorHp}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(invitation.status)}
                          </TableCell>
                          <TableCell>
                            {invitation.hasBiografi ? (
                              <Badge variant="outline" className="border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Lengkap
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-600">
                                <Clock className="h-3 w-3 mr-1" />
                                Belum
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {invitation.sentAt 
                                ? formatDate(invitation.sentAt)
                                : "-"
                              }
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {formatDate(invitation.expiresAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {canResend(invitation) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResendInvitation(invitation.id)}
                                  disabled={actionLoading === invitation.id}
                                  className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                >
                                  {actionLoading === invitation.id ? (
                                    <RotateCcw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Mail className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              {canCancel(invitation) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelInvitation(invitation.id)}
                                  disabled={actionLoading === invitation.id}
                                  className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {(!invitationData?.content || invitationData.content.length === 0) && (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      Tidak ada data undangan ditemukan
                    </div>
                  )}
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Pagination */}
        {invitationData && invitationData.totalPages > 1 && (
          <Card className="bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 border-slate-200 dark:border-slate-600 shadow-lg">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Menampilkan {(currentPage * pageSize) + 1} - {Math.min((currentPage + 1) * pageSize, invitationData.totalElements)} dari {invitationData.totalElements} undangan
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="border-slate-300 dark:border-slate-500"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
                  </Button>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Halaman {currentPage + 1} dari {invitationData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= invitationData.totalPages - 1}
                    className="border-slate-300 dark:border-slate-500"
                  >
                    Selanjutnya
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default InvitationHistoryPage;
