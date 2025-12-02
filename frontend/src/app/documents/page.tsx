"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast-simple";
import { config, getApiUrl } from "@/lib/config";
import { 
  Search, 
  Download, 
  FileText, 
  Eye, 
  Calendar, 
  User, 
  HardDrive, 
  BookOpen, 
  Filter, 
  Grid, 
  List,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
  Loader2,
  ArrowUpDown,
  SlidersHorizontal,
  ThumbsUp,
  Plus,
  Edit,
  Trash2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import Image from "next/image";
import { imageAPI } from "@/lib/api";
import DocumentFilters from "@/components/DocumentFilters";
import { DocumentForm } from "@/components/documents/DocumentForm";
import { DeleteConfirmDialog } from "@/components/documents/DeleteConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  recommendationCount?: number;
  isActive: boolean;
  illustrationImage?: string;
  createdAt: string;
  updatedAt: string;
}

interface DocumentFilterRequest {
  searchTerm?: string;
  title?: string;
  fileType?: string;
  author?: string;
  sortBy?: string;
  page: number;
  size: number;
}

interface PaginatedResponse {
  documents: Document[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Custom Pagination Component for better control
const SimplePagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  loading = false
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}) => {
  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 0; i < 5; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(totalPages - 1);
      } else if (currentPage >= totalPages - 4) {
        pages.push(0);
        pages.push(-1); // ellipsis
        for (let i = totalPages - 5; i < totalPages; i++) pages.push(i);
      } else {
        pages.push(0);
        pages.push(-1); // ellipsis
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(totalPages - 1);
      }
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(0)}
        disabled={currentPage === 0 || loading}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
        <ChevronLeft className="h-4 w-4 -ml-2" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0 || loading}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1">
        {getVisiblePages().map((page, index) => {
          if (page === -1) {
            return (
              <Button
                key={`ellipsis-${index}`}
                variant="ghost"
                size="sm"
                disabled
                className="h-8 w-8 p-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            );
          }
          
          return (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              {page + 1}
            </Button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1 || loading}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(totalPages - 1)}
        disabled={currentPage === totalPages - 1 || loading}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
        <ChevronRight className="h-4 w-4 -ml-2" />
      </Button>
    </div>
  );
};

export default function PublicDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);  
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState<string>("grid");
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<DocumentFilterRequest>({
    page: 0,
    size: 20,
    sortBy: "newest"
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const { toast } = useToast();  const router = useRouter();

  const fetchDocuments = useCallback(async (currentFilters: DocumentFilterRequest) => {
    try {
      setLoading(true);
      let url = `${getApiUrl('/documents')}?page=${currentFilters.page}&size=${currentFilters.size}`;
      
      // If there's a general search term, use the search endpoint
      if (currentFilters.searchTerm && currentFilters.searchTerm.trim()) {
        url = `${getApiUrl('/documents')}/search?keyword=${encodeURIComponent(currentFilters.searchTerm.trim())}&page=${currentFilters.page}&size=${currentFilters.size}`;
      }
      
      // Add filters and sorting
      const params = new URLSearchParams();
      if (currentFilters.title && currentFilters.title.trim()) {
        params.append("title", currentFilters.title.trim());
      }
      if (currentFilters.fileType && currentFilters.fileType !== "all") {
        params.append("fileType", currentFilters.fileType);
      }
      if (currentFilters.author && currentFilters.author.trim()) {
        params.append("author", currentFilters.author.trim());
      }
      if (currentFilters.sortBy && currentFilters.sortBy !== "newest") {
        params.append("sort", currentFilters.sortBy);
      }
      
      if (params.toString()) {
        url += `&${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch documents");
      
      const data: PaginatedResponse = await response.json();
      // Filter only active documents for public view
      const activeDocuments = data.documents.filter((doc: Document) => doc.isActive);
      setDocuments(activeDocuments);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.currentPage);
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
  }, [toast]);
  useEffect(() => {
    fetchDocuments(filters);
    // Get current user info for ownership checks
    const userStr = localStorage.getItem('auth_user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (error) {
        // Silent error handling for better performance
      }
    }
  }, [filters, fetchDocuments]);

  const handleFilterChange = useCallback((newFilters: DocumentFilterRequest) => {
    setFilters(newFilters);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const handleView = useCallback((document: Document) => {
    router.push(`/documents/${document.id}`);
  }, [router]);
  const handleDownload = useCallback(async (document: Document) => {
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
      window.document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Document downloaded successfully",
      });
      
      // Refresh to update download count
      fetchDocuments(filters);
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  }, [toast, fetchDocuments, filters]);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, []);

  const getFileTypeColor = useCallback((fileType: string) => {
    switch (fileType.toLowerCase()) {
      case "pdf": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "doc":
      case "docx": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "xls":
      case "xlsx": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "ppt":
      case "pptx": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  }, []);
  const handleViewModeChange = useCallback((value: string | string[]) => {
    if (typeof value === 'string') {
      setViewMode(value);
    }
  }, []);

  // CRUD Functions with Role-based Authorization
  const isAdmin = useCallback(() => {
    return currentUser && (
      currentUser.role?.roleName === 'ADMIN' || 
      currentUser.roles?.includes('ADMIN')
    );
  }, [currentUser]);

  const canUserEditDocument = useCallback((document: Document) => {
    if (isAdmin()) return true; // Admin can edit any document
    // Check both user.fullName and user.biografi.namaLengkap for ownership
    return currentUser && (
      document.author === currentUser.fullName || 
      (currentUser.biografi && document.author === currentUser.biografi.namaLengkap)
    );
  }, [currentUser, isAdmin]);

  const canUserDeleteDocument = useCallback((document: Document) => {
    if (isAdmin()) return true; // Admin can delete any document
    // Check both user.fullName and user.biografi.namaLengkap for ownership
    return currentUser && (
      document.author === currentUser.fullName || 
      (currentUser.biografi && document.author === currentUser.biografi.namaLengkap)
    );
  }, [currentUser, isAdmin]);

  const handleCreate = useCallback(() => {
    setSelectedDocument(null);
    setIsEditing(false);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((document: Document) => {
    if (!canUserEditDocument(document)) {
      toast({
        title: "Error",
        description: isAdmin() ? "Unable to edit this document" : "You can only edit your own documents",
        variant: "destructive",
      });
      return;
    }
    setSelectedDocument(document);
    setIsEditing(true);
    setIsFormOpen(true);
  }, [canUserEditDocument, isAdmin, toast]);

  const handleDelete = useCallback((document: Document) => {
    if (!canUserDeleteDocument(document)) {
      toast({
        title: "Error",
        description: isAdmin() ? "Unable to delete this document" : "You can only delete your own documents",
        variant: "destructive",
      });
      return;
    }
    setSelectedDocument(document);
    setIsDeleteDialogOpen(true);
  }, [canUserDeleteDocument, isAdmin, toast]);

  const handleFormSuccess = useCallback(() => {
    setIsFormOpen(false);
    setSelectedDocument(null);
    setIsEditing(false);
    fetchDocuments(filters);
    toast({
      title: "Success",
      description: isEditing ? "Document updated successfully" : "Document created successfully",
    });
  }, [fetchDocuments, filters, isEditing, toast]);

  const handleFormCancel = useCallback(() => {
    setIsFormOpen(false);
    setSelectedDocument(null);
    setIsEditing(false);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedDocument) return;
    
    try {
      const response = await fetch(`${getApiUrl('/documents')}/${selectedDocument.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to delete document');
      
      setIsDeleteDialogOpen(false);
      setSelectedDocument(null);
      fetchDocuments(filters);
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  }, [selectedDocument, fetchDocuments, filters, toast]);
  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">        <div className="container mx-auto px-2 xs:px-4 py-6 max-w-7xl overflow-hidden">          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
                <BookOpen className="h-6 w-6 xs:h-8 xs:w-8 text-blue-600 flex-shrink-0" />
                <h1 className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">
                  <span className="hidden sm:inline">Sharing Dokumen Antar Alumni</span>
                  <span className="sm:hidden">Dokumen Alumni</span>
                </h1>
              </div>
              <Button 
                onClick={handleCreate}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all w-full sm:w-auto flex-shrink-0"
                size="default"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden xs:inline">Create Document</span>
                <span className="xs:hidden">Create</span>
              </Button>
            </div>
          </div>          {/* Search and Filters */}
          <div className="mb-6">
            <DocumentFilters 
              onFilterChange={handleFilterChange}
              currentFilters={filters}
            />
          </div>          {/* Controls Bar */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
              {/* Document count */}
              <div className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                Showing <span className="font-medium text-gray-900 dark:text-white">{documents.length}</span> of <span className="font-medium text-gray-900 dark:text-white">{totalItems}</span> documents
              </div>
              
              {/* Controls */}
              <div className="flex flex-col xs:flex-row items-center justify-center sm:justify-end gap-3 xs:gap-4 sm:gap-6">
                {/* Per page selector */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="page-size" className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    Per page:
                  </Label>
                  <Select 
                    value={filters.size.toString()} 
                    onValueChange={(value) => {
                      setFilters(prev => ({ ...prev, size: parseInt(value), page: 0 }));
                    }}
                  >
                    <SelectTrigger id="page-size" className="w-16 sm:w-20 h-8 sm:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* View mode toggle */}
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    View:
                  </Label>
                  <ToggleGroup 
                    type="single" 
                    value={viewMode} 
                    onValueChange={handleViewModeChange} 
                    className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1"
                  >
                    <ToggleGroupItem 
                      value="list" 
                      aria-label="List view" 
                      size="sm" 
                      className="px-2 sm:px-3 py-1.5 sm:py-2 data-[state=on]:bg-white data-[state=on]:shadow-sm"
                    >
                      <List className="h-4 w-4" />
                      <span className="hidden sm:inline sm:ml-2">List</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="grid" 
                      aria-label="Grid view" 
                      size="sm" 
                      className="px-2 sm:px-3 py-1.5 sm:py-2 data-[state=on]:bg-white data-[state=on]:shadow-sm"
                    >
                      <Grid className="h-4 w-4" />
                      <span className="hidden sm:inline sm:ml-2">Grid</span>
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            </div>
          </div>

        {/* Documents Display */}
        {loading ? (
          <Card>
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading documents...</p>
              </div>            </CardContent>
          </Card>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No documents found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No documents are available at this time
                </p>
              </div>
            </CardContent>
          </Card>) : viewMode === "list" ? (
          /* Beautiful List View */
          <div className="space-y-3">
            {documents.map((document) => (
              <Card 
                key={document.id} 
                className="group hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500"
                onClick={() => handleView(document)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">                    {/* Document Thumbnail */}
                    <div className="flex-shrink-0">
                      {document.illustrationImage ? (
                        <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <Image
                            src={imageAPI.getImageUrl(document.illustrationImage)}
                            alt={document.title}
                            fill
                            className="object-cover transition-transform hover:scale-105"
                            sizes="64px"
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                          <FileText className="h-8 w-8 text-blue-500" />
                        </div>
                      )}
                    </div>

                    {/* Document Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg leading-tight text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {document.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            by {document.author}
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <Badge className={getFileTypeColor(document.fileType)}>
                            {document.fileType.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      {/* Truncated Summary */}
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {document.summary}
                      </p>                      {/* Metadata */}
                      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between pt-2 gap-2">
                        <div className="flex flex-wrap items-center gap-3 xs:gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {formatFileSize(document.fileSize)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {document.downloadCount}
                          </span>
                          <span className="flex items-center gap-1 hidden xs:flex">
                            <ThumbsUp className="h-3 w-3" />
                            {document.recommendationCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(document.createdAt)}
                          </span>
                        </div>
                        {/* Action Buttons */}
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(document);
                            }}
                            className="h-8 px-2 xs:px-3 text-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            <span className="hidden xs:inline">View</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(document);
                            }}
                            className="h-8 px-2 xs:px-3 text-xs hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-colors"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            <span className="hidden xs:inline">Download</span>
                          </Button>
                          {canUserEditDocument(document) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(document);
                              }}
                              className="h-8 px-2 xs:px-3 text-xs hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-300 transition-colors"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              <span className="hidden xs:inline">Edit</span>
                            </Button>
                          )}
                          {canUserDeleteDocument(document) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(document);
                              }}
                              className="h-8 px-2 xs:px-3 text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              <span className="hidden xs:inline">Delete</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (          /* Compact Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {documents.map((document) => (
              <Card key={document.id} className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
                <CardContent className="p-0">
                  <div 
                    className="relative h-32 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center cursor-pointer"
                    onClick={() => handleView(document)}
                  >
                    {document.illustrationImage ? (
                      <Image
                        src={imageAPI.getImageUrl(document.illustrationImage)}
                        alt={document.title}
                        fill
                        className="object-cover transition-transform hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <FileText className="h-12 w-12 text-blue-500" />
                    )}                    <div className="absolute top-2 right-2">
                      <Badge className={getFileTypeColor(document.fileType)}>
                        {document.fileType.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-3 space-y-2">
                    <h3 
                      className="font-semibold text-sm line-clamp-2 leading-tight cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => handleView(document)}
                    >
                      {document.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {document.author}
                    </p>
                      <div className="grid grid-cols-3 gap-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {formatFileSize(document.fileSize)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {document.downloadCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {document.recommendationCount || 0}
                      </span>
                    </div>
                    
                    <div className="flex gap-1 pt-1">
                      <Button 
                        size="sm" 
                        className="flex-1 h-7 text-xs hover:bg-blue-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(document);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(document);
                        }}
                        className="h-7 w-7 p-0 hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-colors"
                        title="Download"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      {canUserEditDocument(document) && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(document);
                          }}
                          className="h-7 w-7 p-0 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-300 transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                      {canUserDeleteDocument(document) && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(document);
                          }}
                          className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}        {/* Enhanced Pagination */}
        <SimplePagination 
          currentPage={filters.page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          loading={loading}
        />
        </div>

        {/* CRUD Dialogs */}
        {/* Create/Edit Document Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit Document" : "Create New Document"}
              </DialogTitle>
              <DialogDescription>
                {isEditing 
                  ? "Update the document information and file."
                  : "Upload a new document to share with alumni community."
                }
              </DialogDescription>
            </DialogHeader>
            <DocumentForm
              document={selectedDocument}
              isEditing={isEditing}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          documentTitle={selectedDocument?.title || ""}
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </ProtectedRoute>
  );
}
