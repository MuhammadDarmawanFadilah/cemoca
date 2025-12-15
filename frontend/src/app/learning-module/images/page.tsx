"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Code2, Copy, Edit, Filter, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/MultiSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ServerPagination } from "@/components/ServerPagination";
import { useOptionalAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  learningModuleImageApi,
  type LearningModuleImageResponse,
  type LearningModuleAudience,
  type LearningModuleContentType,
} from "@/lib/learningModuleImageApi";
import { getCompanyNameFromLocalStorage } from "@/lib/companyProfileLocal";

const DURATION_OPTIONS = [
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

export default function LearningModuleImagesPage() {
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

  const [codeDialogOpen, setCodeDialogOpen] = React.useState(false);
  const [codeDialogTitle, setCodeDialogTitle] = React.useState<string>("");
  const [codeDialogValue, setCodeDialogValue] = React.useState<string>("");

  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const [draftTitle, setDraftTitle] = React.useState("");
  const [draftDuration, setDraftDuration] = React.useState<string>("");
  const [draftCreator, setDraftCreator] = React.useState("");
  const [draftAudiences, setDraftAudiences] = React.useState<LearningModuleAudience[]>([]);
  const [draftContentTypes, setDraftContentTypes] = React.useState<LearningModuleContentType[]>([]);

  const [appliedTitle, setAppliedTitle] = React.useState("");
  const [appliedDuration, setAppliedDuration] = React.useState<string>("");
  const [appliedCreator, setAppliedCreator] = React.useState("");
  const [appliedAudiences, setAppliedAudiences] = React.useState<LearningModuleAudience[]>([]);
  const [appliedContentTypes, setAppliedContentTypes] = React.useState<LearningModuleContentType[]>([]);

  React.useEffect(() => {
    setCompanyName(getCompanyNameFromLocalStorage(user?.id ?? null));
  }, [user?.id]);

  const formatAudience = React.useCallback(
    (values: string[] | undefined | null) => {
      const map: Record<string, string> = {
        GENERAL: t("learningModule.image.audienceGeneral"),
        TOP_LEADER: t("learningModule.image.audienceTopLeader"),
        LEADER: t("learningModule.image.audienceLeader"),
        TOP_AGENT: t("learningModule.image.audienceTopAgent"),
        AGENT: t("learningModule.image.audienceAgent"),
        NEW_LEADER: t("learningModule.image.audienceNewLeader"),
        NEW_AGENT: t("learningModule.image.audienceNewAgent"),
      };
      return (values ?? []).map((v) => map[v] ?? v).join(", ");
    },
    [t]
  );

  const formatContentTypes = React.useCallback(
    (values: string[] | undefined | null) => {
      const map: Record<string, string> = {
        GENERAL: t("learningModule.image.contentGeneral"),
        LEADERSHIP: t("learningModule.image.contentLeadership"),
        MOTIVATION_COACH: t("learningModule.image.contentMotivationCoach"),
        PERSONAL_SALES: t("learningModule.image.contentPersonalSales"),
        RECRUITMENT: t("learningModule.image.contentRecruitment"),
        PRODUCT: t("learningModule.image.contentProduct"),
        LEGAL_COMPLIANCE: t("learningModule.image.contentLegalCompliance"),
        OPERATION: t("learningModule.image.contentOperation"),
      };
      return (values ?? []).map((v) => map[v] ?? v).join(", ");
    },
    [t]
  );

  const formatShare = React.useCallback(
    (v: string | undefined | null) => {
      if (v === "COMPANY_ONLY") return t("learningModule.image.imageShareCompanyOnly");
      return t("learningModule.image.imageShareGeneral");
    },
    [t]
  );

  const [items, setItems] = React.useState<LearningModuleImageResponse[]>([]);
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [totalPages, setTotalPages] = React.useState(0);
  const [totalElements, setTotalElements] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await learningModuleImageApi.list({
        page,
        size: pageSize,
        companyName: companyName || undefined,
        title: appliedTitle || undefined,
        duration: appliedDuration || undefined,
        creator: appliedCreator || undefined,
        audience: appliedAudiences.length > 0 ? appliedAudiences : undefined,
        contentType: appliedContentTypes.length > 0 ? appliedContentTypes : undefined,
      });
      setItems(res.content ?? []);
      setTotalPages(res.totalPages ?? 0);
      setTotalElements(res.totalElements ?? 0);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    pageSize,
    companyName,
    appliedTitle,
    appliedDuration,
    appliedCreator,
    appliedAudiences,
    appliedContentTypes,
  ]);

  React.useEffect(() => {
    load();
  }, [load]);

  const onSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setAppliedTitle(draftTitle.trim());
    setAppliedDuration(draftDuration === "ALL" ? "" : draftDuration);
    setAppliedCreator(draftCreator.trim());
    setAppliedAudiences(draftAudiences);
    setAppliedContentTypes(draftContentTypes);
    setPage(0);
  };

  const onReset = () => {
    setDraftTitle("");
    setDraftDuration("");
    setDraftCreator("");
    setDraftAudiences([]);
    setDraftContentTypes([]);

    setAppliedTitle("");
    setAppliedDuration("");
    setAppliedCreator("");
    setAppliedAudiences([]);
    setAppliedContentTypes([]);

    setPage(0);
  };

  const activeFilterCount =
    (appliedTitle ? 1 : 0) +
    (appliedDuration ? 1 : 0) +
    (appliedCreator ? 1 : 0) +
    (appliedAudiences.length > 0 ? 1 : 0) +
    (appliedContentTypes.length > 0 ? 1 : 0);

  const handleDelete = async (id: number) => {
    const v = t("common.deleteConfirm");
    if (!window.confirm((v && v !== "common.deleteConfirm" ? v : "Are you sure you want to delete this item?"))) {
      return;
    }
    try {
      await learningModuleImageApi.remove(id, { companyName: companyName || undefined });
      load();
    } catch (e: any) {
      alert(e?.message ?? "Failed to delete");
    }
  };

  const onShowCode = (item: LearningModuleImageResponse) => {
    setCodeDialogTitle(item.title || "-");
    setCodeDialogValue(item.code || "");
    setCodeDialogOpen(true);
  };

  const onCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeDialogValue || "");
    } catch {
      // ignore
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 p-4 md:p-6">
      <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Kode: {codeDialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="rounded-md border bg-muted/20 p-3">
            <pre className="max-h-[240px] overflow-auto whitespace-pre-wrap break-words font-mono text-sm">
              {codeDialogValue || "-"}
            </pre>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCopyCode}>
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold md:text-2xl">{t("learningModule.image.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("learningModule.image.subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/learning-module/images/new">{t("learningModule.image.create")}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">{t("learningModule.image.list")}</CardTitle>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 ? (
                <Badge variant="secondary" className="w-fit">
                  {activeFilterCount} filter aktif
                </Badge>
              ) : null}
              <Button type="button" variant="outline" size="sm" onClick={() => setFiltersOpen((v) => !v)}>
                <Filter className="h-4 w-4" />
                {filtersOpen ? "Sembunyikan filter" : "Tampilkan filter"}
                {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filtersOpen ? (
            <Card className="border-dashed">
              <CardContent className="pt-4">
                <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" onSubmit={onSearch}>
                  <div className="space-y-1">
                    <div className="text-[11px] text-muted-foreground">Judul</div>
                    <Input
                      placeholder={tt("learningModule.image.titlePlaceholder", "Cari judul...")}
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] text-muted-foreground">Durasi</div>
                    <Select value={draftDuration || "ALL"} onValueChange={setDraftDuration}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder={tt("learningModule.image.duration", "Pilih durasi")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">{tt("common.all", "Semua")}</SelectItem>
                        {DURATION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {t(opt.labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] text-muted-foreground">Company</div>
                    <Input
                      placeholder={tt("learningModule.image.createdByPlaceholder", "Cari company...")}
                      value={draftCreator}
                      onChange={(e) => setDraftCreator(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] text-muted-foreground">Target Audiens</div>
                    <MultiSelect<LearningModuleAudience>
                      options={AUDIENCE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
                      value={draftAudiences}
                      onChange={setDraftAudiences}
                      placeholder={tt("learningModule.image.audience", "Pilih audiens")}
                      searchPlaceholder="Cari audiens..."
                      emptyText="Tidak ada data"
                      triggerSize="sm"
                      triggerClassName="h-8 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] text-muted-foreground">Tipe Konten</div>
                    <MultiSelect<LearningModuleContentType>
                      options={CONTENT_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
                      value={draftContentTypes}
                      onChange={setDraftContentTypes}
                      placeholder={tt("learningModule.image.contentTypes", "Pilih tipe konten")}
                      searchPlaceholder="Cari tipe konten..."
                      emptyText="Tidak ada data"
                      triggerSize="sm"
                      triggerClassName="h-8 text-sm"
                    />
                  </div>

                  <div className="flex items-end justify-end gap-2 sm:col-span-2 lg:col-span-1">
                    <Button type="submit" size="sm" className="w-full sm:w-auto">
                      Search
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={onReset}>
                      Reset
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : null}

          {error ? <div className="text-sm text-destructive">{error}</div> : null}

          <div className="rounded-md border">
            <div className="hidden md:grid grid-cols-12 gap-2 border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
              <div className="col-span-12 md:col-span-3">{t("learningModule.image.imageTitle") || "Judul"}</div>
              <div className="col-span-6 md:col-span-1">{t("learningModule.image.duration")}</div>
              <div className="col-span-6 md:col-span-1">{t("learningModule.image.imageShare")}</div>
              <div className="col-span-12 md:col-span-3">{t("learningModule.image.createdBy")}</div>
              <div className="col-span-12 md:col-span-1">{t("learningModule.image.audience")}</div>
              <div className="col-span-12 md:col-span-2">{t("learningModule.image.contentTypes")}</div>
              <div className="col-span-12 md:col-span-1 text-center">{tt("common.actions", "Actions")}</div>
            </div>

            {loading ? (
              <div className="px-3 py-4 text-sm text-muted-foreground">{t("common.loading")}</div>
            ) : items.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground">{t("common.noData")}</div>
            ) : (
              items.map((it) => (
                <div key={it.id} className="border-b last:border-b-0">
                  <div className="md:hidden px-3 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{it.title || "-"}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onShowCode(it)}>
                          <Code2 className="h-4 w-4" />
                          <span className="sr-only">Show code</span>
                        </Button>
                        {it.canEdit ? (
                          <>
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                              <Link href={`/learning-module/images/${it.id}/edit`}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">{t("common.edit")}</span>
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(it.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">{t("common.delete")}</span>
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex flex-col gap-1">
                      <div className="text-xs">
                        <span className="text-muted-foreground">Company: </span>
                        <span className="font-medium">{it.createdBy ?? it.createdByCompanyName ?? "Anonim / Admin"}</span>
                      </div>
                      {it.createdAt ? (
                        <div className="text-[11px] text-muted-foreground">{format(new Date(it.createdAt), "dd-MMM-yyyy HH:mm")}</div>
                      ) : null}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-[11px]">
                        {it.duration}
                      </Badge>
                      <Badge variant="outline" className="text-[11px]">
                        {formatShare(it.shareScope)}
                      </Badge>
                      {it.intendedAudience && it.intendedAudience.length > 0 ? (
                        <Badge variant="outline" className="text-[11px]">
                          Audiens: {it.intendedAudience.length}
                        </Badge>
                      ) : null}
                      {it.contentTypes && it.contentTypes.length > 0 ? (
                        <Badge variant="outline" className="text-[11px]">
                          Konten: {it.contentTypes.length}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-3 items-center">
                    <div className="col-span-12 md:col-span-3">
                      <div className="truncate text-sm font-medium">{it.title || "-"}</div>
                    </div>
                    <div className="col-span-6 md:col-span-1 text-sm">{it.duration}</div>
                    <div className="col-span-6 md:col-span-1 text-sm">{formatShare(it.shareScope)}</div>
                    <div className="col-span-12 md:col-span-3 text-sm">
                      <div>{it.createdBy ?? it.createdByCompanyName ?? "Anonim / Admin"}</div>
                      {it.createdAt && (
                        <div className="text-xs text-muted-foreground">{format(new Date(it.createdAt), "dd-MMM-yyyy HH:mm")}</div>
                      )}
                    </div>
                    <div className="col-span-12 md:col-span-1 text-sm">{formatAudience(it.intendedAudience)}</div>
                    <div className="col-span-12 md:col-span-2 text-sm">{formatContentTypes(it.contentTypes)}</div>
                    <div className="col-span-12 md:col-span-1 flex justify-center gap-2">
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onShowCode(it)}>
                        <Code2 className="h-4 w-4" />
                        <span className="sr-only">Show code</span>
                      </Button>
                      {it.canEdit ? (
                        <>
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                            <Link href={`/learning-module/images/${it.id}/edit`}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">{t("common.edit")}</span>
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(it.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">{t("common.delete")}</span>
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>

                  <div className="md:hidden">
                    <Separator />
                  </div>
                </div>
              ))
            )}
          </div>

          <ServerPagination
            currentPage={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(0);
            }}
            pageSizeOptions={[10, 25, 100, 1000, 10000]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
