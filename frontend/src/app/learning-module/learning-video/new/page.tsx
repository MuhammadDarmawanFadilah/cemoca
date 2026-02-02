"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Check, Download, RefreshCw, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { showErrorToast, showSuccessToast, showInfoToast } from "@/components/ui/toast-utils";
import { learningVideoApi, type GeminiReviewResponse, type LearningVideoLanguage } from "@/lib/learningVideoApi";
import { useLanguage } from "@/contexts/LanguageContext";

const LANGUAGES: LearningVideoLanguage[] = [
  { code: "id", name: "Bahasa Indonesia" },
  { code: "en", name: "English" },
  { code: "ja", name: "Japanese" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "km", name: "Khmer (Cambodia)" },
  { code: "zh", name: "Chinese (Mandarin)" },
  { code: "tl", name: "Filipino (Tagalog)" },
  { code: "hi", name: "Hindi" },
  { code: "ko", name: "Korean" },
];

function normalizeLangCode(raw: string) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .split("-")[0];
}

function countCharacters(text: string): number {
  return text.length;
}

function getCharCountColor(count: number): string {
  if (count === 0) return "text-muted-foreground";
  if (count < 500) return "text-gray-600 dark:text-gray-400";
  if (count < 1000) return "text-blue-600 dark:text-blue-400";
  if (count < 1500) return "text-green-600 dark:text-green-400";
  if (count < 2000) return "text-orange-600 dark:text-orange-400";
  return "text-purple-600 dark:text-purple-400";
}

function CharacterCounter({ text }: { text: string }) {
  const count = countCharacters(text);
  const colorClass = getCharCountColor(count);
  
  return (
    <div className={`text-xs font-medium ${colorClass} flex items-center gap-1`}>
      <span className="font-semibold">{count.toLocaleString()}</span>
      <span>characters</span>
    </div>
  );
}

function estimateVideoDuration(text: string): { minutes: number; seconds: number; totalSeconds: number } {
  const charCount = countCharacters(text.trim());
  // Average speaking rate: ~800 characters per minute for narration
  // Adjusted for natural pauses and emphasis
  const charsPerMinute = 750;
  const totalSeconds = Math.ceil((charCount / charsPerMinute) * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return { minutes, seconds, totalSeconds };
}

function VideoDurationEstimate({ text }: { text: string }) {
  const { t } = useLanguage();
  const duration = estimateVideoDuration(text);
  
  if (!text.trim()) {
    return (
      <div className="rounded-lg border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
        {t('learningModule.learningVideo.noDurationEstimate')}
      </div>
    );
  }
  
  return (
    <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {t('learningModule.learningVideo.estimatedDuration')}
          </div>
          <div className="text-xs text-muted-foreground">
            {t('learningModule.learningVideo.basedOnHeyGen')}
          </div>
        </div>
      </div>
      
      <div className="flex items-baseline gap-2">
        <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
          {duration.minutes}:{duration.seconds.toString().padStart(2, '0')}
        </div>
        <div className="text-sm text-muted-foreground">
          ({duration.totalSeconds} {t('learningModule.learningVideo.seconds')})
        </div>
      </div>
      
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex flex-col">
            <span className="text-muted-foreground">{t('learningModule.learningVideo.characters')}</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{countCharacters(text.trim()).toLocaleString()}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">{t('learningModule.learningVideo.speakingRate')}</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">~750 chars/min</span>
          </div>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground italic">
        {t('learningModule.learningVideo.durationNote')}
      </div>
    </div>
  );
}

export default function LearningVideoNewPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);

  const [inputLanguage, setInputLanguage] = React.useState<string>("id");
  const [inputText, setInputText] = React.useState<string>("");

  const [reviewLoading, setReviewLoading] = React.useState(false);
  const [review, setReview] = React.useState<GeminiReviewResponse | null>(null);
  const [reviewTab, setReviewTab] = React.useState<string>("ALL");
  const [reviewStale, setReviewStale] = React.useState(false);
  const [reviewMeta, setReviewMeta] = React.useState<{ text: string; lang: string; at: number } | null>(null);
  const [reviewElapsedSec, setReviewElapsedSec] = React.useState(0);

  const [translationsLoading, setTranslationsLoading] = React.useState(false);
  const [translations, setTranslations] = React.useState<Record<string, string>>({});
  const [edited, setEdited] = React.useState<Record<string, boolean>>({});

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<null | (() => void)>(null);
  const [confirmText, setConfirmText] = React.useState<string>("");

  const [saveLoading, setSaveLoading] = React.useState(false);
  const [savedCode, setSavedCode] = React.useState<string>("");

  const [previewLanguage, setPreviewLanguage] = React.useState<string>("id");
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewVideoId, setPreviewVideoId] = React.useState<string>("");
  const [previewStatus, setPreviewStatus] = React.useState<string>("");
  const [previewUrl, setPreviewUrl] = React.useState<string>("");
  const [previewError, setPreviewError] = React.useState<string>("");

  const targets = React.useMemo(() => {
    const source = normalizeLangCode(inputLanguage);
    return LANGUAGES.filter((l) => normalizeLangCode(l.code) !== source);
  }, [inputLanguage]);

  const inputLanguageName = React.useMemo(() => {
    const found = LANGUAGES.find((l) => normalizeLangCode(l.code) === normalizeLangCode(inputLanguage));
    return found?.name || inputLanguage;
  }, [inputLanguage]);

  const inputLanguageCodeNormalized = React.useMemo(() => normalizeLangCode(inputLanguage), [inputLanguage]);

  const splitReviewLines = React.useCallback((text: string) => {
    const raw = String(text || "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.replace(/^\s*(?:[-*]|\d+\.)\s+/, "").trim())
      .filter(Boolean);

    const seen = new Set<string>();
    const out: string[] = [];
    for (const line of raw) {
      const key = line.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(line);
    }
    return out;
  }, []);

  const ReviewBlock = React.useCallback(
    ({ title, text }: { title: string; text: string }) => {
      const lines = splitReviewLines(text);
      return (
        <div className="rounded-lg border bg-muted/10 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
          {lines.length === 0 ? (
            <div className="mt-2 text-sm text-muted-foreground">-</div>
          ) : lines.length === 1 && lines[0].length > 160 ? (
            <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{lines[0]}</div>
          ) : (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {lines.map((l, i) => (
                <li key={`${title}-${i}`}>{l}</li>
              ))}
            </ul>
          )}
        </div>
      );
    },
    [splitReviewLines]
  );

  React.useEffect(() => {
    if (!reviewLoading) {
      setReviewElapsedSec(0);
      return;
    }
    const start = Date.now();
    setReviewElapsedSec(0);
    const id = setInterval(() => {
      setReviewElapsedSec(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    }, 250);
    return () => clearInterval(id);
  }, [reviewLoading]);

  React.useEffect(() => {
    if (reviewLoading) return;
    if (!reviewMeta) return;
    const changed = reviewMeta.text !== inputText || reviewMeta.lang !== inputLanguageCodeNormalized;
    if (!changed) return;
    setReview(null);
    setReviewMeta(null);
    setReviewTab("ALL");
    setReviewStale(true);
  }, [inputText, inputLanguageCodeNormalized, reviewLoading, reviewMeta]);

  const isStep1Valid = !!normalizeLangCode(inputLanguage) && !!inputText.trim();

  const goToStep = (next: 1 | 2 | 3) => {
    if (next === 2 && !isStep1Valid) {
      showInfoToast("Pilih bahasa dan isi teks terlebih dahulu.");
      return;
    }
    if (next === 3 && !savedCode) {
      showInfoToast("Simpan dulu untuk mendapatkan kode unik.");
      return;
    }
    setStep(next);
  };

  const nextFromStep1 = async () => {
    if (!isStep1Valid) {
      showInfoToast("Pilih bahasa dan isi teks terlebih dahulu.");
      return;
    }
    if (translationsLoading) return;

    setTranslationsLoading(true);
    try {
      const res = await learningVideoApi.translateAll({
        text: inputText,
        sourceLanguageCode: inputLanguageCodeNormalized,
        targets,
      });
      setTranslations(res.translations || {});
      setEdited({});
      setStep(2);
      showSuccessToast("Terjemahan berhasil dibuat.");
    } catch (e: any) {
      showErrorToast(e);
    } finally {
      setTranslationsLoading(false);
    }
  };

  const openConfirm = (text: string, action: () => void) => {
    setConfirmText(text);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const markEdited = (code: string, value: boolean) => {
    const k = normalizeLangCode(code);
    setEdited((prev) => ({ ...prev, [k]: value }));
  };

  const runReview = async () => {
    if (!inputText.trim()) {
      showInfoToast("Teks masih kosong.");
      return;
    }

    setReviewLoading(true);
    setReview(null);
    setReviewTab("ALL");
    setReviewStale(false);
    try {
      const res = await learningVideoApi.review({
        text: inputText,
        inputLanguageCode: inputLanguageCodeNormalized,
        inputLanguageName,
      });
      setReview(res);
      setReviewMeta({ text: inputText, lang: inputLanguageCodeNormalized, at: Date.now() });
      showSuccessToast("AI Review selesai.");
    } catch (e: any) {
      showErrorToast(e);
    } finally {
      setReviewLoading(false);
    }
  };

  const translateAll = async () => {
    if (!inputText.trim()) {
      showInfoToast("Teks masih kosong.");
      return;
    }

    const hasEdits = Object.values(edited).some(Boolean);
    const run = async () => {
      setTranslationsLoading(true);
      try {
        const res = await learningVideoApi.translateAll({
          text: inputText,
          sourceLanguageCode: normalizeLangCode(inputLanguage),
          targets,
        });
        setTranslations(res.translations || {});
        setEdited({});
        showSuccessToast("Terjemahan berhasil dibuat.");
      } catch (e: any) {
        showErrorToast(e);
      } finally {
        setTranslationsLoading(false);
      }
    };

    if (hasEdits) {
      openConfirm("Ada terjemahan yang sudah diedit. Regenerate akan mereset editan. Lanjut?", run);
      return;
    }

    await run();
  };

  const regenerateOne = async (lang: LearningVideoLanguage) => {
    const code = normalizeLangCode(lang.code);
    const run = async () => {
      setTranslationsLoading(true);
      try {
        const res = await learningVideoApi.translateAll({
          text: inputText,
          sourceLanguageCode: normalizeLangCode(inputLanguage),
          targets: [lang],
        });
        const next = res.translations?.[code] ?? "";
        setTranslations((prev) => ({ ...prev, [code]: next }));
        markEdited(code, false);
        showSuccessToast(`Regenerate ${lang.name} berhasil.`);
      } catch (e: any) {
        showErrorToast(e);
      } finally {
        setTranslationsLoading(false);
      }
    };

    if (edited[code]) {
      openConfirm(`Terjemahan ${lang.name} sudah diedit. Regenerate akan mereset editan. Lanjut?`, run);
      return;
    }

    await run();
  };

  const onSave = async () => {
    if (!isStep1Valid) {
      showInfoToast("Lengkapi Step 1 dulu.");
      setStep(1);
      return;
    }

    setSaveLoading(true);
    try {
      const payloadTranslations: Record<string, string> = {};
      for (const l of targets) {
        const k = normalizeLangCode(l.code);
        payloadTranslations[k] = (translations[k] || "").trim();
      }

      const res = await learningVideoApi.create({
        sourceLanguageCode: normalizeLangCode(inputLanguage),
        sourceText: inputText,
        translations: payloadTranslations,
        review,
      });

      setSavedCode(res.code);
      showSuccessToast("Saved successfully.");
      setStep(3);
      setPreviewLanguage(normalizeLangCode(inputLanguage));
    } catch (e: any) {
      showErrorToast(e);
    } finally {
      setSaveLoading(false);
    }
  };

  const startPreview = async () => {
    if (!savedCode) {
      showInfoToast("Kode belum ada. Simpan dulu.");
      return;
    }

    const lang = normalizeLangCode(previewLanguage);

    setPreviewLoading(true);
    setPreviewVideoId("");
    setPreviewStatus("");
    setPreviewUrl("");
    setPreviewError("");

    try {
      const started = await learningVideoApi.startPreview({ code: savedCode, languageCode: lang });
      if (!started?.success || !started.videoId) {
        throw new Error(started?.error || "Failed to start preview");
      }

      setPreviewVideoId(started.videoId);
      setPreviewStatus(started.status || "processing");
      showInfoToast("Preview diproses. Mohon tunggu beberapa menit.");

      const id = started.videoId;
      let cancelled = false;

      const poll = async () => {
        if (cancelled) return;
        const st = await learningVideoApi.getPreviewStatus(id);
        if (!st?.success) {
          setPreviewError(st?.error || "Failed to get status");
          setPreviewStatus("failed");
          return;
        }
        setPreviewStatus(st.status || "");
        if (st.videoUrl) {
          setPreviewUrl(st.videoUrl);
        }
        if ((st.status || "").toLowerCase() === "completed" && st.videoUrl) {
          return;
        }
        if (["failed", "error"].includes((st.status || "").toLowerCase())) {
          setPreviewError(st.error || "Preview failed");
          return;
        }
        setTimeout(poll, 5000);
      };

      setTimeout(poll, 3000);

      return () => {
        cancelled = true;
      };
    } catch (e: any) {
      showErrorToast(e);
      setPreviewError(e?.message || "Failed");
      setPreviewStatus("failed");
    } finally {
      setPreviewLoading(false);
    }
  };

  const exportData = async (format: 'csv' | 'xlsx' | 'pdf' | 'text') => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const fileName = `${savedCode}_${dd}${mm}${yyyy}`;

    const rows: Array<{ no: number; bahasa: string; message: string }> = [];
    rows.push({ no: 1, bahasa: inputLanguageName, message: inputText });
    let idx = 2;
    for (const l of targets) {
      const k = normalizeLangCode(l.code);
      rows.push({ no: idx++, bahasa: l.name, message: translations[k] || '' });
    }

    if (format === 'csv') {
      const csvContent = [
        'No,Bahasa,Message',
        ...rows.map(r => `${r.no},"${r.bahasa.replace(/"/g, '""')}","${r.message.replace(/"/g, '""').replace(/\n/g, ' ')}"`)
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}.csv`;
      link.click();
      showSuccessToast('CSV exported successfully.');
    } else if (format === 'xlsx') {
      try {
        const XLSX = await import('xlsx');
        const ws = XLSX.utils.json_to_sheet(rows.map(r => ({ No: r.no, Bahasa: r.bahasa, Message: r.message })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Learning Video');
        XLSX.writeFile(wb, `${fileName}.xlsx`);
        showSuccessToast('XLSX exported successfully.');
      } catch (e) {
        showErrorToast('Failed to export XLSX.');
      }
    } else if (format === 'pdf') {
      try {
        const { jsPDF } = await import('jspdf');
        const autoTable = (await import('jspdf-autotable')).default;
        const doc = new jsPDF();
        doc.text('Learning Video Export', 14, 15);
        autoTable(doc, {
          startY: 20,
          head: [['No', 'Bahasa', 'Message']],
          body: rows.map(r => [r.no, r.bahasa, r.message]),
        });
        doc.save(`${fileName}.pdf`);
        showSuccessToast('PDF exported successfully.');
      } catch (e) {
        showErrorToast('Failed to export PDF.');
      }
    } else if (format === 'text') {
      const textContent = rows.map(r => `${r.no}. ${r.bahasa}:\n${r.message}`).join('\n\n');
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}.txt`;
      link.click();
      showSuccessToast('Text file exported successfully.');
    }
  };

  const stepItemClass = (active: boolean) =>
    cn(
      "flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors",
      active ? "border-primary bg-primary/5" : "border-muted bg-background hover:bg-muted/20"
    );

  return (
    <div className="mx-auto w-full max-w-none space-y-2 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold md:text-2xl">{t('learningModule.learningVideo.pageTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('learningModule.learningVideo.pageSubtitle')}</p>
      </div>

      <Card className="gap-2 py-3">
        <CardContent className="pt-3">
          <div className="rounded-lg border bg-muted/10 p-1.5">
            <div className="grid gap-2 sm:grid-cols-3">
              <button type="button" onClick={() => goToStep(1)} className={stepItemClass(step === 1)}>
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold",
                    step >= 1 ? "border-primary bg-primary text-primary-foreground" : "border-muted bg-background text-muted-foreground"
                  )}
                  aria-hidden
                >
                  {step > 1 ? <Check className="h-4 w-4" /> : 1}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-tight">{t('learningModule.learningVideo.step1')}</div>
                  <div className="text-xs text-muted-foreground">{t('learningModule.learningVideo.step1Subtitle')}</div>
                </div>
              </button>

              <button type="button" onClick={() => goToStep(2)} className={stepItemClass(step === 2)} disabled={!isStep1Valid}>
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold",
                    step >= 2 ? "border-primary bg-primary text-primary-foreground" : "border-muted bg-background text-muted-foreground"
                  )}
                  aria-hidden
                >
                  {step > 2 ? <Check className="h-4 w-4" /> : 2}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-tight">{t('learningModule.learningVideo.step2')}</div>
                  <div className="text-xs text-muted-foreground">{t('learningModule.learningVideo.step2Subtitle')}</div>
                </div>
              </button>

              <button type="button" onClick={() => goToStep(3)} className={stepItemClass(step === 3)} disabled={!savedCode}>
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold",
                    step >= 3 ? "border-primary bg-primary text-primary-foreground" : "border-muted bg-background text-muted-foreground"
                  )}
                  aria-hidden
                >
                  3
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-tight">{t('learningModule.learningVideo.step3')}</div>
                  <div className="text-xs text-muted-foreground">{t('learningModule.learningVideo.step3Subtitle')}</div>
                </div>
              </button>
            </div>
          </div>

          {step === 1 ? (
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('learningModule.learningVideo.inputLanguage')}</Label>
                  <Select value={inputLanguage} onValueChange={setInputLanguage}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t('learningModule.learningVideo.selectLanguage')} />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.code} value={l.code}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <div className="h-11" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t('learningModule.learningVideo.text')}</Label>
                  <CharacterCounter text={inputText} />
                </div>
                <Textarea
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    if (reviewStale === false && (review || reviewMeta)) {
                      setReviewStale(true);
                    }
                  }}
                  className="min-h-[220px] resize-none"
                  placeholder={t('learningModule.learningVideo.textPlaceholder')}
                />
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold">{t('learningModule.learningVideo.aiReview')}</div>
                  </div>
                  <Button type="button" onClick={runReview} disabled={reviewLoading || !inputText.trim()} className="h-11">
                    <Wand2 className="mr-2 h-4 w-4" />
                    {reviewLoading ? t('learningModule.learningVideo.aiReviewProcessing') : review ? t('learningModule.learningVideo.aiReviewRegenerate') : t('learningModule.learningVideo.aiReviewGenerate')}
                  </Button>
                </div>

                {reviewStale ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
                    {t('learningModule.learningVideo.aiReviewStale')}
                  </div>
                ) : null}

                {reviewLoading ? (
                  <div className="rounded-lg border bg-muted/10 p-4">
                    <LoadingSpinner size="md" text={t('learningModule.learningVideo.processing', { seconds: reviewElapsedSec })} />
                  </div>
                ) : null}

                {review ? (
                  <div className="space-y-3">
                    <Tabs value={reviewTab} onValueChange={setReviewTab}>
                      <TabsList className="w-full justify-start overflow-x-auto">
                        <TabsTrigger value="ALL">ALL</TabsTrigger>
                        <TabsTrigger value="duration">{t('learningModule.learningVideo.duration')}</TabsTrigger>
                        <TabsTrigger value="clarity">{t('learningModule.learningVideo.clarity')}</TabsTrigger>
                        <TabsTrigger value="motivationalImpact">{t('learningModule.learningVideo.motivationalImpact')}</TabsTrigger>
                        <TabsTrigger value="recommendationForAgency">{t('learningModule.learningVideo.recommendationForAgency')}</TabsTrigger>
                        {String(review.suggestions || "").trim() ? <TabsTrigger value="suggestions">{t('learningModule.learningVideo.suggestions')}</TabsTrigger> : null}
                      </TabsList>

                      <TabsContent value="ALL" className="space-y-3">
                        <VideoDurationEstimate text={inputText} />
                        <div className="grid gap-3 md:grid-cols-2">
                          <ReviewBlock title={t('learningModule.learningVideo.clarity')} text={review.clarity || ""} />
                          <ReviewBlock title={t('learningModule.learningVideo.motivationalImpact')} text={review.motivationalImpact || ""} />
                          <ReviewBlock title={t('learningModule.learningVideo.recommendationForAgency')} text={review.recommendationForAgency || ""} />
                          {String(review.suggestions || "").trim() ? <ReviewBlock title={t('learningModule.learningVideo.suggestions')} text={review.suggestions || ""} /> : null}
                        </div>
                        <div className="text-xs text-muted-foreground">{t('learningModule.learningVideo.model')}: {review.model || "-"}</div>
                      </TabsContent>

                      <TabsContent value="duration" className="space-y-3">
                        <VideoDurationEstimate text={inputText} />
                      </TabsContent>

                      <TabsContent value="clarity" className="space-y-3">
                        <ReviewBlock title={t('learningModule.learningVideo.clarity')} text={review.clarity || ""} />
                        <div className="text-xs text-muted-foreground">{t('learningModule.learningVideo.model')}: {review.model || "-"}</div>
                      </TabsContent>

                      <TabsContent value="motivationalImpact" className="space-y-3">
                        <ReviewBlock title={t('learningModule.learningVideo.motivationalImpact')} text={review.motivationalImpact || ""} />
                        <div className="text-xs text-muted-foreground">{t('learningModule.learningVideo.model')}: {review.model || "-"}</div>
                      </TabsContent>

                      <TabsContent value="recommendationForAgency" className="space-y-3">
                        <ReviewBlock title={t('learningModule.learningVideo.recommendationForAgency')} text={review.recommendationForAgency || ""} />
                        <div className="text-xs text-muted-foreground">{t('learningModule.learningVideo.model')}: {review.model || "-"}</div>
                      </TabsContent>

                      <TabsContent value="suggestions" className="space-y-3">
                        <ReviewBlock title={t('learningModule.learningVideo.suggestions')} text={review.suggestions || ""} />
                        <div className="text-xs text-muted-foreground">{t('learningModule.learningVideo.model')}: {review.model || "-"}</div>
                      </TabsContent>
                    </Tabs>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  onClick={nextFromStep1}
                  disabled={!isStep1Valid || translationsLoading}
                  className="h-12 px-10 text-base"
                >
                  {translationsLoading ? t('learningModule.learningVideo.translating') : t('learningModule.learningVideo.next')}
                </Button>
              </div>

              {translationsLoading ? (
                <div className="rounded-lg border bg-muted/10 p-4">
                  <LoadingSpinner size="md" text={t('learningModule.learningVideo.translatingAll')} />
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="mt-4 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold">{t('learningModule.learningVideo.translations')}</div>
                  <div className="text-xs text-muted-foreground">{t('learningModule.learningVideo.inputLanguageLabel', { language: inputLanguageName })}</div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={translateAll} disabled={translationsLoading}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {translationsLoading ? t('learningModule.learningVideo.translating') : t('learningModule.learningVideo.translateAll')}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4">
                {targets.map((l) => {
                  const k = normalizeLangCode(l.code);
                  return (
                    <div key={k} className="rounded-lg border p-3 space-y-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-semibold">{l.name}</div>
                          <CharacterCounter text={translations[k] || ""} />
                        </div>
                        <Button type="button" variant="outline" onClick={() => regenerateOne(l)} disabled={translationsLoading}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          {t('learningModule.learningVideo.regenerate')}
                        </Button>
                      </div>
                      <Textarea
                        value={translations[k] || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTranslations((prev) => ({ ...prev, [k]: val }));
                          markEdited(k, true);
                        }}
                        className="min-h-[160px] resize-none"
                        placeholder={t('learningModule.learningVideo.translationPlaceholder', { language: l.name })}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button type="button" variant="outline" onClick={() => goToStep(1)} className="h-12 px-10 text-base">
                  {t('learningModule.learningVideo.back')}
                </Button>
                <Button type="button" onClick={onSave} disabled={saveLoading} className="h-12 px-10 text-base">
                  {saveLoading ? t('learningModule.learningVideo.submitting') : t('learningModule.learningVideo.submit')}
                </Button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="mt-4 space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-full max-w-md">
                  <Label className="text-sm font-semibold">{t('learningModule.learningVideo.uniqueCode')}</Label>
                  <Input value={savedCode} readOnly aria-readonly className="h-11 text-center font-mono mt-2" />
                </div>
              </div>

              <div className="rounded-lg border p-3 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm font-semibold">{t('learningModule.learningVideo.exportData')}</div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => exportData('csv')} className="h-10">
                      <Download className="mr-2 h-4 w-4" />
                      CSV
                    </Button>
                    <Button type="button" variant="outline" onClick={() => exportData('xlsx')} className="h-10">
                      <Download className="mr-2 h-4 w-4" />
                      XLSX
                    </Button>
                    <Button type="button" variant="outline" onClick={() => exportData('pdf')} className="h-10">
                      <Download className="mr-2 h-4 w-4" />
                      PDF
                    </Button>
                    <Button type="button" variant="outline" onClick={() => exportData('text')} className="h-10">
                      <Download className="mr-2 h-4 w-4" />
                      Text
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-3 space-y-3">
                <div className="text-sm font-semibold">{t('learningModule.learningVideo.previewTitle')}</div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('learningModule.learningVideo.language')}</Label>
                    <Select value={previewLanguage} onValueChange={setPreviewLanguage}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder={t('learningModule.learningVideo.selectLanguage')} />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((l) => (
                          <SelectItem key={l.code} value={l.code}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('learningModule.learningVideo.action')}</Label>
                    <Button type="button" onClick={startPreview} disabled={previewLoading} className="w-full h-11">
                      {previewLoading ? t('learningModule.learningVideo.starting') : t('learningModule.learningVideo.previewGenerate')}
                    </Button>
                  </div>
                </div>

                {previewVideoId ? (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>{t('learningModule.learningVideo.videoId')}: {previewVideoId}</div>
                    <div>{t('learningModule.learningVideo.status')}: {previewStatus || "-"}</div>
                    {previewError ? <div className="text-destructive">{previewError}</div> : null}
                  </div>
                ) : null}

                {previewUrl ? (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">{t('learningModule.learningVideo.result')}</div>
                    <a href={previewUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
                      {t('learningModule.learningVideo.openVideo')}
                    </a>
                    <video src={previewUrl} controls className="w-full rounded-md border" />
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button type="button" variant="outline" onClick={() => goToStep(2)} className="h-12 px-10 text-base">
                  {t('learningModule.learningVideo.back')}
                </Button>
                <Button type="button" onClick={() => router.push('/learning-module/learning-video')} className="h-12 px-10 text-base">
                  {t('learningModule.learningVideo.submit')}
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('learningModule.learningVideo.confirmation')}</AlertDialogTitle>
            <AlertDialogDescription>{confirmText}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('learningModule.learningVideo.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const act = confirmAction;
                setConfirmOpen(false);
                setConfirmAction(null);
                if (act) act();
              }}
            >
              {t('learningModule.learningVideo.continue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
