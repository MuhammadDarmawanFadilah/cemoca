"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";

import { Check, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useOptionalAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { apiCall } from "@/lib/api";
import {
  learningModuleVideoApi,
  type LearningModuleAudience,
  type LearningModuleContentType,
  type LearningModuleVideoDuration,
  type LearningModuleVideoShareScope,
  type LearningModuleVideoCategory,
} from "@/lib/learningModuleVideoApi";
import { getCompanyNameFromLocalStorage } from "@/lib/companyProfileLocal";

const DURATION_OPTIONS: { value: LearningModuleVideoDuration; labelKey: string }[] = [
  { value: "D1", labelKey: "learningModule.video.durationD1" },
  { value: "D2", labelKey: "learningModule.video.durationD2" },
  { value: "D3", labelKey: "learningModule.video.durationD3" },
];

const AUDIENCE_OPTIONS: { value: LearningModuleAudience; labelKey: string }[] = [
  { value: "GENERAL", labelKey: "learningModule.video.audienceGeneral" },
  { value: "TOP_LEADER", labelKey: "learningModule.video.audienceTopLeader" },
  { value: "LEADER", labelKey: "learningModule.video.audienceLeader" },
  { value: "TOP_AGENT", labelKey: "learningModule.video.audienceTopAgent" },
  { value: "AGENT", labelKey: "learningModule.video.audienceAgent" },
  { value: "NEW_LEADER", labelKey: "learningModule.video.audienceNewLeader" },
  { value: "NEW_AGENT", labelKey: "learningModule.video.audienceNewAgent" },
];

const CONTENT_OPTIONS: { value: LearningModuleContentType; labelKey: string }[] = [
  { value: "GENERAL", labelKey: "learningModule.video.contentGeneral" },
  { value: "LEADERSHIP", labelKey: "learningModule.video.contentLeadership" },
  { value: "MOTIVATION_COACH", labelKey: "learningModule.video.contentMotivationCoach" },
  { value: "PERSONAL_SALES", labelKey: "learningModule.video.contentPersonalSales" },
  { value: "RECRUITMENT", labelKey: "learningModule.video.contentRecruitment" },
  { value: "PRODUCT", labelKey: "learningModule.video.contentProduct" },
  { value: "LEGAL_COMPLIANCE", labelKey: "learningModule.video.contentLegalCompliance" },
  { value: "OPERATION", labelKey: "learningModule.video.contentOperation" },
];

const SHARE_OPTIONS: { value: LearningModuleVideoShareScope; labelKey: string }[] = [
  { value: "GENERAL", labelKey: "learningModule.video.videoShareGeneral" },
  { value: "COMPANY_ONLY", labelKey: "learningModule.video.videoShareCompanyOnly" },
];

export function VideosEditPage(props: {
  basePath: string;
  category: LearningModuleVideoCategory;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user } = useOptionalAuth();

  const tt = React.useCallback(
    (key: string, fallback: string) => {
      const v = t(key);
      if (!v || v === key) return fallback;
      return v;
    },
    [t]
  );

  const parseGeneratedIdea = React.useCallback((raw: string) => {
    const cleaned = String(raw ?? "").replace(/\r\n/g, "\n").trim();
    if (!cleaned) return { title: "", text: "" };

    const lines = cleaned.split("\n");
    const firstLine = (lines[0] ?? "").trim();

    const labeled = firstLine.match(/^(?:judul|title)\s*[:：]\s*(.+)$/i);
    if (labeled && labeled[1]) {
      const extractedTitle = labeled[1].trim();
      const startIndex = lines.length > 1 && (lines[1] ?? "").trim() === "" ? 2 : 1;
      const narration = lines.slice(startIndex).join("\n").trim();
      return { title: extractedTitle, text: narration };
    }

    if (lines.length > 2 && (lines[1] ?? "").trim() === "") {
      const extractedTitle = firstLine;
      const narration = lines.slice(2).join("\n").trim();
      return { title: extractedTitle, text: narration };
    }

    return { title: "", text: cleaned };
  }, []);

  const id = Number(params.id);

  const [loading, setLoading] = React.useState(true);
  const [step, setStep] = React.useState<1 | 2>(1);

  const [duration, setDuration] = React.useState<LearningModuleVideoDuration | "">("");
  const [shareScope, setShareScope] = React.useState<LearningModuleVideoShareScope>("GENERAL");
  const [audience, setAudience] = React.useState<LearningModuleAudience[]>([]);
  const [contentTypes, setContentTypes] = React.useState<LearningModuleContentType[]>([]);
  const [title, setTitle] = React.useState("");
  const [text, setText] = React.useState("");
  const [ideaPrompt, setIdeaPrompt] = React.useState("");
  const [ideaLanguage, setIdeaLanguage] = React.useState<"id" | "en" | "ja" | "ko" | "zh">("id");
  const [generatingIdea, setGeneratingIdea] = React.useState(false);

  const [companyName, setCompanyName] = React.useState<string>("");
  const [canEdit, setCanEdit] = React.useState<boolean>(true);

  const textRef = React.useRef<HTMLTextAreaElement | null>(null);

  const insertVariable = (key: "name" | "agentCode" | "companyName") => {
    const token = `:${key}`;
    const el = textRef.current;
    if (!el) {
      setText((prev) => (prev ? `${prev} ${token}` : token));
      return;
    }

    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const before = text.slice(0, start);
    const after = text.slice(end);
    const next = `${before}${token}${after}`;
    setText(next);

    requestAnimationFrame(() => {
      try {
        el.focus();
        const cursor = start + token.length;
        el.setSelectionRange(cursor, cursor);
      } catch {
        // ignore
      }
    });
  };

  const [codePreview, setCodePreview] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isStep1Valid = !!duration && audience.length > 0 && contentTypes.length > 0;

  const wordCount = React.useMemo(() => {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  }, [text]);

  const estimatedMinutes = wordCount / 130;

  const formatDuration = (mins: number) => {
    if (mins === 0) return "0 detik";
    const m = Math.floor(mins);
    const s = Math.round((mins - m) * 60);
    if (m > 0 && s > 0) return `${m} menit ${s} detik`;
    if (m > 0) return `${m} menit`;
    return `${s} detik`;
  };

  React.useEffect(() => {
    setCompanyName(getCompanyNameFromLocalStorage(user?.id ?? null));
  }, [user?.id]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await learningModuleVideoApi.getById(id, { companyName: companyName || undefined });
      setCodePreview(res.code);

      setDuration(res.duration);
      setShareScope((res.shareScope as LearningModuleVideoShareScope) || "GENERAL");
      setCanEdit(Boolean(res.canEdit ?? true));
      setAudience(res.intendedAudience ?? []);
      setContentTypes(res.contentTypes ?? []);
      setTitle(res.title ?? "");
      setText(res.text ?? "");
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id, companyName]);

  React.useEffect(() => {
    if (Number.isFinite(id)) {
      load();
    } else {
      setLoading(false);
      setError("Invalid ID");
    }
  }, [id, load]);

  const toggleDuration = (v: LearningModuleVideoDuration) => {
    setDuration((prev) => (prev === v ? "" : v));
  };

  const goToStep1 = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setError(null);
    setStep(1);
  };

  const goToStep2 = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setError(null);
    if (!isStep1Valid) {
      setError(t("learningModule.video.validation.step1"));
      return;
    }
    setStep(2);
  };

  const toggleAudience = (v: LearningModuleAudience) => {
    setAudience((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  };

  const toggleContentType = (v: LearningModuleContentType) => {
    setContentTypes((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!canEdit) {
      setError("Forbidden");
      return;
    }

    if (!isStep1Valid) {
      setError(t("learningModule.video.validation.step1"));
      setStep(1);
      return;
    }
    if (!title.trim()) {
      setError(tt("learningModule.video.validation.title", "Judul wajib diisi"));
      setStep(2);
      return;
    }
    if (!text.trim()) {
      setError(t("learningModule.video.validation.text"));
      setStep(2);
      return;
    }

    setSubmitting(true);
    try {
      await learningModuleVideoApi.update(
        id,
        {
          title,
          duration: duration as LearningModuleVideoDuration,
          shareScope,
          intendedAudience: audience,
          contentTypes,
          text,
          createdByCompanyName: companyName || null,
          videoCategory: props.category,
        },
        { companyName: companyName || undefined }
      );
      router.push(props.basePath);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!confirm(t("learningModule.video.deleteConfirm") || "Are you sure?")) {
      return;
    }

    if (!canEdit) {
      setError("Forbidden");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await learningModuleVideoApi.remove(id, { companyName: companyName || undefined });
      router.push(props.basePath);
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete");
    } finally {
      setSubmitting(false);
    }
  };

  const onGenerateIdea = async () => {
    setError(null);
    if (!ideaPrompt.trim()) {
      setError(t("learningModule.video.validation.ideaPrompt"));
      return;
    }

    if (!title.trim()) {
      setTitle(ideaPrompt.trim().slice(0, 120));
    }

    setGeneratingIdea(true);
    try {
      const langInstruction: Record<typeof ideaLanguage, string> = {
        id: "Gunakan bahasa Indonesia.",
        en: "Use English.",
        ja: "日本語で書いてください。",
        ko: "한국어로 작성해 주세요.",
        zh: "请使用中文。",
      };

      const prompt = [
        langInstruction[ideaLanguage],
        `Buat Judul/Topik dan naskah narasi video yang siap diucapkan (spoken narration).`,
        `Durasi target: ${duration || ""}.`,
        `Video Share: ${shareScope}.`,
        `Target Audiens: ${(audience || []).join(", ")}.`,
        `Tipe Konten: ${(contentTypes || []).join(", ")}.`,
        `Permintaan ide: ${ideaPrompt.trim()}`,
        `Output WAJIB format berikut:`,
        `Baris 1: JUDUL: <judul/topik singkat>`,
        `Baris 2: (kosong)`,
        `Baris 3 dst: hanya teks narasi yang akan diucapkan.`,
        `Tanpa markdown (tanpa **bold**, tanpa bullet/numbering).`,
        `Jangan tulis arahan panggung/aksi/suara/musik seperti (musik intro), [SFX], atau deskripsi visual.`,
        `Jangan tulis label pembicara seperti PEMBICARA:, HOST:, NARATOR:.`,
        `Jangan tulis penjelasan tambahan.`,
      ].join("\n");

      const data = await apiCall<{
        text: string;
      }>("/ai/gemini/generate", {
        method: "POST",
        body: JSON.stringify({ prompt, language: ideaLanguage }),
      });

      const generated = String(data?.text || "");
      const parsed = parseGeneratedIdea(generated);
      const nextText = (parsed.text || generated).trim();
      setText(nextText);
      if (parsed.title) {
        setTitle(parsed.title);
      }
      setStep(2);
    } catch (e: any) {
      setError(e?.message ?? "Failed to generate");
    } finally {
      setGeneratingIdea(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">{t("common.loading")}</div>;
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-2 p-4 md:p-6">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-lg font-semibold">{t("learningModule.video.edit")}</h1>
        <Button variant="destructive" size="sm" onClick={onDelete} disabled={submitting || !canEdit}>
          <Trash2 className="mr-2 h-4 w-4" />
          {t("common.delete")}
        </Button>
      </div>

      <Card className="gap-2 py-3">
        <CardHeader className="pb-0">
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <div className="relative">
                <Input
                  value={codePreview}
                  placeholder={t("learningModule.video.code")}
                  readOnly
                  aria-readonly
                  aria-label={t("learningModule.video.code")}
                  className="h-11 pr-11 text-center font-mono"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <form className="space-y-2" onSubmit={onSubmit}>
            {error ? <div className="text-sm text-destructive">{error}</div> : null}

            <div className="rounded-lg border bg-muted/10 p-1.5">
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={goToStep1}
                  className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors ${
                    step === 1 ? "border-primary bg-primary/5" : "border-muted bg-background hover:bg-muted/20"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${
                      step === 1 || step === 2
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted bg-background text-muted-foreground"
                    }`}
                    aria-hidden
                  >
                    {step === 2 ? <Check className="h-4 w-4" /> : 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold leading-tight">{t("learningModule.video.step1Title")}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("learningModule.video.duration")}, {t("learningModule.video.videoShare")}, {t("learningModule.video.contentTypes")}, {t("learningModule.video.audience")}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={goToStep2}
                  disabled={!isStep1Valid}
                  className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    step === 2 ? "border-primary bg-primary/5" : "border-muted bg-background hover:bg-muted/20"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${
                      step === 2
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted bg-background text-muted-foreground"
                    }`}
                    aria-hidden
                  >
                    2
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold leading-tight">{t("learningModule.video.step2Title")}</div>
                    <div className="text-xs text-muted-foreground">{t("learningModule.video.text")}</div>
                  </div>
                </button>
              </div>
            </div>

            {step === 1 ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                  <div className="space-y-2">
                    <Label>{t("learningModule.video.duration")}</Label>
                    <div className="rounded-md border p-3">
                      <div className="grid gap-2">
                        {DURATION_OPTIONS.map((opt) => {
                          const checked = duration === opt.value;
                          return (
                            <label key={opt.value} className="flex items-start gap-3 rounded-md px-2 py-1.5 hover:bg-muted/40">
                              <Checkbox checked={checked} onCheckedChange={() => toggleDuration(opt.value)} disabled={!canEdit} />
                              <div className="leading-tight">
                                <div className="text-sm font-medium">{t(opt.labelKey)}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{t("learningModule.video.durationHelp")}</div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("learningModule.video.videoShare")}</Label>
                    <RadioGroup
                      value={shareScope}
                      onValueChange={(v) => setShareScope((v as LearningModuleVideoShareScope) || "GENERAL")}
                      className="grid gap-2"
                      disabled={!canEdit}
                    >
                      {SHARE_OPTIONS.map((opt) => {
                        const active = shareScope === opt.value;
                        return (
                          <label
                            key={opt.value}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-md border p-2.5 transition-colors",
                              active
                                ? "border-primary bg-primary/5"
                                : "border-muted bg-background hover:bg-muted/20"
                            )}
                          >
                            <RadioGroupItem value={opt.value} className="mt-0.5" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium leading-tight">{t(opt.labelKey)}</div>
                            </div>
                          </label>
                        );
                      })}
                    </RadioGroup>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("learningModule.video.contentTypes")}</Label>
                    <div className="rounded-md border p-3">
                      <ScrollArea className="h-[220px] pr-3">
                        <div className="grid gap-2">
                          {CONTENT_OPTIONS.map((opt) => {
                            const checked = contentTypes.includes(opt.value);
                            return (
                              <label key={opt.value} className="flex items-start gap-3 rounded-md px-2 py-1.5 hover:bg-muted/40">
                                <Checkbox checked={checked} onCheckedChange={() => toggleContentType(opt.value)} disabled={!canEdit} />
                                <div className="leading-tight">
                                  <div className="text-sm font-medium">{t(opt.labelKey)}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                    <div className="text-xs text-muted-foreground">{t("learningModule.video.contentTypesPlaceholder")}</div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("learningModule.video.audience")}</Label>
                    <div className="rounded-md border p-3">
                      <ScrollArea className="h-[220px] pr-3">
                        <div className="grid gap-2">
                          {AUDIENCE_OPTIONS.map((opt) => {
                            const checked = audience.includes(opt.value);
                            return (
                              <label key={opt.value} className="flex items-start gap-3 rounded-md px-2 py-1.5 hover:bg-muted/40">
                                <Checkbox checked={checked} onCheckedChange={() => toggleAudience(opt.value)} disabled={!canEdit} />
                                <div className="leading-tight">
                                  <div className="text-sm font-medium">{t(opt.labelKey)}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                    <div className="text-xs text-muted-foreground">{t("learningModule.video.audiencePlaceholder")}</div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(props.basePath);
                    }}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button type="button" onClick={goToStep2}>
                    {t("common.next")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/10 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm font-semibold">{t("learningModule.video.ideaPrompt")}</div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{t("learningModule.video.ideaLanguage")}</span>
                        <Select value={ideaLanguage} onValueChange={(v) => setIdeaLanguage(v as any)} disabled={!canEdit}>
                          <SelectTrigger size="sm" className="w-[150px]">
                            <SelectValue placeholder={t("learningModule.video.ideaLanguagePlaceholder")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="id">{t("learningModule.video.langId")}</SelectItem>
                            <SelectItem value="en">{t("learningModule.video.langEn")}</SelectItem>
                            <SelectItem value="ja">{t("learningModule.video.langJa")}</SelectItem>
                            <SelectItem value="ko">{t("learningModule.video.langKo")}</SelectItem>
                            <SelectItem value="zh">{t("learningModule.video.langZh")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="button" onClick={onGenerateIdea} disabled={generatingIdea || !canEdit}>
                        {generatingIdea ? t("learningModule.video.generating") : t("learningModule.video.generate")}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <Label className="text-xs text-muted-foreground">{t("learningModule.video.ideaPromptHint")}</Label>
                    <Textarea
                      value={ideaPrompt}
                      onChange={(e) => setIdeaPrompt(e.target.value)}
                      placeholder={t("learningModule.video.ideaPromptPlaceholder")}
                      className="min-h-[92px]"
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{tt("learningModule.video.videoTitle", "Judul")}</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={tt("learningModule.video.videoTitlePlaceholder", "Masukkan judul/topik...")}
                    disabled={!canEdit}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("learningModule.video.text")}</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">Variabel:</span>
                    <Button type="button" variant="outline" size="sm" onClick={() => insertVariable("name")} disabled={!canEdit}>
                      :name
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => insertVariable("agentCode")} disabled={!canEdit}>
                      :agentCode
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => insertVariable("companyName")} disabled={!canEdit}>
                      :companyName
                    </Button>
                  </div>
                  <Textarea
                    ref={textRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t("learningModule.video.textPlaceholder")}
                    className="min-h-[240px] md:min-h-[320px]"
                    disabled={!canEdit}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{wordCount} kata</span>
                    <span>Estimasi durasi: ~{formatDuration(estimatedMinutes)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={goToStep1}>
                    {t("common.back")}
                  </Button>
                  <Button type="submit" disabled={submitting || !canEdit}>
                    {submitting ? t("common.loading") : t("common.save")}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
