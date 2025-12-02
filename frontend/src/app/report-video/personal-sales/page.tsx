"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  Plus,
  ArrowLeft,
} from "lucide-react";
import {
  videoReportAPI,
  DIDPresenter,
  ExcelValidationResult,
  VideoReportResponse,
} from "@/lib/api";
import { toast } from "sonner";
import { ViewMode, Step, ITEMS_PER_PAGE } from "./types";
import { ReportHistory } from "./ReportHistory";
import { Step1InputData } from "./Step1InputData";
import { Step2PreviewAndProcess } from "./Step2PreviewAndProcess";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PersonalSalesPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("history");
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  // History
  const [reportHistory, setReportHistory] = useState<VideoReportResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);

  // Step 1
  const [reportName, setReportName] = useState("Personal Notification");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [waMessageTemplate, setWaMessageTemplate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [presenters, setPresenters] = useState<DIDPresenter[]>([]);
  const [loadingPresenters, setLoadingPresenters] = useState(false);
  const [avatarPage, setAvatarPage] = useState(1);
  const [avatarSearch, setAvatarSearch] = useState("");

  // Step 2
  const [validationResult, setValidationResult] = useState<ExcelValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [previewPage, setPreviewPage] = useState(0);
  const [previewFilter, setPreviewFilter] = useState<"all" | "valid" | "error">("all");
  const [previewSearch, setPreviewSearch] = useState("");

  // Report
  const [currentReport, setCurrentReport] = useState<VideoReportResponse | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => { loadHistory(); }, [historyPage]);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await videoReportAPI.getAllVideoReports(historyPage, 10);
      setReportHistory(res.content);
      setHistoryTotalPages(res.totalPages);
    } catch { toast.error(t("reportVideo.failedLoadHistory")); }
    finally { setHistoryLoading(false); }
  };

  const loadInitialData = async () => {
    try {
      setLoadingPresenters(true);
      const [templateRes, presentersList] = await Promise.all([
        videoReportAPI.getDefaultTemplate(),
        videoReportAPI.getPresenters(),
      ]);
      setMessageTemplate(templateRes.template);
      setWaMessageTemplate(templateRes.waTemplate || "Hello :name, here is your personal video: :linkvideo");
      setPresenters(presentersList);
    } catch { toast.error(t("reportVideo.failedLoadData")); }
    finally { setLoadingPresenters(false); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        toast.error(t("reportVideo.formatMustBe"));
        return;
      }
      setSelectedFile(file);
      setValidationResult(null);
    }
  };

  const validateAndProceed = async () => {
    if (!selectedFile) { toast.error(t("reportVideo.selectExcelFile")); return; }
    if (!reportName.trim()) { toast.error(t("reportVideo.enterReportName")); return; }
    try {
      setValidating(true);
      const result = await videoReportAPI.validateExcel(selectedFile);
      setValidationResult(result);
      setStep(2);
    } catch { toast.error(t("reportVideo.failedValidate")); }
    finally { setValidating(false); }
  };

  // Navigate to detail page for existing reports
  const viewReportDetails = (id: number) => {
    router.push(`/report-video/personal-sales/${id}`);
  };

  const startNewGeneration = () => {
    setCurrentReport(null); setValidationResult(null); setSelectedFile(null);
    setStep(1); setViewMode("generate");
    loadInitialData();
  };

  const backToHistory = () => {
    setViewMode("history"); setCurrentReport(null); setValidationResult(null);
    setSelectedFile(null); setStep(1); loadHistory();
  };

  // Navigate to detail page after report created
  const goToReportDetail = (reportId: number) => {
    router.push(`/report-video/personal-sales/${reportId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t("reportVideo.personalSalesVideo")}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t("reportVideo.aiPersonalization")}</p>
          </div>
          {viewMode === "history" ? (
            <Button size="sm" onClick={startNewGeneration} className="h-8 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> {t("reportVideo.createNew")}
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={backToHistory} className="h-8 text-xs">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> {t("reportVideo.backToHistory")}
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* History View */}
        {viewMode === "history" && (
          <ReportHistory
            reportHistory={reportHistory}
            historyLoading={historyLoading}
            historyPage={historyPage}
            setHistoryPage={setHistoryPage}
            historyTotalPages={historyTotalPages}
            startNewGeneration={startNewGeneration}
            viewReportDetails={viewReportDetails}
            loadHistory={loadHistory}
          />
        )}

        {/* Generate View */}
        {viewMode === "generate" && (
          <div className="space-y-4">
            {/* Steps */}
            <div className="flex items-center gap-2 text-xs">
              <div className={`flex items-center gap-1.5 ${step === 1 ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${step === 1 ? "bg-blue-600 text-white" : step > 1 ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-700"}`}>
                  {step > 1 ? "✓" : "1"}
                </span>
                <span className="hidden sm:inline">{t("reportVideo.step1Title")}</span>
              </div>
              <ChevronRight className="h-3 w-3 text-slate-300" />
              <div className={`flex items-center gap-1.5 ${step === 2 ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${step === 2 ? "bg-blue-600 text-white" : step > 2 ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-700"}`}>
                  {step > 2 ? "✓" : "2"}
                </span>
                <span className="hidden sm:inline">{t("reportVideo.step2TitleNew")}</span>
              </div>
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <Step1InputData
                reportName={reportName}
                setReportName={setReportName}
                messageTemplate={messageTemplate}
                setMessageTemplate={setMessageTemplate}
                waMessageTemplate={waMessageTemplate}
                setWaMessageTemplate={setWaMessageTemplate}
                selectedFile={selectedFile}
                handleFileChange={handleFileChange}
                presenters={presenters}
                loadingPresenters={loadingPresenters}
                avatarPage={avatarPage}
                setAvatarPage={setAvatarPage}
                avatarSearch={avatarSearch}
                setAvatarSearch={setAvatarSearch}
                validating={validating}
                validateAndProceed={validateAndProceed}
              />
            )}

            {/* Step 2 - Preview & Process */}
            {step === 2 && (
              <Step2PreviewAndProcess
                validationResult={validationResult}
                previewPage={previewPage}
                setPreviewPage={setPreviewPage}
                previewFilter={previewFilter}
                setPreviewFilter={setPreviewFilter}
                previewSearch={previewSearch}
                setPreviewSearch={setPreviewSearch}
                currentReport={currentReport}
                setCurrentReport={setCurrentReport}
                generating={generating}
                setGenerating={setGenerating}
                loading={loading}
                setLoading={setLoading}
                reportName={reportName}
                messageTemplate={messageTemplate}
                waMessageTemplate={waMessageTemplate}
                setStep={setStep}
                backToHistory={backToHistory}
                loadHistory={loadHistory}
                goToReportDetail={goToReportDetail}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
