"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Calendar, Clock, User, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { imageAPI } from "@/lib/api";

interface IntakeHistory {
  id: number;
  user: {
    id: number;
    fullName: string;
    photoPath: string;
    medicationTime: string;
  };
  intakeDate: string;
  intakeTime: string;
  videoPath: string;
  createdAt: string;
}

export default function PreviewPage() {
  const router = useRouter();
  const params = useParams();
  const intakeId = params.id as string;
  
  const [intake, setIntake] = useState<IntakeHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIntakeHistory = async () => {
      try {
        const response = await fetch(`/api/intake-history/${intakeId}`);
        if (!response.ok) {
          throw new Error("Gagal memuat data histori");
        }
        const data = await response.json();
        setIntake(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    if (intakeId) {
      fetchIntakeHistory();
    }
  }, [intakeId]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "-";
    const [hours, minutes] = timeStr.split(":");
    return `${hours}:${minutes}`;
  };

  const getStatus = () => {
    if (!intake) return "";
    const intakeTime = intake.intakeTime;
    const medicationTime = intake.user.medicationTime;
    
    if (intakeTime > medicationTime) {
      return {
        label: "Terlambat",
        color: "text-yellow-600 bg-yellow-50 border-yellow-200",
      };
    }
    return {
      label: "Tepat Waktu",
      color: "text-green-600 bg-green-50 border-green-200",
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error || !intake) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Terjadi Kesalahan</h2>
          <p className="text-gray-600 mb-4">{error || "Data tidak ditemukan"}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </Card>
      </div>
    );
  }

  const status = getStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            Preview Video Minum Obat
          </h1>
          <p className="text-gray-600 mt-1">
            Lihat detail rekaman minum obat pasien
          </p>
        </div>

        {/* Patient Info Card */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage 
                src={intake.user.photoPath ? imageAPI.getImageUrl(intake.user.photoPath) : undefined} 
              />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                {intake.user.fullName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{intake.user.fullName}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <User className="h-4 w-4" />
                <span>Pasien ID: {intake.user.id}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Tanggal</p>
                <p className="font-medium">{formatDate(intake.intakeDate)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
              <Clock className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Waktu Rekam</p>
                <p className="font-medium">{formatTime(intake.intakeTime)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
              <Clock className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Jadwal</p>
                <p className="font-medium">{formatTime(intake.user.medicationTime)}</p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${status.color}`}
            >
              {status.label}
            </span>
          </div>
        </Card>

        {/* Video Player Card */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Video className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Rekaman Video</h3>
          </div>
          
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {intake.videoPath ? (
              <video
                controls
                className="w-full h-full"
                src={`/api/files/${intake.videoPath}`}
              >
                Browser Anda tidak mendukung video player.
              </video>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm opacity-75">Video tidak tersedia</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>💡 Tips:</strong> Gunakan kontrol video untuk play/pause dan sesuaikan volume
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
