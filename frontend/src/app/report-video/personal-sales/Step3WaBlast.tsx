"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Eye,
  Search,
  Send,
  Clock,
  RotateCcw,
  MessageSquare,
} from "lucide-react";
import {
  videoReportAPI,
  VideoReportResponse,
} from "@/lib/api";
import { ITEMS_PER_PAGE } from "./types";
import { useLanguage } from "@/contexts/LanguageContext";

interface Step3WaBlastProps {
  currentReport: VideoReportResponse | null;
  setCurrentReport: (value: VideoReportResponse | ((prev: VideoReportResponse | null) => VideoReportResponse | null) | null) => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
  itemsPage: number;
  setItemsPage: (value: number | ((p: number) => number)) => void;
  itemsSearch: string;
  setItemsSearch: (value: string) => void;
  setStep: (step: 1 | 2 | 3) => void;
  refreshStatus: () => void;
  loadReportItems: (reportId: number) => void;
}

type WaFilterType = "all" | "sent" | "pending" | "failed";

export function Step3WaBlast({
  currentReport,
  setCurrentReport,
  loading,
  setLoading,
  itemsPage,
  setItemsPage,
  itemsSearch,
  setItemsSearch,
  setStep,
  refreshStatus,
  loadReportItems,
}: Step3WaBlastProps) {
  const { t } = useLanguage();
  const [blasting, setBlasting] = useState(false);
  const [waFilter, setWaFilter] = useState<WaFilterType>("all");
  const [previewWaDialog, setPreviewWaDialog] = useState<{ open: boolean; name: string; phone: string; message: string } | null>(null);

  const getWaStatusBadge = (status: string | undefined) => {
    switch (status) {
      case "SENT": return <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5"><CheckCircle2 className="h-2.5 w-2.5" /> {t("reportVideo.sentStatus")}</span>;
      case "DELIVERED": return <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5"><CheckCircle2 className="h-2.5 w-2.5" /> {t("reportVideo.sentStatus")}</span>;
      case "PENDING": return <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {t("reportVideo.pendingStatus")}</span>;
      case "QUEUED": return <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {t("reportVideo.pendingStatus")}</span>;
      case "PROCESSING": return <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {t("reportVideo.pendingStatus")}</span>;
      case "FAILED": return <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 flex items-center gap-0.5"><XCircle className="h-2.5 w-2.5" /> {t("reportVideo.failedStatus")}</span>;
      default: return <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">-</span>;
    }
  };

  const startWaBlast = async () => {
    if (!currentReport) return;
    if (!confirm(t("reportVideo.startBlastConfirm"))) return;
    try {
      setBlasting(true);
      const result = await videoReportAPI.startWaBlast(currentReport.id);
      if (result.success) {
        toast.success(result.message || t("reportVideo.blastStarted"));
        const updated = await videoReportAPI.getVideoReport(currentReport.id);
        setCurrentReport(updated);
        await loadReportItems(currentReport.id);
      } else {
        toast.error(result.error || t("reportVideo.failedStartBlast"));
      }
    } catch { toast.error(t("reportVideo.failedStartBlast")); }
    finally { setBlasting(false); }
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

  const previewWaMessage = (item: { name: string; phone: string; videoUrl?: string }) => {
    if (!currentReport) return;
    const template = currentReport.waMessageTemplate || "Hello :name, here is your personal video: :linkvideo";
    // Generate preview link
    const videoLink = item.videoUrl ? `${window.location.origin}/v/preview` : "[video link]";
    const message = template.replace(/:name/g, item.name).replace(/:linkvideo/g, videoLink);
    setPreviewWaDialog({ open: true, name: item.name, phone: item.phone, message });
  };

  if (!currentReport) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 sm:p-6 text-center py-8">
        <div className="text-slate-500">{t("reportVideo.noReportSelected")}</div>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setStep(2)}>
          <ChevronLeft className="h-3.5 w-3.5 mr-1" /> {t("reportVideo.backToHistory")}
        </Button>
      </div>
    );
  }

  // Filter items with video ready for WA
  const itemsWithVideo = currentReport.items?.filter(i => i.videoUrl && !i.excluded) || [];
  
  // Filter by WA status
  let filteredItems = itemsWithVideo;
  if (waFilter === "sent") filteredItems = filteredItems.filter(i => i.waStatus === "SENT" || i.waStatus === "DELIVERED");
  else if (waFilter === "pending") filteredItems = filteredItems.filter(i => !i.waStatus || i.waStatus === "PENDING" || i.waStatus === "QUEUED" || i.waStatus === "PROCESSING");
  else if (waFilter === "failed") filteredItems = filteredItems.filter(i => i.waStatus === "FAILED");

  // Search
  if (itemsSearch) {
    const s = itemsSearch.toLowerCase();
    filteredItems = filteredItems.filter(i => i.name.toLowerCase().includes(s) || i.phone.toLowerCase().includes(s));
  }

  const waSentCount = currentReport.waSentCount || itemsWithVideo.filter(i => i.waStatus === "SENT" || i.waStatus === "DELIVERED").length;
  const waFailedCount = currentReport.waFailedCount || itemsWithVideo.filter(i => i.waStatus === "FAILED").length;
  const waPendingCount = itemsWithVideo.length - waSentCount - waFailedCount;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4">
      {/* Header Stats */}
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h3 className="font-medium text-sm">{currentReport.reportName}</h3>
          <p className="text-[10px] text-slate-500">{t("reportVideo.waBlast")}</p>
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={refreshStatus} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* WA Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-slate-50 dark:bg-slate-800 rounded p-2 text-center">
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{itemsWithVideo.length.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500">{t("reportVideo.videoReady")}</div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded p-2 text-center">
          <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{waSentCount.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500">{t("reportVideo.waSent")}</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded p-2 text-center">
          <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">{waPendingCount.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500">{t("reportVideo.waitingWa")}</div>
        </div>
        <div className="bg-red-50 dark:bg-red-950/30 rounded p-2 text-center">
          <div className="text-lg font-semibold text-red-600 dark:text-red-400">{waFailedCount.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500">{t("reportVideo.failedWa")}</div>
        </div>
      </div>

      {/* Progress */}
      {itemsWithVideo.length > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>{t("reportVideo.progressWaBlast")}</span>
            <span>{Math.round((waSentCount / itemsWithVideo.length) * 100)}%</span>
          </div>
          <Progress value={(waSentCount / itemsWithVideo.length) * 100} className="h-1.5" />
        </div>
      )}

      {/* WA Template Preview */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
        <div className="text-[10px] text-slate-500 mb-1">{t("reportVideo.waMessageTemplate")}</div>
        <div className="text-xs font-mono bg-white dark:bg-slate-900 p-2 rounded border whitespace-pre-wrap">
          {currentReport.waMessageTemplate || "Hello :name, here is your personal video: :linkvideo"}
        </div>
      </div>

      {/* Blast Button */}
      {waPendingCount > 0 && (
        <div className="flex justify-center">
          <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700" onClick={startWaBlast} disabled={blasting}>
            {blasting ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> {t("reportVideo.send")}...</> : <><Send className="h-3.5 w-3.5 mr-1.5" /> {t("reportVideo.blast")} {waPendingCount} WA</>}
          </Button>
        </div>
      )}

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input placeholder={t("reportVideo.searchPlaceholder")} value={itemsSearch} onChange={e => setItemsSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>
        <Select value={waFilter} onValueChange={(v: WaFilterType) => { setWaFilter(v); setItemsPage(0); }}>
          <SelectTrigger className="w-full sm:w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">{t("reportVideo.all")} ({itemsWithVideo.length})</SelectItem>
            <SelectItem value="sent" className="text-xs">{t("reportVideo.sentStatus")} ({waSentCount})</SelectItem>
            <SelectItem value="pending" className="text-xs">{t("reportVideo.pendingStatus")} ({waPendingCount})</SelectItem>
            <SelectItem value="failed" className="text-xs">{t("reportVideo.failedStatus")} ({waFailedCount})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Items Table */}
      {filteredItems.length > 0 ? (
        <>
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-72">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800">
                    <TableHead className="text-[10px] font-medium w-12">#</TableHead>
                    <TableHead className="text-[10px] font-medium">{t("reportVideo.name")}</TableHead>
                    <TableHead className="text-[10px] font-medium">{t("reportVideo.phone")}</TableHead>
                    <TableHead className="text-[10px] font-medium w-24">{t("reportVideo.waStatus")}</TableHead>
                    <TableHead className="text-[10px] font-medium w-16">{t("reportVideo.time")}</TableHead>
                    <TableHead className="text-[10px] font-medium">{t("reportVideo.action")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.slice(itemsPage * ITEMS_PER_PAGE, (itemsPage + 1) * ITEMS_PER_PAGE).map(item => (
                    <TableRow key={item.id} className={item.waStatus === "FAILED" ? "bg-red-50/50 dark:bg-red-950/20" : ""}>
                      <TableCell className="text-[10px] text-slate-500 font-mono">{item.rowNumber}</TableCell>
                      <TableCell className="text-xs font-medium">{item.name}</TableCell>
                      <TableCell className="text-xs text-slate-600">{item.phone}</TableCell>
                      <TableCell>{getWaStatusBadge(item.waStatus)}</TableCell>
                      <TableCell className="text-[10px] text-slate-500">
                        {item.waSentAt ? (() => {
                          const d = new Date(item.waSentAt);
                          return d.toLocaleDateString("en-US", { day: "2-digit", month: "short" }) + " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
                        })() : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px]" onClick={() => previewWaMessage(item)}>
                            <Eye className="h-3 w-3 mr-0.5" /> {t("reportVideo.previewWa")}
                          </Button>
                          {(item.waStatus === "FAILED" || !item.waStatus || item.waStatus === "PENDING") && (
                            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px]" onClick={() => resendWa(item.id)}>
                              <RotateCcw className="h-3 w-3 mr-0.5" /> {item.waStatus === "FAILED" ? t("reportVideo.resend") : t("reportVideo.send")}
                            </Button>
                          )}
                        </div>
                        {item.waErrorMessage && (
                          <div className="text-[10px] text-red-500 mt-0.5 line-clamp-1">{item.waErrorMessage}</div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          {Math.ceil(filteredItems.length / ITEMS_PER_PAGE) > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setItemsPage(p => Math.max(0, p - 1))} disabled={itemsPage === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-slate-500">{itemsPage + 1} / {Math.ceil(filteredItems.length / ITEMS_PER_PAGE)}</span>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setItemsPage(p => Math.min(Math.ceil(filteredItems.length / ITEMS_PER_PAGE) - 1, p + 1))} disabled={itemsPage >= Math.ceil(filteredItems.length / ITEMS_PER_PAGE) - 1}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-xs text-slate-400">
          {loading ? t("common.loading") : waFilter !== "all" ? t("reportVideo.noDataWithFilter") : t("reportVideo.noVideoReady")}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-2 border-t">
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setStep(2)}>
          <ChevronLeft className="h-3.5 w-3.5 mr-1" /> {t("reportVideo.backToVideo")}
        </Button>
        {waSentCount === itemsWithVideo.length && itemsWithVideo.length > 0 && (
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">{t("reportVideo.allWaSent")}</span>
          </div>
        )}
      </div>

      {/* WA Preview Dialog */}
      <Dialog open={!!previewWaDialog?.open} onOpenChange={() => setPreviewWaDialog(null)}>
        <DialogContent className="w-[95vw] max-w-md p-4">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-green-600" /> {t("reportVideo.waMessagePreview")}
            </DialogTitle>
          </DialogHeader>
          {previewWaDialog && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-500">{t("reportVideo.name")}:</span> {previewWaDialog.name}</div>
                <div><span className="text-slate-500">{t("reportVideo.phone")}:</span> {previewWaDialog.phone}</div>
              </div>
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-900">
                <div className="text-[10px] text-green-600 mb-1">{t("reportVideo.messageToSend")}</div>
                <div className="text-sm whitespace-pre-wrap">{previewWaDialog.message}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
