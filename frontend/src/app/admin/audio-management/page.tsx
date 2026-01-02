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
import { audioManagementAPI, type AvatarAudio, type PagedResponse } from "@/lib/api";
import { Music, Plus, Search, Trash2, Pencil } from "lucide-react";

export default function AudioManagementPage() {
  const { toast } = useToast();

  const [items, setItems] = useState<AvatarAudio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [size] = useState<number>(25);
  const [totalPages, setTotalPages] = useState<number>(0);

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<AvatarAudio | null>(null);
  const [avatarName, setAvatarName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const stats = useMemo(() => [{ label: "Total", value: items.length }], [items.length]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res: PagedResponse<AvatarAudio> = await audioManagementAPI.list({
        search: search.trim() || undefined,
        page,
        size,
      });
      setItems(res.content || []);
      setTotalPages(res.totalPages || 0);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to load audio",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0);
      fetchData();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setAvatarName("");
    setFile(null);
    setDialogOpen(true);
  };

  const openEdit = (row: AvatarAudio) => {
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
        await audioManagementAPI.create(avatarName.trim(), file);
        toast({ title: "Success", description: "Audio created" });
      } else {
        await audioManagementAPI.update(editing.id, avatarName.trim(), file || undefined);
        toast({ title: "Success", description: "Audio updated" });
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

  const onDelete = async (row: AvatarAudio) => {
    const ok = window.confirm(`Delete audio for ${row.avatarName}?`);
    if (!ok) return;

    try {
      await audioManagementAPI.delete(row.id);
      toast({ title: "Success", description: "Audio deleted" });
      await fetchData();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to delete",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Audio Management"
        description="Manage avatar audio samples (MP3/MP4)"
        icon={Music}
        stats={stats}
        primaryAction={{ label: "Add Audio", onClick: openCreate, icon: Plus }}
        breadcrumb={[{ label: "Administration", href: "/admin" }, { label: "Audio Management" }]}
      />

      <div className="px-4 sm:px-6 lg:px-8 space-y-4">
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
                          No audio found
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
          <div className="text-sm text-muted-foreground">
            Page {page + 1} / {Math.max(1, totalPages)}
          </div>
          <Button
            variant="outline"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Audio" : "Add Audio"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update avatar name and/or replace file." : "Upload MP3/MP4 for an avatar."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Avatar Name</label>
              <Input value={avatarName} onChange={(e) => setAvatarName(e.target.value)} placeholder="e.g. linda" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">File (MP3/MP4)</label>
              <Input
                type="file"
                accept="audio/mpeg,video/mp4,.mp3,.mp4"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {editing && (
                <p className="text-xs text-muted-foreground">Leave empty to keep existing file.</p>
              )}
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
