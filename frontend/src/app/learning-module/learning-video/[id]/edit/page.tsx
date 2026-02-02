"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";

import { RefreshCw, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { showErrorToast, showSuccessToast, showInfoToast } from "@/components/ui/toast-utils";
import { learningVideoApi, type GeminiReviewResponse, type LearningVideoLanguage, type LearningVideoEditHistory } from "@/lib/learningVideoApi";
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

function parseChanges(changesJson: string) {
  try {
    const parsed = JSON.parse(changesJson);
    const languageNames: Record<string, string> = {
      id: "Bahasa Indonesia",
      en: "English",
      ja: "Japanese",
      th: "Thai",
      vi: "Vietnamese",
      km: "Khmer (Cambodia)",
      zh: "Chinese (Mandarin)",
      tl: "Filipino (Tagalog)",
      hi: "Hindi",
      ko: "Korean",
    };
    return Object.entries(parsed).map(([lang, change]: [string, any]) => ({
      language: languageNames[lang] || lang,
      before: change.before || '-',
      after: change.after || '-'
    }));
  } catch {
    return [];
  }
}

export default function LearningVideoEditPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const id = params?.id ? parseInt(params.id as string, 10) : null;

  const [loading, setLoading] = React.useState(true);

  const [inputLanguage, setInputLanguage] = React.useState<string>("id");
  const [inputText, setInputText] = React.useState<string>("");
  const [review, setReview] = React.useState<GeminiReviewResponse | null>(null);

  const [translationsLoading, setTranslationsLoading] = React.useState(false);
  const [translations, setTranslations] = React.useState<Record<string, string>>({});
  const [edited, setEdited] = React.useState<Record<string, boolean>>({});

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<null | (() => void)>(null);
  const [confirmText, setConfirmText] = React.useState<string>("");

  const [saveLoading, setSaveLoading] = React.useState(false);
  
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [historyData, setHistoryData] = React.useState<LearningVideoEditHistory[]>([]);

  // Display all languages including source language
  const allLanguages = React.useMemo(() => {
    return LANGUAGES;
  }, []);

  const inputLanguageName = React.useMemo(() => {
    const found = LANGUAGES.find((l) => normalizeLangCode(l.code) === normalizeLangCode(inputLanguage));
    return found?.name || inputLanguage;
  }, [inputLanguage]);

  React.useEffect(() => {
    const loadData = async () => {
      if (!id) {
        showErrorToast("Invalid ID");
        router.push('/learning-module/learning-video');
        return;
      }

      setLoading(true);
      try {
        const data = await learningVideoApi.getById(id);
        setInputLanguage(data.sourceLanguageCode || "id");
        setInputText(data.sourceText || "");
        
        // Include source text in translations map
        const allTranslations = { ...data.translations };
        const sourceCode = normalizeLangCode(data.sourceLanguageCode || "id");
        allTranslations[sourceCode] = data.sourceText || "";
        
        setTranslations(allTranslations);
        if (data.review) {
          setReview(data.review);
        }
      } catch (e: any) {
        showErrorToast(e);
        router.push('/learning-module/learning-video');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, router]);

  const openConfirm = (text: string, action: () => void) => {
    setConfirmText(text);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const markEdited = (code: string, value: boolean) => {
    const k = normalizeLangCode(code);
    setEdited((prev) => ({ ...prev, [k]: value }));
  };

  const translateAll = async () => {
    const sourceCode = normalizeLangCode(inputLanguage);
    const sourceText = translations[sourceCode] || "";
    
    if (!sourceText.trim()) {
      showInfoToast("Teks masih kosong.");
      return;
    }

    const hasEdits = Object.values(edited).some(Boolean);
    const run = async () => {
      setTranslationsLoading(true);
      try {
        const targetLangs = LANGUAGES.filter((l) => normalizeLangCode(l.code) !== sourceCode);
        const res = await learningVideoApi.translateAll({
          text: sourceText,
          sourceLanguageCode: sourceCode,
          targets: targetLangs,
        });
        
        // Keep source text and add all translations
        const allTranslations = { ...res.translations };
        allTranslations[sourceCode] = sourceText;
        
        setTranslations(allTranslations);
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
    const sourceCode = normalizeLangCode(inputLanguage);
    const sourceText = translations[sourceCode] || "";
    
    // Prevent regenerating the source language
    if (code === sourceCode) {
      showInfoToast("Tidak bisa regenerate bahasa sumber.");
      return;
    }
    
    const run = async () => {
      setTranslationsLoading(true);
      try {
        const res = await learningVideoApi.translateAll({
          text: sourceText,
          sourceLanguageCode: sourceCode,
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

  const onUpdate = async () => {
    if (!id) {
      showErrorToast("Invalid ID");
      return;
    }

    setSaveLoading(true);
    try {
      const sourceCode = normalizeLangCode(inputLanguage);
      const sourceText = (translations[sourceCode] || "").trim();
      
      const payloadTranslations: Record<string, string> = {};
      for (const l of LANGUAGES) {
        const k = normalizeLangCode(l.code);
        if (k !== sourceCode) {
          payloadTranslations[k] = (translations[k] || "").trim();
        }
      }

      await learningVideoApi.update(id, {
        sourceLanguageCode: sourceCode,
        sourceText: sourceText,
        translations: payloadTranslations,
        review,
      });

      showSuccessToast("Updated successfully.");
      router.push('/learning-module/learning-video');
    } catch (e: any) {
      showErrorToast(e);
    } finally {
      setSaveLoading(false);
    }
  };
  
  const loadHistory = async () => {
    if (!id) return;
    
    setHistoryLoading(true);
    setHistoryOpen(true);
    try {
      const history = await learningVideoApi.getHistory(id);
      setHistoryData(history);
    } catch (e: any) {
      showErrorToast(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-none space-y-2 p-4 md:p-6">
        <Card>
          <CardContent className="pt-6">
            <LoadingSpinner size="lg" text="Loading..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-none space-y-2 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold md:text-2xl">{t('learningModule.learningVideo.editVideo')}</h1>
        <p className="text-sm text-muted-foreground">{t('learningModule.learningVideo.pageSubtitle')}</p>
      </div>

      <Card className="gap-2 py-3">
        <CardContent className="pt-3">
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
                <Button type="button" variant="outline" onClick={loadHistory}>
                  <History className="mr-2 h-4 w-4" />
                  View Histories
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {allLanguages.map((l) => {
                const k = normalizeLangCode(l.code);
                const isSourceLang = k === normalizeLangCode(inputLanguage);
                return (
                  <div key={k} className="rounded-lg border p-3 space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-semibold">{l.name}</div>
                        {isSourceLang && <Badge variant="secondary" className="text-xs">Source</Badge>}
                        <CharacterCounter text={translations[k] || ""} />
                      </div>
                      {!isSourceLang && (
                        <Button type="button" variant="outline" onClick={() => regenerateOne(l)} disabled={translationsLoading}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          {t('learningModule.learningVideo.regenerate')}
                        </Button>
                      )}
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

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" onClick={onUpdate} disabled={saveLoading} className="h-12 px-10 text-base">
                {saveLoading ? t('learningModule.learningVideo.submitting') : t('learningModule.learningVideo.submit')}
              </Button>
            </div>
          </div>
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
      
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit History</DialogTitle>
            <DialogDescription>
              View all edits made to this learning video
            </DialogDescription>
          </DialogHeader>
          
          {historyLoading ? (
            <div className="py-8">
              <LoadingSpinner size="md" text="Loading history..." />
            </div>
          ) : historyData.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <History className="h-12 w-12 mx-auto opacity-30" />
              <p>No edit history found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyData.map((item, index) => {
                const changes = parseChanges(item.changes);
                
                return (
                  <div key={item.id} className="rounded-lg border-2 p-5 space-y-4 bg-card hover:border-primary/30 transition-colors">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge 
                            variant={item.editType === 'ADMIN_EDIT' ? 'default' : 'secondary'}
                            className="text-xs font-semibold"
                          >
                            {item.editType === 'ADMIN_EDIT' ? '👤 Admin Edit' : '✏️ Public Edit'}
                          </Badge>
                          {item.editedByPhone && (
                            <span className="text-sm text-muted-foreground font-mono">
                              📱 {item.editedByPhone}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          🕒 {new Date(item.editedAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Edit #{historyData.length - index}
                      </Badge>
                    </div>
                    
                    {/* Changes */}
                    {changes.length > 0 && (
                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-muted-foreground">Changes Made:</div>
                        {changes.map((change, idx) => (
                          <div key={idx} className="rounded-md border bg-muted/30 p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {change.language}
                              </Badge>
                            </div>
                            <div className="grid md:grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <div className="text-xs font-semibold text-red-600 dark:text-red-400">Before:</div>
                                <div className="text-sm p-3 rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-foreground/80 whitespace-pre-wrap break-words">
                                  {change.before}
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <div className="text-xs font-semibold text-green-600 dark:text-green-400">After:</div>
                                <div className="text-sm p-3 rounded bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 text-foreground/80 whitespace-pre-wrap break-words">
                                  {change.after}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
