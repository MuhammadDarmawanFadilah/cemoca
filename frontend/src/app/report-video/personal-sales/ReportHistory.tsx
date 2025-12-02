"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  RefreshCw,
  Video,
  ChevronRight,
  ChevronLeft,
  Eye,
  Plus,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import {
  videoReportAPI,
  VideoReportResponse,
} from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

interface ReportHistoryProps {
  reportHistory: VideoReportResponse[];
  historyLoading: boolean;
  historyPage: number;
  setHistoryPage: (value: number | ((p: number) => number)) => void;
  historyTotalPages: number;
  startNewGeneration: () => void;
  viewReportDetails: (id: number) => void;
  loadHistory: () => void;
}

export function ReportHistory({
  reportHistory,
  historyLoading,
  historyPage,
  setHistoryPage,
  historyTotalPages,
  startNewGeneration,
  viewReportDetails,
  loadHistory,
}: ReportHistoryProps) {
  const { t } = useLanguage();
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{t("reportVideo.waiting")}</span>;
      case "PROCESSING": return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400">{t("reportVideo.process")}</span>;
      case "DONE": case "COMPLETED": return <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">{t("reportVideo.done")}</span>;
      case "FAILED": return <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">{t("reportVideo.failed")}</span>;
      default: return <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{status}</span>;
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) + " " + date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  const deleteReport = async (id: number) => {
    if (!confirm(t("reportVideo.deleteConfirm"))) return;
    try {
      await videoReportAPI.deleteVideoReport(id);
      toast.success(t("reportVideo.deleteSuccess"));
      loadHistory();
    } catch { toast.error(t("reportVideo.deleteFailed")); }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
      {historyLoading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      ) : reportHistory.length === 0 ? (
        <div className="text-center py-16">
          <Video className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-500">{t("reportVideo.noReport")}</p>
          <Button size="sm" className="mt-4 h-8 text-xs" onClick={startNewGeneration}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> {t("reportVideo.createReport")}
          </Button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-800">
                  <TableHead className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("reportVideo.report")}</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center hidden sm:table-cell">{t("reportVideo.progress")}</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center">{t("reportVideo.status")}</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden md:table-cell">{t("reportVideo.date")}</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 dark:text-slate-400 text-right">{t("reportVideo.action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportHistory.map(report => (
                  <TableRow key={report.id} className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableCell>
                      <div className="font-medium text-sm text-slate-900 dark:text-slate-100">{report.reportName}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 sm:hidden">
                        {report.successCount}/{report.totalRecords} {t("reportVideo.done").toLowerCase()}
                      </div>
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        <span className="text-emerald-600 dark:text-emerald-400">{report.successCount}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        {report.totalRecords}
                        {report.failedCount > 0 && (
                          <span className="text-red-500 ml-1">({report.failedCount} {t("reportVideo.failed").toLowerCase()})</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{getStatusBadge(report.status)}</TableCell>
                    <TableCell className="text-xs text-slate-500 hidden md:table-cell">{formatDate(report.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {(report.status === "PROCESSING" || report.status === "PENDING") && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { videoReportAPI.refreshStatus(report.id); loadHistory(); }}>
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => viewReportDetails(report.id)}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> {t("reportVideo.detail")}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => deleteReport(report.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {historyTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setHistoryPage(p => Math.max(0, p - 1))} disabled={historyPage === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-slate-500">{historyPage + 1} / {historyTotalPages}</span>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setHistoryPage(p => Math.min(historyTotalPages - 1, p + 1))} disabled={historyPage >= historyTotalPages - 1}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
