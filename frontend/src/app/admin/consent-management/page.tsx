"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast-simple";
import { consentManagementAPI, type AvatarConsentStatus, type ConsentAudio, type PagedResponse } from "@/lib/api";
import { Key, Plus, Search, Trash2, Pencil, Eye } from "lucide-react";

export default function ConsentManagementPage() {
  const { toast } = useToast();

  const [items, setItems] = useState<ConsentAudio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [size] = useState<number>(25);
  const [totalPages, setTotalPages] = useState<number>(0);

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<ConsentAudio | null>(null);
  const [avatarName, setAvatarName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const [avatarStatuses, setAvatarStatuses] = useState<AvatarConsentStatus[]>([]);
  const [avatarsLoading, setAvatarsLoading] = useState<boolean>(true);
  const [avatarsSearch, setAvatarsSearch] = useState<string>("");
  const [ensuring, setEnsuring] = useState<Record<string, boolean>>({});

  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [detailTitle, setDetailTitle] = useState<string>("");
  const [detailText, setDetailText] = useState<string>("");

  const stats = useMemo(() => [{ label: "Total", value: items.length }], [items.length]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res: PagedResponse<ConsentAudio> = await consentManagementAPI.list({
        search: search.trim() || undefined,
        page,
        size,
      });
      setItems(res.content || []);
      setTotalPages(res.totalPages || 0);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to load consent audio",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvatars = async () => {
    try {
      setAvatarsLoading(true);
      const res = await consentManagementAPI.listAvatars({ search: avatarsSearch.trim() || undefined });
      setAvatarStatuses(res || []);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to load avatars",
        variant: "destructive",
      });
    } finally {
      setAvatarsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size]);

  useEffect(() => {
    fetchAvatars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0);
      fetchData();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchAvatars();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarsSearch]);

  const openCreate = () => {
    setEditing(null);
    setAvatarName("");
    setFile(null);
    setDialogOpen(true);
  };

  const openEdit = (row: ConsentAudio) => {
    setEditing(row);
    setAvatarName(row.avatarName);
    setFile(null);
    setDialogOpen(true);
  };

  const onSave = async () => {
    try {
      setSaving(true);
      if (!avatarName.trim()) {
        throw new Error("Avatar name is required");
      }

      if (!editing) {
        if (!file) {
          throw new Error("File is required");
        }
        await consentManagementAPI.create(avatarName.trim(), file);
        toast({ title: "Success", description: "Consent audio created" });
      } else {
        await consentManagementAPI.update(editing.id, avatarName.trim(), file || undefined);
        toast({ title: "Success", description: "Consent audio updated" });
      }

      setDialogOpen(false);
      await fetchData();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to save",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (row: ConsentAudio) => {
    const ok = window.confirm(`Delete consent audio for ${row.avatarName}?`);
    if (!ok) return;

    try {
      await consentManagementAPI.delete(row.id);
      toast({ title: "Success", description: "Consent audio deleted" });
      await fetchData();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const onEnsureConsent = async (avatarKey: string) => {
    const k = avatarKey.trim();
    if (!k) return;

    try {
      setEnsuring((p) => ({ ...p, [k]: true }));
      await consentManagementAPI.ensureAvatarConsent(k);
      toast({ title: "Success", description: "Consent created and locked for this avatar" });
      await fetchAvatars();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to ensure consent",
        variant: "destructive",
      });
    } finally {
      setEnsuring((p) => ({ ...p, [k]: false }));
    }
  };

  const openDetail = (title: string, text: string) => {
    setDetailTitle(title);
    setDetailText(text || "");
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Consent Management"
        description="Manage avatar consent recordings (MP3/MP4)"
        icon={Key}
        stats={stats}
        primaryAction={{ label: "Add Consent", onClick: openCreate, icon: Plus }}
        breadcrumb={[{ label: "Administration", href: "/admin" }, { label: "Consent Management" }]}
      />

      <div className="px-4 sm:px-6 lg:px-8 space-y-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={avatarsSearch}
                  onChange={(e) => setAvatarsSearch(e.target.value)}
                  placeholder="Search avatars (name / presenterId)..."
                  className="pl-9"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => fetchAvatars()} disabled={avatarsLoading}>
                  Refresh Avatars
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {avatarsLoading ? (
              <div className="p-8 flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Avatar</TableHead>
                      <TableHead>Presenter ID</TableHead>
                      <TableHead>Consent</TableHead>
                      <TableHead>Consent Audio</TableHead>
                      <TableHead>Consent Text</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {avatarStatuses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          No avatars found
                        </TableCell>
                      </TableRow>
                    ) : (
                      avatarStatuses.map((row) => {
                        const key = row.presenterName || row.presenterId;
                        const busy = !!ensuring[key];
                        const canEnsure = !row.hasConsent;
                        const hasText = !!(row.consentText && row.consentText.trim().length > 0);
                        return (
                          <TableRow key={row.presenterId}>
                            <TableCell className="font-medium">{row.presenterName}</TableCell>
                            <TableCell className="max-w-[280px] truncate">{row.presenterId}</TableCell>
                            <TableCell>{row.hasConsent ? "YES" : "NO"}</TableCell>
                            <TableCell>{row.hasConsentAudio ? "YES" : "NO"}</TableCell>
                            <TableCell className="max-w-[520px]">
                              <div className="truncate">{row.consentText || ""}</div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={!hasText}
                                  onClick={() => openDetail(`${row.presenterName} (${row.presenterId})`, row.consentText || "")}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant={canEnsure ? "default" : "outline"}
                                  disabled={!canEnsure || busy}
                                  onClick={() => onEnsureConsent(key)}
                                >
                                  {busy ? "Creating..." : canEnsure ? "Create Consent" : "Locked"}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Consent Detail</DialogTitle>
              <DialogDescription>{detailTitle}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <div className="text-sm font-medium">Full Consent Text</div>
              <div className="rounded-md border bg-background p-3">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{detailText}</div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search avatar name..."
                  className="pl-9"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => fetchData()} disabled={loading}>
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Avatar Name</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                          No consent audio found
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.avatarName}</TableCell>
                          <TableCell className="max-w-[420px] truncate">{row.originalFilename}</TableCell>
                          <TableCell>{row.mimeType}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => onDelete(row)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button variant="outline" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            Prev
          </Button>
          <div className="text-sm text-muted-foreground">Page {page + 1} / {Math.max(1, totalPages)}</div>
          <Button variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Consent" : "Add Consent"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update avatar name and/or replace file." : "Upload MP3/MP4 consent recording for an avatar."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Avatar Name</label>
              <Input value={avatarName} onChange={(e) => setAvatarName(e.target.value)} placeholder="e.g. gilbertsit" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">File (MP3/MP4)</label>
              <Input
                type="file"
                accept="audio/mpeg,video/mp4,.mp3,.mp4"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {editing && <p className="text-xs text-muted-foreground">Leave empty to keep existing file.</p>}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={onSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
