"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Plus, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/config";

interface Role {
  roleId: number;
  roleName: string;
}

interface UserRow {
  id: number;
  username: string;
  email: string;
  fullName: string;
  status: string;
  role?: Role;
  lastAccessAt?: string;
  createdAt: string;
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("id-ID");
}

export default function AdminPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append("page", "0");
        params.append("size", "500");
        params.append("sortBy", "createdAt");
        params.append("sortDirection", "desc");

        const res = await fetch(getApiUrl(`/api/users?${params.toString()}`), {
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `HTTP ${res.status}`);
        }

        const data = await res.json();
        const content = Array.isArray(data) ? data : data.content;
        setUsers(content || []);
      } catch (e: any) {
        toast({
          title: "Error",
          description: e?.message || "Gagal memuat data admin",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const adminUsers = useMemo(() => {
    return (users || []).filter((u) => {
      const r = u.role?.roleName;
      return r === "ADMIN" || r === "MODERATOR";
    });
  }, [users]);

  return (
    <ProtectedRoute requireAuth={true} allowedRoles={["ADMIN", "MODERATOR"]}>
      <div className="min-h-screen bg-background">
        <AdminPageHeader
          title="Admin"
          description="Kelola akun admin/moderator dan last access"
          icon={Users}
          primaryAction={{
            label: "Tambah Admin",
            onClick: () => router.push("/users"),
            icon: Plus,
          }}
          stats={[{ label: "Total Admin", value: adminUsers.length, variant: "secondary" }]}
        />

        <div className="container mx-auto p-6 space-y-6">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Access</TableHead>
                      <TableHead>Dibuat</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : adminUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Belum ada admin
                        </TableCell>
                      </TableRow>
                    ) : (
                      adminUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="font-medium">{u.fullName}</div>
                            <div className="text-sm text-muted-foreground">@{u.username}</div>
                          </TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
                              {u.role?.roleName || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                u.status === "ACTIVE"
                                  ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
                                  : "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700"
                              }
                            >
                              {u.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDateTime(u.lastAccessAt)}</TableCell>
                          <TableCell>{formatDateTime(u.createdAt)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/users/${u.username}`)}
                              className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
