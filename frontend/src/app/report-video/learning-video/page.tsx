"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { videoReportAPI, VideoReportResponse } from "@/lib/api";
import { toast } from "sonner";
import { ReportHistory } from "./ReportHistory";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LearningVideoPage() {
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

  const viewReportDetails = (id: number) => {
    router.push(`/report-video/learning-video/${id}`);
  };

  const startNewGeneration = () => {
    router.push("/report-video/learning-video/create");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Learning Video Notifications
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Create and manage AI-powered video notifications from learning content
              </p>
            </div>
            <Button 
              onClick={startNewGeneration} 
              className="h-10 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/30"
            >
              <Plus className="h-4 w-4 mr-2" /> 
              Create New
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
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
  );
}
