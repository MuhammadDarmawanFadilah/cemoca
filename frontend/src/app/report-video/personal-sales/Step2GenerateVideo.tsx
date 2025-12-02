"use client";

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
  AlertCircle,
  Play,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Eye,
  Link2,
  Trash2,
  Search,
  Ban,
  RotateCcw,
  Send,
} from "lucide-react";
import {
  videoReportAPI,
  ExcelValidationResult,
  VideoReportResponse,
  VideoReportRequest,
} from "@/lib/api";
import { PREVIEW_PER_PAGE, ITEMS_PER_PAGE } from "./types";
import { useLanguage } from "@/contexts/LanguageContext";

interface Step2GenerateVideoProps {
  validationResult: ExcelValidationResult | null;
  previewPage: number;
  setPreviewPage: (value: number | ((p: number) => number)) => void;
  previewFilter: "all" | "valid" | "error";
  setPreviewFilter: (value: "all" | "valid" | "error") => void;
  previewSearch: string;
  setPreviewSearch: (value: string) => void;
  currentReport: VideoReportResponse | null;
  setCurrentReport: (value: VideoReportResponse | ((prev: VideoReportResponse | null) => VideoReportResponse | null) | null) => void;
  generating: boolean;
  setGenerating: (value: boolean) => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
  previewVideo: string | null;
  setPreviewVideo: (value: string | null) => void;
  itemsPage: number;
  setItemsPage: (value: number | ((p: number) => number)) => void;
  itemsFilter: "all" | "done" | "processing" | "failed";
  setItemsFilter: (value: "all" | "done" | "processing" | "failed") => void;
  itemsSearch: string;
  setItemsSearch: (value: string) => void;
  reportName: string;
  messageTemplate: string;
  waMessageTemplate: string;
  setStep: (step: 1 | 2 | 3) => void;
  backToHistory: () => void;
  loadHistory: () => void;
  refreshStatus: () => void;
  loadReportItems: (reportId: number) => void;
}

export function Step2GenerateVideo({
  validationResult,
  previewPage,
  setPreviewPage,
  previewFilter,
  setPreviewFilter,
  previewSearch,
  setPreviewSearch,
  currentReport,
  setCurrentReport,
  generating,
  setGenerating,
  loading,
  setLoading,
  previewVideo,
  setPreviewVideo,
  itemsPage,
  setItemsPage,
  itemsFilter,
  setItemsFilter,
  itemsSearch,
  setItemsSearch,
  reportName,
  messageTemplate,
  waMessageTemplate,
  setStep,
  backToHistory,
  loadHistory,
  refreshStatus,
  loadReportItems,
}: Step2GenerateVideoProps) {
  const { t } = useLanguage();
  
  const getStatusBadge = (status: string, size: "sm" | "md" = "sm") => {
    const base = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5";
    switch (status) {
      case "PENDING": return <span className={`${base} rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400`}>{t("reportVideo.waiting")}</span>;
      case "PROCESSING": return <span className={`${base} rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400`}>{t("reportVideo.process")}</span>;
      case "DONE": case "COMPLETED": return <span className={`${base} rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400`}>{t("reportVideo.done")}</span>;
      case "FAILED": return <span className={`${base} rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400`}>{t("reportVideo.failed")}</span>;
      default: return <span className={`${base} rounded bg-slate-100 dark:bg-slate-800`}>{status}</span>;
    }
  };

  const startVideoGeneration = async () => {
    if (!validationResult || validationResult.rows.length === 0) { toast.error(t("reportVideo.noData")); return; }
    const validRows = validationResult.rows.filter(r => r.validPhone && r.validAvatar);
    if (validRows.length === 0) { toast.error(t("reportVideo.noValidData")); return; }
    try {
      setGenerating(true);
      const request: VideoReportRequest = {
        reportName,
        messageTemplate,
        waMessageTemplate,
        items: validRows.map(row => ({ rowNumber: row.rowNumber, name: row.name, phone: row.phone, avatar: row.avatar })),
      };
      const response = await videoReportAPI.createVideoReport(request);
      setCurrentReport(response);
      toast.success(t("reportVideo.processStarted"));
      loadHistory();
    } catch { toast.error(t("reportVideo.failedStart")); }
    finally { setGenerating(false); }
  };

  const generateSingleVideo = async (itemId: number) => {
    if (!currentReport) return;
    try {
      toast.info(t("reportVideo.startingGenerateVideo"));
      const result = await videoReportAPI.generateSingleVideo(currentReport.id, itemId);
      if (result.success) {
        toast.success(t("reportVideo.videoProcessing"));
        await loadReportItems(currentReport.id);
      } else {
        toast.error(result.error || t("reportVideo.failedGenerateVideo"));
      }
    } catch { toast.error(t("reportVideo.failedGenerateVideo")); }
  };

  const toggleExclude = async (itemId: number) => {
    if (!currentReport) return;
    try {
      const result = await videoReportAPI.toggleExcludeItem(currentReport.id, itemId);
      if (result.success) {
        toast.success(result.excluded ? t("reportVideo.itemExcluded") : t("reportVideo.itemReactivated"));
        await loadReportItems(currentReport.id);
      }
    } catch { toast.error(t("reportVideo.failedChangeStatus")); }
  };

  const deleteItemVideo = async (itemId: number) => {
    if (!currentReport) return;
    if (!confirm(t("reportVideo.deleteVideo") + "?")) return;
    try {
      const result = await videoReportAPI.deleteItemVideo(currentReport.id, itemId);
      if (result.success) {
        toast.success(t("reportVideo.videoDeleted"));
        await loadReportItems(currentReport.id);
      }
    } catch { toast.error(t("reportVideo.failedDeleteVideo")); }
  };

  const deleteAllVideos = async () => {
    if (!currentReport) return;
    if (!confirm(t("reportVideo.deleteAllConfirm"))) return;
    try {
      const result = await videoReportAPI.deleteAllVideos(currentReport.id);
      if (result.success) {
        toast.success(t("reportVideo.allVideosDeleted"));
        const updated = await videoReportAPI.getVideoReport(currentReport.id);
        setCurrentReport(updated);
        await loadReportItems(currentReport.id);
      }
    } catch { toast.error(t("reportVideo.failedDeleteVideo")); }
  };

  const canProceedToStep3 = currentReport && currentReport.successCount > 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4">
      {/* Validation Errors */}
      {validationResult && validationResult.errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 mb-1">
            <AlertCircle className="h-3.5 w-3.5" /> {validationResult.errors.length} {t("reportVideo.errors")}
          </div>
          <ul className="text-[10px] text-red-600 dark:text-red-400 space-y-0.5 max-h-20 overflow-auto">
            {validationResult.errors.slice(0, 5).map((e, i) => <li key={i}>• {e}</li>)}
            {validationResult.errors.length > 5 && <li className="text-slate-400">+{validationResult.errors.length - 5} {t("reportVideo.others")}</li>}
          </ul>
        </div>
      )}

      {/* Data Preview (before report created) */}
      {validationResult && validationResult.rows.length > 0 && !currentReport && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-slate-50 dark:bg-slate-800 rounded p-2 text-center">
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{validationResult.rows.length.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500">{t("reportVideo.total")}</div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded p-2 text-center">
              <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{validationResult.rows.filter(r => r.validPhone && r.validAvatar).length.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500">{t("reportVideo.valid")}</div>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 rounded p-2 text-center">
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">{validationResult.rows.filter(r => !r.validPhone || !r.validAvatar).length.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500">{t("reportVideo.error")}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded p-2 text-center">
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">{Math.round((validationResult.rows.filter(r => r.validPhone && r.validAvatar).length / validationResult.rows.length) * 100)}%</div>
              <div className="text-[10px] text-slate-500">{t("reportVideo.rate")}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input placeholder={t("reportVideo.searchPlaceholder")} value={previewSearch} onChange={e => { setPreviewSearch(e.target.value); setPreviewPage(0); }} className="pl-8 h-8 text-xs" />
            </div>
            <Select value={previewFilter} onValueChange={(v: typeof previewFilter) => { setPreviewFilter(v); setPreviewPage(0); }}>
              <SelectTrigger className="w-full sm:w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">{t("reportVideo.all")}</SelectItem>
                <SelectItem value="valid" className="text-xs">{t("reportVideo.valid")}</SelectItem>
                <SelectItem value="error" className="text-xs">{t("reportVideo.error")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(() => {
            let filtered = validationResult.rows;
            if (previewFilter === "valid") filtered = filtered.filter(r => r.validPhone && r.validAvatar);
            else if (previewFilter === "error") filtered = filtered.filter(r => !r.validPhone || !r.validAvatar);
            if (previewSearch) {
              const s = previewSearch.toLowerCase();
              filtered = filtered.filter(r => r.name.toLowerCase().includes(s) || r.phone.toLowerCase().includes(s));
            }
            const totalPages = Math.ceil(filtered.length / PREVIEW_PER_PAGE);
            const paginated = filtered.slice(previewPage * PREVIEW_PER_PAGE, (previewPage + 1) * PREVIEW_PER_PAGE);
            return (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-64">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800">
                          <TableHead className="text-[10px] font-medium w-12">#</TableHead>
                          <TableHead className="text-[10px] font-medium">{t("reportVideo.name")}</TableHead>
                          <TableHead className="text-[10px] font-medium">{t("reportVideo.phone")}</TableHead>
                          <TableHead className="text-[10px] font-medium hidden sm:table-cell">{t("reportVideo.avatar")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginated.map(row => (
                          <TableRow key={row.rowNumber} className={!row.validPhone || !row.validAvatar ? "bg-red-50/50 dark:bg-red-950/20" : ""}>
                            <TableCell className="text-[10px] text-slate-500 font-mono">{row.rowNumber}</TableCell>
                            <TableCell className="text-xs font-medium">{row.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {row.validPhone ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
                                <span className={`text-xs ${!row.validPhone ? "text-red-500" : ""}`}>{row.phone}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <div className="flex items-center gap-1">
                                {row.validAvatar ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
                                <span className={`text-[10px] truncate max-w-[80px] ${!row.validAvatar ? "text-red-500" : "text-slate-500"}`}>{row.avatar}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setPreviewPage(p => Math.max(0, p - 1))} disabled={previewPage === 0}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-slate-500">{previewPage + 1} / {totalPages}</span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setPreviewPage(p => Math.min(totalPages - 1, p + 1))} disabled={previewPage >= totalPages - 1}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            );
          })()}
        </>
      )}

      {/* Current Report */}
      {currentReport && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-medium text-sm">{currentReport.reportName}</div>
            <div className="flex items-center gap-2">
              {getStatusBadge(currentReport.status, "md")}
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={refreshStatus} disabled={loading}>
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>{t("reportVideo.progressVideo")}</span>
              <span>{Math.round((currentReport.processedRecords / currentReport.totalRecords) * 100)}%</span>
            </div>
            <Progress value={(currentReport.processedRecords / currentReport.totalRecords) * 100} className="h-1.5" />
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div><div className="text-sm font-semibold">{currentReport.totalRecords}</div><div className="text-[10px] text-slate-500">{t("reportVideo.total")}</div></div>
            <div><div className="text-sm font-semibold text-blue-600">{currentReport.processedRecords}</div><div className="text-[10px] text-slate-500">{t("reportVideo.process")}</div></div>
            <div><div className="text-sm font-semibold text-emerald-600">{currentReport.successCount}</div><div className="text-[10px] text-slate-500">{t("reportVideo.done")}</div></div>
            <div><div className="text-sm font-semibold text-red-600">{currentReport.failedCount}</div><div className="text-[10px] text-slate-500">{t("reportVideo.failed")}</div></div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs text-red-600 hover:text-red-700" onClick={deleteAllVideos}>
              <Trash2 className="h-3 w-3 mr-1" /> {t("reportVideo.deleteAllReset")}
            </Button>
          </div>

          {/* Video Items */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input placeholder={t("reportVideo.searchPlaceholder")} value={itemsSearch} onChange={e => setItemsSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') setItemsPage(0); }} className="pl-8 h-8 text-xs" />
              </div>
              <Select value={itemsFilter} onValueChange={(v: typeof itemsFilter) => { setItemsFilter(v); setItemsPage(0); }}>
                <SelectTrigger className="w-full sm:w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">{t("reportVideo.all")}</SelectItem>
                  <SelectItem value="done" className="text-xs">{t("reportVideo.done")}</SelectItem>
                  <SelectItem value="processing" className="text-xs">{t("reportVideo.process")}</SelectItem>
                  <SelectItem value="failed" className="text-xs">{t("reportVideo.failed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {currentReport.items && currentReport.items.length > 0 ? (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-72">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800">
                          <TableHead className="text-[10px] font-medium w-12">#</TableHead>
                          <TableHead className="text-[10px] font-medium">{t("reportVideo.name")}</TableHead>
                          <TableHead className="text-[10px] font-medium">{t("reportVideo.phone")}</TableHead>
                          <TableHead className="text-[10px] font-medium w-16">{t("reportVideo.status")}</TableHead>
                          <TableHead className="text-[10px] font-medium w-20">{t("reportVideo.time")}</TableHead>
                          <TableHead className="text-[10px] font-medium">{t("reportVideo.action")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentReport.items.map(item => (
                          <TableRow key={item.id} className={`${item.status === "FAILED" ? "bg-red-50/50 dark:bg-red-950/20" : ""} ${item.excluded ? "opacity-50" : ""}`}>
                            <TableCell className="text-[10px] text-slate-500 font-mono">{item.rowNumber}</TableCell>
                            <TableCell className="text-xs font-medium">
                              {item.name}
                              {item.excluded && <span className="ml-1 text-[10px] text-slate-400">({t("reportVideo.excluded")})</span>}
                            </TableCell>
                            <TableCell className="text-xs text-slate-600">{item.phone}</TableCell>
                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                            <TableCell className="text-[10px] text-slate-500">
                              {item.videoGeneratedAt ? (() => {
                                const d = new Date(item.videoGeneratedAt);
                                return d.toLocaleDateString("en-US", { day: "2-digit", month: "short" }) + " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
                              })() : "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {item.videoUrl ? (
                                  <>
                                    <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px]" onClick={() => setPreviewVideo(item.videoUrl)}>
                                      <Eye className="h-3 w-3 mr-0.5" /> {t("reportVideo.preview")}
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px]" onClick={async () => {
                                      try {
                                        const res = await videoReportAPI.generateShareLink(currentReport.id, item.id);
                                        await navigator.clipboard.writeText(`${window.location.origin}/v/${res.token}`);
                                        toast.success(t("reportVideo.linkCopied"));
                                      } catch { toast.error(t("reportVideo.failedCopyLink")); }
                                    }}>
                                      <Link2 className="h-3 w-3 mr-0.5" /> {t("reportVideo.link")}
                                    </Button>
                                  </>
                                ) : item.status === "PENDING" || item.status === "FAILED" ? (
                                  <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px]" onClick={() => generateSingleVideo(item.id)} disabled={item.excluded}>
                                    <Play className="h-3 w-3 mr-0.5" /> {t("reportVideo.generate")}
                                  </Button>
                                ) : item.status === "PROCESSING" ? (
                                  <span className="text-[10px] text-blue-500">{t("reportVideo.processingVideo")}</span>
                                ) : null}
                                
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600" onClick={() => toggleExclude(item.id)} title={item.excluded ? t("reportVideo.reactivate") : t("reportVideo.exclude")}>
                                  {item.excluded ? <RotateCcw className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                                </Button>
                                
                                {item.videoUrl && (
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400 hover:text-red-600" onClick={() => deleteItemVideo(item.id)} title={t("reportVideo.deleteVideo")}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              {item.errorMessage && (
                                <div className="text-[10px] text-red-500 mt-0.5 line-clamp-1">{item.errorMessage}</div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                {(currentReport.itemsTotalPages || 0) > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setItemsPage(p => Math.max(0, p - 1))} disabled={itemsPage === 0}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-slate-500">{itemsPage + 1} / {currentReport.itemsTotalPages}</span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setItemsPage(p => Math.min((currentReport.itemsTotalPages || 1) - 1, p + 1))} disabled={itemsPage >= (currentReport.itemsTotalPages || 1) - 1}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4 text-xs text-slate-400">{loading ? t("common.loading") : t("reportVideo.noDataAvailable")}</div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => currentReport ? backToHistory() : setStep(1)}>
          <ChevronLeft className="h-3.5 w-3.5 mr-1" /> {currentReport ? t("reportVideo.backToHistory") : t("reportVideo.previous")}
        </Button>
        <div className="flex gap-2">
          {!currentReport && validationResult && (
            <Button size="sm" className="h-8 text-xs" onClick={startVideoGeneration} disabled={generating || validationResult.rows.filter(r => r.validPhone && r.validAvatar).length === 0}>
              {generating ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> {t("reportVideo.process")}...</> : <><Play className="h-3.5 w-3.5 mr-1.5" /> {t("reportVideo.generate")} {validationResult.rows.filter(r => r.validPhone && r.validAvatar).length} {t("reportVideo.video")}</>}
            </Button>
          )}
          {canProceedToStep3 && (
            <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700" onClick={() => setStep(3)}>
              <Send className="h-3.5 w-3.5 mr-1.5" /> {t("reportVideo.blastWa")} <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Video Preview Dialog */}
      <Dialog open={!!previewVideo} onOpenChange={() => setPreviewVideo(null)}>
        <DialogContent className="w-[95vw] max-w-5xl h-[90vh] p-3 flex flex-col bg-black border-slate-800">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-sm text-white">{t("reportVideo.preview")} {t("reportVideo.video")}</DialogTitle>
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
