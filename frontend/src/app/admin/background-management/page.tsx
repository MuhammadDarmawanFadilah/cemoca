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
import { backgroundManagementAPI, type PagedResponse, type VideoBackground } from "@/lib/api";
import { config } from "@/lib/config";
import { Image as ImageIcon, Pencil, Plus, Search, Trash2 } from "lucide-react";

export default function BackgroundManagementPage() {
  const { toast } = useToast();

  const [items, setItems] = useState<VideoBackground[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [size] = useState<number>(25);
  const [totalPages, setTotalPages] = useState<number>(0);

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<VideoBackground | null>(null);
  const [backgroundName, setBackgroundName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const stats = useMemo(() => [{ label: "Total", value: items.length }], [items.length]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res: PagedResponse<VideoBackground> = await backgroundManagementAPI.list({
        search: search.trim() || undefined,
        page,
        size,
      });
      setItems(res.content || []);
      setTotalPages(res.totalPages || 0);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to load backgrounds",
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
    setBackgroundName("");
    setFile(null);
    setDialogOpen(true);
  };

  const openEdit = (row: VideoBackground) => {
    setEditing(row);
    setBackgroundName(row.backgroundName);
    setFile(null);
    setDialogOpen(true);
  };

  const onSave = async () => {
    try {
      setSaving(true);
      if (!backgroundName.trim()) {
        throw new Error("Background name is required");
      }

      if (!editing) {
        if (!file) {
          throw new Error("File is required");
        }
        await backgroundManagementAPI.create(backgroundName.trim(), file);
        toast({ title: "Success", description: "Background created" });
      } else {
        await backgroundManagementAPI.update(editing.id, backgroundName.trim(), file || undefined);
        toast({ title: "Success", description: "Background updated" });
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

  const onDelete = async (row: VideoBackground) => {
    const ok = window.confirm(`Delete background ${row.backgroundName}?`);
    if (!ok) return;

    try {
      await backgroundManagementAPI.delete(row.id);
      toast({ title: "Success", description: "Background deleted" });
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
        title="Background Management"
        description="Manage video background images"
        icon={ImageIcon}
        stats={stats}
        primaryAction={{ label: "Add Background", onClick: openCreate, icon: Plus }}
        breadcrumb={[{ label: "Administration", href: "/admin" }, { label: "Background Management" }]}
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
                  placeholder="Search background name..."
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
                      <TableHead>Name</TableHead>
                      <TableHead>Preview</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          No backgrounds found
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.backgroundName}</TableCell>
                          <TableCell>
                            <div className="h-10 w-20 rounded overflow-hidden border bg-slate-50 dark:bg-slate-950">
                              <img
                                src={`${config.apiUrl}/video-backgrounds/${encodeURIComponent(row.backgroundName)}`}
                                alt={row.backgroundName}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          </TableCell>
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
          <Button variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Background" : "Add Background"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update background name and/or replace image." : "Upload an image for video background."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Background Name</label>
              <Input value={backgroundName} onChange={(e) => setBackgroundName(e.target.value)} placeholder="e.g. bg-1" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Image (JPG/PNG/GIF/WEBP)</label>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
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
