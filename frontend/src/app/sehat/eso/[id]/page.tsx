"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { getApiUrl, config } from "@/lib/config";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, Pencil, Trash2, Loader2, Video, Clock, User, AlertTriangle,
} from "lucide-react";

interface EsoPost {
  id: number; title: string; description: string; mediaPath?: string;
  mediaType?: string; author: { fullName: string }; createdAt: string;
}

const fileUrl = (p?: string) => (p ? (p.startsWith("http") ? p : `${config.baseUrl}/api/files/${p}`) : null);
const isVid = (p?: string, t?: string) => {
  if (t === "video") return true;
  const e = p?.split(".").pop()?.toLowerCase();
  return ["mp4","webm","ogg","mov","avi"].includes(e||"");
};

export default function EsoDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [post, setPost] = useState<EsoPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(getApiUrl(`/sehat/eso/${id}`), {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        });
        if (res.ok) setPost(await res.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleDelete = async () => {
    try {
      await fetch(getApiUrl(`/sehat/eso/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      toast.success("ESO dihapus");
      router.push("/sehat/eso");
    } catch { toast.error("Gagal menghapus"); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

  if (!post) return (
    <div className="text-center py-24">
      <p className="text-lg font-medium mb-4">Informasi ESO tidak ditemukan</p>
      <Button variant="outline" onClick={() => router.push("/sehat/eso")}><ArrowLeft className="mr-2 h-4 w-4" />Kembali</Button>
    </div>
  );

  const url = fileUrl(post.mediaPath);
  const video = isVid(post.mediaPath, post.mediaType);
  const formatted = new Date(post.createdAt).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6">
      {/* Mobile-optimized header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 mb-4 sm:mb-6 border-b gap-3 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push("/sehat/eso")} 
            className="gap-1 -ml-2 h-9 sm:h-8 px-2 text-sm hover:bg-accent shrink-0"
          >
            <ArrowLeft className="h-4 sm:h-3.5 w-4 sm:w-3.5" /> <span className="hidden xs:inline">Kembali</span>
          </Button>
          <Badge variant="outline" className="text-[10px] sm:text-[11px] h-5 px-1.5 sm:px-2 border-orange-300 text-orange-600 bg-orange-50 dark:bg-orange-950/30 shrink-0">
            <AlertTriangle className="h-2.5 w-2.5 mr-0.5 sm:mr-1" /> ESO
          </Badge>
          <span className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground shrink-0">
            <Clock className="h-3 w-3" />
            <span className="hidden sm:inline">{formatted}</span>
            <span className="sm:hidden">{new Date(post.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
          </span>
        </div>
        {isAdmin() && (
          <div className="flex gap-1.5 justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push(`/sehat/eso/${id}/edit`)} 
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
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-4 sm:mb-6">{post.title}</h1>

      {/* Mobile-optimized media */}
      {url && (
        <div className="mb-6 sm:mb-8 rounded-lg overflow-hidden border shadow-sm bg-muted/30 -mx-3 sm:mx-0">
          {video ? (
            <video 
              controls 
              controlsList="nodownload" 
              className="w-full max-h-[400px] sm:max-h-[500px] md:max-h-[600px] object-contain bg-black"
              playsInline
              preload="metadata"
            >
              <source src={url} type="video/mp4" />
              Browser Anda tidak mendukung video.
            </video>
          ) : (
            <img src={url} alt={post.title} className="w-full max-h-[400px] sm:max-h-[500px] md:max-h-[600px] object-contain" />
          )}
        </div>
      )}

      <article className="prose prose-sm sm:prose-base md:prose-lg dark:prose-invert max-w-none mb-6 sm:mb-8">
        <p className="text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-wrap text-foreground">{post.description}</p>
      </article>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus informasi ESO ini?</AlertDialogTitle>
            <AlertDialogDescription>&quot;{post.title}&quot; akan dihapus permanen.</AlertDialogDescription>
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
