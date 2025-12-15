"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";

import { Check, RefreshCw, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useOptionalAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import {
  learningModuleImageApi,
  type LearningModuleAudience,
  type LearningModuleContentType,
  type LearningModuleImageDuration,
  type LearningModuleImageShareScope,
} from "@/lib/learningModuleImageApi";
import { getCompanyNameFromLocalStorage } from "@/lib/companyProfileLocal";
import {
  buildLearningModuleImageCodePreview,
  generateLearningModuleImageSuffix,
} from "@/lib/learningModuleImageCode";
import { FileUploadService } from "@/services/fileUploadService";
import { config } from "@/lib/config";

const DURATION_OPTIONS: { value: LearningModuleImageDuration; labelKey: string }[] = [
  { value: "D1", labelKey: "learningModule.image.durationD1" },
  { value: "D2", labelKey: "learningModule.image.durationD2" },
  { value: "D3", labelKey: "learningModule.image.durationD3" },
];

const AUDIENCE_OPTIONS: { value: LearningModuleAudience; labelKey: string }[] = [
  { value: "GENERAL", labelKey: "learningModule.image.audienceGeneral" },
  { value: "TOP_LEADER", labelKey: "learningModule.image.audienceTopLeader" },
  { value: "LEADER", labelKey: "learningModule.image.audienceLeader" },
  { value: "TOP_AGENT", labelKey: "learningModule.image.audienceTopAgent" },
  { value: "AGENT", labelKey: "learningModule.image.audienceAgent" },
  { value: "NEW_LEADER", labelKey: "learningModule.image.audienceNewLeader" },
  { value: "NEW_AGENT", labelKey: "learningModule.image.audienceNewAgent" },
];

const CONTENT_OPTIONS: { value: LearningModuleContentType; labelKey: string }[] = [
  { value: "GENERAL", labelKey: "learningModule.image.contentGeneral" },
  { value: "LEADERSHIP", labelKey: "learningModule.image.contentLeadership" },
  { value: "MOTIVATION_COACH", labelKey: "learningModule.image.contentMotivationCoach" },
  { value: "PERSONAL_SALES", labelKey: "learningModule.image.contentPersonalSales" },
  { value: "RECRUITMENT", labelKey: "learningModule.image.contentRecruitment" },
  { value: "PRODUCT", labelKey: "learningModule.image.contentProduct" },
  { value: "LEGAL_COMPLIANCE", labelKey: "learningModule.image.contentLegalCompliance" },
  { value: "OPERATION", labelKey: "learningModule.image.contentOperation" },
];

const SHARE_OPTIONS: { value: LearningModuleImageShareScope; labelKey: string }[] = [
  { value: "GENERAL", labelKey: "learningModule.image.imageShareGeneral" },
  { value: "COMPANY_ONLY", labelKey: "learningModule.image.imageShareCompanyOnly" },
];

function isAllowedImageFile(file: File) {
  return /^image\/(jpeg|jpg|png)$/.test(file.type);
}

export default function EditLearningModuleImagePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const { user } = useOptionalAuth();

  const tt = React.useCallback(
    (key: string, fallback: string) => {
      const v = t(key);
      if (!v || v === key) return fallback;
      return v;
    },
    [t]
  );

  const id = Number((params as any)?.id);

  const [step, setStep] = React.useState<1 | 2>(1);

  const [duration, setDuration] = React.useState<LearningModuleImageDuration | "">("");
  const [shareScope, setShareScope] = React.useState<LearningModuleImageShareScope>("GENERAL");
  const [audience, setAudience] = React.useState<LearningModuleAudience[]>([]);
  const [contentTypes, setContentTypes] = React.useState<LearningModuleContentType[]>([]);
  const [title, setTitle] = React.useState("");

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string>("");
  const [existingFilename, setExistingFilename] = React.useState<string>("");
  const [existingUrl, setExistingUrl] = React.useState<string>("");

  const [companyName, setCompanyName] = React.useState<string>("");

  const [suffix, setSuffix] = React.useState(() => generateLearningModuleImageSuffix(6));
  const [codePreview, setCodePreview] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isStep1Valid = !!duration && audience.length > 0 && contentTypes.length > 0;
  const canRegenerate = !!duration;

  React.useEffect(() => {
    setCompanyName(getCompanyNameFromLocalStorage(user?.id ?? null));
  }, [user?.id]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const next = await buildLearningModuleImageCodePreview({
        duration,
        audience,
        contentTypes,
        suffix,
      });
      if (alive) setCodePreview(next);
    })();
    return () => {
      alive = false;
    };
  }, [duration, audience, contentTypes, suffix]);

  React.useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const load = React.useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await learningModuleImageApi.getById(id, { companyName: companyName || undefined });
      setTitle(res.title || "");
      setDuration((res.duration as any) || "");
      setShareScope((res.shareScope as any) || "GENERAL");
      setAudience((res.intendedAudience as any) || []);
      setContentTypes((res.contentTypes as any) || []);
      setExistingFilename(String(res.imageFilename || ""));
      setExistingUrl(String(res.imageUrl || (res.imageFilename ? `/images/${res.imageFilename}` : "")));
      setSuffix(generateLearningModuleImageSuffix(6));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id, companyName]);

  React.useEffect(() => {
    load();
  }, [load]);

  const toggleDuration = (v: LearningModuleImageDuration) => {
    setDuration((prev) => (prev === v ? "" : v));
  };

  const goToStep1 = (e?: React.SyntheticEvent) => {
    e?.preventDefault?.();
    setError(null);
    setStep(1);
  };

  const goToStep2 = (e?: React.SyntheticEvent) => {
    e?.preventDefault?.();
    setError(null);
    if (!isStep1Valid) {
      setError(t("learningModule.image.validation.step1"));
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

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    if (!isAllowedImageFile(file)) {
      setError(tt("learningModule.image.validation.imageType", "File harus berformat JPEG atau PNG"));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(tt("learningModule.image.validation.imageSize", "Ukuran file maksimal 5MB"));
      return;
    }

    setError(null);
    setSelectedFile(file);

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
  };

  const ensureImage = async () => {
    if (selectedFile) {
      const uploadResult: any = await FileUploadService.uploadImage(selectedFile);
      const filename = String(uploadResult?.filename || "").trim();
      const url = String(uploadResult?.url || "").trim();
      if (!filename || !url) {
        throw new Error(String(uploadResult?.error || uploadResult?.message || "Upload gagal"));
      }
      return { filename, url };
    }

    if (existingFilename && existingUrl) {
      return { filename: existingFilename, url: existingUrl };
    }

    throw new Error(tt("learningModule.image.validation.image", "Gambar wajib diupload"));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isStep1Valid) {
      setError(t("learningModule.image.validation.step1"));
      setStep(1);
      return;
    }
    if (!title.trim()) {
      setError(tt("learningModule.image.validation.title", "Judul wajib diisi"));
      setStep(2);
      return;
    }

    setSubmitting(true);
    try {
      const img = await ensureImage();

      const res = await learningModuleImageApi.update(
        id,
        {
          title,
          duration: duration as LearningModuleImageDuration,
          shareScope,
          intendedAudience: audience,
          contentTypes,
          imageFilename: img.filename,
          imageUrl: img.url,
          createdByCompanyName: companyName || null,
        },
        { companyName: companyName || undefined }
      );

      setExistingFilename(String(res.imageFilename || img.filename));
      setExistingUrl(String(res.imageUrl || img.url));

      clearFile();
      router.push("/learning-module/images");
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
                  placeholder={t("learningModule.image.code")}
                  readOnly
                  aria-readonly
                  aria-label={t("learningModule.image.code")}
                  className="h-11 pr-11 text-center font-mono"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setSuffix(generateLearningModuleImageSuffix(6))}
                  disabled={!canRegenerate}
                  aria-label={t("learningModule.image.regenerate")}
                  title={t("learningModule.image.regenerate")}
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
            {loading ? <div className="text-sm text-muted-foreground">{t("common.loading")}</div> : null}

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
                    <div className="text-sm font-semibold leading-tight">{t("learningModule.image.step1Title")}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("learningModule.image.duration")}, {t("learningModule.image.imageShare")}, {t("learningModule.image.contentTypes")}, {t("learningModule.image.audience")}
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
                    <div className="text-sm font-semibold leading-tight">{t("learningModule.image.step2Title")}</div>
                    <div className="text-xs text-muted-foreground">{t("learningModule.image.image")}</div>
                  </div>
                </button>
              </div>
            </div>

            {step === 1 ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                  <div className="space-y-2">
                    <Label>{t("learningModule.image.duration")}</Label>
                    <div className="rounded-md border p-3">
                      <div className="grid gap-2">
                        {DURATION_OPTIONS.map((opt) => {
                          const checked = duration === opt.value;
                          return (
                            <label key={opt.value} className="flex items-start gap-3 rounded-md px-2 py-1.5 hover:bg-muted/40">
                              <Checkbox checked={checked} onCheckedChange={() => toggleDuration(opt.value)} />
                              <div className="leading-tight">
                                <div className="text-sm font-medium">{t(opt.labelKey)}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{t("learningModule.image.durationHelp")}</div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("learningModule.image.imageShare")}</Label>
                    <RadioGroup
                      value={shareScope}
                      onValueChange={(v) => setShareScope((v as LearningModuleImageShareScope) || "GENERAL")}
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
                    <Label>{t("learningModule.image.contentTypes")}</Label>
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
                    <div className="text-xs text-muted-foreground">{t("learningModule.image.contentTypesPlaceholder")}</div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("learningModule.image.audience")}</Label>
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
                    <div className="text-xs text-muted-foreground">{t("learningModule.image.audiencePlaceholder")}</div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => router.push("/learning-module/images")}> 
                    {t("common.cancel")}
                  </Button>
                  <Button type="button" onClick={goToStep2}>
                    {t("common.next")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{tt("learningModule.image.imageTitle", "Judul")}</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={tt("learningModule.image.imageTitlePlaceholder", "Masukkan judul/topik...")}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("learningModule.image.image")}</Label>
                  <div className="rounded-lg border p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={onPickFile}
                        className="sm:flex-1"
                      />
                      <Button type="button" variant="outline" onClick={clearFile} disabled={!selectedFile}>
                        <X className="h-4 w-4" />
                        {tt("common.clear", "Clear")}
                      </Button>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">{t("learningModule.image.imageHint")}</div>

                    {(previewUrl || existingUrl) ? (
                      <div className="mt-3 rounded-md border bg-muted/10 p-2">
                        <div className="relative w-full overflow-hidden rounded-md border bg-background" style={{ aspectRatio: "16 / 9" }}>
                          <img
                            src={previewUrl || `${config.baseUrl}${existingUrl}`}
                            alt="preview"
                            className="h-full w-full object-contain"
                          />
                        </div>
                        {selectedFile ? (
                          <div className="mt-2 text-xs text-muted-foreground">{selectedFile.name}</div>
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
                    {submitting ? t("common.loading") : (
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
