"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Check, RefreshCw, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useOptionalAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCompanyNameFromLocalStorage } from "@/lib/companyProfileLocal";
import {
  learningModulePowerPointApi,
  type LearningModulePowerPointDuration,
  type LearningModulePowerPointShareScope,
  type LearningModuleAudience,
  type LearningModuleContentType,
} from "@/lib/learningModulePowerPointApi";
import {
  generateLearningModulePowerPointBaseCode,
  generateLearningModulePowerPointSuffix,
} from "@/lib/learningModulePowerPointCode";
import { cn } from "@/lib/utils";
import { FileUploadService } from "@/services/fileUploadService";
import { config } from "@/lib/config";

const DURATION_OPTIONS = [
  { value: "D1", labelKey: "learningModule.powerPoint.durationD1" },
  { value: "D2", labelKey: "learningModule.powerPoint.durationD2" },
  { value: "D3", labelKey: "learningModule.powerPoint.durationD3" },
];

const AUDIENCE_OPTIONS: { value: LearningModuleAudience; labelKey: string }[] = [
  { value: "GENERAL", labelKey: "learningModule.powerPoint.audienceGeneral" },
  { value: "TOP_LEADER", labelKey: "learningModule.powerPoint.audienceTopLeader" },
  { value: "LEADER", labelKey: "learningModule.powerPoint.audienceLeader" },
  { value: "TOP_AGENT", labelKey: "learningModule.powerPoint.audienceTopAgent" },
  { value: "AGENT", labelKey: "learningModule.powerPoint.audienceAgent" },
  { value: "NEW_LEADER", labelKey: "learningModule.powerPoint.audienceNewLeader" },
  { value: "NEW_AGENT", labelKey: "learningModule.powerPoint.audienceNewAgent" },
];

const CONTENT_OPTIONS: { value: LearningModuleContentType; labelKey: string }[] = [
  { value: "GENERAL", labelKey: "learningModule.powerPoint.contentGeneral" },
  { value: "LEADERSHIP", labelKey: "learningModule.powerPoint.contentLeadership" },
  { value: "MOTIVATION_COACH", labelKey: "learningModule.powerPoint.contentMotivationCoach" },
  { value: "PERSONAL_SALES", labelKey: "learningModule.powerPoint.contentPersonalSales" },
  { value: "RECRUITMENT", labelKey: "learningModule.powerPoint.contentRecruitment" },
  { value: "PRODUCT", labelKey: "learningModule.powerPoint.contentProduct" },
  { value: "LEGAL_COMPLIANCE", labelKey: "learningModule.powerPoint.contentLegalCompliance" },
  { value: "OPERATION", labelKey: "learningModule.powerPoint.contentOperation" },
];

const SHARE_OPTIONS: { value: LearningModulePowerPointShareScope; labelKey: string }[] = [
  { value: "GENERAL", labelKey: "learningModule.powerPoint.powerPointShareGeneral" },
  { value: "COMPANY_ONLY", labelKey: "learningModule.powerPoint.powerPointShareCompanyOnly" },
];

export default function NewLearningModulePowerPointPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useOptionalAuth();

  const tt = React.useCallback(
    (key: string, fallback: string) => {
      const v = t(key);
      if (!v || v === key) return fallback;
      return v;
    },
    [t]
  );

  const [companyName, setCompanyName] = React.useState<string>("");
  React.useEffect(() => {
    setCompanyName(getCompanyNameFromLocalStorage(user?.id ?? null));
  }, [user?.id]);

  const [step, setStep] = React.useState<1 | 2>(1);

  const [duration, setDuration] = React.useState<LearningModulePowerPointDuration>("D1");
  const [shareScope, setShareScope] = React.useState<LearningModulePowerPointShareScope>("GENERAL");
  const [audience, setAudience] = React.useState<LearningModuleAudience[]>(["GENERAL"]);
  const [contentTypes, setContentTypes] = React.useState<LearningModuleContentType[]>(["GENERAL"]);

  const [suffix, setSuffix] = React.useState(() => generateLearningModulePowerPointSuffix(6));
  const [codePreview, setCodePreview] = React.useState<string>("");

  const [title, setTitle] = React.useState("");

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string>("");
  const [uploadedFilename, setUploadedFilename] = React.useState<string>("");
  const [uploadedUrl, setUploadedUrl] = React.useState<string>("");

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isStep1Valid = React.useMemo(() => {
    return Boolean(duration && audience.length > 0 && contentTypes.length > 0);
  }, [duration, audience.length, contentTypes.length]);

  const canRegenerate = React.useMemo(() => {
    return Boolean(duration && audience.length > 0 && contentTypes.length > 0);
  }, [duration, audience.length, contentTypes.length]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const base = await generateLearningModulePowerPointBaseCode({
          duration,
          audience,
          contentTypes,
        });
        if (!cancelled) {
          setCodePreview(`${base}-${suffix}`);
        }
      } catch {
        if (!cancelled) {
          setCodePreview("");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [duration, audience, contentTypes, suffix]);

  const toggleDuration = (v: LearningModulePowerPointDuration) => {
    setDuration(v);
  };

  const toggleContentType = (v: LearningModuleContentType) => {
    setContentTypes((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  };

  const toggleAudience = (v: LearningModuleAudience) => {
    setAudience((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  };

  const goToStep1 = (e?: React.SyntheticEvent) => {
    e?.preventDefault?.();
    setStep(1);
  };

  const goToStep2 = (e?: React.SyntheticEvent) => {
    e?.preventDefault?.();
    if (!isStep1Valid) return;
    setStep(2);
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const name = (file.name || "").toLowerCase();
    const isAllowed = name.endsWith(".ppt") || name.endsWith(".pptx");
    if (!isAllowed) {
      setError(tt("learningModule.powerPoint.validation.fileType", "File harus berformat PPT atau PPTX"));
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError(tt("learningModule.powerPoint.validation.fileSize", "Ukuran file maksimal 100MB"));
      return;
    }

    setError(null);
    setSelectedFile(file);
    setUploadedFilename("");
    setUploadedUrl("");

    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearFile = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl("");
    setSelectedFile(null);
    setUploadedFilename("");
    setUploadedUrl("");
  };

  const ensureUploaded = async () => {
    if (uploadedFilename && uploadedUrl) {
      return { filename: uploadedFilename, url: uploadedUrl };
    }
    if (!selectedFile) {
      throw new Error(tt("learningModule.powerPoint.validation.file", "File Power Point wajib diupload"));
    }
    const uploadResult: any = await FileUploadService.uploadDocument(selectedFile);
    const filename = String(uploadResult?.filename || "").trim();
    const url = String(uploadResult?.url || "").trim();
    if (!filename || !url) {
      throw new Error(String(uploadResult?.error || uploadResult?.message || "Upload gagal"));
    }
    setUploadedFilename(filename);
    setUploadedUrl(url);
    return { filename, url };
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isStep1Valid) {
      setError(t("learningModule.powerPoint.validation.step1"));
      setStep(1);
      return;
    }
    if (!title.trim()) {
      setError(tt("learningModule.powerPoint.validation.title", "Judul wajib diisi"));
      setStep(2);
      return;
    }

    setSubmitting(true);
    try {
      const uploaded = await ensureUploaded();

      await learningModulePowerPointApi.create({
        title,
        duration: duration as LearningModulePowerPointDuration,
        shareScope,
        intendedAudience: audience,
        contentTypes,
        powerPointFilename: uploaded.filename,
        powerPointUrl: uploaded.url,
        createdByCompanyName: companyName || null,
      });
      router.push("/learning-module/power-points");
    } catch (e: any) {
      setError(e?.message ?? "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-2 p-4 md:p-6">
      <Card className="gap-2 py-3">
        <CardHeader className="pb-0">
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <div className="relative">
                <Input
                  value={codePreview}
                  placeholder={t("learningModule.powerPoint.code")}
                  readOnly
                  aria-readonly
                  aria-label={t("learningModule.powerPoint.code")}
                  className="h-11 pr-11 text-center font-mono"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setSuffix(generateLearningModulePowerPointSuffix(6))}
                  disabled={!canRegenerate}
                  aria-label={t("learningModule.powerPoint.regenerate")}
                  title={t("learningModule.powerPoint.regenerate")}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
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
                    <div className="text-sm font-semibold leading-tight">{t("learningModule.powerPoint.step1Title")}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("learningModule.powerPoint.duration")}, {t("learningModule.powerPoint.powerPointShare")}, {t("learningModule.powerPoint.contentTypes")}, {t("learningModule.powerPoint.audience")}
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
                      step === 2 ? "border-primary bg-primary text-primary-foreground" : "border-muted bg-background text-muted-foreground"
                    }`}
                    aria-hidden
                  >
                    2
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold leading-tight">{t("learningModule.powerPoint.step2Title")}</div>
                    <div className="text-xs text-muted-foreground">{t("learningModule.powerPoint.file")}</div>
                  </div>
                </button>
              </div>
            </div>

            {step === 1 ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                  <div className="space-y-2">
                    <Label>{t("learningModule.powerPoint.duration")}</Label>
                    <div className="rounded-md border p-3">
                      <div className="grid gap-2">
                        {DURATION_OPTIONS.map((opt) => {
                          const checked = duration === opt.value;
                          return (
                            <label key={opt.value} className="flex items-start gap-3 rounded-md px-2 py-1.5 hover:bg-muted/40">
                              <Checkbox checked={checked} onCheckedChange={() => toggleDuration(opt.value as any)} />
                              <div className="leading-tight">
                                <div className="text-sm font-medium">{t(opt.labelKey)}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{t("learningModule.powerPoint.durationHelp")}</div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("learningModule.powerPoint.powerPointShare")}</Label>
                    <RadioGroup
                      value={shareScope}
                      onValueChange={(v) => setShareScope((v as LearningModulePowerPointShareScope) || "GENERAL")}
                      className="grid gap-2"
                    >
                      {SHARE_OPTIONS.map((opt) => {
                        const active = shareScope === opt.value;
                        return (
                          <label
                            key={opt.value}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-md border p-2.5 transition-colors",
                              active ? "border-primary bg-primary/5" : "border-muted bg-background hover:bg-muted/20"
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
                    <Label>{t("learningModule.powerPoint.contentTypes")}</Label>
                    <div className="rounded-md border p-3">
                      <ScrollArea className="h-[220px] pr-3">
                        <div className="grid gap-2">
                          {CONTENT_OPTIONS.map((opt) => {
                            const checked = contentTypes.includes(opt.value);
                            return (
                              <label key={opt.value} className="flex items-start gap-3 rounded-md px-2 py-1.5 hover:bg-muted/40">
                                <Checkbox checked={checked} onCheckedChange={() => toggleContentType(opt.value)} />
                                <div className="leading-tight">
                                  <div className="text-sm font-medium">{t(opt.labelKey)}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                    <div className="text-xs text-muted-foreground">{t("learningModule.powerPoint.contentTypesPlaceholder")}</div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("learningModule.powerPoint.audience")}</Label>
                    <div className="rounded-md border p-3">
                      <ScrollArea className="h-[220px] pr-3">
                        <div className="grid gap-2">
                          {AUDIENCE_OPTIONS.map((opt) => {
                            const checked = audience.includes(opt.value);
                            return (
                              <label key={opt.value} className="flex items-start gap-3 rounded-md px-2 py-1.5 hover:bg-muted/40">
                                <Checkbox checked={checked} onCheckedChange={() => toggleAudience(opt.value)} />
                                <div className="leading-tight">
                                  <div className="text-sm font-medium">{t(opt.labelKey)}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                    <div className="text-xs text-muted-foreground">{t("learningModule.powerPoint.audiencePlaceholder")}</div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" asChild>
                    <Link href="/learning-module/power-points">{t("common.cancel")}</Link>
                  </Button>
                  <Button type="button" onClick={goToStep2}>
                    {t("common.next")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{tt("learningModule.powerPoint.powerPointTitle", "Judul")}</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={tt("learningModule.powerPoint.powerPointTitlePlaceholder", "Masukkan judul/topik...")}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("learningModule.powerPoint.file")}</Label>
                  <div className="rounded-lg border p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        type="file"
                        accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                        onChange={onPickFile}
                        className="sm:flex-1"
                      />
                      <Button type="button" variant="outline" onClick={clearFile} disabled={!selectedFile && !uploadedUrl}>
                        <X className="h-4 w-4" />
                        {tt("common.clear", "Clear")}
                      </Button>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">{t("learningModule.powerPoint.fileHint")}</div>

                    {selectedFile || uploadedUrl ? (
                      <div className="mt-3 rounded-md border bg-muted/10 p-2">
                        {selectedFile ? <div className="text-xs text-muted-foreground">{selectedFile.name}</div> : null}
                        {(previewUrl || uploadedUrl) ? (
                          <a
                            className="mt-2 inline-flex text-sm font-medium text-primary underline"
                            href={previewUrl || `${config.baseUrl}${uploadedUrl}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {tt("common.view", "View")}
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={goToStep1}>
                    {t("common.back")}
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      t("common.loading")
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        {t("common.save")}
                      </>
                    )}
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
