"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Bell, MessageCircle, Activity, Clock, FileText } from "lucide-react";
import { getApiUrl } from "@/lib/config";
import { Skeleton } from "@/components/ui/skeleton";

export default function SehatDashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayIntakes: 0,
    totalReminders: 0,
    totalMessages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin()) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchStats = async () => {
    try {
      const [patients, intakes, reminders, messages] = await Promise.all([
        fetch(getApiUrl("/patients?page=0&size=1"), {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        }).then(r => r.json()),
        fetch(getApiUrl("/intake-history?page=0&size=1"), {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        }).then(r => r.json()),
        fetch(getApiUrl("/reminder-history?page=0&size=1"), {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        }).then(r => r.json()),
        fetch(getApiUrl("/chat/messages?page=0&size=1"), {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        }).then(r => r.json()),
      ]);

      setStats({
        totalPatients: patients.totalElements || 0,
        todayIntakes: intakes.totalElements || 0,
        totalReminders: reminders.totalElements || 0,
        totalMessages: messages.totalElements || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-base text-muted-foreground">
          Selamat datang, {user?.fullName || user?.username}
        </p>
      </div>

      {isAdmin() && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pasien</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPatients}</div>
                  <p className="text-xs text-muted-foreground mt-1">Pasien terdaftar</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Histori Intake</CardTitle>
                  <Activity className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todayIntakes}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total rekaman</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pengingat</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalReminders}</div>
                  <p className="text-xs text-muted-foreground mt-1">WhatsApp terkirim</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pesan Chat</CardTitle>
                  <MessageCircle className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalMessages}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total pesan</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tentang Aplikasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">Aplikasi Sehat Bersama membantu Anda mengelola pengingat minum obat dengan mudah.</p>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              <li>Rekam video minum obat</li>
              <li>Pengingat otomatis via WhatsApp</li>
              <li>Konsultasi grup chat</li>
              <li>Histori lengkap</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Informasi Akun
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">Role</p>
              <p className="text-sm text-muted-foreground">{user?.role?.roleName || "USER"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Username</p>
              <p className="text-sm text-muted-foreground">{user?.username}</p>
            </div>
            {isAdmin() ? (
              <p className="text-sm text-blue-600 font-medium mt-3">✓ Anda memiliki akses Admin</p>
            ) : (
              <p className="text-sm text-muted-foreground mt-3">Jangan lupa untuk merekam video minum obat sesuai jadwal Anda.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
