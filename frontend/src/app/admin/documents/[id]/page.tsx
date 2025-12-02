'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Calendar, 
  Eye, 
  Download, 
  User,
  Clock,
  FileText,
  Edit,
  Trash2,
  Settings
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { imageAPI } from '@/lib/api'
import DocumentCommentSection from '@/components/documents/DocumentCommentSection'
import { config, getApiUrl } from '@/lib/config'

interface Document {
  id: number;
  title: string;
  author: string;
  summary: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  illustrationImage?: string;
  downloadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`${getApiUrl('/documents')}/${params?.id}`)
        if (response.ok) {
          const data = await response.json()
          setDocument(data.document)
        } else {
          toast.error('Dokumen tidak ditemukan')
          router.push('/admin/documents')
        }      } catch (error) {
        console.error('Error fetching document:', error)
        toast.error('Error mengambil data dokumen')
      } finally {
        setLoading(false)
      }
    }
    
    if (params?.id) {
      fetchDocument()
    }
  }, [params?.id, router])

  const handleDownload = async () => {
    if (!document) return

    try {
      const response = await fetch(`${getApiUrl('/documents')}/${document.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = window.document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = document.fileName
        window.document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('Download berhasil dimulai')
      } else {
        toast.error('Gagal mendownload dokumen')
      }
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Error saat mendownload dokumen')
    }
  }

  const handleEdit = () => {
    if (document) {
      router.push(`/admin/documents?edit=${document.id}`)
    }
  }

  const handleDelete = async () => {
    if (!document) return
    
    if (confirm(`Apakah Anda yakin ingin menghapus dokumen "${document.title}"?`)) {
      try {
        const response = await fetch(`${getApiUrl('/documents')}/${document.id}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          toast.success('Dokumen berhasil dihapus')
          router.push('/admin/documents')
        } else {
          toast.error('Gagal menghapus dokumen')
        }
      } catch (error) {
        console.error('Delete error:', error)
        toast.error('Error saat menghapus dokumen')
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
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
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Memuat dokumen...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Dokumen tidak ditemukan</h2>
          <p className="text-muted-foreground mb-4">
            Dokumen yang Anda cari tidak tersedia atau telah dihapus.
          </p>
          <Button onClick={() => router.push('/admin/documents')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Management Dokumen
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/admin/documents')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Management
        </Button>
        
        {/* Admin Actions */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit} className="gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Hapus
          </Button>
        </div>
      </div>

      {/* Admin Banner */}
      <Card className="bg-blue-50 border-blue-200 mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-700">
            <Settings className="h-5 w-5" />
            <span className="font-medium">Mode Admin - Document Management</span>
          </div>
          <p className="text-blue-600 text-sm mt-1">
            Anda sedang melihat dokumen dalam mode admin dengan akses penuh untuk edit dan hapus.
          </p>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Article */}
        <div className="lg:col-span-2 space-y-8">
          {/* Document Details */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Illustration Image */}
              {document.illustrationImage && (
                <div className="relative w-full h-[400px] lg:h-[500px]">
                  <Image
                    src={imageAPI.getImageUrl(document.illustrationImage)}
                    alt={document.title}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 text-white">
                    <div className="max-w-4xl">
                      <h1 className="text-2xl lg:text-4xl xl:text-5xl font-bold mb-4 leading-tight drop-shadow-lg">
                        {document.title}
                      </h1>
                      
                      <div className="flex flex-wrap items-center gap-4 mb-4 text-gray-200">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-10 w-10 border-2 border-white/20">
                            <AvatarFallback className="bg-white/10 text-white">
                              {document.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-lg">{document.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(document.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          <span>{document.downloadCount} download</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Content Section */}
              <div className="p-6 lg:p-8">
                {/* If no image, show title here */}
                {!document.illustrationImage && (
                  <>
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-6">
                      {document.title}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400 mb-6">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {document.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{document.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(document.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        <span>{document.downloadCount} download</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Summary */}
                {document.summary && (
                  <div className="mb-8">
                    <h2 className="text-xl lg:text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                      Ringkasan
                    </h2>
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                        {document.summary}
                      </p>
                    </div>
                  </div>
                )}

                {/* Admin Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button onClick={handleDownload} className="gap-2" size="lg">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline" onClick={handleEdit} className="gap-2" size="lg">
                    <Edit className="h-4 w-4" />
                    Edit Dokumen
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} className="gap-2" size="lg">
                    <Trash2 className="h-4 w-4" />
                    Hapus Dokumen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Dokumen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Judul</label>
                    <p className="font-medium">{document.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Penulis</label>
                    <p className="font-medium">{document.author}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nama File</label>
                    <p className="font-mono text-sm break-all">{document.fileName}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Jenis File</label>
                    <div className="mt-1">
                      <Badge className={getFileTypeColor(document.fileType)}>
                        {document.fileType.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Ukuran File</label>
                    <p className="font-medium">{formatFileSize(document.fileSize)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">MIME Type</label>
                    <p className="font-mono text-sm">{document.mimeType}</p>
                  </div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dibuat</label>
                  <p className="font-medium">{formatDate(document.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Diperbarui</label>
                  <p className="font-medium">{formatDate(document.updatedAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Download</label>
                  <p className="font-medium">{document.downloadCount} kali</p>
                </div>
              </div>
            </CardContent>
          </Card>          {/* Comments Section */}
          <DocumentCommentSection documentId={Number(params?.id)} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Admin Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aksi Admin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleDownload} className="w-full gap-2" size="lg">
                <Download className="h-4 w-4" />
                Download Dokumen
              </Button>
              <Button variant="outline" onClick={handleEdit} className="w-full gap-2" size="lg">
                <Edit className="h-4 w-4" />
                Edit Dokumen
              </Button>
              <Button variant="destructive" onClick={handleDelete} className="w-full gap-2" size="lg">
                <Trash2 className="h-4 w-4" />
                Hapus Dokumen
              </Button>
            </CardContent>
          </Card>

          {/* Author Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Penulis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <Avatar className="h-20 w-20 mx-auto">
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {document.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-xl">{document.author}</h3>
                  <p className="text-muted-foreground">Penulis Dokumen</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistik</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Download</span>
                <Badge variant="secondary">{document.downloadCount}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={document.isActive ? "default" : "secondary"}>
                  {document.isActive ? "Aktif" : "Tidak Aktif"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Ukuran File</span>
                <span className="font-medium">{formatFileSize(document.fileSize)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
