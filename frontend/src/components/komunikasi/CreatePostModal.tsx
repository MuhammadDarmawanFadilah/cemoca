"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ImageIcon, 
  Video, 
  File, 
  X, 
  Upload, 
  Plus,
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreatePostRequest, MediaUpload, PostKomunikasi } from "@/types/komunikasi";
import { komunikasiApi } from "@/services/komunikasiApi";
import { useAuth } from "@/contexts/AuthContext";
import { imageAPI } from "@/lib/api";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onPostCreated: (post: PostKomunikasi) => void;
  currentUserId: number;
  currentUserBiografi?: any;
}

interface MediaPreviewItem extends MediaUpload {
  id: string;
  file?: File;
  preview?: string;
}

export default function CreatePostModal({ open, onClose, onPostCreated, currentUserId, currentUserBiografi }: CreatePostModalProps) {
  const [content, setContent] = useState("");
  const [mediaItems, setMediaItems] = useState<MediaPreviewItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const userBiografi = currentUserBiografi || user?.biografi;

  const maxMediaItems = 10;
  const maxContentLength = 5000;

  const resetForm = () => {
    setContent("");
    setMediaItems([]);
    setError("");
  };

  const handleClose = () => {
    if (!uploading) {
      resetForm();
      onClose();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (mediaItems.length + files.length > maxMediaItems) {
      setError(`Maksimal ${maxMediaItems} file media yang dapat diunggah`);
      return;
    }

    const newMediaItems: MediaPreviewItem[] = files.map((file, index) => {
      const mediaType = getMediaType(file.type);
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      
      return {
        id: `${Date.now()}-${index}`,
        file,
        preview,
        mediaUrl: "", // Will be set after upload
        mediaType,
        mediaOrder: mediaItems.length + index,
        originalFileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      };
    });

    setMediaItems(prev => [...prev, ...newMediaItems]);
    setError("");
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getMediaType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType.startsWith('video/')) return 'VIDEO';
    return 'DOCUMENT';
  };

  const removeMediaItem = (id: string) => {
    setMediaItems(prev => {
      const updated = prev.filter(item => item.id !== id);
      // Reorder media items
      return updated.map((item, index) => ({
        ...item,
        mediaOrder: index
      }));
    });
  };

  const moveMediaItem = (fromIndex: number, toIndex: number) => {
    setMediaItems(prev => {
      const updated = [...prev];
      const [removed] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, removed);
      
      // Update media order
      return updated.map((item, index) => ({
        ...item,
        mediaOrder: index
      }));
    });
  };
  const uploadFile = async (file: File): Promise<string> => {
    try {
      const result = await komunikasiApi.uploadMedia(file);
      return result.url;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw new Error("Gagal mengupload file");
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaItems.length === 0) {
      setError("Post harus memiliki konten atau media");
      return;
    }

    if (content.length > maxContentLength) {
      setError(`Konten maksimal ${maxContentLength} karakter`);
      return;
    }

    try {
      setUploading(true);
      setError("");

      // Upload media files
      const uploadedMedia: MediaUpload[] = [];
      
      for (const mediaItem of mediaItems) {
        if (mediaItem.file) {
          const mediaUrl = await uploadFile(mediaItem.file);
          uploadedMedia.push({
            mediaUrl,
            mediaType: mediaItem.mediaType,
            mediaOrder: mediaItem.mediaOrder,
            caption: mediaItem.caption,
            originalFileName: mediaItem.originalFileName,
            fileSize: mediaItem.fileSize,
            mimeType: mediaItem.mimeType,
            thumbnailUrl: mediaItem.thumbnailUrl,
          });
        }
      }

      // Create post
      const request: CreatePostRequest = {
        konten: content.trim(),
        media: uploadedMedia,
      };

      const newPost = await komunikasiApi.createPost(request, currentUserId);
      onPostCreated(newPost);
      handleClose();
      
    } catch (error) {
      console.error("Error creating post:", error);
      setError("Gagal membuat post. Silakan coba lagi.");
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Post Baru</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">          {/* Author Info */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={userBiografi?.foto ? imageAPI.getImageUrl(userBiografi.foto) : undefined} 
                alt={userBiografi?.namaLengkap || "User"} 
              />
              <AvatarFallback>
                {userBiografi?.namaLengkap ? 
                  userBiografi.namaLengkap.charAt(0).toUpperCase() : 
                  "👤"
                }
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{userBiografi?.namaLengkap || "User"}</p>
              <p className="text-xs text-gray-500">{userBiografi?.jurusan || ""} {userBiografi?.alumniTahun || ""}</p>
            </div>
          </div>

          {/* Content Input */}
          <div className="space-y-2">
            <Textarea
              placeholder="Apa yang ingin Anda bagikan?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none border-0 p-0 text-lg placeholder:text-gray-400 focus-visible:ring-0"
              disabled={uploading}
            />
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{content.length}/{maxContentLength}</span>
              {content.length > maxContentLength && (
                <span className="text-red-500">Konten terlalu panjang</span>
              )}
            </div>
          </div>

          {/* Media Preview */}
          {mediaItems.length > 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {mediaItems.map((item, index) => (
                  <div key={item.id} className="relative group">
                    <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
                      {item.mediaType === 'IMAGE' && item.preview ? (
                        <img
                          src={item.preview}
                          alt={item.originalFileName}
                          className="w-full h-32 object-cover"
                        />
                      ) : item.mediaType === 'VIDEO' ? (
                        <div className="w-full h-32 flex items-center justify-center">
                          <Video className="h-8 w-8 text-gray-400" />
                          <p className="ml-2 text-sm text-gray-600 truncate">
                            {item.originalFileName}
                          </p>
                        </div>
                      ) : (
                        <div className="w-full h-32 flex items-center justify-center">
                          <File className="h-8 w-8 text-gray-400" />
                          <p className="ml-2 text-sm text-gray-600 truncate">
                            {item.originalFileName}
                          </p>
                        </div>
                      )}
                      
                      {/* Remove button */}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeMediaItem(item.id)}
                        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={uploading}
                      >
                        <X className="h-3 w-3" />
                      </Button>

                      {/* Media order */}
                      <Badge 
                        variant="secondary" 
                        className="absolute bottom-2 left-2 h-5 text-xs"
                      >
                        {index + 1}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-gray-500">
                {mediaItems.length}/{maxMediaItems} media • Drag untuk mengurutkan
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Media Upload Section */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Tambah ke post Anda</p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={triggerFileInput}
                    disabled={uploading || mediaItems.length >= maxMediaItems}
                    className="flex items-center space-x-1"
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span>Foto/Video</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-xs text-gray-500">
              {!content.trim() && mediaItems.length === 0 
                ? "Tambahkan konten atau media untuk membuat post"
                : "Siap untuk dipublikasikan"
              }
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={uploading}
              >
                Batal
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={(!content.trim() && mediaItems.length === 0) || uploading || content.length > maxContentLength}
              >
                {uploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Mengunggah...
                  </>
                ) : (
                  "Publikasikan"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
