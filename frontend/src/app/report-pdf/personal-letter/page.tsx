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
  pdfReportAPI,
  PdfExcelValidationResult,
  PdfReportResponse,
} from "@/lib/api";
import { toast } from "sonner";
import { ViewMode, Step } from "./types";
import { ReportHistory } from "./ReportHistory";
import { Step1InputData } from "./Step1InputData";
import { Step2PreviewAndProcess } from "./Step2PreviewAndProcess";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PersonalLetterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("history");
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  // History
  const [reportHistory, setReportHistory] = useState<PdfReportResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);

  // Step 1
  const [reportName, setReportName] = useState("Personal Letter");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [waMessageTemplate, setWaMessageTemplate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Step 2
  const [validationResult, setValidationResult] = useState<PdfExcelValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [previewPage, setPreviewPage] = useState(0);
  const [previewFilter, setPreviewFilter] = useState<"all" | "valid" | "error">("all");
  const [previewSearch, setPreviewSearch] = useState("");

  // Report
  const [currentReport, setCurrentReport] = useState<PdfReportResponse | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => { loadHistory(); }, [historyPage]);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await pdfReportAPI.getAllPdfReports(historyPage, 10);
      setReportHistory(res.content);
      setHistoryTotalPages(res.totalPages);
    } catch { toast.error(t("reportPdf.failedLoadHistory")); }
    finally { setHistoryLoading(false); }
  };

  const loadInitialData = async () => {
    try {
      const templateRes = await pdfReportAPI.getDefaultTemplates();
      setMessageTemplate(templateRes.messageTemplate);
      setWaMessageTemplate(templateRes.waMessageTemplate);
    } catch { toast.error(t("reportPdf.failedLoadTemplate")); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        toast.error(t("reportPdf.formatMustBe"));
        return;
      }
      setSelectedFile(file);
      setValidationResult(null);
    }
  };

  const validateAndProceed = async () => {
    if (!selectedFile) { toast.error(t("reportPdf.selectExcelFile")); return; }
    if (!reportName.trim()) { toast.error(t("reportPdf.enterReportName")); return; }
    try {
      setValidating(true);
      const result = await pdfReportAPI.validateExcel(selectedFile);
      
      // Check if validation has errors (missing columns etc)
      if (!result.valid && result.errors && result.errors.length > 0) {
        // Show error toast for column validation errors
        toast.error(result.errors.join(", "));
        setValidationResult(result);
        return; // Don't proceed to step 2
      }
      
      // Check if there's no data
      if (!result.rows || result.rows.length === 0) {
        toast.error(t("reportPdf.noDataFound"));
        return;
      }
      
      setValidationResult(result);
      setStep(2);
    } catch (error) { 
      toast.error(t("reportPdf.failedValidate")); 
    }
    finally { setValidating(false); }
  };

  // Navigate to detail page for existing reports
  const viewReportDetails = (id: number) => {
    router.push(`/report-pdf/personal-letter/${id}`);
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
    router.push(`/report-pdf/personal-letter/${reportId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t("reportPdf.personalLetterPdf")}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t("reportPdf.pdfPersonalization")}</p>
          </div>
          {viewMode === "history" ? (
            <Button size="sm" onClick={startNewGeneration} className="h-8 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> {t("reportPdf.createNew")}
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={backToHistory} className="h-8 text-xs">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> {t("reportPdf.backToHistory")}
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
              <div className={`flex items-center gap-1.5 ${step === 1 ? "text-red-600 dark:text-red-400" : "text-slate-400"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${step === 1 ? "bg-red-600 text-white" : step > 1 ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-700"}`}>
                  {step > 1 ? "✓" : "1"}
                </span>
                <span className="hidden sm:inline">{t("reportPdf.step1Title")}</span>
              </div>
              <ChevronRight className="h-3 w-3 text-slate-300" />
              <div className={`flex items-center gap-1.5 ${step === 2 ? "text-red-600 dark:text-red-400" : "text-slate-400"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${step === 2 ? "bg-red-600 text-white" : "bg-slate-200 dark:bg-slate-700"}`}>
                  2
                </span>
                <span className="hidden sm:inline">{t("reportPdf.step2Title")}</span>
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
