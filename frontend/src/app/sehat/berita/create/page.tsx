"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { getApiUrl, config } from "@/lib/config";
import { ArrowLeft, Loader2, Upload, X, ImageIcon, Video, FileText } from "lucide-react";

export default function CreateBeritaPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFile = (file: File | null) => {
    setMediaFile(file);
    setMediaPreview(file ? URL.createObjectURL(file) : null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith("image/") || file.type.startsWith("video/"))) pickFile(file);
  }, []);

  const uploadMedia = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const ep = file.type.startsWith("video") ? "/upload/video" : "/upload/image";
    const res = await fetch(getApiUrl(ep), { method: "POST", body: fd, headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } });
    if (!res.ok) throw new Error("Upload gagal");
    const data = await res.json();
    return { filename: data.filename, type: file.type.startsWith("video") ? "video" : "image" };
  };

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error("Judul harus diisi"); return; }
    if (!content.trim()) { toast.error("Konten harus diisi"); return; }
    setSubmitting(true);
    try {
      let mediaPath = "";
      let mediaType = "";
      if (mediaFile) {
        const m = await uploadMedia(mediaFile);
        mediaPath = m.filename;
        mediaType = m.type;
      }
      const res = await fetch(getApiUrl("/sehat/berita"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        body: JSON.stringify({ title, description: content, mediaPath, mediaType }),
      });
      if (!res.ok) throw new Error();
      toast.success("Berita berhasil diposting!");
      router.push("/sehat/berita");
    } catch { toast.error("Gagal menyimpan berita"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => router.push("/sehat/berita")} className="gap-1.5 -ml-2 mb-6">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Button>

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tulis Berita Baru</h1>
        <p className="text-sm text-muted-foreground mt-1">Buat dan publikasikan berita kesehatan</p>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Judul Berita <span className="text-red-500">*</span></Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tuliskan judul berita yang menarik..."
            className="text-lg h-12"
          />
        </div>

        {/* Media upload */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Foto / Video</Label>
          {mediaPreview ? (
            <Card className="overflow-hidden">
              <div className="relative">
                {mediaFile?.type.startsWith("video") ? (
                  <video src={mediaPreview} controls className="w-full max-h-80 object-contain bg-black rounded-t-lg" />
                ) : (
                  <img src={mediaPreview} alt="" className="w-full max-h-80 object-cover rounded-t-lg" />
                )}
                <Button variant="destructive" size="icon" className="absolute top-3 right-3 h-8 w-8 shadow-lg" onClick={() => pickFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  {mediaFile?.type.startsWith("video") ? <Video className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                  {mediaFile?.name} ({(mediaFile!.size / 1024 / 1024).toFixed(1)} MB)
                </p>
              </CardContent>
            </Card>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30"}`}
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="font-medium text-sm mb-1">Klik atau seret file ke sini</p>
              <p className="text-xs text-muted-foreground">Mendukung JPG, PNG, GIF, MP4, WebM (maks. 50MB)</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0] || null)} />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Konten Berita <span className="text-red-500">*</span></Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tulis konten berita lengkap di sini..."
            rows={14}
            className="leading-relaxed resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">{content.length} karakter</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => router.push("/sehat/berita")} disabled={submitting}>Batal</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="min-w-[120px]">
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : <><FileText className="mr-2 h-4 w-4" />Publikasikan</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
