"use client";

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
import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Eye,
  Search,
  Video,
  MessageSquare,
  Clock,
  Link2,
  ArrowLeft,
  Download,
  PartyPopper,
} from "lucide-react";
import {
  videoReportAPI,
  VideoReportResponse,
} from "@/lib/api";
import { toast } from "sonner";
import { ITEMS_PER_PAGE } from "./types";
import { useLanguage } from "@/contexts/LanguageContext";

interface Step3SummaryProps {
  currentReport: VideoReportResponse | null;
  setCurrentReport: (value: VideoReportResponse | ((prev: VideoReportResponse | null) => VideoReportResponse | null) | null) => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
  refreshStatus: () => void;
  loadReportItems: (reportId: number) => void;
  backToHistory: () => void;
}

type FilterType = "all" | "success" | "failed" | "wa-sent" | "wa-pending" | "wa-failed";

export function Step3Summary({
  currentReport,
  setCurrentReport,
  loading,
  setLoading,
  refreshStatus,
  loadReportItems,
  backToHistory,
}: Step3SummaryProps) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [previewWa, setPreviewWa] = useState<{ name: string; phone: string; message: string } | null>(null);

  const getStatusBadge = (status: string) => {
    const base = "text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 w-fit";
    switch (status) {
      case "DONE": return <span className={`${base} bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400`}><CheckCircle2 className="h-2.5 w-2.5" /> {t("reportVideo.done")}</span>;
      case "FAILED": return <span className={`${base} bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400`}><XCircle className="h-2.5 w-2.5" /> {t("reportVideo.failed")}</span>;
      case "PROCESSING": return <span className={`${base} bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400`}><RefreshCw className="h-2.5 w-2.5 animate-spin" /> {t("reportVideo.process")}</span>;
      default: return <span className={`${base} bg-slate-100 dark:bg-slate-800`}><Clock className="h-2.5 w-2.5" /> {t("reportVideo.waiting")}</span>;
    }
  };

  const getWaStatusBadge = (status: string | undefined) => {
    const base = "text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 w-fit";
    switch (status) {
      case "SENT": return <span className={`${base} bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400`}><CheckCircle2 className="h-2.5 w-2.5" /> {t("reportVideo.sentStatus")}</span>;
      case "FAILED": return <span className={`${base} bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400`}><XCircle className="h-2.5 w-2.5" /> {t("reportVideo.failedStatus")}</span>;
      case "ERROR": return <span className={`${base} bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400`}><XCircle className="h-2.5 w-2.5" /> {t("reportVideo.failedStatus")}</span>;
      case "PENDING": return <span className={`${base} bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400`}><Clock className="h-2.5 w-2.5" /> {t("reportVideo.pendingStatus")}</span>;
      default: return <span className={`${base} bg-slate-100 dark:bg-slate-800`}>-</span>;
    }
  };

  const resendWa = async (itemId: number) => {
    if (!currentReport) return;
    try {
      toast.info(t("reportVideo.resending"));
      const result = await videoReportAPI.resendWa(currentReport.id, itemId);
      if (result.success) {
        toast.success(t("reportVideo.messageSent"));
        await loadReportItems(currentReport.id);
      } else {
        toast.error(result.error || t("reportVideo.failedResend"));
      }
    } catch { toast.error(t("reportVideo.failedResend")); }
  };

  if (!currentReport) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 sm:p-6 text-center py-8">
        <div className="text-slate-500">{t("reportVideo.noReportSelected")}</div>
        <Button variant="outline" size="sm" className="mt-4" onClick={backToHistory}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> {t("reportVideo.backToHistory")}
        </Button>
      </div>
    );
  }

  const items = currentReport.items || [];
  
  // Apply filters
  let filteredItems = items;
  if (filter === "success") filteredItems = filteredItems.filter(i => i.status === "DONE");
  else if (filter === "failed") filteredItems = filteredItems.filter(i => i.status === "FAILED");
  else if (filter === "wa-sent") filteredItems = filteredItems.filter(i => i.waStatus === "SENT" || i.waStatus === "DELIVERED");
  else if (filter === "wa-pending") filteredItems = filteredItems.filter(i => i.waStatus === "PENDING" || i.waStatus === "QUEUED" || i.waStatus === "PROCESSING" || !i.waStatus);
  else if (filter === "wa-failed") filteredItems = filteredItems.filter(i => i.waStatus === "FAILED" || i.waStatus === "ERROR");

  if (search) {
    const s = search.toLowerCase();
    filteredItems = filteredItems.filter(i => i.name.toLowerCase().includes(s) || i.phone.toLowerCase().includes(s));
  }

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const isComplete = currentReport.status === "COMPLETED" && (currentReport.waSentCount || 0) === currentReport.successCount;

  return (
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <div className="bg-slate-50 dark:bg-slate-800 rounded p-3 text-center">
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{currentReport.totalRecords}</div>
          <div className="text-[10px] text-slate-500">{t("reportVideo.totalData")}</div>
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
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <Select value={filter} onValueChange={(v: FilterType) => { setFilter(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">{t("reportVideo.all")} ({items.length})</SelectItem>
              <SelectItem value="success" className="text-xs">✓ {t("reportVideo.videoSuccess")} ({currentReport.successCount})</SelectItem>
              <SelectItem value="failed" className="text-xs">✗ {t("reportVideo.videoFailed")} ({currentReport.failedCount})</SelectItem>
              <SelectItem value="wa-sent" className="text-xs">✓ {t("reportVideo.waSent")} ({currentReport.waSentCount || 0})</SelectItem>
              <SelectItem value="wa-pending" className="text-xs">◷ {t("reportVideo.waPending")} ({currentReport.waPendingCount || 0})</SelectItem>
              <SelectItem value="wa-failed" className="text-xs">✗ {t("reportVideo.waFailed")} ({currentReport.waFailedCount || 0})</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={refreshStatus} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} /> {t("reportVideo.refresh")}
        </Button>
      </div>

      {/* Results Table */}
      {paginatedItems.length > 0 ? (
        <>
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800">
                    <TableHead className="text-[10px] font-medium w-10">#</TableHead>
                    <TableHead className="text-[10px] font-medium">{t("reportVideo.name")}</TableHead>
                    <TableHead className="text-[10px] font-medium">{t("reportVideo.phone")}</TableHead>
                    <TableHead className="text-[10px] font-medium w-20">{t("reportVideo.video")}</TableHead>
                    <TableHead className="text-[10px] font-medium w-20">WA</TableHead>
                    <TableHead className="text-[10px] font-medium">{t("reportVideo.action")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map(item => (
                    <TableRow key={item.id} className={item.status === "FAILED" || item.waStatus === "FAILED" || item.waStatus === "ERROR" ? "bg-red-50/30 dark:bg-red-950/10" : ""}>
                      <TableCell className="text-[10px] text-slate-500 font-mono">{item.rowNumber}</TableCell>
                      <TableCell className="text-xs font-medium">{item.name}</TableCell>
                      <TableCell className="text-xs text-slate-600">{item.phone}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{getWaStatusBadge(item.waStatus)}</TableCell>
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
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-slate-500">{page + 1} / {totalPages}</span>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-xs text-slate-400">
          {loading ? t("common.loading") : t("reportVideo.noDataAvailable")}
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
  );
}
