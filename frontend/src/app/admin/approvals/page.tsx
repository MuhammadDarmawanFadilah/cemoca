"use client";

import { useState, useEffect } from "react";
import { userApprovalAPI, User } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  UserCheck, 
  UserX, 
  Users, 
  Clock,
  Phone,
  Mail,
  User as UserIcon,
  Calendar,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  UserCheck2,
  UserX2,
  MoreHorizontal
} from "lucide-react";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";

interface PagedUserResponse {
  content: User[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

const UserApprovalPage = () => {
  const [userData, setUserData] = useState<PagedUserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>({});
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  
  // Bulk selection states
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkRejectDialogOpen, setBulkRejectDialogOpen] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  
  // Pagination and filtering states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
    
  // Tab and sorting states
  const [activeTab, setActiveTab] = useState("waiting");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  const { toast: toastHook } = useToast();

  const handleViewDetail = (user: User) => {
    // Create detailed info dialog
    const detailInfo = [
      `ID: ${user.id}`,
      `Username: ${user.username}`,
      `Email: ${user.email}`,
      `Nama Lengkap: ${user.fullName}`,
      `No. HP: ${user.phoneNumber || 'N/A'}`,
      `Status: ${user.status}`,
      `Tanggal Daftar: ${formatDate(user.createdAt)}`,
      `Terakhir Update: ${formatDate(user.updatedAt)}`
    ].join('\n');

    toastHook({
      title: `Detail User: ${user.fullName}`,
      description: detailInfo,
    });
  };

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked && userData?.content) {
      setSelectedUsers(new Set(userData.content.map(user => user.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId: number, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleBulkApprove = async () => {
    if (selectedUsers.size === 0) return;
    
    if (!confirm(`Apakah Anda yakin ingin menyetujui ${selectedUsers.size} pengguna sekaligus?`)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedUsers).map(userId => 
        userApprovalAPI.approveUser(userId)
      );
      await Promise.all(promises);
      
      toast.success(`${selectedUsers.size} pengguna berhasil disetujui`);
      setSelectedUsers(new Set());
      loadUsers();
      loadStatistics();
    } catch (error: any) {
      console.error("Error bulk approving users:", error);
      toast.error(error.message || "Gagal menyetujui beberapa pengguna");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedUsers.size === 0) return;
    
    setBulkRejectDialogOpen(true);
  };

  const executeBulkReject = async () => {
    if (selectedUsers.size === 0) return;

    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedUsers).map(userId => 
        userApprovalAPI.rejectUser(userId, bulkRejectReason)
      );
      await Promise.all(promises);
      
      toast.success(`${selectedUsers.size} pengguna berhasil ditolak`);
      setSelectedUsers(new Set());
      setBulkRejectDialogOpen(false);
      setBulkRejectReason("");
      loadUsers();
      loadStatistics();
    } catch (error: any) {
      console.error("Error bulk rejecting users:", error);
      toast.error(error.message || "Gagal menolak beberapa pengguna");
    } finally {
      setBulkActionLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadStatistics();
  }, [currentPage, pageSize, searchTerm, activeTab, sortBy, sortDirection, filterRole, filterDateFrom, filterDateTo]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Prepare parameters based on active tab
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('size', pageSize.toString());
      params.append('sortBy', sortBy);
      params.append('sortDirection', sortDirection);
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      let data;
      switch (activeTab) {
        case "waiting":
          data = await userApprovalAPI.getUsersWaitingApprovalPaginated(params.toString());
          break;
        case "approved":
          data = await userApprovalAPI.getApprovedUsersPaginated(params.toString());
          break;
        case "rejected":
          data = await userApprovalAPI.getRejectedUsersPaginated(params.toString());
          break;
        case "all":
        default:
          data = await userApprovalAPI.getAllUsersPaginated(params.toString());
          break;
      }
      
      setUserData(data);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Gagal memuat data pengguna");
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await userApprovalAPI.getApprovalStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const handleApproveUser = async (userId: number) => {
    if (!confirm("Apakah Anda yakin ingin menyetujui pendaftaran pengguna ini?")) {
      return;
    }

    try {
      setActionLoading(userId);
      await userApprovalAPI.approveUser(userId);
      toast.success("Pengguna berhasil disetujui");
      loadUsers();
      loadStatistics();
    } catch (error: any) {
      console.error("Error approving user:", error);
      toast.error(error.message || "Gagal menyetujui pengguna");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectUser = async () => {
    if (!selectedUserId) return;

    try {
      setActionLoading(selectedUserId);
      await userApprovalAPI.rejectUser(selectedUserId, rejectReason);
      toast.success("Pengguna berhasil ditolak");
      loadUsers();
      loadStatistics();
      setRejectDialogOpen(false);
      setSelectedUserId(null);
      setRejectReason("");
    } catch (error: any) {
      console.error("Error rejecting user:", error);
      toast.error(error.message || "Gagal menolak pengguna");
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectDialog = (userId: number) => {
    setSelectedUserId(userId);
    setRejectDialogOpen(true);
  };

  // Handler functions
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

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0); // Reset to first page when changing page size
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      WAITING_APPROVAL: { 
        variant: "outline" as const, 
        className: "border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-600", 
        label: "Menunggu" 
      },
      ACTIVE: { 
        variant: "outline" as const, 
        className: "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-600", 
        label: "Disetujui" 
      },
      REJECTED: { 
        variant: "outline" as const, 
        className: "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-600", 
        label: "Ditolak" 
      },
      INACTIVE: { 
        variant: "outline" as const, 
        className: "border-gray-500 bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-600", 
        label: "Nonaktif" 
      },
      SUSPENDED: { 
        variant: "outline" as const, 
        className: "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-600", 
        label: "Ditangguhkan" 
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.WAITING_APPROVAL;
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

  const canApprove = (user: User) => {
    return user.status === 'WAITING_APPROVAL';
  };

  const canReject = (user: User) => {
    return user.status === 'WAITING_APPROVAL';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Memuat data pengguna...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminPageHeader
        title="Persetujuan Pengguna"
        description="Kelola persetujuan pendaftaran pengguna baru"
        icon={UserCheck}
        stats={[
          {
            label: "Menunggu Persetujuan",
            value: statistics.pending || 0,
            variant: "destructive"
          },
          {
            label: "Disetujui",
            value: statistics.approved || 0,
            variant: "default"
          },
          {
            label: "Ditolak",
            value: statistics.rejected || 0,
            variant: "secondary"
          },
          {
            label: "Total Pengguna",
            value: statistics.total || 0,
            variant: "outline"
          }
        ]}
      />

      <div className="container mx-auto p-6 space-y-6">
        {/* Search and Filter */}
        <Card className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 border-slate-200 dark:border-slate-600 shadow-lg">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Main search bar */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Cari nama, email, username, nomor HP..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="border-slate-300 dark:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setFilterRole("all");
                      setFilterDateFrom("");
                      setFilterDateTo("");
                      setCurrentPage(0);
                    }}
                    className="border-slate-300 dark:border-slate-500"
                  >
                    Reset
                  </Button>
                </div>
              </div>
              
              {/* Advanced filters */}
              {showFilters && (
                <div className="border-t border-slate-200 dark:border-slate-600 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="filter-role" className="text-slate-700 dark:text-slate-300">Role</Label>
                      <Select value={filterRole} onValueChange={setFilterRole}>
                        <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500">
                          <SelectValue placeholder="Pilih role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Role</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="MODERATOR">Moderator</SelectItem>
                          <SelectItem value="MEMBER">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="filter-date-from" className="text-slate-700 dark:text-slate-300">Tanggal Dari</Label>
                      <Input
                        id="filter-date-from"
                        type="date"
                        value={filterDateFrom}
                        onChange={(e) => setFilterDateFrom(e.target.value)}
                        className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="filter-date-to" className="text-slate-700 dark:text-slate-300">Tanggal Sampai</Label>
                      <Input
                        id="filter-date-to"
                        type="date"
                        value={filterDateTo}
                        onChange={(e) => setFilterDateTo(e.target.value)}
                        className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for User Status */}
        <Card className="bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 border-slate-200 dark:border-slate-600 shadow-lg">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="waiting" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Menunggu Persetujuan
                </TabsTrigger>
                <TabsTrigger value="approved" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Disetujui
                </TabsTrigger>
                <TabsTrigger value="rejected" className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Ditolak
                </TabsTrigger>
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Semua
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                {/* Bulk Actions Bar */}
                {selectedUsers.size > 0 && (
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          {selectedUsers.size} pengguna dipilih
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUsers(new Set())}
                          className="text-blue-700 border-blue-300 hover:bg-blue-100"
                        >
                          Batal Pilih
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        {activeTab === "waiting" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleBulkApprove}
                              disabled={bulkActionLoading}
                              className="border-green-300 text-green-700 hover:bg-green-50"
                            >
                              {bulkActionLoading ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <UserCheck2 className="h-4 w-4" />
                              )}
                              <span className="ml-2">Setujui Semua</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleBulkReject}
                              disabled={bulkActionLoading}
                              className="border-red-300 text-red-700 hover:bg-red-50"
                            >
                              <UserX2 className="h-4 w-4 mr-2" />
                              Tolak Semua
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Daftar Pengguna
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
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-100 dark:bg-slate-700">
                        {activeTab === "waiting" && (
                          <TableHead className="w-10">
                            <Checkbox
                              checked={
                                userData?.content && userData.content.length > 0 && 
                                selectedUsers.size === userData.content.length
                              }
                              onCheckedChange={handleSelectAll}
                              aria-label="Select all users"
                            />
                          </TableHead>
                        )}
                        <TableHead 
                          className="text-slate-900 dark:text-slate-100 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600" 
                          onClick={() => handleSort("fullName")}
                        >
                          <div className="flex items-center gap-2">
                            Nama Lengkap {getSortIcon("fullName")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-slate-900 dark:text-slate-100 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600" 
                          onClick={() => handleSort("email")}
                        >
                          <div className="flex items-center gap-2">
                            Email {getSortIcon("email")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-slate-900 dark:text-slate-100 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600" 
                          onClick={() => handleSort("phoneNumber")}
                        >
                          <div className="flex items-center gap-2">
                            No. HP {getSortIcon("phoneNumber")}
                          </div>
                        </TableHead>
                        <TableHead className="text-slate-900 dark:text-slate-100">Status</TableHead>
                        <TableHead 
                          className="text-slate-900 dark:text-slate-100 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600" 
                          onClick={() => handleSort("createdAt")}
                        >
                          <div className="flex items-center gap-2">
                            Tanggal Daftar {getSortIcon("createdAt")}
                          </div>
                        </TableHead>
                        <TableHead className="text-slate-900 dark:text-slate-100">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userData?.content.map((user: User) => (
                        <TableRow key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                          {activeTab === "waiting" && (
                            <TableCell>
                              <Checkbox
                                checked={selectedUsers.has(user.id)}
                                onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                                aria-label={`Select user ${user.fullName}`}
                              />
                            </TableCell>
                          )}
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4" />
                              {user.fullName}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {user.phoneNumber || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(user.status)}
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {formatDate(user.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetail(user)}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canApprove(user) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApproveUser(user.id)}
                                  disabled={actionLoading === user.id}
                                  className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20"
                                  title="Approve User"
                                >
                                  {actionLoading === user.id ? (
                                    <LoadingSpinner size="sm" />
                                  ) : (
                                    <UserCheck className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              {canReject(user) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openRejectDialog(user.id)}
                                  disabled={actionLoading === user.id}
                                  className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                                  title="Reject User"
                                >
                                  {actionLoading === user.id ? (
                                    <LoadingSpinner size="sm" />
                                  ) : (
                                    <UserX className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {(!userData?.content || userData.content.length === 0) && (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      Tidak ada data pengguna ditemukan
                    </div>
                  )}
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Pagination */}
        {userData && userData.totalPages > 1 && (
          <Card className="bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 border-slate-200 dark:border-slate-600 shadow-lg">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Menampilkan {(currentPage * pageSize) + 1} - {Math.min((currentPage + 1) * pageSize, userData.totalElements)} dari {userData.totalElements} pengguna
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
                    Halaman {currentPage + 1} dari {userData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= userData.totalPages - 1}
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

        {/* Bulk Reject Dialog */}
        <Dialog open={bulkRejectDialogOpen} onOpenChange={setBulkRejectDialogOpen}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-slate-100">
                Tolak {selectedUsers.size} Pendaftaran
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400">
                Berikan alasan penolakan untuk {selectedUsers.size} pengguna yang dipilih.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bulk-reject-reason" className="text-slate-700 dark:text-slate-300">
                  Alasan Penolakan
                </Label>
                <Textarea
                  id="bulk-reject-reason"
                  placeholder="Masukkan alasan penolakan..."
                  value={bulkRejectReason}
                  onChange={(e) => setBulkRejectReason(e.target.value)}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setBulkRejectDialogOpen(false);
                  setBulkRejectReason("");
                }}
                className="border-slate-300 dark:border-slate-500"
              >
                Batal
              </Button>
              <Button 
                onClick={executeBulkReject}
                disabled={!bulkRejectReason.trim() || bulkActionLoading}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
              >
                {bulkActionLoading ? (
                  <LoadingSpinner size="sm" />
                ) : null}
                Tolak {selectedUsers.size} Pendaftaran
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-slate-100">Tolak Pendaftaran</DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400">
                Berikan alasan penolakan untuk pengguna ini.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reject-reason" className="text-slate-700 dark:text-slate-300">Alasan Penolakan</Label>
                <Textarea
                  id="reject-reason"
                  placeholder="Masukkan alasan penolakan..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectReason("");
                  setSelectedUserId(null);
                }}
                className="border-slate-300 dark:border-slate-500"
              >
                Batal
              </Button>
              <Button 
                onClick={handleRejectUser}
                disabled={!rejectReason.trim()}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
              >
                Tolak Pendaftaran
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UserApprovalPage;
