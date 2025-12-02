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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Upload,
  FileSpreadsheet,
  RefreshCw,
  Video,
  ChevronRight,
  ChevronLeft,
  Download,
  Search,
  LayoutGrid,
  MessageSquare,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { DIDPresenter, messageTemplateAPI, LanguageOption } from "@/lib/api";
import { config } from "@/lib/config";
import { AVATARS_PER_PAGE } from "./types";
import { useLanguage } from "@/contexts/LanguageContext";

interface Step1InputDataProps {
  reportName: string;
  setReportName: (value: string) => void;
  messageTemplate: string;
  setMessageTemplate: (value: string) => void;
  waMessageTemplate: string;
  setWaMessageTemplate: (value: string) => void;
  selectedFile: File | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  presenters: DIDPresenter[];
  loadingPresenters: boolean;
  avatarPage: number;
  setAvatarPage: (value: number | ((p: number) => number)) => void;
  avatarSearch: string;
  setAvatarSearch: (value: string) => void;
  validating: boolean;
  validateAndProceed: () => void;
}

export function Step1InputData({
  reportName,
  setReportName,
  messageTemplate,
  setMessageTemplate,
  waMessageTemplate,
  setWaMessageTemplate,
  selectedFile,
  handleFileChange,
  presenters,
  loadingPresenters,
  avatarPage,
  setAvatarPage,
  avatarSearch,
  setAvatarSearch,
  validating,
  validateAndProceed,
}: Step1InputDataProps) {
  const { t } = useLanguage();
  const [videoLanguages, setVideoLanguages] = useState<LanguageOption[]>([]);
  const [waLanguages, setWaLanguages] = useState<LanguageOption[]>([]);
  const [selectedVideoLang, setSelectedVideoLang] = useState<string>("en");
  const [selectedWaLang, setSelectedWaLang] = useState<string>("en");
  const [loadingLang, setLoadingLang] = useState(false);

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      setLoadingLang(true);
      const langs = await messageTemplateAPI.getLanguages();
      setVideoLanguages(langs.video);
      setWaLanguages(langs.whatsapp);
      
      // Set default language
      const defaultVideoLang = langs.video.find(l => l.isDefault)?.code || "en";
      const defaultWaLang = langs.whatsapp.find(l => l.isDefault)?.code || "en";
      setSelectedVideoLang(defaultVideoLang);
      setSelectedWaLang(defaultWaLang);
      
      // Load default templates based on actual default language
      try {
        const videoTemplate = await messageTemplateAPI.getTemplate("VIDEO", defaultVideoLang);
        setMessageTemplate(videoTemplate.template);
      } catch (error) {
        console.error("Failed to load default video template:", error);
      }
      
      try {
        const waTemplate = await messageTemplateAPI.getTemplate("WHATSAPP", defaultWaLang);
        setWaMessageTemplate(waTemplate.template);
      } catch (error) {
        console.error("Failed to load default WA template:", error);
      }
    } catch (error) {
      console.error("Failed to load languages:", error);
    } finally {
      setLoadingLang(false);
    }
  };

  const handleVideoLanguageChange = async (langCode: string) => {
    try {
      setSelectedVideoLang(langCode);
      const template = await messageTemplateAPI.getTemplate("VIDEO", langCode);
      setMessageTemplate(template.template);
    } catch (error) {
      toast.error(t("reportVideo.failedLoadTemplate"));
    }
  };

  const handleWaLanguageChange = async (langCode: string) => {
    try {
      setSelectedWaLang(langCode);
      const template = await messageTemplateAPI.getTemplate("WHATSAPP", langCode);
      setWaMessageTemplate(template.template);
    } catch (error) {
      toast.error(t("reportVideo.failedLoadTemplate"));
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-5">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t("reportVideo.reportName")}</Label>
        <Input value={reportName} onChange={e => setReportName(e.target.value)} placeholder="Personal Notification" className="h-9 text-sm" />
      </div>

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

      {/* Avatar Dialog */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t("reportVideo.availableAvatars")}</Label>
        {loadingPresenters ? (
          <div className="text-xs text-slate-400">{t("reportVideo.loadingAvatars")}</div>
        ) : presenters.length === 0 ? (
          <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
            {t("reportVideo.noAvatars")} <a href="https://studio.d-id.com/avatars/create" target="_blank" rel="noopener noreferrer" className="underline">{t("reportVideo.createAtDID")}</a>
          </div>
        ) : (
          <Dialog onOpenChange={open => { if (open) { setAvatarPage(1); setAvatarSearch(""); } }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                <LayoutGrid className="h-3.5 w-3.5 mr-1.5" /> {presenters.length} {t("reportVideo.avatars")}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-4xl h-[85vh] flex flex-col p-4">
              <DialogHeader>
                <DialogTitle className="text-sm">{t("reportVideo.avatars")} ({presenters.length})</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-2 py-2">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input placeholder={t("reportVideo.searchAvatar")} value={avatarSearch} onChange={e => { setAvatarSearch(e.target.value); setAvatarPage(1); }} className="pl-8 h-8 text-xs" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {(() => {
                  const filtered = presenters.filter(p => !avatarSearch || (p.presenter_name || "").toLowerCase().includes(avatarSearch.toLowerCase()));
                  const totalPages = Math.ceil(filtered.length / AVATARS_PER_PAGE);
                  const startIdx = (avatarPage - 1) * AVATARS_PER_PAGE;
                  const paginated = filtered.slice(startIdx, startIdx + AVATARS_PER_PAGE);
                  return (
                    <>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {paginated.map(p => (
                          <div key={p.presenter_id} className="border rounded-lg overflow-hidden hover:border-blue-400 cursor-pointer transition group bg-white dark:bg-slate-800" onClick={() => { navigator.clipboard.writeText(p.presenter_name || ""); toast.success(`"${p.presenter_name}" ${t("reportVideo.copied")}`); }}>
                            {p.thumbnail_url ? (
                              <div className="relative aspect-square">
                                <img src={p.thumbnail_url} alt={p.presenter_name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                  <span className="text-[10px] text-white font-medium px-2 py-1 bg-blue-600 rounded">{t("reportVideo.copy")}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="aspect-square bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                <Video className="h-6 w-6 text-slate-300" />
                              </div>
                            )}
                            <div className="p-1.5 text-center border-t">
                              <span className="text-[10px] font-medium truncate block">{p.presenter_name || t("reportVideo.avatars")}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setAvatarPage(p => Math.max(1, p - 1))} disabled={avatarPage === 1}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-xs text-slate-500">{avatarPage} / {totalPages}</span>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setAvatarPage(p => Math.min(totalPages, p + 1))} disabled={avatarPage === totalPages}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {filtered.length === 0 && <div className="text-center py-8 text-xs text-slate-400">{t("reportVideo.notFound")}</div>}
                    </>
                  );
                })()}
              </div>
            </DialogContent>
          </Dialog>
        )}
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
            </div>
            <Textarea value={messageTemplate} onChange={e => setMessageTemplate(e.target.value)} placeholder={t("reportVideo.enterVideoMessage")} rows={8} className="text-sm resize-none" />
            <p className="text-[10px] text-slate-400">{t("reportVideo.useNamePlaceholder")} <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">:name</code> {t("reportVideo.forRecipientName")}</p>
          </TabsContent>
          <TabsContent value="whatsapp" className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              <Select value={selectedWaLang} onValueChange={handleWaLanguageChange} disabled={loadingLang}>
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

      <div className="flex justify-end pt-2">
        <Button size="sm" className="h-8 text-xs" onClick={validateAndProceed} disabled={validating || !selectedFile}>
          {validating ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> {t("reportVideo.validate")}</> : <>{t("reportVideo.continue")} <ChevronRight className="h-3.5 w-3.5 ml-1" /></>}
        </Button>
      </div>
    </div>
  );
}
