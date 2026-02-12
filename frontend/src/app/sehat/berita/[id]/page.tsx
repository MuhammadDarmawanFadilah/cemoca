"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { getApiUrl, config } from "@/lib/config";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Pencil, Trash2, Eye, Clock, User, Loader2, Share2, Newspaper } from "lucide-react";

interface BeritaPost {
  id: number; judul: string; ringkasan: string; konten: string; penulis: string;
  gambarUrl?: string; mediaLampiran?: string; status: string; kategori: string;
  tags?: string; jumlahView: number; jumlahLike: number; createdAt: string;
}

const fileUrl = (p?: string) => { if (!p) return null; return p.startsWith("http") ? p : `${config.baseUrl}/api/files/${p}`; };
const isVid = (p?: string) => { const e = p?.split(".").pop()?.toLowerCase(); return ["mp4","webm","ogg","mov","avi"].includes(e||""); };
const fmtDate = (d: string) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
const extractMediaPath = (mediaLampiran?: string): string | null => {
  if (!mediaLampiran) return null;
  try {
    const parsed = JSON.parse(mediaLampiran);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
  } catch {
    return mediaLampiran;
  }
};

export default function BeritaDetailPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [post, setPost] = useState<BeritaPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(getApiUrl(`/sehat/berita/${id}`), {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        });
        if (res.ok) setPost(await res.json());
        else router.push("/sehat/berita");
      } catch { router.push("/sehat/berita"); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleDelete = async () => {
    try {
      await fetch(getApiUrl(`/sehat/berita/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      toast.success("Berita dihapus");
      router.push("/sehat/berita");
    } catch { toast.error("Gagal menghapus"); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

  if (!post) return null;

  const mediaPath = extractMediaPath(post.mediaLampiran);
  const mediaUrl = fileUrl(mediaPath) || fileUrl(post.gambarUrl);
  const video = isVid(mediaPath);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6">
      {/* Mobile-optimized header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 mb-4 sm:mb-6 border-b gap-3 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push("/sehat/berita")} 
            className="gap-1 -ml-2 h-9 sm:h-8 px-2 text-sm hover:bg-accent shrink-0"
          >
            <ArrowLeft className="h-4 sm:h-3.5 w-4 sm:w-3.5" /> <span className="hidden xs:inline">Kembali</span>
          </Button>
          {post.kategori && post.kategori !== "UMUM" && (
            <Badge variant="secondary" className="text-[11px] h-5 px-2 shrink-0">{post.kategori}</Badge>
          )}
          <span className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground shrink-0">
            <Clock className="h-3 w-3" />
            <span className="hidden sm:inline">{fmtDate(post.createdAt)}</span>
            <span className="sm:hidden">{new Date(post.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
          </span>
          {post.jumlahView > 0 && (
            <span className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground shrink-0">
              <Eye className="h-3 w-3" />{post.jumlahView}
            </span>
          )}
        </div>
        {isAdmin() && (
          <div className="flex gap-1.5 justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push(`/sehat/berita/${id}/edit`)} 
              className="gap-1 h-9 sm:h-8 px-3 sm:px-2.5 text-xs"
            >
              <Pencil className="h-3.5 sm:h-3 w-3.5 sm:w-3" /> <span className="sm:inline">Edit</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1 h-9 sm:h-8 px-3 sm:px-2.5 text-xs text-red-600 hover:bg-red-50" 
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 sm:h-3 w-3.5 sm:w-3" /> <span className="sm:inline">Hapus</span>
            </Button>
          </div>
        )}
      </div>

      {/* Mobile-optimized title */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-4 sm:mb-6">{post.judul}</h1>

      {/* Mobile-optimized media */}
      {mediaUrl && (
        <div className="mb-6 sm:mb-8 rounded-lg overflow-hidden border shadow-sm bg-muted/30 -mx-3 sm:mx-0">
          {video ? (
            <video 
              controls 
              controlsList="nodownload" 
              className="w-full max-h-[400px] sm:max-h-[500px] md:max-h-[600px] object-contain bg-black"
              playsInline
              preload="metadata"
            >
              <source src={mediaUrl} type="video/mp4" />
              Browser Anda tidak mendukung video.
            </video>
          ) : (
            <img src={mediaUrl} alt={post.judul} className="w-full max-h-[400px] sm:max-h-[500px] md:max-h-[600px] object-contain" />
          )}
        </div>
      )}

      {/* Mobile-optimized content */}
      <article className="prose prose-sm sm:prose-base md:prose-lg dark:prose-invert max-w-none mb-6 sm:mb-8">
        <div className="text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-wrap text-foreground">
          {post.konten}
        </div>
      </article>

      {/* Mobile-optimized tags */}
      {post.tags && (
        <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-4 sm:pt-6 mt-4 sm:mt-6 border-t">
          {post.tags.split(",").map((t, i) => (
            <Badge key={i} variant="outline" className="text-[10px] sm:text-xs font-normal px-2 sm:px-2.5 h-5 sm:h-6 rounded-full">#{t.trim()}</Badge>
          ))}
        </div>
      )}

      {/* Delete */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus berita ini?</AlertDialogTitle>
            <AlertDialogDescription>&quot;{post.judul}&quot; akan dihapus permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
