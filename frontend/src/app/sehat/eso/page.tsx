"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { getApiUrl, config } from "@/lib/config";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus, Loader2, Video, Pencil, Trash2, Clock, ChevronLeft, ChevronRight,
  Play, ShieldAlert, Pill, Search, SlidersHorizontal, X, LayoutGrid, List, Calendar,
} from "lucide-react";

interface EsoPost {
  id: number; title: string; description: string; mediaPath?: string;
  mediaType?: string; author: { fullName: string }; createdAt: string;
}

const fileUrl = (p?: string) => (p ? (p.startsWith("http") ? p : `${config.baseUrl}/api/files/${p}`) : null);
const isVid = (p?: string, t?: string) => { if (t === "video") return true; const e = p?.split(".").pop()?.toLowerCase(); return ["mp4","webm","ogg","mov","avi"].includes(e||""); };
const timeAgo = (d: string) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "Baru saja";
  if (s < 3600) return `${Math.floor(s / 60)}m lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)}j lalu`;
  if (s < 604800) return `${Math.floor(s / 86400)}h lalu`;
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

export default function EsoPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<EsoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EsoPost | null>(null);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [pageSize, setPageSize] = useState(12);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const PAGE_SIZES = [12, 24, 48, 96];

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(`/sehat/eso?page=${page}&size=${pageSize}`), {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, [page, pageSize]);

  const filtered = useMemo(() => {
    let result = [...posts];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.author?.fullName?.toLowerCase().includes(q)
      );
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter(p => new Date(p.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(p => new Date(p.createdAt) <= to);
    }
    if (sort === "oldest") result.reverse();
    return result;
  }, [posts, search, sort, dateFrom, dateTo]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(getApiUrl(`/sehat/eso/${deleteTarget.id}`), { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } });
      toast.success("ESO dihapus"); setDeleteOpen(false); fetchPosts();
    } catch { toast.error("Gagal menghapus"); }
  };

  const hasActiveFilter = !!search.trim() || dateFrom || dateTo;

  /* Thumbnail - renders absolute, parent must be relative */
  const Thumb = ({ post }: { post: EsoPost }) => {
    const url = fileUrl(post.mediaPath);
    if (!url) return (
      <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-950 dark:to-orange-950 flex items-center justify-center">
        <ShieldAlert className="h-12 w-12 text-orange-300 dark:text-orange-700" />
      </div>
    );
    if (isVid(post.mediaPath, post.mediaType)) return (
      <>
        <video 
          className="absolute inset-0 w-full h-full object-cover" 
          muted 
          loop
          playsInline 
          preload="metadata"
          onMouseEnter={(e) => e.currentTarget.play()}
          onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
        >
          <source src={url} />
        </video>
        <div className="absolute inset-0 flex items-center justify-center z-[5] pointer-events-none">
          <div className="w-11 h-11 rounded-full bg-white/90 shadow-lg flex items-center justify-center">
            <Play className="h-4.5 w-4.5 text-orange-600 ml-0.5" />
          </div>
        </div>
      </>
    );
    return <img src={url} alt={post.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />;
  };

  /* Grid Card: Modern ESO card layout */
  const GridCard = ({ post }: { post: EsoPost }) => (
    <article
      className="group bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full"
      onClick={() => router.push(`/sehat/eso/${post.id}`)}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <Thumb post={post} />
        {isVid(post.mediaPath, post.mediaType) && (
          <Badge className="absolute top-2 left-2 bg-black/70 text-white border-0 gap-1 text-[10px] backdrop-blur-sm">
            <Video className="h-3 w-3" />Video
          </Badge>
        )}
        {isAdmin() && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 max-sm:opacity-100">
            <button className="p-1.5 bg-white/95 rounded-md shadow-sm hover:bg-white" onClick={(e) => { e.stopPropagation(); router.push(`/sehat/eso/${post.id}/edit`); }}>
              <Pencil className="h-3.5 w-3.5 text-gray-700" />
            </button>
            <button className="p-1.5 bg-white/95 rounded-md shadow-sm hover:bg-red-50" onClick={(e) => { e.stopPropagation(); setDeleteTarget(post); setDeleteOpen(true); }}>
              <Trash2 className="h-3.5 w-3.5 text-red-600" />
            </button>
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-medium">
            ESO
          </Badge>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />{timeAgo(post.createdAt)}
          </span>
        </div>
        <h3 className="font-bold text-sm sm:text-base leading-snug line-clamp-2 mb-2 group-hover:text-orange-600 transition-colors">
          {post.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{post.description}</p>
        <div className="flex items-center justify-between pt-2 border-t text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Pill className="h-3 w-3" />
            <span>Efek Samping Obat</span>
          </div>
        </div>
      </div>
    </article>
  );

  /* List Card: ESO feed style layout */
  const ListCard = ({ post }: { post: EsoPost }) => (
    <article
      className="group cursor-pointer bg-card border rounded-lg hover:shadow-md transition-all flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4"
      onClick={() => router.push(`/sehat/eso/${post.id}`)}
    >
      <div className="relative w-full sm:w-40 aspect-[16/10] sm:aspect-square flex-shrink-0 overflow-hidden rounded-md bg-muted">
        <Thumb post={post} />
        {isVid(post.mediaPath, post.mediaType) && (
          <Badge className="absolute top-2 left-2 bg-black/70 text-white border-0 gap-1 text-[10px]">
            <Video className="h-3 w-3" />Video
          </Badge>
        )}
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-[10px]">
              ESO
            </Badge>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />{timeAgo(post.createdAt)}
            </span>
          </div>
          {isAdmin() && (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); router.push(`/sehat/eso/${post.id}/edit`); }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={(e) => { e.stopPropagation(); setDeleteTarget(post); setDeleteOpen(true); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
        <h3 className="font-bold text-base sm:text-lg leading-tight line-clamp-2 mb-2 group-hover:text-orange-600 transition-colors">
          {post.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.description}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-auto">
          <Pill className="h-3.5 w-3.5" />
          <span>Informasi Efek Samping Obat</span>
        </div>
      </div>
    </article>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6 px-3 sm:px-4 py-4 sm:py-6">
      {/* Search & Filter Bar - Efficient & Professional */}
      <div className="bg-card border border-orange-200/50 dark:border-orange-900/30 rounded-lg shadow-sm">
        {/* Main Search Row */}
        <div className="p-2.5 sm:p-3 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground pointer-events-none" />
            <Input 
              placeholder="Cari informasi ESO..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-8 sm:pl-9 pr-8 sm:pr-9 h-9 text-sm" 
            />
            {search && (
              <button 
                onClick={() => setSearch("")} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          
          {/* Inline Filters */}
          <div className="flex gap-1.5 sm:gap-2">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-9 w-[85px] sm:w-[100px] text-[11px] sm:text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest" className="text-xs">Terbaru</SelectItem>
                <SelectItem value="oldest" className="text-xs">Terlama</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant={showFilters ? "default" : "outline"} 
              size="icon" 
              className={`h-9 w-9 shrink-0 ${showFilters ? "bg-orange-500 hover:bg-orange-600" : ""}`}
              onClick={() => setShowFilters(f => !f)}
              title="Filter"
            >
              <SlidersHorizontal className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
            </Button>
            
            <div className="hidden sm:flex border rounded-md overflow-hidden h-9">
              <button 
                onClick={() => setViewMode("grid")} 
                className={`px-2.5 transition-colors ${viewMode === "grid" ? "bg-orange-500 text-white" : "bg-background hover:bg-muted"}`} 
                title="Grid"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setViewMode("list")} 
                className={`px-2.5 transition-colors border-l ${viewMode === "list" ? "bg-orange-500 text-white" : "bg-background hover:bg-muted"}`} 
                title="List"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="px-2.5 sm:px-3 pb-2.5 sm:pb-3 pt-0 border-t border-orange-200/50 dark:border-orange-900/30 bg-orange-50/30 dark:bg-orange-950/10">
            <div className="grid grid-cols-2 gap-2 mt-2.5 sm:mt-3">
              <Input 
                type="date" 
                value={dateFrom} 
                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }} 
                className="h-8 text-[11px] sm:text-xs" 
                placeholder="Dari"
              />
              <Input 
                type="date" 
                value={dateTo} 
                onChange={(e) => { setDateTo(e.target.value); setPage(0); }} 
                className="h-8 text-[11px] sm:text-xs" 
                placeholder="Ke"
              />
            </div>
          </div>
        )}

        {/* Active Filters */}
        {hasActiveFilter && (
          <div className="px-2.5 sm:px-3 pb-2 sm:pb-2.5 flex items-center gap-1.5 flex-wrap border-t border-orange-200/50 dark:border-orange-900/30 pt-2 sm:pt-2.5 bg-orange-50/20 dark:bg-orange-950/5">
            <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Filter:</span>
            {search.trim() && (
              <Badge variant="secondary" className="h-5 text-[9px] sm:text-[10px] gap-1 cursor-pointer hover:bg-destructive/20" onClick={() => setSearch("")}>
                {search} <X className="h-2.5 w-2.5" />
              </Badge>
            )}
            {dateFrom && (
              <Badge variant="secondary" className="h-5 text-[10px] gap-1 cursor-pointer hover:bg-destructive/20" onClick={() => setDateFrom("")}>
                {dateFrom} <X className="h-2.5 w-2.5" />
              </Badge>
            )}
            {dateTo && (
              <Badge variant="secondary" className="h-5 text-[10px] gap-1 cursor-pointer hover:bg-destructive/20" onClick={() => setDateTo("")}>
                {dateTo} <X className="h-2.5 w-2.5" />
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); }} 
              className="h-5 px-2 text-[10px] ml-auto"
            >
              Reset Semua
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p className="text-sm">Memuat informasi ESO...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center mb-4">
            <ShieldAlert className="h-8 w-8 text-orange-300 dark:text-orange-700" />
          </div>
          <p className="font-semibold text-lg mb-2">{hasActiveFilter ? "Tidak ada hasil" : "Belum ada informasi ESO"}</p>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            {hasActiveFilter ? "Coba ubah kata kunci atau filter yang digunakan" : "Informasi efek samping obat akan muncul di sini"}
          </p>
          {hasActiveFilter ? (
            <Button variant="outline" onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); }}>Hapus Semua Filter</Button>
          ) : isAdmin() ? (
            <Button onClick={() => router.push("/sehat/eso/create")} className="gap-2 bg-orange-600 hover:bg-orange-700"><Plus className="h-4 w-4" /> Tulis ESO Baru</Button>
          ) : null}
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-3">
          {filtered.map(p => <ListCard key={p.id} post={p} />)}
        </div>
      ) : (
        /* Grid 3 columns - optimal for readability */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map(p => <GridCard key={p.id} post={p} />)}
        </div>
      )}

      {/* Pagination - Always visible */}
      {!loading && posts.length > 0 && (
        <div className="bg-card border border-orange-200/50 dark:border-orange-900/30 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Tampilkan:</span>
              <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map(size => (
                    <SelectItem key={size} value={size.toString()}>{size} item</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="gap-1.5">
                <ChevronLeft className="h-4 w-4" /><span className="hidden sm:inline">Sebelumnya</span>
              </Button>
              <div className="px-3 py-1.5 text-sm font-medium bg-muted rounded-md">
                {page + 1} / {totalPages}
              </div>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="gap-1.5">
                <span className="hidden sm:inline">Selanjutnya</span><ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus informasi ESO ini?</AlertDialogTitle>
            <AlertDialogDescription>&quot;{deleteTarget?.title}&quot; akan dihapus permanen.</AlertDialogDescription>
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

