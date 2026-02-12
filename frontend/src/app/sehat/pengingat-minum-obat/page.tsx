"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/config";
import {
  CheckCircle2, Clock, Video, Upload, Loader2, AlertCircle, Pill,
  CircleDot, Square, RotateCcw, ChevronRight, Timer, Play, RefreshCw,
  Calendar, User as UserIcon, FileVideo,
} from "lucide-react";
// RotateCcw kept for retake recording button
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Verifikasi", icon: Clock },
  { id: 2, label: "Rekam", icon: Video },
  { id: 3, label: "Selesai", icon: CheckCircle2 },
];

export default function PengingatMinumObatPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [currentTime, setCurrentTime] = useState("");
  const [canProceed, setCanProceed] = useState(false);
  const [hasIntakeToday, setHasIntakeToday] = useState(false);
  const [medicationTime, setMedicationTime] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isReupload, setIsReupload] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [todayIntake, setTodayIntake] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkIntakeStatus = useCallback(async () => {
    setCheckingStatus(true);
    try {
      const response = await fetch(getApiUrl("/intake-history/check-today"), {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCanProceed(data.canTakeNow && !data.hasIntakeToday);
        setHasIntakeToday(data.hasIntakeToday);
        setMedicationTime(data.medicationTime || "");
        setTodayIntake(data.todayIntake || null);
        if (data.hasIntakeToday) setStep(3);
      }
    } catch {
      console.error("Error checking intake status");
    } finally {
      setCheckingStatus(false);
    }
  }, []);

  useEffect(() => { checkIntakeStatus(); }, [checkIntakeStatus]);

  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const formatTimer = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: true });
      if (videoRef.current) { videoRef.current.srcObject = stream; }
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setRecordedBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
        if (videoRef.current) { videoRef.current.srcObject = null; videoRef.current.src = URL.createObjectURL(blob); }
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordedBlob(null);
    } catch {
      toast.error("Gagal mengakses kamera. Pastikan izin kamera aktif.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const retakeRecording = () => {
    setRecordedBlob(null);
    if (videoRef.current) { videoRef.current.src = ""; videoRef.current.srcObject = null; }
  };

  const cancelReupload = () => {
    setIsReupload(false);
    setRecordedBlob(null);
    if (videoRef.current) { videoRef.current.src = ""; videoRef.current.srcObject = null; }
    setStep(3);
  };

  const uploadAndSave = async () => {
    if (!recordedBlob) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", recordedBlob, `intake_${Date.now()}.webm`);
      const uploadResponse = await fetch(getApiUrl("/upload/video"), {
        method: "POST", body: formData,
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!uploadResponse.ok) throw new Error("Upload video gagal");
      const uploadData = await uploadResponse.json();

      const endpoint = isReupload ? "/intake-history/replace-today" : "/intake-history";
      const method = isReupload ? "PUT" : "POST";

      const saveResponse = await fetch(getApiUrl(endpoint), {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        body: JSON.stringify({
          userId: user?.id,
          intakeDate: new Date().toISOString().split("T")[0],
          intakeTime: new Date().toTimeString().split(" ")[0],
          videoPath: uploadData.filename,
        }),
      });
      if (!saveResponse.ok) throw new Error("Gagal menyimpan histori");

      const savedData = await saveResponse.json();
      setTodayIntake(savedData);
      setHasIntakeToday(true);
      setIsReupload(false);
      setRecordedBlob(null);
      setStep(3);
      toast.success(isReupload ? "Video berhasil diganti!" : "Rekaman berhasil disimpan!");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleReupload = () => {
    setIsReupload(true);
    setRecordedBlob(null);
    setShowPreview(false);
    setStep(2);
  };

  const medTimeFormatted = medicationTime
    ? typeof medicationTime === "string" ? medicationTime.substring(0, 5) : String(medicationTime)
    : "--:--";

  const todayVideoUrl = todayIntake?.videoPath
    ? getApiUrl(`/files/${todayIntake.videoPath}`)
    : null;

  const todayTimeRecorded = todayIntake?.intakeTime
    ? typeof todayIntake.intakeTime === "string" ? todayIntake.intakeTime.substring(0, 5) : String(todayIntake.intakeTime)
    : null;

  return (
    <div className="h-[calc(100vh-3.5rem)] bg-gradient-to-b from-background to-muted/30 flex flex-col overflow-hidden">
      <div className="w-full max-w-5xl mx-auto px-4 pt-3 pb-2 flex flex-col flex-1 min-h-0">

        {/* Header + Stepper compact row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Pill className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight leading-tight">Pengingat Minum Obat</h1>
              <p className="text-[10px] text-muted-foreground leading-tight">Rekam bukti minum obat harian</p>
            </div>
          </div>

          {/* Stepper inline */}
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isDone = step > s.id || (step === 3 && s.id === 3);
              return (
                <div key={s.id} className="flex items-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                      isDone ? "bg-primary border-primary text-primary-foreground" :
                      isActive ? "bg-primary/10 border-primary text-primary" :
                      "bg-muted border-muted-foreground/20 text-muted-foreground"
                    )}>
                      {isDone && s.id !== step ? <CheckCircle2 className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                    </div>
                    <span className={cn(
                      "text-[9px] font-medium",
                      isActive || isDone ? "text-primary" : "text-muted-foreground"
                    )}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn(
                      "w-8 h-0.5 mx-0.5 mb-3 rounded-full transition-all duration-300",
                      step > s.id ? "bg-primary" : "bg-muted-foreground/20"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1: Verifikasi Waktu */}
        {step === 1 && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-md mx-auto space-y-5">
              {/* Clock display - hero style */}
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 text-muted-foreground mb-2">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">Waktu Saat Ini</span>
                </div>
                <p className="text-5xl md:text-6xl font-bold font-mono tracking-tight text-foreground tabular-nums">{currentTime}</p>
              </div>

              {/* Schedule card */}
              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 flex items-center justify-center shrink-0">
                      <Timer className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground font-medium">Jadwal Minum Obat</p>
                      <p className="text-xl font-bold font-mono tracking-wide">{medTimeFormatted}</p>
                    </div>
                    <Badge variant={canProceed ? "default" : "secondary"} className={cn(
                      "text-[10px] px-2.5 py-0.5 shrink-0",
                      canProceed
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                        : hasIntakeToday
                          ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20"
                          : ""
                    )}>
                      {canProceed ? "Tersedia" : hasIntakeToday ? "Selesai" : "Belum Waktunya"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Status + Action */}
              {checkingStatus ? (
                <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Memeriksa jadwal...</span>
                </div>
              ) : canProceed ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      Waktu minum obat sudah tiba. Silakan lanjut merekam video bukti.
                    </p>
                  </div>
                  <Button onClick={() => setStep(2)} className="w-full h-11 gap-2 text-sm rounded-xl shadow-sm">
                    Lanjut Rekam Video
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {hasIntakeToday
                      ? "Anda sudah merekam minum obat hari ini."
                      : "Belum waktunya minum obat. Silakan kembali sesuai jadwal."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Rekam Video */}
        {step === 2 && (
          <Card className="border shadow-sm overflow-hidden flex-1 flex flex-col">
            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
              {/* Re-upload banner */}
              {isReupload && (
                <div className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
                  <RefreshCw className="w-3 h-3 text-amber-600 shrink-0" />
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 flex-1">
                    Mode upload ulang — rekaman baru menggantikan yang lama setelah disimpan.
                  </p>
                  <Button onClick={cancelReupload} variant="ghost" size="sm" className="h-5 text-[9px] px-1.5 text-amber-700 hover:text-amber-800">
                    Batal
                  </Button>
                </div>
              )}

              {/* Video Area - flexible height */}
              <div className="relative bg-black flex-1 min-h-0 overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay={isRecording}
                  playsInline
                  muted={isRecording}
                  controls={!!recordedBlob && !isRecording}
                  className="w-full h-full object-cover"
                />

                {isRecording && (
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600 text-white px-2 py-0.5 rounded-full">
                    <CircleDot className="w-2.5 h-2.5 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold">{formatTimer(recordingTime)}</span>
                  </div>
                )}

                {!isRecording && !recordedBlob && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 text-muted-foreground gap-1.5">
                    <Video className="w-8 h-8 opacity-40" />
                    <p className="text-[10px]">Tekan tombol untuk mulai merekam</p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="p-2.5 space-y-1.5 shrink-0">
                <div className="flex items-center justify-center gap-2">
                  {!isRecording && !recordedBlob && (
                    <Button onClick={startRecording} className="gap-1.5 h-9 px-5 rounded-full bg-red-600 hover:bg-red-700 text-xs">
                      <CircleDot className="w-3.5 h-3.5" />
                      Mulai Rekam
                    </Button>
                  )}
                  {isRecording && (
                    <Button onClick={stopRecording} variant="destructive" className="gap-1.5 h-9 px-5 rounded-full text-xs">
                      <Square className="w-3 h-3 fill-current" />
                      Berhenti
                    </Button>
                  )}
                  {recordedBlob && !loading && (
                    <>
                      <Button onClick={retakeRecording} variant="outline" className="gap-1.5 h-9 rounded-full text-xs">
                        <RotateCcw className="w-3.5 h-3.5" />
                        Ulang
                      </Button>
                      <Button onClick={uploadAndSave} className="gap-1.5 h-9 px-5 rounded-full text-xs">
                        <Upload className="w-3.5 h-3.5" />
                        {isReupload ? "Ganti & Simpan" : "Simpan"}
                      </Button>
                    </>
                  )}
                  {loading && (
                    <Button disabled className="gap-1.5 h-9 px-5 rounded-full text-xs">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </Button>
                  )}
                </div>
                <p className="text-[9px] text-center text-muted-foreground">
                  {isRecording ? "Rekam video sedang minum obat, lalu tekan berhenti" :
                   recordedBlob ? "Tinjau video. Ulangi jika perlu, atau simpan." :
                   "Pastikan wajah dan obat terlihat jelas"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Selesai */}
        {step === 3 && (
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            {/* Success banner compact */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 shrink-0">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold">Berhasil Tercatat!</h2>
                <p className="text-[10px] text-muted-foreground">Rekaman minum obat hari ini tersimpan.</p>
              </div>
              <Badge className="text-[9px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 shrink-0">
                Tercatat
              </Badge>
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 flex-1 min-h-0">
              {/* Video Preview - takes more space */}
              <Card className="border shadow-sm overflow-hidden md:col-span-3 flex flex-col">
                <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                  <div className="px-3 py-1.5 border-b bg-muted/30 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-1.5">
                      <FileVideo className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] font-medium">Rekaman Hari Ini</span>
                    </div>
                    {todayTimeRecorded && (
                      <span className="text-[9px] text-muted-foreground font-mono">Direkam {todayTimeRecorded}</span>
                    )}
                  </div>

                  {todayVideoUrl ? (
                    <>
                      {showPreview ? (
                        <div className="relative bg-black flex-1 min-h-0 overflow-hidden">
                          <video
                            src={todayVideoUrl}
                            controls
                            playsInline
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowPreview(true)}
                          className="relative w-full flex-1 min-h-[200px] bg-gradient-to-br from-muted/50 to-muted overflow-hidden group cursor-pointer border-0"
                        >
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                            </div>
                            <p className="text-[10px] text-muted-foreground font-medium">Klik untuk memutar</p>
                          </div>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex-1 min-h-[200px] flex flex-col items-center justify-center bg-muted/30 text-muted-foreground gap-1.5">
                      <Video className="w-7 h-7 opacity-30" />
                      <p className="text-[10px]">Video tidak tersedia</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Info + Action panel */}
              <div className="md:col-span-2 flex flex-col gap-3">
                <Card className="border shadow-sm overflow-hidden flex-1">
                  <CardContent className="p-0">
                    <div className="divide-y">
                      <div className="flex items-center gap-2.5 px-3 py-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                          <UserIcon className="w-3 h-3 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] text-muted-foreground">Pasien</p>
                          <p className="text-xs font-semibold truncate">{user?.fullName || "-"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 px-3 py-2.5">
                        <div className="w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                          <Calendar className="w-3 h-3 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] text-muted-foreground">Tanggal</p>
                          <p className="text-xs font-semibold">{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 px-3 py-2.5">
                        <div className="w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                          <Timer className="w-3 h-3 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] text-muted-foreground">Jadwal</p>
                          <p className="text-xs font-semibold font-mono">{medTimeFormatted}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button onClick={handleReupload} variant="outline" className="w-full h-9 text-xs gap-2 shrink-0">
                  <RefreshCw className="w-3 h-3" />
                  Upload Ulang Video
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
