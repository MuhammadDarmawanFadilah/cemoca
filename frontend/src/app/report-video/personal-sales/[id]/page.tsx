"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Search,
  Video,
  MessageSquare,
  Clock,
  Link2,
  ArrowLeft,
  PartyPopper,
  Loader2,
  Download,
  Send,
} from "lucide-react";
import {
  videoReportAPI,
  VideoReportResponse,
} from "@/lib/api";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const ITEMS_PER_PAGE = 50;

type FilterType = "all" | "DONE" | "FAILED" | "PROCESSING" | "PENDING" | "wa-SENT" | "wa-PENDING" | "wa-FAILED";

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [waBlasting, setWaBlasting] = useState(false);
  const [currentReport, setCurrentReport] = useState<VideoReportResponse | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);

  // Load items with server-side pagination
  const loadItems = useCallback(async (reportId: number, pageNum: number, statusFilter: string, searchQuery: string, showLoading = true) => {
    try {
      if (showLoading) setLoadingItems(true);
      
      // Map frontend filter to backend parameters
      let backendStatus = "";
      let backendWaStatus = "";
      
      if (statusFilter.startsWith("wa-")) {
        backendWaStatus = statusFilter.replace("wa-", "");
      } else if (statusFilter !== "all") {
        backendStatus = statusFilter;
      }
      
      const reportWithItems = await videoReportAPI.getVideoReportItems(
        reportId, 
        pageNum, 
        ITEMS_PER_PAGE, 
        backendStatus,
        searchQuery,
        backendWaStatus
      );
      setCurrentReport(reportWithItems);
    } catch {
      toast.error(t("reportVideo.failedLoadDetail"));
    } finally {
      setLoadingItems(false);
    }
  }, [t]);

  useEffect(() => {
    loadReport();
  }, [id]);

  // Load items when page/filter/search changes
  useEffect(() => {
    if (currentReport?.id) {
      loadItems(currentReport.id, page, filter, search, true);
    }
  }, [page, filter, search]);

  // Auto-refresh for processing reports and pending WA
  useEffect(() => {
    if (currentReport) {
      const hasProcessing = (currentReport.processingCount ?? 0) > 0;
      const hasWaPending = (currentReport.waPendingCount ?? 0) > 0;
      const shouldAutoRefresh = currentReport.status === "PROCESSING" || hasProcessing || hasWaPending;
      if (shouldAutoRefresh) {
        const delayMs = hasProcessing ? 3000 : 7000;
        const interval = setInterval(() => refreshStatus(false), delayMs);
        return () => clearInterval(interval);
      }
    }
  }, [currentReport?.status, currentReport?.processingCount, currentReport?.waPendingCount]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const reportId = parseInt(id);
      const reportWithItems = await videoReportAPI.getVideoReportItems(reportId, 0, ITEMS_PER_PAGE, "", "");
      setCurrentReport(reportWithItems);
    } catch {
      toast.error(t("reportVideo.failedLoadDetail"));
      router.push("/report-video/personal-sales");
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async (showToast = true) => {
    if (!currentReport) return;
    try {
      setRefreshing(true);
      const updated = await videoReportAPI.refreshStatus(currentReport.id);
      await videoReportAPI.syncWaStatus(currentReport.id);
      
      // Reload current page with same filters
      let backendStatus = "";
      let backendWaStatus = "";
      if (filter.startsWith("wa-")) {
        backendWaStatus = filter.replace("wa-", "");
      } else if (filter !== "all") {
        backendStatus = filter;
      }
      
      const reportWithItems = await videoReportAPI.getVideoReportItems(
        currentReport.id, 
        page, 
        ITEMS_PER_PAGE,
        backendStatus,
        search,
        backendWaStatus
      );
      setCurrentReport({
        ...reportWithItems,
        // Keep accurate counts from refresh
        pendingCount: updated.pendingCount ?? reportWithItems.pendingCount,
        processingCount: updated.processingCount ?? reportWithItems.processingCount,
      });
      if (showToast) toast.success(t("reportVideo.statusUpdated"));
    } catch {
      if (showToast) toast.error(t("reportVideo.failedUpdate"));
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportExcel = async () => {
    if (!currentReport) return;
    try {
      setExporting(true);
      await videoReportAPI.exportToExcel(currentReport.id, currentReport.reportName);
      toast.success("Export berhasil!");
    } catch {
      toast.error("Gagal export Excel");
    } finally {
      setExporting(false);
    }
  };

  const handleStartWaBlast = async () => {
    if (!currentReport) return;
    try {
      setWaBlasting(true);
      toast.info(t("reportVideo.startingWaBlast"));
      await videoReportAPI.startWaBlast(currentReport.id);
      toast.success(t("reportVideo.waBlastStarted"));
      await refreshStatus(false);
    } catch {
      toast.error(t("reportVideo.failedResend"));
    } finally {
      setWaBlasting(false);
    }
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(0);
  };

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setPage(0);
  };

  const getStatusBadge = (status: string, timestamp?: string) => {
    const base = "text-[10px] px-1.5 py-0.5 rounded flex flex-col w-fit";
    const formatTime = (ts?: string) => {
      if (!ts) return null;
      const date = new Date(ts);
      return date.toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };
    switch (status) {
      case "DONE": return (
        <div className={`${base} bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400`}>
          <span className="flex items-center gap-0.5"><CheckCircle2 className="h-2.5 w-2.5" /> {t("reportVideo.done")}</span>
          {timestamp && <span className="text-[8px] opacity-75">{formatTime(timestamp)}</span>}
        </div>
      );
      case "FAILED": return (
        <div className={`${base} bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400`}>
          <span className="flex items-center gap-0.5"><XCircle className="h-2.5 w-2.5" /> {t("reportVideo.failed")}</span>
        </div>
      );
      case "PROCESSING": return (
        <div className={`${base} bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400`}>
          <span className="flex items-center gap-0.5"><RefreshCw className="h-2.5 w-2.5 animate-spin" /> {t("reportVideo.process")}</span>
        </div>
      );
      default: return (
        <div className={`${base} bg-slate-100 dark:bg-slate-800`}>
          <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {t("reportVideo.waiting")}</span>
        </div>
      );
    }
  };

  const getWaStatusBadge = (status: string | undefined, timestamp?: string) => {
    const base = "text-[10px] px-1.5 py-0.5 rounded flex flex-col w-fit";
    const formatTime = (ts?: string) => {
      if (!ts) return null;
      const date = new Date(ts);
      return date.toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };
    switch (status) {
      case "SENT": return (
        <div className={`${base} bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400`}>
          <span className="flex items-center gap-0.5"><CheckCircle2 className="h-2.5 w-2.5" /> {t("reportVideo.sentStatus")}</span>
          {timestamp && <span className="text-[8px] opacity-75">{formatTime(timestamp)}</span>}
        </div>
      );
      case "DELIVERED": return (
        <div className={`${base} bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400`}>
          <span className="flex items-center gap-0.5"><CheckCircle2 className="h-2.5 w-2.5" /> {t("reportVideo.sentStatus")}</span>
          {timestamp && <span className="text-[8px] opacity-75">{formatTime(timestamp)}</span>}
        </div>
      );
      case "FAILED": return (
        <div className={`${base} bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400`}>
          <span className="flex items-center gap-0.5"><XCircle className="h-2.5 w-2.5" /> {t("reportVideo.failedStatus")}</span>
        </div>
      );
      case "ERROR": return (
        <div className={`${base} bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400`}>
          <span className="flex items-center gap-0.5"><XCircle className="h-2.5 w-2.5" /> {t("reportVideo.failedStatus")}</span>
        </div>
      );
      case "PENDING": return (
        <div className={`${base} bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400`}>
          <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {t("reportVideo.pendingStatus")}</span>
        </div>
      );
      case "QUEUED":
      case "PROCESSING":
        return (
          <div className={`${base} bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400`}>
            <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {t("reportVideo.pendingStatus")}</span>
            {timestamp && <span className="text-[8px] opacity-75">{formatTime(timestamp)}</span>}
          </div>
        );
      default: return <span className={`text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800`}>-</span>;
    }
  };

  const resendWa = async (itemId: number) => {
    if (!currentReport) return;
    try {
      toast.info(t("reportVideo.resending"));
      const result = await videoReportAPI.resendWa(currentReport.id, itemId);
      if (result.success) {
        toast.success(t("reportVideo.messageSent"));
        await loadReport();
      } else {
        toast.error(result.error || t("reportVideo.failedResend"));
      }
    } catch { toast.error(t("reportVideo.failedResend")); }
  };

  const regenerateVideo = async (itemId: number) => {
    if (!currentReport) return;
    try {
      toast.info("Memulai regenerasi video...");
      const result = await videoReportAPI.regenerateVideo(currentReport.id, itemId);
      if (result.success) {
        toast.success("Video dalam antrian regenerasi. WA akan dikirim otomatis jika berhasil.");
        await loadReport();
      } else {
        toast.error(result.error || "Gagal regenerasi video");
      }
    } catch { toast.error("Gagal regenerasi video"); }
  };

  const regenerateAllFailed = async () => {
    if (!currentReport) return;
    if ((currentReport.failedCount || 0) === 0) {
      toast.error("Tidak ada video yang failed");
      return;
    }
    try {
      toast.info("Memulai regenerasi semua video yang failed...");
      const result = await videoReportAPI.regenerateAllFailedVideos(currentReport.id);
      if (result.success) {
        toast.success(result.message || `Regenerasi ${result.count} video dimulai. WA akan dikirim otomatis.`);
        await refreshStatus(false);
      } else {
        toast.error(result.error || "Gagal regenerasi video");
      }
    } catch { toast.error("Gagal regenerasi video"); }
  };

  const backToHistory = () => {
    router.push("/report-video/personal-sales");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t("reportVideo.personalSalesVideo")}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t("reportVideo.aiPersonalization")}</p>
            </div>
            <Button size="sm" variant="outline" onClick={backToHistory} className="h-8 text-xs">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> {t("reportVideo.backToHistory")}
            </Button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        </div>
      </div>
    );
  }

  if (!currentReport) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t("reportVideo.personalSalesVideo")}</h1>
            </div>
            <Button size="sm" variant="outline" onClick={backToHistory} className="h-8 text-xs">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> {t("reportVideo.backToHistory")}
            </Button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 sm:p-6 text-center py-8">
            <div className="text-slate-500">{t("reportVideo.noReportSelected")}</div>
            <Button variant="outline" size="sm" className="mt-4" onClick={backToHistory}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> {t("reportVideo.backToHistory")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const items = currentReport.items || [];
  
  // Use counts from API response (accurate from DB)
  const processingCount = currentReport.processingCount ?? 0;
  const pendingCount = currentReport.pendingCount ?? 0;
  
  // Items are already filtered server-side
  const displayItems = items;

  // Server-side pagination info
  const totalPages = currentReport.itemsTotalPages ?? 1;
  const totalElements = currentReport.itemsTotalElements ?? items.length;

  const videoFailedCount = currentReport.failedCount || 0;
  const waFailedCount = currentReport.waFailedCount || 0;
  const waPendingCount = currentReport.waPendingCount || 0;

  const waNotReadyCount = Math.max(0, (currentReport.totalRecords || 0) - (currentReport.successCount || 0));

  const hasErrors = videoFailedCount > 0 || waFailedCount > 0;
  const hasInProgress = processingCount > 0 || pendingCount > 0 || waPendingCount > 0;
  const isComplete = currentReport.status === "COMPLETED" && !hasErrors && !hasInProgress;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{currentReport.reportName}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t("reportVideo.reportDetail")}</p>
          </div>
          <div className="w-full sm:w-auto flex flex-wrap items-center justify-end gap-2">
            {(currentReport.failedCount || 0) > 0 && (
              <Button size="sm" variant="default" onClick={regenerateAllFailed} className="h-8 text-xs bg-blue-600 hover:bg-blue-700">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Regenerate Failed ({currentReport.failedCount})
              </Button>
            )}
            {(currentReport.waPendingCount || 0) > 0 && (
              <Button size="sm" variant="default" onClick={handleStartWaBlast} disabled={waBlasting} className="h-8 text-xs bg-green-600 hover:bg-green-700">
                {waBlasting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                {t("reportVideo.waBlast")} ({currentReport.waPendingCount})
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleExportExcel} disabled={exporting} className="h-8 text-xs">
              {exporting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
              Export Excel
            </Button>
            <Button size="sm" variant="outline" onClick={backToHistory} className="h-8 text-xs">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> {t("reportVideo.backToHistory")}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-3">
          {/* Success Header */}
          {hasErrors ? (
            <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/20 px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0 rounded-md bg-red-600 p-1.5">
                  <XCircle className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-red-800 dark:text-red-300">
                    Terdapat error pada proses
                  </div>
                  <div className="text-xs text-red-700/80 dark:text-red-400/80 mt-0.5">
                    {videoFailedCount > 0 ? `${videoFailedCount} video gagal generate (D-ID)` : ""}
                    {videoFailedCount > 0 && (waFailedCount > 0 || waPendingCount > 0 || waNotReadyCount > 0) ? " • " : ""}
                    {waFailedCount > 0 ? `${waFailedCount} WhatsApp gagal (Wablas)` : ""}
                    {waFailedCount > 0 && (waPendingCount > 0 || waNotReadyCount > 0) ? " • " : ""}
                    {waPendingCount > 0 ? `${waPendingCount} WhatsApp pending` : ""}
                    {waPendingCount > 0 && waNotReadyCount > 0 ? " • " : ""}
                    {waNotReadyCount > 0 ? `${waNotReadyCount} WhatsApp pending (menunggu video selesai)` : ""}
                  </div>
                  <div className="text-xs text-red-700/80 dark:text-red-400/80 mt-1">
                    {videoFailedCount > 0 ? "Klik Regenerate Failed untuk retry video yang gagal." : ""}
                    {videoFailedCount > 0 && (waFailedCount > 0 || waPendingCount > 0) ? " " : ""}
                    {waFailedCount > 0 ? "Untuk WA gagal, klik Resend WA pada item failed." : ""}
                    {(waPendingCount > 0 && videoFailedCount === 0) ? "Untuk WA pending, klik WA Blast." : ""}
                  </div>
                </div>
              </div>
            </div>
          ) : isComplete ? (
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0 rounded-md bg-emerald-600 p-1.5">
                  <PartyPopper className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{t("reportVideo.processComplete")}</div>
                  <div className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">{t("reportVideo.allVideoAndWaSent")}</div>
                </div>
              </div>
            </div>
          ) : hasInProgress ? (
            <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/20 px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0 rounded-md bg-blue-600 p-1.5">
                  <RefreshCw className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-blue-800 dark:text-blue-300">Proses sedang berjalan</div>
                  <div className="text-xs text-blue-700/80 dark:text-blue-400/80 mt-0.5">Refresh untuk melihat update terbaru.</div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Main Summary Cards */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {/* Video Status Summary */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-md bg-indigo-600 p-1.5">
                  <Video className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Status Video Generation</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total: {currentReport.totalRecords} video</p>
                </div>
              </div>
              
              {/* Video Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Progress</span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{Math.round((currentReport.processedRecords / currentReport.totalRecords) * 100)}%</span>
                </div>
                <Progress value={(currentReport.processedRecords / currentReport.totalRecords) * 100} className="h-2" />
                <div className="text-[11px] text-slate-500 mt-1">{currentReport.processedRecords} dari {currentReport.totalRecords} video diproses</div>
              </div>

              {/* Video Status Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-md bg-white dark:bg-slate-900 border border-emerald-200/70 dark:border-emerald-900/60 px-3 py-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Success
                  </div>
                  <div className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 leading-tight">{currentReport.successCount}</div>
                  <div className="text-[10px] text-slate-500">{currentReport.totalRecords > 0 ? Math.round((currentReport.successCount / currentReport.totalRecords) * 100) : 0}%</div>
                </div>

                <div className="rounded-md bg-white dark:bg-slate-900 border border-red-200/70 dark:border-red-900/60 px-3 py-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                    <XCircle className="h-3.5 w-3.5 text-red-600" /> Failed
                  </div>
                  <div className="text-lg font-semibold text-red-700 dark:text-red-400 leading-tight">{currentReport.failedCount}</div>
                  <div className="text-[10px] text-slate-500">{currentReport.totalRecords > 0 ? Math.round((currentReport.failedCount / currentReport.totalRecords) * 100) : 0}%</div>
                </div>

                <div className="rounded-md bg-white dark:bg-slate-900 border border-amber-200/70 dark:border-amber-900/60 px-3 py-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                    <RefreshCw className="h-3.5 w-3.5 text-amber-600 animate-spin" /> Processing
                  </div>
                  <div className="text-lg font-semibold text-amber-700 dark:text-amber-400 leading-tight">{processingCount}</div>
                  <div className="text-[10px] text-slate-500">Sedang diproses</div>
                </div>

                <div className="rounded-md bg-white dark:bg-slate-900 border border-blue-200/70 dark:border-blue-900/60 px-3 py-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                    <Clock className="h-3.5 w-3.5 text-blue-600" /> Pending
                  </div>
                  <div className="text-lg font-semibold text-blue-700 dark:text-blue-400 leading-tight">{pendingCount}</div>
                  <div className="text-[10px] text-slate-500">Dalam antrian</div>
                </div>
              </div>
            </div>

            {/* WhatsApp Status Summary */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-md bg-green-600 p-1.5">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Status WhatsApp Blast</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Target: {currentReport.successCount} pesan</p>
                </div>
              </div>
              
              {/* WA Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Progress</span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{currentReport.successCount > 0 ? Math.round(((currentReport.waSentCount || 0) / currentReport.successCount) * 100) : 0}%</span>
                </div>
                <Progress value={currentReport.successCount > 0 ? ((currentReport.waSentCount || 0) / currentReport.successCount) * 100 : 0} className="h-2" />
                <div className="text-[11px] text-slate-500 mt-1">{currentReport.waSentCount || 0} dari {currentReport.successCount} pesan terkirim</div>
              </div>

              {/* WA Status Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md bg-white dark:bg-slate-900 border border-green-200/70 dark:border-green-900/60 px-3 py-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Sent
                  </div>
                  <div className="text-lg font-semibold text-green-700 dark:text-green-400 leading-tight">{currentReport.waSentCount || 0}</div>
                  <div className="text-[10px] text-slate-500">{currentReport.successCount > 0 ? Math.round(((currentReport.waSentCount || 0) / currentReport.successCount) * 100) : 0}%</div>
                </div>

                <div className="rounded-md bg-white dark:bg-slate-900 border border-red-200/70 dark:border-red-900/60 px-3 py-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                    <XCircle className="h-3.5 w-3.5 text-red-600" /> Failed
                  </div>
                  <div className="text-lg font-semibold text-red-700 dark:text-red-400 leading-tight">{currentReport.waFailedCount || 0}</div>
                  <div className="text-[10px] text-slate-500">{currentReport.successCount > 0 ? Math.round(((currentReport.waFailedCount || 0) / currentReport.successCount) * 100) : 0}%</div>
                </div>

                <div className="rounded-md bg-white dark:bg-slate-900 border border-yellow-200/70 dark:border-yellow-900/60 px-3 py-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                    <Clock className="h-3.5 w-3.5 text-yellow-600" /> Pending
                  </div>
                  <div className="text-lg font-semibold text-yellow-700 dark:text-yellow-400 leading-tight">{currentReport.waPendingCount || 0}</div>
                  <div className="text-[10px] text-slate-500">Menunggu</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter & Search */}
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder={t("reportVideo.searchPlaceholder")}
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  className="pl-8 h-8 text-xs"
                />
              </div>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleSearch}>
                <Search className="h-3.5 w-3.5 mr-1" /> Cari
              </Button>
              <Select value={filter} onValueChange={(v: FilterType) => handleFilterChange(v)}>
                <SelectTrigger className="w-full sm:w-48 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">{t("reportVideo.all")} ({currentReport.totalRecords})</SelectItem>
                  <SelectItem value="DONE" className="text-xs">✓ Video {t("reportVideo.done")} ({currentReport.successCount})</SelectItem>
                  <SelectItem value="FAILED" className="text-xs">✗ Video {t("reportVideo.failed")} ({currentReport.failedCount})</SelectItem>
                  <SelectItem value="PROCESSING" className="text-xs">⟳ Video {t("reportVideo.process")} ({processingCount})</SelectItem>
                  <SelectItem value="PENDING" className="text-xs">◷ Video {t("reportVideo.waiting")} ({pendingCount})</SelectItem>
                  <SelectItem value="wa-SENT" className="text-xs">✓ WA {t("reportVideo.sentStatus")} ({currentReport.waSentCount || 0})</SelectItem>
                  <SelectItem value="wa-PENDING" className="text-xs">◷ WA {t("reportVideo.pendingStatus")} ({currentReport.waPendingCount || 0})</SelectItem>
                  <SelectItem value="wa-FAILED" className="text-xs">✗ WA {t("reportVideo.failedStatus")} ({currentReport.waFailedCount || 0})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => refreshStatus(true)} disabled={refreshing}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${refreshing ? "animate-spin" : ""}`} /> {t("reportVideo.refresh")}
            </Button>
          </div>

          {/* Results Table */}
          {loadingItems ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : displayItems.length > 0 ? (
            <>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800">
                        <TableHead className="text-[10px] font-medium w-10">#</TableHead>
                        <TableHead className="text-[10px] font-medium">{t("reportVideo.name")}</TableHead>
                        <TableHead className="text-[10px] font-medium">{t("reportVideo.phone")}</TableHead>
                        <TableHead className="text-[10px] font-medium w-24">{t("reportVideo.video")}</TableHead>
                        <TableHead className="text-[10px] font-medium w-24">WA</TableHead>
                        <TableHead className="text-[10px] font-medium">{t("reportVideo.action")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayItems.map((item, idx) => (
                        <TableRow key={item.id} className={item.status === "FAILED" || item.waStatus === "FAILED" || item.waStatus === "ERROR" ? "bg-red-50/30 dark:bg-red-950/10" : ""}>
                          <TableCell className="text-[10px] text-slate-500 font-mono">{page * ITEMS_PER_PAGE + idx + 1}</TableCell>
                          <TableCell className="text-xs font-medium">{item.name}</TableCell>
                          <TableCell className="text-xs text-slate-600">{item.phone}</TableCell>
                          <TableCell>{getStatusBadge(item.status, item.videoGeneratedAt)}</TableCell>
                          <TableCell>{getWaStatusBadge(item.waStatus, item.waSentAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {item.status === "FAILED" && (
                                <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px] text-blue-600" onClick={() => regenerateVideo(item.id)}>
                                  <RefreshCw className="h-3 w-3 mr-0.5" /> Regenerate Video
                                </Button>
                              )}
                              {item.videoUrl && (
                                <>
                                  <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px]" onClick={() => setPreviewVideo(item.videoUrl || null)}>
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px]" onClick={async () => {
                                    try {
                                      const res = await videoReportAPI.generateShareLink(currentReport.id, item.id);
                                      const link = res.shareUrl
                                        ? (res.shareUrl.startsWith("http") ? res.shareUrl : `${window.location.origin}${res.shareUrl}`)
                                        : `${window.location.origin}/v/${res.token}`;
                                      await navigator.clipboard.writeText(link);
                                      toast.success(t("reportVideo.linkCopied"));
                                    } catch { toast.error(t("reportVideo.failedCopyLink")); }
                                  }}>
                                    <Link2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                              {(item.waStatus === "FAILED" || item.waStatus === "ERROR") && item.videoUrl && (
                                <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px] text-orange-600" onClick={() => resendWa(item.id)}>
                                  <RefreshCw className="h-3 w-3 mr-0.5" /> Resend WA
                                </Button>
                              )}
                            </div>
                            {(item.errorMessage || item.waErrorMessage) && (
                              <div className="text-[10px] text-red-500 mt-0.5 line-clamp-1">
                                {item.errorMessage || item.waErrorMessage}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              {/* Server-side Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Menampilkan {page * ITEMS_PER_PAGE + 1} - {Math.min((page + 1) * ITEMS_PER_PAGE, totalElements)} dari {totalElements} data
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPage(0)} disabled={page === 0}>
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-slate-500 px-2">{page + 1} / {totalPages}</span>
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              {t("reportVideo.noDataAvailable")}
            </div>
          )}

          {/* Back Button */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={backToHistory}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> {t("reportVideo.backToHistory")}
            </Button>
            {isComplete && (
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-medium">{t("reportVideo.allComplete")}</span>
              </div>
            )}
          </div>

          {/* Video Preview Dialog */}
          <Dialog open={!!previewVideo} onOpenChange={() => setPreviewVideo(null)}>
            <DialogContent className="w-[95vw] max-w-5xl h-[90vh] p-3 flex flex-col bg-black border-slate-800">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="text-sm text-white">{t("reportVideo.previewVideo")}</DialogTitle>
              </DialogHeader>
              {previewVideo && (
                <div className="flex-1 flex items-center justify-center">
                  <video src={previewVideo} controls autoPlay className="max-w-full max-h-full rounded" />
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
