"use client";

import { useState } from "react";
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
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Eye,
  Search,
  MessageSquare,
  Rocket,
  FileText,
} from "lucide-react";
import {
  pdfReportAPI,
  PdfExcelValidationResult,
  PdfReportResponse,
  PdfReportRequest,
} from "@/lib/api";
import { PREVIEW_PER_PAGE } from "./types";
import { useLanguage } from "@/contexts/LanguageContext";

interface Step2PreviewAndProcessProps {
  validationResult: PdfExcelValidationResult | null;
  previewPage: number;
  setPreviewPage: (value: number | ((p: number) => number)) => void;
  previewFilter: "all" | "valid" | "error";
  setPreviewFilter: (value: "all" | "valid" | "error") => void;
  previewSearch: string;
  setPreviewSearch: (value: string) => void;
  currentReport: PdfReportResponse | null;
  setCurrentReport: (value: PdfReportResponse | ((prev: PdfReportResponse | null) => PdfReportResponse | null) | null) => void;
  generating: boolean;
  setGenerating: (value: boolean) => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
  reportName: string;
  messageTemplate: string;
  waMessageTemplate: string;
  setStep: (step: 1 | 2) => void;
  backToHistory: () => void;
  loadHistory: () => void;
  goToReportDetail?: (reportId: number) => void;
}

export function Step2PreviewAndProcess({
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
  setStep,
  backToHistory,
  loadHistory,
  goToReportDetail,
}: Step2PreviewAndProcessProps) {
  const { t } = useLanguage();
  const [previewWaDialog, setPreviewWaDialog] = useState<{ open: boolean; name: string; phone: string; message: string } | null>(null);
  const [previewPdfDialog, setPreviewPdfDialog] = useState<{ open: boolean; name: string; content: string } | null>(null);

  // Get first valid row for preview
  const getFirstValidRow = () => {
    if (!validationResult || !validationResult.rows) return null;
    return validationResult.rows.find(r => r.validPhone);
  };

  // Preview PDF content
  const previewPdfContent = () => {
    const firstRow = getFirstValidRow();
    if (!firstRow) {
      toast.error(t("reportPdf.noValidData"));
      return;
    }

    const content = messageTemplate.replace(/:name/g, firstRow.name);
    setPreviewPdfDialog({ open: true, name: firstRow.name, content });
  };

  // Preview WA message
  const previewWaMessage = () => {
    const firstRow = getFirstValidRow();
    if (!firstRow) {
      toast.error(t("reportPdf.noValidData"));
      return;
    }

    const pdfLink = "[PDF link]";
    const message = waMessageTemplate.replace(/:name/g, firstRow.name).replace(/:linkpdf/g, pdfLink);
    setPreviewWaDialog({ open: true, name: firstRow.name, phone: firstRow.phone, message });
  };

  // Start full process: create report, generate all PDFs, then blast WA
  const startFullProcess = async () => {
    if (!validationResult || !validationResult.rows || validationResult.rows.length === 0) {
      toast.error(t("reportPdf.noData"));
      return;
    }

    const validRows = validationResult.rows.filter(r => r.validPhone);
    if (validRows.length === 0) {
      toast.error(t("reportPdf.noValidData"));
      return;
    }

    if (!confirm(t("reportPdf.confirmStartProcess").replace(":count", validRows.length.toString()))) {
      return;
    }

    try {
      setGenerating(true);

      // Get user ID from localStorage
      const authUser = localStorage.getItem('auth_user');
      const userId = authUser ? JSON.parse(authUser).id : null;

      // 1. Create report
      const request: PdfReportRequest = {
        reportName,
        messageTemplate,
        waMessageTemplate,
        items: validRows.map(row => ({ rowNumber: row.rowNumber, name: row.name, phone: row.phone })),
        userId: userId,
      };
      
      const response = await pdfReportAPI.createPdfReport(request);
      toast.success(t("reportPdf.reportCreated") + " " + t("reportPdf.generatingAllPdfs"));

      // 2. Poll until all PDFs are done
      let allDone = false;
      let attempts = 0;
      const maxAttempts = 120; // ~6 minutes max (PDF generation is fast)

      while (!allDone && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const updated = await pdfReportAPI.getPdfReport(response.id);
        setCurrentReport(updated);

        if (updated.status === "COMPLETED" || updated.status === "FAILED") {
          allDone = true;
        }
        attempts++;
      }

      // 3. WA blast is auto-triggered from backend when all PDFs complete
      toast.info(t("reportPdf.startingWaBlast"));

      // 4. Wait a bit for WA blast to start, then navigate to detail page
      await new Promise(resolve => setTimeout(resolve, 3000));
      loadHistory();
      
      // Navigate to detail page
      if (goToReportDetail) {
        goToReportDetail(response.id);
      } else {
        backToHistory();
      }

    } catch (error) {
      toast.error(t("reportPdf.processError"));
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
            <AlertCircle className="h-3.5 w-3.5" /> {validationResult.errors.length} Error
          </div>
          <ul className="text-[10px] text-red-600 dark:text-red-400 space-y-0.5 max-h-20 overflow-auto">
            {validationResult.errors.slice(0, 5).map((e, i) => <li key={i}>• {e}</li>)}
            {validationResult.errors.length > 5 && <li className="text-slate-400">+{validationResult.errors.length - 5} {t("reportPdf.others")}</li>}
          </ul>
        </div>
      )}

      {/* Data Stats */}
      {validationResult && validationResult.rows && validationResult.rows.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-slate-50 dark:bg-slate-800 rounded p-2 text-center">
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{validationResult.rows.length.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500">{t("reportPdf.total")}</div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded p-2 text-center">
              <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{validationResult.rows.filter(r => r.validPhone).length.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500">{t("reportPdf.valid")}</div>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 rounded p-2 text-center">
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">{validationResult.rows.filter(r => !r.validPhone).length.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500">{t("reportPdf.error")}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded p-2 text-center">
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">{Math.round((validationResult.rows.filter(r => r.validPhone).length / validationResult.rows.length) * 100)}%</div>
              <div className="text-[10px] text-slate-500">{t("reportPdf.rate")}</div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50/50 dark:bg-red-950/20">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4 text-red-600" />
              {t("reportPdf.previewSection")}
            </h3>

            {/* Sample Data Info */}
            {getFirstValidRow() && (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 mb-3">
                <div className="text-[10px] text-slate-500 mb-2">{t("reportPdf.sampleData")}</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">{t("reportPdf.name")}:</span>{" "}
                    <span className="font-medium">{getFirstValidRow()?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">{t("reportPdf.phone")}:</span>{" "}
                    <span className="font-medium">{getFirstValidRow()?.phone}</span>
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
                onClick={previewPdfContent}
                disabled={!getFirstValidRow()}
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" /> {t("reportPdf.previewPdf")}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={previewWaMessage}
                disabled={!getFirstValidRow()}
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> {t("reportPdf.previewWa")}
              </Button>
            </div>
          </div>

          {/* Data Preview Table */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input placeholder={t("reportPdf.searchPlaceholder")} value={previewSearch} onChange={e => { setPreviewSearch(e.target.value); setPreviewPage(0); }} className="pl-8 h-8 text-xs" />
            </div>
            <Select value={previewFilter} onValueChange={(v: typeof previewFilter) => { setPreviewFilter(v); setPreviewPage(0); }}>
              <SelectTrigger className="w-full sm:w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">{t("reportPdf.all")}</SelectItem>
                <SelectItem value="valid" className="text-xs">{t("reportPdf.valid")}</SelectItem>
                <SelectItem value="error" className="text-xs">{t("reportPdf.error")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(() => {
            let filtered = validationResult.rows;
            if (previewFilter === "valid") filtered = filtered.filter(r => r.validPhone);
            else if (previewFilter === "error") filtered = filtered.filter(r => !r.validPhone);
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
                          <TableHead className="text-[10px] font-medium">{t("reportPdf.name")}</TableHead>
                          <TableHead className="text-[10px] font-medium">{t("reportPdf.phone")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginated.map(row => (
                          <TableRow key={row.rowNumber} className={!row.validPhone ? "bg-red-50/50 dark:bg-red-950/20" : ""}>
                            <TableCell className="text-[10px] text-slate-500 font-mono">{row.rowNumber}</TableCell>
                            <TableCell className="text-xs font-medium">{row.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {row.validPhone ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
                                <span className={`text-xs ${!row.validPhone ? "text-red-500" : ""}`}>{row.phone}</span>
                                {row.phoneError && <span className="text-[10px] text-red-400">({row.phoneError})</span>}
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
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setStep(1)}>
          <ChevronLeft className="h-3.5 w-3.5 mr-1" /> {t("reportPdf.previous")}
        </Button>
        <Button
          size="sm"
          className="h-8 text-xs bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700"
          onClick={startFullProcess}
          disabled={generating || !validationResult || !validationResult.rows || validationResult.rows.filter(r => r.validPhone).length === 0}
        >
          {generating ? (
            <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> {t("reportPdf.processing")}...</>
          ) : (
            <><Rocket className="h-3.5 w-3.5 mr-1.5" /> {t("reportPdf.startProcess")} ({validationResult?.rows?.filter(r => r.validPhone).length || 0} {t("reportPdf.items")})</>
          )}
        </Button>
      </div>

      {/* PDF Preview Dialog */}
      <Dialog open={!!previewPdfDialog?.open} onOpenChange={() => setPreviewPdfDialog(null)}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-auto p-4">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-red-600" /> {t("reportPdf.previewPdf")}
            </DialogTitle>
          </DialogHeader>
          {previewPdfDialog && (
            <div className="space-y-3">
              <div className="text-xs">
                <span className="text-slate-500">{t("reportPdf.recipients")}:</span> {previewPdfDialog.name}
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border">
                <div className="text-[10px] text-slate-500 mb-2">{t("reportPdf.pdfContent")}:</div>
                <div className="text-sm whitespace-pre-wrap font-mono">{previewPdfDialog.content}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* WA Preview Dialog */}
      <Dialog open={!!previewWaDialog?.open} onOpenChange={() => setPreviewWaDialog(null)}>
        <DialogContent className="w-[95vw] max-w-md p-4">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-green-600" /> {t("reportPdf.waMessagePreview")}
            </DialogTitle>
          </DialogHeader>
          {previewWaDialog && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-500">{t("reportPdf.name")}:</span> {previewWaDialog.name}</div>
                <div><span className="text-slate-500">{t("reportPdf.phone")}:</span> {previewWaDialog.phone}</div>
              </div>
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-900">
                <div className="text-[10px] text-green-600 mb-1">{t("reportPdf.messageToSend")}:</div>
                <div className="text-sm whitespace-pre-wrap">{previewWaDialog.message}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
