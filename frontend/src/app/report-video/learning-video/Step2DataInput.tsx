"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileSpreadsheet,
  RefreshCw,
  Video,
  ChevronRight,
  ChevronLeft,
  Download,
  MessageSquare,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { messageTemplateAPI, LanguageOption, geminiAPI, learningVideoApi } from "@/lib/api";
import { config } from "@/lib/config";
import { useLanguage } from "@/contexts/LanguageContext";

interface Step2DataInputProps {
  learningVideoCode: string;
  learningVideoLanguage: string;
  messageTemplate: string;
  setMessageTemplate: (value: string) => void;
  waMessageTemplate: string;
  setWaMessageTemplate: (value: string) => void;
  videoLanguageCode: string;
  setVideoLanguageCode: (value: string) => void;
  selectedFile: File | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  validating: boolean;
  onBack: () => void;
  validateAndProceed: () => void;
}

export function Step2DataInput({
  learningVideoCode,
  learningVideoLanguage,
  messageTemplate,
  setMessageTemplate,
  waMessageTemplate,
  setWaMessageTemplate,
  videoLanguageCode,
  setVideoLanguageCode,
  selectedFile,
  handleFileChange,
  validating,
  onBack,
  validateAndProceed,
}: Step2DataInputProps) {
  const { t } = useLanguage();
  const [videoLanguages, setVideoLanguages] = useState<LanguageOption[]>([]);
  const [waLanguages, setWaLanguages] = useState<LanguageOption[]>([]);
  const [selectedVideoLang, setSelectedVideoLang] = useState<string>(videoLanguageCode || "en");
  const [selectedWaLang, setSelectedWaLang] = useState<string>("en");
  const [loadingLang, setLoadingLang] = useState(false);
  const [translatingWa, setTranslatingWa] = useState(false);
  const [fetchingLearningVideo, setFetchingLearningVideo] = useState(false);

  useEffect(() => {
    loadLanguages();
  }, []);

  useEffect(() => {
    // Auto-load learning video content when component mounts
    if (learningVideoCode) {
      fetchLearningVideoContent();
    }
  }, [learningVideoCode, learningVideoLanguage]);

  const loadLanguages = async () => {
    try {
      setLoadingLang(true);
      const langs = await messageTemplateAPI.getLanguages();
      setVideoLanguages(langs.video);
      setWaLanguages(langs.whatsapp);
      
      const defaultVideoLang = langs.video.find(l => l.isDefault)?.code || "en";
      const defaultWaLang = langs.whatsapp.find(l => l.isDefault)?.code || "en";
      const currentVideoLang = (videoLanguageCode || selectedVideoLang || "").trim();
      const currentWaLang = (selectedWaLang || "").trim();

      const effectiveVideoLang = langs.video.some(l => l.code === currentVideoLang) ? currentVideoLang : defaultVideoLang;
      const effectiveWaLang = langs.whatsapp.some(l => l.code === currentWaLang) ? currentWaLang : defaultWaLang;

      setSelectedVideoLang(effectiveVideoLang);
      setVideoLanguageCode(effectiveVideoLang);
      setSelectedWaLang(effectiveWaLang);
      
      // Load default templates only if learning video code is NOT provided
      if (!learningVideoCode) {
        try {
          const videoTemplate = await messageTemplateAPI.getTemplate("VIDEO", effectiveVideoLang);
          if (!messageTemplate || !messageTemplate.trim()) {
            setMessageTemplate(videoTemplate.template);
          }
        } catch (error) {
          console.error("Failed to load default video template:", error);
        }
        
        try {
          const waTemplate = await messageTemplateAPI.getTemplate("WHATSAPP", effectiveWaLang);
          if (!waMessageTemplate || !waMessageTemplate.trim()) {
            setWaMessageTemplate(waTemplate.template);
          }
        } catch (error) {
          console.error("Failed to load default WA template:", error);
        }
      }
    } catch (error) {
      console.error("Failed to load languages:", error);
    } finally {
      setLoadingLang(false);
    }
  };

  const fetchLearningVideoContent = async () => {
    if (!learningVideoCode.trim()) {
      return;
    }

    const lang = learningVideoLanguage || "en";
    
    try {
      setFetchingLearningVideo(true);
      const videos = await learningVideoApi.getAll(0, 1000);
      const video = videos.content.find(v => v.code === learningVideoCode.trim());
      
      if (!video) {
        toast.warning("Learning video not found, using empty template");
        setMessageTemplate("");
        return;
      }

      const normalizedLang = lang.toLowerCase().trim();
      let text = "";

      if (normalizedLang === video.sourceLanguageCode.toLowerCase()) {
        text = video.sourceText || "";
      } else if (video.translations && video.translations[normalizedLang]) {
        text = video.translations[normalizedLang] || "";
      } else {
        toast.warning(`No translation found for language: ${lang}, using source text`);
        text = video.sourceText || "";
      }

      setMessageTemplate(text);
      toast.success("Learning video content loaded");
    } catch (error: any) {
      toast.error("Failed to fetch learning video: " + (error.message || "Unknown error"));
      console.error(error);
    } finally {
      setFetchingLearningVideo(false);
    }
  };

  const handleVideoLanguageChange = async (langCode: string) => {
    try {
      setSelectedVideoLang(langCode);
      setVideoLanguageCode(langCode);
    } catch (error) {
      toast.error(t("reportVideo.failedLoadTemplate"));
    }
  };

  const handleWaLanguageChange = async (langCode: string) => {
    try {
      setSelectedWaLang(langCode);
      const langName = waLanguages.find(l => l.code === langCode)?.name;
      const text = (waMessageTemplate || "").trim();
      if (!text) {
        const template = await messageTemplateAPI.getTemplate("WHATSAPP", langCode);
        setWaMessageTemplate(template.template);
        return;
      }

      setTranslatingWa(true);
      const res = await geminiAPI.translate({
        text,
        targetLanguageCode: langCode,
        targetLanguageName: langName,
      });
      setWaMessageTemplate(res.text);
    } catch (error) {
      toast.error(t("reportVideo.failedLoadTemplate"));
    } finally {
      setTranslatingWa(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-5">
      {/* Excel File Upload */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t("reportVideo.excelFile")}</Label>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-700" onClick={() => window.open(`${config.apiUrl}/video-reports/template-excel`, '_blank')}>
            <Download className="h-3 w-3 mr-1" /> {t("reportVideo.template")}
          </Button>
        </div>
        <label htmlFor="excel-upload" className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${selectedFile ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800" : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}`}>
          <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" id="excel-upload" />
          {selectedFile ? (
            <>
              <FileSpreadsheet className="h-8 w-8 text-emerald-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-2">{selectedFile.name}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{t("reportVideo.clickToChange")}</span>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              <span className="text-sm text-slate-500 mt-2">{t("reportVideo.uploadExcelFile")}</span>
              <span className="text-[10px] text-slate-400">{t("reportVideo.xlsxOrXls")}</span>
            </>
          )}
        </label>
        <p className="text-[10px] text-slate-400">{t("reportVideo.columnInfo")}</p>
      </div>

      {/* Template Tabs */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t("reportVideo.messageTemplate")}</Label>
        <Tabs defaultValue="video" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="video" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Video className="h-3 w-3 mr-1.5" /> {t("reportVideo.video")}
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="text-xs data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <MessageSquare className="h-3 w-3 mr-1.5" /> {t("reportVideo.whatsapp")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="video" className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              <Select value={selectedVideoLang} onValueChange={handleVideoLanguageChange} disabled={loadingLang}>
                <SelectTrigger className="h-8 text-xs w-[180px]">
                  <SelectValue placeholder={t("reportVideo.chooseLanguage")} />
                </SelectTrigger>
                <SelectContent>
                  {videoLanguages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code} className="text-xs">
                      {lang.name} {lang.isDefault && <span className="text-slate-400">(default)</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {learningVideoCode && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={fetchLearningVideoContent}
                  disabled={fetchingLearningVideo}
                >
                  {fetchingLearningVideo ? (
                    <><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Loading...</>
                  ) : (
                    <><Download className="h-3 w-3 mr-1" /> Reload</>
                  )}
                </Button>
              )}
            </div>
            <Textarea value={messageTemplate} onChange={e => setMessageTemplate(e.target.value)} placeholder={t("reportVideo.enterVideoMessage")} rows={8} className="text-sm resize-none" />
            <p className="text-[10px] text-slate-400">{t("reportVideo.useNamePlaceholder")} <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">:name</code> {t("reportVideo.forRecipientName")}</p>
          </TabsContent>
          <TabsContent value="whatsapp" className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              <Select value={selectedWaLang} onValueChange={handleWaLanguageChange} disabled={loadingLang || translatingWa}>
                <SelectTrigger className="h-8 text-xs w-[180px]">
                  <SelectValue placeholder={t("reportVideo.chooseLanguage")} />
                </SelectTrigger>
                <SelectContent>
                  {waLanguages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code} className="text-xs">
                      {lang.name} {lang.isDefault && <span className="text-slate-400">(default)</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea value={waMessageTemplate} onChange={e => setWaMessageTemplate(e.target.value)} placeholder={t("reportVideo.enterWaMessage")} rows={8} className="text-sm resize-none" />
            <p className="text-[10px] text-slate-400">
              {t("reportVideo.useNamePlaceholder")} <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">:name</code> {t("reportVideo.forRecipientName")}{" "}
              <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">:linkvideo</code> {t("reportVideo.forVideoLink")}
            </p>
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onBack}>
          <ChevronLeft className="h-3.5 w-3.5 mr-1" /> {t("reportVideo.previous")}
        </Button>
        <Button size="sm" className="h-8 text-xs" onClick={validateAndProceed} disabled={validating || !selectedFile}>
          {validating ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> {t("reportVideo.validate")}</> : <>{t("reportVideo.continue")} <ChevronRight className="h-3.5 w-3.5 ml-1" /></>}
        </Button>
      </div>
    </div>
  );
}
