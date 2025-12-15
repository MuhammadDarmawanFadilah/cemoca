"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useOptionalAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { imageAPI } from "@/lib/api";
import { toast } from "sonner";
import Image from "next/image";
import { Building2, ImageUp, Trash2 } from "lucide-react";

type CompanyProfileLocal = {
  companyName?: string;
  companyCode?: string;
  photoFilename?: string;
  updatedAt?: string;
};

function storageKey(userId: number) {
  return `company_profile_${userId}`;
}

function storageKeyPublic() {
  return `company_profile_public`;
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default function ProfilePage() {
  const { user, isAuthenticated } = useOptionalAuth();
  const { t } = useLanguage();

  const userId = user?.id;
  const key = useMemo(() => {
    if (isAuthenticated && userId) return storageKey(userId);
    return storageKeyPublic();
  }, [isAuthenticated, userId]);

  const [companyName, setCompanyName] = useState<string>("");
  const [companyCode, setCompanyCode] = useState<string>("");
  const [photoFilename, setPhotoFilename] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const persistTo = (targetKey: string, patch: CompanyProfileLocal) => {
    const current = safeParse<CompanyProfileLocal>(localStorage.getItem(targetKey)) || {};
    const next: CompanyProfileLocal = { ...current, ...patch, updatedAt: new Date().toISOString() };
    localStorage.setItem(targetKey, JSON.stringify(next));

    window.dispatchEvent(new CustomEvent("companyProfileUpdated"));
  };

  useEffect(() => {
    const current = safeParse<CompanyProfileLocal>(localStorage.getItem(key)) || {};
    const publicCurrent = safeParse<CompanyProfileLocal>(localStorage.getItem(storageKeyPublic())) || {};
    const merged: CompanyProfileLocal = key === storageKeyPublic() ? publicCurrent : { ...publicCurrent, ...current };

    const nextCompanyName = (merged?.companyName || user?.companyName || "").trim();
    const nextCompanyCode = (merged?.companyCode || user?.companyCode || "").trim();
    setCompanyName(nextCompanyName);
    setCompanyCode(nextCompanyCode);
    setPhotoFilename(merged?.photoFilename || null);

    const shouldCopyToKey =
      (nextCompanyName && !current.companyName) ||
      (nextCompanyCode && !current.companyCode) ||
      (merged.photoFilename && !current.photoFilename);

    if (shouldCopyToKey) {
      persistTo(key, {
        companyName: nextCompanyName || undefined,
        companyCode: nextCompanyCode || undefined,
        photoFilename: merged.photoFilename || undefined,
      });
    }

    if (isAuthenticated && userId && (user?.companyName || user?.companyCode)) {
      persistTo(storageKeyPublic(), {
        companyName: (user.companyName || "").trim() || undefined,
        companyCode: (user.companyCode || "").trim() || undefined,
      });
    }
  }, [key, user?.companyName, user?.companyCode, isAuthenticated, userId]);

  const persist = (patch: CompanyProfileLocal) => {
    persistTo(key, patch);
    if (isAuthenticated && userId) {
      persistTo(storageKeyPublic(), patch);
    }
  };

  const onSaveCompanyProfile = () => {
    persist({ companyName, companyCode });
    toast.success(t("profile.updateSuccess"));
  };

  const onResetCompanyCode = () => {
    persist({ companyCode: undefined });
    setCompanyCode("");
    toast.success(t("profile.updateSuccess"));
  };

  const onSelectFile = async (file: File) => {
    if (!isAuthenticated) {
      toast.error(t("auth.loginRequired"));
      return;
    }
    setIsUploading(true);
    try {
      const res = await imageAPI.uploadImage(file);
      const filename = res.filename || res.url;
      persist({ photoFilename: filename });
      setPhotoFilename(filename);
      toast.success(t("profile.companyPhotoUploaded"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("errors.general");
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const onRemovePhoto = () => {
    persist({ photoFilename: undefined });
    setPhotoFilename(null);
    toast.success(t("profile.updateSuccess"));
  };

  const photoUrl = photoFilename ? imageAPI.getImageUrl(photoFilename) : null;

  return (
    <div className="w-full px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <Card className="rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-xl md:text-2xl">{t("profile.companyProfile")}</CardTitle>
                  </div>
                  <CardDescription>{t("profile.companyProfileDesc")}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {companyCode?.trim() ? (
                    <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                      {companyCode.trim()}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </CardHeader>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>{t("profile.companyInfo")}</CardTitle>
                <CardDescription>{t("profile.companyInfoDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">{t("auth.companyName")}</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={t("auth.enterCompanyName")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyCode">{t("profile.companyCode")}</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="companyCode"
                      value={companyCode}
                      onChange={(e) => setCompanyCode(e.target.value)}
                      placeholder={t("profile.companyCodePlaceholder")}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onResetCompanyCode}
                      disabled={!companyCode.trim()}
                      className="sm:w-auto"
                    >
                      {t("profile.resetCompanyCode")}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">{t("auth.username")}</div>
                    <div className="text-sm font-medium truncate">{user?.username || "-"}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">{t("auth.email")}</div>
                    <div className="text-sm font-medium truncate">{user?.email || "-"}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("auth.phoneNumber")}</Label>
                    <Input value={user?.phoneNumber || "-"} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auth.agencyRange")}</Label>
                    <Input value={user?.agencyRange || "-"} readOnly />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("auth.reasonToUse")}</Label>
                  <Textarea value={user?.reasonToUse || "-"} readOnly className="min-h-[96px]" />
                </div>

                <Button onClick={onSaveCompanyProfile} className="w-full md:w-auto">
                  {t("common.save")}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>{t("profile.companyPhoto")}</CardTitle>
                <CardDescription>{t("profile.companyPhotoDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border bg-muted/20 p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 overflow-hidden rounded-xl border bg-background">
                      {photoUrl ? (
                        <Image src={photoUrl} alt={t("profile.companyPhoto")} fill className="object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                          {t("profile.noPhoto")}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{companyName || t("profile.companyNamePlaceholder")}</div>
                      <div className="text-xs text-muted-foreground truncate">{t("profile.photoHint")}</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    id="companyPhoto"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading || !isAuthenticated}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void onSelectFile(f);
                      e.currentTarget.value = "";
                    }}
                  />
                  <Label
                    htmlFor="companyPhoto"
                    className={
                      "inline-flex h-10 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow-xs hover:bg-secondary/80 cursor-pointer" +
                      (isUploading || !isAuthenticated ? " pointer-events-none opacity-60" : "")
                    }
                  >
                    <ImageUp className="h-4 w-4 mr-2" />
                    {isUploading ? t("common.loading") : t("profile.uploadPhoto")}
                  </Label>
                  <Button
                    variant="outline"
                    className="sm:w-auto"
                    disabled={!photoFilename || isUploading || !isAuthenticated}
                    onClick={onRemovePhoto}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("common.remove")}
                  </Button>
                </div>

              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
