"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/config";
import { 
  ArrowLeft, 
  Shield, 
  Edit, 
  Users, 
  Calendar,
  Search
} from "lucide-react";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { ServerPagination } from "@/components/ServerPagination";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

interface Role {
  roleId: number;
  roleName: string;
  description: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  status: string;
  createdAt: string;
}

export default function RoleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;
  
  const [role, setRole] = useState<Role | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  
  // Pagination states for users
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    if (roleId) {
      fetchRole();
      fetchRoleUsers();
    }
  }, [roleId, currentPage, pageSize, searchTerm]);

  const fetchRole = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl(`/api/roles/${roleId}`));
      if (response.ok) {
        const data = await response.json();
        setRole(data);
      } else {
        toast({
          title: "Error",
          description: "Gagal memuat data role",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching role:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memuat data role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleUsers = async () => {
    try {
      setUsersLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('size', pageSize.toString());
      params.append('roleId', roleId);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(getApiUrl(`/api/users?${params.toString()}`));
      if (response.ok) {
        const data = await response.json();
        setUsers(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      }
    } catch (error) {
      console.error('Error fetching role users:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data users dengan role ini",
        variant: "destructive",
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(0);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0);
  };

  const groupPermissions = (permissions: string[]) => {
    const groups: { [key: string]: string[] } = {
      'Public': [],
      'User/Alumni': [],
      'Admin': [],
      'Master Data': [],
      'Other': []
    };
    
    permissions.forEach(permission => {
      if (permission.includes('home') || permission.includes('berita.read')) {
        groups['Public'].push(permission);
      } else if (permission.includes('documents') || permission.includes('biografi') || 
                 permission.includes('komunikasi') || permission.includes('alumni-locations') ||
                 permission.includes('usulan') || permission.includes('pelaksanaan') || 
                 permission.includes('notifikasi')) {
        groups['User/Alumni'].push(permission);
      } else if (permission.includes('users') || permission.includes('roles') || 
                 permission.includes('admin') || permission.includes('birthday') ||
                 permission.includes('invitations')) {
        groups['Admin'].push(permission);
      } else if (permission.includes('master-data')) {
        groups['Master Data'].push(permission);
      } else {
        groups['Other'].push(permission);
      }
    });

    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  };

  const formatPermissionName = (permission: string) => {
    return permission
      .replace(/[_-]/g, ' ')
      .split('.')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' > ');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requireAuth={true} allowedRoles={["ADMIN"]}>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <LoadingSpinner />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!role) {
    return (
      <ProtectedRoute requireAuth={true} allowedRoles={["ADMIN"]}>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Role tidak ditemukan</h3>
                <p className="text-muted-foreground">Role yang Anda cari tidak ditemukan atau telah dihapus.</p>
                <Button onClick={() => router.push('/roles')} className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali ke Roles
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const groupedPermissions = groupPermissions(role.permissions);

  return (
    <ProtectedRoute requireAuth={true} allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-background">
        <AdminPageHeader
          title={`Role: ${role.roleName}`}
          description={`Detail informasi role ${role.roleName} dan users yang menggunakan role ini`}
          icon={Shield}
          primaryAction={{
            label: "Edit Role",
            onClick: () => router.push(`/roles/${roleId}/edit`),
            icon: Edit
          }}
          secondaryActions={[
            {
              label: "Kembali",
              onClick: () => router.push('/roles'),
              icon: ArrowLeft,
              variant: "outline"
            }
          ]}
          stats={[
            {
              label: "Total Permissions",
              value: role.permissions.length.toString()
            },
            {
              label: "Users with this Role",
              value: totalElements.toString()
            },
            {
              label: "Created",
              value: new Date(role.createdAt).toLocaleDateString('id-ID')
            }
          ]}
        />

        <div className="container mx-auto p-6 space-y-6">
          {/* Role Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role Information
              </CardTitle>
              <CardDescription>
                Basic information about this role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Role Name</h4>
                  <p className="text-muted-foreground">{role.roleName}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground">{role.description || 'No description provided'}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Created At</h4>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(role.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Last Updated</h4>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(role.updatedAt).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                Permissions granted to users with this role ({role.permissions.length} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(groupedPermissions).map(([group, permissions]) => (
                  <Card key={group} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm uppercase text-muted-foreground">
                          {group}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {permissions.length} permissions
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {permissions.map((permission) => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {formatPermissionName(permission)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Users with this Role Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Users with this Role
                  </CardTitle>
                  <CardDescription>
                    All users who have been assigned the {role.roleName} role
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10 min-w-[200px]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Show:</span>
                    <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          <LoadingSpinner />
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="h-8 w-8 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {searchTerm ? 'No users found' : 'No users with this role'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatarUrl} />
                                <AvatarFallback>
                                  {user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 
                                   user.username?.slice(0, 2).toUpperCase() || '??'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.fullName || user.username}</div>
                                <div className="text-sm text-muted-foreground">@{user.username}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{user.email}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(user.status)}>
                              {user.status || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {new Date(user.createdAt).toLocaleDateString('id-ID')}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t pt-4 mt-4">
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