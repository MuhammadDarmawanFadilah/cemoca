"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useOptionalAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { imageAPI } from "@/lib/api";
import { config } from "@/lib/config";
import { toast } from "sonner";
import Image from "next/image";
import { Building2, ImageUp, Trash2 } from "lucide-react";

type UpdatePhotoResponse = {
  message?: string;
  user?: unknown;
  error?: string;
};

export default function ProfilePage() {
  const { user, isAuthenticated, setUser } = useOptionalAuth();
  const { t } = useLanguage();

  const companyName = (user?.companyName || "").trim();
  const companyCode = (user?.companyCode || "").trim();
  const photoFilename = (user?.avatarUrl || "").trim() || null;

  const [isUploading, setIsUploading] = useState(false);

  const authToken = useMemo(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("auth_token");
  }, []);

  const onSelectFile = async (file: File) => {
    if (!isAuthenticated) {
      toast.error(t("auth.loginRequired"));
      return;
    }
    if (!authToken) {
      toast.error(t("auth.loginRequired"));
      return;
    }
    setIsUploading(true);
    try {
      const res = await imageAPI.uploadImage(file);
      const filename = res.filename || res.url;

      const response = await fetch(`${config.apiUrl}/auth/me/company-photo`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ photoFilename: filename }),
      });

      const data = (await response.json().catch(() => ({}))) as UpdatePhotoResponse;
      if (!response.ok) {
        throw new Error(data?.error || "Failed to update company photo");
      }

      const nextUser = { ...(user as any), avatarUrl: filename };
      if (typeof window !== "undefined") {
        window.localStorage.setItem("auth_user", JSON.stringify(nextUser));
      }
      setUser(nextUser);

      toast.success(t("profile.companyPhotoUploaded"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("errors.general");
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const onRemovePhoto = () => {
    if (!isAuthenticated || !authToken) {
      toast.error(t("auth.loginRequired"));
      return;
    }
    if (!photoFilename) return;
    setIsUploading(true);
    void (async () => {
      try {
        const response = await fetch(`${config.apiUrl}/auth/me/company-photo`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const data = (await response.json().catch(() => ({}))) as UpdatePhotoResponse;
        if (!response.ok) {
          throw new Error(data?.error || "Failed to remove company photo");
        }

        const nextUser = { ...(user as any), avatarUrl: null };
        if (typeof window !== "undefined") {
          window.localStorage.setItem("auth_user", JSON.stringify(nextUser));
        }
        setUser(nextUser);
        toast.success(t("profile.updateSuccess"));
      } catch (e) {
        const msg = e instanceof Error ? e.message : t("errors.general");
        toast.error(msg);
      } finally {
        setIsUploading(false);
      }
    })();
  };

  const photoUrl = photoFilename ? imageAPI.getImageUrl(photoFilename) : null;

  if (!isAuthenticated) {
    return (
      <div className="w-full px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>{t("auth.loginRequired")}</CardTitle>
              <CardDescription>{t("auth.login")}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

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
                    value={companyName || "-"}
                    readOnly
                    placeholder={t("auth.enterCompanyName")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyCode">{t("profile.companyCode")}</Label>
                  <Input id="companyCode" value={companyCode || "-"} readOnly placeholder={t("profile.companyCodePlaceholder")} />
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
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">{t("auth.ownerName")}</div>
                    <div className="text-sm font-medium truncate">{user?.ownerName || "-"}</div>
                  </div>
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
