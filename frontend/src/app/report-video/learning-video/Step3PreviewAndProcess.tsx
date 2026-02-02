"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search,
  MessageSquare,
  Rocket,
  Video,
} from "lucide-react";
import {
  videoReportAPI,
  ExcelValidationResult,
  VideoReportResponse,
  VideoReportRequest,
} from "@/lib/api";
import { PREVIEW_PER_PAGE } from "./types";
import { useLanguage } from "@/contexts/LanguageContext";

interface Step3PreviewAndProcessProps {
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
  reportName: string;
  messageTemplate: string;
  waMessageTemplate: string;
  videoLanguageCode: string;
  voiceSpeed: number;
  voicePitch: number;
  enableCaption: boolean;
  useBackground: boolean;
  backgroundName: string;
  setStep: (step: 1 | 2 | 3) => void;
  backToHistory: () => void;
  loadHistory: () => void;
  goToReportDetail?: (reportId: number) => void;
}

export function Step3PreviewAndProcess({
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
  reportName,
  messageTemplate,
  waMessageTemplate,
  videoLanguageCode,
  voiceSpeed,
  voicePitch,
  enableCaption,
  useBackground,
  backgroundName,
  setStep,
  backToHistory,
  loadHistory,
  goToReportDetail,
}: Step3PreviewAndProcessProps) {
  const { t } = useLanguage();
  const [previewVideoDialogOpen, setPreviewVideoDialogOpen] = useState(false);
  const [previewVideoDialogStatus, setPreviewVideoDialogStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [previewVideoDialogMessage, setPreviewVideoDialogMessage] = useState<string>("");
  const [previewStartedAt, setPreviewStartedAt] = useState<number | null>(null);
  const [previewElapsedMs, setPreviewElapsedMs] = useState<number>(0);
  const [previewWaDialog, setPreviewWaDialog] = useState<{ open: boolean; name: string; phone: string; message: string } | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<{ name: string; phone: string; avatar: string } | null>(null);
  const previewRunIdRef = useRef(0);

  useEffect(() => {
    if (!previewVideoDialogOpen || previewVideoDialogStatus !== "loading" || !previewStartedAt) {
      return;
    }

    const id = window.setInterval(() => {
      setPreviewElapsedMs(Date.now() - previewStartedAt);
    }, 1000);

    return () => {
      window.clearInterval(id);
    };
  }, [previewVideoDialogOpen, previewVideoDialogStatus, previewStartedAt]);

  const formatElapsed = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const rows = validationResult?.rows ?? [];
  const errors = validationResult?.errors ?? [];

  // Get first valid row for preview
  const getFirstValidRow = () => {
    return rows.find(r => r.validPhone && r.validAvatar) || null;
  };

  // Generate preview video for first item
  const generatePreviewVideo = async () => {
    if (previewVideoUrl) {
      return;
    }
    const firstRow = getFirstValidRow();
    if (!firstRow) {
      toast.error(t("reportVideo.noValidData"));
      return;
    }

    try {
      const myRunId = ++previewRunIdRef.current;
      setGeneratingPreview(true);
      setPreviewVideoId(null);
      setPreviewItem({ name: firstRow.name, phone: firstRow.phone, avatar: firstRow.avatar });
      setPreviewVideoDialogOpen(true);
      setPreviewVideoDialogStatus("loading");
      setPreviewVideoDialogMessage(t("reportVideo.generatingPreview") + "...");
      setPreviewStartedAt(Date.now());
      setPreviewElapsedMs(0);

      const start = await videoReportAPI.startPreview({
        messageTemplate,
        videoLanguageCode,
        useBackground,
        backgroundName,
        rowNumber: firstRow.rowNumber,
        name: firstRow.name,
        phone: firstRow.phone,
        avatar: firstRow.avatar,
      });

      if (previewRunIdRef.current !== myRunId) return;

      if (!start?.success || !start.videoId) {
        throw new Error(start?.error || t("reportVideo.failedGenerateVideo"));
      }

      const videoId = start.videoId;
      setPreviewVideoId(videoId);

      toast.info(t("reportVideo.videoProcessing"));
      setPreviewVideoDialogStatus("loading");
      setPreviewVideoDialogMessage(t("reportVideo.videoProcessing"));
      setPreviewStartedAt(Date.now());
      setPreviewElapsedMs(0);

      // Poll for video completion
      const pollVideo = async () => {
        while (true) {
          if (previewRunIdRef.current !== myRunId) return;
          await new Promise(resolve => setTimeout(resolve, 3000));

          try {
            const statusResp = await videoReportAPI.getPreviewStatus(videoId);
            if (!statusResp?.success) {
              const msg = statusResp?.error || t("reportVideo.failedGenerateVideo");
              setPreviewVideoDialogStatus("error");
              setPreviewVideoDialogMessage(msg);
              setPreviewStartedAt(null);
              toast.error(msg);
              return;
            }

            const rawStatus = (statusResp.status || "unknown").toLowerCase();
            const resultUrl = statusResp.resultUrl;
            const err = statusResp.error;

            if ((rawStatus === "done" || rawStatus === "completed") && resultUrl) {
              setPreviewVideoUrl(resultUrl);
              setPreviewVideoDialogStatus("ready");
              setPreviewVideoDialogMessage("");
              setPreviewStartedAt(null);
              toast.success(t("reportVideo.previewReady"));
              return;
            }

            if (rawStatus === "error" || rawStatus === "failed") {
              const msg = err || t("reportVideo.failedGenerateVideo");
              setPreviewVideoDialogStatus("error");
              setPreviewVideoDialogMessage(msg);
              setPreviewStartedAt(null);
              toast.error(msg);
              return;
            }

            if (rawStatus === "processing") {
              setPreviewVideoDialogMessage("HeyGen sedang memproses video preview...");
            } else if (rawStatus === "created") {
              setPreviewVideoDialogMessage("Mengirim permintaan ke HeyGen...");
            } else {
              setPreviewVideoDialogMessage(`Status: ${statusResp.status || "unknown"}`);
            }
          } catch {
            setPreviewVideoDialogMessage("Menunggu status dari HeyGen...");
          }
        }
      };

      await pollVideo();
    } catch (error) {
      const msg = (error as any)?.message || t("reportVideo.failedGenerateVideo");
      toast.error(msg);
      setPreviewVideoDialogStatus("error");
      setPreviewVideoDialogMessage(msg);
      setPreviewStartedAt(null);
    } finally {
      setGeneratingPreview(false);
    }
  };

  const openPreviewDialog = () => {
    if (!previewVideoUrl) {
      toast.error(t("reportVideo.previewVideoReady"));
      return;
    }
    setPreviewVideoDialogOpen(true);
    setPreviewVideoDialogStatus("ready");
    setPreviewVideoDialogMessage("");
  };

  // Preview WA message
  const previewWaMessage = () => {
    const firstRow = getFirstValidRow();
    if (!firstRow) {
      toast.error(t("reportVideo.noValidData"));
      return;
    }

    const videoLink = previewVideoUrl ? `${window.location.origin}/v/preview` : "[video link]";
    const message = waMessageTemplate.replace(/:name/g, firstRow.name).replace(/:linkvideo/g, videoLink);
    setPreviewWaDialog({ open: true, name: firstRow.name, phone: firstRow.phone, message });
  };

  // Start full process: create report, generate all videos, then blast WA
  const startFullProcess = async () => {
    if (!validationResult || rows.length === 0) {
      toast.error(t("reportVideo.noData"));
      return;
    }

    const validRows = rows.filter(r => r.validPhone && r.validAvatar);
    if (validRows.length === 0) {
      toast.error(t("reportVideo.noValidData"));
      return;
    }

    if (!confirm(t("reportVideo.confirmStartProcess").replace(":count", String(validRows.length)))) {
      return;
    }

    try {
      setGenerating(true);

      // 1. Create report
      const request: VideoReportRequest = {
        reportName,
        reportType: "LEARNING_VIDEO",
        messageTemplate,
        videoLanguageCode,
        voiceSpeed,
        voicePitch,
        enableCaption,
        waMessageTemplate,
        useBackground,
        backgroundName,
        items: validRows.map(row => ({ rowNumber: row.rowNumber, name: row.name, phone: row.phone, avatar: row.avatar })),
      };
      
      const response = await videoReportAPI.createVideoReport(request);
      setCurrentReport(response);
      toast.success(t("reportVideo.reportCreated"));

      // Backend starts generation automatically; go to detail page for progress
      toast.info(t("reportVideo.videoProcessing"));
      loadHistory();

      if (goToReportDetail) {
        goToReportDetail(response.id);
      } else {
        // Fallback: just go back to history
        backToHistory();
      }

    } catch (error) {
      toast.error(t("reportVideo.processError"));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4">
      {/* Validation Errors */}
      {validationResult && validationResult.errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 mb-1">
            <AlertCircle className="h-3.5 w-3.5" /> {errors.length} {t("reportVideo.errors")}
          </div>
          <ul className="text-[10px] text-red-600 dark:text-red-400 space-y-0.5 max-h-20 overflow-auto">
            {errors.slice(0, 5).map((e, i) => <li key={i}>• {e}</li>)}
            {errors.length > 5 && <li className="text-slate-400">+{errors.length - 5} {t("reportVideo.others")}</li>}
          </ul>
        </div>
      )}

      {/* Data Stats */}
      {validationResult && rows.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-slate-50 dark:bg-slate-800 rounded p-2 text-center">
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{rows.length.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500">{t("reportVideo.total")}</div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded p-2 text-center">
              <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{rows.filter(r => r.validPhone && r.validAvatar).length.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500">{t("reportVideo.valid")}</div>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 rounded p-2 text-center">
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">{rows.filter(r => !r.validPhone || !r.validAvatar).length.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500">{t("reportVideo.error")}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded p-2 text-center">
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">{Math.round((rows.filter(r => r.validPhone && r.validAvatar).length / rows.length) * 100)}%</div>
              <div className="text-[10px] text-slate-500">{t("reportVideo.rate")}</div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/20">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              {t("reportVideo.previewSection")}
            </h3>

            {/* Sample Data Info */}
            {getFirstValidRow() && (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 mb-3">
                <div className="text-[10px] text-slate-500 mb-2">{t("reportVideo.sampleData")}</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">{t("reportVideo.name")}:</span>{" "}
                    <span className="font-medium">{getFirstValidRow()?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">{t("reportVideo.phone")}:</span>{" "}
                    <span className="font-medium">{getFirstValidRow()?.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">{t("reportVideo.avatar")}:</span>{" "}
                    <span className="font-medium">{getFirstValidRow()?.avatar}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={generatePreviewVideo}
                disabled={!!previewVideoUrl || generatingPreview || !getFirstValidRow()}
              >
                {generatingPreview ? (
                  <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> {t("reportVideo.generatingPreview")}...</>
                ) : (
                  <><Video className="h-3.5 w-3.5 mr-1.5" /> {t("reportVideo.generatePreviewVideo")}</>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={openPreviewDialog}
                disabled={!previewVideoUrl}
              >
                <Play className="h-3.5 w-3.5 mr-1.5" /> {t("reportVideo.watchPreview")}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={previewWaMessage}
                disabled={!getFirstValidRow()}
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> {t("reportVideo.previewWa")}
              </Button>
            </div>

            {previewVideoUrl && (
              <div className="mt-3 text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {t("reportVideo.previewVideoReady")}
              </div>
            )}
          </div>

          {/* Data Preview Table */}
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
            let filtered = rows;
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

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setStep(2)}>
          <ChevronLeft className="h-3.5 w-3.5 mr-1" /> {t("reportVideo.previous")}
        </Button>
        <Button
          size="sm"
          className="h-8 text-xs bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
          onClick={startFullProcess}
          disabled={generating || !validationResult || rows.filter(r => r.validPhone && r.validAvatar).length === 0}
        >
          {generating ? (
            <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> {t("reportVideo.processing")}...</>
          ) : (
            <><Rocket className="h-3.5 w-3.5 mr-1.5" /> {t("reportVideo.startProcess")} ({rows.filter(r => r.validPhone && r.validAvatar).length} {t("reportVideo.items")})</>
          )}
        </Button>
      </div>

      {/* Video Preview Dialog */}
      <Dialog
        open={previewVideoDialogOpen}
        onOpenChange={(open) => {
          setPreviewVideoDialogOpen(open);
          if (!open) {
            // Cancel any in-flight polling
            previewRunIdRef.current++;
            setPreviewStartedAt(null);
            setPreviewElapsedMs(0);
            if (previewVideoDialogStatus === "loading") {
              setPreviewVideoDialogStatus("idle");
              setPreviewVideoDialogMessage("");
            }
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-5xl h-[90vh] p-3 flex flex-col bg-black border-slate-800">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-sm text-white">{t("reportVideo.previewVideo")}</DialogTitle>
          </DialogHeader>

          {previewVideoDialogStatus === "loading" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
              <RefreshCw className="h-8 w-8 animate-spin text-white/70" />
              <div className="text-sm text-white/90">{previewVideoDialogMessage || t("reportVideo.generatingPreview")}</div>
              <div className="text-xs text-white/70">
                Timer: {formatElapsed(previewElapsedMs)}
              </div>
              {previewItem && (
                <div className="text-xs text-white/60">
                  {previewItem.name} • {previewItem.phone} • {previewItem.avatar}
                </div>
              )}
              <div className="text-[11px] text-white/50">Mohon tunggu sampai HeyGen selesai.</div>
            </div>
          )}

          {previewVideoDialogStatus === "error" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
              <XCircle className="h-8 w-8 text-red-400" />
              <div className="text-sm text-white/90">Preview gagal</div>
              <div className="text-xs text-white/70 max-w-2xl break-words">
                {previewVideoDialogMessage || t("reportVideo.failedGenerateVideo")}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setPreviewVideoDialogOpen(false)}>
                  Tutup
                </Button>
                <Button size="sm" className="h-8 text-xs" onClick={generatePreviewVideo} disabled={generatingPreview}>
                  Coba Lagi
                </Button>
              </div>
            </div>
          )}

          {previewVideoDialogStatus === "ready" && previewVideoUrl && (
            <div className="flex-1 flex items-center justify-center">
              <video src={previewVideoUrl} controls autoPlay className="max-w-full max-h-full rounded" />
            </div>
          )}
        </DialogContent>
      </Dialog>

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
