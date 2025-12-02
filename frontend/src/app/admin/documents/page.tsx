"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast-simple";
import { Search, Plus, Download, Edit, Trash2, FileText, Eye, Calendar, User, HardDrive } from "lucide-react";
import { DocumentForm } from "@/components/documents/DocumentForm";
import { DocumentDetails } from "@/components/documents/DocumentDetails";
import { DeleteConfirmDialog } from "@/components/documents/DeleteConfirmDialog";
import { config, getApiUrl } from "@/lib/config";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { SortableHeader } from "@/components/ui/sortable-header";
import { ServerPagination } from "@/components/ServerPagination";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Document {
  id: number;
  title: string;
  author: string;
  summary: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  downloadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse {
  documents: Document[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export default function DocumentManagementPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>("desc");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isEditing, setIsEditing] = useState(false);
    const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchDocuments();
  }, [currentPage, pageSize, sortBy, sortDir]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(0) // Reset to first page on search
      fetchDocuments()
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const url = searchTerm
        ? `${getApiUrl('/documents')}/search?keyword=${encodeURIComponent(searchTerm)}&page=${currentPage}&size=${pageSize}&sortBy=${sortBy}&sortDir=${sortDir}`
        : `${getApiUrl('/documents')}?page=${currentPage}&size=${pageSize}&sortBy=${sortBy}&sortDir=${sortDir}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch documents");
      
      const data: PaginatedResponse = await response.json();
      setDocuments(data.documents);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = () => {
    setCurrentPage(0);
    fetchDocuments();
  };
  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(0);
    setSortBy('createdAt');
    setSortDir('desc');
  };

  const handleSort = (newSortBy: string, newSortDir: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortDir(newSortDir);
    setCurrentPage(0); // Reset to first page when sorting
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(0); // Reset to first page when changing page size
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleCreate = () => {
    setSelectedDocument(null);
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleEdit = (document: Document) => {
    setSelectedDocument(document);
    setIsEditing(true);
    setIsFormOpen(true);
  };
  const handleView = (document: Document) => {
    // Navigate to document detail page
    router.push(`/documents/${document.id}`);
  };

  const handleDelete = (document: Document) => {
    setSelectedDocument(document);
    setIsDeleteDialogOpen(true);
  };

  const handleDownload = async (document: Document) => {
    try {
      const response = await fetch(`${getApiUrl('/documents')}/${document.id}/download`);
      if (!response.ok) throw new Error("Failed to download document");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = document.fileName;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Document downloaded successfully",
      });
      
      // Refresh to update download count
      fetchDocuments();
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    if (!selectedDocument) return;
    
    try {
      const response = await fetch(`${getApiUrl('/documents')}/${selectedDocument.id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Failed to delete document");
      
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      
      setIsDeleteDialogOpen(false);
      setSelectedDocument(null);
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getFileTypeColor = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case "pdf": return "bg-red-100 text-red-800";
      case "doc":
      case "docx": return "bg-blue-100 text-blue-800";
      case "xls":
      case "xlsx": return "bg-green-100 text-green-800";
      case "ppt":
      case "pptx": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <AdminPageHeader
        title="Management Dokumen"
        description="Kelola dan atur dokumen dengan mudah dan efisien"
        icon={FileText}
        primaryAction={{
          label: "Tambah Dokumen",
          onClick: handleCreate,
          icon: Plus
        }}
        stats={[
          {
            label: "Total Dokumen",
            value: totalItems,
            variant: "secondary"
          },
          {
            label: "Aktif",
            value: documents.filter(d => d.isActive).length,
            variant: "default"
          }
        ]}
      />

      <div className="container mx-auto p-6 space-y-6">        {/* Search and Filter */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
            <CardTitle className="text-gray-900 dark:text-white font-semibold">Pencarian Dokumen</CardTitle>
          </CardHeader>          <CardContent className="p-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan judul, penulis, atau ringkasan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Button onClick={handleClearSearch} variant="outline">
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>        {/* Documents Table */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all">
          <CardContent className="p-6">{loading ? (
            <div className="flex justify-center items-center h-32">
              <LoadingSpinner />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Tidak ada dokumen</p>
              <p className="text-muted-foreground">
                {searchTerm ? "Tidak ditemukan dokumen yang sesuai dengan pencarian" : "Belum ada dokumen yang ditambahkan"}
              </p>            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortableHeader
                        sortKey="title"
                        currentSort={{ sortBy, sortDir }}
                        onSort={handleSort}
                      >
                        Judul
                      </SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader
                        sortKey="author"
                        currentSort={{ sortBy, sortDir }}
                        onSort={handleSort}
                      >
                        Penulis
                      </SortableHeader>
                    </TableHead>
                    <TableHead>Jenis File</TableHead>
                    <TableHead>
                      <SortableHeader
                        sortKey="fileSize"
                        currentSort={{ sortBy, sortDir }}
                        onSort={handleSort}
                      >
                        Ukuran
                      </SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader
                        sortKey="downloadCount"
                        currentSort={{ sortBy, sortDir }}
                        onSort={handleSort}
                      >
                        Download
                      </SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader
                        sortKey="createdAt"
                        currentSort={{ sortBy, sortDir }}
                        onSort={handleSort}
                      >
                        Tanggal
                      </SortableHeader>
                    </TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{document.title}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {document.summary}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {document.author}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getFileTypeColor(document.fileType)}>
                          {document.fileType.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4 text-muted-foreground" />
                          {formatFileSize(document.fileSize)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {document.downloadCount}x
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(document.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(document)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(document)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(document)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(document)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>              </Table>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <ServerPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalElements={totalItems}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Dokumen" : "Tambah Dokumen Baru"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Perbarui informasi dokumen yang dipilih"
                : "Lengkapi form di bawah untuk menambah dokumen baru"
              }
            </DialogDescription>
          </DialogHeader>
          <DocumentForm
            document={selectedDocument}
            isEditing={isEditing}
            onSuccess={() => {
              setIsFormOpen(false);
              fetchDocuments();
            }}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Dokumen</DialogTitle>
            <DialogDescription>
              Informasi lengkap tentang dokumen yang dipilih
            </DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <DocumentDetails
              document={selectedDocument}
              onDownload={handleDownload}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onClose={() => setIsDetailsOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        documentTitle={selectedDocument?.title || ""}
      />
      </div>
    </div>
  );
}
