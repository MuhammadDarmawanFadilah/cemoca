"use client";

import React, { useEffect, useState, useCallback } from "react";
import { fileManager } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  FolderIcon,
  FileIcon,
  ChevronRightIcon,
  HomeIcon,
  UploadIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowLeftIcon,
  PlayCircleIcon,
  RefreshCwIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface FileInfo {
  name: string;
  path: string;
  size: number;
  lastModified: string;
}

interface FolderInfo {
  name: string;
  path: string;
  fileCount: number;
  files: FileInfo[];
}

interface FileManagerFolderResponse {
  companyCode: string;
  basePath: string;
  folders: FolderInfo[];
}

interface SchedulerLogResponse {
  id: number;
  companyCode: string | null;
  importType: string | null;
  fileName: string | null;
  filePath: string | null;
  status: string | null;
  createdCount: number | null;
  updatedCount: number | null;
  errorCount: number | null;
  errorMessage: string | null;
  processedBy: string | null;
  processedAt: string;
}

interface PageResponse {
  content: SchedulerLogResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

type ViewMode = "folders" | "sukses" | "failed";

interface BreadcrumbItem {
  name: string;
  path: string[];
}

export default function FileManagerPage() {
  const { toast } = useToast();
  const [folders, setFolders] = useState<FileManagerFolderResponse[]>([]);
  const [logs, setLogs] = useState<SchedulerLogResponse[]>([]);
  const [config, setConfig] = useState<{ basePath: string; enabled: boolean; intervalHours: number; nextRun: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("folders");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const loadData = async () => {
    try {
      setLoading(true);
      if (viewMode === "folders") {
        const [foldersData, configData] = await Promise.all([
          fileManager.getAllFolders(),
          fileManager.getConfig(),
        ]);
        setFolders(foldersData);
        setConfig(configData);
      } else {
        const logsData = await fileManager.getLogs(currentPage, 25);
        setLogs(logsData.content);
        setTotalPages(logsData.totalPages);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [viewMode, currentPage]);

  const handleProcessNow = async () => {
    setProcessing(true);
    try {
      const result = await fileManager.processNow();
      toast({
        title: "Processing Started",
        description: result.message || "Files are being processed",
      });
      setTimeout(() => loadData(), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start processing",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: "Invalid File",
        description: "Please upload Excel files only (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    if (currentPath.length < 2) {
      toast({
        title: "Select Folder",
        description: "Navigate to AgencyList or PolicyList folder first",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const result = await fileManager.uploadFile(file, currentPath[0], currentPath[1]);
      
      toast({
        title: "Uploaded",
        description: `${result.fileName} uploaded successfully`,
      });
      
      setTimeout(() => loadData(), 1000);
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setIsDragging(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  }, [currentPath]);

  const navigateToFolder = (folderName: string) => {
    setCurrentPath([...currentPath, folderName]);
  };

  const navigateBack = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1));
    }
  };

  const navigateToRoot = () => {
    setCurrentPath([]);
  };

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [{ name: "Root", path: [] }];
    currentPath.forEach((folder, index) => {
      breadcrumbs.push({
        name: folder,
        path: currentPath.slice(0, index + 1),
      });
    });
    return breadcrumbs;
  };

  const getCurrentFolderContent = () => {
    if (currentPath.length === 0) {
      return folders.map(f => ({ name: f.companyCode, type: 'folder' as const }));
    }
    
    if (currentPath.length === 1) {
      const company = folders.find(f => f.companyCode === currentPath[0]);
      return company?.folders.map(f => ({ name: f.name, type: 'folder' as const })) || [];
    }
    
    if (currentPath.length === 2) {
      const company = folders.find(f => f.companyCode === currentPath[0]);
      const folder = company?.folders.find(f => f.name === currentPath[1]);
      return folder?.files.map(f => ({ name: f.name, type: 'file' as const, size: f.size, modified: f.lastModified })) || [];
    }
    
    return [];
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto p-6 space-y-8">
        <Skeleton className="h-12 w-80" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  const folderContent = getCurrentFolderContent();

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Compact Header with Scheduler Info */}
      {config && viewMode === "folders" && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold">File Manager</h1>
                <div className="h-6 w-px bg-border" />
                <ClockIcon className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Every {config.intervalHours || 6}h</span>
                <div className="h-4 w-px bg-border" />
                <span className="text-sm">Next: {config.nextRun ? formatDate(config.nextRun) : "Calculating..."}</span>
                <Badge variant={config.enabled ? "default" : "secondary"} className="px-2 py-0.5 text-xs">
                  {config.enabled ? "🟢" : "⚫"}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadData}
                  disabled={processing}
                >
                  <RefreshCwIcon className="mr-1 h-4 w-4" />
                  Refresh
                </Button>
                <Button 
                  size="sm"
                  onClick={handleProcessNow}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <ClockIcon className="mr-1 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <PlayCircleIcon className="mr-1 h-4 w-4" />
                      Process Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compact Header for non-folder views */}
      {viewMode !== "folders" && (
        <div className="flex items-center justify-between py-2">
          <h1 className="text-2xl font-bold">File Manager</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCwIcon className="mr-1 h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" onClick={handleProcessNow} disabled={processing}>
              {processing ? (
                <>
                  <ClockIcon className="mr-1 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <PlayCircleIcon className="mr-1 h-4 w-4" />
                  Process Now
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* View Mode Tabs */}
      <div className="flex gap-3 border-b-2">
        <Button
          variant={viewMode === "folders" ? "default" : "ghost"}
          size="lg"
          onClick={() => { setViewMode("folders"); setCurrentPath([]); }}
          className="rounded-b-none px-6"
        >
          <UploadIcon className="mr-2 h-5 w-5" />
          Upload Files
        </Button>
        <Button
          variant={viewMode === "sukses" ? "default" : "ghost"}
          size="lg"
          onClick={() => { setViewMode("sukses"); setCurrentPage(0); }}
          className="rounded-b-none px-6"
        >
          <CheckCircleIcon className="mr-2 h-5 w-5" />
          Success Logs
        </Button>
        <Button
          variant={viewMode === "failed" ? "default" : "ghost"}
          size="lg"
          onClick={() => { setViewMode("failed"); setCurrentPage(0); }}
          className="rounded-b-none px-6"
        >
          <XCircleIcon className="mr-2 h-5 w-5" />
          Failed Logs
        </Button>
      </div>

      {/* Folder View */}
      {viewMode === "folders" && (
        <Card className="min-h-[500px]">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {currentPath.length > 0 && (
                  <Button variant="outline" onClick={navigateBack}>
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                )}
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-base">
                  <button 
                    onClick={navigateToRoot} 
                    className="hover:text-primary transition-colors p-1 rounded-md hover:bg-muted"
                  >
                    <HomeIcon className="h-5 w-5" />
                  </button>
                  {getBreadcrumbs().slice(1).map((crumb, index) => (
                    <React.Fragment key={index}>
                      <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
                      <button
                        onClick={() => setCurrentPath(crumb.path)}
                        className="hover:text-primary transition-colors font-medium px-2 py-1 rounded-md hover:bg-muted"
                      >
                        {crumb.name}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <CardDescription className="text-base">
                {currentPath.length === 0 && "Select a company folder"}
                {currentPath.length === 1 && "Select AgencyList or PolicyList"}
                {currentPath.length === 2 && "Drop Excel files here to upload"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Upload Zone */}
            {currentPath.length === 2 && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-xl p-16 mb-6 text-center transition-all duration-200",
                  isDragging 
                    ? "border-primary bg-primary/10 scale-[1.02]" 
                    : "border-muted-foreground/25 hover:border-muted-foreground/50",
                  uploading && "opacity-50 pointer-events-none"
                )}
              >
                <UploadIcon className="h-20 w-20 mx-auto mb-6 text-muted-foreground" />
                <p className="text-2xl font-semibold mb-3">
                  {uploading ? "Uploading..." : "Drop Excel file here"}
                </p>
                <p className="text-base text-muted-foreground mb-6">
                  or click below to browse your files
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label htmlFor="file-upload">
                  <Button size="lg" variant="outline" disabled={uploading} asChild>
                    <span className="cursor-pointer">
                      <FileIcon className="mr-2 h-5 w-5" />
                      Select Excel File
                    </span>
                  </Button>
                </label>
              </div>
            )}

            {/* Folder Content */}
            <div className="grid grid-cols-1 gap-3">
              {folderContent.length === 0 ? (
                <div className="text-center py-20">
                  <FolderIcon className="h-20 w-20 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-xl text-muted-foreground">
                    {currentPath.length === 0 ? "No company folders found" : "This folder is empty"}
                  </p>
                </div>
              ) : (
                folderContent.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => item.type === 'folder' && navigateToFolder(item.name)}
                    className={cn(
                      "flex items-center justify-between p-6 rounded-xl border-2 transition-all duration-200",
                      item.type === 'folder' 
                        ? "hover:bg-muted cursor-pointer hover:border-primary hover:shadow-md" 
                        : "bg-muted/30 border-dashed"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      {item.type === 'folder' ? (
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <FolderIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                      ) : (
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <FileIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                      )}
                      <span className="text-lg font-semibold">{item.name}</span>
                    </div>
                    {item.type === 'file' && (
                      <div className="flex items-center gap-6 text-base text-muted-foreground">
                        <span className="font-medium">{formatFileSize(item.size!)}</span>
                        <span>{formatDate(item.modified!)}</span>
                      </div>
                    )}
                    {item.type === 'folder' && (
                      <ChevronRightIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs View */}
      {(viewMode === "sukses" || viewMode === "failed") && (
        <Card>
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-2xl">
              {viewMode === "sukses" ? "✅ Success Logs" : "❌ Failed Logs"}
            </CardTitle>
            <CardDescription className="text-base">
              {viewMode === "sukses" 
                ? "Successfully processed files" 
                : "Failed processing attempts with error details"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Timestamp</TableHead>
                    <TableHead className="font-semibold">Company</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">File Name</TableHead>
                    <TableHead className="font-semibold text-center">Created</TableHead>
                    <TableHead className="font-semibold text-center">Updated</TableHead>
                    <TableHead className="font-semibold text-center">Errors</TableHead>
                    {viewMode === "failed" && <TableHead className="font-semibold">Error Message</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={viewMode === "failed" ? 8 : 7} className="text-center py-16">
                        <div className="flex flex-col items-center gap-3">
                          {viewMode === "sukses" ? (
                            <CheckCircleIcon className="h-16 w-16 text-muted-foreground/50" />
                          ) : (
                            <XCircleIcon className="h-16 w-16 text-muted-foreground/50" />
                          )}
                          <p className="text-lg text-muted-foreground">No logs found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs
                      .filter(log => viewMode === "sukses" ? log.status === "SUCCESS" : log.status === "FAILED")
                      .map((log) => (
                        <TableRow key={log.id} className="hover:bg-muted/30">
                          <TableCell className="whitespace-nowrap font-medium">
                            {formatDate(log.processedAt)}
                          </TableCell>
                          <TableCell className="font-medium">{log.companyCode || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-medium">
                              {log.importType || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate font-medium">
                            {log.fileName || "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="font-semibold">
                              {log.createdCount || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="font-semibold">
                              {log.updatedCount || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant={log.errorCount && log.errorCount > 0 ? "destructive" : "secondary"}
                              className="font-semibold"
                            >
                              {log.errorCount || 0}
                            </Badge>
                          </TableCell>
                          {viewMode === "failed" && (
                            <TableCell className="max-w-md">
                              <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                                {log.errorMessage || "-"}
                              </span>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-base text-muted-foreground font-medium">
                  Page {currentPage + 1} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage === totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
