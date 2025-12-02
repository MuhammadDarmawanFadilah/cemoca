import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  Edit, 
  Trash2, 
  FileText, 
  User, 
  Calendar, 
  BarChart3,
  FileType,
  HardDrive
} from "lucide-react";

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

interface DocumentDetailsProps {
  document: Document;
  onDownload: (document: Document) => void;
  onEdit: (document: Document) => void;
  onDelete: (document: Document) => void;
  onClose: () => void;
}

export function DocumentDetails({ document, onDownload, onEdit, onDelete, onClose }: DocumentDetailsProps) {
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
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileTypeColor = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case "pdf": return "bg-red-100 text-red-800 border-red-200";
      case "doc":
      case "docx": return "bg-blue-100 text-blue-800 border-blue-200";
      case "xls":
      case "xlsx": return "bg-green-100 text-green-800 border-green-200";
      case "ppt":
      case "pptx": return "bg-orange-100 text-orange-800 border-orange-200";
      case "txt": return "bg-gray-100 text-gray-800 border-gray-200";
      case "zip":
      case "rar": return "bg-purple-100 text-purple-800 border-purple-200";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "bmp": return "bg-pink-100 text-pink-800 border-pink-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case "pdf":
      case "doc":
      case "docx":
      case "txt":
        return <FileText className="h-5 w-5" />;
      default:
        return <FileType className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{document.title}</h2>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{document.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(document.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => onDownload(document)}
            className="gap-2"
            size="sm"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button
            onClick={() => onEdit(document)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button
            onClick={() => onDelete(document)}
            variant="outline"
            size="sm"
            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Hapus
          </Button>
        </div>
      </div>

      <Separator />

      {/* Document Information */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informasi Dokumen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Judul</label>
              <p className="text-gray-900 font-medium">{document.title}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Penulis</label>
              <p className="text-gray-900">{document.author}</p>
            </div>

            {document.summary && (
              <div>
                <label className="text-sm font-medium text-gray-500">Ringkasan</label>
                <p className="text-gray-900 text-sm leading-relaxed">{document.summary}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Detail File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border ${getFileTypeColor(document.fileType)}`}>
                {getFileTypeIcon(document.fileType)}
              </div>
              <div>
                <p className="font-medium text-gray-900">{document.fileName}</p>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <Badge className={getFileTypeColor(document.fileType)}>
                    {document.fileType.toUpperCase()}
                  </Badge>
                  <span>{formatFileSize(document.fileSize)}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">MIME Type</label>
              <p className="text-gray-900 font-mono text-sm">{document.mimeType}</p>
            </div>

            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Didownload</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {document.downloadCount} kali
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timestamps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Riwayat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Dibuat pada</label>
              <p className="text-gray-900">{formatDate(document.createdAt)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Terakhir diperbarui</label>
              <p className="text-gray-900">{formatDate(document.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${document.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={`font-medium ${document.isActive ? 'text-green-700' : 'text-red-700'}`}>
              {document.isActive ? 'Aktif' : 'Tidak Aktif'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
