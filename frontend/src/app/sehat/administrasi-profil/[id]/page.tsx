"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/config";
import { ArrowLeft, Loader2, Pencil, Mail, Phone, Calendar, Clock, User } from "lucide-react";

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
  avatarUrl?: string;
  role?: Role;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "WAITING_APPROVAL";
  createdAt: string;
}

export default function DetailUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("auth_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl(`/users/${userId}`), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Gagal memuat data pengguna");
      const data: User = await res.json();
      setUser(data);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data pengguna");
      router.push("/sehat/administrasi-profil");
    } finally {
      setLoading(false);
    }
  }, [userId, getAuthHeaders, router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const initials = (name: string) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Memuat data...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Pengguna tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-3 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Detail Pengguna</h1>
        </div>
        <Button onClick={() => router.push(`/sehat/administrasi-profil/edit/${userId}`)} size="sm" className="h-8">
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          Edit
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={(user.photoPath || user.avatarUrl) ? getApiUrl("/files/" + (user.photoPath || user.avatarUrl)) : undefined}
                alt={user.fullName}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/10 text-primary text-base font-bold">
                {initials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{user.fullName}</CardTitle>
              <p className="text-xs text-muted-foreground">@{user.username}</p>
              <div className="flex gap-1.5 mt-1.5">
                {roleBadge(user.role)}
                {statusBadge(user.status)}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-3">
          <div className="space-y-4">
            {/* Contact Information */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Kontak
              </h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Telepon</p>
                    <p className="text-sm font-medium">{user.phoneNumber}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient-specific Information */}
            {(user.age || user.medicationTime) && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  Info Pasien
                </h3>
                <div className="space-y-2">
                  {user.age && (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Usia</p>
                        <p className="text-sm font-medium">{user.age} tahun</p>
                      </div>
                    </div>
                  )}
                  {user.medicationTime && (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Jam Minum Obat</p>
                        <p className="text-sm font-medium">{user.medicationTime}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Account Information */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Akun
              </h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Terdaftar</p>
                    <p className="text-sm font-medium">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 pt-3 border-t">
            <Button variant="outline" onClick={() => router.back()} className="flex-1 h-9">
              Kembali
            </Button>
            <Button onClick={() => router.push(`/sehat/administrasi-profil/edit/${userId}`)} className="flex-1 h-9">
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
