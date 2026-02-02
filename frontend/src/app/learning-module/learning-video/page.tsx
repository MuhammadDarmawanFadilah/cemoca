"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Edit, Plus, Search, Trash2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils";
import { learningVideoApi, type LearningVideoBundle, type LearningVideoListResponse } from "@/lib/learningVideoApi";
import { useLanguage } from "@/contexts/LanguageContext";

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

type RequestEditDialogState = {
  open: boolean;
  videoId: number | null;
  phoneNumber: string;
  selectedLanguages: string[];
  submitting: boolean;
};

export default function LearningVideoListPage() {
  const { t } = useLanguage();
  const router = useRouter();
  
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<LearningVideoBundle[]>([]);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(10);
  const [totalPages, setTotalPages] = React.useState(0);
  const [totalElements, setTotalElements] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");
  
  const [requestEditDialog, setRequestEditDialog] = React.useState<RequestEditDialogState>({
    open: false,
    videoId: null,
    phoneNumber: "",
    selectedLanguages: [],
    submitting: false,
  });

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await learningVideoApi.list({ page, size, search });
      setData(result.content || []);
      setTotalPages(result.totalPages || 0);
      setTotalElements(result.totalElements || 0);
    } catch (e: any) {
      showErrorToast(e);
    } finally {
      setLoading(false);
    }
  }, [page, size, search]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setDeleting(true);
    try {
      await learningVideoApi.delete(deleteId);
      showSuccessToast(t('learningModule.learningVideo.deleteVideo'));
      setDeleteId(null);
      await loadData();
    } catch (e: any) {
      showErrorToast(e);
    } finally {
      setDeleting(false);
    }
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(0);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  const handleSizeChange = (newSize: string) => {
    setSize(Number(newSize));
    setPage(0); // Reset to first page when changing size
  };
  
  const openRequestEditDialog = (videoId: number) => {
    setRequestEditDialog({
      open: true,
      videoId,
      phoneNumber: "",
      selectedLanguages: [],
      submitting: false,
    });
  };
  
  const closeRequestEditDialog = () => {
    setRequestEditDialog((prev) => ({ ...prev, open: false }));
    setTimeout(() => {
      setRequestEditDialog({
        open: false,
        videoId: null,
        phoneNumber: "",
        selectedLanguages: [],
        submitting: false,
      });
    }, 300);
  };
  
  const toggleLanguage = (langCode: string) => {
    setRequestEditDialog((prev) => {
      const selected = prev.selectedLanguages;
      if (selected.includes(langCode)) {
        return { ...prev, selectedLanguages: selected.filter((l) => l !== langCode) };
      } else {
        return { ...prev, selectedLanguages: [...selected, langCode] };
      }
    });
  };
  
  const handleRequestEditSubmit = async () => {
    if (!requestEditDialog.videoId) return;
    
    if (!requestEditDialog.phoneNumber.trim()) {
      showErrorToast("Phone number is required");
      return;
    }
    
    // Validate phone number must start with country code (not 0)
    if (requestEditDialog.phoneNumber.startsWith("0")) {
      showErrorToast("Phone number must start with country code (e.g., 62... not 08...)");
      return;
    }
    
    if (requestEditDialog.selectedLanguages.length === 0) {
      showErrorToast("Please select at least one language");
      return;
    }
    
    setRequestEditDialog((prev) => ({ ...prev, submitting: true }));
    
    try {
      const response = await learningVideoApi.requestEdit(requestEditDialog.videoId, {
        phoneNumber: requestEditDialog.phoneNumber,
        languageCodes: requestEditDialog.selectedLanguages,
      });
      
      if (response.success) {
        showSuccessToast(response.message || "Edit request sent successfully");
        closeRequestEditDialog();
      } else {
        showErrorToast(response.message || "Failed to send edit request");
      }
    } catch (e: any) {
      showErrorToast(e);
    } finally {
      setRequestEditDialog((prev) => ({ ...prev, submitting: false }));
    }
  };

  const truncateText = (text: string, maxWords: number = 100) => {
    if (!text) return "-";
    const words = text.split(/\s+/);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(" ") + "...";
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="mx-auto w-full max-w-none space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold md:text-2xl">{t('learningModule.learningVideo.listTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('learningModule.learningVideo.pageSubtitle')}</p>
        </div>
        <Button onClick={() => router.push('/learning-module/learning-video/new')}>
          <Plus className="mr-2 h-4 w-4" />
          {t('learningModule.learningVideo.addVideo')}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('learningModule.learningVideo.searchByCode')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="pl-9"
              />
            </div>
            <Select value={String(size)} onValueChange={handleSizeChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="250">250</SelectItem>
                <SelectItem value="1000">1000</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} variant="outline">
              {t('learningModule.learningVideo.search')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <LoadingSpinner size="lg" text="Loading..." />
          </CardContent>
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="text-muted-foreground">{t('learningModule.learningVideo.noData')}</div>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => router.push('/learning-module/learning-video/new')}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('learningModule.learningVideo.addVideo')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {data.map((item) => (
            <Card key={item.id}>
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                  <div className="space-y-3">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                            {item.code}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {LANGUAGES[item.sourceLanguageCode] || item.sourceLanguageCode}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {truncateText(item.sourceText)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <div>
                        <span className="font-semibold">{t('learningModule.learningVideo.createdAt')}:</span>{" "}
                        {formatDate(item.createdAt)}
                      </div>
                      {item.translations && Object.keys(item.translations).length > 0 && (
                        <div>
                          <span className="font-semibold">Translations:</span>{" "}
                          {Object.keys(item.translations).length} languages
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/learning-module/learning-video/${item.id}/edit`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      {t('learningModule.learningVideo.editVideo')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRequestEditDialog(item.id)}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Request Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(item.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('learningModule.learningVideo.deleteVideo')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && data.length > 0 && totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {t('learningModule.learningVideo.showing')} {page * size + 1} - {Math.min((page + 1) * size, totalElements)} {t('learningModule.learningVideo.of')} {totalElements}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(0)}
                  disabled={page === 0}
                >
                  {t('learningModule.learningVideo.first')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0}
                >
                  {t('learningModule.learningVideo.previous')}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t('learningModule.learningVideo.page')} {page + 1} {t('learningModule.learningVideo.of')} {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages - 1}
                >
                  {t('learningModule.learningVideo.next')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={page >= totalPages - 1}
                >
                  {t('learningModule.learningVideo.last')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('learningModule.learningVideo.deleteVideo')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('learningModule.learningVideo.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t('learningModule.learningVideo.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : t('learningModule.learningVideo.deleteVideo')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={requestEditDialog.open} onOpenChange={closeRequestEditDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Request Edit</DialogTitle>
            <DialogDescription className="text-base">
              Send edit request via WhatsApp. Link will be valid for 30 days.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-semibold">Phone Number (WhatsApp)</Label>
              <Input
                type="tel"
                placeholder="62812..., 8512..., 841234..., 6612..."
                value={requestEditDialog.phoneNumber}
                onChange={(e) => setRequestEditDialog((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                className="h-12 text-base"
              />
              <p className="text-xs text-muted-foreground">Enter phone number with country code (e.g., 62812... for Indonesia, 8512... for Cambodia, 841234... for Vietnam)</p>
            </div>
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Languages to Edit</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/10">
                {Object.entries(LANGUAGES).map(([code, name]) => (
                  <div key={code} className="flex items-center space-x-3">
                    <Checkbox
                      id={`lang-${code}`}
                      checked={requestEditDialog.selectedLanguages.includes(code)}
                      onCheckedChange={() => toggleLanguage(code)}
                      className="h-5 w-5"
                    />
                    <label
                      htmlFor={`lang-${code}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {name}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Select one or more languages that the recipient can edit</p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={closeRequestEditDialog} 
              disabled={requestEditDialog.submitting}
              className="h-11 px-6"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRequestEditSubmit} 
              disabled={requestEditDialog.submitting}
              className="h-11 px-8"
            >
              {requestEditDialog.submitting ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

