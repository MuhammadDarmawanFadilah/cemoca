"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/config";
import {
  UserPlus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Users,
  ShieldCheck,
  Stethoscope,
  UserX,
  Loader2,
  MoreHorizontal,
  Eye,
  Power,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Types ───────────────────────────────────────────────
interface Role {
  id: number;
  name: string;
  roleName: string;
}

interface User {
  id: number;
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  age?: number;
  medicationTime?: string;
  photoPath?: string;
  role?: Role;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "WAITING_APPROVAL";
  createdAt: string;
}

interface PaginatedResponse {
  content: User[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// ─── Component ───────────────────────────────────────────
export default function ManajemenPenggunaPage() {
  const router = useRouter();
  
  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "admin" | "pasien" | "inactive">("all");

  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // ─── Auth helper ─────────────────────────────────────
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("auth_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, []);

  // ─── Fetch users (server-side pagination) ────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        getApiUrl(`/users/paginated?page=${currentPage}&size=${pageSize}`),
        { headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error("Gagal memuat data");
      const data: PaginatedResponse = await res.json();
      setUsers(data.content || []);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data pengguna");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, getAuthHeaders]);

  // ─── Fetch roles (non-paginated) ────────────────────
  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl("/roles/all"), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Gagal memuat roles");
      const data = await res.json();
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setRoles([]);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  // ─── Filtered data (client-side on current page) ────
  const filteredUsers = users.filter((u) => {
    // Search filter
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      u.fullName?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phoneNumber?.includes(q);

    // Tab filter
    const roleName = u.role?.roleName || u.role?.name || "";
    let matchesTab = true;
    if (activeFilter === "admin") matchesTab = roleName === "ADMIN" || roleName === "MODERATOR";
    else if (activeFilter === "pasien") matchesTab = roleName === "PASIEN" || roleName === "KARYAWAN" || roleName === "USER";
    else if (activeFilter === "inactive") matchesTab = u.status !== "ACTIVE";

    return matchesSearch && matchesTab;
  });

  // ─── Stats ───────────────────────────────────────────
  const adminCount = users.filter((u) => u.role?.roleName === "ADMIN" || u.role?.roleName === "MODERATOR").length;
  const pasienCount = users.filter((u) => u.role?.roleName === "PASIEN" || u.role?.roleName === "KARYAWAN" || u.role?.roleName === "USER").length;
  const inactiveCount = users.filter((u) => u.status !== "ACTIVE").length;

  // ─── Delete ──────────────────────────────────────────
  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(getApiUrl(`/users/${selectedUser.id}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Gagal menghapus");
      toast.success("Pengguna berhasil dihapus");
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch {
      toast.error("Gagal menghapus pengguna");
    }
  };

  // ─── Toggle status ──────────────────────────────────
  const toggleStatus = async (user: User) => {
    try {
      const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      const payload = {
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        roleId: user.role?.id,
        status: newStatus,
      };
      const res = await fetch(getApiUrl(`/users/${user.id}`), {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(`Status diubah menjadi ${newStatus}`);
      fetchUsers();
    } catch {
      toast.error("Gagal mengubah status");
    }
  };

  // ─── Status badge ───────────────────────────────────
  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      ACTIVE: { label: "Aktif", variant: "default" },
      INACTIVE: { label: "Nonaktif", variant: "secondary" },
      SUSPENDED: { label: "Suspended", variant: "destructive" },
      WAITING_APPROVAL: { label: "Menunggu", variant: "outline" },
    };
    const s = map[status] || { label: status, variant: "outline" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const roleBadge = (role?: Role) => {
    const name = role?.roleName || role?.name || "—";
    if (name === "ADMIN") return <Badge className="bg-purple-600 hover:bg-purple-700 text-white">Admin</Badge>;
    if (name === "PASIEN" || name === "KARYAWAN") return <Badge className="bg-blue-600 hover:bg-blue-700 text-white">Pasien</Badge>;
    return <Badge variant="outline">{name}</Badge>;
  };

  const initials = (name: string) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  // ─── Navigation helpers ──────────────────────────────
  const openAddPasien = () => router.push("/sehat/administrasi-profil/tambah-pasien");
  const openAddAdmin = () => router.push("/sehat/administrasi-profil/tambah-admin");
  const openEdit = (userId: number) => router.push(`/sehat/administrasi-profil/edit/${userId}`);
  const openDetail = (userId: number) => router.push(`/sehat/administrasi-profil/${userId}`);

  // ─── Filter tabs config ──────────────────────────────
  const filterTabs = [
    { key: "all" as const, label: "Semua", icon: Users, count: totalElements },
    { key: "admin" as const, label: "Admin", icon: ShieldCheck, count: adminCount },
    { key: "pasien" as const, label: "Pasien", icon: Stethoscope, count: pasienCount },
    { key: "inactive" as const, label: "Nonaktif", icon: UserX, count: inactiveCount },
  ];

  // ─── Render ──────────────────────────────────────────
  return (
    <div className="space-y-3">

      {/* Action buttons - Right aligned */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide flex-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveFilter(tab.key); setCurrentPage(0); }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeFilter === tab.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 hover:bg-muted"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                activeFilter === tab.key ? "bg-primary-foreground/20" : "bg-background"
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>
        
        <div className="flex gap-2 shrink-0">
          <Button onClick={openAddPasien} size="sm" className="gap-1.5 h-9">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Tambah Pasien</span>
          </Button>
          <Button onClick={openAddAdmin} size="sm" variant="secondary" className="gap-1.5 h-9">
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Tambah Admin</span>
          </Button>
        </div>
      </div>

      {/* Search - Full width */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari pengguna..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
      </div>

      {/* Table card - Compact & Professional */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Memuat data...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">Tidak ada data ditemukan</p>
              <p className="text-xs mt-1">Coba ubah filter atau tambahkan pengguna baru</p>
            </div>
          ) : (
            <>
              {/* ── Desktop table - Professional ── */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12 py-3 text-xs font-semibold">#</TableHead>
                      <TableHead className="py-3 text-xs font-semibold">Pengguna</TableHead>
                      <TableHead className="py-3 text-xs font-semibold">Kontak</TableHead>
                      <TableHead className="py-3 text-xs font-semibold">Role</TableHead>
                      <TableHead className="py-3 text-xs font-semibold">Status</TableHead>
                      <TableHead className="py-3 w-14 text-xs font-semibold text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user, idx) => (
                      <TableRow key={user.id} className="hover:bg-muted/40">
                        <TableCell className="text-muted-foreground text-xs py-3 font-medium">
                          {currentPage * pageSize + idx + 1}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 border">
                              <AvatarImage
                                src={(user.photoPath) ? getApiUrl("/files/" + user.photoPath) : undefined}
                                alt={user.fullName}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                {initials(user.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{user.fullName}</p>
                              <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-xs space-y-0.5">
                            <p className="truncate max-w-[200px] font-medium">{user.email}</p>
                            <p className="text-muted-foreground">{user.phoneNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">{roleBadge(user.role)}</TableCell>
                        <TableCell className="py-3">{statusBadge(user.status)}</TableCell>
                        <TableCell className="text-right py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => openDetail(user.id)}>
                                <Eye className="mr-2 h-4 w-4" /> Detail
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(user.id)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleStatus(user)}>
                                <Power className="mr-2 h-4 w-4" />
                                {user.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* ── Mobile cards - Professional ── */}
              <div className="md:hidden divide-y">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="p-3.5 flex items-start gap-3 hover:bg-muted/40 transition-colors">
                    <Avatar className="h-10 w-10 shrink-0 border">
                      <AvatarImage
                        src={(user.photoPath) ? getApiUrl("/files/" + user.photoPath) : undefined}
                        alt={user.fullName}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {initials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{user.fullName}</p>
                          <p className="text-xs text-muted-foreground">@{user.username}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => openDetail(user.id)}>
                              <Eye className="mr-2 h-4 w-4" /> Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(user.id)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleStatus(user)}>
                              <Power className="mr-2 h-4 w-4" />
                              {user.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {roleBadge(user.role)}
                        {statusBadge(user.status)}
                      </div>
                      <div className="mt-2 space-y-0.5">
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.phoneNumber}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Pagination - Professional ── */}
          {totalPages > 0 && (
            <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Tampilkan</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    setCurrentPage(0);
                  }}
                >
                  <SelectTrigger className="h-8 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20, 50].map((n) => (
                      <SelectItem key={n} value={n.toString()} className="text-xs">{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  dari {totalElements} data
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground mr-2 hidden xs:inline">
                  Hal {currentPage + 1} dari {totalPages}
                </span>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 0} onClick={() => setCurrentPage(0)}>
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 0} onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage((p) => p + 1)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(totalPages - 1)}>
                  <ChevronsRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════ DELETE CONFIRMATION ═══════════════════ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengguna?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menghapus <strong>{selectedUser?.fullName}</strong> (@{selectedUser?.username}).
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
