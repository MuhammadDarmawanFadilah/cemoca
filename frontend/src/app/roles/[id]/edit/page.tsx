"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/config";
import { 
  Shield, 
  ArrowLeft, 
  Save, 
  Edit,
  CheckSquare,
  Square,
  Users,
  Lock,
  Settings,
  Clock
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Link from "next/link";

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

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;
  const [role, setRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<RoleRequest>({
    roleName: "",
    description: "",
    permissions: []
  });
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (roleId) {
      fetchRoleDetail();
    }
  }, [roleId]);

  const fetchRoleDetail = async () => {
    try {
      setPageLoading(true);
      setPermissionsLoading(true);
      const response = await fetch(getApiUrl(`/api/roles/${roleId}`));
      if (response.ok) {
        const data = await response.json();
        setRole(data);
        
        // Get the available permissions first to determine auto-checked ones
        const permissionsResponse = await fetch(getApiUrl('/api/roles/permissions'));
        if (permissionsResponse.ok) {
          const availablePerms = await permissionsResponse.json();
          setAvailablePermissions(availablePerms);
          
          // Auto-check Public and Other permissions if not already present
          const autoCheckedPermissions = availablePerms.filter((permission: string) => {
            // Public permissions
            if (permission.includes('home') || permission.includes('berita.read')) {
              return true;
            }
            // Other permissions - anything that doesn't fit in main categories
            if (!permission.includes('documents') && !permission.includes('biografi') && 
                !permission.includes('komunikasi') && !permission.includes('alumni-locations') &&
                !permission.includes('usulan') && !permission.includes('pelaksanaan') && 
                !permission.includes('notifikasi.read') && !permission.includes('users') && 
                !permission.includes('roles') && !permission.includes('admin') && 
                !permission.includes('birthday') && !permission.includes('invitations') && 
                !permission.includes('berita.create') && !permission.includes('berita.update') && 
                !permission.includes('berita.delete') && !permission.includes('notifikasi.create') && 
                !permission.includes('notifikasi.update') && !permission.includes('notifikasi.delete') && 
                !permission.includes('master-data') && !permission.includes('home') && 
                !permission.includes('berita.read')) {
              return true;
            }
            return false;
          });
          
          // Merge existing permissions with auto-checked ones (avoiding duplicates)
          const existingPermissions = data.permissions || [];
          const mergedPermissions = [...new Set([...existingPermissions, ...autoCheckedPermissions])];
          
          setFormData({
            roleName: data.roleName,
            description: data.description || "",
            permissions: mergedPermissions
          });
        } else {
          // Fallback if permissions fetch fails
          setFormData({
            roleName: data.roleName,
            description: data.description || "",
            permissions: data.permissions || []
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Role tidak ditemukan",
          variant: "destructive",
        });
        router.push('/roles');
      }
    } catch (error) {
      console.error('Error fetching role detail:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memuat data role",
        variant: "destructive",
      });
    } finally {
      setPageLoading(false);
      setPermissionsLoading(false);
    }
  };

  const fetchAvailablePermissions = async () => {
    // This function is kept for compatibility but logic moved to fetchRoleDetail
    // to ensure auto-checking happens when role data is loaded
    try {
      setPermissionsLoading(true);
      if (availablePermissions.length === 0) {
        const response = await fetch(getApiUrl('/api/roles/permissions'));
        if (response.ok) {
          const data = await response.json();
          setAvailablePermissions(data);
        }
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast({
        title: "Error",
        description: "Gagal memuat daftar permissions",
        variant: "destructive",
      });
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.roleName.trim()) {
      toast({
        title: "Error",
        description: "Role name harus diisi",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(getApiUrl(`/api/roles/${roleId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Sukses",
          description: "Role berhasil diperbarui",
        });
        router.push('/roles');
      } else {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: errorText || "Gagal memperbarui role",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memperbarui role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permissions: [...prev.permissions, permission]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => p !== permission)
      }));
    }
  };

  const toggleAllPermissions = () => {
    if (formData.permissions.length === availablePermissions.length) {
      // Unselect all
      setFormData(prev => ({ ...prev, permissions: [] }));
    } else {
      // Select all
      setFormData(prev => ({ ...prev, permissions: [...availablePermissions] }));
    }
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
                 permission.includes('notifikasi.read')) {
        groups['User/Alumni'].push(permission);
      } else if (permission.includes('users') || permission.includes('roles') || 
                 permission.includes('admin') || permission.includes('birthday') ||
                 permission.includes('invitations') || permission.includes('berita.create') ||
                 permission.includes('berita.update') || permission.includes('berita.delete') ||
                 permission.includes('notifikasi.create') || permission.includes('notifikasi.update') ||
                 permission.includes('notifikasi.delete')) {
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

  const groupedPermissions = groupPermissions(availablePermissions);

  if (pageLoading) {
    return (
      <ProtectedRoute requireAuth={true} allowedRoles={["ADMIN"]}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner className="h-8 w-8 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Memuat data role...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!role) {
    return (
      <ProtectedRoute requireAuth={true} allowedRoles={["ADMIN"]}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Role tidak ditemukan</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Role yang Anda cari tidak ada atau sudah dihapus</p>
            <Link href="/roles">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Roles
              </Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth={true} allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header dengan navigasi yang clean */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <Link href="/roles">
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali
                  </Button>
                </Link>
                <div className="h-6 w-px bg-gray-300"></div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield className="h-6 w-6 text-blue-600" />
                    Edit Role: {role.roleName}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">Perbarui informasi role dan permissions</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="px-3 py-1">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(role.createdAt).toLocaleDateString('id-ID')}
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  <Lock className="h-3 w-3 mr-1" />
                  {formData.permissions.length} permissions
                </Badge>
                <Button 
                  onClick={() => {
                    const form = document.getElementById('role-form') as HTMLFormElement;
                    form?.requestSubmit();
                  }}
                  disabled={loading || !formData.roleName.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Simpan Perubahan
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content area yang lebih compact */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Form Section */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Edit className="h-5 w-5" />
                    Informasi Role
                  </CardTitle>
                  <CardDescription>
                    Perbarui detail dasar role
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form id="role-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="roleName" className="text-sm font-medium">
                        Nama Role <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="roleName"
                        value={formData.roleName}
                        onChange={(e) => setFormData(prev => ({ ...prev, roleName: e.target.value.toUpperCase() }))}
                        placeholder="contoh: ADMIN, MODERATOR"
                        className="uppercase"
                        required
                      />
                      <p className="text-xs text-gray-500">Nama role akan otomatis dalam huruf kapital</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium">Deskripsi</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Jelaskan fungsi dan tanggung jawab role ini..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    {/* Stats & Info */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Permissions</span>
                          <span className="font-medium">{availablePermissions.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Dipilih</span>
                          <span className="font-medium text-blue-600">{formData.permissions.length}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${availablePermissions.length ? (formData.permissions.length / availablePermissions.length) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Role metadata */}
                      <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Dibuat:</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {new Date(role.createdAt).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Diperbarui:</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {new Date(role.updatedAt).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button type="submit" className="hidden">Submit</button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Permissions Section */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Kelola Permissions
                      </CardTitle>
                      <CardDescription>
                        Perbarui hak akses untuk role ini
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant={formData.permissions.length === availablePermissions.length ? "default" : "outline"}
                      size="sm"
                      onClick={toggleAllPermissions}
                      className="flex items-center gap-2"
                    >
                      {formData.permissions.length === availablePermissions.length ? (
                        <>
                          <CheckSquare className="h-4 w-4" />
                          Hapus Semua
                        </>
                      ) : (
                        <>
                          <Square className="h-4 w-4" />
                          Pilih Semua
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {permissionsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(groupedPermissions).map(([group, permissions]) => (
                        <div key={group} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                group === 'Public' ? 'bg-green-500' :
                                group === 'User/Alumni' ? 'bg-blue-500' :
                                group === 'Admin' ? 'bg-red-500' :
                                group === 'Master Data' ? 'bg-purple-500' :
                                'bg-gray-500'
                              }`}></div>
                              {group}
                            </h4>
                            <Badge variant="secondary" className="text-xs">
                              {permissions.filter(p => formData.permissions.includes(p)).length}/{permissions.length}
                            </Badge>
                          </div>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {permissions.map((permission) => (
                              <div key={permission} className="flex items-start space-x-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <Checkbox
                                  id={permission}
                                  checked={formData.permissions.includes(permission)}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(permission, checked as boolean)
                                  }
                                  className="mt-0.5"
                                />
                                <Label
                                  htmlFor={permission}
                                  className="text-xs font-normal cursor-pointer flex-1 leading-relaxed"
                                >
                                  {formatPermissionName(permission)}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
