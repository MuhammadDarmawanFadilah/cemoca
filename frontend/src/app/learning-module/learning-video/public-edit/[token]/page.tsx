"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { RefreshCw, History, FileText, Edit3, Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils";
import { learningVideoApi, type LearningVideoBundle, type LearningVideoEditHistory } from "@/lib/learningVideoApi";

const LANGUAGES: Record<string, string> = {
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

export default function PublicEditPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = React.useState(true);
  const [video, setVideo] = React.useState<LearningVideoBundle | null>(null);
  const [allowedLanguages, setAllowedLanguages] = React.useState<string[]>([]);
  const [translations, setTranslations] = React.useState<Record<string, string>>({});
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [expired, setExpired] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [historyData, setHistoryData] = React.useState<LearningVideoEditHistory[]>([]);
  
  const [activeTab, setActiveTab] = React.useState("edit");

  React.useEffect(() => {
    const loadData = async () => {
      if (!token) {
        setExpired(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await learningVideoApi.getByToken(token);
        setVideo(data.video);
        setAllowedLanguages(data.allowedLanguages || []);
        setTranslations(data.video.translations || {});
      } catch (e: any) {
        setExpired(true);
        showErrorToast("Token not found or expired");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);
  
  // Load history when switching to history tab
  React.useEffect(() => {
    if (activeTab === "history" && video && historyData.length === 0 && !historyLoading) {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, video]);
  
  // Smart source language determination
  const getSourceLanguage = React.useMemo(() => {
    if (!video) return { code: 'en', text: '' };
    
    // If English is being edited, use another language as source
    const normalizedAllowed = allowedLanguages.map(l => l.trim().toLowerCase());
    if (normalizedAllowed.includes('en')) {
      // Find first available language that is not English
      const availableLangs = Object.keys(video.translations || {}).filter(l => l !== 'en');
      if (availableLangs.length > 0) {
        return { 
          code: availableLangs[0], 
          text: video.translations[availableLangs[0]] || '' 
        };
      }
      
      // Fallback to source if sourceLanguageCode is not English
      if (video.sourceLanguageCode !== 'en') {
        return { code: video.sourceLanguageCode, text: video.sourceText };
      }
    }
    
    // Default: use English if available and not being edited
    if (video.translations['en']) {
      return { code: 'en', text: video.translations['en'] };
    }
    
    // Final fallback to source
    return { code: video.sourceLanguageCode, text: video.sourceText };
  }, [video, allowedLanguages]);
  
  // Get reference translations (not being edited)
  const getReferenceTranslations = React.useMemo(() => {
    if (!video) return [];
    
    const normalizedAllowed = allowedLanguages.map(l => l.trim().toLowerCase());
    const allTranslations = video.translations || {};
    const references: Array<{ code: string; text: string }> = [];
    
    // Add source text if not being edited
    if (!normalizedAllowed.includes(video.sourceLanguageCode.toLowerCase())) {
      references.push({
        code: video.sourceLanguageCode,
        text: video.sourceText
      });
    }
    
    // Add all other translations that are not being edited
    Object.entries(allTranslations).forEach(([code, text]) => {
      if (!normalizedAllowed.includes(code)) {
        references.push({ code, text });
      }
    });
    
    return references;
  }, [video, allowedLanguages]);

  const getThankYouMessage = () => {
    if (!allowedLanguages.length) return "Thank you for your contribution!";
    
    const firstLang = allowedLanguages[0].trim().toLowerCase();
    
    const messages: Record<string, string> = {
      id: "Terima kasih atas kontribusi Anda! Terjemahan Anda sangat membantu dalam meningkatkan kualitas konten pembelajaran kami.",
      en: "Thank you for your contribution! Your translations help us improve the quality of our learning content.",
      vi: "Cảm ơn bạn đã đóng góp! Bản dịch của bạn giúp chúng tôi cải thiện chất lượng nội dung học tập.",
      th: "ขอบคุณสำหรับการสนับสนุนของคุณ! การแปลของคุณช่วยให้เราปรับปรุงคุณภาพของเนื้อหาการเรียนรู้",
      km: "សូមអរគុណចំពោះការរួមចំណែករបស់អ្នក! ការបកប្រែរបស់អ្នកជួយយើងកែលម្អគុណភាពនៃខ្លឹមសារសិក្សា",
      ja: "ご協力ありがとうございます！あなたの翻訳は、学習コンテンツの質の向上に役立ちます。",
      zh: "感謝您的貢獻！您的翻譯幫助我們提高學習內容的質量。",
      tl: "Salamat sa iyong kontribusyon! Ang iyong mga pagsasalin ay tumutulong sa amin na mapabuti ang kalidad ng aming learning content.",
      hi: "आपके योगदान के लिए धन्यवाद! आपके अनुवाद हमें हमारी शिक्षण सामग्री की गुणवत्ता में सुधार करने में मदद करते हैं।",
      ko: "기여해 주셔서 감사합니다! 귀하의 번역은 우리의 학습 콘텐츠 품질을 향상시키는 데 도움이 됩니다."
    };
    
    return messages[firstLang] || messages.en;
  };

  const onSave = async () => {
    if (!token) return;

    setSaveLoading(true);
    try {
      // Filter translations to only include allowed languages
      const filteredTranslations: Record<string, string> = {};
      for (const lang of allowedLanguages) {
        const normalizedLang = lang.trim().toLowerCase();
        if (translations[normalizedLang]) {
          filteredTranslations[normalizedLang] = translations[normalizedLang];
        }
      }

      await learningVideoApi.updateByToken(token, { translations: filteredTranslations });
      
      // Set submitted state to show thank you message
      setSubmitted(true);
      
      // Reload history after save
      if (video) {
        await loadHistory();
      }
    } catch (e: any) {
      showErrorToast(e);
    } finally {
      setSaveLoading(false);
    }
  };
  
  const loadHistory = async () => {
    if (!video) return;
    
    setHistoryLoading(true);
    try {
      const history = await learningVideoApi.getHistory(video.id);
      setHistoryData(history);
    } catch (e: any) {
      showErrorToast(e);
    } finally {
      setHistoryLoading(false);
    }
  };
  
  const parseChanges = (changesJson: string) => {
    try {
      const parsed = JSON.parse(changesJson);
      return Object.entries(parsed).map(([lang, change]: [string, any]) => ({
        language: LANGUAGES[lang] || lang,
        before: change.before || '-',
        after: change.after || '-'
      }));
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-2 p-4 md:p-6">
        <Card>
          <CardContent className="pt-6">
            <LoadingSpinner size="lg" text="Loading..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (expired || !video) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-2 p-4 md:p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 space-y-4">
              <div className="text-xl font-semibold">Token Expired or Invalid</div>
              <div className="text-muted-foreground">
                This edit link is no longer valid. Please contact the administrator for a new link.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (submitted) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-6">
        <Card className="border-2 border-green-500/20">
          <CardContent className="pt-6">
            <div className="text-center py-16 space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-6">
                  <svg className="h-16 w-16 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-green-600 dark:text-green-400">Submission Successful!</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  {getThankYouMessage()}
                </p>
              </div>
              <div className="pt-4">
                <Badge variant="outline" className="text-sm px-4 py-2">
                  Your edits have been saved successfully
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 p-4 md:p-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold md:text-3xl flex items-center gap-2">
              <Edit3 className="h-7 w-7 text-primary" />
              Edit Learning Video
            </h1>
            <p className="text-sm text-muted-foreground">
              You have been requested to edit the translations for this learning video
            </p>
          </div>
          {video && (
            <Badge variant="outline" className="text-sm px-3 py-1.5 font-mono">
              {video.code}
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-2xl grid-cols-3 h-12">
          <TabsTrigger value="edit" className="text-base gap-2">
            <Edit3 className="h-4 w-4" />
            Edit Translations
          </TabsTrigger>
          <TabsTrigger value="reference" className="text-base gap-2">
            <Languages className="h-4 w-4" />
            Reference
          </TabsTrigger>
          <TabsTrigger value="history" className="text-base gap-2">
            <History className="h-4 w-4" />
            Edit History
          </TabsTrigger>
        </TabsList>

        {/* Edit Tab */}
        <TabsContent value="edit" className="space-y-4 mt-0">
          <Card>
            <CardContent className="pt-6 space-y-6">
              {/* Source Reference */}
              <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-base font-semibold text-primary">Source Reference</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {LANGUAGES[getSourceLanguage.code] || getSourceLanguage.code}
                  </Badge>
                </div>
                <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap bg-background/50 rounded-md p-4 border">
                  {getSourceLanguage.text}
                </div>
              </div>

              {/* Editable Translations */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Your Translations</h3>
                  <Badge variant="outline" className="text-xs">
                    {allowedLanguages.length} {allowedLanguages.length === 1 ? 'language' : 'languages'}
                  </Badge>
                </div>
                
                <div className="grid gap-4">
                  {allowedLanguages.map((langCode) => {
                    const normalizedLang = langCode.trim().toLowerCase();
                    const languageName = LANGUAGES[normalizedLang] || langCode;
                    
                    return (
                      <div key={normalizedLang} className="rounded-lg border-2 p-5 space-y-3 bg-card hover:border-primary/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-base font-semibold">{languageName}</span>
                          </div>
                          <CharacterCounter text={translations[normalizedLang] || ""} />
                        </div>
                        <Textarea
                          value={translations[normalizedLang] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTranslations((prev) => ({ ...prev, [normalizedLang]: val }));
                          }}
                          className="min-h-[200px] resize-none text-base leading-relaxed"
                          placeholder={`Enter translation in ${languageName}...`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={onSave} 
                  disabled={saveLoading} 
                  className="h-12 px-12 text-base font-semibold"
                  size="lg"
                >
                  {saveLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reference Tab */}
        <TabsContent value="reference" className="space-y-4 mt-0">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Reference Translations
                </h3>
                <p className="text-sm text-muted-foreground">
                  View other language translations for reference (read-only)
                </p>
              </div>

              {getReferenceTranslations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Languages className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No reference translations available</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {getReferenceTranslations.map(({ code, text }) => (
                    <div key={code} className="rounded-lg border bg-muted/30 p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {LANGUAGES[code] || code}
                        </Badge>
                        <CharacterCounter text={text} />
                      </div>
                      <div className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap bg-background/50 rounded-md p-4 border">
                        {text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4 mt-0">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Edit History
                </h3>
                <p className="text-sm text-muted-foreground">
                  View all previous edits made to this learning video
                </p>
              </div>

              {historyLoading ? (
                <div className="py-12">
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
