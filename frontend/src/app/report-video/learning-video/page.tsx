"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Video, Sparkles } from "lucide-react";
import { videoReportAPI, VideoReportResponse } from "@/lib/api";
import { toast } from "sonner";
import { ReportHistory } from "./ReportHistory";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LearningVideoListPage() {
  const { t } = useLanguage();
  const router = useRouter();

  // History
  const [reportHistory, setReportHistory] = useState<VideoReportResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => { 
    loadHistory(); 
  }, [historyPage, historyPageSize, filterDateFrom, filterDateTo, filterStatus]);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await videoReportAPI.getAllVideoReports(
        historyPage,
        historyPageSize,
        "LEARNING_VIDEO",
        filterDateFrom,
        filterDateTo,
        filterStatus
      );
      setReportHistory(res.content);
      setHistoryTotalPages(res.totalPages);
    } catch { 
      toast.error(t("reportVideo.failedLoadHistory")); 
    } finally { 
      setHistoryLoading(false); 
    }
  };

  const startNewGeneration = () => {
    router.push("/report-video/learning-video/new");
  };

  const viewReportDetails = (id: number) => {
    router.push(`/report-video/learning-video/${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
                <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                  <Video className="h-7 w-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Learning Video Reports
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                  AI-powered video generation from learning content
                </p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={startNewGeneration}
              className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 font-semibold"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New Report
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Video className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Reports</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {reportHistory.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <Sparkles className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Completed</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {reportHistory.filter(r => r.status === "COMPLETED").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <div className="h-6 w-6 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Processing</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {reportHistory.filter(r => r.status === "PROCESSING").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Report History */}
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
          <ReportHistory
            reportHistory={reportHistory}
            historyLoading={historyLoading}
            historyPage={historyPage}
            setHistoryPage={setHistoryPage}
            historyTotalPages={historyTotalPages}
            historyPageSize={historyPageSize}
            setHistoryPageSize={setHistoryPageSize}
            filterDateFrom={filterDateFrom}
            setFilterDateFrom={setFilterDateFrom}
            filterDateTo={filterDateTo}
            setFilterDateTo={setFilterDateTo}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            startNewGeneration={startNewGeneration}
            viewReportDetails={viewReportDetails}
            loadHistory={loadHistory}
          />
        </div>
      </div>
    </div>
  );
}
