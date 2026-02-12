"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiUrl } from "@/lib/config";
import { imageAPI } from "@/lib/api";
import {
  Search,
  Calendar as CalendarIcon,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Upload,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Activity,
  Filter,
  Download,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface PatientStatus {
  userId: number;
  fullName: string;
  phoneNumber: string;
  medicationTime: string | null;
  photoPath: string | null;
  status: "SUDAH" | "BELUM" | "TERLAMBAT";
  intakeId: number | null;
  intakeTime: string | null;
  videoPath: string | null;
  intakeDate: string | null;
  late: boolean;
}

interface DailyStatusResponse {
  date: string;
  patients: PatientStatus[];
  totalPatients: number;
  sudah: number;
  terlambat: number;
  belum: number;
  sudahTerlambat: number;
}

type FilterTab = "semua" | "sudah" | "belum" | "terlambat";

export default function HistoriMinumObatPage() {
  const router = useRouter();
  const [data, setData] = useState<DailyStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("semua");

  const fetchDailyStatus = async (date: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        getApiUrl(`/intake-history/daily-status?date=${date}`),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );
      if (response.ok) {
        const result: DailyStatusResponse = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching daily status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyStatus(selectedDate);
  }, [selectedDate]);

  const filteredPatients = useMemo(() => {
    if (!data) return [];
    let patients = data.patients;

    // Filter by status tab
    if (activeFilter === "sudah") {
      patients = patients.filter(
        (p) => p.status === "SUDAH" && !p.late
      );
    } else if (activeFilter === "belum") {
      patients = patients.filter((p) => p.status === "BELUM");
    } else if (activeFilter === "terlambat") {
      patients = patients.filter(
        (p) => p.status === "TERLAMBAT" || (p.status === "SUDAH" && p.late)
      );
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      patients = patients.filter(
        (p) =>
          p.fullName?.toLowerCase().includes(q) ||
          p.phoneNumber?.toLowerCase().includes(q)
      );
    }

    return patients;
  }, [data, activeFilter, searchQuery]);

  const formatTime = (time: string | null) => {
    if (!time) return "-";
    const parts = time.split(":");
    return `${parts[0]}:${parts[1]}`;
  };

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const changeDate = (delta: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  const getStatusBadge = (patient: PatientStatus) => {
    if (patient.status === "SUDAH" && patient.late) {
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700 gap-1.5 font-medium">
          <AlertTriangle className="h-3 w-3" />
          Terlambat
        </Badge>
      );
    }
    if (patient.status === "SUDAH") {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 gap-1.5 font-medium">
          <CheckCircle2 className="h-3 w-3" />
          Sudah
        </Badge>
      );
    }
    if (patient.status === "TERLAMBAT") {
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700 gap-1.5 font-medium">
          <Clock className="h-3 w-3" />
          Terlambat
        </Badge>
      );
    }
    return (
      <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-300 dark:border-rose-700 gap-1.5 font-medium">
        <XCircle className="h-3 w-3" />
        Belum
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const stats = data
    ? {
        total: data.totalPatients,
        sudah: data.sudah - data.sudahTerlambat,
        terlambat: data.terlambat + data.sudahTerlambat,
        belum: data.belum,
      }
    : { total: 0, sudah: 0, terlambat: 0, belum: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container max-w-[1400px] mx-auto p-6 space-y-6">
        {/* Modern Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-background animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                  Monitoring Minum Obat
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  Pantau kepatuhan pengobatan pasien secara real-time
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => fetchDailyStatus(selectedDate)}
            variant="outline"
            className="gap-2 shadow-sm hover:shadow"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Date Navigator - Modern Compact Design */}
        <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => changeDate(-1)}
                className="h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-4">
                <CalendarIcon className="h-5 w-5 text-slate-400" />
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-4 py-2 text-center font-semibold text-lg rounded-lg border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  />
                </div>
                {isToday && (
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-500/20">
                    Hari Ini
                  </Badge>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => changeDate(1)}
                className="h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                disabled={isToday}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Modern Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Pasien */}
            <Card
              className={`group cursor-pointer transition-all duration-300 border-slate-200/60 dark:border-slate-800 hover:shadow-lg hover:scale-[1.02] ${
                activeFilter === "semua"
                  ? "ring-2 ring-blue-500 shadow-lg shadow-blue-500/10"
                  : "hover:border-blue-300"
              }`}
              onClick={() => setActiveFilter("semua")}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  {activeFilter === "semua" && (
                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold tracking-tight">
                    {stats.total}
                  </p>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Pasien
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Sudah Minum */}
            <Card
              className={`group cursor-pointer transition-all duration-300 border-slate-200/60 dark:border-slate-800 hover:shadow-lg hover:scale-[1.02] ${
                activeFilter === "sudah"
                  ? "ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/10"
                  : "hover:border-emerald-300"
              }`}
              onClick={() => setActiveFilter("sudah")}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                  {activeFilter === "sudah" && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                    {stats.sudah}
                  </p>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Sudah Minum
                  </p>
                  {stats.total > 0 && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      {Math.round((stats.sudah / stats.total) * 100)}% kepatuhan
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Terlambat */}
            <Card
              className={`group cursor-pointer transition-all duration-300 border-slate-200/60 dark:border-slate-800 hover:shadow-lg hover:scale-[1.02] ${
                activeFilter === "terlambat"
                  ? "ring-2 ring-amber-500 shadow-lg shadow-amber-500/10"
                  : "hover:border-amber-300"
              }`}
              onClick={() => setActiveFilter("terlambat")}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  {activeFilter === "terlambat" && (
                    <CheckCircle2 className="h-5 w-5 text-amber-500" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                    {stats.terlambat}
                  </p>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Terlambat
                  </p>
                  {stats.total > 0 && stats.terlambat > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      Perlu perhatian
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Belum Minum */}
            <Card
              className={`group cursor-pointer transition-all duration-300 border-slate-200/60 dark:border-slate-800 hover:shadow-lg hover:scale-[1.02] ${
                activeFilter === "belum"
                  ? "ring-2 ring-rose-500 shadow-lg shadow-rose-500/10"
                  : "hover:border-rose-300"
              }`}
              onClick={() => setActiveFilter("belum")}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
                    <XCircle className="h-6 w-6 text-white" />
                  </div>
                  {activeFilter === "belum" && (
                    <CheckCircle2 className="h-5 w-5 text-rose-500" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                    {stats.belum}
                  </p>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Belum Minum
                  </p>
                  {stats.total > 0 && stats.belum > 0 && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                      Perlu tindak lanjut
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search & Filter Bar */}
        <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari nama pasien atau nomor telepon..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Patient List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : filteredPatients.length === 0 ? (
          <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {searchQuery ? "Tidak ada hasil" : "Belum ada data"}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {searchQuery
                  ? "Coba kata kunci pencarian lain"
                  : "Belum ada pasien yang terdaftar"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Menampilkan <span className="text-slate-900 dark:text-white font-semibold">{filteredPatients.length}</span> pasien
              </p>
              <p className="text-xs text-slate-500">
                {formatDateDisplay(selectedDate)}
              </p>
            </div>

            {filteredPatients.map((patient) => (
              <Card
                key={patient.userId}
                className="group border-slate-200/60 dark:border-slate-800 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <Avatar className="h-14 w-14 ring-2 ring-slate-100 dark:ring-slate-800">
                        {patient.photoPath && (
                          <AvatarImage
                            src={imageAPI.getImageUrl(patient.photoPath)}
                            alt={patient.fullName}
                          />
                        )}
                        <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                          {getInitials(patient.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background ${
                          patient.status === "SUDAH" && !patient.late
                            ? "bg-emerald-500"
                            : patient.status === "TERLAMBAT" ||
                              (patient.status === "SUDAH" && patient.late)
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                      />
                    </div>

                    {/* Patient Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-base truncate text-slate-900 dark:text-white">
                          {patient.fullName}
                        </h3>
                        {getStatusBadge(patient)}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="font-medium">
                            {formatTime(patient.medicationTime)}
                          </span>
                        </span>
                        {patient.intakeTime && (
                          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Diminum {formatTime(patient.intakeTime)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {patient.videoPath && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() =>
                            router.push(
                              `/sehat/histori-minum-obat/preview/${patient.intakeId}`
                            )
                          }
                        >
                          <Play className="h-4 w-4" />
                          Video
                        </Button>
                      )}
                      {(patient.status === "BELUM" ||
                        patient.status === "TERLAMBAT") && (
                        <Button
                          size="sm"
                          className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-sm"
                          onClick={() =>
                            router.push(
                              `/sehat/histori-minum-obat/upload/${patient.userId}?date=${selectedDate}&name=${encodeURIComponent(patient.fullName)}&time=${patient.medicationTime || ""}`
                            )
                          }
                        >
                          <Upload className="h-4 w-4" />
                          Upload
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
