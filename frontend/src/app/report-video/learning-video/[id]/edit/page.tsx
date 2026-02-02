"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronRight, ArrowLeft, Loader2 } from "lucide-react";
import {
  videoReportAPI,
  VideoAvatarOption,
  ExcelValidationResult,
  VideoReportResponse,
} from "@/lib/api";
import { toast } from "sonner";
import { Step1BasicSettings } from "../../Step1BasicSettings";
import { Step2DataInput } from "../../Step2DataInput";
import { Step3PreviewAndProcess } from "../../Step3PreviewAndProcess";
import { useLanguage } from "@/contexts/LanguageContext";

type Step = 1 | 2 | 3;

export default function EditLearningVideoPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const reportId = parseInt(params.id as string);
  
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);

  // Step 1
  const [reportName, setReportName] = useState("Learning Video Notification");
  const [learningVideoCode, setLearningVideoCode] = useState<string>("");
  const [learningVideoLanguage, setLearningVideoLanguage] = useState<string>("en");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [waMessageTemplate, setWaMessageTemplate] = useState("");
  const [videoLanguageCode, setVideoLanguageCode] = useState<string>("en");
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.0);
  const [voicePitch, setVoicePitch] = useState<number>(0);
  const [enableCaption, setEnableCaption] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [presenters, setPresenters] = useState<VideoAvatarOption[]>([]);
  const [loadingPresenters, setLoadingPresenters] = useState(false);
  const [avatarPage, setAvatarPage] = useState(1);
  const [avatarSearch, setAvatarSearch] = useState("");

  // Background
  const [useBackground, setUseBackground] = useState(false);
  const [backgrounds, setBackgrounds] = useState<string[]>([]);
  const [backgroundName, setBackgroundName] = useState<string>("");
  const [loadingBackgrounds, setLoadingBackgrounds] = useState(false);

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
    loadReportData();
    loadInitialData();
  }, [reportId]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const report = await videoReportAPI.getVideoReport(reportId);
      
      // Populate form with existing data
      setReportName(report.reportName || "Learning Video Notification");
      setUseBackground(report.useBackground || false);
      setBackgroundName(report.backgroundName || "");
      setMessageTemplate(report.messageTemplate || "");
      setWaMessageTemplate(report.waMessageTemplate || "");
      setCurrentReport(report);
      
      // Note: Excel file, voice settings, and language need to be re-entered
      toast.info("Please re-upload Excel file and verify all settings");
    } catch {
      toast.error("Failed to load report data");
      router.push("/report-video/learning-video");
    } finally {
      setLoading(false);
    }
  };

  const loadInitialData = async () => {
    try {
      setLoadingPresenters(true);
      setLoadingBackgrounds(true);
      const [templateRes, presentersList, backgroundsList] = await Promise.all([
        videoReportAPI.getDefaultTemplate(),
        videoReportAPI.getPresenters(),
        videoReportAPI.getBackgrounds(),
      ]);
      setMessageTemplate(templateRes.template);
      setWaMessageTemplate(templateRes.waTemplate || "Hello :name, here is your personal video: :linkvideo");
      setPresenters(presentersList);
      setBackgrounds(backgroundsList);
      if (!backgroundName && backgroundsList.length > 0) {
        setBackgroundName(backgroundsList[0]);
      }
    } catch { 
      toast.error(t("reportVideo.failedLoadData")); 
    } finally { 
      setLoadingPresenters(false); 
      setLoadingBackgrounds(false); 
    }
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
    if (!selectedFile) { 
      toast.error(t("reportVideo.selectExcelFile")); 
      return; 
    }
    if (!reportName.trim()) { 
      toast.error(t("reportVideo.enterReportName")); 
      return; 
    }
    try {
      setValidating(true);
      const result = await videoReportAPI.validateExcel(selectedFile);
      setValidationResult(result);
      setStep(3);
    } catch { 
      toast.error(t("reportVideo.failedValidate")); 
    } finally { 
      setValidating(false); 
    }
  };

  const backToDetail = () => {
    router.push(`/report-video/learning-video/${reportId}`);
  };

  const goToReportDetail = (id: number) => {
    router.push(`/report-video/learning-video/${id}`);
  };

  const loadHistory = () => {
    // Not needed in edit mode
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Edit Learning Video Report
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Update configuration and regenerate videos
              </p>
            </div>
            <Button 
              onClick={backToDetail} 
              variant="outline"
              className="h-10 px-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> 
              Back to Detail
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Progress Steps */}
        <div className="flex items-center gap-3 mb-8">
          <div className={`flex items-center gap-2 ${step === 1 ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 1 ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : step > 1 ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-700"}`}>
              {step > 1 ? "✓" : "1"}
            </span>
            <span className="hidden sm:inline font-medium">Basic Settings</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300" />
          <div className={`flex items-center gap-2 ${step === 2 ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 2 ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : step > 2 ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-700"}`}>
              {step > 2 ? "✓" : "2"}
            </span>
            <span className="hidden sm:inline font-medium">Data & Templates</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300" />
          <div className={`flex items-center gap-2 ${step === 3 ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 3 ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "bg-slate-200 dark:bg-slate-700"}`}>
              3
            </span>
            <span className="hidden sm:inline font-medium">Preview & Process</span>
          </div>
        </div>

        {/* Step 1 - Basic Settings */}
        {step === 1 && (
          <Step1BasicSettings
            reportName={reportName}
            setReportName={setReportName}
            learningVideoCode={learningVideoCode}
            setLearningVideoCode={setLearningVideoCode}
            learningVideoLanguage={learningVideoLanguage}
            setLearningVideoLanguage={setLearningVideoLanguage}
            videoLanguageCode={videoLanguageCode}
            setVideoLanguageCode={setVideoLanguageCode}
            voiceSpeed={voiceSpeed}
            setVoiceSpeed={setVoiceSpeed}
            voicePitch={voicePitch}
            setVoicePitch={setVoicePitch}
            enableCaption={enableCaption}
            setEnableCaption={setEnableCaption}
            presenters={presenters}
            loadingPresenters={loadingPresenters}
            avatarPage={avatarPage}
            setAvatarPage={setAvatarPage}
            avatarSearch={avatarSearch}
            setAvatarSearch={setAvatarSearch}
            useBackground={useBackground}
            setUseBackground={setUseBackground}
            backgrounds={backgrounds}
            loadingBackgrounds={loadingBackgrounds}
            backgroundName={backgroundName}
            setBackgroundName={setBackgroundName}
            onNext={() => setStep(2)}
          />
        )}

        {/* Step 2 - Data Input */}
        {step === 2 && (
          <Step2DataInput
            learningVideoCode={learningVideoCode}
            learningVideoLanguage={learningVideoLanguage}
            messageTemplate={messageTemplate}
            setMessageTemplate={setMessageTemplate}
            waMessageTemplate={waMessageTemplate}
            setWaMessageTemplate={setWaMessageTemplate}
            videoLanguageCode={videoLanguageCode}
            setVideoLanguageCode={setVideoLanguageCode}
            selectedFile={selectedFile}
            handleFileChange={handleFileChange}
            validating={validating}
            onBack={() => setStep(1)}
            validateAndProceed={validateAndProceed}
          />
        )}

        {/* Step 3 - Preview & Process */}
        {step === 3 && (
          <Step3PreviewAndProcess
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
            videoLanguageCode={videoLanguageCode}
            voiceSpeed={voiceSpeed}
            voicePitch={voicePitch}
            enableCaption={enableCaption}
            useBackground={useBackground}
            backgroundName={backgroundName}
            setStep={setStep}
            backToHistory={backToDetail}
            loadHistory={loadHistory}
            goToReportDetail={goToReportDetail}
          />
        )}
      </div>
    </div>
  );
}
