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
  FileText,
  ChevronRight,
  Download,
  MessageSquare,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { pdfReportAPI, messageTemplateAPI, LanguageOption } from "@/lib/api";
import { config } from "@/lib/config";
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
  validating,
  validateAndProceed,
}: Step1InputDataProps) {
  const { t } = useLanguage();
  const [pdfLanguages, setPdfLanguages] = useState<LanguageOption[]>([]);
  const [waLanguages, setWaLanguages] = useState<LanguageOption[]>([]);
  const [selectedPdfLang, setSelectedPdfLang] = useState<string>("en");
  const [selectedWaLang, setSelectedWaLang] = useState<string>("en");
  const [loadingLang, setLoadingLang] = useState(false);

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      setLoadingLang(true);
      const langs = await messageTemplateAPI.getLanguages();
      // Use PDF languages for PDF template
      setPdfLanguages(langs.pdf || []);
      // Use whatsapp_pdf languages for WhatsApp PDF template
      setWaLanguages(langs.whatsapp_pdf || []);
      
      // Set default language and load template
      const defaultPdfLang = (langs.pdf || []).find((l: LanguageOption) => l.isDefault)?.code || "en";
      const defaultWaLang = (langs.whatsapp_pdf || []).find((l: LanguageOption) => l.isDefault)?.code || "en";
      setSelectedPdfLang(defaultPdfLang);
      setSelectedWaLang(defaultWaLang);
      
      // Load default templates based on actual default language
      try {
        const pdfTemplate = await messageTemplateAPI.getTemplate("PDF", defaultPdfLang);
        setMessageTemplate(pdfTemplate.template);
      } catch (error) {
        console.error("Failed to load default PDF template:", error);
      }
      
      try {
        const waTemplate = await messageTemplateAPI.getTemplate("WHATSAPP_PDF", defaultWaLang);
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

  const handlePdfLanguageChange = async (langCode: string) => {
    try {
      setSelectedPdfLang(langCode);
      const template = await messageTemplateAPI.getTemplate("PDF", langCode);
      setMessageTemplate(template.template);
    } catch (error) {
      toast.error(t("reportPdf.failedLoadTemplate"));
    }
  };

  const handleWaLanguageChange = async (langCode: string) => {
    try {
      setSelectedWaLang(langCode);
      const template = await messageTemplateAPI.getTemplate("WHATSAPP_PDF", langCode);
      setWaMessageTemplate(template.template);
    } catch (error) {
      toast.error(t("reportPdf.failedLoadTemplate"));
    }
  };

  const downloadTemplate = async () => {
    try {
      await pdfReportAPI.downloadExcelTemplate();
      toast.success(t("reportPdf.templateDownloaded"));
    } catch (error) {
      toast.error(t("reportPdf.failedDownloadTemplate"));
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-5">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t("reportPdf.reportName")}</Label>
        <Input value={reportName} onChange={e => setReportName(e.target.value)} placeholder="Personal Letter" className="h-9 text-sm" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t("reportPdf.excelFile")}</Label>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-700" onClick={downloadTemplate}>
            <Download className="h-3 w-3 mr-1" /> {t("reportPdf.template")}
          </Button>
        </div>
        <label htmlFor="excel-upload" className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${selectedFile ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800" : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}`}>
          <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" id="excel-upload" />
          {selectedFile ? (
            <>
              <FileSpreadsheet className="h-8 w-8 text-emerald-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-2">{selectedFile.name}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{t("reportPdf.clickToChange")}</span>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              <span className="text-sm text-slate-500 mt-2">{t("reportPdf.uploadExcelFile")}</span>
              <span className="text-[10px] text-slate-400">{t("reportPdf.xlsxOrXls")}</span>
            </>
          )}
        </label>
        <p className="text-[10px] text-slate-400">{t("reportPdf.columnInfo")}</p>
      </div>

      {/* Template Tabs */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t("reportPdf.messageTemplate")}</Label>
        <Tabs defaultValue="pdf" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="pdf" className="text-xs data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <FileText className="h-3 w-3 mr-1.5" /> PDF
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="text-xs data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <MessageSquare className="h-3 w-3 mr-1.5" /> WhatsApp
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pdf" className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              <Select value={selectedPdfLang} onValueChange={handlePdfLanguageChange} disabled={loadingLang}>
                <SelectTrigger className="h-8 text-xs w-[180px]">
                  <SelectValue placeholder={t("reportPdf.chooseLanguage")} />
                </SelectTrigger>
                <SelectContent>
                  {pdfLanguages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code} className="text-xs">
                      {lang.name} {lang.isDefault && <span className="text-slate-400">(default)</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea value={messageTemplate} onChange={e => setMessageTemplate(e.target.value)} placeholder={t("reportPdf.enterPdfContent")} rows={12} className="text-sm resize-none font-mono" />
            <p className="text-[10px] text-slate-400">{t("reportPdf.useNamePlaceholder")} <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">:name</code> {t("reportPdf.forRecipientName")}</p>
          </TabsContent>
          <TabsContent value="whatsapp" className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              <Select value={selectedWaLang} onValueChange={handleWaLanguageChange} disabled={loadingLang}>
                <SelectTrigger className="h-8 text-xs w-[180px]">
                  <SelectValue placeholder={t("reportPdf.chooseLanguage")} />
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
            <Textarea value={waMessageTemplate} onChange={e => setWaMessageTemplate(e.target.value)} placeholder={t("reportPdf.enterWaMessage")} rows={8} className="text-sm resize-none" />
            <p className="text-[10px] text-slate-400">
              {t("reportPdf.useNamePlaceholder")} <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">:name</code> {t("reportPdf.forRecipientName")},{" "}
              <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">:linkpdf</code> {t("reportPdf.forPdfLink")}
            </p>
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex justify-end pt-2">
        <Button size="sm" className="h-8 text-xs" onClick={validateAndProceed} disabled={validating || !selectedFile}>
          {validating ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> {t("reportPdf.validating")}</> : <>{t("reportPdf.continue")} <ChevronRight className="h-3.5 w-3.5 ml-1" /></>}
        </Button>
      </div>
    </div>
  );
}
