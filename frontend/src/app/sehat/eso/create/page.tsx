"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/config";
import {
  ArrowLeft, Upload, X, Loader2, ImageIcon, Video, FileText,
} from "lucide-react";

export default function EsoCreatePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const pick = (f: File | null) => {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && (f.type.startsWith("image/") || f.type.startsWith("video/"))) pick(f);
    else toast.error("Format tidak didukung");
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) { toast.error("Judul dan deskripsi wajib diisi"); return; }
    setSubmitting(true);
    try {
      let mediaPath = "", mediaType = "";
      if (file) {
        const fd = new FormData(); fd.append("file", file);
        const ep = file.type.startsWith("video") ? "/upload/video" : "/upload/image";
        const up = await fetch(getApiUrl(ep), { method: "POST", body: fd, headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } });
        if (!up.ok) throw new Error("Upload gagal");
        const d = await up.json();
        mediaPath = d.filename; mediaType = file.type.startsWith("video") ? "video" : "image";
      }
      const res = await fetch(getApiUrl("/sehat/eso"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        body: JSON.stringify({ title, description, mediaPath, mediaType }),
      });
      if (!res.ok) throw new Error();
      toast.success("ESO berhasil diposting");
      router.push("/sehat/eso");
    } catch { toast.error("Gagal menyimpan ESO"); }
    finally { setSubmitting(false); }
  };

  const isVideo = file?.type.startsWith("video");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/sehat/eso")}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">Tulis Informasi ESO</h1>
          <p className="text-sm text-muted-foreground">Buat informasi baru tentang Efek Samping Obat</p>
        </div>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Judul <span className="text-red-500">*</span></Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Masukkan judul informasi ESO..." className="text-lg h-12" maxLength={200} />
          <p className="text-xs text-muted-foreground text-right">{title.length}/200</p>
        </div>

        {/* Media */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Media (Foto/Video)</Label>
          {preview ? (
            <div className="relative rounded-xl overflow-hidden border bg-muted/30">
              {isVideo ? (
                <video src={preview} controls className="w-full max-h-80 object-contain bg-black" />
              ) : (
                <img src={preview} alt="" className="w-full max-h-80 object-contain" />
              )}
              <Button variant="destructive" size="icon" className="absolute top-3 right-3 h-8 w-8 rounded-full shadow-lg" onClick={() => pick(null)}>
                <X className="h-4 w-4" />
              </Button>
              <div className="p-3 bg-muted/50 border-t flex items-center gap-2 text-xs text-muted-foreground">
                {isVideo ? <Video className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                <span className="truncate">{file?.name}</span>
                <span className="ml-auto">{((file?.size || 0) / 1024 / 1024).toFixed(1)} MB</span>
              </div>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragOver ? "border-orange-400 bg-orange-50/50 dark:bg-orange-950/20" : "hover:border-orange-300 hover:bg-muted/30"}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="font-medium text-sm mb-1">Klik atau seret file ke sini</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, MP4, WebM (maks 50MB)</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => pick(e.target.files?.[0] || null)} />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Deskripsi <span className="text-red-500">*</span></Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tulis informasi detail tentang Efek Samping Obat..." rows={12} className="resize-none leading-relaxed" />
          <p className="text-xs text-muted-foreground text-right flex items-center justify-end gap-1"><FileText className="h-3 w-3" />{description.length} karakter</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 border-t">
          <Button variant="outline" onClick={() => router.push("/sehat/eso")} disabled={submitting}>Batal</Button>
          <Button onClick={handleSubmit} disabled={submitting || !title.trim() || !description.trim()} className="bg-orange-600 hover:bg-orange-700 gap-1.5">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Posting ESO
          </Button>
        </div>
      </div>
    </div>
  );
}
