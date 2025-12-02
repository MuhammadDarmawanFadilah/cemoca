import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, X, AlertCircle, CheckCircle, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { imageAPI, biografiAPI } from "@/lib/api";
import { getApiUrl } from "@/lib/config";
import { FILE_UPLOAD_CONFIG, validateFileSize, validateFileType, formatFileSize } from "@/lib/config-constants";

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

interface DocumentFormProps {
  document?: Document | null;
  isEditing?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DocumentForm({ document, isEditing = false, onSuccess, onCancel }: DocumentFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);  const [formData, setFormData] = useState({
    title: document?.title || "",
    author: document?.author || "",
    summary: document?.summary || "",
    illustrationImage: document?.illustrationImage || "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [illustrationPreview, setIllustrationPreview] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const illustrationInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (document?.illustrationImage) {
      setIllustrationPreview(imageAPI.getImageUrl(document.illustrationImage));
    }
  }, [document]);

  // Auto-fill author name based on current user
  useEffect(() => {
    const fetchCurrentUserName = async () => {
      try {
        const userStr = localStorage.getItem('auth_user');
        
        if (userStr) {
          const user = JSON.parse(userStr);
          setCurrentUser(user);
          
          // Only auto-fill if not editing and author field is empty
          if (!isEditing && !document?.author) {
            // Priority 1: Try to get biography name first
            try {
              // Check if user has biography attached
              if (user.biografi && user.biografi.namaLengkap) {
                setFormData(prev => ({ ...prev, author: user.biografi.namaLengkap }));
                return;
              }
              
              // If no attached biography, try to fetch by fullName
              if (user.fullName) {
                const biografi = await biografiAPI.getBiografiByName(user.fullName);
                
                if (biografi && biografi.namaLengkap) {
                  setFormData(prev => ({ ...prev, author: biografi.namaLengkap }));
                  return;
                }
              }
            } catch (error) {
              // Silent fallback to user name
            }
            
            // Priority 2: Fallback to user fullName
            if (user.fullName) {
              setFormData(prev => ({ ...prev, author: user.fullName }));
            } else if (user.username) {
              setFormData(prev => ({ ...prev, author: user.username }));
            }
          }
        }
      } catch (error) {
        // Silent error handling
      }
    };
    
    fetchCurrentUserName();
  }, [isEditing, document]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleIllustrationSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type for images
      if (!file.type.startsWith('image/')) {
        setError("Hanya file gambar yang diperbolehkan untuk ilustrasi.");
        return;
      }

      // Validate file size (max 5MB for images)
      if (file.size > 5 * 1024 * 1024) {
        setError("Ukuran gambar ilustrasi maksimal 5MB.");
        return;
      }

      try {
        // Show immediate preview
        const blobUrl = URL.createObjectURL(file);
        setIllustrationPreview(blobUrl);
        
        // Upload image to backend
        const uploadResult = await imageAPI.uploadImage(file);
        
        // Clean up blob URL
        URL.revokeObjectURL(blobUrl);
        
        // Set the uploaded filename in form data
        setFormData(prev => ({ ...prev, illustrationImage: uploadResult.filename }));
        
        // Set preview using the full URL from imageAPI.getImageUrl
        const fullImageUrl = imageAPI.getImageUrl(uploadResult.filename);
        setIllustrationPreview(fullImageUrl);
        
        setError(null);
      } catch (error) {
        console.error("Illustration upload error:", error);
        setError(`Gagal mengunggah gambar ilustrasi: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Revert to no preview on error
        setIllustrationPreview("");
      }
    }
  };

  const removeIllustration = () => {
    setIllustrationPreview("");
    setFormData(prev => ({ ...prev, illustrationImage: "" }));
    if (illustrationInputRef.current) {
      illustrationInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const typeValidation = validateFileType(file, FILE_UPLOAD_CONFIG.ALLOWED_DOCUMENT_TYPES);
      if (!typeValidation.valid) {
        setError("Jenis file tidak didukung. Silakan pilih file dengan format yang valid.");
        return;
      }

      // Validate file size
      const sizeValidation = validateFileSize(file, FILE_UPLOAD_CONFIG.MAX_DOCUMENT_SIZE);
      if (!sizeValidation.valid) {
        setError(sizeValidation.message);
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      // Validate file type
      const typeValidation = validateFileType(file, FILE_UPLOAD_CONFIG.ALLOWED_DOCUMENT_TYPES);
      if (!typeValidation.valid) {
        setError("Jenis file tidak didukung. Silakan pilih file dengan format yang valid.");
        return;
      }

      // Validate file size
      const sizeValidation = validateFileSize(file, FILE_UPLOAD_CONFIG.MAX_DOCUMENT_SIZE);
      if (!sizeValidation.valid) {
        setError(sizeValidation.message);
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError("Judul dokumen wajib diisi");
      return false;
    }
    if (!formData.author.trim()) {
      setError("Penulis dokumen wajib diisi");
      return false;
    }
    if (!isEditing && !selectedFile) {
      setError("File dokumen wajib dipilih");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formDataToSend = new FormData();
        const documentData = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        summary: formData.summary.trim(),
        illustrationImage: formData.illustrationImage || null
      };

      formDataToSend.append("document", new Blob([JSON.stringify(documentData)], {
        type: "application/json"
      }));

      if (selectedFile) {
        formDataToSend.append("file", selectedFile);
      }

      const url = isEditing        ? `${getApiUrl('/documents')}/${document?.id}${selectedFile ? '/with-file' : ''}`
        : `${getApiUrl('/documents')}`;

      const method = isEditing ? "PUT" : "POST";

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(url, {
        method,
        body: isEditing && !selectedFile 
          ? JSON.stringify(documentData)
          : formDataToSend,
        headers: isEditing && !selectedFile 
          ? { "Content-Type": "application/json" }
          : undefined,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Gagal menyimpan dokumen");
      }

      // Show success state briefly
      setTimeout(() => {
        onSuccess();
      }, 500);

    } catch (error) {
      setUploadProgress(0);
      console.error("Error saving document:", error);
      setError(error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan dokumen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && uploadProgress > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{uploadProgress === 100 ? "Menyelesaikan..." : "Mengunggah..."}</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Judul Dokumen *</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Masukkan judul dokumen"
            disabled={loading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="author">Penulis *</Label>
          <Input
            id="author"
            name="author"
            value={formData.author}
            onChange={handleInputChange}
            placeholder="Masukkan nama penulis"
            disabled={loading}
            required
          />
          {currentUser && (
            <p className="text-xs text-gray-500">
              Auto-filled from your profile. You can modify if needed.
            </p>
          )}
        </div>        <div className="space-y-2">
          <Label htmlFor="summary">Ringkasan</Label>
          <Textarea
            id="summary"
            name="summary"
            value={formData.summary}
            onChange={handleInputChange}
            placeholder="Masukkan ringkasan atau deskripsi dokumen"
            disabled={loading}
            rows={6}
            className="text-base"
          />
        </div>

        {/* Illustration Image Upload */}
        <div className="space-y-2">
          <Label>Gambar Ilustrasi (opsional)</Label>
          
          {!illustrationPreview ? (
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
              onClick={() => illustrationInputRef.current?.click()}
            >
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Klik untuk memilih gambar ilustrasi
              </p>
              <p className="text-xs text-muted-foreground">
                Maksimal 5MB • JPG, PNG, GIF, BMP
              </p>
            </div>
          ) : (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-16 h-16">
                      <Image
                        src={illustrationPreview}
                        alt="Illustration preview"
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Gambar Ilustrasi</p>
                      <p className="text-xs text-muted-foreground">
                        Gambar berhasil diunggah
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeIllustration}
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <input
            ref={illustrationInputRef}
            type="file"
            onChange={handleIllustrationSelect}
            accept="image/*"
            className="hidden"
            disabled={loading}
          />
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label>
            {isEditing ? "File Dokumen (opsional)" : "File Dokumen *"}
          </Label>
          
          {!selectedFile ? (
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Klik untuk memilih file atau drag & drop file ke sini
              </p>
              <p className="text-xs text-muted-foreground">
                Maksimal 100MB • PDF, Word, Excel, PowerPoint, Gambar, Text, ZIP, RAR
              </p>
            </div>
          ) : (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.jpg,.jpeg,.png,.gif,.bmp"
            className="hidden"
            disabled={loading}
          />
        </div>

        {isEditing && document && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">File Saat Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium text-sm">{document.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(document.fileSize)} • {document.fileType.toUpperCase()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t border-gray-200">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          disabled={loading}
          className="order-2 sm:order-1 w-full sm:w-auto"
        >
          Batal
        </Button>
        <Button 
          type="submit" 
          disabled={loading} 
          className="order-1 sm:order-2 flex-1 sm:flex-initial sm:min-w-[200px]"
        >
          {loading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span className="hidden xs:inline">{isEditing ? "Memperbarui..." : "Menyimpan..."}</span>
              <span className="xs:hidden">{isEditing ? "Update..." : "Save..."}</span>
            </>
          ) : (
            <>
              {uploadProgress === 100 ? (
                <CheckCircle className="mr-2 h-4 w-4" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              <span className="hidden xs:inline">{isEditing ? "Perbarui Dokumen" : "Simpan Dokumen"}</span>
              <span className="xs:hidden">{isEditing ? "Update" : "Save"}</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
