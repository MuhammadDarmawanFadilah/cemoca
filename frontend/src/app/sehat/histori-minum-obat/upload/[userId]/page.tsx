"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Upload, User, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { imageAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface UserData {
  id: number;
  fullName: string;
  photoPath: string;
  medicationTime: string;
}

export default function UploadManualPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const userId = params.userId as string;
  const dateParam = searchParams.get("date");
  
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [intakeDate, setIntakeDate] = useState(dateParam || new Date().toISOString().split("T")[0]);
  const [intakeTime, setIntakeTime] = useState(new Date().toTimeString().split(" ")[0].substring(0, 5));

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error("Gagal memuat data pasien");
        }
        const data = await response.json();
        setUser(data);
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Terjadi kesalahan",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId, toast]);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        toast({
          title: "Error",
          description: "File harus berupa video",
          variant: "destructive",
        });
        return;
      }
      
      // Max 100MB
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Ukuran video maksimal 100MB",
          variant: "destructive",
        });
        return;
      }
      
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!videoFile) {
      toast({
        title: "Error",
        description: "Pilih video terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      // Upload video first
      const formData = new FormData();
      formData.append("file", videoFile);
      
      const uploadResponse = await fetch("/api/upload/video", {
        method: "POST",
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error("Gagal upload video");
      }
      
      const uploadData = await uploadResponse.json();
      const videoPath = uploadData.filename;
      
      // Save intake history
      const intakeResponse = await fetch("/api/intake-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: parseInt(userId),
          intakeDate,
          intakeTime: intakeTime + ":00",
          videoPath,
        }),
      });
      
      if (!intakeResponse.ok) {
        throw new Error("Gagal menyimpan histori");
      }
      
      toast({
        title: "Berhasil",
        description: "Video berhasil diupload",
      });
      
      router.push("/sehat/histori-minum-obat");
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Pasien Tidak Ditemukan</h2>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </Card>
      </div>
    );
  }

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
            Upload Manual Video Minum Obat
          </h1>
          <p className="text-gray-600 mt-1">
            Upload video minum obat untuk pasien yang dilakukan secara offline
          </p>
        </div>

        {/* Patient Info Card */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage 
                src={user.photoPath ? imageAPI.getImageUrl(user.photoPath) : undefined} 
              />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                {user.fullName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{user.fullName}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>ID: {user.id}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Jadwal: {user.medicationTime?.substring(0, 5) || "-"}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Upload Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="intakeDate">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Tanggal
                </Label>
                <Input
                  id="intakeDate"
                  type="date"
                  value={intakeDate}
                  onChange={(e) => setIntakeDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="intakeTime">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Waktu
                </Label>
                <Input
                  id="intakeTime"
                  type="time"
                  value={intakeTime}
                  onChange={(e) => setIntakeTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Video Upload */}
            <div className="space-y-2">
              <Label htmlFor="videoFile">
                <Video className="inline h-4 w-4 mr-1" />
                Video Minum Obat
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <input
                  id="videoFile"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                />
                <label
                  htmlFor="videoFile"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-12 w-12 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    {videoFile ? videoFile.name : "Klik untuk pilih video (Max 100MB)"}
                  </span>
                </label>
              </div>
            </div>

            {/* Video Preview */}
            {videoPreview && (
              <div className="space-y-2">
                <Label>Preview Video</Label>
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    controls
                    className="w-full h-full"
                    src={videoPreview}
                  >
                    Browser Anda tidak mendukung video player.
                  </video>
                </div>
              </div>
            )}

            {/* Info Alert */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>ℹ️ Informasi:</strong> Video yang diupload akan disimpan sebagai histori minum obat untuk pasien ini pada tanggal dan waktu yang ditentukan.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={uploading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={uploading || !videoFile}>
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Video
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
