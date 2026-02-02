"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import {
  videoReportAPI,
  VideoAvatarOption,
  ExcelValidationResult,
  VideoReportResponse,
  VideoReportRequest,
} from "@/lib/api";
import { toast } from "sonner";
import { Step1BasicSettings } from "../Step1BasicSettings";
import { Step2DataInput } from "../Step2DataInput";
import { Step3PreviewAndProcess } from "../Step3PreviewAndProcess";
import { useLanguage } from "@/contexts/LanguageContext";

type Step = 1 | 2 | 3;

export default function CreateLearningVideoPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [reportName, setReportName] = useState("Learning Video Notification");
  const [learningVideoCode, setLearningVideoCode] = useState<string>("");
  const [learningVideoLanguage, setLearningVideoLanguage] = useState<string>("en");
  const [videoLanguageCode, setVideoLanguageCode] = useState<string>("en");
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.0);
  const [voicePitch, setVoicePitch] = useState<number>(0);
  const [enableCaption, setEnableCaption] = useState<boolean>(true);
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
  const [messageTemplate, setMessageTemplate] = useState("");
  const [waMessageTemplate, setWaMessageTemplate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ExcelValidationResult | null>(null);
  const [validating, setValidating] = useState(false);

  // Step 3
  const [previewPage, setPreviewPage] = useState(0);
  const [previewFilter, setPreviewFilter] = useState<"all" | "valid" | "error">("all");
  const [previewSearch, setPreviewSearch] = useState("");
  const [currentReport, setCurrentReport] = useState<VideoReportResponse | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingPresenters(true);
      setLoadingBackgrounds(true);
      const [templateRes, presentersList, backgroundsList] = await Promise.all([
        videoReportAPI.getDefaultTemplate(),
        videoReportAPI.getPresenters(),
        videoReportAPI.getBackgrounds(),
      ]);
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

  const goToReportDetail = (reportId: number) => {
    router.push(`/report-video/learning-video/${reportId}`);
  };

  const backToList = () => {
    router.push("/report-video/learning-video");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={backToList}
                className="h-9 px-3"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Create Learning Video Report
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Generate AI-powered video notifications
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              {/* Step 1 */}
              <div className={`flex items-center gap-2 ${step >= 1 ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step === 1 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" 
                    : step > 1 
                    ? "bg-emerald-500 text-white" 
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                }`}>
                  {step > 1 ? "✓" : "1"}
                </div>
                <span className="text-sm font-medium hidden sm:inline">Settings</span>
              </div>

              <ChevronRight className="h-5 w-5 text-slate-300 mx-2" />

              {/* Step 2 */}
              <div className={`flex items-center gap-2 ${step >= 2 ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step === 2 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" 
                    : step > 2 
                    ? "bg-emerald-500 text-white" 
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                }`}>
                  {step > 2 ? "✓" : "2"}
                </div>
                <span className="text-sm font-medium hidden sm:inline">Data</span>
              </div>

              <ChevronRight className="h-5 w-5 text-slate-300 mx-2" />

              {/* Step 3 */}
              <div className={`flex items-center gap-2 ${step >= 3 ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step === 3 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" 
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                }`}>
                  3
                </div>
                <span className="text-sm font-medium hidden sm:inline">Process</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-6">
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
              backToHistory={backToList}
              loadHistory={() => {}}
              goToReportDetail={goToReportDetail}
            />
          )}
        </div>
      </div>
    </div>
  );
}
