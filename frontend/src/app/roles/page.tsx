"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { config, getApiUrl } from "@/lib/config";
import { Pencil, Trash2, Plus, Shield, Settings, CheckCircle, Search, Eye } from "lucide-react";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { SortableHeader } from "@/components/ui/sortable-header";
import { ServerPagination } from "@/components/ServerPagination";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Role {
  roleId: number;
  roleName: string;
  description: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

interface RoleRequest {
  roleName: string;
  description: string;
  permissions: string[];
}

// Permission descriptions for better UX
const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  "users.read": "Melihat daftar pengguna",
  "users.create": "Membuat pengguna baru",
  "users.update": "Mengubah data pengguna",
  "users.delete": "Menghapus pengguna",
  "roles.read": "Melihat daftar role",
  "roles.create": "Membuat role baru",
  "roles.update": "Mengubah role",
  "roles.delete": "Menghapus role",
  "biografi.read": "Melihat biografi alumni",
  "biografi.create": "Membuat biografi alumni",
  "biografi.update": "Mengubah biografi alumni",
  "biografi.delete": "Menghapus biografi alumni",
  "berita.read": "Melihat berita",
  "berita.create": "Membuat berita",
  "berita.update": "Mengubah berita",
  "berita.delete": "Menghapus berita",  "documents.read": "Melihat dokumen",
  "documents.create": "Upload dokumen",
  "documents.update": "Mengubah dokumen",
  "documents.delete": "Menghapus dokumen",
  "notifications.read": "Melihat notifikasi",
  "notifications.create": "Membuat notifikasi",
  "notifications.send": "Mengirim notifikasi",
  "dashboard.view": "Akses dashboard",
  "admin.panel.access": "Akses panel admin"
};

// Group permissions by category
const PERMISSION_GROUPS = {  "User Management": ["users.read", "users.create", "users.update", "users.delete"],
  "Role Management": ["roles.read", "roles.create", "roles.update", "roles.delete"],
  "Alumni Management": ["biografi.read", "biografi.create", "biografi.update", "biografi.delete"],
  "News Management": ["berita.read", "berita.create", "berita.update", "berita.delete"],
  "Document Management": ["documents.read", "documents.create", "documents.update", "documents.delete"],
  "Notification Management": ["notifications.read", "notifications.create", "notifications.send"],
  "System Access": ["dashboard.view", "admin.panel.access"]
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState('roleName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  
  const { toast } = useToast();
  const router = useRouter();  useEffect(() => {
    fetchRoles();
  }, [currentPage, pageSize, searchTerm, sortBy, sortDir]);

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

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0); // Reset to first page when searching
  };
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('size', pageSize.toString());
      params.append('sortBy', sortBy);
      params.append('sortDirection', sortDir);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(getApiUrl(`/api/roles?${params.toString()}`));
      if (response.ok) {
        const data = await response.json();
        setRoles(data.content || data);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data roles",
        variant: "destructive",
      });
    } finally {      setLoading(false);
    }  };

  const fetchAvailablePermissions = async () => {
    try {
      const response = await fetch(getApiUrl('/api/roles/permissions'));
      if (response.ok) {
        const data = await response.json();
        // We don't need this anymore since we're not using dialog
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const handleDelete = async (roleId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus role ini?')) return;
    
    try {
      setLoading(true);
      const response = await fetch(getApiUrl(`/api/roles/${roleId}`), {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Sukses",
          description: "Role berhasil dihapus",
        });
        fetchRoles();
      } else {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: errorText || "Gagal menghapus role",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menghapus role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/roles/initialize'), {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: "Sukses",
          description: "Default roles berhasil dibuat",
        });
        fetchRoles();
      } else {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: errorText || "Gagal membuat default roles",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat membuat default roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (role: Role) => {
    // For now, we'll just show a toast with role details
    // In a real application, this could navigate to a detail page or open a detail modal
    toast({
      title: `Role Details: ${role.roleName}`,
      description: `Description: ${role.description || 'No description'} | Permissions: ${role.permissions.length}`,
    });
  };  return (
    <ProtectedRoute requireAuth={true} allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-background">
        <AdminPageHeader
          title="Management Roles"
          description="Kelola role dan permission sistem"
          icon={Shield}
          primaryAction={{
            label: "Tambah Role",
            onClick: () => router.push("/roles/create"),
            icon: Plus
          }}
          secondaryActions={[
            {
              label: "Init Default Roles",
              onClick: initializeDefaultRoles,
              icon: Settings,
              variant: "outline"
            }
          ]}
          stats={[
            {
              label: "Total Roles",
              value: totalElements,
              variant: "secondary"
            }
          ]}
        />

        <div className="container mx-auto p-6 space-y-6">
          {/* Search */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Cari nama role atau deskripsi..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-gray-600 dark:text-gray-400">Show:</Label>
                  <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                    <SelectTrigger className="w-20 bg-white dark:bg-gray-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="1000">1000</SelectItem>
                      <SelectItem value="10000">10000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {roles.length} of {totalElements} items
                </div>
              </div>
            </CardContent>
          </Card>{/* Roles Table */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortableHeader
                      sortKey="roleName"
                      currentSort={{ sortBy, sortDir }}
                      onSort={handleSort}
                    >
                      Role Name
                    </SortableHeader>
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>
                    <SortableHeader
                      sortKey="createdAt"
                      currentSort={{ sortBy, sortDir }}
                      onSort={handleSort}
                    >
                      Created
                    </SortableHeader>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <LoadingSpinner />
                    </TableCell>
                  </TableRow>
                ) : roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Shield className="h-8 w-8 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {searchTerm ? 'Tidak ada role yang ditemukan' : 'Belum ada data role'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((role) => (
                    <TableRow key={role.roleId}>
                      <TableCell>
                        <div className="font-medium">{role.roleName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{role.description || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {role.permissions.length > 0 ? (
                            role.permissions.slice(0, 3).map((permission) => (
                              <Badge key={permission} variant="secondary" className="text-xs">
                                {permission}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">No permissions</span>
                          )}
                          {role.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(role.createdAt).toLocaleDateString('id-ID')}
                        </div>
                      </TableCell>                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetail(role)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Link href={`/roles/${role.roleId}/edit`}>
                            <Button
                              variant="outline"
                              size="sm"
                              title="Edit Role"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(role.roleId)}
                            className="text-red-600"
                            title="Delete Role"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))                )}
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
      </div>
    </ProtectedRoute>
  );
}
