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

  // Auto-refresh for processing reports
  useEffect(() => {
    if (currentReport) {
      const hasProcessing = currentReport.processingCount && currentReport.processingCount > 0;
      if (currentReport.status === "PROCESSING" || hasProcessing) {
        const interval = setInterval(() => refreshStatus(false), 3000);
        return () => clearInterval(interval);
      }
    }
  }, [currentReport?.status, currentReport?.processingCount]);

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

  const backToHistory = () => {
    router.push("/report-video/personal-sales");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t("reportVideo.personalSalesVideo")}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t("reportVideo.aiPersonalization")}</p>
            </div>
            <Button size="sm" variant="outline" onClick={backToHistory} className="h-8 text-xs">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> {t("reportVideo.backToHistory")}
            </Button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t("reportVideo.personalSalesVideo")}</h1>
            </div>
            <Button size="sm" variant="outline" onClick={backToHistory} className="h-8 text-xs">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> {t("reportVideo.backToHistory")}
            </Button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
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

  const isComplete = currentReport.status === "COMPLETED" && (currentReport.waSentCount || 0) === currentReport.successCount;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{currentReport.reportName}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t("reportVideo.reportDetail")}</p>
          </div>
          <div className="flex items-center gap-2">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4">
          {/* Success Header */}
          {isComplete && (
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-lg p-4 text-center border border-emerald-200 dark:border-emerald-800">
              <PartyPopper className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
              <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">{t("reportVideo.processComplete")}</h3>
              <p className="text-sm text-emerald-600 dark:text-emerald-500">{t("reportVideo.allVideoAndWaSent")}</p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            <div className="bg-slate-50 dark:bg-slate-800 rounded p-3 text-center">
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{currentReport.totalRecords}</div>
              <div className="text-[10px] text-slate-500">{t("reportVideo.totalData")}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded p-3 text-center">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{pendingCount}</div>
              <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                <Video className="h-3 w-3" /> Video Pending
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded p-3 text-center">
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{processingCount}</div>
              <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                <Video className="h-3 w-3" /> Video Proses
              </div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded p-3 text-center">
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{currentReport.successCount}</div>
              <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                <Video className="h-3 w-3" /> {t("reportVideo.videoSuccess")}
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 rounded p-3 text-center">
              <div className="text-xl font-bold text-red-600 dark:text-red-400">{currentReport.failedCount}</div>
              <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                <Video className="h-3 w-3" /> {t("reportVideo.videoFailed")}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-950/30 rounded p-3 text-center">
              <div className="text-xl font-bold text-green-600 dark:text-green-400">{currentReport.waSentCount || 0}</div>
              <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                <MessageSquare className="h-3 w-3" /> {t("reportVideo.waSent")}
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded p-3 text-center">
              <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{currentReport.waPendingCount || 0}</div>
              <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                <MessageSquare className="h-3 w-3" /> {t("reportVideo.waPending")}
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 rounded p-3 text-center">
              <div className="text-xl font-bold text-red-600 dark:text-red-400">{currentReport.waFailedCount || 0}</div>
              <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                <MessageSquare className="h-3 w-3" /> {t("reportVideo.waFailed")}
              </div>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>{t("reportVideo.videoProgress")}</span>
                <span>{Math.round((currentReport.processedRecords / currentReport.totalRecords) * 100)}%</span>
              </div>
              <Progress value={(currentReport.processedRecords / currentReport.totalRecords) * 100} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>{t("reportVideo.waProgress")}</span>
                <span>{currentReport.successCount > 0 ? Math.round(((currentReport.waSentCount || 0) / currentReport.successCount) * 100) : 0}%</span>
              </div>
              <Progress value={currentReport.successCount > 0 ? ((currentReport.waSentCount || 0) / currentReport.successCount) * 100 : 0} className="h-2" />
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
                              {item.videoUrl && (
                                <>
                                  <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px]" onClick={() => setPreviewVideo(item.videoUrl || null)}>
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px]" onClick={async () => {
                                    try {
                                      const res = await videoReportAPI.generateShareLink(currentReport.id, item.id);
                                      await navigator.clipboard.writeText(`${window.location.origin}/v/${res.token}`);
                                      toast.success(t("reportVideo.linkCopied"));
                                    } catch { toast.error(t("reportVideo.failedCopyLink")); }
                                  }}>
                                    <Link2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                              {(item.waStatus === "FAILED" || item.waStatus === "ERROR") && item.videoUrl && (
                                <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px] text-orange-600" onClick={() => resendWa(item.id)}>
                                  <RefreshCw className="h-3 w-3 mr-0.5" /> {t("reportVideo.resend")}
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
