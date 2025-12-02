"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getApiUrl } from "@/lib/config";
import { Pencil, Trash2, Plus, Eye, UserCheck, UserX, Shield, Users } from "lucide-react";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { SortableHeader } from "@/components/ui/sortable-header";
import { ServerPagination } from "@/components/ServerPagination";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import AdminFilters from "@/components/AdminFilters";
import KaryawanFormStepper from "@/components/KaryawanFormStepper";

interface Role {
  roleId: number;
  roleName: string;
  description: string;
  permissions: string[];
}

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: Role;
  status: string;
  createdAt: string;
  // Address fields
  alamat?: string;
  provinsi?: string;
  kota?: string;
  kecamatan?: string;
  kelurahan?: string;
  kodePos?: string;
  latitude?: number;
  longitude?: number;
  biografi?: {
    biografiId: number;
    namaLengkap: string;
    fotoProfil?: string;
  };
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const { toast } = useToast();
  const { token } = useAuth();
  const { t } = useLanguage();
  
  // Helper function to get authorization headers
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  });

  useEffect(() => {
    if (!showCreateForm && !showEditForm) {
      fetchUsers();
      fetchRoles();
    }
  }, [currentPage, pageSize, searchTerm, selectedRole, selectedStatus, sortBy, sortDir, showCreateForm, showEditForm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('size', pageSize.toString());
      params.append('sortBy', sortBy);
      params.append('sortDirection', sortDir);
      if (searchTerm) params.append('search', searchTerm);
      if (selectedRole && selectedRole !== "all") params.append('roleId', selectedRole);
      if (selectedStatus && selectedStatus !== "all") params.append('status', selectedStatus);
      
      const response = await fetch(getApiUrl(`/api/users?${params.toString()}`), {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.content || data);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } else {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: errorText || "Gagal memuat data user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch(getApiUrl('/api/roles/all'), {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      } else {
        toast({
          title: "Error",
          description: "Gagal memuat data roles",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data roles",
        variant: "destructive",
      });
    }
  };

  // Search and filter handlers that reset pagination
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0);
  };

  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
    setCurrentPage(0);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(0);
  };

  const handleSort = (newSortBy: string, newSortDir: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortDir(newSortDir);
    setCurrentPage(0); // Reset to first page when sorting
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(0); // Reset to first page when changing page size
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return;
    
    try {
      setLoading(true);
      const response = await fetch(getApiUrl(`/api/users/${userId}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        toast({
          title: "Sukses",
          description: "User berhasil dihapus",
        });
        fetchUsers();
      } else {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: errorText || "Gagal menghapus user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menghapus user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: number) => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl(`/api/users/${userId}/toggle-status`), {
        method: 'PUT',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        toast({
          title: "Sukses",
          description: "Status user berhasil diubah",
        });
        fetchUsers();
      } else {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: errorText || "Gagal mengubah status user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengubah status user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateForm = () => {
    setSelectedUser(null);
    setShowCreateForm(true);
  };

  const openEditForm = (user: User) => {
    setSelectedUser(user);
    setShowEditForm(true);
  };

  const handleCreateSubmit = async (data: any) => {
    try {
      const response = await fetch(getApiUrl('/api/users'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Sukses",
          description: "User berhasil dibuat",
        });
        setShowCreateForm(false);
        fetchUsers();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || "Gagal membuat user");
      }
    } catch (error) {
      throw error; // Re-throw to let form handle it
    }
  };

  const handleEditSubmit = async (data: any) => {
    if (!selectedUser) return;

    try {
      const response = await fetch(getApiUrl(`/api/users/${selectedUser.id}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Sukses",
          description: "User berhasil diperbarui",
        });
        setShowEditForm(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || "Gagal memperbarui user");
      }
    } catch (error) {
      throw error; // Re-throw to let form handle it
    }
  };

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setSelectedUser(null);
  };

  // Show form if creating or editing
  if (showCreateForm) {
    return (
      <ProtectedRoute requireAuth={true} allowedRoles={["ADMIN", "MODERATOR"]}>
        <div className="min-h-screen bg-background">
          <KaryawanFormStepper
            isEdit={false}
            onSubmit={handleCreateSubmit}
            onCancel={handleCancelForm}
            submitButtonText="Simpan User"
            showBackButton={true}
          />
        </div>
      </ProtectedRoute>
    );
  }

  if (showEditForm && selectedUser) {
    return (
      <ProtectedRoute requireAuth={true} allowedRoles={["ADMIN", "MODERATOR"]}>
        <div className="min-h-screen bg-background">
          <KaryawanFormStepper
            initialData={selectedUser}
            isEdit={true}
            onSubmit={handleEditSubmit}
            onCancel={handleCancelForm}
            submitButtonText="Perbarui User"
            showBackButton={true}
          />
        </div>
      </ProtectedRoute>
    );
  }
  // Show main table view
  return (
    <ProtectedRoute requireAuth={true} allowedRoles={["ADMIN", "MODERATOR"]}>
      <div className="min-h-screen bg-background">
        <AdminPageHeader
          title="Management Users"
          description="Kelola data user dan hak akses sistem"
          icon={Users}
          primaryAction={{
            label: "Tambah User",
            onClick: openCreateForm,
            icon: Plus
          }}
          stats={[
            {
              label: "Total Users",
              value: totalElements,
              variant: "secondary"
            },
            {
              label: "Active Users",
              value: users.filter(u => u.status === "ACTIVE").length,
              variant: "default"
            }
          ]}
        />

        <div className="container mx-auto p-6 space-y-6">
          {/* Search and Filter Section */}
          <AdminFilters
            searchPlaceholder="Cari nama, username, email user..."
            searchValue={searchTerm}
            onSearchChange={handleSearchChange}
            filters={[
              {
                label: "Role",
                value: selectedRole,
                options: [
                  { value: "all", label: "Semua Role" },
                  ...roles.map(role => ({
                    value: role.roleId.toString(),
                    label: role.roleName,
                  }))
                ],
                onChange: handleRoleChange,
              },
              {
                label: "Status",
                value: selectedStatus,
                options: [
                  { value: "all", label: "Semua Status" },
                  { value: "ACTIVE", label: "Aktif", color: "bg-green-500" },
                  { value: "INACTIVE", label: "Tidak Aktif", color: "bg-gray-500" },
                  { value: "SUSPENDED", label: "Suspended", color: "bg-red-500" },
                  { value: "WAITING_APPROVAL", label: "Menunggu Persetujuan", color: "bg-yellow-500" },
                ],
                onChange: handleStatusChange,
              },
            ]}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
            totalItems={totalElements}
            currentItems={users.length}
            onClearFilters={() => {
              setSearchTerm("");
              setSelectedRole("all");
              setSelectedStatus("all");
              setCurrentPage(0);
            }}
            activeFiltersCount={
              (searchTerm ? 1 : 0) +
              (selectedRole !== "all" ? 1 : 0) +
              (selectedStatus !== "all" ? 1 : 0)
            }
          />

          {/* Users Table */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <SortableHeader
                          sortKey="fullName"
                          currentSort={{ sortBy, sortDir }}
                          onSort={handleSort}
                        >
                          User Info
                        </SortableHeader>
                      </TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>
                        <SortableHeader
                          sortKey="status"
                          currentSort={{ sortBy, sortDir }}
                          onSort={handleSort}
                        >
                          Status
                        </SortableHeader>
                      </TableHead>
                      <TableHead>Alumni</TableHead>
                      <TableHead>
                        <SortableHeader
                          sortKey="createdAt"
                          currentSort={{ sortBy, sortDir }}
                          onSort={handleSort}
                        >
                          Dibuat
                        </SortableHeader>
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <LoadingSpinner />
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="h-8 w-8 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {searchTerm ? 'Tidak ada user yang ditemukan' : 'Belum ada data user'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.fullName}</div>
                              <div className="text-sm text-muted-foreground">@{user.username}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm">{user.email}</div>
                              <div className="text-sm text-muted-foreground">{user.phoneNumber}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              {user.role.roleName}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={
                                user.status === 'ACTIVE' 
                                  ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700' 
                                  : user.status === 'INACTIVE'
                                  ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
                                  : 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700'
                              }
                            >
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.biografi ? (
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                  👤
                                </div>
                                <span className="text-sm">{user.biografi.namaLengkap}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Tidak ada biografi</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(user.createdAt).toLocaleDateString('id-ID')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/users/${user.username}`)}
                                className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditForm(user)}
                                className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleUserStatus(user.id)}
                                className={
                                  user.status === 'ACTIVE' 
                                    ? 'border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-400 dark:hover:bg-orange-900/20' 
                                    : 'border-green-300 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20'
                                }
                              >
                                {user.status === 'ACTIVE' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(user.id)}
                                className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
                <div className="border-t border-gray-200 dark:border-gray-700">
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
      </div>
    </ProtectedRoute>
  );
}